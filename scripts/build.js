// scripts/build.js - Build script para Netlify (sem dependência de make)
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Garante que NODE_ENV seja production em builds de produção
if (!process.env.NODE_ENV) {
  process.env.NODE_ENV = 'production';
}

// Atualiza versão automaticamente se BUILD_BUMP_VERSION estiver definido
if (process.env.BUILD_BUMP_VERSION) {
  console.log(`🔄 Atualizando versão (${process.env.BUILD_BUMP_VERSION})...`);
  try {
    execSync(`npm run version:bump -- ${process.env.BUILD_BUMP_VERSION}`, {
      cwd: rootDir,
      stdio: 'inherit',
    });
    console.log('✅ Versão atualizada!\n');
  } catch (error) {
    console.warn('⚠️  Falha ao atualizar versão. Continuando build...\n');
  }
}

console.log('🔨 Building PWA...');

// Valida estrutura mínima
const requiredFiles = [
  'index.html',
  'styles.css',
  'js/app.js',
  'manifest.webmanifest',
  'sw.js',
];

for (const file of requiredFiles) {
  const filePath = path.join(rootDir, file);
  if (!fs.existsSync(filePath)) {
    console.error(`❌ ${file} não encontrado`);
    process.exit(1);
  }
}

// Cria diretório dist se não existir
const distDir = path.join(rootDir, 'dist');
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

// Build CSS modularizado
console.log('🔨 Concatenando módulos CSS...');
try {
  execSync('bash build-css.sh', { cwd: rootDir, stdio: 'pipe' });
} catch (error) {
  console.error('❌ Erro ao construir CSS:', error.message);
  process.exit(1);
}

// Copia arquivos principais
const filesToCopy = [
  'index.html',
  'desktop.html',
  'styles.css',
  'desktop.css',
  // app.js na raiz não precisa ser copiado (é apenas wrapper)
  'manifest.webmanifest',
  'sw.js',
  'favicon.ico',
  'glass-morphism-bottom-bar.css',
  'bento-grid.css',
  'miniapp-landing.css', // CSS da landing do miniapp
  // Páginas adicionais
  'miniapp.html',
  'privacy.html',
  'terms.html',
  // SEO e PWA
  'sitemap.xml',
  'robots.txt',
  // Documentação removida - arquivos .md agora estão em docs/
];

for (const file of filesToCopy) {
  const srcPath = path.join(rootDir, file);
  const destPath = path.join(distDir, file);
  if (fs.existsSync(srcPath)) {
    fs.copyFileSync(srcPath, destPath);
  }
}

// Copia pasta js/ recursivamente
const jsSrcDir = path.join(rootDir, 'js');
const jsDestDir = path.join(distDir, 'js');
if (fs.existsSync(jsSrcDir)) {
  console.log('📦 Copiando scripts (js/)...');
  fs.cpSync(jsSrcDir, jsDestDir, { recursive: true });
}

// Copia pasta css/ recursivamente (para novos arquivos modulares)
const cssSrcDir = path.join(rootDir, 'css');
const cssDestDir = path.join(distDir, 'css');
if (fs.existsSync(cssSrcDir)) {
  console.log('📦 Copiando estilos (css/)...');
  fs.cpSync(cssSrcDir, cssDestDir, { recursive: true });
}

// Copia pasta emails/ recursivamente (para templates de email)
const emailsSrcDir = path.join(rootDir, 'emails');
const emailsDestDir = path.join(distDir, 'emails');
if (fs.existsSync(emailsSrcDir)) {
  console.log('📦 Copiando templates de email (emails/)...');
  fs.cpSync(emailsSrcDir, emailsDestDir, { recursive: true });
}

// Copia diretório public (se existir)
const publicSrcDir = path.join(rootDir, 'public');
const publicDestDir = path.join(distDir, 'public');
if (fs.existsSync(publicSrcDir)) {
  fs.cpSync(publicSrcDir, publicDestDir, { recursive: true });
} else {
  // Tenta publicj como fallback
  const publicjSrcDir = path.join(rootDir, 'publicj');
  if (fs.existsSync(publicjSrcDir)) {
    fs.cpSync(publicjSrcDir, publicDestDir, { recursive: true });
  }
}

// Copia pasta api/ (funções serverless para Vercel)
const apiSrcDir = path.join(rootDir, 'api');
const apiDestDir = path.join(distDir, 'api');
if (fs.existsSync(apiSrcDir)) {
  console.log('📦 Copiando funções serverless (api/)...');
  fs.cpSync(apiSrcDir, apiDestDir, { recursive: true });
  console.log('✅ Funções serverless copiadas!');
}

// Otimiza HTML (remove comentários)
const indexHtmlPath = path.join(distDir, 'index.html');
if (fs.existsSync(indexHtmlPath)) {
  let html = fs.readFileSync(indexHtmlPath, 'utf8');
  html = html.replace(/<!--.*?-->/gs, '');
  fs.writeFileSync(indexHtmlPath, html, 'utf8');
  console.log('✅ HTML otimizado (comentários removidos)');
}

console.log('✅ Build concluído em ./dist/');
