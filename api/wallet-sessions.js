import {
  setCORSHeaders,
  handleOptions,
  parseJsonBody,
  enforceRateLimit,
  requireApiToken,
  sanitizeText,
  isHexString,
  setSecurityHeaders,
} from './utils.js';
import { query } from './db.js';

const MAX_BODY_SIZE = 8000;

export default async function handler(req, res) {
  // Preflight
  if (req.method === 'OPTIONS') {
    return handleOptions(req, res);
  }

  setCORSHeaders(req, res);
  setSecurityHeaders(res);

  try {
    if (req.method === 'GET') {
      if (!enforceRateLimit(req, res, { limit: 120 })) return;
      if (!requireApiToken(req, res)) return;

      const wallet =
        sanitizeText(
          req.query?.wallet || req.query?.wallet_address || '',
          128
        ) || null;
      const limit = Math.min(parseInt(req.query?.limit || '20', 10) || 20, 100);

      const rows = await query(
        `
          SELECT id, wallet_address, provider, user_agent, ip, created_at
          FROM wallet_sessions
          WHERE ($1::text IS NULL OR wallet_address = $1::text)
          ORDER BY created_at DESC
          LIMIT $2
        `,
        [wallet, limit]
      );

      res.status(200).json({ data: rows });
      return;
    }

    if (req.method !== 'POST') {
      res.status(405).json({ error: 'Method not allowed' });
      return;
    }

    if (!enforceRateLimit(req, res, { limit: 60 })) return;
    if (!requireApiToken(req, res)) return;

    const body = await parseJsonBody(req, res, MAX_BODY_SIZE);
    if (!body) return;

    const walletAddress = sanitizeText(body.wallet_address || body.wallet, 128);
    const provider = sanitizeText(body.provider, 64);
    const userAgent =
      sanitizeText(body.user_agent || req.headers['user-agent'] || '', 256) ||
      null;
    const ipRaw =
      sanitizeText(body.ip, 64) ||
      req.headers['x-forwarded-for']?.toString().split(',')[0].trim() ||
      req.socket?.remoteAddress ||
      null;

    if (!walletAddress) {
      res.status(400).json({ error: 'wallet_address é obrigatório' });
      return;
    }

    if (!provider) {
      res.status(400).json({ error: 'provider é obrigatório' });
      return;
    }

    if (!isHexString(walletAddress, 20, 64)) {
      res.status(400).json({ error: 'wallet_address inválido' });
      return;
    }

    await query(
      `INSERT INTO users (wallet_address) VALUES ($1) ON CONFLICT (wallet_address) DO NOTHING`,
      [walletAddress]
    );

    const rows = await query(
      `
        INSERT INTO wallet_sessions (wallet_address, provider, user_agent, ip)
        VALUES ($1, $2, $3, $4)
        RETURNING id, wallet_address, provider, user_agent, ip, created_at
      `,
      [walletAddress, provider, userAgent, ipRaw]
    );

    res.status(200).json({ success: true, data: rows?.[0] });
  } catch (error) {
    console.error('Erro ao processar wallet-sessions:', error);
    res.status(500).json({ error: 'Erro ao processar request' });
  }
}
