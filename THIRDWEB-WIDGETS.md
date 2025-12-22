# 🪙 Thirdweb Widgets - Guia de Uso

**Widgets de cadastro e compra de tokens NEOFLW usando Thirdweb SDK v5**

---

## 📋 Visão Geral

Este projeto implementa dois widgets principais usando **Thirdweb SDK v5** em **JavaScript vanilla** (sem React):

1. **ConnectEmbed Widget** - Login/Cadastro ultra-simples com Embedded Wallet
2. **BuyWidget** - Compra direta de tokens NEOFLW

### ✨ Características

- ✅ **Sem necessidade de MetaMask** - Wallet criada automaticamente
- ✅ **Login social** - Google, Apple, X (Twitter), Telegram
- ✅ **Login por email** - Verificação simples
- ✅ **Compra direta** - Cartão, PIX, transferência
- ✅ **Onboarding em segundos** - Fricção zero

---

## 🚀 Como Usar

### 1. Configuração

O widget já está configurado no projeto. Certifique-se de que:

- `THIRDWEB_CLIENT_ID` está definido no `index.html`
- Thirdweb SDK v5 está carregado via CDN
- Os arquivos CSS e JS estão incluídos

### 2. Onde os Widgets Aparecem

Os widgets estão integrados no **modal de Tokenização** (`#modal-tokenizacao`):

- Acesse: Projetos → Tokenização de Ativos
- Os widgets aparecem automaticamente no modal

### 3. Estrutura HTML

```html
<!-- ConnectEmbed Widget -->
<div id="connect-embed-container"></div>

<!-- BuyWidget -->
<div id="buy-widget-container"></div>
```

### 4. Inicialização Automática

Os widgets são inicializados automaticamente quando:
- O DOM está pronto
- O Thirdweb SDK está carregado
- Os containers existem na página

---

## 🎨 Personalização

### ConnectEmbed Widget

**Estratégias de login disponíveis:**
- `email` - Login por email
- `google` - Google OAuth
- `apple` - Apple Sign In
- `x` - X (Twitter) OAuth
- `telegram` - Telegram OAuth
- `wallet` - MetaMask/Wallet externa

**Exemplo de uso programático:**

```javascript
// Conectar via email
connectEmbed.connect('email');

// Conectar via Google
connectEmbed.connect('google');

// Verificar se está conectado
if (connectEmbed.isConnected()) {
  console.log('Endereço:', connectEmbed.getAddress());
}

// Desconectar
connectEmbed.disconnect();
```

### BuyWidget

**Opções de configuração:**

```javascript
const buyWidget = new BuyWidget('buy-widget-container', {
  amount: '50',           // Quantidade padrão
  theme: 'dark',          // 'dark' ou 'light'
  tokenAddress: '0x6575...' // Endereço do token
});

buyWidget.init();
```

---

## 📡 Eventos

Os widgets disparam eventos customizados:

### walletConnected

Disparado quando uma wallet é conectada:

```javascript
window.addEventListener('walletConnected', (event) => {
  console.log('Wallet conectada:', event.detail.address);
  // Atualizar UI, buscar saldo, etc.
});
```

### walletDisconnected

Disparado quando a wallet é desconectada:

```javascript
window.addEventListener('walletDisconnected', () => {
  console.log('Wallet desconectada');
  // Limpar UI, etc.
});
```

---

## 🔧 API do Thirdweb SDK v5

### Inicialização

```javascript
// Cliente Thirdweb
const client = thirdweb.createThirdwebClient({
  clientId: 'SEU_CLIENT_ID'
});

// Chain Base
const baseChain = thirdweb.defineChain(8453);
```

### Embedded Wallet

```javascript
// Criar embedded wallet
const embeddedWallet = thirdweb.embeddedWallet({
  client: client,
  chain: baseChain
});

// Conectar
const account = await embeddedWallet.connect({
  strategy: 'google' // ou 'email', 'apple', etc.
});
```

### Conectar Wallet Externa

```javascript
// Conectar MetaMask ou outra wallet
const wallet = await thirdweb.connect({
  client: client,
  chain: baseChain
});

const account = await wallet.getAccount();
console.log('Endereço:', account.address);
```

---

## 🎯 Fluxo de Uso Completo

1. **Usuário acessa o modal de Tokenização**
2. **Vê o ConnectEmbed Widget**
3. **Clica em uma opção de login** (Google, Email, etc.)
4. **Wallet é criada automaticamente** (embedded wallet)
5. **Vê o BuyWidget** para comprar tokens
6. **Seleciona quantidade e método de pagamento**
7. **Compra tokens diretamente**

---

## 📚 Documentação de Referência

- [Thirdweb SDK v5 Docs](https://portal.thirdweb.com/)
- [Embedded Wallet Guide](https://portal.thirdweb.com/wallets/embedded)
- [Buy Widget Docs](https://portal.thirdweb.com/react/payments/buy-widget)
- [Base Network](https://base.org/)

---

## 🔒 Segurança

- ✅ Client ID é público (seguro para frontend)
- ✅ Autenticação via OAuth (Google, Apple, etc.)
- ✅ Transações assinadas pela wallet do usuário
- ✅ Sem armazenamento de chaves privadas no servidor

---

## 🐛 Troubleshooting

### Widgets não aparecem

1. Verifique se `THIRDWEB_CLIENT_ID` está configurado
2. Verifique se Thirdweb SDK está carregado (console do navegador)
3. Verifique se os containers existem no HTML

### Erro ao conectar

1. Verifique se o Client ID está correto
2. Verifique se o domínio está autorizado no Thirdweb Dashboard
3. Verifique o console do navegador para erros

### Compra não funciona

1. Verifique se a wallet está conectada
2. Verifique se há saldo suficiente
3. Verifique se o token address está correto

---

## 📝 Notas Importantes

- Os widgets usam **JavaScript vanilla** (não React)
- Compatível com **Thirdweb SDK v5** via CDN
- Funciona em **navegadores modernos** (Chrome, Firefox, Safari, Edge)
- Requer conexão com internet para autenticação OAuth

---

**Última atualização:** 2025-01-XX  
**Mantido por:** MELLØ™ - NEØ.FLOWOFF

