import {
  setCORSHeaders,
  handleOptions,
  parseJsonBody,
  enforceRateLimit,
  isValidEthereumAddress,
  setSecurityHeaders,
} from '../utils.js';
import { query } from '../db.js';
import { randomBytes } from 'crypto';

const MAX_BODY_SIZE = 3000;

/**
 * API: Criar Código de Referral
 * POST /api/referral/create
 */
export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    return handleOptions(req, res);
  }

  setCORSHeaders(req, res);
  setSecurityHeaders(res);

  if (req.method !== 'POST') {
    return res.status(405).json({ 
      error: 'Method not allowed',
      allowed: ['POST'],
    });
  }

  try {
    if (!enforceRateLimit(req, res, { limit: 10, windowMs: 60 * 60 * 1000 })) {
      return;
    }

    const body = await parseJsonBody(req, res, MAX_BODY_SIZE);
    if (!body) return;

    const walletAddress = body.wallet_address;

    if (!walletAddress || !isValidEthereumAddress(walletAddress)) {
      return res.status(400).json({ error: 'Wallet address inválido' });
    }

    // Buscar user_id
    const userQuery = await query(
      'SELECT id FROM users WHERE id IN (SELECT user_id FROM user_wallets WHERE wallet_address = $1)',
      [walletAddress.toLowerCase()]
    );

    if (userQuery.length === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    const userId = userQuery[0].id;

    // Gerar código único
    const code = `NEOFLW${userId}${randomBytes(3).toString('hex').toUpperCase()}`;

    // Verificar se já existe código para este usuário
    const existing = await query(
      'SELECT referral_code FROM referrals WHERE referrer_user_id = $1 LIMIT 1',
      [userId]
    );

    if (existing.length > 0) {
      return res.json({
        referral_code: existing[0].referral_code,
        share_url: `https://neoflowoff.xyz?ref=${existing[0].referral_code}`,
      });
    }

    res.json({
      referral_code: code,
      share_url: `https://neoflowoff.xyz?ref=${code}`,
    });

  } catch (error) {
    console.error('❌ Erro ao criar código de referral:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
}
