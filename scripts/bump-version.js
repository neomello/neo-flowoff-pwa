#!/usr/bin/env node
/**
 * Bump Version Script
 * Atualiza a versão em todos os arquivos relevantes da PWA
 * 
 * Uso:
 *   node scripts/bump-version.js patch   # 2.2.0 -> 2.2.1
 *   node scripts/bump-version.js minor   # 2.2.0 -> 2.3.0
 *   node scripts/bump-version.js major   # 2.2.0 -> 3.0.0
 *   node scripts/bump-version.js 2.5.0   # Define versão específica
 */

import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, '..');

// Arquivos que contêm a versão
const FILES = {
  'package.json': {
    pattern: /"version":\s*"([^"]+)"/,
    replace: (v) => `"version": "${v}"`
  },
  'manifest.webmanifest': {
    pattern: /"version":\s*"([^"]+)"/,
    replace: (v) => `"version": "${v}"`
  },
  'sw.js': {
    pattern: /const CACHE = 'neo-flowoff-v([^']+)'/,
    replace: (v) => `const CACHE = 'neo-flowoff-v${v}'`
  },
  'js/app.js': {
    pattern: /const PWA_VERSION = '([^']+)'/,
    replace: (v) => `const PWA_VERSION = '${v}'`
  }
};

function getCurrentVersion() {
  const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8'));
  return pkg.version;
}

function bumpVersion(current, type) {
  const [major, minor, patch] = current.split('.').map(Number);
  
  switch (type) {
    case 'major':
      return `${major + 1}.0.0`;
    case 'minor':
      return `${major}.${minor + 1}.0`;
    case 'patch':
      return `${major}.${minor}.${patch + 1}`;
    default:
      // Se for uma versão específica
      if (/^\d+\.\d+\.\d+$/.test(type)) {
        return type;
      }
      throw new Error(`Tipo inválido: ${type}. Use: patch, minor, major ou X.Y.Z`);
  }
}

function updateFile(filename, newVersion, config) {
  const filepath = join(ROOT, filename);
  
  try {
    let content = readFileSync(filepath, 'utf8');
    const match = content.match(config.pattern);
    
    if (!match) {
      console.log(`   ⚠️  ${filename}: padrão não encontrado`);
      return false;
    }
    
    const oldVersion = match[1];
    content = content.replace(config.pattern, config.replace(newVersion));
    writeFileSync(filepath, content, 'utf8');
    
    console.log(`   ✅ ${filename}: ${oldVersion} → ${newVersion}`);
    return true;
  } catch (error) {
    console.log(`   ❌ ${filename}: ${error.message}`);
    return false;
  }
}

function main() {
  const type = process.argv[2] || 'patch';
  const currentVersion = getCurrentVersion();
  
  console.log('');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🔄 PWA Version Bump');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');
  
  let newVersion;
  try {
    newVersion = bumpVersion(currentVersion, type);
  } catch (error) {
    console.error(`❌ ${error.message}`);
    process.exit(1);
  }
  
  console.log(`📦 Versão atual: ${currentVersion}`);
  console.log(`📦 Nova versão:  ${newVersion}`);
  console.log('');
  console.log('📝 Atualizando arquivos:');
  
  let success = 0;
  for (const [filename, config] of Object.entries(FILES)) {
    if (updateFile(filename, newVersion, config)) {
      success++;
    }
  }
  
  console.log('');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  if (success === Object.keys(FILES).length) {
    console.log(`✅ Versão atualizada para ${newVersion} em todos os arquivos!`);
    console.log('');
    console.log('💡 Próximos passos:');
    console.log('   git add -A');
    console.log(`   git commit -m "chore: bump version to ${newVersion}"`);
    console.log('   git push');
  } else {
    console.log(`⚠️  ${success}/${Object.keys(FILES).length} arquivos atualizados`);
  }
  
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');
}

main();
