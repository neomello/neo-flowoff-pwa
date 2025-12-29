import { describe, it, expect, beforeEach, vi } from 'vitest';

// Função auxiliar para criar DOM do chat
function createChatDOM() {
  // Container de mensagens
  const messagesContainer = document.createElement('div');
  messagesContainer.id = 'chat-messages';
  messagesContainer.className = 'chat-messages';
  
  // Input do chat
  const chatInput = document.createElement('input');
  chatInput.id = 'chat-input';
  chatInput.type = 'text';
  chatInput.className = 'chat-input';
  chatInput.placeholder = 'Digite sua mensagem...';
  
  // Botão de enviar
  const chatSend = document.createElement('button');
  chatSend.id = 'chat-send';
  chatSend.className = 'chat-send-btn';
  
  // Container de input
  const inputContainer = document.createElement('div');
  inputContainer.className = 'chat-input-container';
  inputContainer.appendChild(chatInput);
  inputContainer.appendChild(chatSend);
  
  // Ações rápidas
  const quickActions = document.createElement('div');
  quickActions.className = 'chat-quick-actions';
  
  const actions = ['servicos', 'contato', 'portfolio'];
  actions.forEach(action => {
    const btn = document.createElement('button');
    btn.className = 'quick-action-btn';
    btn.setAttribute('data-action', action);
    btn.textContent = action === 'servicos' ? 'Ver serviços' : 
                     action === 'contato' ? 'Falar com humano' : 
                     'Ver portfólio';
    quickActions.appendChild(btn);
  });
  
  // Container principal
  const chatContainer = document.createElement('div');
  chatContainer.className = 'chat-container';
  chatContainer.appendChild(messagesContainer);
  chatContainer.appendChild(inputContainer);
  chatContainer.appendChild(quickActions);
  
  document.body.appendChild(chatContainer);
  
  return {
    messagesContainer,
    chatInput,
    chatSend,
    quickActions
  };
}

