// Utilitários compartilhados para funções serverless

/**
 * Configura headers CORS de forma segura
 */
export function setCORSHeaders(req, res) {
  const isProduction = process.env.NODE_ENV === 'production';
  const allowedOrigins = isProduction
    ? ['https://flowoff.xyz', 'https://www.flowoff.xyz', 'https://*.storacha.link', 'https://*.w3s.link']
    : ['http://localhost:3000', 'http://127.0.0.1:3000', '*'];

  const origin = req.headers.origin || req.headers.referer?.split('/').slice(0, 3).join('/');
  
  if (allowedOrigins.includes('*') || (origin && allowedOrigins.some(allowed => {
    if (allowed.includes('*')) {
      return origin.includes(allowed.replace('*.', ''));
    }
    return origin === allowed;
  }))) {
    res.setHeader('Access-Control-Allow-Origin', origin || '*');
  }
  
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Form-Submission');
  res.setHeader('Access-Control-Max-Age', '86400'); // 24 horas
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
  res.status(200).end();
}
