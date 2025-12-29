#!/bin/bash
# Script para gerar UCAN de delegação para o espaço Storacha
# Uso: ./scripts/generate-delegation-ucan.sh

set -e

AGENT_DID="did:key:z6Mkugedy1x16Skzf2cqf8gcccm1PpEDk2JZ2sQeYoWNEtZh"
SPACE_DID="did:key:z6MksGJTh44jHJtpCq2TgLJvAqg7SXpk7C6yU4giqj6Ye9Ap"

echo "🔐 Gerando UCAN de delegação para o espaço Storacha"
echo ""
echo "📋 Configurações:"
echo "   Agent DID: $AGENT_DID"
echo "   Space DID: $SPACE_DID"
echo ""

# Verificar se storacha está instalado
if ! command -v storacha &> /dev/null; then
  echo "❌ Storacha CLI não encontrado. Instale com:"
  echo "   npm install -g @storacha/cli"
  exit 1
fi

# Tentar usar o espaço
echo "🔧 Tentando usar o espaço..."
if storacha space use "$SPACE_DID" 2>/dev/null; then
  echo "✅ Espaço configurado"
else
  echo "⚠️  Espaço não encontrado no Storacha CLI"
  echo "   Você pode precisar adicionar o espaço primeiro ou criar um novo"
  echo ""
  echo "   Opções:"
  echo "   1. Criar novo espaço: storacha space create --name 'neo-flowoff-pwa'"
  echo "   2. Adicionar espaço existente: storacha space add <PROOF_FILE_OR_CID>"
  echo ""
  read -p "Deseja continuar mesmo assim? (s/N): " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Ss]$ ]]; then
    exit 1
  fi
fi

echo ""
echo "🔐 Gerando delegação UCAN..."
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

