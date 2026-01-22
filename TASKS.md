# Backlog de Tarefas - NΞØ FlowOFF

Este arquivo rastreia as tarefas pendentes e sugestões de melhoria técnica para o projeto.

## 📧 Integração de Email (Resend)

### Melhorias Técnicas
- [x] **Validar Entregabilidade**: Envio de email testado e aprovado.
- [x] **Integração Hunter.io**: Verificação de emails (anti-spam/disposable) implementada.
- [x] **Feature Flag para Auto-resposta**: Adicionado `CONFIRMATION_EMAIL_ENABLED` (padrão true).
- [x] **Metadata nos Envios**: Tags `lead_type` e `category` adicionadas aos emails do Resend.
- [ ] **Log Estruturado**: Implementar logs estruturados (nível warn/error) para melhor observabilidade em caso de falhas no envio.

## 🏗️ Infraestrutura & Backend

- [ ] **API Health Check**: Verificar se endpoint de saúde do banco de dados está reportando corretamente.
- [ ] **Rate Limiting**: Refinar regras de rate limiting para evitar abuso nos endpoints públicos.

## 📱 Frontend & UX

- [ ] **Feedback Visual**: Melhorar feedback visual em caso de erro no envio (toast mais detalhado).
- [ ] **Analytics**: Integrar eventos de conversão no GA4/Pixel quando o lead é enviado com sucesso.
