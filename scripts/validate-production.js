#!/usr/bin/env node
/**
 * Script de Validação de Produção
 * Verifica:
 * - Token $NEOFLW na Polygon
 * - Configuração de Wallet (preparado para ZeroDev/WalletConnect)
 * - Integração de wallet
 * - Layout e CSS
 * 
 * Uso:
 *   node scripts/validate-production.js
 */

import { readFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  console.log('');
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'cyan');
  log(`  ${title}`, 'cyan');
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'cyan');
  console.log('');
}

// Validação do Token
async function validateToken() {
  logSection('🪙 VALIDAÇÃO DO TOKEN $NEOFLW');
  
  try {
    const configPath = join(__dirname, '..', 'config', 'token.json');
    const config = JSON.parse(await readFile(configPath, 'utf8'));
    
    // Validar estrutura
    const required = ['name', 'symbol', 'decimals', 'network', 'contracts'];
    const missing = required.filter(key => !config[key]);
    
    if (missing.length > 0) {
      log(`❌ Campos faltando: ${missing.join(', ')}`, 'red');
      return false;
    }
    
    log(`✅ Nome: ${config.name}`, 'green');
    log(`✅ Símbolo: $${config.symbol}`, 'green');
    log(`✅ Decimals: ${config.decimals}`, 'green');
    log(`✅ Chain ID: ${config.network.chainId} (${config.network.name})`, 'green');
    log(`✅ Token Address: ${config.contracts.token}`, 'green');
    
    // Validar formato do endereço
    if (!/^0x[a-fA-F0-9]{40}$/.test(config.contracts.token)) {
      log(`❌ Endereço do token inválido: ${config.contracts.token}`, 'red');
      return false;
    }
    
    log(`✅ Formato do endereço válido`, 'green');
    
    // Testar RPC
    log(`🔄 Testando conexão RPC...`, 'yellow');
    const rpcUrl = config.network.rpcUrl || 'https://polygon-rpc.com';
    const response = await fetch(rpcUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'eth_chainId',
        params: []
      })
    });
    
    if (!response.ok) {
      log(`❌ Erro ao conectar RPC: ${response.status}`, 'red');
      return false;
    }
    
    const json = await response.json();
    const chainId = parseInt(json.result, 16);
    
    if (chainId !== config.network.chainId) {
      log(`⚠️  Chain ID do RPC (${chainId}) diferente do configurado (${config.network.chainId})`, 'yellow');
    } else {
      log(`✅ RPC conectado e Chain ID correto`, 'green');
    }
    
    return true;
  } catch (error) {
    log(`❌ Erro ao validar token: ${error.message}`, 'red');
    return false;
  }
}

// Validação de Wallet (preparado para migração futura)
async function validateWallet() {
  logSection('🔐 VALIDAÇÃO DE WALLET');
  
  try {
    const walletPath = join(__dirname, '..', 'js', 'wallet.js');
    const walletCode = await readFile(walletPath, 'utf8');
    
    // Verifica se wallet.js existe e tem estrutura básica
    if (!walletCode.includes('WalletManager')) {
      log(`❌ WalletManager não encontrado em wallet.js`, 'red');
      return false;
    }
    
    log(`✅ WalletManager encontrado`, 'green');
    
    // Verifica se tem fallback RPC
    if (walletCode.includes('fetchBalanceFromRPC')) {
      log(`✅ Fallback RPC configurado`, 'green');
    } else {
      log(`⚠️  Fallback RPC não encontrado`, 'yellow');
    }
    
    if (walletCode.includes('fetchBalance')) {
      log(`✅ Função fetchBalance encontrada`, 'green');
    } else {
      log(`❌ Função fetchBalance não encontrada`, 'red');
      return false;
    }
    
    return true;
  } catch (error) {
    log(`❌ Erro ao validar Wallet: ${error.message}`, 'red');
    return false;
  }
}

