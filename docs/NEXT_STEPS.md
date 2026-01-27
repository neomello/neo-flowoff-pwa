# Next Steps — NEØ FlowOFF PWA

**Data**: 2025-01-27  
**Status**: Em espera (spread/propagação)

---

## Estado atual do projeto

- **Lighthouse (Fases 1–5)**: concluídas (erros críticos, scripts, CSS, lazy load, throttle/cache/preload).
- **ENS**: doc de verificação em `docs/VERIFICACAO_ENS_DOMAIN.md`; checklist ainda não executado.
- **Deploy**: IPFS + Vercel ativos; último push incluiu doc de ENS.
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

### Backlog (TASKS.md)

3. **Log estruturado (Resend)** — warn/error estruturado nos envios de email.
4. **API Health Check** — conferir se o health do banco está correto.
5. **Rate limiting** — refinar regras nos endpoints públicos.
6. **Feedback visual** — toast/estado de erro mais claro em falha de envio de lead.
7. **Analytics** — eventos de conversão (GA4/Pixel) quando o lead for enviado.

### Opcional

8. **Cloudinary** — avaliar migração de imagens para CDN (recomendado no doc do Lighthouse).
9. **MCP (Cursor Agent)** — se voltar “MCP error”, checar em Cursor Settings → MCP; rodar o comando do servidor no terminal para ver o erro real.

---

## Ordem sugerida

1. ENS (rápido; garante .eth correto).
2. Lighthouse em prod + atualizar doc de métricas.
3. Do backlog: começar por **log estruturado** e **feedback visual**.

---

**Referências**

- ENS: `docs/VERIFICACAO_ENS_DOMAIN.md`
- Performance: `docs/Lighthouse-mobile.md`
- Tarefas: `TASKS.md`

---

*Documento gerado para retomada após propagação/spread.*
