# Next Steps — NEØ FlowOFF PWA

**Data**: 2026-01-28  
**Status**: Migração BASE concluída, validação OK

---

## Estado atual do projeto

- **Lighthouse (Fases 1–5)**: concluídas (erros críticos, scripts, CSS, lazy load, throttle/cache/preload).
- **CSS Mobile/Desktop**: 14 problemas corrigidos (z-index, overflow, safe-area).
- **Wallet & Token**: ✅ Migrado para BASE Network, contrato validado.
- **Sistema de Swap**: ✅ Implementado (js/token-swap.js, js/swap-ui.js) — aguarda liquidez no Uniswap.
- **Sistema de Registro**: ✅ Implementado (api/register.js, js/user-registration.js) — aguarda migração SQL.
- **ENS**: doc de verificação em `docs/VERIFICACAO_ENS_DOMAIN.md`; checklist ainda não executado.
- **Deploy**: IPFS + Vercel ativos.
- **Backlog**: ver `TASKS.md`.

---

## Próximos passos (por prioridade)

### Curto prazo

1. **Validar ENS**
   - Seguir checklist em `docs/VERIFICACAO_ENS_DOMAIN.md`.
   - Conferir Content Hash, gateway `neoflowoff.eth.link` e IPNS.
   - Garantir que o domínio .eth abre o site correto.

2. **Lighthouse em produção**
   - Re-executar Lighthouse mobile (Vercel ou .eth.link).
   - Registrar FCP, LCP, TBT, Speed Index e Performance.
   - Atualizar métricas finais em `docs/Lighthouse-mobile.md`.

3. ✅ **SafeStorage integrado** (CONCLUÍDO)
   - ✅ storage-wrapper.js adicionado em index.html e desktop.html
   - ✅ Migrado js/desktop.js para usar SafeLocalStorage
   - ✅ Migrado js/index-scripts.js para usar SafeLocalStorage
   - ✅ Migrado js/wallet.js para usar SafeLocalStorage
   - ✅ Previne crash em private mode/quota excedida

4. ✅ **Auditoria de Segurança** (CONCLUÍDO)
   - ✅ 5 vulnerabilidades XSS corrigidas
   - ✅ 3 memory leaks eliminados
   - ✅ DoS via slow requests bloqueado
   - ✅ CSP e HSTS headers adicionados
   - ✅ Ver relatório completo: `docs/SECURITY_AUDIT_2025-01-27.md`

5. ✅ **Migração para BASE Network** (CONCLUÍDO)
   - ✅ Token $NEOFLW migrado de Polygon para BASE (chainId: 8453)
   - ✅ Contrato validado e verificado: `0x41F4ff3d45DED9C1332e4908F637B75fe83F5d6B`
   - ✅ Todos os arquivos atualizados (wallet.js, wallet-provider.js, tests)
   - ✅ Web3Auth configurado para BASE RPC
   - ✅ Links de explorer atualizados (BaseScan, DexScreener)
   - ✅ Ver documentação: `docs/BASE_MIGRATION.md`
   - ✅ Ver auditoria: `docs/WALLET_TOKEN_AUDIT.md`

6. ✅ **CSS Mobile & Desktop** (CONCLUÍDO)
   - ✅ 4 problemas críticos mobile corrigidos
   - ✅ 10 problemas desktop corrigidos
   - ✅ Z-index hierarchy consistente
   - ✅ Overflow controlado, safe-area aplicado
   - ✅ Ver relatório: `docs/CSS_MOBILE_FIXES.md`

### Wallet & Token (Prioridade Alta)

1. ✅ **Sistema de Swap/Compra** (IMPLEMENTADO)
   - ✅ Dependências instaladas (@uniswap/sdk-core, @uniswap/v3-sdk, ethers@5)
   - ✅ js/token-swap.js criado (288 linhas)
   - ✅ js/swap-ui.js criado (424 linhas)
   - ✅ Integração Uniswap V3 na BASE
   - ✅ Slippage control, quoter, error handling
   - ⬜ **PENDENTE**: Adicionar scripts em HTML (index.html, desktop.html)
   - ⬜ **PENDENTE**: Integrar com js/wallet.js

2. ✅ **Sistema de Registro de Usuário** (IMPLEMENTADO)
   - ✅ migrations/001_create_users_tables.sql criado (235 linhas)
   - ✅ api/register.js criado (269 linhas)
   - ✅ js/user-registration.js criado (363 linhas)
   - ✅ Tabelas: users, user_wallets, user_sessions
   - ✅ Rate limiting: 10 req/hora
   - ✅ Validações completas
   - ⬜ **PENDENTE**: Executar migração SQL no Neon
   - ⬜ **PENDENTE**: Adicionar scripts em HTML

3. 🔴 **Adicionar Liquidez em Uniswap V3** (CRÍTICO — BLOQUEADOR)
   - Adicionar par ETH/NEOFLW no Uniswap V3 (BASE)
   - Fee tier: 0.3% (3000 basis points)
   - Range de liquidez: ±20% do preço inicial
   - Exemplo: 1 ETH + 10,000 NEOFLW
   - Obter endereço do pool para tracking
   - **Ação manual necessária**: https://app.uniswap.org/pools

### Backlog (TASKS.md)

4. **Log estruturado (Resend)** — warn/error estruturado nos envios de email.
5. **API Health Check** — conferir se o health do banco está correto.
6. **Rate limiting** — refinar regras nos endpoints públicos.
7. **Feedback visual** — toast/estado de erro mais claro em falha de envio de lead.
8. **Analytics** — eventos de conversão (GA4/Pixel) quando o lead for enviado.

### Opcional

8. **Cloudinary** — avaliar migração de imagens para CDN (recomendado no doc do Lighthouse).
9. **MCP (Cursor Agent)** — se voltar “MCP error”, checar em Cursor Settings → MCP; rodar o comando do servidor no terminal para ver o erro real.

---

## Ordem sugerida

1.ENS (rápido; garante .eth correto).
2. Lighthouse em prod + atualizar doc de métricas.
3. Do backlog: começar por **log estruturado** e **feedback visual**.

---

**Referências**

- ENS: `docs/VERIFICACAO_ENS_DOMAIN.md`
- Performance: `docs/Lighthouse-mobile.md`
- Tarefas: `TASKS.md`
- **Wallet & Token**: `docs/WALLET_TOKEN_AUDIT.md`, `docs/BASE_MIGRATION.md`
- **CSS Fixes**: `docs/CSS_MOBILE_FIXES.md`
- **Segurança**: `docs/SECURITY_AUDIT_2025-01-27.md`
- **Swap & Registro**: `docs/SWAP_REGISTRATION_GUIDE.md`
- **Próximos Passos Imediatos**: `docs/PROXIMOS_PASSOS_IMEDIATOS.md` 🔥

---

**✅ Últimas atualizações (2026-01-28)**:
- Migração para BASE Network concluída
- Token $NEOFLW validado e verificado na BASE
- CSS mobile/desktop 100% corrigido
- ✅ **Sistema de Swap implementado** (js/token-swap.js, js/swap-ui.js)
- ✅ **Sistema de Registro implementado** (api/register.js, js/user-registration.js, SQL migrations)
- ✅ **Documentação completa criada** (docs/SWAP_REGISTRATION_GUIDE.md, docs/PROXIMOS_PASSOS_IMEDIATOS.md)
- 📦 **Total**: 6 novos arquivos, 2,135 linhas, 284 packages instalados

*Próximo marco crítico: Executar migração SQL + Adicionar liquidez no Uniswap V3*
