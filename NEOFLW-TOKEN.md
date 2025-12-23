# 🪙 Token NEOFLW - Documentação Completa

**Token oficial da NEØ.FLOWOFF na Base Network**

---

## 📋 Informações Básicas

- **Nome:** NEOFlowOFF
- **Símbolo:** NEOFLW
- **Decimais:** 18
- **Rede:** Base (Chain ID: 8453)
- **Padrão:** ERC-20
- **Twitter/X:** [@neoflw_on_chain](https://twitter.com/neoflw_on_chain)

---

## 🔗 Endereços e Links

### Contrato do Token
- **Endereço:** `0x6575933669e530dC25aaCb496cD8e402B8f26Ff5`
- **Basescan (Token):** https://basescan.org/token/0x6575933669e530dc25aacb496cd8e402b8f26ff5
- **Basescan (Contrato):** https://basescan.org/address/0x6575933669e530dc25aacb496cd8e402b8f26ff5
- **Thirdweb Dashboard:** https://thirdweb.com/base/0x6575933669e530dC25aaCb496cD8e402B8f26Ff5

### Pool de Liquidez (Uniswap V3)
- **Pool:** NEOFLW/WETH
- **NFT da Posição (LP):** https://basescan.org/nft/0x46a15b0b27311cedf172ab29e4f4766fbe7f4364/945419
- **Uniswap Pools (Base):** https://app.uniswap.org/explore/pools/8453
- **Transação de Liquidez:** https://basescan.org/tx/0x2d554f992624e5931d88966d3dbb23f28c4ab5ce01e9140f729b124738977f59

### Dexscreener
- **Dexscreener (Base - NEOFLW):** https://dexscreener.com/base/0x6575933669e530dC25aaCb496cD8e402B8f26Ff5

---

## ✅ Status do Projeto

### Tarefas Concluídas

- [x] **Deploy do Token NEOFLW**  
  Contrato: `0x6575933669e530dC25aaCb496cD8e402B8f26Ff5`
  
- [x] **Criação e injeção de liquidez inicial na pool Uniswap V3 (NEOFLW/WETH)**  
  Transação confirmada: `0x2d554f992624e5931d88966d3dbb23f28c4ab5ce01e9140f729b124738977f59`
  
- [x] **Visualização e gestão no Uniswap Pools**  
  Pool ativa e visível em: https://app.uniswap.org/explore/pools/8453
  
- [x] **Pool indexada na Dexscreener**  
  Disponível em: https://dexscreener.com/base/0x6575933669e530dC25aaCb496cD8e402B8f26Ff5

### Tarefas Pendentes

- [ ] **Revisar se a logo IPFS carrega corretamente**
  - Verificar acesso: `https://ipfs.io/ipfs/[CID_DA_IMAGEM]`
  - Testar gateways alternativos:
    - `https://cloudflare-ipfs.com/ipfs/[CID]`
    - `https://dweb.link/ipfs/[CID]`
  - Se não carregar, reupar usando:
    - [nft.storage](https://nft.storage/)
    - [web3.storage](https://web3.storage/)
  - Atualizar referência on-chain se necessário (via função admin/minter)

---

## 🛠️ Recursos do Token

### Features Implementadas
- ✅ Mintable (permitido criar novos tokens)
- ✅ Burnable (permitido queimar tokens)
- ✅ Permit (assinatura para aprovação de gastos)
- ✅ Votes (governança por votação)
- ✅ Delegatable (delegação de votos)

### Compilador
- **Versão:** v0.8.23+commit.f704f362

---

## 🚀 Capacidades do Smart Contract

O contrato TokenERC20 da Thirdweb implementa um ERC-20 completo com funcionalidades avançadas. Abaixo está o que o contrato é capaz de fazer e como pode ser utilizado na plataforma NEØ.FLOWOFF:

### 1. 💰 Funções Básicas ERC-20

#### `transfer(address to, uint256 amount)`
- **O que faz:** Transfere tokens de uma carteira para outra
- **Uso na plataforma:** 
  - Pagamentos entre usuários
  - Pagamento por serviços de marketing/desenvolvimento
  - Recompensas por atividades na plataforma
  - Transferências diretas via interface

#### `transferFrom(address from, address to, uint256 amount)`
- **O que faz:** Transfere tokens de uma carteira autorizada (via `approve`)
- **Uso na plataforma:**
  - Integrações com DEXs (Uniswap, etc)
  - Pagamentos automatizados (subscriptions)
  - Aprovações para contratos inteligentes

#### `approve(address spender, uint256 amount)`
- **O que faz:** Autoriza outro endereço a gastar tokens em seu nome
- **Uso na plataforma:**
  - Pré-aprovação para swaps
  - Aprovação para staking pools
  - Integração com DeFi protocols

#### `allowance(address owner, address spender)`
- **O que faz:** Verifica quanto um endereço está autorizado a gastar
- **Uso na plataforma:**
  - Verificação de limites de gasto
  - UI para mostrar aprovações pendentes
  - Segurança em operações de terceiros

#### `balanceOf(address account)`
- **O que faz:** Retorna o saldo de tokens de uma carteira
- **Uso na plataforma:**
  - ✅ **Já implementado** em `js/wallet.js` (função `fetchBalance()`)
  - Dashboard de saldo do usuário
  - Verificação de elegibilidade para features premium

#### `totalSupply()`
- **O que faz:** Retorna o total de tokens em circulação
- **Uso na plataforma:**
  - Exibição de métricas do token
  - Cálculos de distribuição
  - Analytics e dashboards

### 2. 🔥 Mint & Burn (Criação e Queima)

#### `mintTo(address to, uint256 amount)`
- **O que faz:** Cria novos tokens e envia para um endereço (requer role MINTER)
- **Uso na plataforma:**
  - ✅ Distribuição de recompensas por serviços prestados
  - ✅ Airdrops para usuários ativos
  - ✅ Recompensas por participação em campanhas
  - ✅ Pagamento de comissões para afiliados
  - ✅ Bonificações por milestones atingidos

#### `mintWithSignature(MintRequest req, bytes signature)`
- **O que faz:** Cria tokens via assinatura off-chain (gasless minting)
- **Uso na plataforma:**
  - ✅ **Gasless rewards** - usuários recebem tokens sem pagar gas
  - ✅ Sistema de vouchers/cupons assinados
  - ✅ Recompensas automáticas via backend
  - ✅ Integração com sistemas de fidelidade

#### `burn(uint256 amount)`
- **O que faz:** Queima tokens do próprio saldo
- **Uso na plataforma:**
  - ✅ Deflação controlada (queimar taxas de transação)
  - ✅ Redução de oferta para aumentar valor
  - ✅ Queima de tokens não utilizados

#### `burnFrom(address account, uint256 amount)`
- **O que faz:** Queima tokens de outro endereço (requer aprovação)
- **Uso na plataforma:**
  - ✅ Queima programada via contratos
  - ✅ Auto-burn de tokens em determinadas condições
  - ✅ Sistema de penalidades

### 3. ✍️ Permit (Gasless Approvals - EIP-2612)

#### `permit(address owner, address spender, uint256 value, uint256 deadline, uint8 v, bytes32 r, bytes32 s)`
- **O que faz:** Aprovação via assinatura off-chain (não precisa de transação)
- **Uso na plataforma:**
  - ✅ **UX melhorada** - aprovações sem gas fee
  - ✅ Integrações mais rápidas com DEXs
  - ✅ Aprovações via mobile wallets
  - ✅ Fluxos de onboarding simplificados

### 4. 🗳️ Governança (ERC-5805 Voting)

#### `delegate(address delegatee)`
- **O que faz:** Delega poder de voto para outro endereço
- **Uso na plataforma:**
  - ✅ **Sistema de governança DAO** - holders votam em propostas
  - ✅ Votação em features da plataforma
  - ✅ Decisões sobre destinação de fundos
  - ✅ Propostas de mudanças de protocolo

#### `delegateBySig(address delegatee, uint256 nonce, uint256 expiry, uint8 v, bytes32 r, bytes32 s)`
- **O que faz:** Delegação via assinatura off-chain (gasless)
- **Uso na plataforma:**
  - ✅ Votação sem custo de gas
  - ✅ Integração com interfaces de governança
  - ✅ Delegar votos programaticamente

#### `getVotes(address account)`
- **O que faz:** Retorna votos atuais de um endereço (incluindo delegados)
- **Uso na plataforma:**
  - ✅ Dashboard de poder de voto
  - ✅ Verificação de elegibilidade para propostas
  - ✅ Interface de governança

#### `getPastVotes(address account, uint256 timepoint)`
- **O que faz:** Retorna votos históricos em um bloco específico
- **Uso na plataforma:**
  - ✅ Verificação de snapshots de voto
  - ✅ Audit trail de governança
  - ✅ Propostas com snapshots históricos

#### `checkpoints(address account, uint32 pos)`
- **O que faz:** Retorna checkpoint de votos (histórico)
- **Uso na plataforma:**
  - ✅ Visualização de histórico de poder de voto
  - ✅ Analytics de governança
  - ✅ Transparência de decisões

### 5. 👑 Role-Based Access Control (RBAC)

#### `grantRole(bytes32 role, address account)`
- **O que faz:** Concede role a um endereço (requer ADMIN)
- **Uso na plataforma:**
  - ✅ Controle de quem pode mintear tokens
  - ✅ Administração de funcionalidades
  - ✅ Gestão de equipe e permissões

#### `hasRole(bytes32 role, address account)`
- **O que faz:** Verifica se endereço tem determinada role
- **Uso na plataforma:**
  - ✅ Verificação de permissões antes de ações
  - ✅ Restrições de acesso a features admin
  - ✅ Segurança em operações sensíveis

### 6. 💎 Platform Fees (Taxas da Plataforma)

#### `setPlatformFeeInfo(address _platformFeeRecipient, uint256 _platformFeeBps)`
- **O que faz:** Configura endereço e percentual de taxa da plataforma
- **Uso na plataforma:**
  - ✅ **Taxa em transações** - receita automática
  - ✅ Sustentabilidade financeira do projeto
  - ✅ Fundo de desenvolvimento

#### `getPlatformFeeInfo()`
- **O que faz:** Retorna informações sobre taxas
- **Uso na plataforma:**
  - ✅ Transparência para usuários
  - ✅ Dashboard de taxas arrecadadas
  - ✅ Verificação de configuração

### 7. 🌐 Meta-Transactions (Gasless)

#### `isTrustedForwarder(address forwarder)`
- **O que faz:** Verifica se endereço é um forwarder confiável
- **Uso na plataforma:**
  - ✅ **Gasless transactions** - usuários não pagam gas
  - ✅ UX melhorada para onboarding
  - ✅ Transações patrocinadas pela plataforma
  - ✅ Acesso via embedded wallets

### 8. 📦 Multicall

#### `multicall(bytes[] data)`
- **O que faz:** Executa múltiplas chamadas em uma única transação
- **Uso na plataforma:**
  - ✅ **Otimização de gas** - múltiplas operações em uma tx
  - ✅ Batch de operações (approve + transfer)
  - ✅ Atomic operations (ou tudo ou nada)
  - ✅ Redução de custos para usuários

### 9. 📝 Contract Metadata

#### `contractURI()`
- **O que faz:** Retorna URI com metadados do contrato
- **Uso na plataforma:**
  - ✅ Metadados para marketplaces
  - ✅ Informações do token para interfaces
  - ✅ Integração com OpenSea, etc

#### `setContractURI(string _uri)`
- **O que faz:** Atualiza URI de metadados
- **Uso na plataforma:**
  - ✅ Atualização de informações do token
  - ✅ Gestão de branding

### 10. 🔍 EIP-712 Domain

#### `DOMAIN_SEPARATOR()`
- **O que faz:** Retorna separator para assinaturas EIP-712
- **Uso na plataforma:**
  - ✅ Assinaturas seguras de mensagens
  - ✅ Integração com wallets (MetaMask, WalletConnect)
  - ✅ Verificação de autenticidade

#### `nonces(address owner)`
- **O que faz:** Retorna nonce para prevenir replay attacks
- **Uso na plataforma:**
  - ✅ Segurança em assinaturas
  - ✅ Prevenção de ataques de replay
  - ✅ Validação de transações

---

## 🎯 Casos de Uso na Plataforma NEØ.FLOWOFF

### 💼 Para Clientes da Agência

1. **Pagamento por Serviços**
   - Cliente aprova tokens para pagamento
   - Transferência automática ao concluir projeto
   - Histórico transparente na blockchain

2. **Subscrições/Mensalidades**
   - Aprovação recorrente
   - Cobrança automática via `transferFrom`
   - Desconto para pagamentos em NEOFLW

### 🎁 Sistema de Recompensas

1. **Loyalty Program**
   - Mint de tokens como recompensa
   - Queima ao resgatar benefícios
   - Histórico de pontos na blockchain

2. **Referral Program**
   - Comissão automática via `mintTo`
   - Tracking transparente
   - Multi-nível de indicações

### 🗳️ Governança DAO

1. **Votação em Propostas**
   - Holders votam em melhorias
   - Propostas de novos serviços
   - Destinação de treasury

2. **Delegação de Votos**
   - Usuários podem delegar para representantes
   - Sem custo de gas (via `delegateBySig`)
   - Governança participativa

### ⚡ Gasless Experience

1. **Onboarding Sem Fricção**
   - Embedded wallets via Thirdweb
   - Primeira transação sem gas
   - Aprovações via `permit`

2. **Rewards Automáticos**
   - `mintWithSignature` para recompensas
   - Usuário não paga gas
   - Melhor UX para mobile

### 💎 Economia do Token

1. **Taxas de Plataforma**
   - Percentual em transações importantes
   - Receita sustentável para desenvolvimento
   - Fundo para expansão

2. **Queima Programada**
   - Queima de parte das taxas
   - Deflação controlada
   - Aumento de valor ao longo do tempo

---

## 📊 Status de Implementação

### ✅ Funcionalidades Já Implementadas
- [x] `balanceOf()` - Busca de saldo (`js/wallet.js`)
- [x] Conexão de wallet (Email, Google, External)
- [x] Visualização de saldo no dashboard

### 🔄 Funcionalidades Planejadas
- [ ] Sistema de mint de recompensas
- [ ] Integração com governança
- [ ] Sistema de permit para aprovações gasless
- [ ] Dashboard de governança
- [ ] Sistema de referral com mint automático
- [ ] Queima programada de tokens

---

## 🔗 Recursos Adicionais

### Thirdweb SDK
O contrato é compatível com o SDK da Thirdweb, permitindo:
- Integração fácil via JavaScript/TypeScript
- Suporte a todas as funcionalidades listadas
- Documentação: https://portal.thirdweb.com/typescript/v5

---

## 🎯 Intent Funnel — Funil de Ativação

> **O token não é o ponto de entrada. É um protocolo de consequência.**

Este funil descreve a progressão de intenção do usuário, não uma jornada de produto. O NEOFLW aparece **como resultado**, nunca como vitrine inicial.

### 📍 Fase 0: Contexto (SEM Wallet, SEM Token)

**Objetivo:** Usuário entende valor em 10 segundos

**O que acontece:**
- Usuário acessa a plataforma NEØ.FLOWOFF
- Vê claramente:
  * O que é a NEØ.FLOWOFF
  * O que ela resolve
  * Para quem é
  * Que existe um sistema por trás

**O que NÃO acontece:**
- ❌ Sem login
- ❌ Sem token
- ❌ Sem blockchain visível
- ❌ Sem botão de wallet proeminente

**Resultado esperado:**
> "Ok, isso não é uma agência comum."

**Smart Contracts:** Nenhum (ainda)

---

### ✨ Fase 1: Ação Leve (SEM Token)

**Objetivo:** Usuário faz algo útil sem conectar nada

**O que acontece:**
Usuário interage com valor sem custo:
- Explora um case study
- Roda um simulador/diagnóstico
- Vê um artefato/interação
- Experimenta uma ferramenta

**Ganho:** Atenção e interesse

**O que NÃO acontece:**
- ❌ Não pede wallet
- ❌ Não mostra token
- ❌ Não fala de blockchain

**Smart Contracts:** Nenhum (ainda)

---

### 🤝 Fase 2: Convite (NÃO Obrigação)

**Objetivo:** Wallet como consequência, não requisito

**O que acontece:**
Após ação útil, aparece convite natural:
> "Quer salvar isso, executar ou avançar?"

**Cenários possíveis:**
- "Salvar resultado para depois" → Wallet para persistência
- "Gerar relatório personalizado" → Wallet para identificação
- "Acessar área exclusiva" → Wallet para permissão

**Filosofia:**
- Conectar wallet **como consequência**, não requisito
- Usuário já viu valor antes de conectar

**Smart Contracts:** Ainda não usados diretamente (preparação)

---

### 🔐 Fase 3: Wallet como Infraestrutura (SEM mostrar Token)

**Objetivo:** Wallet é infra, não identidade

**O que acontece quando conecta:**
1. Usuário escolhe método:
   - 📧 Email (Embedded Wallet via Thirdweb)
   - G Google (OAuth)
   - 🦊 Wallet Externa (MetaMask)

2. **Estado salvo em `localStorage`**

3. **O que o usuário VÊ:**
   - ✅ Estado/permissão de acesso
   - ✅ Continuidade de sessão
   - ✅ Acesso a recursos salvos

**O que o usuário NÃO VÊ:**
- ❌ Saldo de token
- ❌ Nome do token
- ❌ Ticker NEOFLW
- ❌ Governança
- ❌ Qualquer referência a token

**Por quê?**
> "Token fica invisível no início"

**Smart Contracts usados:**
- `balanceOf(address)` - backend verifica, frontend não mostra

---

### 🎁 Fase 4: Token como Resultado

**Objetivo:** Token aparece DEPOIS, como consequência natural

**O que acontece:**
O token NEOFLW aparece em contexto de valor:

#### 4.1 Como Crédito
- "Você ganhou 10 créditos por completar X"
- Token aparece como crédito, não como moeda

#### 4.2 Como Resultado
- "Sua ação gerou X NEOFLW"
- Token é fruto de uma ação útil

#### 4.3 Como Destravamento
- "Você desbloqueou acesso premium"
- Token como chave para recursos

#### 4.4 Como Coordenação
- "Use seus NEOFLW para pagar serviços"
- Token como meio, não como fim

**Momento ideal:**
> Usuário já executou algo útil e **depois recebe algo**
> Agora o token faz sentido
> Agora ele pergunta o que é
> Agora ele volta

**Smart Contracts usados:**
- `mintWithSignature()` - recompensa gasless após ação
- `balanceOf(address)` - agora SIM mostra saldo
- `transfer()` - se necessário para uso imediato

---

### 💼 Fase 5: Uso Prático do Token

**Agora que o token faz sentido**, usuário começa a usar ativamente:

#### 5.1 Pagamento por Serviços
1. Usuário quer contratar serviço (marketing, desenvolvimento, etc)
2. Vê opção de pagar com créditos NEOFLW (desconto aplicado)
3. Sistema calcula valor em tokens
4. Cliente aprova via `permit()` (gasless) ou `approve()`
5. Ao concluir serviço: `transferFrom()` executa automaticamente

#### 5.2 Transferências e Aprovações
- Transferências diretas: `transfer()`
- Aprovações gasless: `permit()` (EIP-2612)
- Verificação de aprovações: `allowance()`

#### 5.3 Batch Operations (Otimização)
- Múltiplas operações em uma tx via `multicall()`
- Redução de custos de gas
- Operações atômicas

**Smart Contracts usados:**
- `transfer()` - transferência básica
- `transferFrom()` - cobrança automática
- `approve()` - aprovação tradicional
- `permit()` - aprovação gasless
- `multicall()` - operações em batch
- `allowance()` - verificar aprovações

---

### 🗳️ Fase 6: Governança (Quando Usuário é Holder)

**Token já existe, usuário quer influenciar**

#### 6.1 Descoberta Natural
- Usuário já tem tokens (recebeu como resultado)
- Vê que pode votar em decisões
- Governança aparece como recurso, não como entrada

#### 6.2 Votação
1. Proposta aparece na plataforma
2. Interface mostra: `getVotes(address)` - poder de voto
3. Usuário vota via `delegate()` ou `delegateBySig()` (gasless)
4. Voto registrado na blockchain

#### 6.3 Delegação
- Usuário delega para representante: `delegateBySig()` (gasless)
- Representante vota em nome
- Histórico via `checkpoints()`

**Smart Contracts usados:**
- `getVotes(address)` - poder de voto atual
- `getPastVotes()` - histórico de votos
- `delegate()` - delegação direta
- `delegateBySig()` - delegação gasless
- `checkpoints()` - histórico

---

### 🔥 Fase 7: Power User (Operações Avançadas)

**Usuário experiente, operações avançadas**

#### 7.1 Queima Voluntária
- `burn()` - queimar tokens próprios
- Deflação controlada
- Aumento de valor do token

#### 7.2 Staking/DeFi
- Aprovação via `permit()` (gasless)
- Stake em pools
- Recebe rewards via `mintTo()`

#### 7.3 Otimizações
- `multicall()` - múltiplas operações
- Batch transactions
- Redução de custos

**Smart Contracts usados:**
- `burn()` - queima de tokens
- `burnFrom()` - queima autorizada
- `permit()` - aprovações gasless
- `multicall()` - batch operations
- `mintTo()` - rewards

---

## 💡 Princípios do Intent Funnel

### ❌ O que NÃO fazer

1. **Token como ponto de entrada**
   - ❌ Mostrar saldo zero no início
   - ❌ Pedir wallet antes de mostrar valor
   - ❌ Token como primeira coisa que usuário vê

2. **Blockchain como identidade**
   - ❌ Wallet como único método de login
   - ❌ Forçar conexão para explorar
   - ❌ Blockchain como requisito inicial

### ✅ O que fazer

1. **Valor primeiro**
   - ✅ Mostrar o que a plataforma resolve
   - ✅ Permitir ações sem wallet
   - ✅ Ganhar confiança antes de pedir conexão

2. **Token como consequência**
   - ✅ Token aparece após ação útil
   - ✅ Token como crédito/resultado, não moeda
   - ✅ Token faz sentido no contexto

3. **Wallet como infraestrutura**
   - ✅ Wallet para persistência, não identidade
   - ✅ Não mostrar token/saldo no início
   - ✅ Wallet como meio, não como fim

---

## 📊 Resumo do Intent Funnel

| Fase | Estado | Token Visível? | Ação Principal |
|------|--------|----------------|----------------|
| 0. Contexto | Sem wallet | ❌ Não | Entender valor |
| 1. Ação Leve | Sem wallet | ❌ Não | Interagir com valor |
| 2. Convite | Opcional | ❌ Não | Salvar/executar |
| 3. Wallet Infra | Conectado | ❌ Não | Acesso/permissão |
| 4. Token Resultado | Com token | ✅ Sim | Receber como crédito |
| 5. Uso Prático | Usando | ✅ Sim | Pagar/transferir |
| 6. Governança | Holder | ✅ Sim | Votar/influenciar |
| 7. Power User | Experiente | ✅ Sim | Operações avançadas |

**Princípio Central:**
> Usuários não querem tokens. Tokens aparecem quando sistemas funcionam.

---

### 🚀 Pontos de Fricção Eliminados

Graças às funcionalidades do contrato, o Intent Funnel é otimizado:

1. **Gasless Onboarding** → Embedded wallets via Thirdweb
2. **Gasless Approvals** → `permit()` EIP-2612
3. **Gasless Rewards** → `mintWithSignature()`
4. **Gasless Voting** → `delegateBySig()`
5. **Batch Operations** → `multicall()` reduz custos
6. **Meta-transactions** → Trusted forwarders patrocinam gas

---

## 📊 Comandos Úteis

### Ver informações do token localmente
```bash
npm run token:info
# ou
make token-info
```

### Verificar token no Basescan
```bash
# Abrir no navegador
open https://basescan.org/token/0x6575933669e530dc25aacb496cd8e402b8f26ff5
```

### Acessar dashboard Thirdweb
```bash
open https://thirdweb.com/base/0x6575933669e530dC25aaCb496cD8e402B8f26Ff5
```

---

## 🔍 Verificação de Integridade

### Checklist de Validação

- [x] Token deployado e verificado no Basescan
- [x] Liquidez ativa na Uniswap V3
- [x] Pool visível no Uniswap Explorer
- [x] Pool indexada no Dexscreener
- [x] NFT de posição LP criada e visível
- [ ] Logo IPFS acessível (verificar)
- [ ] Metadata do token completa (verificar)

---

## 📝 Notas Importantes

- O token está totalmente funcional na Base Network
- A liquidez foi injetada com sucesso na pool Uniswap V3
- A pool está sendo indexada automaticamente pelo Dexscreener
- Se a imagem do token não aparecer, reenvie para IPFS e atualize a referência on-chain

---

## 🔗 Links Rápidos

| Recurso | Link |
|---------|------|
| Token (Basescan) | https://basescan.org/token/0x6575933669e530dc25aacb496cd8e402b8f26ff5 |
| Contrato (Basescan) | https://basescan.org/address/0x6575933669e530dc25aacb496cd8e402b8f26ff5 |
| Thirdweb Dashboard | https://thirdweb.com/base/0x6575933669e530dC25aaCb496cD8e402B8f26Ff5 |
| Uniswap Pools | https://app.uniswap.org/explore/pools/8453 |
| Dexscreener | https://dexscreener.com/base/0x6575933669e530dC25aaCb496cD8e402B8f26Ff5 |
| NFT LP Position | https://basescan.org/nft/0x46a15b0b27311cedf172ab29e4f4766fbe7f4364/945419 |
| Twitter/X | https://twitter.com/neoflw_on_chain |

---

**Última atualização:** 2025-01-XX  
**Mantido por:** MELLØ™ - NEØ.FLOWOFF

