# NEØ.FLOWOFF PWA - Makefile
# Node validado do Protocolo NΞØ

.PHONY: help build deploy deploy-preview deploy-ipfs check-storacha get-agent-did token-info dev clean install test test-ui test-run validate validate-production

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
	@# Copia arquivos principais
	@cp index.html dist/
	@cp styles.css dist/styles.css
	@cp manifest.webmanifest dist/
	@cp sw.js dist/
	@cp favicon.ico dist/
	@# Copia pasta js/
	@mkdir -p dist/js
	@cp -r js/* dist/js/ 2>/dev/null || true
	@# Copia pasta css/modules/ para dist
	@mkdir -p dist/css/modules
	@# Copia arquivos CSS adicionais
	@cp glass-morphism-bottom-bar.css dist/ 2>/dev/null || true
	@cp bento-grid.css dist/ 2>/dev/null || true
	@# Copia diretório public (se existir)
	@if [ -d "public" ]; then \
		cp -r public dist/; \
	fi
	@# Copia pasta api/ (funções serverless para Vercel)
	@if [ -d "api" ]; then \
		echo "📦 Copiando funções serverless (api/)..."; \
		cp -r api dist/; \
		echo "✅ Funções serverless copiadas!"; \
	fi
	@# Otimiza HTML (remove apenas comentários, preserva atributos style)
	@sed 's/<!--.*-->//g' dist/index.html > dist/index.tmp && mv dist/index.tmp dist/index.html
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
	@echo "  ✓ styles.css: $(shell test -f styles.css && echo 'OK' || echo 'FALTANDO')"
	@echo "  ✓ js/app.js: $(shell test -f js/app.js && echo 'OK' || echo 'FALTANDO')"
	@echo "  ✓ manifest.webmanifest: $(shell test -f manifest.webmanifest && echo 'OK' || echo 'FALTANDO')"
	@echo "  ✓ sw.js: $(shell test -f sw.js && echo 'OK' || echo 'FALTANDO')"
	@echo "  ✓ public/: $(shell test -d public && echo 'OK' || echo 'FALTANDO')"
	@echo "✅ Validação concluída!"

validate-production: ## Valida produção completa (token, wallet, layout)
	@echo "🔍 Validando produção completa..."
	@command -v node >/dev/null 2>&1 || (echo "❌ Node.js não encontrado" && exit 1)
	@node scripts/validate-production.js

# Comando padrão
.DEFAULT_GOAL := help
