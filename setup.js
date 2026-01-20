#!/usr/bin/env node
/**
 * Script de Setup e Inicialização - NEØ.FLOWOFF PWA
 * Garante que tudo está configurado e atualizado
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const isProduction = process.env.NODE_ENV === 'production';
const consoleLog = console['log']?.bind(console) ?? (() => {});
const log = (...args) => {
  if (!isProduction) {
    consoleLog(...args);
  }
};

log('→ NEØ.FLOWOFF PWA - Setup e Inicialização\n');

// 1. Verificar Node.js
log('• Verificando ambiente...');
try {
  const nodeVersion = execSync('node --version', { encoding: 'utf-8' }).trim();
  const majorVersion = parseInt(nodeVersion.replace('v', '').split('.')[0]);
  if (majorVersion < 18) {
    log('✗ Node.js versão 18+ é necessário. Versão atual:', nodeVersion);
    process.exit(1);
  }
  log(`  ✓ Node.js ${nodeVersion} (OK)`);
} catch (error) {
  log('✗ Node.js não encontrado');
  process.exit(1);
}

// 2. Instalar dependências
log('\n📦 Instalando/atualizando dependências...');
try {
  execSync('npm install', { stdio: 'inherit', cwd: __dirname });
  log('info', '  ✓ Dependências instaladas');
} catch (error) {
  log('error', '✗ Erro ao instalar dependências');
  process.exit(1);
}

// 3. Verificar/criar .env
log('info', '\n⚙️  Verificando configuração...');
const envPath = path.join(__dirname, '.env');
const envExamplePath = path.join(__dirname, 'env-example.txt');

if (!fs.existsSync(envPath)) {
  if (fs.existsSync(envExamplePath)) {
    log('warn', '  ⚠️  Arquivo .env não encontrado');
    log('  📝 Copiando env-example.txt para .env...');
    const envExample = fs.readFileSync(envExamplePath, 'utf-8');
    fs.writeFileSync(envPath, envExample);
    log('info', '  ✓ Arquivo .env criado (configure suas variáveis)');
  } else {
    log(
      'warn',
      '  ⚠️  Arquivo .env não encontrado e env-example.txt não existe'
    );
  }
} else {
  log('info', '  ✓ Arquivo .env existe');
}

// 4. Validar estrutura PWA
log('info', '\n• Validando estrutura PWA...');
const requiredFiles = [
  'index.html',
  'styles.css',
  'app.js',
  'manifest.webmanifest',
  'sw.js',
];

const requiredDirs = ['public'];

let allOk = true;

requiredFiles.forEach((file) => {
  const filePath = path.join(__dirname, file);
  if (fs.existsSync(filePath)) {
    log(`  ✓ ${file}`);
  } else {
    log(`  ✗ ${file} (FALTANDO)`);
    allOk = false;
  }
});

requiredDirs.forEach((dir) => {
  const dirPath = path.join(__dirname, dir);
  if (fs.existsSync(dirPath)) {
    log(`  ✓ ${dir}/`);
  } else {
    log(`  ✗ ${dir}/ (FALTANDO)`);
    allOk = false;
  }
});

if (!allOk) {
  log('error', '\n✗ Estrutura PWA incompleta');
  process.exit(1);
}

// 5. Verificar pasta .projetos
log('\n📁 Verificando pasta .projetos...');
const projetosPath = path.join(__dirname, '.projetos');
if (!fs.existsSync(projetosPath)) {
  fs.mkdirSync(projetosPath, { recursive: true });
  log('  ✓ Pasta .projetos criada');
} else {
  log('  ✓ Pasta .projetos existe');
}

// 6. Resumo
log('\n✅ Setup concluído!\n');
log('📋 Próximos passos:');
log('  1. Configure o arquivo .env com suas variáveis de ambiente');
log('  2. Execute: npm start (ou npm run dev para desenvolvimento)');
log('  3. Acesse: http://localhost:3000\n');
