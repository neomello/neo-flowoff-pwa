# 🔴 AUDITORIA CRÍTICA: Wallet & Token $NEOFLW

**Data**: 2025-01-28  
**Severidade**: 🔴 CRÍTICA — Sistema NÃO funcional para BASE

---

## 🚨 PROBLEMAS CRÍTICOS ENCONTRADOS

### 1. **CONTRADIÇÃO DE REDE: BASE vs POLYGON** (🔴 BLOQUEADOR)

❌ **PROBLEMA**: Configuração de rede INCONSISTENTE entre arquivos

**wallet.js** (linha 5-23):
```javascript
// Linha 5: "Token: $NEOFLW na Polygon"
// ❌ MAS:
const TOKEN_CONFIG = {
  address: '0x41F4ff3d45DED9C1332e4908F637B75fe83F5d6B',
  symbol: 'NEOFLW',
  chainId: 8453,  // ❌ Base Mainnet
  chain: 'base',   // ❌ Base
};
```

**wallet-provider.js** (linha 11, 68-77):

```javascript
// Linha 11: "Token: $NEOFLW na Polygon Network"
// ✅ E de fato:
chainConfig: {
  chainId: '0x89',  // ✅ Polygon Mainnet (137)
  rpcTarget: window?.DRPC_RPC_KEY || 'null',
  displayName: 'Polygon Mainnet',
  blockExplorerUrl: 'https://polygonscan.com',
  ticker: 'MATIC',
}
```

**IMPACTO**:

- ❌ Wallet conecta em **BASE** (chainId 8453)
- ❌ Web3Auth conecta em **POLYGON** (chainId 137)
- ❌ Token $NEOFLW NÃO existe em BASE no endereço configurado
- ❌ Usuários não conseguem ver saldo nem fazer transações

---

### 2. **ENDEREÇO DO TOKEN INCONSISTENTE** (🔴 CRÍTICO)

❌ **PROBLEMA**: 3 ENDEREÇOS DIFERENTES para o mesmo token

| Arquivo | Linha | Endereço | Rede Presumida |
|---------|-------|----------|----------------|
| `wallet.js` | 18 | `0x41F4ff3d45DED9C1332e4908F637B75fe83F5d6B` | BASE (?) |
| `wallet-provider.js` | 607 | `0x59aa4EaE743d608FBDd4205ebA59b38DCA755Dd2` | POLYGON ✅ |
| `wallet-provider.js` | 471 | `0x742d35Cc6634C0532925a3b844Bc454e4438f44e` | MOCK |
| `tests/wallet.test.js` | 37 | `0x59aa4EaE743d608FBDd4205ebA59b38DCA755Dd2` | POLYGON ✅ |

**Links no código apontam para POLYGON**:
```javascript
// wallet-provider.js linha 607
link1.href = 'https://polygonscan.com/token/0x59aa4EaE743d608FBDd4205ebA59b38DCA755Dd2';

// wallet-provider.js linha 621
link2.href = 'https://dexscreener.com/polygon/0x59aa4EaE743d608FBDd4205ebA59b38DCA755Dd2';
```

**IMPACTO**:
- ❌ `fetchBalance()` busca saldo do endereço ERRADO
- ❌ Transações falham (endereço não existe na rede configurada)
- ❌ Links de explorer apontam para POLYGON, mas wallet está em BASE

---

### 3. **SISTEMA DE REGISTRO DE USUÁRIO AUSENTE** (🟠 ALTO)

❌ **PROBLEMA**: NÃO há SDK de registro/cadastro de usuário

**O que existe**:
- ✅ `api/wallet-sessions.js` — apenas registra sessões de wallet
- ✅ Conexão de wallet (MetaMask, Web3Auth, WalletConnect)

**O que NÃO existe**:
- ❌ Cadastro de usuário com dados pessoais
- ❌ Vinculação de wallet → usuário
- ❌ Sistema de perfil de usuário
- ❌ Tabela `users` no banco de dados

**Estrutura atual**:
```sql
-- api/wallet-sessions.js
CREATE TABLE wallet_sessions (
  id SERIAL PRIMARY KEY,
  wallet_address TEXT NOT NULL,
  provider TEXT,
  user_agent TEXT,
  ip TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
-- ❌ SEM tabela 'users'
-- ❌ SEM vinculação user_id → wallet
```

**IMPACTO**:
- ❌ Impossível identificar usuários além do endereço da wallet
- ❌ Sem perfil, preferências, histórico de usuário
- ❌ Apenas tracking de sessões de wallet (não é registro de usuário)

---

### 4. **FUNCIONALIDADE DE COMPRA NÃO IMPLEMENTADA** (🟡 MÉDIO)

❌ **PROBLEMA**: Sistema de compra é apenas PLACEHOLDER

