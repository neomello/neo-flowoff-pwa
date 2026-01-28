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
        'https://*.w3s.link',
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
    'Content-Type, Authorization, X-Form-Submission, X-API-Key, X-Client-Type'
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
  // Content Security Policy - prevenir XSS e outros ataques
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://esm.sh https://cdn.jsdelivr.net https://unpkg.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https://*.vercel.app https://*.base.org https://mainnet.base.org https://basescan.org https://*.infura.io https://*.alchemy.com https://api.hunter.io https://api.resend.com; frame-ancestors 'none'; base-uri 'self'; form-action 'self';"
  );
  // Strict Transport Security - força HTTPS
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
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
  const forwarded = req.headers['x-forwarded-for']
    ?.toString()
    .split(',')[0]
    ?.trim();
  return (
    forwarded ||
    req.headers['x-real-ip']?.toString() ||
    req.socket?.remoteAddress ||
    null
  );
}

// Memory leak protection - limitar tamanho máximo do Map
const MAX_RATE_LIMIT_ENTRIES = 10000;
let lastCleanupTime = 0;
const CLEANUP_INTERVAL = 60000; // 1 minuto

export function enforceRateLimit(req, res, options = {}) {
  const limit = Number.isFinite(options.limit)
    ? options.limit
    : RATE_LIMIT_DEFAULT;
  const windowMs = Number.isFinite(options.windowMs)
    ? options.windowMs
    : RATE_LIMIT_WINDOW_MS;
  const key = options.key || getClientIp(req) || 'unknown';
  const now = Date.now();

  // Limpeza periódica mais agressiva para prevenir memory leak
  if (now - lastCleanupTime > CLEANUP_INTERVAL || rateLimitStore.size > MAX_RATE_LIMIT_ENTRIES) {
    lastCleanupTime = now;
    let deleted = 0;
    const entriesToDelete = [];
    
    for (const [entryKey, entry] of rateLimitStore.entries()) {
      if (now > entry.resetAt) {
        entriesToDelete.push(entryKey);
        deleted++;
        // Limitar iterações para prevenir DoS
        if (deleted > 1000) break;
      }
    }
    
    // Deletar em batch após iterar (evita modificar Map durante iteração)
    entriesToDelete.forEach(k => rateLimitStore.delete(k));
    
    // Se ainda está muito grande após limpeza, remover entradas mais antigas
    if (rateLimitStore.size > MAX_RATE_LIMIT_ENTRIES * 0.9) {
      const sortedEntries = Array.from(rateLimitStore.entries())
        .sort((a, b) => a[1].resetAt - b[1].resetAt)
        .slice(0, Math.floor(MAX_RATE_LIMIT_ENTRIES * 0.5));
      
      sortedEntries.forEach(([k]) => rateLimitStore.delete(k));
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
    res.setHeader('X-RateLimit-Limit', limit.toString());
    res.setHeader('X-RateLimit-Remaining', '0');
    res.setHeader('X-RateLimit-Reset', Math.ceil(record.resetAt / 1000).toString());
    res.status(429).json({ 
      error: 'Rate limit excedido',
      retryAfter: retryAfter,
      limit: limit
    });
    return false;
  }

  record.count += 1;
  res.setHeader('X-RateLimit-Limit', limit.toString());
  res.setHeader('X-RateLimit-Remaining', (limit - record.count).toString());
  res.setHeader('X-RateLimit-Reset', Math.ceil(record.resetAt / 1000).toString());
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
    let resolved = false;

    // Timeout de 10 segundos para prevenir req.on('data') pendente
    const timeoutId = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        res.status(408).json({ error: 'Request timeout' });
        resolve(null);
      }
    }, 10000);

    req.on('data', (chunk) => {
      if (resolved) return; // Ignorar se já resolveu
      
      size += chunk.length;
      if (size > maxSize) {
        resolved = true;
        clearTimeout(timeoutId);
        res.status(413).json({ error: 'Payload muito grande' });
        resolve(null);
        return;
      }
      chunks.push(chunk);
    });

    req.on('error', () => {
      if (resolved) return;
      resolved = true;
      clearTimeout(timeoutId);
      res.status(400).json({ error: 'Erro ao ler payload' });
      resolve(null);
    });

    req.on('end', () => {
      if (resolved) return;
      resolved = true;
      clearTimeout(timeoutId);
      
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
    req.headers.authorization ||
    req.headers['x-api-key'] ||
    req.headers['x-api-token'];
  const token = header
    ?.toString()
    .replace(/^Bearer\s+/i, '')
    .trim();
  if (token && token === requiredToken) return true;

  res.status(401).json({ error: 'Não autorizado' });
  return false;
}

/**
 * Detecta o tipo de cliente (mobile ou desktop)
 * Prioridade: header X-Client-Type > query parameter > User-Agent
 * @param {object} req - Request object
 * @returns {string} 'mobile' ou 'desktop'
 */
export function detectClientType(req) {
  // 1. Prioridade: Header customizado
  const headerClientType = req.headers['x-client-type']?.toLowerCase()?.trim();
  if (headerClientType === 'mobile' || headerClientType === 'desktop') {
    return headerClientType;
  }

  // 2. Fallback: Query parameter
  const queryClientType = req.query?.client?.toLowerCase()?.trim();
  if (queryClientType === 'mobile' || queryClientType === 'desktop') {
    return queryClientType;
  }

  // 3. Fallback: User-Agent detection
  const userAgent = req.headers['user-agent'] || '';
  const isMobile = /Mobile|Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
  
  return isMobile ? 'mobile' : 'desktop';
}
