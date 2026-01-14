// Utilitários compartilhados para funções serverless

const DEFAULT_MAX_BODY_SIZE = 10000;
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_DEFAULT = 60;
const rateLimitStore = new Map();

function normalizeHost(hostname) {
  return hostname?.toLowerCase()?.trim() || '';
}

function isAllowedOrigin(origin, allowedOrigins) {
  if (!origin) return false;
  let parsed;
  try {
    parsed = new URL(origin);
  } catch {
    return false;
  }

  const originProtocol = parsed.protocol;
  const originHost = normalizeHost(parsed.hostname);

  return allowedOrigins.some((allowed) => {
    if (allowed === '*') return true;
    let allowedUrl;
    try {
      allowedUrl = new URL(allowed.replace('*.', ''));
    } catch {
      return false;
    }
    const allowedProtocol = allowedUrl.protocol;
    const allowedHost = normalizeHost(allowedUrl.hostname);

    if (allowed.includes('*.')) {
      return (
        originProtocol === allowedProtocol &&
        originHost.endsWith(`.${allowedHost}`)
      );
    }
    return originProtocol === allowedProtocol && originHost === allowedHost;
  });
}

/**
 * Configura headers CORS de forma segura
 */
export function setCORSHeaders(req, res) {
  const isProduction = process.env.NODE_ENV === 'production';
  const allowedOrigins = isProduction
    ? [
      'https://flowoff.xyz',
      'https://www.flowoff.xyz',
      'https://neoflowoff.eth.link',
      'https://*.storacha.link',
      'https://*.w3s.link'
    ]
    : ['http://localhost:3000', 'http://127.0.0.1:3000', '*'];

  const origin = req.headers.origin;
  const allowAnyOrigin = allowedOrigins.includes('*');

  if (allowAnyOrigin || isAllowedOrigin(origin, allowedOrigins)) {
    res.setHeader('Access-Control-Allow-Origin', allowAnyOrigin ? '*' : origin);
    res.setHeader('Vary', 'Origin');
  }

  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Content-Type, Authorization, X-Form-Submission, X-API-Key'
  );
  res.setHeader('Access-Control-Max-Age', '86400'); // 24 horas
}

export function setSecurityHeaders(res) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader(
    'Permissions-Policy',
    'geolocation=(), microphone=(), camera=()'
  );
}

/**
 * Verifica se é localhost
 */
export function isLocalhost(host) {
  return host && (host.includes('localhost') || host.includes('127.0.0.1'));
}

/**
 * Handler padrão para requisições OPTIONS (preflight)
 */
export function handleOptions(req, res) {
  setCORSHeaders(req, res);
  setSecurityHeaders(res);
  res.status(200).end();
}

export function getClientIp(req) {
  const forwarded = req.headers['x-forwarded-for']?.toString().split(',')[0]?.trim();
  return (
    forwarded ||
    req.headers['x-real-ip']?.toString() ||
    req.socket?.remoteAddress ||
    null
  );
}

export function enforceRateLimit(req, res, options = {}) {
  const limit = Number.isFinite(options.limit) ? options.limit : RATE_LIMIT_DEFAULT;
  const windowMs = Number.isFinite(options.windowMs)
    ? options.windowMs
    : RATE_LIMIT_WINDOW_MS;
  const key = options.key || getClientIp(req) || 'unknown';
  const now = Date.now();

  if (rateLimitStore.size > 1000) {
    for (const [entryKey, entry] of rateLimitStore.entries()) {
      if (now > entry.resetAt) {
        rateLimitStore.delete(entryKey);
      }
    }
  }

  const record = rateLimitStore.get(key);
  if (!record || now > record.resetAt) {
    rateLimitStore.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (record.count >= limit) {
    const retryAfter = Math.max(1, Math.ceil((record.resetAt - now) / 1000));
    res.setHeader('Retry-After', retryAfter.toString());
    res.status(429).json({ error: 'Rate limit excedido' });
    return false;
  }

  record.count += 1;
  return true;
}

export function sanitizeText(value, maxLength) {
  if (typeof value !== 'string') return '';
  const sanitized = value.replace(/[\u0000-\u001F\u007F]/g, '').trim();
  if (Number.isFinite(maxLength)) {
    return sanitized.slice(0, maxLength);
  }
  return sanitized;
}

export function isEmail(value) {
  if (typeof value !== 'string') return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export function isHexString(value, minLength, maxLength) {
  if (typeof value !== 'string') return false;
  const normalized = value.trim();
  if (!normalized.startsWith('0x')) return false;
  const hex = normalized.slice(2);
  if (!/^[0-9a-fA-F]+$/.test(hex)) return false;
  if (Number.isFinite(minLength) && hex.length < minLength) return false;
  if (Number.isFinite(maxLength) && hex.length > maxLength) return false;
  return true;
}

export function parseJsonBody(req, res, maxSize = DEFAULT_MAX_BODY_SIZE) {
  if (req.body && typeof req.body === 'object') {
    return req.body;
  }

  return new Promise((resolve) => {
    const chunks = [];
    let size = 0;

    req.on('data', (chunk) => {
      size += chunk.length;
      if (size > maxSize) {
        res.status(413).json({ error: 'Payload muito grande' });
        resolve(null);
        return;
      }
      chunks.push(chunk);
    });

    req.on('error', () => {
      res.status(400).json({ error: 'Erro ao ler payload' });
      resolve(null);
    });

    req.on('end', () => {
      if (!chunks.length) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString()));
      } catch {
        res.status(400).json({ error: 'JSON inválido' });
        resolve(null);
      }
    });
  });
}

export function requireApiToken(req, res) {
  const requiredToken = process.env.API_ACCESS_TOKEN;
  if (!requiredToken) return true;
  const header =
    req.headers.authorization || req.headers['x-api-key'] || req.headers['x-api-token'];
  const token = header?.toString().replace(/^Bearer\s+/i, '').trim();
  if (token && token === requiredToken) return true;

  res.status(401).json({ error: 'Não autorizado' });
  return false;
}