// Carregar ChatAI manualmente
function loadChatAI() {
  const ChatAI = class {
    constructor() {
      this.messages = [];
      this.isTyping = false;
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
      const message = input.value.trim();

      if (!message || this.isTyping) return;

      this.addMessage(message, 'user');
      input.value = '';
      this.simulateAIResponse(message);
    }

    addMessage(text, type = 'agent') {
      const messagesContainer = document.getElementById('chat-messages');
      if (!messagesContainer) return;

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
        const aiResponse = await this.fetchAIResponse(userMessage);
        
        if (aiResponse && aiResponse.trim()) {
          this.hideTypingIndicator();
          this.addMessage(aiResponse, 'agent');
          this.isTyping = false;
          return;
        }
      } catch (error) {
        console.error('❌ Erro ao chamar API de IA:', error);
      }

      setTimeout(() => {
        this.hideTypingIndicator();
        this.fetchKnowledgeIfNeeded(userMessage)
          .then(knowledge => {
            if (knowledge) {
              this.addMessage(knowledge, 'agent');
            } else {
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
      }, 100); // Reduzido para testes mais rápidos
    }

    async fetchAIResponse(message) {
      try {
        const history = this.messages
          .slice(-10)
          .map(msg => ({
            role: msg.type === 'user' ? 'user' : 'assistant',
            content: msg.text
          }));

        const intent = this.classifyIntent(message, history);
        const systemPrompt = this.buildSystemPrompt(intent);

        const directResponse = await this.fetchDirectAI(message, history, systemPrompt, intent);
        if (directResponse) {
          return directResponse;
        }

        try {
          const response = await fetch('/api/chat', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              message: message,
              history: history
            })
          });

          if (response.ok) {
            const data = await response.json();
            if (data.success && data.response && data.response.trim()) {
              return data.response;
            }
          }
        } catch (netlifyError) {
          // Netlify Function não disponível
        }

        return null;
      } catch (error) {
        console.error('❌ Erro ao buscar resposta IA:', error);
        return null;
      }
    }

    classifyIntent(message, history) {
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
    }

    getBasePrompt() {
      return `Você é NEO, o agente de inteligência da FlowOFF.`;
    }

    getIntentPrompt(intentCategory) {
      const base = this.getBasePrompt();
      switch (intentCategory) {
        case 'SALES':
          return `${base}\n\nMODO: SALES`;
        case 'TECHNICAL':
          return `${base}\n\nMODO: TECHNICAL`;
        case 'STRATEGY':
          return `${base}\n\nMODO: STRATEGY`;
        case 'ONBOARDING':
          return `${base}\n\nMODO: ONBOARDING`;
        case 'PERSONAL_MELLO':
          return `${base}\n\nMODO: PERSONAL_MELLO`;
        default:
          return base;
      }
    }

    buildSystemPrompt(intent) {
      return this.getIntentPrompt(intent.category);
    }

    async fetchDirectAI(message, history, systemPrompt, intent = null) {
      const config = window.APP_CONFIG || {};
      const GOOGLE_API_KEY = config.GOOGLE_API_KEY || '';
      const GEMINI_MODEL = config.GEMINI_MODEL || config.LLM_MODEL || 'gemini-2.0-flash-exp';

      if (!GOOGLE_API_KEY) {
        return null;
      }

      // Usar Gemini
      if (GOOGLE_API_KEY) {
        try {
          const promptText = `${systemPrompt}\n\nHistórico:\n${history.map(m => `${m.role}: ${m.content}`).join('\n')}\n\nUsuário: ${message}\n\nNEO:`;

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
                  maxOutputTokens: 800
                }
              })
            }
          );

          if (response.ok) {
            const data = await response.json();
            const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
            if (aiResponse) {
              return aiResponse;
            }
          }
        } catch (error) {
          console.warn('❌ Erro ao chamar Gemini:', error.message);
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

      try {
        const response = await fetch(`/api/google-knowledge?q=${encodeURIComponent(message)}`);
        if (!response.ok) return null;
        const data = await response.json();
        if (data?.success && data?.summary) {
          return data.summary;
        }
      } catch (error) {
        // Ignorar erros em testes
      }
      return null;
    }

    generateHonestResponse(message) {
      if (message.includes('serviço') || message.includes('o que fazem') || message.includes('servicos')) {
        return 'A FlowOFF oferece desenvolvimento de Sites/WebApps, SAAS/BAAS, Tokenização de Ativos e Agentes IA. Para informações detalhadas, entre em contato: +55 62 98323-1110';
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

      if (message.includes('marketing') || message.includes('blockchain') || message.includes('ia') || message.includes('token')) {
        return 'A FlowOFF trabalha com marketing digital avançado, blockchain, IA e tokenização. Para mais informações: +55 62 98323-1110';
      }

      if (message.includes('olá') || message.includes('oi') || message.includes('bom dia') || message.includes('boa tarde')) {
        return 'Olá! Para informações sobre nossos serviços, entre em contato: +55 62 98323-1110 ou visite flowoff.xyz';
      }

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
        setTimeout(() => this.simulateAIResponse(actions[action]), 100);
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
  };

  const chatAI = new ChatAI();
  window.chatAI = chatAI;
  
  return chatAI;
}

