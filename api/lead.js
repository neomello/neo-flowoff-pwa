import { Resend } from 'resend';
import {
  setCORSHeaders,
  handleOptions,
  parseJsonBody,
  enforceRateLimit,
  sanitizeText,
  isEmail,
  setSecurityHeaders,
  detectClientType,
} from './utils.js';
import { query } from './db.js';

const MAX_BODY_SIZE = 10000; // 10KB máximo

/**
 * POST /api/lead
 * Endpoint para receber leads e notificar via Resend
 */
export default async function handler(req, res) {
  // Handle preflight
  if (req.method === 'OPTIONS') {
    return handleOptions(req, res);
  }

  // Apenas POST
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    setCORSHeaders(req, res);
    setSecurityHeaders(res);
    
    // Detectar tipo de cliente
    const clientType = detectClientType(req);
    
    // Rate limit adaptado por cliente (desktop pode ter limite maior)
    const rateLimit = clientType === 'desktop' ? 60 : 30;
    if (!enforceRateLimit(req, res, { limit: rateLimit })) return;

    const leadData = await parseJsonBody(req, res, MAX_BODY_SIZE);
    if (!leadData) return;

    // Validar estrutura básica
    if (!leadData || typeof leadData !== 'object') {
      res.status(400).json({
        success: false,
        error: 'Dados inválidos',
      });
      return;
    }

    // Validar campos obrigatórios
    const name = sanitizeText(leadData.name, 100);
    const email = sanitizeText(leadData.email, 255);
    const whats = sanitizeText(leadData.whats, 20);
    const type = sanitizeText(leadData.type, 50);
    const cep = sanitizeText(leadData.cep || '', 20) || 'N/A';
    const message = sanitizeText(leadData.message || '', 1000) || 'Sem mensagem';

    if (!name || !email || !whats || !type) {
      res.status(400).json({
        success: false,
        error: 'Campos obrigatórios faltando',
      });
      return;
    }

    if (!isEmail(email)) {
      res.status(400).json({
        success: false,
        error: 'Email inválido',
      });
      return;
    }

    if (!/^\+?[0-9]{8,20}$/.test(whats)) {
      res.status(400).json({
        success: false,
        error: 'Whats inválido',
      });
      return;
    }

    if (!/^[a-zA-Z0-9 _.-]{1,50}$/.test(type)) {
      res.status(400).json({
        success: false,
        error: 'Tipo inválido',
      });
      return;
    }

    // 🕵️‍♀️ Hunter.io Email Verification
    // Só verifica se houver chave configurada
    if (process.env.HUNTER_API_KEY) {
      try {
        const verifyUrl = `https://api.hunter.io/v2/email-verifier?email=${encodeURIComponent(email)}&api_key=${process.env.HUNTER_API_KEY}`;
        const verifyRes = await fetch(verifyUrl);

        if (verifyRes.ok) {
          const verifyData = await verifyRes.json();
          const { result, status } = verifyData.data || {};

          // Block INVALID or DISPOSABLE emails
          if (result === 'undeliverable' || status === 'disposable') {
            console.warn(`🛑 Email bloqueado pelo Hunter.io: ${email} (Status: ${status})`);
            res.status(400).json({
              success: false,
              error: 'Email inválido ou temporário não permitido.',
            });
            return;
          }
          console.log(`✅ Hunter.io Check: ${email} is ${status} (${result})`);
        }
      } catch (hunterError) {
        console.error('⚠️ Erro ao verificar email no Hunter.io (prosseguindo):', hunterError);
        // Fail open: Se a API cair, deixamos passar para não perder o lead
      }
    }

    // Persiste lead no Neon (se DB estiver configurado)
    let leadId = null;
    let createdAt = new Date().toISOString();

    try {
      const result = await query(
        `
          INSERT INTO leads (name, email, whats, type)
          VALUES ($1, $2, $3, $4)
          RETURNING id, created_at
        `,
        [name, email, whats, type]
      );
      const row = result?.[0];
      if (row) {
        leadId = row.id;
        createdAt = row.created_at;
      }
    } catch (dbError) {
      console.warn('⚠️ Falha ao salvar no banco de dados (ignorando):', dbError);
      // Não falhar requisição se DB cair, prioridade é notificação
    }

    // 🔥 Integração Resend (Envio de Email)
    if (process.env.RESEND_API_KEY) {
      try {
        const resend = new Resend(process.env.RESEND_API_KEY);
        const cwd = process.cwd();
        const fs = await import('fs');
        const path = await import('path');

        // Helper para preencher templates com sanitização
        const fill = (tpl, vars) => {
          // Sanitizar valores antes de inserir no template
          const sanitizeValue = (val) => {
            if (val == null) return '';
            const str = String(val);
            // Escapar HTML para prevenir XSS em templates
            return str
              .replace(/&/g, '&amp;')
              .replace(/</g, '&lt;')
              .replace(/>/g, '&gt;')
              .replace(/"/g, '&quot;')
              .replace(/'/g, '&#x27;');
          };
          
          return tpl.replace(/{{\s*([\w]+)\s*}}/g, (_, k) => {
            const value = vars[k];
            // URLs não devem ser escapadas (já são seguras se construídas corretamente)
            if (k === 'whatsapp_link' && typeof value === 'string') {
              return value; // URL já foi construída com encodeURIComponent
            }
            return sanitizeValue(value);
          });
        };

        // Carregar templates
        const internalTpl = fs.readFileSync(path.join(cwd, 'emails', 'lead-internal.html'), 'utf8');
        const confirmationTpl = fs.readFileSync(path.join(cwd, 'emails', 'lead-confirmation.html'), 'utf8');

        // Gerar link do WhatsApp para o email
        const whatsappNumber = "55" + String(whats || "").replace(/\D/g, "");
        const whatsapp_link =
          `https://wa.me/${whatsappNumber}?text=` + encodeURIComponent(message || "");

        const vars = {
          type: String(type || "Lead"),
          name: String(name || ""),
          email: String(email || ""),
          whats: String(whats || ""),
          cep: String(cep || ""),
          message: String(message || ""),
          timestamp: createdAt,
          whatsapp_link,
          source: "web", // Pode ser enriquecido se o front enviar
          page: "/",
          utm: ""
        };

        // Email Interno (Notificação)
        await resend.emails.send({
          from: 'NEØ Leads <leads@neo.flowoff.xyz>',
          to: ['neoprotocol.eth@ethermail.io'],
          subject: `🚀 Novo Lead: ${name} (${type})`,
          html: fill(internalTpl, vars),
          tags: [
            { name: 'lead_type', value: type },
            { name: 'category', value: 'notification' }
          ]
        });

        // Email de Confirmação para o Lead (configurável via ENV)
        const sendConfirmation = process.env.CONFIRMATION_EMAIL_ENABLED !== 'false';

        if (sendConfirmation) {
          await resend.emails.send({
            from: 'NEØ FlowOFF <contato@neo.flowoff.xyz>',
            to: [email],
            subject: `Recebemos sua solicitação: ${type}`,
            html: fill(confirmationTpl, vars),
            tags: [
              { name: 'lead_type', value: type },
              { name: 'category', value: 'confirmation' }
            ]
          });
        } else {
          console.log(`ℹ️ Auto-confirmação desativada via ENV para: ${email}`);
        }

      } catch (emailError) {
        console.error('❌ Erro ao enviar email via Resend:', emailError);
        // Não falhar a request, apenas logar
      }
    } else {
      console.warn('⚠️ RESEND_API_KEY não configurada. Email não enviado.');
    }

    console.log(JSON.stringify({
      event: 'lead_success',
      leadId,
      name,
      email,
      type,
      timestamp: createdAt
    }));

    res.status(200).json({
      success: true,
      message: 'Lead recebido com sucesso',
      data: {
        id: leadId,
        created_at: createdAt,
        name,
        email,
        whats,
        type,
      },
    });
  } catch (error) {
    console.error('Erro ao processar lead:', error);
    res.status(400).json({
      success: false,
      error: 'Erro ao processar lead',
      message: 'Falha ao processar a requisição',
    });
  }
}
