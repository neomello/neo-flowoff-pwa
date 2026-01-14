# NEOFlowOFF PWA - Token Integration

Integração completa do token **NEOFlowOFF (NEOFLW)** com Account Abstraction usando MetaMask Smart Accounts.

## 📦 Stack Tecnológica

-  **Web3Auth**: Autenticação de usuários + RPC e Bundler próprios
-  **IPFS.io + Storacha**: Armazenamento de dados
-  **Infura**: RPC e Bundler (opcional - fallback se não usar Web3Auth)
-  **MetaMask Smart Accounts**: Account Abstraction para o token

## 🎯 Token NEOFlowOFF

-  **Endereço:** `0xece94d3719fc6fde7275051a54caf1f7d5098d59`
-  **Símbolo:** NEOFLW
-  **Rede:** Polygon
-  **Link:** [PolygonScan](https://polygonscan.com/token/0xece94d3719fc6fde7275051a54caf1f7d5098d59)

## 📋 Instalação

### 1. Instalar Dependências

```bash
npm install @metamask/smart-accounts-kit viem @web3auth/modal @web3auth/base
# ou
yarn add @metamask/smart-accounts-kit viem @web3auth/modal @web3auth/base
```

### 2. Backend Neon SQL (serverless)

**Variáveis obrigatórias para banco:**

-  `DATABASE_URL` (pooler do Neon)
-  Opcional: `DATABASE_URL_UNPOOLED` / `POSTGRES_URL_NON_POOLING`

**Migrações:**

-  `npm run db:migrate` (aplica `migrations/` e registra em `schema_migrations`)

**Endpoints serverless:**

-  `api/health-db.js` — `GET /api/health-db` (ping no Neon)
-  `api/leads.js` — `POST /api/leads` (salva lead)
-  `api/wallet-sessions.js` — `POST/GET` sessões de wallet
-  `api/tx-logs.js` — `POST/GET` logs de transação

### 3. Configurar Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto (veja `env-example.txt`):

```bash
# Neon Postgres (Backend Database - OBRIGATÓRIO para backend)
DATABASE_URL=postgresql://user:password@ep-xxx.region.aws.neon.tech/neondb?sslmode=require

# Web3Auth (Autenticação)
WEB3AUTH_CLIENT_ID=seu_web3auth_client_id
NEXT_PUBLIC_WEB3AUTH_CLIENT_ID=seu_web3auth_client_id

# DRPC (RPC Pago - RECOMENDADO)
# ⚠️ IMPORTANTE: Use a URL completa
DRPC_RPC_KEY=https://lb.drpc.live/polygon/sua_chave_aqui

# Storacha (IPFS)
STORACHA_DID=seu_agent_did
STORACHA_UCAN=seu_ucan_token
NEXT_PUBLIC_STORACHA_ENDPOINT=https://api.storacha.com

# Wallet (para scripts de teste - opcional)
# PRIVATE_KEY=sua_private_key
```

**Configure no Vercel:**

```bash
npm run check:env  # Verifica variáveis configuradas na Vercel
```

## 🚀 Scripts Disponíveis

### Database (Backend)

```bash
# Aplicar migrações SQL ao banco Neon
npm run db:migrate

# Verificar variáveis de ambiente na Vercel
npm run check:env
```

### Teste Básico

```bash
npx tsx examples/integrate-token-smart-accounts.ts
```

### Integração Completa

```bash
npx tsx examples/integrate-token-full-stack.ts
```

## 📚 Documentação

-  **Guia Completo:** `docs/integracao/GUIA_INTEGRACAO_STACK_COMPLETA.md`
-  **Guia Básico:** `docs/integracao/GUIA_INTEGRACAO_TOKEN_SMART_ACCOUNTS.md`
-  **Resumo:** `docs/integracao/RESUMO_INTEGRACAO_STACK.md`

## 💻 Uso no Website

### Exemplo Básico

```typescript
import { NEOFlowOFFIntegration } from './examples/integrate-token-website-example';

const integration = new NEOFlowOFFIntegration();
await integration.initializeSmartAccount(signer, walletAddress);

// Obter saldo
const balance = await integration.getBalance(walletAddress);

// Transferir
const hash = await integration.transfer(recipientAddress, '100');
```

### Exemplo Completo (Web3Auth + IPFS)

```typescript
import { NEOFlowOFFFullStackIntegration } from './examples/integrate-token-full-stack';

const integration = new NEOFlowOFFFullStackIntegration();
await integration.initializeWeb3Auth();
await integration.initializeSmartAccount(web3AuthSigner, address);

// Transferir e salvar no IPFS
const { txHash, ipfsHash } = await integration.transferAndSave(
  recipientAddress,
  '100'
);
```

## 📁 Estrutura de Arquivos

```text
neo-flowoff-pwa/
├── examples/
│   ├── integrate-token-smart-accounts.ts      # Script básico de teste
│   ├── integrate-token-full-stack.ts          # Classe completa de integração
│   ├── integrate-token-website-example.ts     # Exemplo básico para website
│   └── integrate-token-website-full-stack.tsx # Componente React/Next.js
├── docs/
│   └── integracao/
│       ├── GUIA_INTEGRACAO_STACK_COMPLETA.md
│       ├── GUIA_INTEGRACAO_TOKEN_SMART_ACCOUNTS.md
│       └── RESUMO_INTEGRACAO_STACK.md
└── README.md
```

## 🔗 Links Úteis

-  **Token:** [PolygonScan](https://polygonscan.com/token/0xece94d3719fc6fde7275051a54caf1f7d5098d59)
-  **Web3Auth:** [Documentação](https://web3auth.io/docs)
-  **IPFS Gateway:** [IPFS.io](https://ipfs.io)
-  **MetaMask Smart Accounts:** [Documentação](https://docs.gator.metamask.io)
-  **Infura:** [Documentação](https://infura.io/docs)

## 📝 Próximos Passos

1.  Configure as variáveis de ambiente
2.  Instale as dependências
3.  Execute os scripts de teste
4.  Integre no seu website
5.  Deploy em produção

---

## 🚀 Pronto para Integrar

O projeto está configurado e pronto para uso.

## Contact

[neo@neoprotocol.space](mailto:neo@neoprotocol.space)

</div>

<div align="center">
  <a href="https://x.com/node_mello">
    <img src="https://img.shields.io/badge/-@node_mello-ff008e?style=flat-square&logo=twitter&logoColor=white" alt="Twitter @node_mello" />
  </a>
  <a href="https://www.instagram.com/neoprotocol.eth/">
    <img src="https://img.shields.io/badge/-@neoprotocol.eth-ff008e?style=flat-square&logo=instagram&logoColor=white" alt="Instagram @neoprotocol.eth" />
  </a>
  <a href="https://etherscan.io/">
    <img src="https://img.shields.io/badge/-neomello.eth-ff008e?style=flat-square&logo=ethereum&logoColor=white" alt="Ethereum neomello.eth" />
  </a>
</div>

<div align="center">
  <i>"Expand until silence becomes structure."</i>
</div>