// Validação de Layout
async function validateLayout() {
  logSection('🎨 VALIDAÇÃO DE LAYOUT');
  
  try {
    const indexPath = join(__dirname, '..', 'index.html');
    const html = await readFile(indexPath, 'utf8');
    
    // Verificar elementos essenciais
    const essentials = [
      { name: 'Header', pattern: /<header/i },
      { name: 'Wallet Button', pattern: /wallet-btn/i },
      { name: 'Main Router', pattern: /id=["']router["']/i },
      { name: 'Bottom Bar', pattern: /glass-morphism-tabbar/i }
    ];
    
    // Verificar Service Worker separadamente (pode estar em JS)
    const swInHtml = /serviceWorker/i.test(html);
    const swFile = join(__dirname, '..', 'sw.js');
    let swExists = false;
    try {
      await readFile(swFile, 'utf8');
      swExists = true;
    } catch (e) {
      // SW file não existe
    }
    
    if (swInHtml || swExists) {
      log(`✅ Service Worker configurado`, 'green');
    } else {
      log(`⚠️  Service Worker não encontrado (verifique sw.js e registro)`, 'yellow');
    }
    
    let allFound = true;
    essentials.forEach(({ name, pattern }) => {
      if (pattern.test(html)) {
        log(`✅ ${name} encontrado`, 'green');
      } else {
        log(`❌ ${name} não encontrado`, 'red');
        allFound = false;
      }
    });
    
    // Verificar CSS
    const cssFiles = [
      'styles.css',
      'css/main.css',
      'bento-grid.css',
      'glass-morphism-bottom-bar.css'
    ];
    
    log(`🔄 Verificando arquivos CSS...`, 'yellow');
    for (const cssFile of cssFiles) {
      try {
        const cssPath = join(__dirname, '..', cssFile);
        await readFile(cssPath, 'utf8');
        log(`✅ ${cssFile} existe`, 'green');
      } catch (error) {
        log(`⚠️  ${cssFile} não encontrado`, 'yellow');
      }
    }
    
    return allFound;
  } catch (error) {
    log(`❌ Erro ao validar layout: ${error.message}`, 'red');
    return false;
  }
}

// Validação de Integração Wallet
async function validateWalletIntegration() {
  logSection('💼 VALIDAÇÃO DE INTEGRAÇÃO WALLET');
  
  try {
    const walletPath = join(__dirname, '..', 'js', 'wallet.js');
    const walletCode = await readFile(walletPath, 'utf8');
    
    const features = [
      { name: 'WalletManager class', pattern: /class\s+WalletManager/i },
      { name: 'connectEmail', pattern: /connectEmail\s*\(/i },
      { name: 'connectGoogle', pattern: /connectGoogle\s*\(/i },
      { name: 'connectWallet', pattern: /connectWallet\s*\(/i },
      { name: 'fetchBalance', pattern: /fetchBalance\s*\(/i },
      { name: 'TOKEN_CONFIG', pattern: /TOKEN_CONFIG\s*=/i },
      { name: 'Modal de wallet', pattern: /wallet-modal/i }
    ];
    
    let allFound = true;
    features.forEach(({ name, pattern }) => {
      if (pattern.test(walletCode)) {
        log(`✅ ${name} implementado`, 'green');
      } else {
        log(`❌ ${name} não encontrado`, 'red');
        allFound = false;
      }
    });
    
    // Verificar se usa RPC correto
    if (walletCode.includes('polygon-rpc.com') || walletCode.includes('TOKEN_CONFIG.network')) {
      log(`✅ RPC configurado corretamente`, 'green');
    } else {
      log(`⚠️  RPC pode não estar configurado`, 'yellow');
    }
    
    return allFound;
  } catch (error) {
    log(`❌ Erro ao validar integração wallet: ${error.message}`, 'red');
    return false;
  }
}

// Main
async function main() {
  console.log('');
  log('╔═══════════════════════════════════════════════════════════╗', 'cyan');
  log('║   VALIDAÇÃO DE PRODUÇÃO - NEØ.FLOWOFF PWA               ║', 'cyan');
  log('╚═══════════════════════════════════════════════════════════╝', 'cyan');
  console.log('');
  
  const results = {
    token: await validateToken(),
    wallet: await validateWallet(),
    layout: await validateLayout(),
    walletIntegration: await validateWalletIntegration()
  };
  
  logSection('📊 RESULTADO FINAL');
  
  const total = Object.keys(results).length;
  const passed = Object.values(results).filter(Boolean).length;
  
  Object.entries(results).forEach(([key, value]) => {
    const icon = value ? '✅' : '❌';
    const color = value ? 'green' : 'red';
    log(`${icon} ${key.toUpperCase()}: ${value ? 'PASSOU' : 'FALHOU'}`, color);
  });
  
  console.log('');
  log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`, 'cyan');
  log(`  ${passed}/${total} validações passaram`, passed === total ? 'green' : 'yellow');
  log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`, 'cyan');
  console.log('');
  
  if (passed === total) {
    log('✅ Todas as validações passaram! PWA pronto para produção.', 'green');
    process.exit(0);
  } else {
    log('⚠️  Algumas validações falharam. Revise os erros acima.', 'yellow');
    process.exit(1);
  }
}

main().catch(error => {
  log(`❌ Erro fatal: ${error.message}`, 'red');
  console.error(error);
  process.exit(1);
});

