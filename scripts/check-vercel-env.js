#!/usr/bin/env node
/**
 * 🔍 Script para Verificar Variáveis de Ambiente na Vercel
 * 
 * Lista todas as variáveis de ambiente configuradas na Vercel
 * e compara com o que deveria estar configurado
 * 
 * Pré-requisitos:
 *   - Vercel CLI instalado: npm i -g vercel
 *   - Autenticado na Vercel: vercel login
 * 
 * Uso:
 *   node scripts/check-vercel-env.js
 */

import { execSync } from 'child_process';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = join(__dirname, '..');

// Variáveis esperadas baseadas no env-example.txt
const EXPECTED_VARS = {
  // Públicas (NEXT_PUBLIC_*)
  public: [
    'NEXT_PUBLIC_WEB3AUTH_CLIENT_ID',
    'NEXT_PUBLIC_INFURA_API_KEY',
  ],
  // Privadas
  private: [
    'DATABASE_URL', // Neon Postgres pooled connection
    'STORACHA_DID',
    'STORACHA_UCAN',
    'STORACHA_SPACE_DID',
    'INFURA_API_KEY',
    'WEB3AUTH_CLIENT_ID',
    'DRPC_RPC_KEY', // URL completa do DRPC
    'IPNS_KEY_NAME',
    'IPNS_KEY_ID',
    'UCAN_TOKEN',
  ],
  // Opcionais
  optional: [
    'DATABASE_URL_UNPOOLED', // Neon Postgres unpooled (conexão direta)
    'POSTGRES_URL_NON_POOLING', // Alternativa para DATABASE_URL_UNPOOLED
    'STORACHA_ENDPOINT',
    'STORACHA_EMAIL',
    'STORACHA_PRIVATE_KEY',
    'WALLET_PROVIDER_API_KEY',
    'NODE_ENV',
    'PORT',
  ],
};