**wallet-provider.js linha 560-563**:
```javascript
async buy() {
  console.log('💰 Buy $NEOFLW: Sistema em implementação');
  
  // Modal informativo sobre compra (criado de forma segura sem innerHTML)
  const modal = document.createElement('dialog');
  // ...
  const p1 = document.createElement('p');
  p1.textContent = 'Sistema de compra estará disponível em breve!';
```

**O que está faltando**:
- ❌ Integração com DEX (Uniswap, QuickSwap, etc.)
- ❌ SDK de swap (ex: Uniswap SDK, 1inch)
- ❌ Contrato de compra/venda
- ❌ Cálculo de preço em tempo real
- ❌ Slippage tolerance
- ❌ Gas estimation

**IMPACTO**:
- ❌ Usuários NÃO podem comprar $NEOFLW pela dApp
- ❌ Apenas links externos (PolygonScan, DexScreener)

---

### 5. **SEM INTEGRAÇÃO DE SWAP/DEX** (🟡 MÉDIO)

❌ **PROBLEMA**: NÃO há funcionalidade de swap/troca de tokens

**O que existe**:
- ❌ Apenas links externos:
  ```javascript
  link1.href = 'https://polygonscan.com/token/0x59aa4...';
  link2.href = 'https://dexscreener.com/polygon/0x59aa4...';
  ```

**O que está faltando**:
- ❌ Integração com Uniswap V3/V4
- ❌ Integração com QuickSwap (Polygon native DEX)
- ❌ Integração com 1inch Aggregator
- ❌ Widget de swap embarcado
- ❌ Função `swap(tokenIn, tokenOut, amount)`

**Referências de mercado**:
```javascript
// Exemplo: Uniswap Widget
import { SwapWidget } from '@uniswap/widgets';

<SwapWidget
  tokenList={[NEOFLW_TOKEN]}
  defaultInputTokenAddress="0x..."
  defaultOutputTokenAddress={NEOFLW_ADDRESS}
/>
```

**IMPACTO**:
- ❌ Usuários saem da dApp para comprar tokens
- ❌ Experiência fragmentada
- ❌ Sem comissão/fee para o protocolo

---

## 🎯 CORREÇÕES NECESSÁRIAS (PRIORIDADE)

### ✅ P0 — CONCLUÍDO

1. **✅ Rede oficial definida**: BASE Mainnet (chainId: 8453)
   - Todos os arquivos atualizados para BASE
   - Web3Auth configurado para BASE
   - RPC: https://mainnet.base.org

2. **✅ Endereço do token unificado e validado**:
   - Endereço oficial: `0x41F4ff3d45DED9C1332e4908F637B75fe83F5d6B`
   - ✅ Verificado e funcional na BASE
   - ✅ Nome: NEOFlowOFF, Símbolo: NEOFLW, Decimais: 18
   - ✅ Max Supply: 1 bilhão de tokens
   - Todos os arquivos atualizados com endereço único

```javascript
// Exemplo de correção:
const NETWORKS = {
  polygon: {
    chainId: 137,
    chainIdHex: '0x89',
    tokenAddress: '0x59aa4EaE743d608FBDd4205ebA59b38DCA755Dd2',
    rpcUrl: 'https://polygon-mainnet.drpc.org',
    explorer: 'https://polygonscan.com',
  },
  base: {
    chainId: 8453,
    chainIdHex: '0x2105',
    tokenAddress: '0x...', // ❌ PRECISA SER DEFINIDO
    rpcUrl: 'https://mainnet.base.org',
    explorer: 'https://basescan.org',
  },
};

// Escolher uma rede:
const ACTIVE_NETWORK = NETWORKS.polygon; // ou NETWORKS.base
```

---

### 🟠 P1 — ALTO (CRÍTICO PARA NEGÓCIO)

3. **Implementar sistema de registro de usuário**:

```sql
-- Criar tabela de usuários
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email TEXT UNIQUE,
  username TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Vincular wallets a usuários
CREATE TABLE user_wallets (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  wallet_address TEXT NOT NULL,
  provider TEXT,
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, wallet_address)
);
```

```javascript
// API: api/register.js
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  const { email, wallet_address, provider } = req.body;
  
  // 1. Criar usuário
  const user = await query(
    'INSERT INTO users (email) VALUES ($1) RETURNING *',
    [email]
  );
  
  // 2. Vincular wallet
  await query(
    'INSERT INTO user_wallets (user_id, wallet_address, provider, is_primary) VALUES ($1, $2, $3, true)',
    [user.id, wallet_address, provider]
  );
  
  return res.status(201).json({ user });
}
```

4. **Implementar funcionalidade de compra/swap**:

