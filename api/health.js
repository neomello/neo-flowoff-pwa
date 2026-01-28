import { setCORSHeaders, handleOptions } from './utils.js';
import { query } from './db.js';

/**
 * Health Check API (Consolidado)
 * GET /api/health — Status básico
 * GET /api/health?check=db — Status + teste de banco
 */
export default async function handler(req, res) {
  // Handle preflight
  if (req.method === 'OPTIONS') {
    return handleOptions(req, res);
  }

  // Apenas GET
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  setCORSHeaders(req, res);

  const check = req.query.check;

  // Health check com banco de dados
  if (check === 'db') {
    try {
      const result = await query('SELECT NOW() as timestamp');
      const dbTimestamp = result[0]?.timestamp;

      return res.status(200).json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        version: '2.1.3',
        database: {
          status: 'connected',
          timestamp: dbTimestamp,
        },
        apis: {
          validator: '✅ Validação local descentralizada',
          lead: '✅ Disponível',
          points: '✅ Disponível',
          referral: '✅ Disponível',
          leaderboard: '✅ Disponível',
        },
      });
    } catch (error) {
      console.error('❌ Database health check error:', error);
      return res.status(503).json({
        status: 'error',
        timestamp: new Date().toISOString(),
        version: '2.1.3',
        database: {
          status: 'disconnected',
          error: error.message,
        },
      });
    }
  }

  // Health check básico
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '2.1.3',
    apis: {
      validator: '✅ Validação local descentralizada (sem APIs externas)',
      lead: '✅ Disponível',
      cep: '✅ Validação local (descentralizado)',
      points: '✅ Sistema de pontos ativo',
      referral: '✅ Sistema de referral ativo',
      leaderboard: '✅ Ranking em tempo real',
    },
    features: {
      backgroundSync: '✅ Ativo',
      offlineQueue: '✅ Ativo',
      formValidation: '✅ Ativo',
      gamification: '✅ Ativo (pontos + referral + leaderboard)',
    },
  });
}
