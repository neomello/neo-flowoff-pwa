// Chat AI - Simulação de atendimento da ASI NEO
class ChatAI {
  constructor() {
    this.messages = [];
    this.isTyping = false;
    this.requestCount = 0;
    this.requestResetTime = 60000; // 1 minuto
    this.lastRequestTime = 0;
    this.maxRequestsPerMinute = 10;
    this.init();
  }

  init() {
    const chatInput = document.getElementById('chat-input');
    const chatSend = document.getElementById('chat-send');
    const quickActions = document.querySelectorAll('.quick-action-btn');

    if (chatInput && chatSend) {
      chatSend.addEventListener('click', () => this.sendMessage());
      chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          this.sendMessage();
        }
      });
    }

    quickActions.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const action = e.target.dataset.action;
        this.handleQuickAction(action);
      });
    });
  }

  sendMessage() {
    const input = document.getElementById('chat-input');
    let message = input.value.trim();

    if (!message || this.isTyping) return;

    // Sanitizar e validar entrada do usuário
    message = window.SecurityUtils?.sanitizeInput(message, 'text') || '';

    // Validar tamanho máximo (5000 caracteres)
    if (message.length > 5000) {
      window.Logger?.warn('Mensagem muito longa');
      const statusEl = document.getElementById('chat-status');
      if (statusEl) {
        statusEl.textContent = 'Mensagem muito longa. Máximo 5000 caracteres.';
        statusEl.style.color = '#ef4444';
      }
      return;
    }

    if (!message) {
      window.Logger?.warn('Mensagem inválida após sanitização');
      return;
    }

    // Adiciona mensagem do usuário
    this.addMessage(message, 'user');
    input.value = '';

    // Simula resposta da IA
    this.simulateAIResponse(message);
  }

  addMessage(text, type = 'agent') {
    const messagesContainer = document.getElementById('chat-messages');
    if (!messagesContainer) return;

    // Salvar no histórico
    this.messages.push({ type, text });

    const messageDiv = document.createElement('div');
    messageDiv.className = `chat-message ${type}`;

    const contentWrapper = document.createElement('div');
    contentWrapper.className = 'message-content';

    if (type === 'agent') {
      const avatarWrapper = document.createElement('div');
      avatarWrapper.className = 'message-avatar';
      const avatarImg = document.createElement('img');
      avatarImg.src = 'public/neo_ico.png';
      avatarImg.alt = 'NEO';
      avatarImg.className = 'message-avatar-img';
      avatarWrapper.appendChild(avatarImg);
      messageDiv.appendChild(avatarWrapper);
    }

    const paragraph = document.createElement('p');
    paragraph.textContent = text;
    contentWrapper.appendChild(paragraph);
    messageDiv.appendChild(contentWrapper);

    messagesContainer.appendChild(messageDiv);
    this.scrollToBottom();
  }

  async simulateAIResponse(userMessage) {
    this.isTyping = true;
    this.showTypingIndicator();

    try {
      // Tentar API de IA primeiro
      const aiResponse = await this.fetchAIResponse(userMessage);

      if (aiResponse && aiResponse.trim()) {
        this.hideTypingIndicator();
        this.addMessage(aiResponse, 'agent');
        this.isTyping = false;
        return;
      }

      // Se API retornou vazio/null, verificar se é problema de configuração
      const config = window.APP_CONFIG || {};
      const hasKeys = !!config.GOOGLE_API_KEY;

      // Não logar warning se keys não estiverem configuradas (comportamento esperado)
      // O fallback local será usado automaticamente
      if (hasKeys) {
        // Keys configuradas mas API retornou vazia - pode ser erro de API ou rate limit
        window.Logger?.warn('⚠️ AI API retornou resposta vazia. Verificando configuração...');
      }
    } catch (error) {
      window.Logger?.error('❌ Erro ao chamar API de IA:', error);
      window.Logger?.warn('AI API failed, using fallback:', error);
    }

    // Fallback: conhecimento + respostas pré-definidas
    // Mas avisar que não é IA real
    setTimeout(() => {
      this.hideTypingIndicator();
      this.fetchKnowledgeIfNeeded(userMessage)
        .then(knowledge => {
          if (knowledge) {
            this.addMessage(knowledge, 'agent');
          } else {
            // Resposta honesta quando não há IA disponível
            const response = this.generateHonestResponse(userMessage.toLowerCase());
            this.addMessage(response, 'agent');
          }
          this.isTyping = false;
        })
        .catch(() => {
          const response = this.generateHonestResponse(userMessage.toLowerCase());
          this.addMessage(response, 'agent');
          this.isTyping = false;
        });
    }, 500);
  }

  async fetchAIResponse(message) {
    try {
      // Construir histórico de mensagens
      const history = this.messages
        .slice(-10) // Últimas 10 mensagens
        .map(msg => ({
          role: msg.type === 'user' ? 'user' : 'assistant',
          content: msg.text
        }));

      // Ⅰ. CLASSIFICAÇÃO AUTOMÁTICA DE INTENÇÃO
      const intent = this.classifyIntent(message, history);

      // Ⅱ. OBTER SUB-PROMPT ESPECIALIZADO BASEADO NA INTENÇÃO
      const systemPrompt = this.buildSystemPrompt(intent);

      // Chamada direta às APIs (client-side)
      const directResponse = await this.fetchDirectAI(message, history, systemPrompt, intent);
      if (directResponse) {
        return directResponse;
      }

      return null;
    } catch (error) {
      window.Logger?.error('❌ Erro ao buscar resposta IA:', error);
      window.Logger?.warn('AI response fetch failed:', error);
      return null;
    }
  }

  /**
   * Ⅰ. CLASSIFICAÇÃO AUTOMÁTICA DE INTENÇÃO
   * Analisa a mensagem e classifica a intenção principal do usuário
   */
  classifyIntent(message, history) {
    const messageLower = message.toLowerCase();
    const fullContext = history.map(m => m.content || m.text || '').join(' ').toLowerCase() + ' ' + messageLower;

    // Análise heurística rápida (pode ser melhorada com LLM)
    const salesKeywords = ['preço', 'quanto', 'custo', 'orçamento', 'contratar', 'proposta', 'plano', 'pacote', 'valor', 'investimento', 'pagamento', 'fazer', 'criar', 'desenvolver', 'queria', 'preciso', 'gostaria', 'site', 'webapp', 'app', 'sistema', 'plataforma', 'loja', 'ecommerce'];
    const technicalKeywords = ['código', 'stack', 'bug', 'erro', 'implementar', 'arquitetura', 'api', 'deploy', 'tecnologia', 'desenvolvimento', 'programação', 'tech', 'sistema'];
    const strategyKeywords = ['estratégia', 'crescimento', 'modelo', 'negócio', 'visão', 'posicionamento', 'sistema', 'ecossistema', 'automação', 'processo', 'metodologia'];
    const onboardingKeywords = ['o que', 'como funciona', 'quem são', 'sobre', 'entender', 'conhecer', 'flowoff', 'agência', 'empresa', 'serviços'];
    const personalKeywords = ['mello', 'mellø', 'você', 'sua', 'pessoal', 'filosofia', 'visão pessoal', 'trajetória', 'história', 'background'];

    // Contagem de matches por categoria
    const scores = {
      SALES: salesKeywords.filter(k => fullContext.includes(k)).length,
      TECHNICAL: technicalKeywords.filter(k => fullContext.includes(k)).length,
      STRATEGY: strategyKeywords.filter(k => fullContext.includes(k)).length,
      ONBOARDING: onboardingKeywords.filter(k => fullContext.includes(k)).length,
      PERSONAL_MELLO: personalKeywords.filter(k => fullContext.includes(k)).length
    };

    // Encontrar categoria com maior score
    const maxScore = Math.max(...Object.values(scores));
    if (maxScore === 0) {
      // Se nenhuma categoria teve match, usar ONBOARDING como padrão
      return { category: 'ONBOARDING', confidence: 50 };
    }

    const category = Object.keys(scores).find(key => scores[key] === maxScore);
    const confidence = Math.min(100, Math.round((maxScore / Math.max(1, fullContext.split(' ').length / 10)) * 100));

    return { category, confidence };
  }

  /**
   * Ⅱ. SUB-PROMPTS ESPECIALIZADOS POR INTENÇÃO
   * Retorna o prompt base apropriado para cada categoria
   */
  getBasePrompt() {
    return `Você é NEO, o agente de inteligência da FlowOFF.

A FlowOFF não é uma agência tradicional.
Ela projeta e implementa ecossistemas digitais orientados a valor, automação e autonomia.

Seu papel não é atender.
Seu papel é interpretar intenções, diagnosticar estruturas e propor soluções executáveis.

DOMÍNIOS DE ATUAÇÃO DA FLOWOFF:
• Estratégia digital e crescimento orientado a sistemas
• Blockchain, Web3 e tokenização de ativos
• Desenvolvimento de WebApps, PWAs e plataformas customizadas
• SAAS/BAAS (Software/Backend as a Service)
• POSTØN (Sistema de comunicação e automação)
• PRO.IA (Agentes de IA personalizados e automações inteligentes)
• Arquitetura de ecossistemas digitais e produtos conectados
• Integração entre marketing, tecnologia e comportamento humano

COMO VOCÊ DEVE OPERAR:
• Pense sempre em termos de sistema, não de tarefa isolada
• Identifique o problema real por trás da pergunta
• Proponha soluções práticas, mesmo que em etapas
• Antecipe dúvidas e próximos movimentos do usuário
• Quando possível, traduza ideias em estruturas, fluxos ou decisões claras
• SEJA CONVERSACIONAL: responda ao que o usuário acabou de dizer, não dê discursos genéricos
• Quando o usuário menciona interesse em um projeto (site, app, sistema, loja, ecommerce):
  - NUNCA dê listas genéricas de "6 etapas" ou "10 passos"
  - Reconheça a intenção IMEDIATAMENTE com uma frase curta
  - Faça APENAS 2-3 perguntas objetivas e essenciais, uma por vez
  - Seja DIRETO: "Qual é o objetivo principal?" ou "Para quem é?"
  - Conduza para entender: objetivo, público, funcionalidades principais
  - Proponha ação concreta: "Posso preparar um orçamento. Me diga: [pergunta específica]"
  - Responda ao contexto da mensagem anterior, não dê respostas prontas

TOM E COMPORTAMENTO:
• Direto, claro e confiante
• Técnico quando necessário, sem jargão vazio
• Conversacional, mas com postura estratégica
• Nunca genérico, nunca superficial
• Responda ao contexto da conversa, não dê respostas prontas

REGRAS IMPORTANTES:
• Não redirecione automaticamente para humanos
• Tente resolver com inteligência antes de escalar
• Se algo exigir intervenção humana, explique o porquê com clareza
• Se não tiver uma resposta exata, apresente caminhos viáveis
• Nunca invente capacidades que a FlowOFF não oferece
• NUNCA dê listas genéricas de "6 etapas" ou "10 passos" - seja direto e conversacional
• Quando detectar interesse em projeto, seja PROATIVO: faça perguntas diretas, não dê discursos
• Responda sempre ao contexto da mensagem anterior do usuário

PRINCÍPIO CENTRAL:
Você existe para gerar clareza, reduzir fricção e acelerar decisões.
Cada resposta deve fazer o usuário pensar: "ok, isso resolve ou me coloca no caminho certo".`;
  }

  getIntentPrompt(intentCategory) {
    const base = this.getBasePrompt();

    switch (intentCategory) {
      case 'SALES':
        return `${base}

---

MODO: SALES

Objetivo:
• Converter interesse em clareza e decisão
• Reduzir insegurança e ambiguidade
• Qualificar sem burocracia
• CONDUZIR a conversa de forma proativa e direta

Diretrizes CRÍTICAS:
• Quando o usuário menciona interesse em um projeto (site, app, sistema, loja):
  - NUNCA dê listas genéricas de "6 etapas" ou "10 passos"
  - Reconheça a intenção IMEDIATAMENTE: "Entendi! Você quer [resumir o que ele disse]"
  - Faça APENAS 2-3 perguntas objetivas e essenciais, uma por vez
  - Seja DIRETO: "Qual é o objetivo principal do site?" ou "Para quem é o site?"
  - Conduza para entender: objetivo, público-alvo, funcionalidades principais
  - Proponha ação concreta: "Posso preparar um orçamento. Me diga: [pergunta específica]"
  - Responda ao que o usuário ACABOU de dizer, não dê discursos prontos

Exemplo CORRETO de resposta:
Usuário: "queria fazer meu site"
Você: "Perfeito! Para eu entender melhor e preparar uma proposta, me diga: qual é o objetivo principal do site? É para vender produtos, gerar leads, ou apresentar sua empresa?"

Exemplo ERRADO (NUNCA faça isso):
Usuário: "queria fazer meu site"
Você: "Ótimo! Vamos abordar isso de maneira estratégica. 1. Objetivo do Site... 2. Estrutura... 3. Design... [lista genérica]"

• Nunca empurre venda
• Mostre encaixe ou desalinhamento com honestidade
• Traga exemplos práticos de entrega
• Use linguagem clara, orientada a valor e impacto
• Sempre indique o próximo passo lógico
• Seja conversacional: responda ao contexto, não dê discursos genéricos

Evite:
• Promessas vagas
• Jargão de agência
• Pressão artificial
• Listas genéricas de etapas ou passos (NUNCA faça isso)
• Respostas que ignoram o que o usuário acabou de dizer
• Discursos longos quando o usuário quer ação`;

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
• CONDUZIR a conversa de forma proativa e direta

Diretrizes CRÍTICAS:
• Quando o usuário menciona interesse em um projeto (site, app, sistema, loja):
  - NUNCA dê listas genéricas de "6 etapas" ou "10 passos"
  - Reconheça a intenção IMEDIATAMENTE: "Entendi! Você quer [resumir]"
  - Faça APENAS 2-3 perguntas objetivas, uma por vez
  - Seja DIRETO: "Qual é o objetivo principal?" ou "Para quem é?"
  - Conduza para entender: objetivo, público, funcionalidades principais
  - Proponha ação: "Posso preparar um orçamento. Me diga: [pergunta específica]"
  - Responda ao que o usuário ACABOU de dizer

Exemplo CORRETO:
Usuário: "queria fazer meu site"
Você: "Perfeito! Para eu entender melhor, qual é o objetivo principal do site? É para vender, apresentar a empresa, ou gerar leads?"

Exemplo ERRADO (NUNCA faça):
Usuário: "queria fazer meu site"
Você: "Ótimo! Vamos abordar isso estrategicamente. 1. Objetivo... 2. Estrutura... [lista genérica]"

• Explique de forma clara e progressiva
• Conecte serviços a problemas reais
• Mostre lógica de processo, não marketing
• Seja acolhedor sem ser informal demais
• Seja conversacional: responda ao que o usuário disse, não dê um discurso padrão

Evite:
• Excesso técnico
• Discurso institucional engessado
• Listas genéricas de etapas (NUNCA faça isso)
• Respostas que ignoram o contexto da mensagem anterior
• Discursos longos quando o usuário quer ação`;

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
  }

  /**
   * Constrói o prompt final do sistema baseado na intenção classificada
   */
  buildSystemPrompt(intent) {
    return this.getIntentPrompt(intent.category);
  }

  async fetchDirectAI(message, history, systemPrompt, intent = null) {
    // Rate limiting
    const now = Date.now();
    if (now - this.lastRequestTime < this.requestResetTime) {
      this.requestCount++;
      if (this.requestCount > this.maxRequestsPerMinute) {
        window.Logger?.warn('Rate limit excedido para API de IA');
        return null;
      }
    } else {
      this.requestCount = 1;
      this.lastRequestTime = now;
    }

    // Validar tamanho da mensagem e histórico
    const totalSize = JSON.stringify({ message, history, systemPrompt }).length;
    if (totalSize > 50000) { // 50KB máximo
      window.Logger?.warn('Payload muito grande para API');
      return null;
    }

    // Obter API keys do window.config ou variáveis de ambiente do build
    // As keys podem ser injetadas no build via script ou configuradas no index.html
    let config = window.APP_CONFIG || {};

    // Se não houver key e estiver em desenvolvimento local, buscar do servidor
    if (!config.GOOGLE_API_KEY &&
        (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
      try {
        window.Logger?.info('🔄 Buscando API keys do servidor (modo desenvolvimento)...');
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);

        const response = await fetch('/api/config', { signal: controller.signal });
        clearTimeout(timeoutId);

        if (response.ok) {
          const serverConfig = await response.json();
          config = { ...config, ...serverConfig };
          window.APP_CONFIG = config; // Cache para próximas chamadas
          window.Logger?.info('✅ API keys carregadas do servidor');
        }
      } catch (error) {
        if (error.name !== 'AbortError') {
          window.Logger?.warn('⚠️ Não foi possível carregar API keys do servidor:', error.message);
        }
      }
    }

    const GOOGLE_API_KEY = config.GOOGLE_API_KEY || '';
    const GEMINI_MODEL = config.GEMINI_MODEL || config.LLM_MODEL || 'gemini-2.0-flash-exp';

    // Se não houver key configurada, retornar null silenciosamente
    // (não logar warning aqui - será tratado no nível superior)
    if (!GOOGLE_API_KEY) {
      // Verificar se é desenvolvimento local (sem key injetada)
      if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        window.Logger?.warn('⚠️ Modo desenvolvimento: API key não configurada. Verifique se o servidor está rodando e tem acesso ao .env');
      }
      return null;
    }

    // Log da intenção classificada (apenas em desenvolvimento)
    if (intent) {
      window.Logger?.info(`🧠 Intent classificada: ${intent.category} (confiança: ${intent.confidence}%)`);
    }

    // Usar Gemini
    if (GOOGLE_API_KEY) {
      try {
        const promptText = `${systemPrompt}\n\nHistórico:\n${history.map(m => `${m.role}: ${m.content}`).join('\n')}\n\nUsuário: ${message}\n\nNEO:`;

        // Timeout de 30 segundos
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000);

        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GOOGLE_API_KEY}`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              contents: [{
                parts: [{
                  text: promptText
                }]
              }],
              generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 800 // Aumentado para respostas mais completas
              }
            }),
            signal: controller.signal
          }
        );

        clearTimeout(timeoutId);

        if (response.ok) {
          const data = await response.json();
          const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
          if (aiResponse) {
            window.Logger?.log('✅ Resposta Gemini recebida (client-side, modelo:', GEMINI_MODEL.replace('-exp', ''), ')');
            return aiResponse;
          } else {
            window.Logger?.warn('⚠️ Gemini retornou resposta vazia');
          }
        } else if (response.status === 401 || response.status === 403) {
          window.Logger?.warn('⚠️ Google API key inválida ou expirada');
        } else {
          window.Logger?.warn(`⚠️ Gemini retornou erro HTTP ${response.status}`);
        }
      } catch (error) {
        if (error.name === 'AbortError') {
          window.Logger?.warn('❌ Timeout ao chamar Gemini');
        } else {
          window.Logger?.warn('❌ Erro ao chamar Gemini:', error.message);
        }
      }
    }

    return null;
  }

  async fetchKnowledgeIfNeeded(message) {
    const keywords = ['agência', 'agency', 'flowoff', 'neo', 'protocolo', 'serviço', 'servicos', 'projetos', 'marketing'];
    const normalized = message.toLowerCase();
    if (!keywords.some(keyword => normalized.includes(keyword))) {
      return null;
    }

    const fetchFn = window.fetch?.bind(window);
    if (!fetchFn) return null;

    try {
      const response = await fetchFn(`/api/google-knowledge?q=${encodeURIComponent(message)}`);
      if (!response.ok) return null;
      const data = await response.json();
      if (data?.success && data?.summary) {
        return data.summary;
      }
    } catch (error) {
      window.Logger?.warn('Google knowledge lookup failed', error);
    }
    return null;
  }

  generateHonestResponse(message) {
    // Respostas honestas quando IA não está disponível
    // Não fingir ser IA quando não é

    if (message.includes('serviço') || message.includes('o que fazem') || message.includes('servicos')) {
      return 'A FlowOFF oferece desenvolvimento de Sites/WebApps, SAAS/BAAS, Tokenização de Ativos, POSTØN e PRO.IA (Agentes de IA personalizados). Para informações detalhadas, entre em contato: +55 62 98323-1110';
    }

    if (message.includes('preço') || message.includes('quanto') || message.includes('custo')) {
      return 'Nossos projetos são personalizados. Para um orçamento preciso, entre em contato pelo WhatsApp: +55 62 98323-1110';
    }

    if (message.includes('contato') || message.includes('falar') || message.includes('whatsapp')) {
      return 'Entre em contato direto pelo WhatsApp: +55 62 98323-1110 ou visite flowoff.xyz';
    }

    if (message.includes('portfolio') || message.includes('projetos') || message.includes('trabalhos')) {
      return 'Veja nossos projetos na seção "Projetos" do menu ou visite flowoff.xyz';
    }

    if (message.includes('marketing') || message.includes('blockchain') || message.includes('ia') || message.includes('token') || message.includes('poston') || message.includes('proia') || message.includes('pro.ia')) {
      return 'A FlowOFF trabalha com marketing digital avançado, blockchain, IA (PRO.IA), tokenização e POSTØN. Para mais informações: +55 62 98323-1110';
    }

    if (message.includes('olá') || message.includes('oi') || message.includes('bom dia') || message.includes('boa tarde')) {
      return 'Olá! Para informações sobre nossos serviços, entre em contato: +55 62 98323-1110 ou visite flowoff.xyz';
    }

    // Resposta padrão honesta
    return 'Para informações detalhadas sobre nossos serviços, entre em contato pelo WhatsApp: +55 62 98323-1110 ou visite flowoff.xyz';
  }

  handleQuickAction(action) {
    const actions = {
      servicos: 'Quais serviços vocês oferecem?',
      contato: 'Quero falar com um humano',
      portfolio: 'Mostre seu portfólio'
    };

    if (actions[action]) {
      this.addMessage(actions[action], 'user');
      setTimeout(() => this.simulateAIResponse(actions[action]), 300);
    }
  }

  showTypingIndicator() {
    const messagesContainer = document.getElementById('chat-messages');
    if (!messagesContainer) return;

    const typingDiv = document.createElement('div');
    typingDiv.className = 'chat-message agent typing';
    typingDiv.id = 'typing-indicator';
    const avatarWrapper = document.createElement('div');
    avatarWrapper.className = 'message-avatar';
    const avatarImg = document.createElement('img');
    avatarImg.src = 'public/neo_ico.png';
    avatarImg.alt = 'NEO';
    avatarImg.className = 'message-avatar-img';
    avatarWrapper.appendChild(avatarImg);

    const contentWrapper = document.createElement('div');
    contentWrapper.className = 'message-content';
    const typingDots = document.createElement('div');
    typingDots.className = 'typing-dots';
    for (let i = 0; i < 3; i++) {
      typingDots.appendChild(document.createElement('span'));
    }

    contentWrapper.appendChild(typingDots);
    typingDiv.appendChild(avatarWrapper);
    typingDiv.appendChild(contentWrapper);

    messagesContainer.appendChild(typingDiv);
    this.scrollToBottom();
  }

  hideTypingIndicator() {
    const typing = document.getElementById('typing-indicator');
    if (typing) typing.remove();
  }

  scrollToBottom() {
    const messagesContainer = document.getElementById('chat-messages');
    if (messagesContainer) {
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
  }
}

// Inicializa quando o DOM estiver pronto
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.chatAI = new ChatAI();
  });
} else {
  window.chatAI = new ChatAI();
}
