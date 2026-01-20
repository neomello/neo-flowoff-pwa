#!/usr/bin/env node
/**
 * ☁️ Configuração de Variáveis Cloudinary na Vercel
 *
 * Envia as variáveis de ambiente do Cloudinary para a Vercel
 * Suporta: production, preview, development
 *
 * Uso:
 *   node scripts/setup-vercel-cloudinary.js
 *   node scripts/setup-vercel-cloudinary.js --production
 *   node scripts/setup-vercel-cloudinary.js --preview
 *   node scripts/setup-vercel-cloudinary.js --all
 */

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { execSync } from 'child_process';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = join(__dirname, '..');

// Carrega .env
dotenv.config({ path: join(PROJECT_ROOT, '.env') });

// Variáveis do Cloudinary a serem enviadas
const CLOUDINARY_VARS = [
  'CLOUDINARY_CLOUD_NAME',
  'CLOUDINARY_API_KEY',
  'CLOUDINARY_API_SECRET',
];

// Fallback para nomes alternativos
const VAR_ALIASES = {
  CLOUDINARY_CLOUD_NAME: ['CLOUD_NAME'],
  CLOUDINARY_API_KEY: ['CLOUD_API_KEY'],
  CLOUDINARY_API_SECRET: ['CLOUD_API_SECRET'],
};

/**
 * Obtém valor da variável com fallback para aliases
 */
function getEnvValue(varName) {
  // Tenta nome principal
  let value = process.env[varName];

  // Se não encontrou, tenta aliases
  if (!value && VAR_ALIASES[varName]) {
    for (const alias of VAR_ALIASES[varName]) {
      value = process.env[alias];
      if (value) break;
    }
  }

  return value;
}

/**
 * Verifica se variável está configurada
 */
function validateEnvVars() {
  const missing = [];
  const values = {};

  for (const varName of CLOUDINARY_VARS) {
    const value = getEnvValue(varName);
    if (!value) {
      missing.push(varName);
    } else {
      values[varName] = value;
    }
  }

  return { missing, values };
}

/**
 * Envia variável para Vercel usando echo e pipe
 */
function setVercelEnvSync(varName, value, environment = 'production') {
  try {
    const envFlag =
      environment === 'production'
        ? '--prod'
        : environment === 'preview'
          ? ''
          : '--env development';

    console.log(`   📤 Enviando ${varName} para ${environment}...`);

    // Usa echo para passar valor
    const command = `echo "${value.replace(/"/g, '\\"')}" | vercel env add ${varName} ${envFlag}`;

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
      console.log(`   💡 Para atualizar, execute manualmente:`);
      console.log(`      vercel env rm ${varName} ${envFlag} --yes`);
      console.log(
        `      echo "${value.replace(/"/g, '\\"')}" | vercel env add ${varName} ${envFlag}`
      );
      return false;
    }

    console.error(`   ❌ Erro: ${errorMsg}`);
    return false;
  }
}

/**
 * Lista ambientes disponíveis
 */
function listEnvironments() {
  try {
    const output = execSync('vercel env ls', {
      encoding: 'utf-8',
      cwd: PROJECT_ROOT,
    });
    console.log('\n📋 Variáveis atuais na Vercel:');
    console.log(output);
  } catch (error) {
    console.log(
      '   ℹ️  Execute "vercel env ls" manualmente para ver variáveis'
    );
  }
}

/**
 * Função principal
 */
async function setupVercelCloudinary() {
  console.log('☁️  Configurando Cloudinary na Vercel...\n');

  // Verifica se Vercel CLI está instalado
  try {
    execSync('vercel --version', { stdio: 'pipe' });
  } catch (error) {
    console.error('❌ Vercel CLI não encontrado!');
    console.error('   Instale com: npm i -g vercel');
    process.exit(1);
  }

  // Valida variáveis locais
  const { missing, values } = validateEnvVars();

  if (missing.length > 0) {
    console.error('❌ Variáveis faltando no .env:');
    missing.forEach((varName) => {
      console.error(`   - ${varName}`);
      const aliases = VAR_ALIASES[varName] || [];
      if (aliases.length > 0) {
        console.error(`     (ou use: ${aliases.join(', ')})`);
      }
    });
    console.error('\n💡 Configure as variáveis no .env antes de continuar');
    process.exit(1);
  }

  console.log('✅ Variáveis encontradas no .env:');
  Object.keys(values).forEach((varName) => {
    const value = values[varName];
    const masked = varName.includes('SECRET')
      ? value.substring(0, 4) + '...' + value.substring(value.length - 4)
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
    // Pergunta interativamente (simulado - sempre production por padrão)
    console.log('📤 Ambiente: production (padrão)');
    console.log('   Use --all para enviar para todos os ambientes');
    console.log(
      '   Use --production, --preview ou --development para escolher\n'
    );
    environments = ['production'];
  }

  // Envia variáveis
  console.log(`🚀 Enviando para ambiente(s): ${environments.join(', ')}\n`);

  let successCount = 0;
  let totalCount = 0;

  for (const env of environments) {
    console.log(`\n📦 Ambiente: ${env}`);
    console.log('─'.repeat(50));

    for (const varName of CLOUDINARY_VARS) {
      const value = values[varName];
      totalCount++;
      if (setVercelEnvSync(varName, value, env)) {
        successCount++;
      }
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log(
    `✅ Concluído: ${successCount}/${totalCount} variáveis configuradas\n`
  );

  // Lista variáveis configuradas
  listEnvironments();

  console.log('\n💡 Próximos passos:');
  console.log('   1. Verifique as variáveis: vercel env ls');
  console.log('   2. Faça um novo deploy: vercel --prod');
  console.log('   3. As variáveis estarão disponíveis em process.env\n');
}

// Executa
setupVercelCloudinary().catch((error) => {
  console.error('\n❌ Erro:', error.message);
  process.exit(1);
});
