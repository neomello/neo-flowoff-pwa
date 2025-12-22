#!/usr/bin/env node
/**
 * Script de Verificação - Thirdweb MCP e Token $NEOFLW
 * Verifica conexão com MCP thirdweb e valida configuração do token
 * 
 * Uso:
 *   node scripts/check-thirdweb-mcp.js
 */

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

// Verifica se o Client ID está configurado
async function checkClientID() {
  console.log('🔑 VERIFICAÇÃO DO CLIENT ID');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  // Verifica no HTML
  const fs = await import('fs');
  const htmlPath = join(__dirname, '..', 'index.html');
  const htmlContent = fs.readFileSync(htmlPath, 'utf8');
  
  const clientIdMatch = htmlContent.match(/THIRDWEB_CLIENT_ID\s*=\s*['"]([^'"]+)['"]/);
  
  if (clientIdMatch && clientIdMatch[1]) {
    const clientId = clientIdMatch[1];
    console.log(`   ✅ Client ID encontrado: ${clientId}`);
    console.log(`   📝 Tamanho: ${clientId.length} caracteres`);
    
    if (clientId.length < 20) {
      console.log(`   ⚠️  AVISO: Client ID parece muito curto`);
    }
    
    return clientId;
  } else {
    console.log(`   ❌ Client ID NÃO encontrado no HTML`);
    return null;
  }
}

// Verifica configuração do token
async function checkTokenConfig() {
  console.log('');
  console.log('🪙 VERIFICAÇÃO DO TOKEN $NEOFLW');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  const config = await loadTokenConfig();
  
  // Validações
  const checks = {
    name: config.name && config.name.length > 0,
    symbol: config.symbol && config.symbol.length > 0,
    decimals: config.decimals && config.decimals === 18,
    chainId: config.network.chainId === 8453,
    tokenAddress: config.contracts.token && /^0x[a-fA-F0-9]{40}$/.test(config.contracts.token),
    rpcUrl: config.network.rpcUrl && config.network.rpcUrl.startsWith('https://'),
    explorerUrl: config.network.explorerUrl && config.network.explorerUrl.startsWith('https://')
  };
  
  console.log(`   Nome: ${config.name} ${checks.name ? '✅' : '❌'}`);
  console.log(`   Símbolo: $${config.symbol} ${checks.symbol ? '✅' : '❌'}`);
  console.log(`   Decimals: ${config.decimals} ${checks.decimals ? '✅' : '❌'}`);
  console.log(`   Chain ID: ${config.network.chainId} (Base) ${checks.chainId ? '✅' : '❌'}`);
  console.log(`   Token Address: ${config.contracts.token} ${checks.tokenAddress ? '✅' : '❌'}`);
  console.log(`   RPC URL: ${config.network.rpcUrl} ${checks.rpcUrl ? '✅' : '❌'}`);
  console.log(`   Explorer: ${config.network.explorerUrl} ${checks.explorerUrl ? '✅' : '❌'}`);
  
  const allValid = Object.values(checks).every(v => v === true);
  
  if (allValid) {
    console.log('');
    console.log('   ✅ Todas as configurações do token estão válidas!');
  } else {
    console.log('');
    console.log('   ⚠️  Algumas configurações precisam de atenção');
  }
  
  return { config, allValid };
}

// Testa conexão RPC
async function testRPCConnection(config) {
  console.log('');
  console.log('🌐 TESTE DE CONEXÃO RPC');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  try {
    const response = await fetch(config.network.rpcUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'eth_blockNumber',
        params: []
      })
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const json = await response.json();
    
    if (json.error) {
      throw new Error(json.error.message || 'Erro RPC');
    }
    
    if (json.result) {
      const blockNumber = parseInt(json.result, 16);
      console.log(`   ✅ Conexão RPC funcionando`);
      console.log(`   📦 Block atual: ${blockNumber.toLocaleString()}`);
      return true;
    }
    
    throw new Error('Resposta RPC inválida');
  } catch (error) {
    console.log(`   ❌ Erro na conexão RPC: ${error.message}`);
    return false;
  }
}