function checkVercelCLI() {
  try {
    execSync('vercel --version', { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

function checkVercelAuth() {
  try {
    const output = execSync('vercel whoami', { 
      encoding: 'utf-8',
      stdio: 'pipe',
    });
    return output.trim();
  } catch {
    return null;
  }
}

function getVercelEnvVars() {
  try {
    // Tenta obter variáveis via Vercel CLI
    // Nota: Isso requer que o projeto esteja linkado (vercel link)
    const output = execSync('vercel env list', { 
      encoding: 'utf-8',
      cwd: PROJECT_ROOT,
    });
    
    // Parse do output do Vercel CLI
    // Formato esperado: linhas com "Name", "Environment", "Git Branch", etc.
    return parseTextOutput(output);
  } catch (error) {
    console.error('❌ Erro ao obter variáveis da Vercel:', error.message);
    console.log('\n💡 Dicas:');
    console.log('   1. Certifique-se de estar autenticado: vercel login');
    console.log('   2. Certifique-se de estar no diretório do projeto');
    console.log('   3. Se o projeto não estiver linkado, execute: vercel link');
    console.log('   4. Verifique se você tem permissão para acessar as variáveis');
    return null;
  }
}

function parseTextOutput(output) {
  // Parse do output do Vercel CLI
  // Formato: tabela com colunas Name, Environment, Git Branch, etc.
  const lines = output.split('\n');
  const vars = [];
  let headerFound = false;
  
  for (const line of lines) {
    // Pula linhas vazias e separadores
    if (!line.trim() || line.includes('─') || line.includes('═')) {
      continue;
    }
    
    // Detecta header (Name, Environment, etc.)
    if (line.includes('Name') && line.includes('Environment')) {
      headerFound = true;
      continue;
    }
    
    // Se encontrou o header, processa as linhas seguintes
    if (headerFound) {
      // Remove espaços extras e divide por múltiplos espaços
      const parts = line.trim().split(/\s{2,}/);
      
      if (parts.length >= 2) {
        const key = parts[0].trim();
        const environment = parts[1].trim();
        
        // Ignora linhas que não parecem variáveis
        if (key && key.match(/^[A-Z_][A-Z0-9_]*$/)) {
          vars.push({
            key: key,
            environment: environment,
            value: parts[2] ? parts[2].trim() : '(oculto)',
          });
        }
      }
    }
  }
  
  return vars;
}

function compareVars(vercelVars, expectedVars) {
  const vercelKeys = new Set(vercelVars.map(v => v.key));
  
  const missing = {
    public: [],
    private: [],
    optional: [],
  };
  
  const present = {
    public: [],
    private: [],
    optional: [],
  };
  
  // Verifica variáveis públicas
  for (const key of expectedVars.public) {
    if (vercelKeys.has(key)) {
      present.public.push(key);
    } else {
      missing.public.push(key);
    }
  }
  
  // Verifica variáveis privadas
  for (const key of expectedVars.private) {
    if (vercelKeys.has(key)) {
      present.private.push(key);
    } else {
      missing.private.push(key);
    }
  }
  
  // Verifica variáveis opcionais
  for (const key of expectedVars.optional) {
    if (vercelKeys.has(key)) {
      present.optional.push(key);
    }
  }
  
  // Variáveis extras na Vercel (não esperadas)
  const extra = [];
  for (const key of vercelKeys) {
    if (
      !expectedVars.public.includes(key) &&
      !expectedVars.private.includes(key) &&
      !expectedVars.optional.includes(key)
    ) {
      extra.push(key);
    }
  }
  
  return { missing, present, extra };
}

function maskSensitive(value, showStart = 8, showEnd = 4) {
  if (!value || typeof value !== 'string') return '***';
  if (value.length <= showStart + showEnd) return '***';
  return `${value.substring(0, showStart)}...${value.substring(value.length - showEnd)}`;
}

async function main() {
  console.log('🔍 Verificando Variáveis de Ambiente na Vercel\n');
  console.log('═══════════════════════════════════════════════════\n');
  
  // Verifica se Vercel CLI está instalado
  if (!checkVercelCLI()) {
    console.log('❌ Vercel CLI não encontrado!');
    console.log('\n📦 Instale com:');
    console.log('   npm install -g vercel');
    console.log('\n🔐 Depois autentique:');
    console.log('   vercel login');
    return;
  }
  
  console.log('✅ Vercel CLI encontrado\n');
  
  // Verifica autenticação
  console.log('🔐 Verificando autenticação...\n');
  const username = checkVercelAuth();
  if (!username) {
    console.log('❌ Não autenticado na Vercel!');
    console.log('\n📝 Para autenticar, execute:');
    console.log('   vercel login');
    console.log('\n💡 Depois execute este script novamente.\n');
    return;
  }
  
  console.log(`✅ Autenticado como: ${username}\n`);
  
  // Obtém variáveis da Vercel
  console.log('📥 Obtendo variáveis da Vercel...\n');
  const vercelVars = getVercelEnvVars();
  
  if (!vercelVars || vercelVars.length === 0) {
    console.log('⚠️  Não foi possível obter variáveis da Vercel');
    console.log('\n💡 Alternativa: Verifique manualmente em:');
    console.log('   https://vercel.com/[seu-projeto]/settings/environment-variables');
    console.log('\n📋 Variáveis esperadas:\n');
    console.log('Públicas (NEXT_PUBLIC_*):');
    EXPECTED_VARS.public.forEach(v => console.log(`   - ${v}`));
    console.log('\nPrivadas:');
    EXPECTED_VARS.private.forEach(v => console.log(`   - ${v}`));
    console.log('\nOpcionais:');
    EXPECTED_VARS.optional.forEach(v => console.log(`   - ${v}`));
    return;
  }
  
  // Mostra variáveis encontradas
  console.log(`✅ Encontradas ${vercelVars.length} variável(is) na Vercel\n`);
  
  // Agrupa por nome
  const varsByName = {};
  for (const v of vercelVars) {
    if (!varsByName[v.key]) {
      varsByName[v.key] = [];
    }
    varsByName[v.key].push(v.environment);
  }
  
  // Compara com esperado
  const comparison = compareVars(vercelVars, EXPECTED_VARS);
  
  // Relatório
  console.log('═══════════════════════════════════════════════════');
  console.log('📊 RELATÓRIO DE VARIÁVEIS');
  console.log('═══════════════════════════════════════════════════\n');
  
  // Variáveis presentes
  console.log('✅ VARIÁVEIS CONFIGURADAS:\n');
  
  if (comparison.present.public.length > 0) {
    console.log('   Públicas (NEXT_PUBLIC_*):');
    comparison.present.public.forEach(key => {
      const envs = varsByName[key] || [];
      console.log(`   ✅ ${key} (${envs.join(', ')})`);
    });
    console.log('');
  }
  
  if (comparison.present.private.length > 0) {
    console.log('   Privadas:');
    comparison.present.private.forEach(key => {
      const envs = varsByName[key] || [];
      console.log(`   ✅ ${key} (${envs.join(', ')})`);
    });
    console.log('');
  }
  
  if (comparison.present.optional.length > 0) {
    console.log('   Opcionais:');
    comparison.present.optional.forEach(key => {
      const envs = varsByName[key] || [];
      console.log(`   ✅ ${key} (${envs.join(', ')})`);
    });
    console.log('');
  }
  
  // Variáveis faltantes
  if (comparison.missing.public.length > 0 || comparison.missing.private.length > 0) {
    console.log('❌ VARIÁVEIS FALTANTES:\n');
    
    if (comparison.missing.public.length > 0) {
      console.log('   Públicas (NEXT_PUBLIC_*):');
      comparison.missing.public.forEach(key => {
        console.log(`   ❌ ${key}`);
      });
      console.log('');
    }
    
    if (comparison.missing.private.length > 0) {
      console.log('   Privadas:');
      comparison.missing.private.forEach(key => {
        console.log(`   ❌ ${key}`);
      });
      console.log('');
    }
  }
  
  // Variáveis extras
  if (comparison.extra.length > 0) {
    console.log('⚠️  VARIÁVEIS EXTRAS (não esperadas):\n');
    comparison.extra.forEach(key => {
      const envs = varsByName[key] || [];
      console.log(`   ⚠️  ${key} (${envs.join(', ')})`);
    });
    console.log('');
  }
  
  // Resumo
  console.log('═══════════════════════════════════════════════════');
  console.log('📋 RESUMO');
  console.log('═══════════════════════════════════════════════════\n');
  
  const totalExpected = EXPECTED_VARS.public.length + EXPECTED_VARS.private.length;
  const totalPresent = comparison.present.public.length + comparison.present.private.length;
  const totalMissing = comparison.missing.public.length + comparison.missing.private.length;
  
  console.log(`   Total esperado (obrigatórias): ${totalExpected}`);
  console.log(`   Total configurado: ${totalPresent}`);
  console.log(`   Total faltante: ${totalMissing}`);
  console.log(`   Total opcionais configuradas: ${comparison.present.optional.length}`);
  console.log(`   Total extras: ${comparison.extra.length}\n`);
  
  if (totalMissing === 0) {
    console.log('✅ Todas as variáveis obrigatórias estão configuradas!\n');
  } else {
    console.log('⚠️  Algumas variáveis obrigatórias estão faltando.');
    console.log('   Configure-as no painel da Vercel:\n');
    console.log('   https://vercel.com/[seu-projeto]/settings/environment-variables\n');
  }
  
  // Instruções
  console.log('💡 PRÓXIMOS PASSOS:\n');
  console.log('   1. Acesse o painel da Vercel:');
  console.log('      https://vercel.com/[seu-projeto]/settings/environment-variables');
  console.log('   2. Adicione as variáveis faltantes');
  console.log('   3. Configure para os ambientes corretos (Production, Preview, Development)');
  console.log('   4. Execute este script novamente para verificar\n');
}

main().catch(console.error);

