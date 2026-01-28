import {
  setCORSHeaders,
  handleOptions,
  parseJsonBody,
  enforceRateLimit,
  sanitizeText,
  isValidEthereumAddress,
  setSecurityHeaders,
} from '../utils.js';
import { query } from '../db.js';

const MAX_BODY_SIZE = 3000;

/**
 * API: Usar Código de Referral
 * POST /api/referral/use
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
    const refereeUserId = refereeUserQuery.length > 0 ? refereeUserQuery[0].id : null;

    // Criar registro de referral
    await query(
      `INSERT INTO referrals (referrer_user_id, referrer_wallet, referee_wallet, referee_user_id, referral_code, points_awarded) 
       VALUES ($1, $2, $3, $4, $5, 50)`,
      [referrer.referrer_user_id, referrer.referrer_wallet, refereeWallet.toLowerCase(), refereeUserId, referralCode]
    );

    // Dar pontos ao referrer
    await query(
      `INSERT INTO user_points (user_id, wallet_address, action_type, points, metadata) 
       VALUES ($1, $2, 'referral', 50, $3)`,
      [referrer.referrer_user_id, referrer.referrer_wallet, JSON.stringify({ referee: refereeWallet.toLowerCase() })]
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
