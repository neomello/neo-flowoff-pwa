#!/usr/bin/env node
/**
 * 🔄 Sincroniza Variáveis de Ambiente do .env para Vercel
 *
 * Envia todas as variáveis do .env para a Vercel
 * Suporta: production, preview, development
 *
 * Uso:
 *   node scripts/sync-vercel-env.js
 *   node scripts/sync-vercel-env.js --production
 *   node scripts/sync-vercel-env.js --preview
 *   node scripts/sync-vercel-env.js --all
 */

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { execSync } from 'child_process';
import { readFileSync, existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = join(__dirname, '..');
const ENV_PATH = join(PROJECT_ROOT, '.env');

// Variáveis que devem ser sincronizadas (sem prefixo neoflw_)
const VARS_TO_SYNC = [
  // Neon Database (sem prefixo!)
  'DATABASE_URL',
  'DATABASE_URL_UNPOOLED',
  'POSTGRES_URL',
  'POSTGRES_URL_NON_POOLING',
  'POSTGRES_USER',
  'POSTGRES_HOST',
  'POSTGRES_PASSWORD',
  'POSTGRES_DATABASE',
  'POSTGRES_URL_NO_SSL',
  'POSTGRES_PRISMA_URL',
  'PGHOST',
  'PGHOST_UNPOOLED',
  'PGUSER',
  'PGDATABASE',
  'PGPASSWORD',
  
  // Storacha
  'STORACHA_UCAN',
  'STORACHA_SPACE_DID',
  
  // Resend
  'RESEND_API_KEY',
  
  // Cloudinary
  'CLOUDINARY_CLOUD_NAME',
  'CLOUDINARY_API_KEY',
  'CLOUDINARY_API_SECRET',
  
  // Hunter
  'HUNTER_API_KEY',
  
  // Web3Auth (se existir)
  'WEB3AUTH_CLIENT_ID',
  'NEXT_PUBLIC_WEB3AUTH_CLIENT_ID',
  
  // DRPC (se existir)
  'DRPC_RPC_KEY',
];

// Variáveis que devem ser ignoradas
const VARS_TO_IGNORE = [
  'NODE_ENV',
  'PORT',
  'VERCEL_OIDC_TOKEN',
];

/**
 * Carrega variáveis do .env
 */
function loadEnvVars() {
  if (!existsSync(ENV_PATH)) {
    console.error(`❌ Arquivo .env não encontrado em: ${ENV_PATH}`);
    process.exit(1);
  }

  const content = readFileSync(ENV_PATH, 'utf8');
  const vars = {};

  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    
    // Ignora comentários e linhas vazias
    if (!trimmed || trimmed.startsWith('#')) continue;
    
    // Ignora variáveis que não devem ser sincronizadas
    if (VARS_TO_IGNORE.some(ignore => trimmed.startsWith(ignore + '='))) {
      continue;
    }
    
    const match = trimmed.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
    if (match) {
      const [, key, value] = match;
      // Remove aspas se existirem
      const cleanValue = value.replace(/^["']|["']$/g, '');
      vars[key] = cleanValue;
    }
  }

  return vars;
}

/**
 * Envia variável para Vercel
 */
function setVercelEnv(varName, value, environment = 'production') {
  try {
    // Sintaxe correta do Vercel CLI: vercel env add <name> <environment>
    // Não usa --prod, apenas o nome do ambiente: production, preview, development
    const envFlag = environment; // 'production', 'preview', ou 'development'

    console.log(`   📤 Enviando ${varName} para ${environment}...`);

    // Escapa aspas e caracteres especiais
    const escapedValue = value.replace(/"/g, '\\"').replace(/\$/g, '\\$').replace(/`/g, '\\`');
    
    // Usa echo para passar valor
    // Sintaxe: echo "value" | vercel env add NAME production
    const command = `echo "${escapedValue}" | vercel env add ${varName} ${envFlag}`;

    execSync(command, {
      stdio: 'inherit',
      cwd: PROJECT_ROOT,
      shell: true,
    });

    console.log(`   ✅ ${varName} configurado em ${environment}`);
    return true;
  } catch (error) {
    const errorMsg =
      error.message ||
      error.stdout?.toString() ||
      error.stderr?.toString() ||
      '';

    if (errorMsg.includes('already exists') || errorMsg.includes('already')) {
      console.log(`   ⚠️  ${varName} já existe em ${environment}`);
      console.log(`   💡 Para atualizar, execute:`);
      console.log(`      vercel env rm ${varName} ${envFlag} --yes`);
      console.log(`      echo "${value.replace(/"/g, '\\"')}" | vercel env add ${varName} ${envFlag}`);
      return false;
    }

    console.error(`   ❌ Erro: ${errorMsg}`);
    return false;
  }
}

