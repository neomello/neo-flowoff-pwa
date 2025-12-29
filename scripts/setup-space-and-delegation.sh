#!/bin/bash
# Script para configurar espaço e gerar UCAN de delegação
# Uso: ./scripts/setup-space-and-delegation.sh

set -e

AGENT_DID="did:key:z6Mkugedy1x16Skzf2cqf8gcccm1PpEDk2JZ2sQeYoWNEtZh"
SPACE_DID="did:key:z6MksGJTh44jHJtpCq2TgLJvAqg7SXpk7C6yU4giqj6Ye9Ap"

echo "🔧 Configurando espaço Storacha e gerando UCAN de delegação"
echo ""

# Verificar se storacha está instalado
if ! command -v storacha &> /dev/null; then
  echo "❌ Storacha CLI não encontrado. Instale com:"
  echo "   npm install -g @storacha/cli"
  exit 1
fi

# Listar espaços disponíveis
echo "📋 Espaços disponíveis:"
storacha space ls
echo ""

# Tentar usar o espaço existente
echo "🔧 Tentando usar o espaço: $SPACE_DID"
if storacha space use "$SPACE_DID" 2>/dev/null; then
  echo "✅ Espaço configurado: $SPACE_DID"
else
  echo "⚠️  Espaço não encontrado. Criando novo espaço..."
  echo ""
  echo "Execute manualmente:"
  echo "  storacha space create --name 'neo-flowoff-pwa'"
  echo ""
  echo "Depois execute novamente este script."
  exit 1
fi

echo ""
echo "🔐 Gerando UCAN de delegação..."
echo ""
echo "📝 Execute o comando abaixo e copie o output base64 completo:"
echo ""
echo "storacha delegation create $AGENT_DID \\"
echo "  --can space/blob/add \\"
echo "  --can space/index/add \\"
echo "  --can filecoin/offer \\"
echo "  --can upload/add \\"
echo "  --base64"
echo ""
echo "💡 Depois, cole o UCAN gerado no arquivo .env como:"
echo "   STORACHA_UCAN=<cole_o_ucan_aqui>"
echo ""
echo "E execute: make deploy-ipfs"

