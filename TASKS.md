# Backlog de Tarefas - NΞØ FlowOFF

Este arquivo rastreia as tarefas pendentes e sugestões de melhoria técnica para o projeto.

## 📧 Integração de Email (Resend)

### Melhorias Técnicas
- [x] **Configurar Domínio/DNS**: Registros SPF/DKIM configurados para `neo.flowoff.xyz` (Aguardando Propagação).
- [ ] **Validar Entregabilidade**: Testar envio final após propagação.
- [ ] **Feature Flag para Auto-resposta**: Confirmar se queremos manter auto-resposta ativa por padrão ou torná-la configurável via ENV.
- [ ] **Metadata nos Envios**: Adicionar tags ou metadata (ex: `lead_type`, `source`, `campaign`) no payload do Resend para análise futura.
- [ ] **Log Estruturado**: Implementar logs estruturados (nível warn/error) para melhor observabilidade em caso de falhas no envio.

## 🏗️ Infraestrutura & Backend

- [ ] **API Health Check**: Verificar se endpoint de saúde do banco de dados está reportando corretamente.
- [ ] **Rate Limiting**: Refinar regras de rate limiting para evitar abuso nos endpoints públicos.

## 📱 Frontend & UX

- [ ] **Feedback Visual**: Melhorar feedback visual em caso de erro no envio (toast mais detalhado).
- [ ] **Analytics**: Integrar eventos de conversão no GA4/Pixel quando o lead é enviado com sucesso.
