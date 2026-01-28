# 🚀 NEØ FlowOFF - Agência Digital Web3

[![Status](https://img.shields.io/badge/status-LIVE-success)](https://neoflowoff.xyz)
[![Network](https://img.shields.io/badge/network-BASE-blue)](https://base.org)
[![Pool](https://img.shields.io/badge/pool-Uniswap%20V3-ff007a)](https://app.uniswap.org)
[![License](https://img.shields.io/badge/license-MIT-green)](LICENSE)

**Agência digital especializada em soluções Web3** - Oferecemos serviços completos de desenvolvimento, tokenização e gamificação para projetos descentralizados. O token $NEOFLW é nossa moeda nativa, negociada na BASE Network.

---

## 🎯 Sobre a NEØ FlowOFF

A **NEØ FlowOFF** é uma agência digital especializada em Web3, oferecendo:

- 🔧 **Desenvolvimento Full-Stack** — DApps, PWAs, Smart Contracts
- 🪙 **Tokenização** — Criação e gestão de tokens ERC-20
- 🎮 **Gamificação** — Sistemas de pontos, recompensas e engajamento
- 📊 **Consultoria Web3** — Estratégias de lançamento e crescimento
- 🚀 **Integração DeFi** — Pools de liquidez, swaps, staking

### Ecossistema

Desenvolvido pela **[NEØ SMART FACTORY](https://github.com/neo-smart-token-factory)**, nossa organização open-source focada em ferramentas e padrões Web3.

---

## 💎 Token $NEOFLW - Moeda Nativa da Agência

### Informações Oficiais

```
┌─────────────────────────────────────────────────────────────────┐
│  Contrato: 0x41F4ff3d45DED9C1332e4908F637B75fe83F5d6B           │
│  Rede: BASE (Chain ID: 8453)                                    │
│  Símbolo: NEOFLW                                                │
│  Decimals: 18                                                   │
│  Padrão: NeoTokenV2 (ERC-20 compatível)                         │
└─────────────────────────────────────────────────────────────────┘
```

### Links Importantes

- **BaseScan**: https://basescan.org/token/0x41F4ff3d45DED9C1332e4908F637B75fe83F5d6B
- **Uniswap V3**: https://app.uniswap.org/explore/pools/8453
- **DexScreener**: https://dexscreener.com/base/0x41F4ff3d45DED9C1332e4908F637B75fe83F5d6B
- **Pool Tx**: https://basescan.org/tx/0xeb700565f74b510e5b713c7066b646033132c9552c8722130c14556b7e4b3d23

---

## ✨ Soluções Oferecidas

### 🎮 Plataforma de Gamificação Completa

- ✅ **Sistema de Pontos** — 9 ações configuradas (cadastro, wallet, compartilhamento, etc)
- ✅ **Sistema de Referral** — Código único + compartilhamento social (Twitter, Facebook)
- ✅ **Leaderboard** — Ranking em tempo real (top 100)
- ✅ **Tiers Automáticos** — Bronze → Silver → Gold → Platinum → Diamond
- ✅ **Toast Notifications** — Feedback visual animado

### 💰 Trading & DeFi

- ✅ **Pool Uniswap V3** — Par NEOFLW/WETH na BASE
- ✅ **Swap Integrado** — Troca ETH → $NEOFLW direto no site
- ✅ **Slippage Control** — Proteção contra front-running
- ✅ **Auto Network Switch** — Detecta e muda para BASE automaticamente

### 🔗 Wallet Integration

- ✅ **MetaMask** — Suporte nativo
- ✅ **WalletConnect** — Carteiras móveis
- ✅ **Web3Auth** — Login social (configurável)
- ✅ **Onboarding Modal** — Experiência pós-conexão

### 📊 Backend Completo

- ✅ **10 Tabelas SQL** — Neon Database (users, wallets, points, referrals, etc)
- ✅ **8 APIs REST** — Otimizadas para Vercel Hobby
- ✅ **3 Views Automáticas** — Queries pré-calculadas
- ✅ **3 Triggers** — Atualização automática de totais

---

## 🎯 Sistema de Pontos

### Ações Configuradas

| Ação | Pontos | Limite |
|------|--------|--------|
| Cadastro | 10 | 1x |
| Conectar Wallet | 20 | 1x |
| Compartilhar (Twitter/Facebook) | 15 | 5x |
| Convidar Amigo | 50 | ∞ |
| Tutorial Completo | 30 | 1x |
| Primeira Compra | 100 | 1x |
| Login Diário | 5 | 1x/dia |
| Perfil Completo | 25 | 1x |

### Tiers Automáticos

- 🥉 **Bronze**: 0-99 pontos
- 🥈 **Silver**: 100-249 pontos
- 🥇 **Gold**: 250-499 pontos
- 💎 **Platinum**: 500-999 pontos
- 💠 **Diamond**: 1000+ pontos

---

## 🚀 Quick Start

### 1. Clone o Repositório

```bash
git clone https://github.com/neomello/neo-flowoff-pwa.git
cd neo-flowoff-pwa
```

### 2. Instalar Dependências

```bash
npm install
```

### 3. Configurar Variáveis de Ambiente

Crie um arquivo `.env` na raiz:

```bash
# Neon Database (obrigatório)
DATABASE_URL=postgresql://user:password@ep-xxx.region.aws.neon.tech/neondb?sslmode=require

# Web3Auth (opcional - para login social)
WEB3AUTH_CLIENT_ID=seu_client_id

# APIs Externas (configuradas)
RESEND_API_KEY=seu_api_key
CLOUDINARY_API_KEY=seu_api_key
```

### 4. Executar Migrações SQL

```bash
# Via psql direto
PGPASSWORD='sua_senha' psql -h host.neon.tech -U user -d neondb -f migrations/001_create_users_tables.sql
PGPASSWORD='sua_senha' psql -h host.neon.tech -U user -d neondb -f migrations/002_create_points_system.sql
```

### 5. Build & Deploy

```bash
# Build local
npm run build

# Deploy na Vercel
vercel --prod
```

---

## 📡 APIs Disponíveis

### Sistema de Pontos

```bash
# Consultar saldo
GET /api/points?wallet_address=0x...

# Registrar ação
POST /api/points
{
  "wallet_address": "0x...",
  "action_type": "wallet_connect",
  "metadata": {}
}
```

### Sistema de Referral

```bash
# Criar código
POST /api/referral?action=create
{
  "wallet_address": "0x..."
}

# Usar código
POST /api/referral?action=use
{
  "referral_code": "NEOFLW1234ABC",
  "referee_wallet": "0x..."
}
```

### Leaderboard

```bash
# Top 100 usuários
GET /api/leaderboard?limit=100
```

### Health Check

```bash
# Status básico
GET /api/health

# Status + banco de dados
GET /api/health?check=db
```

---

## 🏗️ Arquitetura

### Frontend

```
/
├── index.html — Homepage mobile
├── desktop.html — Homepage desktop
├── js/
│   ├── wallet.js — Gerenciador de wallets
│   ├── wallet-provider.js — SDKs (MetaMask, WalletConnect, Web3Auth)
│   ├── wallet-onboarding.js — Experiência pós-conexão
│   ├── points-system.js — Sistema de pontos
│   ├── referral-system.js — Sistema de referral
│   ├── leaderboard-widget.js — Widget de ranking
│   ├── token-swap.js — Lógica de swap Uniswap V3
│   ├── swap-ui.js — Interface de swap
│   └── user-registration.js — Registro de usuário
└── css/ — Estilos modulares
```

### Backend (Vercel Serverless)

```
api/
├── health.js — Health check (básico + db)
├── lead.js — Captura de leads
├── leaderboard.js — Ranking de pontos
├── points.js — Pontos (balance + record)
├── referral.js — Referral (create + use)
├── register.js — Registro de usuário
├── tx-logs.js — Logs de transações
├── wallet-sessions.js — Sessões de wallet
├── db.js — Conexão Neon Database
└── utils.js — Utilitários (CORS, validação, rate limiting)
```

### Database (Neon PostgreSQL)

```sql
-- Tabelas Principais
users                    -- Usuários cadastrados
user_wallets             -- Wallets vinculadas
user_sessions            -- Sessões de login
user_points              -- Histórico de pontos
user_totals              -- Cache de totais
referrals                -- Sistema de convites
token_claims             -- Resgates de tokens
leaderboard_snapshots    -- Snapshots do ranking
points_config            -- Configuração de pontos
airdrop_whitelist        -- Lista de elegíveis

-- Views
v_users_with_wallets     -- Usuários com wallets
v_leaderboard            -- Ranking ativo
v_referral_stats         -- Estatísticas de referral
```

---

## 🎯 Fluxo do Usuário

### 1. Primeiro Acesso

```
    ┌────────────────────────────────────┐
    │  Usuário acessa neoflowoff.xyz     │
    └──────────────┬─────────────────────┘
                   │
                   ▼
    ┌────────────────────────────────────┐
    │  Clica em "ACESSAR"                │
    └──────────────┬─────────────────────┘
                   │
                   ▼
    ┌────────────────────────────────────┐
    │  Conecta MetaMask/WalletConnect    │
    └──────────────┬─────────────────────┘
                   │
                   ▼
    ┌────────────────────────────────────┐
    │  Sistema detecta primeira conexão  │
    └──────────────┬─────────────────────┘
                   │
                   ▼
    ┌────────────────────────────────────┐
    │  ✅ Ganha 20 pontos                │
    │     (wallet_connect)               │
    └──────────────┬─────────────────────┘
                   │
                   ▼
    ┌────────────────────────────────────┐
    │  Modal de boas-vindas aparece      │
    └────────────────────────────────────┘
```

### 2. Ações Disponíveis

```
         Modal de Boas-Vindas
    ╔═════════════════════════════╗
    ║  💰 Comprar $NEOFLW         ║ ──→ Swap ETH/NEOFLW
    ║  📝 Criar Conta             ║ ──→ Registro completo
    ║  🎁 Convidar Amigos         ║ ──→ Código de referral
    ║  🏆 Ver Ranking             ║ ──→ Leaderboard
    ╚═════════════════════════════╝
```

### 3. Sistema Viral

```
    ┌──────────────────────────────────────────┐
    │  Usuário compartilha código:             │
    │  NEOFLW1234ABC                           │
    └────────────────┬─────────────────────────┘
                     │
                     ▼
    ┌──────────────────────────────────────────┐
    │  Amigo acessa site com                   │
    │  ?ref=NEOFLW1234ABC                      │
    └────────────────┬─────────────────────────┘
                     │
                     ▼
    ┌──────────────────────────────────────────┐
    │  Amigo conecta wallet                    │
    └────────────────┬─────────────────────────┘
                     │
                     ▼
    ┌──────────────────────────────────────────┐
    │  ✅ Usuário ganha 50 pontos              │
    │     (referral)                           │
    └────────────────┬─────────────────────────┘
                     │
                     ▼
    ┌──────────────────────────────────────────┐
    │  🏆 Usuário sobe no ranking              │
    └──────────────────────────────────────────┘
```

---

## 📊 Otimização Vercel

Este projeto está otimizado para o **plano Hobby** da Vercel:

- **Limite**: 12 Serverless Functions
- **Uso atual**: 8 funções
- **Margem**: 4 funções (33%)
- **Custo**: $0/mês

### Consolidação Realizada

- ✅ `api/points.js` — Balance + Record (antes: 2 funções)
- ✅ `api/referral.js` — Create + Use (antes: 2 funções)
- ✅ `api/health.js` — Basic + DB (antes: 2 funções)

---

## 🔐 Segurança

### Contratos Verificados

- ✅ Token verificado no BaseScan
- ✅ Pool Uniswap V3 oficial
- ✅ Código auditável no GitHub

### Backend

- ✅ Rate limiting (por IP)
- ✅ Input sanitization
- ✅ SQL injection protection (prepared statements)
- ✅ CORS configurado
- ✅ Content Security Policy

### Frontend

- ✅ Detecção de rede automática
- ✅ Validação de endereços Ethereum
- ✅ Proteção contra double-spending
- ✅ Slippage control

---

## 📈 Métricas & Analytics

### KPIs Iniciais

- **Wallets conectadas**: Tracking via `user_wallets`
- **Pontos distribuídos**: Tracking via `user_points`
- **Referrals ativos**: Tracking via `referrals`
- **Volume de trading**: Tracking via Uniswap events

### Queries SQL Úteis

```sql
-- Total de usuários
SELECT COUNT(*) FROM users;

-- Top 10 ranking
SELECT * FROM v_leaderboard LIMIT 10;

-- Estatísticas de referral
SELECT * FROM v_referral_stats ORDER BY total_referrals DESC;

-- Pontos distribuídos por ação
SELECT action_type, SUM(points) FROM user_points GROUP BY action_type;
```

---

## 🛠️ Desenvolvimento

### Scripts Disponíveis

```bash
npm run build          # Build de produção
npm run dev            # Servidor de desenvolvimento
npm run test           # Rodar testes
npm run lint           # Verificar código
```

### Estrutura de Branches

- `main` — Produção (auto-deploy Vercel)
- `develop` — Desenvolvimento
- `feature/*` — Novas funcionalidades

---

## 📚 Documentação Adicional

- **[NEO_SMART_FACTORY.md](docs/NEO_SMART_FACTORY.md)** — Info oficial do token
- **[LAUNCH_READY.md](docs/LAUNCH_READY.md)** — Guia de lançamento
- **[LAUNCH_STRATEGY.md](docs/LAUNCH_STRATEGY.md)** — Estratégia de marketing
- **[VERCEL_OPTIMIZATION.md](docs/VERCEL_OPTIMIZATION.md)** — Otimização de funções
- **[SWAP_REGISTRATION_GUIDE.md](docs/SWAP_REGISTRATION_GUIDE.md)** — Guia técnico swap/registro
- **[BASE_MIGRATION.md](docs/BASE_MIGRATION.md)** — Migração para BASE

---

## 🤝 Trabalhe Conosco

Interessado em nossos serviços ou quer contribuir? Entre em contato:

### Para Clientes

- 💼 **Consultoria Web3** — Agende uma conversa
- 🚀 **Desenvolvimento** — Solicite um orçamento
- 🎯 **Tokenização** — Crie seu próprio token

### Para Desenvolvedores

Quer contribuir com nosso ecossistema open-source?

1. Fork o repositório
2. Crie uma branch: `git checkout -b feature/nova-feature`
3. Commit: `git commit -m 'feat: adicionar nova feature'`
4. Push: `git push origin feature/nova-feature`
5. Abra um Pull Request

---

## 📞 Contato

### Agência NEØ FlowOFF

- 🌐 **Site**: https://neoflowoff.xyz
- 🐦 **Twitter**: https://twitter.com/neoflw_on_chain
- 📧 **Email**: neosmart.factory@gmail.com
- 💬 **Discord**: [Em breve]

### Open Source

- **GitHub Factory**: https://github.com/neo-smart-token-factory
- **Documentação**: https://github.com/neo-smart-token-factory/docs

---

## 📄 Licença

Este projeto está licenciado sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

---

## ⚠️ Contratos Descontinuados

**ATENÇÃO**: Os seguintes contratos NÃO devem mais ser usados:

- ❌ `0x6575933669e530dC25aaCb496cD8e402B8f26Ff5` (ThirdWeb — descontinuado)
- ❌ `0x59aa4EaE743d608FBDd4205ebA59b38DCA755Dd2` (Polygon — descontinuado)

**ÚNICO CONTRATO VÁLIDO**: `0x41F4ff3d45DED9C1332e4908F637B75fe83F5d6B` (BASE)

---

## 🎉 Status do Projeto

```
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║  ✅ Token deployado (BASE)                               ║
║  ✅ Pool Uniswap V3 ativa                                ║
║  ✅ Trading funcionando                                  ║
║  ✅ Sistema de pontos completo                           ║
║  ✅ Sistema de referral completo                         ║
║  ✅ Leaderboard em tempo real                            ║
║  ✅ 10 tabelas SQL operacionais                          ║
║  ✅ 8 APIs REST otimizadas                               ║
║  ✅ Frontend totalmente integrado                        ║
║  ✅ Documentação completa                                ║
║                                                           ║
║            STATUS: 🟢 LIVE — READY TO SCALE              ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
```

---

---

## 🎨 Portfólio

### Projetos da Agência NEØ FlowOFF

- ✅ **NEØ FlowOFF Token** — $NEOFLW na BASE (este projeto)
- 🔄 **DeFi Solutions** — Pools, Swaps, Staking
- 🎮 **Gamification Engine** — Sistema de pontos reutilizável
- 🔗 **Multi-chain Bridge** — Em desenvolvimento

### Tecnologias Utilizadas

- **Blockchain**: Ethereum, BASE, Polygon
- **Frontend**: PWA, HTML5, JavaScript (Vanilla)
- **Backend**: Node.js, Vercel Serverless
- **Database**: PostgreSQL (Neon)
- **DeFi**: Uniswap V3, 0x Protocol
- **Wallet**: MetaMask, WalletConnect, Web3Auth

---

**Desenvolvido com ❤️ pela Agência NEØ FlowOFF**

*Transformando ideias em realidade Web3* 🚀
