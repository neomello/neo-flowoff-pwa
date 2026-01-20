import path from 'node:path';
import { existsSync } from 'node:fs';

const root = process.cwd();
const requiredFiles = [
  'index.html',
  'styles.css',
  // app.js na raiz foi removido, apenas js/app.js é necessário
  'js/app.js',
  'manifest.webmanifest',
  'sw.js',
];

const missing = requiredFiles.filter(
  (file) => !existsSync(path.join(root, file))
);

if (missing.length) {
  console.error('✗ Arquivos essenciais ausentes:', missing.join(', '));
  process.exitCode = 1;
  throw new Error('Arquivos essenciais ausentes');
}

console.log('✓ Teste de sanidade concluído. Arquivos principais presentes.');
