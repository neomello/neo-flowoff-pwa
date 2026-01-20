import http from 'http';
import fs from 'fs';
import path from 'path';
import url from 'url';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import axios from 'axios';
import { createHmac } from 'crypto';

// Carrega variáveis de ambiente
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 3000;
const isProduction = process.env.NODE_ENV === 'production';
const log = (...args) => {
  // Sempre loga em desenvolvimento, mesmo se NODE_ENV não estiver definido
  if (!isProduction || process.env.NODE_ENV === undefined) {
    console.log(...args);
  }
};

// MIME types
const mimeTypes = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.webmanifest': 'application/manifest+json',
};

const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_DEFAULT = 120;
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

// Função auxiliar para configurar CORS de forma segura
function setCORSHeaders(req, res) {
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
    'Content-Type, Authorization, X-Form-Submission, X-API-Key'
  );
  res.setHeader('Access-Control-Max-Age', '86400'); // 24 horas
}

function setSecurityHeaders(res, options = {}) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader(
    'Permissions-Policy',
    'geolocation=(), microphone=(), camera=()'
  );
  if (options.isHtml) {
    res.setHeader(
      'Content-Security-Policy',
      "default-src 'self'; img-src 'self' data: blob: https:; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; connect-src 'self' https:; object-src 'none'; base-uri 'self'; frame-ancestors 'none'"
    );
  }
  if (isProduction) {
    res.setHeader(
      'Strict-Transport-Security',
      'max-age=15552000; includeSubDomains'
    );
  }
}

function sanitizeText(value, maxLength) {
  if (typeof value !== 'string') return '';
  const sanitized = value.replace(/[\u0000-\u001F\u007F]/g, '').trim();
  if (Number.isFinite(maxLength)) {
    return sanitized.slice(0, maxLength);
  }
  return sanitized;
}

