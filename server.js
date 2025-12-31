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
  '.webmanifest': 'application/manifest+json'
};


// Função auxiliar para configurar CORS de forma segura
function setCORSHeaders(req, res) {
  const allowedOrigins = isProduction
    ? ['https://flowoff.xyz', 'https://www.flowoff.xyz', 'https://neoflowoff.eth.link', 'https://*.storacha.link', 'https://*.w3s.link']
    : ['http://localhost:3000', 'http://127.0.0.1:3000', '*'];

  const origin = req.headers.origin;
  if (allowedOrigins.includes('*') || (origin && allowedOrigins.some(allowed => origin.includes(allowed.replace('*.', ''))))) {
    res.setHeader('Access-Control-Allow-Origin', origin || '*');
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Form-Submission');
  res.setHeader('Access-Control-Max-Age', '86400'); // 24 horas
}

const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  let pathname = decodeURIComponent(parsedUrl.pathname);

  // Remove query parameters for file serving
  let cleanPath = pathname.split('?')[0];

  // Handle OPTIONS requests (preflight)
  if (req.method === 'OPTIONS') {
    setCORSHeaders(req, res);
    res.writeHead(200);
    res.end();
    return;
  }


  // API endpoints
  if (cleanPath === '/api/health') {
    res.setHeader('Content-Type', 'application/json');
    setCORSHeaders(req, res);
    res.writeHead(200);
    res.end(JSON.stringify({
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: '2.1.3',
      apis: {
        validator: "✅ Validação local descentralizada (sem APIs externas)",
        lead: "✅ Disponível",
        cep: "✅ Validação local (descentralizado)"
      },
      features: {
        backgroundSync: "✅ Ativo",
        offlineQueue: "✅ Ativo",
        formValidation: "✅ Ativo"
      }
    }));
    return;
  }

  // API endpoint para config (API keys) - apenas em desenvolvimento local
  // Permite em localhost mesmo se NODE_ENV=production
  if (cleanPath === '/api/config') {
    const host = req.headers.host || '';
    const isLocalhost = host.includes('localhost') || host.includes('127.0.0.1');

    // Debug log (apenas em desenvolvimento)
    if (!isProduction) {
      log('🔧 /api/config chamado - host:', host, 'isLocalhost:', isLocalhost);
    }

    // Só permite se for localhost ou se não estiver em produção
    if (!isLocalhost && isProduction) {
      res.writeHead(403, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Forbidden: API config only available in development' }));
      return;
    }
    res.setHeader('Content-Type', 'application/json');
    setCORSHeaders(req, res);
    res.writeHead(200);
    res.end(JSON.stringify({
      message: 'API config endpoint - apenas para desenvolvimento'
    }));
    return;
  }

  // API endpoint para receber leads
  if (cleanPath === '/api/lead' && req.method === 'POST') {
    let body = '';
    let bodySize = 0;
    const MAX_BODY_SIZE = 10000; // 10KB máximo

    req.on('data', chunk => {
      bodySize += chunk.length;
      if (bodySize > MAX_BODY_SIZE) {
        res.writeHead(413, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: false,
          error: 'Payload muito grande'
        }));
        return;
      }
      body += chunk.toString();
    });

    req.on('end', () => {
      try {
        // Validar tamanho do body
        if (bodySize > MAX_BODY_SIZE) {
          res.writeHead(413, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            success: false,
            error: 'Payload muito grande'
          }));
          return;
        }

        const leadData = JSON.parse(body);

        // Validar estrutura básica
        if (!leadData || typeof leadData !== 'object') {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            success: false,
            error: 'Dados inválidos'
          }));
          return;
        }

        // Validar campos obrigatórios
        if (!leadData.name || !leadData.email || !leadData.whats || !leadData.type) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            success: false,
            error: 'Campos obrigatórios faltando'
          }));
          return;
        }

        // Validar tamanho dos campos
        if (leadData.name.length > 100 || leadData.email.length > 255 ||
            leadData.whats.length > 20 || leadData.type.length > 50) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            success: false,
            error: 'Campos muito longos'
          }));
          return;
        }

        // Aqui você pode salvar no banco de dados, enviar email, etc.
        // Por enquanto, apenas logamos e retornamos sucesso

        res.setHeader('Content-Type', 'application/json');
        setCORSHeaders(req, res);
        res.writeHead(200);
        res.end(JSON.stringify({
          success: true,
          message: 'Lead recebido com sucesso',
          data: {
            id: Date.now(),
            ...leadData
          }
        }));
      } catch (error) {
        res.setHeader('Content-Type', 'application/json');
        setCORSHeaders(req, res);
        res.writeHead(400);
        res.end(JSON.stringify({
          success: false,
          error: 'Erro ao processar lead',
          message: error.message
        }));
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
      res.writeHead(400);
      res.end(JSON.stringify({
        success: false,
        error: 'CEP inválido',
        message: 'CEP deve ter 8 dígitos'
      }));
      return;
    }

    // Descentralizado: retorna estrutura básica sem dependência de APIs externas
    // O frontend faz validação local via SimpleValidator
    res.setHeader('Content-Type', 'application/json');
    setCORSHeaders(req, res);
    res.writeHead(200);
    res.end(JSON.stringify({
      success: true,
      data: {
        cep: cep.replace(/(\d{5})(\d{3})/, '$1-$2'),
        message: 'Validação local - sem dependência de APIs externas'
      },
      source: 'local'
    }));
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

  const filePath = path.join(__dirname, cleanPath);
  const ext = path.extname(filePath).toLowerCase();
  const mimeType = mimeTypes[ext] || 'text/plain';

  // CORS headers para arquivos estáticos
  setCORSHeaders(req, res);

  fs.readFile(filePath, (err, data) => {
    if (err) {
      if (err.code === 'ENOENT') {
        // File not found, serve index.html for SPA routing
        fs.readFile(path.join(__dirname, 'index.html'), (err2, data2) => {
          if (err2) {
            log('❌ Erro ao ler index.html:', err2.message);
            res.writeHead(404, { 'Content-Type': 'text/html' });
            res.end(`<h1>404 - File not found</h1><p>Erro: ${err2.message}</p>`);
          } else {
            res.writeHead(200, {
              'Content-Type': 'text/html',
              'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0',
              'Pragma': 'no-cache',
              'Expires': '0'
            });
            res.end(data2);
          }
        });
      } else {
        log('❌ Erro ao ler arquivo:', filePath, err.message, err.code);
        res.writeHead(500, { 'Content-Type': 'text/html' });
        const errorMsg = isProduction
          ? 'Internal Server Error'
          : `<h1>500 - Server Error</h1><p>Erro: ${err.message}</p><p>Código: ${err.code}</p><p>Arquivo: ${filePath}</p>`;
        res.end(errorMsg);
      }
    } else {
      // Headers para evitar cache apenas para arquivos estáticos
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate, max-age=0');
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