// Testa leitura do contrato do token
async function testTokenContract(config) {
  console.log('');
  console.log('📄 TESTE DE LEITURA DO CONTRATO');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  try {
    // Testa chamada balanceOf para um endereço conhecido (zero address)
    const testAddress = '0x0000000000000000000000000000000000000000';
    const balanceOfSelector = '0x70a08231'; // balanceOf(address)
    const data = balanceOfSelector + testAddress.slice(2).toLowerCase().padStart(64, '0');
    
    const response = await fetch(config.network.rpcUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'eth_call',
        params: [{
          to: config.contracts.token,
          data: data
        }, 'latest']
      })
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const json = await response.json();
    
    if (json.error) {
      throw new Error(json.error.message || 'Erro na chamada do contrato');
    }
    
    if (json.result) {
      console.log(`   ✅ Contrato respondendo corretamente`);
      console.log(`   📊 Resposta: ${json.result}`);
      
      // Decodifica balance
      if (json.result !== '0x' && json.result !== '0x0') {
        const balance = BigInt(json.result);
        const decimals = BigInt(10 ** config.decimals);
        const formatted = (balance / decimals).toString();
        console.log(`   💰 Balance test: ${formatted} ${config.symbol}`);
      } else {
        console.log(`   💰 Balance test: 0 ${config.symbol} (esperado para zero address)`);
      }
      
      return true;
    }
    
    throw new Error('Resposta inválida do contrato');
  } catch (error) {
    console.log(`   ❌ Erro ao ler contrato: ${error.message}`);
    return false;
  }
}

// Verifica integração no código JavaScript
async function checkJSIntegration() {
  console.log('');
  console.log('📝 VERIFICAÇÃO DA INTEGRAÇÃO NO CÓDIGO');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  const fs = await import('fs');
  const walletPath = join(__dirname, '..', 'js', 'wallet.js');
  const walletContent = fs.readFileSync(walletPath, 'utf8');
  
  const checks = {
    tokenConfig: walletContent.includes('TOKEN_CONFIG'),
    tokenAddress: walletContent.includes('0x6575933669e530dC25aaCb496cD8e402B8f26Ff5'),
    chainId: walletContent.includes('8453'),
    thirdwebClientId: walletContent.includes('THIRDWEB_CLIENT_ID'),
    fetchBalance: walletContent.includes('fetchBalance'),
    rpcCall: walletContent.includes('eth_call'),
    balanceOfSelector: walletContent.includes('0x70a08231')
  };
  
  console.log(`   TOKEN_CONFIG definido: ${checks.tokenConfig ? '✅' : '❌'}`);
  console.log(`   Endereço do token: ${checks.tokenAddress ? '✅' : '❌'}`);
  console.log(`   Chain ID Base (8453): ${checks.chainId ? '✅' : '❌'}`);
  console.log(`   THIRDWEB_CLIENT_ID: ${checks.thirdwebClientId ? '✅' : '❌'}`);
  console.log(`   Função fetchBalance: ${checks.fetchBalance ? '✅' : '❌'}`);
  console.log(`   Chamada RPC eth_call: ${checks.rpcCall ? '✅' : '❌'}`);
  console.log(`   Selector balanceOf: ${checks.balanceOfSelector ? '✅' : '❌'}`);
  
  const allValid = Object.values(checks).every(v => v === true);
  
  if (allValid) {
    console.log('');
    console.log('   ✅ Todas as integrações estão presentes no código!');
  } else {
    console.log('');
    console.log('   ⚠️  Algumas integrações podem estar faltando');
  }
  
  return allValid;
}

// Função principal
async function main() {
  console.log('');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🔍 VERIFICAÇÃO COMPLETA - Thirdweb MCP e Token $NEOFLW');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');
  
  // 1. Verifica Client ID
  const clientId = await checkClientID();
  
  // 2. Verifica configuração do token
  const { config, allValid: tokenValid } = await checkTokenConfig();
  
  // 3. Testa conexão RPC
  const rpcOk = await testRPCConnection(config);
  
  // 4. Testa contrato do token
  const contractOk = await testTokenContract(config);
  
  // 5. Verifica integração no código
  const codeOk = await checkJSIntegration();
  
  // Resumo final
  console.log('');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 RESUMO DA VERIFICAÇÃO');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');
  console.log(`   Client ID: ${clientId ? '✅ Configurado' : '❌ Não encontrado'}`);
  console.log(`   Config Token: ${tokenValid ? '✅ Válida' : '❌ Inválida'}`);
  console.log(`   Conexão RPC: ${rpcOk ? '✅ Funcionando' : '❌ Erro'}`);
  console.log(`   Contrato Token: ${contractOk ? '✅ Acessível' : '❌ Erro'}`);
  console.log(`   Código JS: ${codeOk ? '✅ Integrado' : '❌ Faltando'}`);
  console.log('');
  
  const allOk = clientId && tokenValid && rpcOk && contractOk && codeOk;
  
  if (allOk) {
    console.log('✅ TODAS AS VERIFICAÇÕES PASSARAM!');
    console.log('   O sistema está pronto para uso em produção.');
  } else {
    console.log('⚠️  ALGUMAS VERIFICAÇÕES FALHARAM');
    console.log('   Revise os itens marcados com ❌ acima.');
  }
  
  console.log('');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');
  
  process.exit(allOk ? 0 : 1);
}

main().catch(error => {
  console.error('❌ Erro fatal:', error);
  process.exit(1);
});

