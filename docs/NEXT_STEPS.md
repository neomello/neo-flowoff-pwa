# Next Steps — NEØ FlowOFF PWA

**Data**: 2026-01-28  
**Status**: Migração BASE concluída, validação OK

---

## Estado atual do projeto

- **Lighthouse (Fases 1–5)**: concluídas (erros críticos, scripts, CSS, lazy load, throttle/cache/preload).
- **CSS Mobile/Desktop**: 14 problemas corrigidos (z-index, overflow, safe-area).
- **Wallet & Token**: ✅ Migrado para BASE Network, contrato validado.
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

1. **Adicionar Liquidez em DEX** (P1 - Crítico para Negócio)
   - Adicionar par ETH/NEOFLW no Uniswap V3 (BASE)
   - Fee tier recomendado: 0.3% ou 1%
   - Range de liquidez: ±20% do preço inicial
   - Obter endereço do pool para tracking

2. **Implementar Funcionalidade de Compra/Swap** (P1 - Crítico)
   - Instalar: `npm install @uniswap/sdk-core @uniswap/v3-sdk`
   - Implementar função `swapETHForNEOFLW()` em `js/token-swap.js`
   - UI de swap: input amount, output amount, slippage control
   - Integração com wallet (MetaMask, Web3Auth)
   - Ver exemplo em: `docs/BASE_MIGRATION.md`

3. **Sistema de Registro de Usuário** (P1 - Alto)
   - Criar tabela `users` no banco Neon (SQL em audit)
   - Criar tabela `user_wallets` para vincular wallet → usuário
   - API `/api/register`: cadastro com email + wallet_address
   - API `/api/user/profile`: obter perfil do usuário
   - Frontend: formulário de registro

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

---

**✅ Últimas atualizações (2026-01-28)**:
- Migração para BASE Network concluída
- Token $NEOFLW validado e verificado na BASE
- CSS mobile/desktop 100% corrigido
- Sistema pronto para integração com DEX

*Próximo marco: Adicionar liquidez e implementar swap*
