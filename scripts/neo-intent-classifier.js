/**
 * 🧠 NEO Intent Classifier
 * Classifica intenções de mensagens para o agente NEO
 *
 * Usado tanto no client-side (chat-ai.js) quanto no server-side (server.js, netlify/functions/chat.js)
 */

/**
 * Classifica a intenção principal de uma mensagem
 * @param {string} message - Mensagem do usuário
 * @param {Array} history - Histórico de mensagens
 * @returns {Object} { category: string, confidence: number }
 */
function classifyIntent(message, history = []) {
  const messageLower = message.toLowerCase();
  const fullContext =
    history
      .map((m) => (typeof m === 'string' ? m : m.content || m.text || ''))
      .join(' ')
      .toLowerCase() +
    ' ' +
    messageLower;

  // Análise heurística rápida (pode ser melhorada com LLM)
  const salesKeywords = [
    'preço',
    'quanto',
    'custo',
    'orçamento',
    'contratar',
    'proposta',
    'plano',
    'pacote',
    'valor',
    'investimento',
    'pagamento',
  ];
  const technicalKeywords = [
    'código',
    'stack',
    'bug',
    'erro',
    'implementar',
    'arquitetura',
    'api',
    'deploy',
    'tecnologia',
    'desenvolvimento',
    'programação',
    'tech',
    'sistema',
  ];
  const strategyKeywords = [
    'estratégia',
    'crescimento',
    'modelo',
    'negócio',
    'visão',
    'posicionamento',
    'sistema',
    'ecossistema',
    'automação',
    'processo',
    'metodologia',
  ];
  const onboardingKeywords = [
    'o que',
    'como funciona',
    'quem são',
    'sobre',
    'entender',
    'conhecer',
    'flowoff',
    'agência',
    'empresa',
    'serviços',
  ];
  const personalKeywords = [
    'mello',
    'mellø',
    'você',
    'sua',
    'pessoal',
    'filosofia',
    'visão pessoal',
    'trajetória',
    'história',
    'background',
  ];

  // Contagem de matches por categoria
  const scores = {
    SALES: salesKeywords.filter((k) => fullContext.includes(k)).length,
    TECHNICAL: technicalKeywords.filter((k) => fullContext.includes(k)).length,
    STRATEGY: strategyKeywords.filter((k) => fullContext.includes(k)).length,
    ONBOARDING: onboardingKeywords.filter((k) => fullContext.includes(k))
      .length,
    PERSONAL_MELLO: personalKeywords.filter((k) => fullContext.includes(k))
      .length,
  };

  // Encontrar categoria com maior score
  const maxScore = Math.max(...Object.values(scores));
  if (maxScore === 0) {
    // Se nenhuma categoria teve match, usar ONBOARDING como padrão
    return { category: 'ONBOARDING', confidence: 50 };
  }

  const category = Object.keys(scores).find((key) => scores[key] === maxScore);
  const confidence = Math.min(
    100,
    Math.round(
      (maxScore / Math.max(1, fullContext.split(' ').length / 10)) * 100
    )
  );

  return { category, confidence };
}

/**
 * Retorna o prompt base do NEO
 */
function getBasePrompt() {
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
}

/**
 * Retorna o sub-prompt especializado baseado na categoria de intenção
 */
function getIntentPrompt(intentCategory) {
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
}

/**
 * Constrói o prompt final do sistema baseado na intenção classificada
 */
function buildSystemPrompt(intent) {
  return getIntentPrompt(intent.category);
}

// Exportar para uso em Node.js (server.js, netlify/functions/chat.js)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    classifyIntent,
    getBasePrompt,
    getIntentPrompt,
    buildSystemPrompt,
  };
}

// Exportar para uso no browser (chat-ai.js)
if (typeof window !== 'undefined') {
  window.NEOIntentClassifier = {
    classifyIntent,
    getBasePrompt,
    getIntentPrompt,
    buildSystemPrompt,
  };
}