/**
 * Função principal
 */
async function syncVercelEnv() {
  console.log('🔄 Sincronizando Variáveis de Ambiente para Vercel...\n');

  // Verifica se Vercel CLI está instalado
  try {
    execSync('vercel --version', { stdio: 'pipe' });
  } catch (error) {
    console.error('❌ Vercel CLI não encontrado!');
    console.error('   Instale com: npm i -g vercel');
    process.exit(1);
  }

  // Carrega variáveis do .env
  console.log('📖 Carregando variáveis do .env...\n');
  const envVars = loadEnvVars();

  // Filtra apenas variáveis que devem ser sincronizadas
  const varsToSync = {};
  for (const varName of VARS_TO_SYNC) {
    if (envVars[varName]) {
      varsToSync[varName] = envVars[varName];
    }
  }

  // Mostra variáveis que serão sincronizadas
  console.log('📋 Variáveis que serão sincronizadas:\n');
  Object.keys(varsToSync).forEach((varName) => {
    const value = varsToSync[varName];
    const masked = varName.includes('SECRET') || varName.includes('PASSWORD') || varName.includes('KEY')
      ? value.substring(0, 8) + '...' + value.substring(value.length - 4)
      : value;
    console.log(`   ${varName}: ${masked}`);
  });
  console.log('');

  // Determina ambientes baseado nos argumentos
  const args = process.argv.slice(2);
  let environments = [];

  if (args.includes('--all')) {
    environments = ['production', 'preview', 'development'];
  } else if (args.includes('--production') || args.includes('--prod')) {
    environments = ['production'];
  } else if (args.includes('--preview')) {
    environments = ['preview'];
  } else if (args.includes('--development') || args.includes('--dev')) {
    environments = ['development'];
  } else {
    // Padrão: production
    console.log('📤 Ambiente: production (padrão)');
    console.log('   Use --all para enviar para todos os ambientes');
    console.log('   Use --production, --preview ou --development para escolher\n');
    environments = ['production'];
  }

  // Envia variáveis
  console.log(`🚀 Enviando para ambiente(s): ${environments.join(', ')}\n`);

  let successCount = 0;
  let totalCount = 0;
  let skippedCount = 0;

  for (const env of environments) {
    console.log(`\n📦 Ambiente: ${env}`);
    console.log('─'.repeat(50));

    for (const [varName, value] of Object.entries(varsToSync)) {
      totalCount++;
      if (setVercelEnv(varName, value, env)) {
        successCount++;
      } else {
        skippedCount++;
      }
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log('📊 RESUMO');
  console.log('='.repeat(50));
  console.log(`   Total: ${totalCount}`);
  console.log(`   ✅ Sucesso: ${successCount}`);
  console.log(`   ⚠️  Já existiam: ${skippedCount}`);
  console.log('');

  if (skippedCount > 0) {
    console.log('💡 Para atualizar variáveis existentes, execute os comandos sugeridos acima.\n');
  }

  console.log('✅ Sincronização concluída!\n');
}

syncVercelEnv().catch((err) => {
  console.error('❌ Erro:', err);
  process.exit(1);
});
