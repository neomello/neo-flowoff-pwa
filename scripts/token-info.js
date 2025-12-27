#!/usr/bin/env node
/**
 * Token Info Script - $NEOFLW
 * Busca informações do token NEOFlowOFF na Polygon via Thirdweb API
 * 
 * Uso:
 *   node scripts/token-info.js
 *   npm run token:info
 */

import 'dotenv/config';
import { readFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Carrega configuração do token
async function loadTokenConfig() {
  const configPath = join(__dirname, '..', 'config', 'token.json');
  const data = await readFile(configPath, 'utf8');
  return JSON.parse(data);
}

// Formata valor com decimals
function formatTokenAmount(value, decimals = 18) {
  if (!value || value === '0') return '0';
  const num = BigInt(value);
  const divisor = BigInt(10 ** decimals);
  const intPart = num / divisor;
  const decPart = num % divisor;
  
  if (decPart === 0n) return intPart.toLocaleString();
  
  const decStr = decPart.toString().padStart(decimals, '0').slice(0, 4);
  return `${intPart.toLocaleString()}.${decStr}`;
}

// Busca dados do contrato via RPC direto (Polygon)
async function fetchContractData(config) {
  const { rpcUrl } = config.network;
  const { token } = config.contracts;
  
  // Function selectors (keccak256 dos primeiros 4 bytes)
  const selectors = {
    name: '0x06fdde03',
    symbol: '0x95d89b41', 
    decimals: '0x313ce567',
    totalSupply: '0x18160ddd'
  };
  
  async function callRpc(data) {
    const response = await fetch(rpcUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'eth_call',
        params: [{ to: token, data }, 'latest']
      })
    });
    const json = await response.json();
    return json.result;
  }
  
  try {
    const [nameHex, symbolHex, decimalsHex, supplyHex] = await Promise.all([
      callRpc(selectors.name),
      callRpc(selectors.symbol),
      callRpc(selectors.decimals),
      callRpc(selectors.totalSupply)
    ]);
    
    // Decode string (offset 32 bytes, length 32 bytes, then string)
    const decodeString = (hex) => {
      if (!hex || hex === '0x') return null;
      const data = hex.slice(2);
      const length = parseInt(data.slice(64, 128), 16);
      const strHex = data.slice(128, 128 + length * 2);
      return Buffer.from(strHex, 'hex').toString('utf8');
    };
    
    // Decode uint
    const decodeUint = (hex) => {
      if (!hex || hex === '0x') return '0';
      return BigInt(hex).toString();
    };
    
    return {
      name: decodeString(nameHex),
      symbol: decodeString(symbolHex),
      decimals: parseInt(decimalsHex, 16),
      totalSupply: decodeUint(supplyHex)
    };
  } catch (error) {
    console.error('⚠️  Erro ao buscar dados RPC:', error.message);
    return null;
  }
}

async function main() {
  console.log('');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🪙  $NEOFLW - NEOFlowOFF Token');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');
  
  const config = await loadTokenConfig();
  
  // Info estática
  console.log('📋 CONFIGURAÇÃO');
  console.log(`   Nome: ${config.name}`);
  console.log(`   Símbolo: $${config.symbol}`);
  console.log(`   Decimals: ${config.decimals}`);
  console.log(`   Rede: ${config.network.name} (Chain ID: ${config.network.chainId})`);
  console.log('');
  
  console.log('📍 CONTRATOS');
  console.log(`   Token: ${config.contracts.token}`);
  console.log(`   Proxy: ${config.contracts.proxy}`);
  console.log('');
  
  console.log('🔗 LINKS');
  console.log(`   PolygonScan: ${config.links.polygonscan || config.links.contract}`);
  console.log('');
  
  console.log('⚙️  FEATURES');
  config.metadata.features.forEach(f => {
    console.log(`   ✓ ${f}`);
  });
  console.log('');
  
  // Busca dados on-chain via RPC
  console.log('🔄 Buscando dados on-chain...');
  const data = await fetchContractData(config);
  
  if (data) {
    console.log('');
    console.log('📊 DADOS ON-CHAIN (live)');
    console.log(`   Nome: ${data.name || config.name}`);
    console.log(`   Símbolo: ${data.symbol || config.symbol}`);
    console.log(`   Decimals: ${data.decimals || config.decimals}`);
    
    const supply = formatTokenAmount(data.totalSupply, data.decimals || config.decimals);
    if (supply === '0') {
      console.log(`   Total Supply: 0 ${config.symbol} (nenhum token mintado)`);
    } else {
      console.log(`   Total Supply: ${supply} ${config.symbol}`);
    }
  }
  
  console.log('');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('✅ Informações carregadas com sucesso!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');
}

main().catch(console.error);
