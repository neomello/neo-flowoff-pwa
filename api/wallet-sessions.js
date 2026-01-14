import { setCORSHeaders, handleOptions } from './utils.js';
import { query } from './db.js';

const MAX_BODY_SIZE = 8000;

async function parseJsonBody(req, res) {
  if (req.body && typeof req.body === 'object') {
    return req.body;
  }

  const chunks = [];
  let size = 0;

  for await (const chunk of req) {
    size += chunk.length;
    if (size > MAX_BODY_SIZE) {
      res.status(413).json({ error: 'Payload muito grande' });
      return null;
    }
    chunks.push(chunk);
  }

  if (!chunks.length) return {};

  try {
    return JSON.parse(Buffer.concat(chunks).toString());
  } catch (err) {
    res.status(400).json({ error: 'JSON inválido' });
    return null;
  }
}

export default async function handler(req, res) {
  // Preflight
  if (req.method === 'OPTIONS') {
    return handleOptions(req, res);
  }

  setCORSHeaders(req, res);

  if (req.method === 'GET') {
    const wallet = req.query?.wallet || req.query?.wallet_address || null;
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

  const body = await parseJsonBody(req, res);
  if (!body) return;

  const walletAddress = body.wallet_address || body.wallet;
  const provider = body.provider;
  const userAgent = body.user_agent || req.headers['user-agent'] || null;
  const ip =
    body.ip ||
    req.headers['x-forwarded-for']?.toString().split(',')[0].trim() ||
    req.socket?.remoteAddress ||
    null;

  if (!walletAddress || typeof walletAddress !== 'string') {
    res.status(400).json({ error: 'wallet_address é obrigatório' });
    return;
  }

  if (!provider || typeof provider !== 'string') {
    res.status(400).json({ error: 'provider é obrigatório' });
    return;
  }

  if (walletAddress.length > 128 || provider.length > 64) {
    res.status(400).json({ error: 'Campos excederam o tamanho máximo' });
    return;
  }

  // Upsert do usuário
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
    [walletAddress, provider, userAgent, ip]
  );

  res.status(200).json({ success: true, data: rows?.[0] });
}