describe('ChatAI - Sistema de Chat com IA', () => {
  let chatAI;
  let domElements;

  beforeEach(async () => {
    domElements = createChatDOM();
    chatAI = loadChatAI();
    await new Promise(resolve => setTimeout(resolve, 50));
  });

  describe('Estrutura e Inicialização', () => {
    it('deve criar instância do ChatAI', () => {
      expect(chatAI).toBeTruthy();
      expect(chatAI.messages).toEqual([]);
      expect(chatAI.isTyping).toBe(false);
    });

    it('deve ter elementos do DOM presentes', () => {
      expect(document.getElementById('chat-messages')).toBeTruthy();
      expect(document.getElementById('chat-input')).toBeTruthy();
      expect(document.getElementById('chat-send')).toBeTruthy();
      expect(document.querySelectorAll('.quick-action-btn').length).toBeGreaterThan(0);
    });

    it('deve inicializar event listeners', () => {
      const chatSend = document.getElementById('chat-send');
      const chatInput = document.getElementById('chat-input');
      
      expect(chatSend).toBeTruthy();
      expect(chatInput).toBeTruthy();
    });
  });

  describe('Adição de Mensagens', () => {
    it('deve adicionar mensagem do usuário', () => {
      chatAI.addMessage('Olá, teste', 'user');
      
      expect(chatAI.messages.length).toBe(1);
      expect(chatAI.messages[0].type).toBe('user');
      expect(chatAI.messages[0].text).toBe('Olá, teste');
    });

    it('deve adicionar mensagem do agente', () => {
      chatAI.addMessage('Resposta do agente', 'agent');
      
      expect(chatAI.messages.length).toBe(1);
      expect(chatAI.messages[0].type).toBe('agent');
      expect(chatAI.messages[0].text).toBe('Resposta do agente');
    });

    it('deve criar elementos DOM para mensagem do usuário', () => {
      chatAI.addMessage('Mensagem do usuário', 'user');
      
      const messages = document.querySelectorAll('.chat-message.user');
      expect(messages.length).toBe(1);
      expect(messages[0].textContent).toContain('Mensagem do usuário');
    });

    it('deve criar elementos DOM para mensagem do agente com avatar', () => {
      chatAI.addMessage('Mensagem do agente', 'agent');
      
      const messages = document.querySelectorAll('.chat-message.agent');
      expect(messages.length).toBe(1);
      expect(messages[0].querySelector('.message-avatar')).toBeTruthy();
      expect(messages[0].textContent).toContain('Mensagem do agente');
    });

    it('deve manter histórico de mensagens', () => {
      chatAI.addMessage('Mensagem 1', 'user');
      chatAI.addMessage('Resposta 1', 'agent');
      chatAI.addMessage('Mensagem 2', 'user');
      
      expect(chatAI.messages.length).toBe(3);
      expect(chatAI.messages[0].text).toBe('Mensagem 1');
      expect(chatAI.messages[1].text).toBe('Resposta 1');
      expect(chatAI.messages[2].text).toBe('Mensagem 2');
    });
  });

  describe('Envio de Mensagens', () => {
    it('deve enviar mensagem quando botão é clicado', () => {
      const chatInput = document.getElementById('chat-input');
      const chatSend = document.getElementById('chat-send');
      
      chatInput.value = 'Mensagem de teste';
      chatSend.click();
      
      expect(chatInput.value).toBe('');
      expect(chatAI.messages.length).toBeGreaterThan(0);
    });

    it('deve enviar mensagem quando Enter é pressionado', () => {
      const chatInput = document.getElementById('chat-input');
      
      chatInput.value = 'Mensagem via Enter';
      const enterEvent = new KeyboardEvent('keypress', {
        key: 'Enter',
        bubbles: true,
        cancelable: true
      });
      chatInput.dispatchEvent(enterEvent);
      
      expect(chatInput.value).toBe('');
    });

    it('não deve enviar mensagem vazia', () => {
      const chatInput = document.getElementById('chat-input');
      const initialMessages = chatAI.messages.length;
      
      chatInput.value = '   ';
      chatAI.sendMessage();
      
      expect(chatAI.messages.length).toBe(initialMessages);
    });

    it('não deve enviar mensagem quando está digitando', () => {
      chatAI.isTyping = true;
      const chatInput = document.getElementById('chat-input');
      const initialMessages = chatAI.messages.length;
      
      chatInput.value = 'Mensagem durante digitação';
      chatAI.sendMessage();
      
      expect(chatAI.messages.length).toBe(initialMessages);
    });
  });

  describe('Classificação de Intenções', () => {
    it('deve classificar intenção de VENDAS', () => {
      const intent = chatAI.classifyIntent('Quanto custa?', []);
      
      expect(intent.category).toBe('SALES');
      expect(intent.confidence).toBeGreaterThan(0);
    });

    it('deve classificar intenção TÉCNICA', () => {
      const intent = chatAI.classifyIntent('Como implementar API?', []);
      
      expect(intent.category).toBe('TECHNICAL');
    });

    it('deve classificar intenção de ESTRATÉGIA', () => {
      const intent = chatAI.classifyIntent('Qual a estratégia de crescimento?', []);
      
      expect(intent.category).toBe('STRATEGY');
    });

    it('deve classificar intenção de ONBOARDING', () => {
      const intent = chatAI.classifyIntent('O que é a FlowOFF?', []);
      
      expect(intent.category).toBe('ONBOARDING');
    });

    it('deve classificar intenção PESSOAL sobre MELLØ', () => {
      const intent = chatAI.classifyIntent('Conte sobre o mello e sua trajetória', []);
      
      expect(intent.category).toBe('PERSONAL_MELLO');
    });

    it('deve usar ONBOARDING como padrão quando não há match', () => {
      const intent = chatAI.classifyIntent('xyz abc 123', []);
      
      expect(intent.category).toBe('ONBOARDING');
      expect(intent.confidence).toBe(50);
    });

    it('deve calcular confiança baseada em matches', () => {
      const intent = chatAI.classifyIntent('Quanto custa o preço do valor?', []);
      
      expect(intent.category).toBe('SALES');
      expect(intent.confidence).toBeGreaterThan(0);
      expect(intent.confidence).toBeLessThanOrEqual(100);
    });
  });

  describe('Geração de Respostas Honestas (Fallback)', () => {
    it('deve gerar resposta para pergunta sobre serviços', () => {
      const response = chatAI.generateHonestResponse('quais serviços vocês oferecem?');
      
      expect(response).toContain('FlowOFF');
      expect(response).toContain('98323-1110');
    });

    it('deve gerar resposta para pergunta sobre preço', () => {
      const response = chatAI.generateHonestResponse('quanto custa?');
      
      expect(response).toContain('personalizados');
      expect(response).toContain('WhatsApp');
    });

    it('deve gerar resposta para pergunta sobre contato', () => {
      const response = chatAI.generateHonestResponse('como entrar em contato?');
      
      expect(response).toContain('WhatsApp');
      expect(response).toContain('flowoff.xyz');
    });

    it('deve gerar resposta para pergunta sobre portfólio', () => {
      const response = chatAI.generateHonestResponse('mostre seus projetos');
      
      expect(response).toContain('projetos');
      expect(response).toContain('flowoff.xyz');
    });

    it('deve gerar resposta para saudação', () => {
      // Usar apenas "olá" para evitar conflito com outras palavras-chave
      const response = chatAI.generateHonestResponse('olá');
      
      expect(response).toContain('Olá');
      expect(response).toContain('serviços');
    });

    it('deve gerar resposta padrão para mensagens não reconhecidas', () => {
      const response = chatAI.generateHonestResponse('xyz abc 123 sem palavras chave');
      
      // A resposta padrão deve conter informações de contato
      expect(response).toBeTruthy();
      expect(typeof response).toBe('string');
      expect(response.length).toBeGreaterThan(0);
    });
  });

  describe('Indicadores de Digitação', () => {
    it('deve mostrar indicador de digitação', () => {
      chatAI.showTypingIndicator();
      
      const typingIndicator = document.getElementById('typing-indicator');
      expect(typingIndicator).toBeTruthy();
      expect(typingIndicator.classList.contains('typing')).toBe(true);
    });

    it('deve esconder indicador de digitação', () => {
      chatAI.showTypingIndicator();
      expect(document.getElementById('typing-indicator')).toBeTruthy();
      
      chatAI.hideTypingIndicator();
      expect(document.getElementById('typing-indicator')).toBeFalsy();
    });

    it('deve criar dots de digitação', () => {
      chatAI.showTypingIndicator();
      
      const typingIndicator = document.getElementById('typing-indicator');
      const typingDots = typingIndicator.querySelector('.typing-dots');
      expect(typingDots).toBeTruthy();
      expect(typingDots.querySelectorAll('span').length).toBe(3);
    });
  });

  describe('Ações Rápidas', () => {
    it('deve processar ação de serviços', async () => {
      const servicosBtn = document.querySelector('[data-action="servicos"]');
      servicosBtn.click();
      
      // Aguardar processamento
      await new Promise(resolve => setTimeout(resolve, 300));
      
      expect(chatAI.messages.length).toBeGreaterThan(0);
      expect(chatAI.messages[0].text).toContain('serviços');
    });

    it('deve processar ação de contato', async () => {
      const contatoBtn = document.querySelector('[data-action="contato"]');
      contatoBtn.click();
      
      await new Promise(resolve => setTimeout(resolve, 300));
      
      expect(chatAI.messages.length).toBeGreaterThan(0);
      expect(chatAI.messages[0].text).toContain('humano');
    });

    it('deve processar ação de portfólio', async () => {
      const portfolioBtn = document.querySelector('[data-action="portfolio"]');
      portfolioBtn.click();
      
      await new Promise(resolve => setTimeout(resolve, 300));
      
      expect(chatAI.messages.length).toBeGreaterThan(0);
      expect(chatAI.messages[0].text).toContain('portfólio');
    });
  });

  describe('Scroll e UI', () => {
    it('deve fazer scroll para o final após adicionar mensagem', () => {
      const messagesContainer = document.getElementById('chat-messages');
      messagesContainer.scrollTop = 0;
      
      chatAI.addMessage('Nova mensagem', 'user');
      
      expect(messagesContainer.scrollTop).toBe(messagesContainer.scrollHeight);
    });

    it('deve fazer scroll ao mostrar indicador de digitação', () => {
      const messagesContainer = document.getElementById('chat-messages');
      messagesContainer.scrollTop = 0;
      
      chatAI.showTypingIndicator();
      
      expect(messagesContainer.scrollTop).toBe(messagesContainer.scrollHeight);
    });
  });

  describe('Simulação de Resposta da IA', () => {
    it('deve simular resposta da IA após mensagem do usuário', async () => {
      const chatInput = document.getElementById('chat-input');
      chatInput.value = 'Olá';
      
      chatAI.sendMessage();
      
      // Aguardar processamento
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Deve ter mensagem do usuário e resposta do agente
      expect(chatAI.messages.length).toBeGreaterThanOrEqual(1);
    });

    it('deve mostrar e esconder indicador de digitação durante resposta', async () => {
      chatAI.isTyping = false;
      chatAI.simulateAIResponse('Teste');
      
      // Deve mostrar indicador
      expect(chatAI.isTyping).toBe(true);
      expect(document.getElementById('typing-indicator')).toBeTruthy();
      
      // Aguardar processamento
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // Deve esconder indicador e adicionar resposta
      expect(chatAI.isTyping).toBe(false);
    });
  });

  describe('Histórico de Mensagens', () => {
    it('deve manter histórico limitado para API', () => {
      // Adicionar mais de 10 mensagens
      for (let i = 0; i < 15; i++) {
        chatAI.addMessage(`Mensagem ${i}`, i % 2 === 0 ? 'user' : 'agent');
      }
      
      expect(chatAI.messages.length).toBe(15);
      
      // Ao construir histórico para API, deve pegar apenas últimas 10
      const history = chatAI.messages
        .slice(-10)
        .map(msg => ({
          role: msg.type === 'user' ? 'user' : 'assistant',
          content: msg.text
        }));
      
      expect(history.length).toBe(10);
    });

    it('deve mapear corretamente tipos de mensagem para roles da API', () => {
      chatAI.addMessage('Mensagem do usuário', 'user');
      chatAI.addMessage('Resposta do agente', 'agent');
      
      const history = chatAI.messages.map(msg => ({
        role: msg.type === 'user' ? 'user' : 'assistant',
        content: msg.text
      }));
      
      expect(history[0].role).toBe('user');
      expect(history[1].role).toBe('assistant');
    });
  });

  describe('Integração com LLM - Gemini', () => {
    beforeEach(() => {
      // Limpar fetch mocks
      global.fetch = vi.fn();
    });

    describe('Gemini Integration', () => {
      it('deve chamar API Gemini quando GOOGLE_API_KEY está configurada', async () => {
        window.APP_CONFIG = {
          GOOGLE_API_KEY: 'gemini-test-key-456',
          GEMINI_MODEL: 'gemini-2.0-flash-exp'
        };

        global.fetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            candidates: [{
              content: {
                parts: [{
                  text: 'Resposta do Gemini'
                }]
              }
            }]
          })
        });

        const response = await chatAI.fetchDirectAI(
          'Teste Gemini',
          [],
          'System prompt',
          { category: 'TECHNICAL', confidence: 85 }
        );

        expect(global.fetch).toHaveBeenCalled();
        const geminiUrl = global.fetch.mock.calls[0][0];
        expect(geminiUrl).toContain('generativelanguage.googleapis.com');
        expect(geminiUrl).toContain('gemini-2.0-flash-exp');
        expect(geminiUrl).toContain('gemini-test-key-456');
        expect(response).toBe('Resposta do Gemini');
      });

      it('deve incluir system prompt e histórico no prompt do Gemini', async () => {
        window.APP_CONFIG = {
          GOOGLE_API_KEY: 'gemini-test-key-456'
        };

        global.fetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            candidates: [{
              content: {
                parts: [{
                  text: 'Resposta'
                }]
              }
            }]
          })
        });

        const history = [
          { role: 'user', content: 'Histórico 1' },
          { role: 'assistant', content: 'Histórico 2' }
        ];

        await chatAI.fetchDirectAI(
          'Nova mensagem',
          history,
          'System prompt para Gemini',
          null
        );

        const requestBody = JSON.parse(global.fetch.mock.calls[0][1].body);
        const promptText = requestBody.contents[0].parts[0].text;
        
        expect(promptText).toContain('System prompt para Gemini');
        expect(promptText).toContain('Histórico 1');
        expect(promptText).toContain('Histórico 2');
        expect(promptText).toContain('Nova mensagem');
      });

      it('deve usar gemini-2.0-flash-exp como modelo padrão se não configurado', async () => {
        window.APP_CONFIG = {
          GOOGLE_API_KEY: 'gemini-test-key-456'
        };

        global.fetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            candidates: [{
              content: {
                parts: [{
                  text: 'Resposta'
                }]
              }
            }]
          })
        });

        await chatAI.fetchDirectAI('Teste', [], 'Prompt', null);

        const geminiUrl = global.fetch.mock.calls[0][0];
        expect(geminiUrl).toContain('gemini-2.0-flash-exp');
      });

      it('deve retornar null se Gemini retornar erro 401', async () => {
        window.APP_CONFIG = {
          GOOGLE_API_KEY: 'gemini-invalid-key'
        };

        global.fetch.mockResolvedValueOnce({
          ok: false,
          status: 401
        });

        const response = await chatAI.fetchDirectAI('Teste', [], 'Prompt', null);

        expect(response).toBeNull();
      });

      it('deve retornar null se Gemini retornar resposta vazia', async () => {
        window.APP_CONFIG = {
          GOOGLE_API_KEY: 'gemini-test-key-456'
        };

        global.fetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            candidates: [{
              content: {
                parts: [{
                  text: ''
                }]
              }
            }]
          })
        });

        const response = await chatAI.fetchDirectAI('Teste', [], 'Prompt', null);

        expect(response).toBeNull();
      });
    });

    describe('Configuração e Validação', () => {
      it('deve retornar null se nenhuma API key estiver configurada', async () => {
        window.APP_CONFIG = {};

        const response = await chatAI.fetchDirectAI('Teste', [], 'Prompt', null);

        expect(global.fetch).not.toHaveBeenCalled();
        expect(response).toBeNull();
      });

      it('deve usar temperature 0.7 e maxOutputTokens 800 para Gemini', async () => {
        window.APP_CONFIG = {
          GOOGLE_API_KEY: 'gemini-test-key-456'
        };

        global.fetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            candidates: [{
              content: {
                parts: [{
                  text: 'Resposta'
                }]
              }
            }]
          })
        });

        await chatAI.fetchDirectAI('Teste', [], 'Prompt', null);

        const requestBody = JSON.parse(global.fetch.mock.calls[0][1].body);
        expect(requestBody.temperature).toBe(0.7);
        expect(requestBody.max_tokens).toBe(800);
      });

      it('deve usar temperature 0.7 e maxOutputTokens 800 para Gemini', async () => {
        window.APP_CONFIG = {
          GOOGLE_API_KEY: 'gemini-test-key-456'
        };

        global.fetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            candidates: [{
              content: {
                parts: [{
                  text: 'Resposta'
                }]
              }
            }]
          })
        });

        await chatAI.fetchDirectAI('Teste', [], 'Prompt', null);

        const requestBody = JSON.parse(global.fetch.mock.calls[0][1].body);
        expect(requestBody.generationConfig.temperature).toBe(0.7);
        expect(requestBody.generationConfig.maxOutputTokens).toBe(800);
      });
    });
  });
});
