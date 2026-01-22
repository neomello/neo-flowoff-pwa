# Makefile - Protocolo NΞØ de Commit Seguro

## 📋 Resumo das Atualizações

### ✅ O que foi implementado

1. **Comando `make commit`** - Commit e push seguro com verificação completa
2. **Comando `make commit-tag`** - Commit com TAG para marcos importantes
3. **Validação de Routes e Robots** - Verificação automática de configurações PWA
4. **Build Condicional** - Build automático apenas quando necessário
5. **Suporte ao miniapp** - Rota `/miniapp` adicionada ao vercel.json

---

## 🔒 Comando: `make commit`

### Fluxo de Execução (5 Etapas)

#### 1️⃣ Verificação de Segurança
- Executa `npm audit --audit-level=high`
- Alerta sobre vulnerabilidades críticas
- Continua com cautela se houver problemas

#### 2️⃣ Build Condicional
Verifica se há mudanças em:
- `src/`, `public/`, `js/`, `css/`
- Arquivos `.html`, `.css`, `.js`
- Configurações: `vite.config`, `package.json`, `tailwind.config`, `postcss.config`, `.env`

Se houver mudanças relevantes:
- ✅ Executa `make build`
- ❌ Falha se o build não for bem-sucedido

#### 3️⃣ Validação de Routes e Robots
Verifica a existência e conteúdo de:
- ✅ `robots.txt` - Deve conter `flowoff.xyz`
- ✅ `sitemap.xml` - Deve conter `flowoff.xyz` e `/miniapp`
- ✅ `vercel.json` - Deve conter rota `/desktop` e `/miniapp`

#### 4️⃣ Status do Git
- Exibe `git status --short`
- Se não houver mudanças, encerra graciosamente

#### 5️⃣ Commit e Push
- Solicita mensagem de commit seguindo **Conventional Commits**
- Tipos disponíveis:
  - `feat:` Nova funcionalidade
  - `fix:` Correção de bug
  - `docs:` Documentação
  - `style:` Formatação
  - `refactor:` Refatoração
  - `perf:` Melhoria de performance
  - `test:` Testes
  - `chore:` Manutenção
  - `build:` Sistema de build
  - `ci:` Integração contínua

- Executa:
  ```bash
  git add .
  git commit -m "mensagem"
  git push origin <branch-atual>
  ```

---

## 🏷️ Comando: `make commit-tag`

### Para Marcos Importantes

1. Executa todo o fluxo de `make commit`
2. Solicita versão da TAG (ex: `v1.0.8`)
3. Solicita descrição da TAG
4. Cria TAG anotada: `git tag -a <versão> -m "<descrição>"`
5. Envia TAG: `git push origin <versão>`

**Quando usar:**
- ✅ Conclusão de fase importante
- ✅ Release de versão
- ✅ Marco significativo no projeto
- ✅ Mudança arquitetural importante

---

## 📦 Atualizações no Build

### Arquivos CSS Copiados
```makefile
- styles.css
- desktop.css
- glass-morphism-bottom-bar.css
- bento-grid.css
- miniapp-landing.css  # ← NOVO
```

### Arquivos HTML Copiados
```makefile
- index.html
- desktop.html
- miniapp.html
- terms.html
- privacy.html
```

---

## 🌐 Atualizações de Routes (vercel.json)

### Rewrites Configurados
```json
{
  "rewrites": [
    {
      "source": "/desktop",
      "destination": "/desktop.html"
    },
    {
      "source": "/miniapp",        // ← NOVO
      "destination": "/miniapp.html"
    },
    {
      "source": "/((?!api|_next|public|desktop|miniapp|.*\\..*).*)",
      "destination": "/index.html"
    }
  ]
}
```

### URLs Limpas Disponíveis
- ✅ `https://flowoff.xyz/` → `index.html`
- ✅ `https://flowoff.xyz/desktop` → `desktop.html`
- ✅ `https://flowoff.xyz/miniapp` → `miniapp.html`
- ✅ `https://flowoff.xyz/terms.html` → `terms.html`
- ✅ `https://flowoff.xyz/privacy.html` → `privacy.html`

---

## 🤖 Validação de Robots e Sitemap

### robots.txt
```txt
# Permitir acesso a páginas HTML
Allow: /index.html
Allow: /desktop.html
Allow: /miniapp.html
Allow: /terms.html
Allow: /privacy.html

# Sitemap
Sitemap: https://flowoff.xyz/sitemap.xml
```

### sitemap.xml
Inclui todas as rotas principais:
- `/` (prioridade 1.0)
- `/desktop` (prioridade 0.9)
- `/miniapp` (prioridade 0.9)
- Rotas SPA: `#home`, `#projects`, `#start`, `#ecosystem`
- Páginas de políticas: `/terms.html`, `/privacy.html`

---

## 🎯 Como Usar

### Commit Normal
```bash
make commit
```

### Commit com TAG
```bash
make commit-tag
```

### Validar Estrutura
```bash
make validate
```

### Ver Comandos Disponíveis
```bash
make help
```

---

## ✅ Checklist de Validação

O comando `make commit` verifica automaticamente:

- [x] Segurança (npm audit)
- [x] Build (se necessário)
- [x] Existência de `robots.txt`
- [x] Existência de `sitemap.xml`
- [x] Existência de `vercel.json`
- [x] Domínio `flowoff.xyz` em robots.txt
- [x] Domínio `flowoff.xyz` em sitemap.xml
- [x] Rota `/desktop` em vercel.json
- [x] Rota `/miniapp` em sitemap.xml
- [x] Status do git
- [x] Conventional Commits

---

## 🚀 Protocolo NΞØ

Este Makefile implementa o **Protocolo NΞØ** de commit seguro, garantindo:

1. **Segurança** - Auditoria de vulnerabilidades
2. **Qualidade** - Build validado antes do commit
3. **SEO** - Routes e robots sempre atualizados
4. **Padrões** - Conventional Commits obrigatório
5. **Rastreabilidade** - TAGs para marcos importantes

---

## 📝 Exemplos de Mensagens de Commit

```bash
# Nova funcionalidade
feat: adiciona integração com wallet Web3

# Correção de bug
fix: corrige rota do miniapp no vercel.json

# Documentação
docs: atualiza README com instruções de deploy

# Refatoração
refactor: reorganiza estrutura de CSS modular

# Performance
perf: otimiza carregamento de imagens

# Build
build: adiciona miniapp-landing.css ao processo de build
```

---

## 🎉 Conclusão

O Makefile agora está totalmente adequado para:
- ✅ Commits seguros com verificação completa
- ✅ Build condicional e otimizado
- ✅ Validação de routes e robots
- ✅ Suporte completo à PWA
- ✅ TAGs para marcos importantes
- ✅ Conventional Commits

**Protocolo NΞØ implementado com sucesso! 🚀**
