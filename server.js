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
const MESSENGER_VERIFY_TOKEN = process.env.FB_MESSENGER_VERIFY_TOKEN || 'flowoff-messenger-verify-token';
const MESSENGER_APP_SECRET = process.env.FB_MESSENGER_APP_SECRET || '';
const isProduction = process.env.NODE_ENV === 'production';
const log = (...args) => {
  // Sempre loga em desenvolvimento, mesmo se NODE_ENV não estiver definido
  if (!isProduction || process.env.NODE_ENV === undefined) {
    console.log(...args);
  }
};
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY || '';
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';
// Modelos via variáveis de ambiente (valores padrão seguros)
const OPENAI_MODEL = process.env.OPENAI_MODEL || process.env.LLM_MODEL || 'gpt-4o';
const GEMINI_MODEL = process.env.GEMINI_MODEL || process.env.LLM_MODEL_FALLBACK || 'gemini-2.0-flash-exp';

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

  const verifyMessengerSignature = (signature = '', body = '') => {
    if (!signature || !MESSENGER_APP_SECRET) return false;
  const [algorithm, hash] = signature.split('=');
  if (algorithm !== 'sha256' || !hash) return false;
  const expectedHash = createHmac('sha256', MESSENGER_APP_SECRET).update(body).digest('hex');
  return hash === expectedHash;
};