function isEmail(value) {
  if (typeof value !== 'string') return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

function enforceRateLimit(req, res, options = {}) {
  const limit = Number.isFinite(options.limit)
    ? options.limit
    : RATE_LIMIT_DEFAULT;
  const windowMs = Number.isFinite(options.windowMs)
    ? options.windowMs
    : RATE_LIMIT_WINDOW_MS;
  const key =
    options.key ||
    req.headers['x-forwarded-for']?.toString().split(',')[0].trim() ||
    req.socket?.remoteAddress ||
    'unknown';
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
    res.writeHead(429, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Rate limit excedido' }));
    return false;
  }

  record.count += 1;
  return true;
}

const server = http.createServer((req, res) => {
  let parsedUrl;
  try {
    parsedUrl = url.parse(req.url, true);
  } catch (error) {
    setSecurityHeaders(res);
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'URL inválida' }));
    return;
  }

  let pathname;
  try {
    pathname = decodeURIComponent(parsedUrl.pathname);
  } catch (error) {
    setSecurityHeaders(res);
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'URL inválida' }));
    return;
  }

  // Remove query parameters for file serving
  let cleanPath = pathname.split('?')[0];

  // Handle OPTIONS requests (preflight)
  if (req.method === 'OPTIONS') {
    setCORSHeaders(req, res);
    setSecurityHeaders(res);
    res.writeHead(200);
    res.end();
    return;
  }

  // API endpoints
  if (cleanPath === '/api/health') {
    res.setHeader('Content-Type', 'application/json');
    setCORSHeaders(req, res);
    setSecurityHeaders(res);
    res.writeHead(200);
    res.end(
      JSON.stringify({
        status: 'ok',
        timestamp: new Date().toISOString(),
        version: '2.1.3',
        apis: {
          validator: '✅ Validação local descentralizada (sem APIs externas)',
          lead: '✅ Disponível',
          cep: '✅ Validação local (descentralizado)',
        },
        features: {
          backgroundSync: '✅ Ativo',
          offlineQueue: '✅ Ativo',
          formValidation: '✅ Ativo',
        },
      })
    );
    return;
  }

  // API endpoint para config (API keys) - apenas em desenvolvimento local
  // Permite em localhost mesmo se NODE_ENV=production
  if (cleanPath === '/api/config') {
    const host = req.headers.host || '';
    const isLocalhost =
      host.includes('localhost') || host.includes('127.0.0.1');

    // Debug log (apenas em desenvolvimento)
    if (!isProduction) {
      log('🔧 /api/config chamado - host:', host, 'isLocalhost:', isLocalhost);
    }

    // Só permite se for localhost ou se não estiver em produção
    if (!isLocalhost && isProduction) {
      setSecurityHeaders(res);
      res.writeHead(403, { 'Content-Type': 'application/json' });
      res.end(
        JSON.stringify({
          error: 'Forbidden: API config only available in development',
        })
      );
      return;
    }
    res.setHeader('Content-Type', 'application/json');
    setCORSHeaders(req, res);
    setSecurityHeaders(res);
    res.writeHead(200);
    res.end(
      JSON.stringify({
        message: 'API config endpoint - apenas para desenvolvimento',
      })
    );
    return;
  }

  // API endpoint para receber leads
  if (cleanPath === '/api/lead' && req.method === 'POST') {
    if (!enforceRateLimit(req, res, { limit: 30 })) return;
    let body = '';
    let bodySize = 0;
    const MAX_BODY_SIZE = 10000; // 10KB máximo

    req.on('data', (chunk) => {
      bodySize += chunk.length;
      if (bodySize > MAX_BODY_SIZE) {
        setSecurityHeaders(res);
        res.writeHead(413, { 'Content-Type': 'application/json' });
        res.end(
          JSON.stringify({
            success: false,
            error: 'Payload muito grande',
          })
        );
        req.destroy();
        return;
      }
      body += chunk.toString();
    });

    req.on('end', () => {
      try {
        // Validar tamanho do body
        if (bodySize > MAX_BODY_SIZE) {
          setSecurityHeaders(res);
          res.writeHead(413, { 'Content-Type': 'application/json' });
          res.end(
            JSON.stringify({
              success: false,
              error: 'Payload muito grande',
            })
          );
          return;
        }

        const leadData = JSON.parse(body);

        // Validar estrutura básica
        if (!leadData || typeof leadData !== 'object') {
          setSecurityHeaders(res);
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(
            JSON.stringify({
              success: false,
              error: 'Dados inválidos',
            })
          );
          return;
        }

        const name = sanitizeText(leadData.name, 100);
        const email = sanitizeText(leadData.email, 255);
        const whats = sanitizeText(leadData.whats, 20);
        const type = sanitizeText(leadData.type, 50);

        // Validar campos obrigatórios
        if (!name || !email || !whats || !type) {
          setSecurityHeaders(res);
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(
            JSON.stringify({
              success: false,
              error: 'Campos obrigatórios faltando',
            })
          );
          return;
        }

        if (!isEmail(email)) {
          setSecurityHeaders(res);
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(
            JSON.stringify({
              success: false,
              error: 'Email inválido',
            })
          );
          return;
        }

        if (!/^\+?[0-9]{8,20}$/.test(whats)) {
          setSecurityHeaders(res);
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(
            JSON.stringify({
              success: false,
              error: 'Whats inválido',
            })
          );
          return;
        }

        if (!/^[a-zA-Z0-9 _.-]{1,50}$/.test(type)) {
          setSecurityHeaders(res);
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(
            JSON.stringify({
              success: false,
              error: 'Tipo inválido',
            })
          );
          return;
        }

        // Aqui você pode salvar no banco de dados, enviar email, etc.
        // Por enquanto, apenas logamos e retornamos sucesso

        res.setHeader('Content-Type', 'application/json');
        setCORSHeaders(req, res);
        setSecurityHeaders(res);
        res.writeHead(200);
        res.end(
          JSON.stringify({
            success: true,
            message: 'Lead recebido com sucesso',
            data: {
              id: Date.now(),
              name,
              email,
              whats,
              type,
            },
          })
        );
      } catch (error) {
        res.setHeader('Content-Type', 'application/json');
        setCORSHeaders(req, res);
        setSecurityHeaders(res);
        res.writeHead(400);
        res.end(
          JSON.stringify({
            success: false,
            error: 'Erro ao processar lead',
            message: 'Falha ao processar a requisição',
          })
        );
      }
    });
    return;
  }

  // API endpoint para consulta de CEP
  if (cleanPath.startsWith('/api/cep/')) {
    const cep = cleanPath.replace('/api/cep/', '').replace(/\D/g, '');

    if (cep.length !== 8) {
      res.setHeader('Content-Type', 'application/json');
      setCORSHeaders(req, res);
      setSecurityHeaders(res);
      res.writeHead(400);
      res.end(
        JSON.stringify({
          success: false,
          error: 'CEP inválido',
          message: 'CEP deve ter 8 dígitos',
        })
      );
      return;
    }

    // Descentralizado: retorna estrutura básica sem dependência de APIs externas
    // O frontend faz validação local via SimpleValidator
    res.setHeader('Content-Type', 'application/json');
    setCORSHeaders(req, res);
    setSecurityHeaders(res);
    res.writeHead(200);
    res.end(
      JSON.stringify({
        success: true,
        data: {
          cep: cep.replace(/(\d{5})(\d{3})/, '$1-$2'),
          message: 'Validação local - sem dependência de APIs externas',
        },
        source: 'local',
      })
    );
    return;
  }

  // Endpoints removidos: /api/invertexto e /api/google-knowledge
  // Descentralizado: não dependemos de APIs externas centralizadas
  // Validação local via SimpleValidator no frontend

  // Serve index.html for root
  if (cleanPath === '/') {
    cleanPath = '/index.html';
  }

  // Serve desktop.html for /desktop route
  if (cleanPath === '/desktop') {
    cleanPath = '/desktop.html';
  }

  const safePath = path.resolve(__dirname, `.${cleanPath}`);
  const basePath = `${__dirname}${path.sep}`;
  if (!safePath.startsWith(basePath)) {
    setSecurityHeaders(res);
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    res.end('Forbidden');
    return;
  }
  const ext = path.extname(safePath).toLowerCase();
  const mimeType = mimeTypes[ext] || 'text/plain';

  // CORS headers para arquivos estáticos
  setCORSHeaders(req, res);

  fs.readFile(safePath, (err, data) => {
    if (err) {
      if (err.code === 'ENOENT') {
        // File not found, serve index.html for SPA routing
        const indexPath = path.resolve(__dirname, './index.html');
        fs.readFile(indexPath, (err2, data2) => {
          if (err2) {
            log('❌ Erro ao ler index.html:', err2.message);
            setSecurityHeaders(res, { isHtml: true });
            res.writeHead(404, { 'Content-Type': 'text/html' });
            res.end(
              `<h1>404 - File not found</h1><p>Erro: ${err2.message}</p>`
            );
          } else {
            setSecurityHeaders(res, { isHtml: true });
            res.writeHead(200, {
              'Content-Type': 'text/html',
              'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0',
              Pragma: 'no-cache',
              Expires: '0',
            });
            res.end(data2);
          }
        });
      } else {
        log('❌ Erro ao ler arquivo:', safePath, err.message, err.code);
        setSecurityHeaders(res, { isHtml: true });
        res.writeHead(500, { 'Content-Type': 'text/html' });
        const errorMsg = isProduction
          ? 'Internal Server Error'
          : `<h1>500 - Server Error</h1><p>Erro: ${err.message}</p><p>Código: ${err.code}</p><p>Arquivo: ${safePath}</p>`;
        res.end(errorMsg);
      }
    } else {
      setSecurityHeaders(res, { isHtml: mimeType === 'text/html' });
      // Headers para evitar cache apenas para arquivos estáticos
      res.setHeader(
        'Cache-Control',
        'no-cache, no-store, must-revalidate, max-age=0'
      );
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      res.setHeader('Content-Type', mimeType);
      res.writeHead(200);
      res.end(data);
    }
  });
});

server.listen(PORT, () => {
  // Sempre mostra mensagem de inicialização
  console.log(`\n🚀 Servidor rodando em http://localhost:${PORT}`);
  console.log(`📁 Diretório: ${__dirname}`);
  console.log(`🌍 Ambiente: ${isProduction ? 'PRODUÇÃO' : 'DESENVOLVIMENTO'}`);
  console.log(`✅ Servidor iniciado com sucesso!`);
  console.log(`   Acesse: http://localhost:${PORT}`);
  console.log(`   Pressione Ctrl+C para parar\n`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    log(`❌ Porta ${PORT} já está em uso!`);
    log('💡 Soluções:');
    log('   1. Pare o processo: kill -9 $(lsof -ti:${PORT})');
    log('   2. Use outra porta: PORT=3001 make dev');
    log('   3. Use servidor alternativo: make dev-python');
  } else {
    log('❌ Erro no servidor:', err.message);
  }
  process.exit(1);
});
