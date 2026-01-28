import {
  setCORSHeaders,
  handleOptions,
  setSecurityHeaders,
} from './utils.js';
import { query } from './db.js';

/**
 * API: Leaderboard
 * GET /api/leaderboard?limit=100
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
    const limit = Math.min(parseInt(req.query.limit) || 100, 100);

    // Buscar leaderboard
    const leaderboard = await query(
      `SELECT * FROM v_leaderboard LIMIT $1`,
      [limit]
    );

    // Estatísticas gerais
    const stats = await query(
      `SELECT 
        COUNT(*) as total_participants,
        SUM(total_points) as total_points_distributed,
        SUM(total_tokens_claimed) as total_tokens_claimed
       FROM user_totals
       WHERE total_points > 0`
    );

    res.json({
      leaderboard: leaderboard.map(user => ({
        rank: user.rank_position,
        wallet_address: user.wallet_address,
        username: user.username || 'Anonymous',
        total_points: user.total_points,
        total_tokens_claimed: user.total_tokens_claimed,
        tier: user.tier,
        updated_at: user.updated_at,
      })),
      stats: stats[0] || {
        total_participants: 0,
        total_points_distributed: 0,
        total_tokens_claimed: 0,
      },
    });

  } catch (error) {
    console.error('❌ Erro ao buscar leaderboard:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
}
