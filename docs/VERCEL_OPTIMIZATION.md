# 🚀 Otimização Vercel - Plano Hobby

## 📊 Status Atual

**Limite Vercel Hobby**: 12 Serverless Functions  
**Funções Atuais**: 11 ✅ (dentro do limite)

---

## 📋 Inventário de Funções

### Serverless Functions (Endpoints) - 11 total

1.`api/health.js` — Health check básico
2. `api/health-db.js` — Health check do banco
3. `api/lead.js` — Captura de leads
4. `api/leaderboard.js` — Ranking de pontos
5. `api/points/balance.js` — Consultar saldo de pontos
6. `api/points/record.js` — Registrar pontos
7. `api/referral/create.js` — Criar código de referral
8. `api/referral/use.js` — Usar código de referral
9. `api/register.js` — Registro de usuário
10. `api/tx-logs.js` — Logs de transações
11. `api/wallet-sessions.js` — Sessões de wallet

### Módulos Auxiliares (Não contam no limite) - 3 total

- `api/config.js` — Configurações compartilhadas
- `api/db.js` — Conexão com banco
- `api/utils.js` — Utilitários (CORS, validação, etc)

---

## ✅ SITUAÇÃO ATUAL: DENTRO DO LIMITE

**Status**: 🟢 11/12 funções (margem de 1)

Estamos **dentro do limite**, mas com pouca margem para crescimento.

---

## 🎯 OTIMIZAÇÃO PROPOSTA (OPCIONAL)

Para deixar mais margem e melhorar arquitetura, podemos consolidar APIs relacionadas:

### Consolidação Sugerida

#### 1. Consolidar Health Checks
**Antes**: 2 funções
- `api/health.js`
- `api/health-db.js`

**Depois**: 1 função
- `api/health.js` (com query param `?check=db`)

**Economia**: -1 função

#### 2. Consolidar Points
**Antes**: 2 funções
- `api/points/balance.js` (GET)
- `api/points/record.js` (POST)

**Depois**: 1 função
- `api/points.js` (detecta método HTTP)

**Economia**: -1 função

#### 3. Consolidar Referral
**Antes**: 2 funções
- `api/referral/create.js` (POST)
- `api/referral/use.js` (POST)

**Depois**: 1 função
- `api/referral.js` (detecta action via body ou query)

**Economia**: -1 função

### Resultado da Otimização

**Funções atuais**: 11  
**Funções após otimização**: 8  
**Margem disponível**: 4 (33% do limite)

---

## 🔧 IMPLEMENTAÇÃO (SE NECESSÁRIO)

### Exemplo: Consolidar Points

```javascript
// api/points.js (consolidado)
export default async function handler(req, res) {
  if (req.method === 'GET') {
    // Lógica de balance (antiga points/balance.js)
    const walletAddress = req.query.wallet_address;
    // ...
  } else if (req.method === 'POST') {
    // Lógica de record (antiga points/record.js)
    const body = await parseJsonBody(req, res);
    // ...
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
}
```

### Exemplo: Consolidar Health

```javascript
// api/health.js (consolidado)
export default async function handler(req, res) {
  const check = req.query.check;
  
  if (check === 'db') {
    // Lógica de health-db (antiga health-db.js)
    const dbStatus = await testDatabaseConnection();
    // ...
  } else {
    // Health check básico
    return res.json({ status: 'ok', timestamp: Date.now() });
  }
}
```

---

## 📊 Comparação: Antes vs Depois

| Aspecto | Antes (Atual) | Depois (Otimizado) |
|---------|---------------|---------------------|
| Total de funções | 11 | 8 |
| Margem disponível | 1 (8%) | 4 (33%) |
| Facilidade de manutenção | Média | Alta |
| Latência | Igual | Igual |
| Custo | $0 (Hobby) | $0 (Hobby) |

---

## 🎯 RECOMENDAÇÃO

### Curto Prazo (AGORA)
**Status**: 🟢 Não precisa fazer nada

Estamos dentro do limite (11/12). O sistema funciona perfeitamente no plano Hobby.

### Médio Prazo (SE PRECISAR ADICIONAR MAIS APIS)
**Ação**: Aplicar otimização proposta

Se você precisar adicionar 2+ novas APIs no futuro, aplique a consolidação para liberar espaço.

### Longo Prazo (CRESCIMENTO)
**Opções**:

1. **Continuar no Hobby** (consolidando funções conforme necessário)
2. **Upgrade para Pro** ($20/mês) quando:
   - Precisar de mais de 12 funções
   - Tráfego ultrapassar 100GB/mês
   - Precisar de analytics avançados

---

## 🚦 QUANDO FAZER UPGRADE?

### Sinais para Upgrade Pro

- ✅ Mais de 1000 usuários ativos/dia
- ✅ Mais de 100.000 requests/mês
- ✅ Precisar de mais de 12 APIs
- ✅ Precisar de logs avançados
- ✅ Precisar de deploy previews ilimitados

### Mantenha Hobby Se

- ✅ Menos de 500 usuários ativos/dia (✓ seu caso agora)
- ✅ Menos de 50.000 requests/mês (✓ seu caso agora)
- ✅ 11 funções ou menos (✓ seu caso agora)
- ✅ Projeto em fase inicial/MVP (✓ seu caso agora)

---

## 💡 DICAS PARA OTIMIZAR RECURSOS

### 1. Cache Agressivo
```javascript
res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300');
```

### 2. Edge Functions (Grátis!)
Para operações simples (ex: redirects, A/B tests), use Edge Functions em vez de Serverless Functions.

### 3. Consolidar Rotas
Uma função pode ter múltiplas rotas internas:
```javascript
if (req.url.includes('/balance')) { /* ... */ }
if (req.url.includes('/record')) { /* ... */ }
```

### 4. Static Site Generation
Gere páginas estáticas sempre que possível (não conta no limite).

---

## ✅ CONCLUSÃO

**Status Atual**: 🟢 **TUDO OK NO PLANO HOBBY**

Você tem:
- 11/12 funções (dentro do limite)
- Margem de 1 função para crescimento
- Sistema 100% funcional

**Ação Requerida**: 🔵 **NENHUMA (por enquanto)**

Continue no plano Hobby tranquilamente. Se precisar adicionar mais APIs no futuro, considere a consolidação proposta.

---

**Última atualização**: 28/01/2026  
**Plano**: Hobby (Free)  
**Status**: ✅ Otimizado
