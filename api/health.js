import { setCORSHeaders, handleOptions } from './utils.js';

/**
 * GET /api/health
 * Endpoint para verificar saúde da aplicação
 */
export default async function handler(req, res) {
  // Handle preflight
  if (req.method === 'OPTIONS') {
    return handleOptions(req, res);
  }

  // Apenas GET
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  setCORSHeaders(req, res);
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '2.1.3',
    apis: {
      validator: "✅ Validação local descentralizada (sem APIs externas)",
      lead: "✅ Disponível",
      cep: "✅ Validação local (descentralizado)"
    },
    features: {
      backgroundSync: "✅ Ativo",
      offlineQueue: "✅ Ativo",
      formValidation: "✅ Ativo"
    }
  });
}
