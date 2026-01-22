# NEØ.FLOWOFF PWA - Makefile
# Node validado do Protocolo NΞØ

.PHONY: help build deploy deploy-preview deploy-ipfs check-storacha get-agent-did token-info dev clean install test test-ui test-run validate validate-production commit commit-tag

# Variáveis
SITE_NAME = neo-flowoff-pwa
PORT ?= 3000

# Comandos principais
help: ## Mostra comandos disponíveis
	@echo "⚡ NEØ.FLOWOFF PWA - Comandos disponíveis:"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-15s\033[0m %s\n", $$1, $$2}'

analyze: ## Executa análise de código PWA
	@echo "🔍 Executando análise de código PWA..."
	@node scripts/code-analysis.js

build: ## Build da PWA (otimiza assets)
	@echo "🔨 Building PWA..."
	@# Valida estrutura mínima
	@test -f index.html || (echo "❌ index.html não encontrado" && exit 1)
	@test -f styles.css || (echo "❌ styles.css não encontrado" && exit 1)
	@test -f js/app.js || (echo "❌ js/app.js não encontrado" && exit 1)
	@test -f manifest.webmanifest || (echo "❌ manifest.webmanifest não encontrado" && exit 1)
	@test -f sw.js || (echo "❌ sw.js não encontrado" && exit 1)
	@# Cria diretório dist se não existir
	@mkdir -p dist
	@# Build CSS modularizado
	@./build-css.sh
	@# Copia arquivos HTML principais
	@cp index.html dist/
	@cp desktop.html dist/ 2>/dev/null || true
	@cp miniapp.html dist/ 2>/dev/null || true
	@cp terms.html dist/ 2>/dev/null || true
	@cp privacy.html dist/ 2>/dev/null || true
	@# Copia arquivos CSS principais
	@cp styles.css dist/styles.css
	@cp desktop.css dist/ 2>/dev/null || true
	@cp glass-morphism-bottom-bar.css dist/ 2>/dev/null || true
	@cp bento-grid.css dist/ 2>/dev/null || true
	@cp miniapp-landing.css dist/ 2>/dev/null || true
	@# Copia arquivos PWA essenciais
	@cp manifest.webmanifest dist/
	@cp sw.js dist/
	@cp favicon.ico dist/
	@cp apple-touch-icon.png dist/ 2>/dev/null || true
	@# Copia arquivos SEO
	@cp robots.txt dist/
	@cp sitemap.xml dist/
	@# Copia pasta js/
	@mkdir -p dist/js
	@cp -r js/* dist/js/ 2>/dev/null || true
	@# Copia pasta css/ completa
	@mkdir -p dist/css
	@cp -r css/* dist/css/ 2>/dev/null || true
	@# Copia diretório public (se existir)
	@if [ -d "public" ]; then \
		cp -r public dist/; \
	fi
	@# Copia diretório images (se existir)
	@if [ -d "images" ]; then \
		cp -r images dist/; \
	fi
	@# Copia pasta api/ (funções serverless para Vercel)
	@if [ -d "api" ]; then \
		echo "📦 Copiando funções serverless (api/)..."; \
		cp -r api dist/; \
		echo "✅ Funções serverless copiadas!"; \
	fi
	@# Copia pasta emails/ (templates de email)
	@if [ -d "emails" ]; then \
		echo "📧 Copiando templates de email..."; \
		mkdir -p dist/emails; \
		cp -r emails/* dist/emails/ 2>/dev/null || true; \
	fi
	@# Otimiza HTML (remove apenas comentários, preserva atributos style)
	@for file in dist/*.html; do \
		if [ -f "$$file" ]; then \
			sed 's/<!--.*-->//g' "$$file" > "$$file.tmp" && mv "$$file.tmp" "$$file"; \
		fi; \
	done
	@echo "✅ Build concluído em ./dist/"

build-with-version: ## Build da PWA com atualização automática de versão (patch)
	@echo "🔄 Atualizando versão (patch)..."
	@npm run version:bump -- patch || (echo "⚠️  Falha ao atualizar versão. Continuando build..." && true)
	@$(MAKE) build

build-with-version-minor: ## Build da PWA com atualização automática de versão (minor)
	@echo "🔄 Atualizando versão (minor)..."
	@npm run version:bump -- minor || (echo "⚠️  Falha ao atualizar versão. Continuando build..." && true)
	@$(MAKE) build

deploy: build-with-version ## Deploy para Vercel (produção) - atualiza versão automaticamente
	@echo "🚀 Deploying para Vercel..."
	@command -v vercel >/dev/null 2>&1 || (echo "❌ Vercel CLI não encontrado. Instale com: npm i -g vercel" && exit 1)
	@vercel --prod
	@echo "✅ Deploy concluído!"

deploy-preview: build ## Deploy preview para Vercel (sem atualizar versão)
	@echo "👀 Deploying preview..."
	@command -v vercel >/dev/null 2>&1 || (echo "❌ Vercel CLI não encontrado. Instale com: npm i -g vercel" && exit 1)
	@vercel
	@echo "✅ Preview deploy concluído!"

deploy-ipfs: ## Deploy completo para IPFS/IPNS via Storacha (Web3) - atualiza versão automaticamente
	@echo "🌐 Deploying para IPFS/IPNS via Storacha (Web3 descentralizado)..."
	@echo "ℹ️  Nota: O script deploy-ipfs.js já atualiza a versão automaticamente antes do build"
	@node scripts/deploy-ipfs.js
	@echo "✅ Deploy IPFS/IPNS concluído!"

check-storacha: ## Verifica configuração e espaços da conta Storacha
	@echo "🔍 Verificando conta Storacha..."
	@npm run check:storacha
	@echo "✅ Verificação concluída!"

get-agent-did: ## Obtém o Agent DID do cliente Storacha (útil para gerar delegações)
	@echo "🔍 Obtendo Agent DID do cliente Storacha..."
	@node scripts/get-agent-did.js
	@echo "✅ Agent DID obtido!"

token-info: ## Exibe informações do token $NEOFLW (Polygon)
	@echo "🪙 Buscando informações do token $NEOFLW..."
	@npm run token:info

dev: ## Servidor local para desenvolvimento (recomendado)
	@echo "🚀 Iniciando servidor Node.js..."
	@command -v node >/dev/null 2>&1 && node server.js || \
	(command -v python3 >/dev/null 2>&1 && python3 -m http.server $(PORT)) || \
	(command -v python >/dev/null 2>&1 && python -m SimpleHTTPServer $(PORT)) || \
	(command -v npx >/dev/null 2>&1 && npx serve . -p $(PORT)) || \
	(echo "❌ Nenhum servidor HTTP encontrado. Instale node, python ou npx" && exit 1)

dev-alt: ## Servidor em porta alternativa (ex: make dev-alt PORT=3001)
	@echo "🚀 Iniciando servidor Node.js na porta $(PORT)..."
	@command -v node >/dev/null 2>&1 && PORT=$(PORT) node server.js || \
	(echo "❌ Node.js não encontrado" && exit 1)

dev-python: ## Servidor Python (alternativo)
	@echo "🐍 Iniciando servidor Python..."
	@command -v python3 >/dev/null 2>&1 && python3 -m http.server 3000 || \
	command -v python >/dev/null 2>&1 && python -m SimpleHTTPServer 3000 || \
	(echo "❌ Python não encontrado" && exit 1)

docker: ## Servidor Docker (recomendado)
	@echo "🐳 Iniciando servidor Docker..."
	@command -v docker >/dev/null 2>&1 || (echo "❌ Docker não encontrado. Instale o Docker" && exit 1)
	@docker-compose up --build

docker-stop: ## Para o servidor Docker
	@echo "🛑 Parando servidor Docker..."
	@docker-compose down

docker-clean: ## Limpa containers e imagens Docker
	@echo "🧹 Limpando Docker..."
	@docker-compose down --rmi all --volumes --remove-orphans

clean: ## Limpa arquivos de build
	@echo "🧹 Limpando build..."
	@rm -rf dist/
	@echo "✅ Limpeza concluída!"

install: ## Instala dependências do projeto
	@echo "📦 Instalando dependências..."
	@npm install
	@echo "✅ Dependências instaladas!"

# Comandos de teste
test: ## Executa testes do formulário (modo watch)
	@echo "🧪 Executando testes do formulário..."
	@command -v node >/dev/null 2>&1 || (echo "❌ Node.js não encontrado" && exit 1)
	@npm test

test-ui: ## Executa testes com interface visual
	@echo "🧪 Executando testes com interface visual..."
	@command -v node >/dev/null 2>&1 || (echo "❌ Node.js não encontrado" && exit 1)
	@npm run test:ui

test-run: ## Executa testes uma vez e exibe resultado
	@echo "🧪 Executando testes do formulário..."
	@command -v node >/dev/null 2>&1 || (echo "❌ Node.js não encontrado" && exit 1)
	@npm run test:run

# Comandos de validação
validate: ## Valida estrutura da PWA
	@echo "🔍 Validando estrutura PWA..."
	@echo "  ✓ index.html: $(shell test -f index.html && echo 'OK' || echo 'FALTANDO')"
	@echo "  ✓ desktop.html: $(shell test -f desktop.html && echo 'OK' || echo 'FALTANDO')"
	@echo "  ✓ miniapp.html: $(shell test -f miniapp.html && echo 'OK' || echo 'FALTANDO')"
	@echo "  ✓ styles.css: $(shell test -f styles.css && echo 'OK' || echo 'FALTANDO')"
	@echo "  ✓ desktop.css: $(shell test -f desktop.css && echo 'OK' || echo 'FALTANDO')"
	@echo "  ✓ js/app.js: $(shell test -f js/app.js && echo 'OK' || echo 'FALTANDO')"
	@echo "  ✓ js/desktop.js: $(shell test -f js/desktop.js && echo 'OK' || echo 'FALTANDO')"
	@echo "  ✓ manifest.webmanifest: $(shell test -f manifest.webmanifest && echo 'OK' || echo 'FALTANDO')"
	@echo "  ✓ sw.js: $(shell test -f sw.js && echo 'OK' || echo 'FALTANDO')"
	@echo "  ✓ robots.txt: $(shell test -f robots.txt && echo 'OK' || echo 'FALTANDO')"
	@echo "  ✓ sitemap.xml: $(shell test -f sitemap.xml && echo 'OK' || echo 'FALTANDO')"
	@echo "  ✓ public/: $(shell test -d public && echo 'OK' || echo 'FALTANDO')"
	@echo "  ✓ api/: $(shell test -d api && echo 'OK' || echo 'FALTANDO')"
	@echo "  ✓ emails/: $(shell test -d emails && echo 'OK' || echo 'FALTANDO')"
	@echo "✅ Validação concluída!"

validate-production: ## Valida produção completa (token, wallet, layout)
	@echo "🔍 Validando produção completa..."
	@command -v node >/dev/null 2>&1 || (echo "❌ Node.js não encontrado" && exit 1)
	@node scripts/validate-production.js

# Comandos de Commit Seguro - Protocolo NΞØ
commit: ## Commit e push seguro com verificação completa (Protocolo NΞØ)
	@echo "🔒 Iniciando commit seguro - Protocolo NΞØ"
	@echo ""
	@echo "📋 Etapa 1/5: Verificando segurança..."
	@npm audit --audit-level=high || (echo "⚠️  Vulnerabilidades encontradas. Continue com cautela." && true)
	@echo ""
	@echo "📋 Etapa 2/5: Verificando mudanças que requerem build..."
	@if git diff --name-only | grep -qE '(src/|public/|js/|css/|\.html$$|\.css$$|\.js$$|vite\.config|package\.json|tailwind\.config|postcss\.config|\.env)'; then \
		echo "🔨 Mudanças detectadas que requerem build. Executando build..."; \
		$(MAKE) build || (echo "❌ Build falhou! Corrija os erros antes de commitar." && exit 1); \
		echo "✅ Build concluído com sucesso!"; \
	else \
		echo "ℹ️  Nenhuma mudança que requer build detectada."; \
	fi
	@echo ""
	@echo "📋 Etapa 3/5: Validando routes e robots..."
	@test -f robots.txt || (echo "❌ robots.txt não encontrado!" && exit 1)
	@test -f sitemap.xml || (echo "❌ sitemap.xml não encontrado!" && exit 1)
	@test -f vercel.json || (echo "❌ vercel.json não encontrado!" && exit 1)
	@grep -q "flowoff.xyz" robots.txt || (echo "⚠️  Domínio flowoff.xyz não encontrado em robots.txt" && true)
	@grep -q "flowoff.xyz" sitemap.xml || (echo "⚠️  Domínio flowoff.xyz não encontrado em sitemap.xml" && true)
	@grep -q "/desktop" vercel.json || (echo "⚠️  Rota /desktop não encontrada em vercel.json" && true)
	@grep -q "/miniapp" sitemap.xml || (echo "⚠️  Rota /miniapp não encontrada em sitemap.xml" && true)
	@echo "✅ Routes e robots validados!"
	@echo ""
	@echo "📋 Etapa 4/5: Verificando status do git..."
	@git status --short
	@if [ -z "$$(git status --porcelain)" ]; then \
		echo "ℹ️  Nenhuma mudança para commitar."; \
		exit 0; \
	fi
	@echo ""
	@echo "📋 Etapa 5/5: Preparando commit..."
	@echo "📝 Tipos de commit (Conventional Commits):"
	@echo "  - feat:     Nova funcionalidade"
	@echo "  - fix:      Correção de bug"
	@echo "  - docs:     Documentação"
	@echo "  - style:    Formatação (não afeta código)"
	@echo "  - refactor: Refatoração"
	@echo "  - perf:     Melhoria de performance"
	@echo "  - test:     Testes"
	@echo "  - chore:    Manutenção/tarefas"
	@echo "  - build:    Sistema de build"
	@echo "  - ci:       Integração contínua"
	@echo ""
	@read -p "Digite a mensagem de commit (ex: 'feat: adiciona nova feature'): " msg; \
	if [ -z "$$msg" ]; then \
		echo "❌ Mensagem de commit não pode ser vazia!"; \
		exit 1; \
	fi; \
	echo ""; \
	echo "🔄 Executando commit e push..."; \
	git add .; \
	git commit -m "$$msg"; \
	git push origin $$(git branch --show-current); \
	echo ""; \
	echo "✅ Commit e push concluídos com sucesso!"; \
	echo "🎉 Protocolo NΞØ executado!"

commit-tag: ## Commit com TAG (para marcos importantes do projeto)
	@echo "🏷️  Commit com TAG - Protocolo NΞØ"
	@echo ""
	@$(MAKE) commit
	@echo ""
	@echo "🏷️  Criando TAG..."
	@read -p "Digite a versão da TAG (ex: v1.0.8): " tag; \
	if [ -z "$$tag" ]; then \
		echo "❌ TAG não pode ser vazia!"; \
		exit 1; \
	fi; \
	read -p "Digite a descrição da TAG: " desc; \
	if [ -z "$$desc" ]; then \
		echo "❌ Descrição não pode ser vazia!"; \
		exit 1; \
	fi; \
	git tag -a "$$tag" -m "$$desc"; \
	git push origin "$$tag"; \
	echo ""; \
	echo "✅ TAG $$tag criada e enviada com sucesso!"; \
	echo "🎉 Marco importante registrado!"

# Comando padrão
.DEFAULT_GOAL := help
