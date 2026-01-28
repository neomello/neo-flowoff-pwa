import {
  setCORSHeaders,
  handleOptions,
  parseJsonBody,
  enforceRateLimit,
  sanitizeText,
  isValidEthereumAddress,
  setSecurityHeaders,
} from './utils.js';
import { query } from './db.js';
import { randomBytes } from 'crypto';

const MAX_BODY_SIZE = 3000;

/**
 * API: Sistema de Referral (Consolidado)
 * POST /api/referral?action=create — Criar código de referral
 * POST /api/referral?action=use — Usar código de referral
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

  const action = req.query.action || 'create';

  if (action === 'create') {
    return handleCreate(req, res);
  }

  if (action === 'use') {
    return handleUse(req, res);
  }

  return res.status(400).json({
    error: 'Invalid action',
    allowed: ['create', 'use'],
  });
}

/**
 * POST: Criar Código de Referral
 */
async function handleCreate(req, res) {
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

/**
 * POST: Usar Código de Referral
 */
async function handleUse(req, res) {
  try {
    if (!enforceRateLimit(req, res, { limit: 5, windowMs: 60 * 60 * 1000 })) {
      return;
    }

    const body = await parseJsonBody(req, res, MAX_BODY_SIZE);
    if (!body) return;

    const referralCode = sanitizeText(body.referral_code, 64);
    const refereeWallet = body.referee_wallet;

    if (!referralCode) {
      return res.status(400).json({ error: 'Código de referral é obrigatório' });
    }

    if (!refereeWallet || !isValidEthereumAddress(refereeWallet)) {
      return res.status(400).json({ error: 'Wallet address inválido' });
    }

    // Buscar referrer
    const referrerQuery = await query(
      `SELECT r.referrer_user_id, r.referrer_wallet 
       FROM referrals r 
       WHERE r.referral_code = $1 
       LIMIT 1`,
      [referralCode]
    );

    if (referrerQuery.length === 0) {
      return res.status(404).json({ error: 'Código de referral não encontrado' });
    }

    const referrer = referrerQuery[0];

    // Verificar se referee já foi referido
    const existingRef = await query(
      'SELECT id FROM referrals WHERE referee_wallet = $1',
      [refereeWallet.toLowerCase()]
    );

    if (existingRef.length > 0) {
      return res.status(400).json({ error: 'Você já foi referido anteriormente' });
    }

    // Buscar referee user_id se existir
    const refereeUserQuery = await query(
      'SELECT id FROM users WHERE id IN (SELECT user_id FROM user_wallets WHERE wallet_address = $1)',
      [refereeWallet.toLowerCase()]
    );
    const refereeUserId =
      refereeUserQuery.length > 0 ? refereeUserQuery[0].id : null;

    // Criar registro de referral
    await query(
      `INSERT INTO referrals (referrer_user_id, referrer_wallet, referee_wallet, referee_user_id, referral_code, points_awarded) 
       VALUES ($1, $2, $3, $4, $5, 50)`,
      [
        referrer.referrer_user_id,
        referrer.referrer_wallet,
        refereeWallet.toLowerCase(),
        refereeUserId,
        referralCode,
      ]
    );

    // Dar pontos ao referrer
    await query(
      `INSERT INTO user_points (user_id, wallet_address, action_type, points, metadata) 
       VALUES ($1, $2, 'referral', 50, $3)`,
      [
        referrer.referrer_user_id,
        referrer.referrer_wallet,
        JSON.stringify({ referee: refereeWallet.toLowerCase() }),
      ]
    );

    res.json({
      success: true,
      referrer_wallet: referrer.referrer_wallet,
      points_earned: 50,
    });
  } catch (error) {
    console.error('❌ Erro ao usar código de referral:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
}
