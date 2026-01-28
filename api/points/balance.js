import {
  setCORSHeaders,
  handleOptions,
  isValidEthereumAddress,
  setSecurityHeaders,
} from '../utils.js';
import { query } from '../db.js';

/**
 * API: Consultar Saldo de Pontos
 * GET /api/points/balance?wallet_address=0x...
 */
export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    return handleOptions(req, res);
  }

  setCORSHeaders(req, res);
  setSecurityHeaders(res);

  if (req.method !== 'GET') {
    return res.status(405).json({ 
      error: 'Method not allowed',
      allowed: ['GET'],
    });
  }

  try {
    const walletAddress = req.query.wallet_address;

    if (!walletAddress || !isValidEthereumAddress(walletAddress)) {
      return res.status(400).json({ error: 'Wallet address inválido' });
    }

    // Buscar totais
    const totals = await query(
      'SELECT * FROM user_totals WHERE wallet_address = $1',
      [walletAddress.toLowerCase()]
    );

    if (totals.length === 0) {
      return res.json({
        wallet_address: walletAddress.toLowerCase(),
        total_points: 0,
        total_tokens_claimed: 0,
        tier: 'bronze',
        rank_position: null,
      });
    }

    const total = totals[0];

    // Buscar histórico de ações
    const actions = await query(
      `SELECT action_type, SUM(points) as points, COUNT(*) as count 
       FROM user_points 
       WHERE wallet_address = $1 
       GROUP BY action_type 
       ORDER BY points DESC`,
      [walletAddress.toLowerCase()]
    );

    res.json({
      wallet_address: total.wallet_address,
      total_points: total.total_points,
      total_tokens_claimed: total.total_tokens_claimed,
      tier: total.tier,
      rank_position: total.rank_position,
      actions: actions,
      updated_at: total.updated_at,
    });

  } catch (error) {
    console.error('❌ Erro ao buscar saldo:', error);
    return res.status(500).json({ 
      error: 'Erro interno do servidor',
    });
  }
}
