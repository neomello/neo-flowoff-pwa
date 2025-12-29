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
      stdio: 'inherit'
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
  'sw.js'
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
  'styles.css',
  // app.js na raiz não precisa ser copiado (é apenas wrapper)
  'manifest.webmanifest',
  'sw.js',
  'favicon.ico',
  'glass-morphism-bottom-bar.css',
  'bento-grid.css',
  // SEO e PWA
  'sitemap.xml',
  'robots.txt',
  // Documentação (se existir)
  'WALLET-AUTH-FLOW.md'
];

for (const file of filesToCopy) {
  const srcPath = path.join(rootDir, file);
  const destPath = path.join(distDir, file);
  if (fs.existsSync(srcPath)) {
    fs.copyFileSync(srcPath, destPath);
  }
}

// Copia pasta js/
const jsSrcDir = path.join(rootDir, 'js');
const jsDestDir = path.join(distDir, 'js');
if (fs.existsSync(jsSrcDir)) {
  if (!fs.existsSync(jsDestDir)) {
    fs.mkdirSync(jsDestDir, { recursive: true });
  }
  const jsFiles = fs.readdirSync(jsSrcDir);
  for (const file of jsFiles) {
    const srcPath = path.join(jsSrcDir, file);
        const destPath = path.join(jsDestDir, file);
    if (fs.statSync(srcPath).isFile()) {
      fs.copyFileSync(srcPath, destPath);
    }
  }
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

// Otimiza HTML (remove comentários) e injeta API keys do Netlify
const indexHtmlPath = path.join(distDir, 'index.html');
if (fs.existsSync(indexHtmlPath)) {
  let html = fs.readFileSync(indexHtmlPath, 'utf8');
  html = html.replace(/<!--.*?-->/gs, '');
  
  // Injeta API key do Netlify (variáveis de ambiente) no window.APP_CONFIG
  // Isso permite chamadas client-side sem usar Netlify Functions
  const apiKeys = {
    GOOGLE_API_KEY: process.env.GOOGLE_API_KEY || '',
    GEMINI_MODEL: process.env.GEMINI_MODEL || process.env.LLM_MODEL || 'gemini-2.0-flash-exp'
  };
  
  // Substitui o script de configuração com a key injetada
  const configScript = `
  <!-- Configuração de API Key para Chat AI (Client-Side) -->
  <!-- Key injetada no build via variáveis de ambiente do Netlify -->
  <script>
    window.APP_CONFIG = window.APP_CONFIG || {};
    window.APP_CONFIG.GOOGLE_API_KEY = ${JSON.stringify(apiKeys.GOOGLE_API_KEY)};
    window.APP_CONFIG.GEMINI_MODEL = ${JSON.stringify(apiKeys.GEMINI_MODEL)};
    window.APP_CONFIG.LLM_MODEL = ${JSON.stringify(apiKeys.GEMINI_MODEL)};
  </script>`;
  
  // Substitui o placeholder ou adiciona antes do chat-ai.js
  if (html.includes('<!-- Configuração de API Keys para Chat AI')) {
    // Substitui o bloco existente
    html = html.replace(
      /<!-- Configuração de API Keys para Chat AI[^]*?<\/script>/s,
      configScript
    );
  } else {
    // Adiciona antes do chat-ai.js
    const chatAiScriptMatch = html.match(/(<script src="js\/chat-ai\.js[^>]*><\/script>)/);
    if (chatAiScriptMatch) {
      html = html.replace(
        /(<script src="js\/chat-ai\.js[^>]*><\/script>)/,
        configScript + '\n$1'
      );
    } else {
      // Se não encontrar, adicionar antes do fechamento do body
      html = html.replace(/<\/body>/, configScript + '\n</body>');
    }
  }
  
  fs.writeFileSync(indexHtmlPath, html, 'utf8');
  console.log('✅ API keys injetadas no build (client-side mode)');
}

console.log('✅ Build concluído em ./dist/');
