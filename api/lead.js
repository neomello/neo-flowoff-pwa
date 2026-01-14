import {
  setCORSHeaders,
  handleOptions,
  parseJsonBody,
  enforceRateLimit,
  sanitizeText,
  isEmail,
  setSecurityHeaders
} from './utils.js';
import { query } from './db.js';

const MAX_BODY_SIZE = 10000; // 10KB máximo

/**
 * POST /api/lead
 * Endpoint para receber leads
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
    if (!enforceRateLimit(req, res, { limit: 30 })) return;

    const leadData = await parseJsonBody(req, res, MAX_BODY_SIZE);
    if (!leadData) return;

    // Validar estrutura básica
    if (!leadData || typeof leadData !== 'object') {
      res.status(400).json({
        success: false,
        error: 'Dados inválidos'
      });
      return;
    }

    // Validar campos obrigatórios
    const name = sanitizeText(leadData.name, 100);
    const email = sanitizeText(leadData.email, 255);
    const whats = sanitizeText(leadData.whats, 20);
    const type = sanitizeText(leadData.type, 50);

    if (!name || !email || !whats || !type) {
      res.status(400).json({
        success: false,
        error: 'Campos obrigatórios faltando'
      });
      return;
    }

    if (!isEmail(email)) {
      res.status(400).json({
        success: false,
        error: 'Email inválido'
      });
      return;
    }

    if (!/^\+?[0-9]{8,20}$/.test(whats)) {
      res.status(400).json({
        success: false,
        error: 'Whats inválido'
      });
      return;
    }

    if (!/^[a-zA-Z0-9 _.-]{1,50}$/.test(type)) {
      res.status(400).json({
        success: false,
        error: 'Tipo inválido'
      });
      return;
    }

    // Persiste lead no Neon
    const result = await query(
      `
        INSERT INTO leads (name, email, whats, type)
        VALUES ($1, $2, $3, $4)
        RETURNING id, created_at
      `,
      [name, email, whats, type]
    );

    const row = result?.[0];

    res.status(200).json({
      success: true,
      message: 'Lead recebido com sucesso',
      data: {
        id: row?.id,
        created_at: row?.created_at,
        name,
        email,
        whats,
        type
      }
    });
  } catch (error) {
    console.error('Erro ao processar lead:', error);
    res.status(400).json({
      success: false,
      error: 'Erro ao processar lead',
      message: 'Falha ao processar a requisição'
    });
  }
}