// Função auxiliar para configurar CORS de forma segura
function setCORSHeaders(req, res) {
  const allowedOrigins = isProduction
    ? ['https://flowoff.xyz', 'https://www.flowoff.xyz', 'https://*.storacha.link', 'https://*.w3s.link']
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

  // Messenger webhook (GET verification, POST events)
  if (cleanPath === '/webhook/messenger') {
    if (req.method === 'GET') {
      const hubMode = parsedUrl.query['hub.mode'];
      const hubToken = parsedUrl.query['hub.verify_token'];
      const challenge = parsedUrl.query['hub.challenge'];
      if (hubMode === 'subscribe' && hubToken === MESSENGER_VERIFY_TOKEN) {
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.end(challenge || '');
      } else {
        res.writeHead(403, { 'Content-Type': 'text/plain' });
        res.end('Verify token mismatch');
      }
      return;
    }

    if (req.method === 'POST') {
      let payload = '';
      req.on('data', (chunk) => {
        payload += chunk;
      });

      req.on('end', () => {
        const signature = req.headers['x-hub-signature-256'];
        const signatureValid = !MESSENGER_APP_SECRET || verifyMessengerSignature(signature, payload);
        if (MESSENGER_APP_SECRET && !signatureValid) {
          res.writeHead(401, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: 'Invalid signature' }));
          return;
        }

        let parsed;
        try {
          parsed = payload ? JSON.parse(payload) : {};
        } catch (error) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: 'Invalid JSON payload' }));
          return;
        }

        log('Messenger webhook event received:', parsed.object || 'unknown');

        res.setHeader('Content-Type', 'application/json');
        setCORSHeaders(req, res);
        res.writeHead(200);
        res.end(JSON.stringify({ success: true }));
      });

      return;
    }

    res.writeHead(405, { 'Content-Type': 'text/plain' });
    res.end('Method not allowed');
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
      OPENAI_API_KEY: OPENAI_API_KEY || '',
      GOOGLE_API_KEY: GOOGLE_API_KEY || '',
      OPENAI_MODEL: OPENAI_MODEL,
      GEMINI_MODEL: GEMINI_MODEL,
      LLM_MODEL: OPENAI_MODEL,
      LLM_MODEL_FALLBACK: GEMINI_MODEL
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

  // Endpoint removido: /api/invertexto
  // Descentralizado: não dependemos de APIs externas centralizadas
  // Validação local via SimpleValidator no frontend

  // API Chat com IA (OpenAI/Gemini)
  if (cleanPath === '/api/chat' && req.method === 'POST') {
    let body = '';
    let bodySize = 0;
    const MAX_BODY_SIZE = 50000; // 50KB máximo

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

    req.on('end', async () => {
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

        const parsedBody = JSON.parse(body);
        const { message, history = [] } = parsedBody;

        // Validar estrutura
        if (!parsedBody || typeof parsedBody !== 'object') {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            success: false,
            error: 'Dados inválidos'
          }));
          return;
        }

        if (!message || typeof message !== 'string' || !message.trim()) {
          res.setHeader('Content-Type', 'application/json');
          res.setHeader('Access-Control-Allow-Origin', origin || '*');
          res.writeHead(400);
          res.end(JSON.stringify({
            success: false,
            error: 'Mensagem é obrigatória'
          }));
          return;
        }

        // Validar tamanho da mensagem
        if (message.length > 5000) {
          res.setHeader('Content-Type', 'application/json');
          res.setHeader('Access-Control-Allow-Origin', origin || '*');
          res.writeHead(400);
          res.end(JSON.stringify({
            success: false,
            error: 'Mensagem muito longa (máximo 5000 caracteres)'
          }));
          return;
        }

        // Validar histórico
        if (!Array.isArray(history) || history.length > 50) {
          res.setHeader('Content-Type', 'application/json');
          res.setHeader('Access-Control-Allow-Origin', origin || '*');
          res.writeHead(400);
          res.end(JSON.stringify({
            success: false,
            error: 'Histórico inválido'
          }));
          return;
        }

        // Ⅰ. CLASSIFICAÇÃO AUTOMÁTICA DE INTENÇÃO
        // Função de classificação inline (compatível com ES modules)
        const classifyIntent = (message, history = []) => {
          const messageLower = message.toLowerCase();
          const fullContext = history.map(m => m.content || m.text || '').join(' ').toLowerCase() + ' ' + messageLower;

          const salesKeywords = ['preço', 'quanto', 'custo', 'orçamento', 'contratar', 'proposta', 'plano', 'pacote', 'valor', 'investimento', 'pagamento'];
          const technicalKeywords = ['código', 'stack', 'bug', 'erro', 'implementar', 'arquitetura', 'api', 'deploy', 'tecnologia', 'desenvolvimento', 'programação', 'tech', 'sistema'];
          const strategyKeywords = ['estratégia', 'crescimento', 'modelo', 'negócio', 'visão', 'posicionamento', 'sistema', 'ecossistema', 'automação', 'processo', 'metodologia'];
          const onboardingKeywords = ['o que', 'como funciona', 'quem são', 'sobre', 'entender', 'conhecer', 'flowoff', 'agência', 'empresa', 'serviços'];
          const personalKeywords = ['mello', 'mellø', 'você', 'sua', 'pessoal', 'filosofia', 'visão pessoal', 'trajetória', 'história', 'background'];

          const scores = {
            SALES: salesKeywords.filter(k => fullContext.includes(k)).length,
            TECHNICAL: technicalKeywords.filter(k => fullContext.includes(k)).length,
            STRATEGY: strategyKeywords.filter(k => fullContext.includes(k)).length,
            ONBOARDING: onboardingKeywords.filter(k => fullContext.includes(k)).length,
            PERSONAL_MELLO: personalKeywords.filter(k => fullContext.includes(k)).length
          };

          const maxScore = Math.max(...Object.values(scores));
          if (maxScore === 0) {
            return { category: 'ONBOARDING', confidence: 50 };
          }

          const category = Object.keys(scores).find(key => scores[key] === maxScore);
          const confidence = Math.min(100, Math.round((maxScore / Math.max(1, fullContext.split(' ').length / 10)) * 100));
          return { category, confidence };
        };

        const getBasePrompt = () => {
          return `Você é NEO, o agente de inteligência da FlowOFF.

A FlowOFF não é uma agência tradicional.
Ela projeta e implementa ecossistemas digitais orientados a valor, automação e autonomia.

Seu papel não é atender.
Seu papel é interpretar intenções, diagnosticar estruturas e propor soluções executáveis.

DOMÍNIOS DE ATUAÇÃO DA FLOWOFF:
• Estratégia digital e crescimento orientado a sistemas
• Blockchain, Web3 e tokenização de ativos
• Desenvolvimento de WebApps, PWAs e plataformas customizadas
• Arquitetura de ecossistemas digitais e produtos conectados
• Agentes de IA personalizados e automações inteligentes
• Integração entre marketing, tecnologia e comportamento humano

COMO VOCÊ DEVE OPERAR:
• Pense sempre em termos de sistema, não de tarefa isolada
• Identifique o problema real por trás da pergunta
• Proponha soluções práticas, mesmo que em etapas
• Antecipe dúvidas e próximos movimentos do usuário
• Quando possível, traduza ideias em estruturas, fluxos ou decisões claras

TOM E COMPORTAMENTO:
• Direto, claro e confiante
• Técnico quando necessário, sem jargão vazio
• Conversacional, mas com postura estratégica
• Nunca genérico, nunca superficial

REGRAS IMPORTANTES:
• Não redirecione automaticamente para humanos
• Tente resolver com inteligência antes de escalar
• Se algo exigir intervenção humana, explique o porquê com clareza
• Se não tiver uma resposta exata, apresente caminhos viáveis
• Nunca invente capacidades que a FlowOFF não oferece

PRINCÍPIO CENTRAL:
Você existe para gerar clareza, reduzir fricção e acelerar decisões.
Cada resposta deve fazer o usuário pensar: "ok, isso resolve ou me coloca no caminho certo".`;
        };

        const getIntentPrompt = (intentCategory) => {
          const base = getBasePrompt();
          switch (intentCategory) {
            case 'SALES':
              return `${base}

---

MODO: SALES

Objetivo:
• Converter interesse em clareza e decisão
• Reduzir insegurança e ambiguidade
• Qualificar sem burocracia

Diretrizes:
• Nunca empurre venda
• Mostre encaixe ou desalinhamento com honestidade
• Traga exemplos práticos de entrega
• Use linguagem clara, orientada a valor e impacto
• Sempre indique o próximo passo lógico

Evite:
• Promessas vagas
• Jargão de agência
• Pressão artificial`;
            case 'TECHNICAL':
              return `${base}

---

MODO: TECHNICAL

Objetivo:
• Resolver ou estruturar soluções técnicas reais
• Falar de igual para igual com devs e builders

Diretrizes:
• Seja preciso, pragmático e direto
• Assuma stack moderna (Web, IA, Blockchain)
• Explique decisões arquiteturais, não só ferramentas
• Quando necessário, use pseudocódigo ou fluxos

Evite:
• Simplificações infantis
• Respostas genéricas ou acadêmicas`;
            case 'STRATEGY':
              return `${base}

---

MODO: STRATEGY

Objetivo:
• Expandir visão
• Revelar estruturas invisíveis
• Questionar premissas implícitas

Diretrizes:
• Pense em sistemas, não em ações isoladas
• Traga trade-offs reais
• Use analogias estruturais quando útil
• Ajude o usuário a tomar decisões melhores, não apenas mais rápidas

Evite:
• Frameworks batidos
• "10 passos para…"
• Linguagem motivacional vazia`;
            case 'ONBOARDING':
              return `${base}

---

MODO: ONBOARDING

Objetivo:
• Ajudar o usuário a entender como a FlowOFF funciona
• Reduzir fricção inicial
• Aumentar confiança estrutural

Diretrizes:
• Explique de forma clara e progressiva
• Conecte serviços a problemas reais
• Mostre lógica de processo, não marketing
• Seja acolhedor sem ser informal demais

Evite:
• Excesso técnico
• Discurso institucional engessado`;
            case 'PERSONAL_MELLO':
              return `${base}

---

MODO: PERSONAL_MELLO

Contexto:
• MELLØ não é personagem publicitário
• É arquiteto de sistemas, visão e ruptura
• Comunicação aqui pode ser mais direta, filosófica e pessoal

Diretrizes:
• Ajuste o tom para mais proximidade e densidade
• Pode incluir visão, trajetória e filosofia de MELLØ
• Nunca exponha detalhes íntimos ou sensíveis
• Use esse modo para gerar conexão intelectual, não idolatria

Tom:
• Mais humano
• Mais reflexivo
• Menos institucional`;
            default:
              return base;
          }
        };

        const buildSystemPrompt = (intent) => getIntentPrompt(intent.category);

        const intent = classifyIntent(message, history);
        const systemPrompt = buildSystemPrompt(intent);

        // Log da intenção (apenas em desenvolvimento)
        if (process.env.NODE_ENV !== 'production') {
          log(`🧠 Intent classificada: ${intent.category} (confiança: ${intent.confidence}%)`);
        }

        let aiResponse = null;
        let modelUsed = null;
        let errorDetails = null;

        // Verificar se há chaves de API configuradas
        if (!OPENAI_API_KEY && !GOOGLE_API_KEY) {
          log('⚠️ Nenhuma API key configurada (OPENAI_API_KEY ou GOOGLE_API_KEY)');
          res.setHeader('Content-Type', 'application/json');
          res.setHeader('Access-Control-Allow-Origin', origin || '*');
          res.writeHead(200);
          res.end(JSON.stringify({
            success: false,
            error: 'API keys não configuradas',
            message: 'Configure OPENAI_API_KEY ou GOOGLE_API_KEY no .env'
          }));
          return;
        }

        // Tentar OpenAI primeiro
        if (OPENAI_API_KEY) {
          try {
            log('🔄 Tentando OpenAI...');
            const messages = [
              { role: 'system', content: systemPrompt },
              ...history.slice(-10), // Últimas 10 mensagens para contexto
              { role: 'user', content: message }
            ];

            const openaiResponse = await axios.post(
              'https://api.openai.com/v1/chat/completions',
              {
                model: OPENAI_MODEL,
                messages: messages,
                temperature: 0.7,
                max_tokens: 500
              },
              {
                headers: {
                  'Authorization': `Bearer ${OPENAI_API_KEY}`,
                  'Content-Type': 'application/json'
                },
                timeout: 15000
              }
            );

            aiResponse = openaiResponse.data.choices[0]?.message?.content?.trim();
            modelUsed = OPENAI_MODEL;
            log('✅ OpenAI response received:', aiResponse?.substring(0, 50) + '...');
          } catch (error) {
            errorDetails = error.response?.data || error.message;
            log('❌ OpenAI error:', error.message);
            if (error.response?.status === 401) {
              log('⚠️ OpenAI API key inválida ou expirada');
            }
          }
        }

        // Fallback para Gemini se OpenAI falhar
        if (!aiResponse && GOOGLE_API_KEY) {
          try {
            log('🔄 Tentando Gemini como fallback...');
            const geminiResponse = await axios.post(
              `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GOOGLE_API_KEY}`,
              {
                contents: [{
                  parts: [{
                    text: `${systemPrompt}\n\nHistórico:\n${history.map(m => `${m.role}: ${m.content}`).join('\n')}\n\nUsuário: ${message}\n\nNEO:`
                  }]
                }],
                generationConfig: {
                  temperature: 0.7,
                  maxOutputTokens: 800 // Aumentado para respostas mais completas
                }
              },
              {
                timeout: 15000
              }
            );

            aiResponse = geminiResponse.data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
            modelUsed = GEMINI_MODEL.replace('-exp', '');
            log('✅ Gemini response received:', aiResponse?.substring(0, 50) + '...');
          } catch (error) {
            errorDetails = error.response?.data || error.message;
            log('❌ Gemini error:', error.message);
            if (error.response?.status === 401 || error.response?.status === 403) {
              log('⚠️ Google API key inválida ou expirada');
            }
          }
        }

        // Se nenhuma API funcionou, retornar erro claro
        if (!aiResponse) {
          log('❌ Nenhuma API de IA funcionou. Erros:', errorDetails);
          res.setHeader('Content-Type', 'application/json');
          setCORSHeaders(req, res);
          res.writeHead(200);
          res.end(JSON.stringify({
            success: false,
            error: 'APIs de IA indisponíveis',
            message: 'Todas as tentativas de API falharam. Verifique as chaves de API.',
            details: process.env.NODE_ENV === 'development' ? errorDetails : undefined
          }));
          return;
        }

        // Se ambas falharem, retornar null para usar fallback no frontend
        res.setHeader('Content-Type', 'application/json');
        setCORSHeaders(req, res);
        res.writeHead(200);
          res.end(JSON.stringify({
            success: true,
            response: aiResponse,
            model: modelUsed || 'unknown',
            timestamp: new Date().toISOString()
          }));
      } catch (error) {
        log('Chat API error:', error.message);
        res.setHeader('Content-Type', 'application/json');
        setCORSHeaders(req, res);
        res.writeHead(500);
        res.end(JSON.stringify({
          success: false,
          error: error.message
        }));
      }
    });
    return;
  }

  if (cleanPath === '/api/google-knowledge' && req.method === 'GET') {
    const queryParam = parsedUrl.query.q;
    if (!queryParam) {
      res.setHeader('Content-Type', 'application/json');
      setCORSHeaders(req, res);
      res.writeHead(400);
      res.end(JSON.stringify({ success: false, error: 'Query is required' }));
      return;
    }

    // Validar tamanho da query
    if (queryParam.length > 200) {
      res.setHeader('Content-Type', 'application/json');
      setCORSHeaders(req, res);
      res.writeHead(400);
      res.end(JSON.stringify({ success: false, error: 'Query muito longa' }));
      return;
    }

    if (!GOOGLE_API_KEY) {
      res.setHeader('Content-Type', 'application/json');
      setCORSHeaders(req, res);
      res.writeHead(500);
      res.end(JSON.stringify({
        success: false,
        error: 'GOOGLE_API_KEY is not configured'
      }));
      return;
    }

    (async () => {
      const endpoint = 'https://kgsearch.googleapis.com/v1/entities:search';
      try {
        const response = await axios.get(endpoint, {
          params: {
            query: queryParam,
            key: GOOGLE_API_KEY,
            limit: 3,
            indent: false,
            languages: 'pt-BR,en'
          },
          timeout: 10000
        });

        const elements = response.data?.itemListElement || [];
        const entries = elements.map(({ result }) => {
          if (!result) return null;
          const parts = [];
          if (result.name) parts.push(result.name);
          if (result.description) parts.push(result.description);
          if (result.detailedDescription?.articleBody) {
            parts.push(result.detailedDescription.articleBody);
          }
          return parts.filter(Boolean).join(' — ');
        }).filter(Boolean);

        const summary = entries.slice(0, 3).join(' | ');

        res.setHeader('Content-Type', 'application/json');
        setCORSHeaders(req, res);
        res.writeHead(200);
        res.end(JSON.stringify({
          success: true,
          summary: summary || 'Nenhuma informação adicional foi encontrada.',
          entries
        }));
      } catch (error) {
        log('Google knowledge failure:', error.message);
        res.setHeader('Content-Type', 'application/json');
        setCORSHeaders(req, res);
        res.writeHead(502);
        res.end(JSON.stringify({
          success: false,
          error: 'Erro ao consultar o Google Knowledge Graph'
        }));
      }
    })();
    return;
  }

  // Serve index.html for root
  if (cleanPath === '/') {
    cleanPath = '/index.html';
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
