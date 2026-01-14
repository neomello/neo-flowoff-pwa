import {
  setCORSHeaders,
  handleOptions,
  parseJsonBody,
  enforceRateLimit,
  requireApiToken,
  sanitizeText,
  isHexString,
  setSecurityHeaders
} from './utils.js';
import { query } from './db.js';

const MAX_BODY_SIZE = 10000;

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    return handleOptions(req, res);
  }

  setCORSHeaders(req, res);
  setSecurityHeaders(res);

  try {
    if (req.method === 'GET') {
      if (!enforceRateLimit(req, res, { limit: 120 })) return;
      if (!requireApiToken(req, res)) return;

      const wallet = sanitizeText(
        req.query?.wallet || req.query?.wallet_address || '',
        128
      ) || null;
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

    if (!enforceRateLimit(req, res, { limit: 60 })) return;
    if (!requireApiToken(req, res)) return;

    const body = await parseJsonBody(req, res, MAX_BODY_SIZE);
    if (!body) return;

    const txHashRaw = sanitizeText(body.tx_hash, 128);
    const walletRaw = sanitizeText(body.wallet_address, 128);
    const statusRaw = sanitizeText(body.status, 64);
    const tokenRaw = sanitizeText(body.token_address, 128);
    const chainId = Number(body.chain_id);
    const valueNumber =
      body.value === undefined || body.value === null || body.value === ''
        ? 0
        : Number(body.value);

    if (!txHashRaw || !walletRaw || !statusRaw || !Number.isInteger(chainId)) {
      res.status(400).json({
        error: 'tx_hash, wallet_address, status e chain_id são obrigatórios'
      });
      return;
    }

    if (!isHexString(txHashRaw, 32, 128)) {
      res.status(400).json({ error: 'tx_hash inválido' });
      return;
    }

    if (!isHexString(walletRaw, 20, 64)) {
      res.status(400).json({ error: 'wallet_address inválido' });
      return;
    }

    if (tokenRaw && !isHexString(tokenRaw, 20, 64)) {
      res.status(400).json({ error: 'token_address inválido' });
      return;
    }

    if (!Number.isFinite(valueNumber) || valueNumber < 0) {
      res.status(400).json({ error: 'value inválido' });
      return;
    }

    let metadata = null;
    if (body.metadata !== undefined && body.metadata !== null) {
      if (typeof body.metadata === 'string') {
        if (body.metadata.length > 4000) {
          res.status(400).json({ error: 'metadata muito grande' });
          return;
        }
        try {
          metadata = JSON.parse(body.metadata);
        } catch {
          res.status(400).json({ error: 'metadata inválido' });
          return;
        }
      } else if (typeof body.metadata === 'object') {
        const serialized = JSON.stringify(body.metadata);
        if (serialized.length > 4000) {
          res.status(400).json({ error: 'metadata muito grande' });
          return;
        }
        metadata = body.metadata;
      } else {
        res.status(400).json({ error: 'metadata inválido' });
        return;
      }
    }

    await query(
      `INSERT INTO users (wallet_address) VALUES ($1) ON CONFLICT (wallet_address) DO NOTHING`,
      [walletRaw]
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
      [
        txHashRaw,
        walletRaw,
        statusRaw,
        chainId,
        valueNumber,
        tokenRaw || null,
        metadata
      ]
    );

    res.status(200).json({ success: true, data: rows?.[0] });
  } catch (error) {
    console.error('Erro ao processar tx-logs:', error);
    res.status(500).json({ error: 'Erro ao processar request' });
  }
}
