import {
  setCORSHeaders,
  handleOptions,
  parseJsonBody,
  enforceRateLimit,
  sanitizeText,
  isValidEthereumAddress,
  setSecurityHeaders,
  detectClientType,
} from '../utils.js';
import { query } from '../db.js';

const MAX_BODY_SIZE = 5000;

/**
 * API: Registrar Pontos
 * POST /api/points/record
 * 
 * Registra uma ação que gera pontos para o usuário
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
    // Rate limit: 30 requests/hora por IP
    if (!enforceRateLimit(req, res, { limit: 30, windowMs: 60 * 60 * 1000 })) {
      return;
    }

    const body = await parseJsonBody(req, res, MAX_BODY_SIZE);
    if (!body) return;

    const walletAddress = sanitizeText(body.wallet_address, 128);
    const actionType = sanitizeText(body.action_type, 64);
    const metadata = body.metadata || {};

    // Validações
    if (!walletAddress || !isValidEthereumAddress(walletAddress)) {
      return res.status(400).json({ error: 'Wallet address inválido' });
    }

    if (!actionType) {
      return res.status(400).json({ error: 'Action type é obrigatório' });
    }

    // Buscar configuração de pontos
    const config = await query(
      'SELECT * FROM points_config WHERE action_type = $1 AND is_active = true',
      [actionType]
    );

    if (config.length === 0) {
      return res.status(400).json({ 
        error: 'Ação não configurada ou inativa',
        action_type: actionType,
      });
    }

    const pointsConfig = config[0];

    // Verificar se usuário já atingiu o máximo para esta ação
    if (pointsConfig.max_per_user) {
      const existing = await query(
        'SELECT COUNT(*) as count FROM user_points WHERE wallet_address = $1 AND action_type = $2',
        [walletAddress.toLowerCase(), actionType]
      );

      if (parseInt(existing[0].count) >= pointsConfig.max_per_user) {
        return res.status(400).json({ 
          error: 'Máximo de vezes atingido para esta ação',
          action_type: actionType,
          max: pointsConfig.max_per_user,
        });
      }
    }

    // Buscar user_id se existir
    const userQuery = await query(
      'SELECT id FROM users WHERE id IN (SELECT user_id FROM user_wallets WHERE wallet_address = $1)',
      [walletAddress.toLowerCase()]
    );
    const userId = userQuery.length > 0 ? userQuery[0].id : null;

    // Registrar pontos
    const result = await query(
      `INSERT INTO user_points (user_id, wallet_address, action_type, points, metadata) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING *`,
      [userId, walletAddress.toLowerCase(), actionType, pointsConfig.points, JSON.stringify(metadata)]
    );

    // Buscar total atualizado
    const totals = await query(
      'SELECT * FROM user_totals WHERE wallet_address = $1',
      [walletAddress.toLowerCase()]
    );

    res.status(201).json({
      success: true,
      points_earned: pointsConfig.points,
      action_type: actionType,
      total_points: totals.length > 0 ? totals[0].total_points : pointsConfig.points,
      tier: totals.length > 0 ? totals[0].tier : 'bronze',
    });

  } catch (error) {
    console.error('❌ Erro ao registrar pontos:', error);
    return res.status(500).json({ 
      error: 'Erro interno do servidor',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
}
