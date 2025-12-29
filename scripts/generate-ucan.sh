#!/bin/bash
# Script auxiliar para gerar UCAN via Storacha CLI
# Uso: ./scripts/generate-ucan.sh

set -e

echo "🔐 Gerando UCAN para Agent DID correto..."
echo ""
echo "📋 Configurações:"
echo "   Agent DID: did:key:z6Mkugedy1x16Skzf2cqf8gcccm1PpEDk2JZ2sQeYoWNEtZh"
echo "   Space DID: did:key:z6Mkjee3CCaP6q2vhRnE3wRBGNqMxEq645EvnYocsbbeZiBR"
echo ""

# Verificar se storacha está instalado
if ! command -v storacha &> /dev/null; then
  echo "❌ Storacha CLI não encontrado. Instale com:"
  echo "   npm install -g @storacha/cli"
  exit 1
fi

echo "🔧 Configurando espaço..."
storacha space use did:key:z6Mkjee3CCaP6q2vhRnE3wRBGNqMxEq645EvnYocsbbeZiBR || {
  echo "⚠️  Espaço não encontrado. Tentando adicionar..."
  echo "   Execute manualmente: storacha space add <PROOF_FILE_OR_CID>"
  exit 1
}

echo ""
echo "🔐 Gerando delegação UCAN..."
echo ""
echo "📝 Execute o comando abaixo e copie o output base64:"
echo ""
echo "storacha delegation create did:key:z6Mkugedy1x16Skzf2cqf8gcccm1PpEDk2JZ2sQeYoWNEtZh \\"
echo "  --can space/blob/add \\"
echo "  --can space/index/add \\"
echo "  --can filecoin/offer \\"
echo "  --can upload/add \\"
echo "  --base64"
echo ""
echo "💡 Depois, cole o UCAN gerado no arquivo .env como STORACHA_UCAN=..."

