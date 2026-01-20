# GitHub Actions Workflows

Este diretório contém os workflows de CI/CD para o projeto **NEØ FlowOFF PWA**.

## Workflows Disponíveis

### markdown-lint.yml

Valida todos os arquivos Markdown do projeto seguindo as regras definidas em `.markdownlint.json`.

**Triggers:**

- Push para branches `main` ou `develop`
- Pull Requests para `main` ou `develop`

**Ações:**

- Instala `markdownlint-cli` via npm
- Valida todos os arquivos `.md` usando `.markdownlintignore`
- Verifica conformidade com padrões NEØ (linha em branco após headers, etc.)

### code-quality.yml

Verifica a qualidade do código e formatação.

**Triggers:**

- Push para branches `main` ou `develop`
- Pull Requests para `main` ou `develop`

**Ações:**

- Verifica formatação com Prettier (usando `.prettierrc.json`)
- Valida conformidade com EditorConfig (`.editorconfig`)
- Valida Markdown com markdownlint

### security.yml

Escaneia o código em busca de vulnerabilidades e segredos expostos.

**Triggers:**

- Push para branch `main`
- Pull Requests para `main`
- Semanalmente (domingos à meia-noite)

**Ações:**

- Executa `npm audit` para verificar vulnerabilidades de dependências
- Verifica se há segredos expostos no código (API keys, tokens, etc.)
- Valida estrutura de segurança do projeto

## Como Usar Localmente

### Validar Markdown

```bash
npm run lint:md
```

Este comando usa `.markdownlintignore` para excluir arquivos de documentação não crítica.

### Formatar Código

```bash
npm run format
```

Formata todos os arquivos `.js`, `.json` e `.md` seguindo `.prettierrc.json`.

### Verificar Formatação (sem alterar)

```bash
npm run format:check
```

Verifica se o código está formatado corretamente sem fazer alterações.

### Executar Todas as Validações

```bash
npm run lint
```

Executa validação de Markdown e verificação de formatação.

## Scripts Disponíveis

Todos os scripts estão definidos em `package.json`:

- `npm run lint:md` - Valida Markdown
- `npm run format` - Formata código
- `npm run format:check` - Verifica formatação
- `npm run lint` - Executa todas as validações

## Requisitos

As dependências já estão incluídas no projeto:

- `markdownlint-cli` (devDependency)
- `prettier` (devDependency)

Para executar localmente, basta instalar as dependências:

```bash
npm install
```

Ou use via npx (sem instalar):

```bash
npx markdownlint-cli '**/*.md' --ignore-path .markdownlintignore
npx prettier --check "**/*.{js,json,md}" --ignore-path .gitignore
```

## Configuração

Os workflows usam as seguintes configurações:

- `.markdownlint.json` - Regras de validação Markdown
- `.markdownlintignore` - Arquivos ignorados na validação
- `.prettierrc.json` - Configuração do Prettier
- `.prettierignore` - Arquivos ignorados pelo Prettier
- `.editorconfig` - Configuração do editor

## Notas

- Os workflows são tolerantes a falhas em arquivos de documentação não crítica
- Arquivos em `docs/` e documentação grande são ignorados automaticamente
- O workflow de segurança executa semanalmente para monitoramento contínuo

---

**Autor:** MELLØ // NEØ DEV

Este projeto segue NEØ development standards.

Consulte `.cursor/standards/` para mais informações sobre padrões de desenvolvimento.
