import { setCORSHeaders, handleOptions } from './utils.js';

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
    // No Vercel, o body pode vir parseado ou como string
    let leadData;
    
    if (typeof req.body === 'string') {
      // Se for string, fazer parse
      const bodySize = Buffer.byteLength(req.body, 'utf8');
      if (bodySize > MAX_BODY_SIZE) {
        res.status(413).json({
          success: false,
          error: 'Payload muito grande'
        });
        return;
      }
      leadData = JSON.parse(req.body);
    } else if (req.body && typeof req.body === 'object') {
      // Se já estiver parseado
      const bodySize = JSON.stringify(req.body).length;
      if (bodySize > MAX_BODY_SIZE) {
        res.status(413).json({
          success: false,
          error: 'Payload muito grande'
        });
        return;
      }
      leadData = req.body;
    } else {
      // Tentar ler do stream (fallback)
      const chunks = [];
      let bodySize = 0;
      
      for await (const chunk of req) {
        bodySize += chunk.length;
        if (bodySize > MAX_BODY_SIZE) {
          res.status(413).json({
            success: false,
            error: 'Payload muito grande'
          });
          return;
        }
        chunks.push(chunk);
      }
      
      const body = Buffer.concat(chunks).toString();
      leadData = JSON.parse(body);
    }

    // Validar estrutura básica
    if (!leadData || typeof leadData !== 'object') {
      res.status(400).json({
        success: false,
        error: 'Dados inválidos'
      });
      return;
    }

    // Validar campos obrigatórios
    if (!leadData.name || !leadData.email || !leadData.whats || !leadData.type) {
      res.status(400).json({
        success: false,
        error: 'Campos obrigatórios faltando'
      });
      return;
    }

    // Validar tamanho dos campos
    if (leadData.name.length > 100 || leadData.email.length > 255 ||
        leadData.whats.length > 20 || leadData.type.length > 50) {
      res.status(400).json({
        success: false,
        error: 'Campos muito longos'
      });
      return;
    }

    // Aqui você pode salvar no banco de dados, enviar email, etc.
    // Por enquanto, apenas retornamos sucesso

    setCORSHeaders(req, res);
    res.status(200).json({
      success: true,
      message: 'Lead recebido com sucesso',
      data: {
        id: Date.now(),
        ...leadData
      }
    });
  } catch (error) {
    setCORSHeaders(req, res);
    res.status(400).json({
      success: false,
      error: 'Erro ao processar lead',
      message: error.message
    });
  }
}
