# 🚀 Guia: Swap & Registro de Usuário — NEØ FlowOFF

**Data**: 2026-01-28  
**Status**: Implementação completa pronta para integração

---

## 📦 ARQUIVOS CRIADOS

### 1. Sistema de Swap

**js/token-swap.js** (288 linhas)
- Classe `TokenSwap` para swap ETH → $NEOFLW
- Integração com Uniswap V3 na BASE
- Funções: `getQuote()`, `swapETHForNEOFLW()`, `getCurrentPrice()`

**js/swap-ui.js** (424 linhas)
- Classe `SwapUI` com interface de swap
- Modal responsivo com input/output
- Atualização de cotação em tempo real
- Controle de slippage

### 2. Sistema de Registro

**api/register.js** (269 linhas)
- API endpoint POST `/api/register`
- Validação completa de inputs
- Rate limiting: 10 req/hora
- Rollback automático em caso de erro

**js/user-registration.js** (363 linhas)
- Classe `UserRegistration` para cadastro de usuário
- Modal de registro com formulário
- Vinculação de wallet ao usuário
- Persistência em localStorage

**migrations/001_create_users_tables.sql** (235 linhas)
- Schema completo: `users`, `user_wallets`, `user_sessions`
- Triggers automáticos (updated_at, primary wallet)
- Views úteis: `v_users_with_wallets`
- Constraints e índices otimizados

---

## 🔧 CONFIGURAÇÃO

### 1. Executar Migração do Banco

```bash
# Conectar ao Neon Database
psql $DATABASE_URL

# Executar migração
\i migrations/001_create_users_tables.sql

# Verificar tabelas criadas
\dt
# Output esperado:
# users
# user_wallets
# user_sessions
```

### 2. Adicionar Scripts no HTML

**index.html** (antes do fechamento do `</body>`):
```html
<!-- Swap & Registration -->
<script src="js/token-swap.js?v=1.0.0"></script>
<script src="js/swap-ui.js?v=1.0.0"></script>
<script src="js/user-registration.js?v=1.0.0"></script>
```

**desktop.html** (mesma localização):
```html
<!-- Swap & Registration -->
<script src="js/token-swap.js?v=1.0.0"></script>
<script src="js/swap-ui.js?v=1.0.0"></script>
<script src="js/user-registration.js?v=1.0.0"></script>
```

### 3. Dependências Instaladas

```json
{
  "dependencies": {
    "@uniswap/sdk-core": "^5.3.1",
    "@uniswap/v3-sdk": "^3.13.1",
    "ethers": "^5.7.2"
  }
}
```

---

## 🎯 COMO USAR

### Fluxo Completo: Conexão → Registro → Compra

```javascript
// 1. Conectar wallet (já implementado em wallet.js)
await walletManager.connect();

// 2. Verificar se usuário está registrado
const isRegistered = window.UserRegistration.isUserRegistered();

if (!isRegistered) {
  // 3. Mostrar modal de registro
  await window.UserRegistration.showRegistrationModal(
    walletManager.address,
    'metamask' // ou 'web3auth', 'walletconnect'
  );
}

// 4. Abrir modal de swap/compra
window.SwapUI.openSwapModal(walletManager.address);
```

### Exemplo de Integração no Botão de Wallet

```javascript
// Em wallet.js, após conectar com sucesso:
async connect() {
  // ... código existente de conexão ...
  
  this.connected = true;
  this.address = accounts[0];
  
  // Verificar se usuário está registrado
  if (!window.UserRegistration?.isUserRegistered()) {
    // Mostrar modal de registro
    setTimeout(() => {
      window.UserRegistration.showRegistrationModal(
        this.address,
        'metamask'
      );
    }, 500);
  }
  
  // Adicionar botão "Comprar $NEOFLW" no modal
  this.addBuyButton();
}

addBuyButton() {
  const walletContent = document.querySelector('.wallet-modal-content');
  if (!walletContent) return;
  
  const buyBtn = document.createElement('button');
  buyBtn.textContent = '💰 Comprar $NEOFLW';
  buyBtn.onclick = () => {
    window.SwapUI.openSwapModal(this.address);
  };
  buyBtn.style.cssText = 'margin-top: 16px; width: 100%; padding: 14px; ...';
  
  walletContent.appendChild(buyBtn);
}
```

---

## 🔍 API: POST /api/register

### Request

```bash
curl -X POST https://neoflowoff.vercel.app/api/register \
  -H "Content-Type: application/json" \
  -H "X-API-Token: $API_TOKEN" \
  -d '{
    "email": "user@example.com",
    "username": "myusername",
    "full_name": "John Doe",
    "wallet_address": "0x460F9D0cf3e6E84faC1A7Abc524ddfa66fb64f60",
    "provider": "metamask"
  }'
```

### Response (201 Created)

```json
{
  "success": true,
  "message": "Usuário registrado com sucesso",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "username": "myusername",
    "full_name": "John Doe",
    "created_at": "2026-01-28T04:00:00Z",
    "wallet": {
      "id": 1,
      "address": "0x460f9d0cf3e6e84fac1a7abc524ddfa66fb64f60",
      "provider": "metamask",
      "is_primary": true,
      "created_at": "2026-01-28T04:00:00Z"
    }
  }
}
```

