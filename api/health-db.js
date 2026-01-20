import { setCORSHeaders, handleOptions } from './utils.js';
import { ping } from './db.js';

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    return handleOptions(req, res);
  }

  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  setCORSHeaders(req, res);

  try {
    const ok = await ping();
    res.status(200).json({
      status: ok ? 'ok' : 'degraded',
      db: ok ? 'connected' : 'error',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error?.message || 'DB check failed',
    });
  }
}
