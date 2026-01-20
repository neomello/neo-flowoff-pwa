# Testes do Formulário Lead Form

Este diretório contém os testes automatizados para o formulário de contato (Lead Form) que aparece
quando o usuário clica em "INICIAR".

## Estrutura

- `setup.js` - Configuração global dos testes (mocks, beforeEach, afterEach)
- `lead-form.test.js` - Testes do formulário de contato
- `chat-ai.test.js` - Testes do sistema de chat com IA

## Executando os Testes

### Instalar dependências

```bash
npm install
```

### Executar testes em modo watch

```bash
npm test
```

### Executar testes uma vez

```bash
npm run test:run
```

### Executar testes com interface visual

```bash
npm run test:ui
```

## Cobertura de Testes

### Formulário Lead Form (25 testes)

Os testes cobrem:

### ✅ Estrutura do Formulário

- Presença do formulário no DOM
- Existência de todos os campos obrigatórios
- Botão de submit
- Elemento de status

### ✅ Validação de Campos

- **Nome**: Validação de campo vazio, muito curto e válido
- **Email**: Validação de formato e campo obrigatório
- **WhatsApp**: Formatação automática e validação de número
- **Tipo de Serviço**: Validação de seleção obrigatória

### ✅ Submissão do Formulário

- Prevenção de submissão com campos vazios
- Validação completa antes de submeter
- Mensagens de status durante o processo

### ✅ Interação do Usuário

- Limpeza de erros ao digitar
- Formatação de telefone em tempo real
- Limpeza de erros ao selecionar serviço

### ✅ Integração com WhatsApp

- Geração correta da URL do WhatsApp
- Inclusão de todos os dados no link

### ✅ Comportamento Offline

- Enfileiramento de formulário quando offline
- Mensagens apropriadas para usuário offline

### ChatAI - Sistema de Chat com IA (37 testes)

Os testes cobrem:

### ✅ Estrutura e Inicialização

- Criação de instância do ChatAI
- Presença de elementos do DOM
- Inicialização de event listeners

### ✅ Adição de Mensagens

- Adição de mensagens do usuário e agente
- Criação de elementos DOM corretos
- Manutenção de histórico de mensagens

### ✅ Envio de Mensagens

- Envio via clique no botão
- Envio via tecla Enter
- Prevenção de envio de mensagens vazias
- Prevenção durante digitação

### ✅ Classificação de Intenções

- Classificação de intenção de VENDAS
- Classificação de intenção TÉCNICA
- Classificação de intenção de ESTRATÉGIA
- Classificação de intenção de ONBOARDING
- Classificação de intenção PESSOAL sobre MELLØ
- Uso de ONBOARDING como padrão
- Cálculo de confiança baseado em matches

### ✅ Geração de Respostas Honestas (Fallback)

- Respostas para perguntas sobre serviços
- Respostas para perguntas sobre preço
- Respostas para perguntas sobre contato
- Respostas para perguntas sobre portfólio
- Respostas para saudações
- Resposta padrão para mensagens não reconhecidas

### ✅ Indicadores de Digitação

- Mostrar indicador de digitação
- Esconder indicador de digitação
- Criação de dots de digitação

### ✅ Ações Rápidas

- Processamento de ação de serviços
- Processamento de ação de contato
- Processamento de ação de portfólio

### ✅ Scroll e UI

- Scroll automático após adicionar mensagem
- Scroll ao mostrar indicador de digitação

### ✅ Simulação de Resposta da IA

- Simulação de resposta após mensagem do usuário
- Mostrar e esconder indicador durante resposta

### ✅ Histórico de Mensagens

- Manutenção de histórico limitado para API
- Mapeamento correto de tipos para roles da API

## Tecnologias Utilizadas

- **Vitest**: Framework de testes moderno e rápido
- **jsdom**: Ambiente DOM simulado para testes
- **@vitest/ui**: Interface visual para testes

## Adicionando Novos Testes

Para adicionar novos testes ao formulário:

1. Abra `tests/lead-form.test.js`
2. Adicione um novo `describe` ou `it` dentro do bloco apropriado
3. Use as funções auxiliares `createFormDOM()` e `loadFormValidator()`
4. Execute `npm test` para verificar

## Exemplo de Teste

```javascript
it('deve validar email com formato correto', () => {
  const emailInput = form.querySelector('input[name="email"]');
  emailInput.value = 'teste@exemplo.com';
  emailInput.dispatchEvent(new Event('blur'));

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  expect(emailRegex.test(emailInput.value)).toBe(true);
});
```
