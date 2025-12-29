# Standards — NEØ FlowOFF PWA

Padrões e convenções para desenvolvimento seguindo o **NEØ Protocol**.

**Última atualização:** 2026-01-01

## Arquivos de Padrões

### Documentação e Markdown

-  **`markdown.rules.md`** - Regras de formatação Markdown (MD030, MD032, MD040, etc)
-  **`ai.rules.md`** - Regras para uso de IA e comportamento do Cursor
-  **`readme.signature.md`** - Assinatura completa para projetos e READMEs

### Referências

-  Ver `.cursorrules` na raiz do projeto para regras do Cursor
-  Ver `.markdownlint.json` para configuração de validação
-  Ver `.editorconfig` para configuração do editor

## Padrões Críticos

### Markdown

-  **SEMPRE** adicione linha em branco após qualquer header (###, ##, #)
-  Use 2 espaços após marcadores de lista (MD030)
-  Listas devem ser cercadas por linhas em branco (MD032)
-  Sempre especifique linguagem em blocos de código (MD040)

### Código

-  Indentação: 2 espaços (não tabs)
-  Encoding: UTF-8
-  Line endings: LF (Unix)
-  Trailing whitespace: Remover
-  Final newline: Sempre adicionar

### Segurança

-  **NUNCA** commite credenciais ou API keys
-  **SEMPRE** sanitize entradas de usuário
-  **SEMPRE** implemente rate limiting em operações críticas
-  **SEMPRE** valide dados no cliente e servidor

## Manutenção

Ao atualizar padrões:

1.  Edite o arquivo em `standards/`
2.  Atualize referências em `.cursorrules` se necessário
3.  Commit com mensagem descritiva
4.  Documente mudanças significativas

---

**Importante:** Estes padrões são autoritativos. Inconsistência não é permitida.

