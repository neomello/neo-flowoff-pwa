import { setCORSHeaders, handleOptions } from './utils.js';

/**
 * GET /api/config
 * Endpoint para retornar variáveis públicas de configuração
 * Retorna apenas variáveis que podem ser expostas no frontend
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

  // Retorna apenas variáveis públicas que podem ser expostas no frontend
  // WEB3AUTH_CLIENT_ID é público (pode ser exposto, é o Client ID da aplicação)
  res.status(200).json({
    WEB3AUTH_CLIENT_ID: process.env.WEB3AUTH_CLIENT_ID || process.env.NEXT_PUBLIC_WEB3AUTH_CLIENT_ID || null,
    DRPC_RPC_KEY: process.env.DRPC_RPC_KEY || process.env.NEXT_PUBLIC_DRPC_RPC_KEY || null
  });
}
