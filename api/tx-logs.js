import { setCORSHeaders, handleOptions } from './utils.js';
import { query } from './db.js';

const MAX_BODY_SIZE = 10000;

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
  if (req.method === 'OPTIONS') {
    return handleOptions(req, res);
  }

  setCORSHeaders(req, res);

  if (req.method === 'GET') {
    const wallet = req.query?.wallet || req.query?.wallet_address || null;
    const limit = Math.min(parseInt(req.query?.limit || '20', 10) || 20, 100);

    const rows = await query(
      `
        SELECT id, tx_hash, wallet_address, status, chain_id, value, token_address, metadata, created_at
        FROM tx_logs
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

  const { tx_hash, wallet_address, status, chain_id, value, token_address, metadata } = body;

  if (!tx_hash || !wallet_address || !status || !chain_id) {
    res.status(400).json({ error: 'tx_hash, wallet_address, status e chain_id são obrigatórios' });
    return;
  }

  if (
    tx_hash.length > 200 ||
    wallet_address.length > 128 ||
    status.length > 64 ||
    token_address?.length > 200
  ) {
    res.status(400).json({ error: 'Campos excederam o tamanho máximo' });
    return;
  }

  // Upsert usuário
  await query(
    `INSERT INTO users (wallet_address) VALUES ($1) ON CONFLICT (wallet_address) DO NOTHING`,
    [wallet_address]
  );

  const rows = await query(
    `
      INSERT INTO tx_logs (tx_hash, wallet_address, status, chain_id, value, token_address, metadata)
      VALUES ($1, $2, $3, $4, COALESCE($5, 0), $6, $7)
      ON CONFLICT (tx_hash) DO UPDATE
        SET status = EXCLUDED.status,
            metadata = COALESCE(EXCLUDED.metadata, tx_logs.metadata)
      RETURNING id, tx_hash, wallet_address, status, chain_id, value, token_address, metadata, created_at
    `,
    [tx_hash, wallet_address, status, chain_id, value ?? 0, token_address || null, metadata || null]
  );

  res.status(200).json({ success: true, data: rows?.[0] });
}