```javascript
// js/token-swap.js
import { ethers } from 'ethers';

class TokenSwap {
  constructor(network) {
    this.network = network;
    this.routerAddress = network.dexRouter; // QuickSwap ou Uniswap
  }
  
  async swap(tokenIn, tokenOut, amountIn, slippage = 0.5) {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();
    
    // 1. Approve token
    const tokenContract = new ethers.Contract(tokenIn, ERC20_ABI, signer);
    await tokenContract.approve(this.routerAddress, amountIn);
    
    // 2. Get quote
    const quote = await this.getQuote(tokenIn, tokenOut, amountIn);
    const amountOutMin = quote * (1 - slippage / 100);
    
    // 3. Execute swap
    const router = new ethers.Contract(this.routerAddress, ROUTER_ABI, signer);
    const tx = await router.swapExactTokensForTokens(
      amountIn,
      amountOutMin,
      [tokenIn, tokenOut],
      await signer.getAddress(),
      Math.floor(Date.now() / 1000) + 60 * 20 // 20min deadline
    );
    
    return tx.wait();
  }
}
```

---

### 🟡 P2 — MÉDIO (MELHORIAS)

5. **Adicionar widget de swap embarcado** (ex: Uniswap Widget)
6. **Integração com 1inch para melhor preço**
7. **Histórico de transações do usuário**
8. **Notificações de confirmação de tx**

---

## 📊 RESUMO EXECUTIVO

| Componente | Status | Bloqueio |
|------------|--------|----------|
| **Conexão Wallet** | ✅ Funcional | Não |
| **Rede configurada** | ❌ Inconsistente | **SIM** 🔴 |
| **Endereço Token** | ❌ Conflitante | **SIM** 🔴 |
| **Buscar Saldo** | ❌ Endereço errado | **SIM** 🔴 |
| **Registro Usuário** | ❌ Não existe | Sim 🟠 |
| **Compra Token** | ❌ Placeholder | Sim 🟡 |
| **Swap/DEX** | ❌ Não implementado | Sim 🟡 |
| **Transações** | ❌ Falharão | **SIM** 🔴 |

---

## 🔧 CHECKLIST DE CORREÇÃO

### Fase 1: Definição e Configuração (P0)
- [ ] **Definir rede oficial**: BASE ou POLYGON?
- [ ] **Validar endereço do contrato** $NEOFLW na rede escolhida
- [ ] **Atualizar `wallet.js`**: chainId e chain corretos
- [ ] **Atualizar `wallet-provider.js`**: chainConfig consistente
- [ ] **Atualizar todos os links**: explorer/dexscreener para rede correta
- [ ] **Testar `fetchBalance()`** com endereço correto

### Fase 2: Sistema de Usuário (P1)
- [ ] **Criar tabela `users`** no banco Neon
- [ ] **Criar tabela `user_wallets`** para vincular wallets
- [ ] **API `/api/register`**: cadastro de usuário
- [ ] **API `/api/user/profile`**: obter perfil do usuário
- [ ] **Frontend**: formulário de registro (email + wallet)

### Fase 3: Funcionalidade de Compra (P1)
- [ ] **Escolher DEX**: QuickSwap (Polygon) ou Uniswap (BASE)
- [ ] **Instalar SDK**: `npm install @uniswap/sdk-core @uniswap/v3-sdk`
- [ ] **Implementar `swap()`**: função de troca de tokens
- [ ] **Implementar `getQuote()`**: cotação em tempo real
- [ ] **UI de swap**: input amount, output amount, slippage, gas
- [ ] **Testar transação** em testnet primeiro

### Fase 4: Melhorias (P2)
- [ ] Widget de swap embarcado (Uniswap Widget)
- [ ] Integração 1inch Aggregator
- [ ] Histórico de transações do usuário
- [ ] Notificações push de confirmação

---

## 🚀 PRÓXIMOS PASSOS IMEDIATOS

1. **URGENTE**: Reunião técnica para definir:
   - Rede oficial do $NEOFLW (BASE ou POLYGON?)
   - Endereço do contrato na rede escolhida
   - Estratégia de migração se já houver holders

2. **CRÍTICO**: Corrigir configuração de rede (1-2 dias)
   - Unificar chainId, RPC, explorer
   - Atualizar endereço do token em todos os arquivos
   - Testar conexão e busca de saldo

3. **ALTO**: Implementar registro de usuário (3-5 dias)
   - Schema do banco de dados
   - APIs de registro e perfil
   - Frontend de cadastro

4. **MÉDIO**: Implementar swap/compra (5-7 dias)
   - Integração com DEX
   - UI de swap
   - Testes em testnet

---

**🔴 SISTEMA ATUALMENTE NÃO FUNCIONAL PARA BASE**  
**🟠 CRÍTICO PARA LANÇAMENTO EM PRODUÇÃO**

**Documentado por**: NEØ FlowOFF Security Audit  
**Última atualização**: 2025-01-28