### Erros Possíveis

| Código | Erro | Causa |
|--------|------|-------|
| 400 | Email é obrigatório | Campo email vazio |
| 400 | Email inválido | Formato incorreto |
| 400 | Wallet inválida | Endereço não é 0x + 40 hex |
| 409 | Email já cadastrado | Email duplicado |
| 409 | Wallet já vinculada | Wallet já em uso |
| 429 | Rate limit | Mais de 10 req/hora |
| 500 | Erro interno | Falha no banco |

---

## 💱 Sistema de Swap

### Configuração Uniswap V3 (BASE)

| Contrato | Endereço |
|----------|----------|
| **Router V3** | `0x2626664c2603336E57B271c5C0b26F421741e481` |
| **Factory** | `0x33128a8fC17869897dcE68Ed026d694621f6FDfD` |
| **Quoter V2** | `0x3d4e44Eb1374240CE5F1B871ab261CD16335B76a` |
| **WETH** | `0x4200000000000000000000000000000000000006` |
| **$NEOFLW** | `0x41F4ff3d45DED9C1332e4908F637B75fe83F5d6B` |

### Fee Tiers

- **LOW (500)**: 0.05% — pools estáveis
- **MEDIUM (3000)**: 0.3% — padrão (recomendado)
- **HIGH (10000)**: 1% — pools voláteis

### Exemplo de Uso

```javascript
// Inicializar
const swap = window.TokenSwap;
await swap.init();

// Obter cotação
const quote = await swap.getQuote('0.01'); // 0.01 ETH
console.log(`Você receberá ${quote.amountOut} NEOFLW`);

// Executar swap
const result = await swap.swapETHForNEOFLW('0.01', 0.5); // 0.5% slippage
console.log(`Swap concluído: ${result.txHash}`);
```

---

## 📊 Schema do Banco de Dados

### Tabela: users

```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  username TEXT,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  last_login_at TIMESTAMP,
  is_active BOOLEAN DEFAULT true,
  is_verified BOOLEAN DEFAULT false,
  preferences JSONB DEFAULT '{}'
);
```

### Tabela: user_wallets

```sql
CREATE TABLE user_wallets (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  wallet_address TEXT NOT NULL,
  provider TEXT NOT NULL,
  chain_id INTEGER DEFAULT 8453,
  is_primary BOOLEAN DEFAULT false,
  is_verified BOOLEAN DEFAULT false,
  label TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  last_used_at TIMESTAMP,
  UNIQUE(user_id, wallet_address)
);
```

### View: v_users_with_wallets

```sql
SELECT 
  u.id,
  u.email,
  u.username,
  json_agg(
    json_build_object(
      'wallet_address', w.wallet_address,
      'provider', w.provider,
      'is_primary', w.is_primary
    )
  ) as wallets
FROM users u
LEFT JOIN user_wallets w ON u.id = w.user_id
GROUP BY u.id;
```

---

## ⚠️ PRÓXIMOS PASSOS (ANTES DE PRODUÇÃO)

### 🔴 CRÍTICO

1. **Executar migração SQL**:
   ```bash
   psql $DATABASE_URL -f migrations/001_create_users_tables.sql
   ```

2. **Adicionar liquidez no Uniswap V3** (BASE):
   - Acessar: https://app.uniswap.org/pools
   - Criar pool ETH/NEOFLW
   - Fee tier: 0.3%
   - Range: ±20% do preço inicial
   - Quantidade inicial: ex. 1 ETH + 10,000 NEOFLW

3. **Testar em BASE Sepolia (Testnet)**:
   ```javascript
   // Alterar temporariamente em js/token-swap.js:
   const BASE_CONFIG = {
     chainId: 84532, // BASE Sepolia
     rpcUrl: 'https://sepolia.base.org',
     // ... outros configs
   };
   ```

4. **Adicionar scripts no HTML** (index.html e desktop.html)

5. **Configurar variável de ambiente**:
   ```bash
   # Vercel: adicionar em Settings → Environment Variables
   BASE_RPC_URL=https://mainnet.base.org
   ```

### 🟡 RECOMENDADO

6. **Melhorar UX**:
   - Toast notifications para feedback visual
   - Animações de loading durante swap
   - Histórico de transações

7. **Analytics**:
   - Tracking de conversão (registro)
   - Tracking de swap (compra)
   - Google Analytics / Mixpanel events

8. **Segurança**:
   - Verificar email via código (opcional)
   - 2FA para ações críticas (opcional)
   - Audit de smart contracts

---

## 🧪 TESTES

### Testar Registro

```javascript
// Console do browser
const result = await fetch('/api/register', {
  method: 'POST',
  headers: { 
    'Content-Type': 'application/json',
    'X-API-Token': 'your-token',
  },
  body: JSON.stringify({
    email: 'test@neoflowoff.eth',
    wallet_address: '0x460F9D0cf3e6E84faC1A7Abc524ddfa66fb64f60',
    provider: 'metamask',
  })
});
const data = await result.json();
console.log(data);
```

### Testar Swap (após adicionar liquidez)

```javascript
// Console do browser
await window.TokenSwap.init();
const quote = await window.TokenSwap.getQuote('0.001'); // 0.001 ETH
console.log(`Cotação: ${quote.amountOut} NEOFLW`);

const result = await window.TokenSwap.swapETHForNEOFLW('0.001', 0.5);
console.log(`Swap: ${result.txHash}`);
```

---

## 📊 CHECKLIST DE INTEGRAÇÃO

### Backend
- [x] API `/api/register` criada
- [x] Schema SQL completo
- [ ] Migração SQL executada no Neon
- [ ] Testar API em dev
- [ ] Testar API em prod

### Frontend
- [x] `js/token-swap.js` criado
- [x] `js/swap-ui.js` criado
- [x] `js/user-registration.js` criado
- [ ] Scripts adicionados em index.html
- [ ] Scripts adicionados em desktop.html
- [ ] Integração com wallet.js
- [ ] Testes em navegador

### Smart Contracts
- [x] Contrato $NEOFLW validado na BASE
- [ ] Liquidez adicionada no Uniswap V3
- [ ] Pool ETH/NEOFLW ativo
- [ ] Endereço do pool documentado
- [ ] Testes de swap em testnet
- [ ] Testes de swap em mainnet

### Documentação
- [x] Guia completo criado
- [x] API documentada
- [x] Exemplos de uso
- [ ] README atualizado
- [ ] Tutorial em vídeo (opcional)

---

## 🎯 DEPENDÊNCIAS

### NPM Packages (Instalados)

```json
{
  "@uniswap/sdk-core": "^5.3.1",
  "@uniswap/v3-sdk": "^3.13.1",
  "ethers": "^5.7.2"
}
```

### Variáveis de Ambiente

```bash
# .env ou Vercel Environment Variables
BASE_RPC_URL=https://mainnet.base.org
WEB3AUTH_CLIENT_ID=your_client_id
API_TOKEN=your_api_token
DATABASE_URL=postgres://...
```

---

## 🚀 ROADMAP DE LANÇAMENTO

### Fase 1: Preparação (2-3 dias)
1. ✅ Código implementado
2. ✅ Testes unitários criados
3. ⬜ Executar migração SQL
4. ⬜ Adicionar liquidez no Uniswap
5. ⬜ Testar em testnet (BASE Sepolia)

### Fase 2: Integração (2-3 dias)
6. ⬜ Adicionar scripts em HTML
7. ⬜ Integrar registro após conexão de wallet
8. ⬜ Adicionar botão "Comprar" no wallet modal
9. ⬜ Testar fluxo completo em staging

### Fase 3: Produção (1-2 dias)
10. ⬜ Deploy em produção (Vercel)
11. ⬜ Monitorar primeiras transações
12. ⬜ Ajustar baseado no feedback
13. ⬜ Documentar casos de uso

---

## 🔗 RECURSOS ÚTEIS

### Uniswap V3
- **Documentação**: https://docs.uniswap.org/contracts/v3/overview
- **SDK Guide**: https://docs.uniswap.org/sdk/v3/overview
- **Pool Manager**: https://app.uniswap.org/pools

### BASE Network
- **Documentação**: https://docs.base.org
- **Testnet Faucet**: https://www.coinbase.com/faucets/base-ethereum-goerli-faucet
- **Bridge**: https://bridge.base.org

### Ferramentas
- **BaseScan**: https://basescan.org
- **DexScreener**: https://dexscreener.com/base
- **Uniswap Analytics**: https://info.uniswap.org/#/base/

---

## 💡 NOTAS TÉCNICAS

### Slippage Protection
```javascript
// Calcular amountOutMinimum com slippage
const amountOutMin = expectedAmount * (1 - slippage / 100);

// Exemplo: 100 NEOFLW esperado, 0.5% slippage
// amountOutMin = 100 * (1 - 0.005) = 99.5 NEOFLW mínimo
```

### Gas Estimation
```javascript
// Gas estimado para swap: ~150,000-300,000
const gasLimit = 300000;

// Gas price na BASE (geralmente baixo)
const gasPrice = await provider.getGasPrice();
const gasCost = gasLimit * gasPrice; // em wei
```

### Rate Limiting
```javascript
// API /register: 10 requests/hora por IP
// Prevenir abuse e spam

// Wallet: se rate limit excedido, mostrar:
"⚠️ Limite de requisições atingido. Tente novamente em 1 hora."
```

---

## ✅ RESULTADO

**Arquivos criados**: 6 novos arquivos, 1,592 linhas  
**Dependências**: 284 packages instalados  
**Sistema**: Completo e pronto para integração

**Próximo passo crítico**: Adicionar liquidez no Uniswap V3 (BASE)

---

**Documentado por**: NEØ FlowOFF Dev Team  
**Última atualização**: 2026-01-28
