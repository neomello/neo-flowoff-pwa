#!/usr/bin/env node

/**
 * Script de Análise de Código INTERBØX V2 - PWA Edition
 * Analisa o código real do projeto PWA e gera relatórios baseados no estado atual
 * Node validado do Protocolo NΞØ
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cores para output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  purple: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  orange: '\x1b[33m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

// Configurações específicas para PWA
const CONFIG = {
  srcDir: '.',
  publicDir: './public',
  excludeDirs: ['node_modules', 'dist', '.git', 'coverage', '.cursor'],
  fileExtensions: ['.html', '.css', '.js', '.json', '.png', '.svg', '.webmanifest'],
  maxFileSize: 1000, // linhas
  maxFunctionLength: 50, // linhas
  maxComponentLength: 200, // linhas
  pwaFiles: ['index.html', 'styles.css', 'app.js', 'manifest.webmanifest', 'sw.js']
};

class PWACodeAnalyzer {
  constructor() {
    this.stats = {
      files: {
        total: 0,
        byType: {},
        bySize: { small: 0, medium: 0, large: 0, xlarge: 0 },
        pwa: { total: 0, missing: [] }
      },
      html: {
        total: 0,
        withMeta: 0,
        withManifest: 0,
        withServiceWorker: 0,
        withViewport: 0,
        withThemeColor: 0,
        accessibility: { altTags: 0, ariaLabels: 0, semanticTags: 0 }
      },
      css: {
        total: 0,
        customProperties: 0,
        mediaQueries: 0,
        animations: 0,
        gridUsage: 0,
        flexboxUsage: 0,
        pwaSpecific: { safeArea: 0, backdropFilter: 0, webkitPrefixes: 0 }
      },
      js: {
        total: 0,
        functions: 0,
        withJSDoc: 0,
        serviceWorker: 0,
        pwaFeatures: { offline: 0, install: 0, cache: 0, notifications: 0 }
      },
      manifest: {
        exists: false,
        valid: false,
        icons: 0,
        display: '',
        themeColor: '',
        backgroundColor: ''
      },
      serviceWorker: {
        exists: false,
        cacheStrategy: '',
        offlineSupport: false,
        updateStrategy: ''
      },
      performance: {
        totalSize: 0,
        images: { total: 0, optimized: 0, webp: 0 },
        scripts: { total: 0, minified: 0, es6: 0 },
        styles: { total: 0, minified: 0, critical: 0 }
      },
      issues: {
        pwa: [],
        performance: [],
        accessibility: [],
        security: [],
        structure: []
      }
    };
  }

  // Utilitários
  log(message, color = 'white') {
    console.log(`${colors[color]}${message}${colors.reset}`);
  }

  logSection(title) {
    console.log(`\n${colors.cyan}${colors.bold}${title}${colors.reset}`);
    console.log(`${colors.yellow}${'='.repeat(title.length)}${colors.reset}`);
  }

  logSuccess(message) {
    this.log(`✓ ${message}`, 'green');
  }

  logWarning(message) {
    this.log(`⚠ ${message}`, 'yellow');
  }

  logError(message) {
    this.log(`✗ ${message}`, 'red');
  }

  // Análise de arquivos
  getAllFiles(dir, files = []) {
    if (!fs.existsSync(dir)) return files;
    
    const items = fs.readdirSync(dir);
    
    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        if (!CONFIG.excludeDirs.includes(item)) {
          this.getAllFiles(fullPath, files);
        }
      } else if (CONFIG.fileExtensions.some(ext => item.endsWith(ext))) {
        files.push(fullPath);
      }
    }
    
    return files;
  }

  analyzeFile(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const lines = content.split('\n');
      const fileName = path.basename(filePath);
      const fileType = path.extname(filePath);
      const fileSize = fs.statSync(filePath).size;
      
      this.stats.files.total++;
      this.stats.performance.totalSize += fileSize;
      
      // Contar por tipo
      this.stats.files.byType[fileType] = (this.stats.files.byType[fileType] || 0) + 1;
      
      // Classificar por tamanho
      if (lines.length < 50) this.stats.files.bySize.small++;
      else if (lines.length < 200) this.stats.files.bySize.medium++;
      else if (lines.length < 500) this.stats.files.bySize.large++;
      else this.stats.files.bySize.xlarge++;
      
      // Verificar se é arquivo PWA essencial
      if (CONFIG.pwaFiles.includes(fileName)) {
        this.stats.files.pwa.total++;
      }
      
      // Análise específica por tipo
      if (fileType === '.html') {
        this.analyzeHTML(content, filePath, lines.length);
      } else if (fileType === '.css') {
        this.analyzeCSS(content, filePath, lines.length);
      } else if (fileType === '.js') {
        this.analyzeJavaScript(content, filePath, lines.length);
      } else if (fileName === 'manifest.webmanifest') {
        this.analyzeManifest(content, filePath);
      } else if (fileName === 'sw.js') {
        this.analyzeServiceWorker(content, filePath);
      } else if (fileType === '.png' || fileType === '.svg') {
        this.analyzeImage(filePath, fileSize);
      }
      
      // Análise de problemas
      this.analyzeIssues(content, filePath, lines.length, fileType);
      
    } catch (error) {
      this.logError(`Erro ao analisar ${filePath}: ${error.message}`);
    }
  }

  analyzeHTML(content, filePath, lineCount) {
    this.stats.html.total++;
    
    // Verificar meta tags PWA
    if (content.includes('<meta name="viewport"')) this.stats.html.withViewport++;
    if (content.includes('<meta name="theme-color"')) this.stats.html.withThemeColor++;
    if (content.includes('<link rel="manifest"')) this.stats.html.withManifest++;
    if (content.includes('serviceWorker')) this.stats.html.withServiceWorker++;
    
    // Verificar acessibilidade
    const altTags = (content.match(/alt\s*=/g) || []).length;
    const ariaLabels = (content.match(/aria-label\s*=/g) || []).length;
    const semanticTags = (content.match(/<(main|nav|header|footer|section|article|aside)/g) || []).length;
    
    this.stats.html.accessibility.altTags += altTags;
    this.stats.html.accessibility.ariaLabels += ariaLabels;
    this.stats.html.accessibility.semanticTags += semanticTags;
    
    // Verificar estrutura PWA
    if (!content.includes('manifest.webmanifest')) {
      this.stats.issues.pwa.push({
        file: filePath,
        issue: 'Manifest não referenciado',
        suggestion: 'Adicione <link rel="manifest" href="manifest.webmanifest">'
      });
    }
    
    // Verificar se há script que carrega app.js (pode ser js/app.js)
    const hasAppJs = content.match(/<script[^>]*src\s*=\s*["'][^"']*app\.js/i);
    // Verificar se há script que registra serviceWorker (pode estar no JS externo)
    const hasServiceWorkerScript = content.match(/<script[^>]*src\s*=\s*["'][^"']*(app\.js|index-scripts\.js)/i);
    
    // Service Worker pode estar registrado no JavaScript externo, não precisa estar no HTML
    // Apenas reporta erro se não há nenhum script que possa registrar o SW
    if (!content.includes('serviceWorker') && !hasServiceWorkerScript) {
      this.stats.issues.pwa.push({
        file: filePath,
        issue: 'Service Worker não registrado',
        suggestion: 'Adicione registro do service worker no JavaScript'
      });
    }
  }

  analyzeCSS(content, filePath, lineCount) {
    this.stats.css.total++;
    
    // Verificar custom properties
    const customProps = (content.match(/--[a-zA-Z-]+:/g) || []).length;
    this.stats.css.customProperties += customProps;
    
    // Verificar media queries
    const mediaQueries = (content.match(/@media/g) || []).length;
    this.stats.css.mediaQueries += mediaQueries;
    
    // Verificar animações
    const animations = (content.match(/@keyframes|animation:/g) || []).length;
    this.stats.css.animations += animations;
    
    // Verificar Grid e Flexbox
    if (content.includes('display: grid') || content.includes('display:grid')) {
      this.stats.css.gridUsage++;
    }
    if (content.includes('display: flex') || content.includes('display:flex')) {
      this.stats.css.flexboxUsage++;
    }
    
    // Verificar recursos PWA específicos
    if (content.includes('env(safe-area-inset')) this.stats.css.pwaSpecific.safeArea++;
    if (content.includes('backdrop-filter')) this.stats.css.pwaSpecific.backdropFilter++;
    if (content.includes('-webkit-')) this.stats.css.pwaSpecific.webkitPrefixes++;
    
    // Verificar responsividade
    if (mediaQueries === 0 && lineCount > 50) {
      this.stats.issues.performance.push({
        file: filePath,
        issue: 'CSS sem media queries para responsividade',
        suggestion: 'Adicione breakpoints para diferentes tamanhos de tela'
      });
    }
  }

  analyzeJavaScript(content, filePath, lineCount) {
    this.stats.js.total++;
    
    // Contar funções
    const functions = (content.match(/function\s+\w+|const\s+\w+\s*=\s*\(/g) || []).length;
    this.stats.js.functions += functions;
    
    // Verificar JSDoc
    const jsdocMatches = (content.match(/\/\*\*[\s\S]*?\*\//g) || []).length;
    this.stats.js.withJSDoc += jsdocMatches.length;
    
    // Verificar recursos PWA
    if (content.includes('serviceWorker')) this.stats.js.pwaFeatures.offline++;
    if (content.includes('beforeinstallprompt')) this.stats.js.pwaFeatures.install++;
    if (content.includes('caches')) this.stats.js.pwaFeatures.cache++;
    if (content.includes('Notification')) this.stats.js.pwaFeatures.notifications++;
    
    // Verificar se é service worker
    if (filePath.endsWith('sw.js')) {
      this.stats.serviceWorker.exists = true;
      this.analyzeServiceWorker(content, filePath);
    }
    
    // Verificar problemas de performance
    if (content.includes('console.log') && !filePath.includes('test')) {
      this.stats.issues.performance.push({
        file: filePath,
        issue: 'console.log em produção',
        suggestion: 'Remova console.logs para produção'
      });
    }
  }

  analyzeManifest(content, filePath) {
    this.stats.manifest.exists = true;
    
    try {
      const manifest = JSON.parse(content);
      this.stats.manifest.valid = true;
      
      this.stats.manifest.icons = manifest.icons ? manifest.icons.length : 0;
      this.stats.manifest.display = manifest.display || '';
      this.stats.manifest.themeColor = manifest.theme_color || '';
      this.stats.manifest.backgroundColor = manifest.background_color || '';
      
      // Verificar campos obrigatórios
      if (!manifest.name) {
        this.stats.issues.pwa.push({
          file: filePath,
          issue: 'Manifest sem campo "name"',
          suggestion: 'Adicione o campo "name" obrigatório'
        });
      }
      
      if (!manifest.icons || manifest.icons.length === 0) {
        this.stats.issues.pwa.push({
          file: filePath,
          issue: 'Manifest sem ícones',
          suggestion: 'Adicione pelo menos um ícone 192x192 e 512x512'
        });
      }
      
    } catch (error) {
      this.stats.issues.pwa.push({
        file: filePath,
        issue: 'Manifest JSON inválido',
        suggestion: 'Corrija a sintaxe JSON do manifest'
      });
    }
  }

  analyzeServiceWorker(content, filePath) {
    this.stats.serviceWorker.exists = true;
    
    // Verificar estratégia de cache
    if (content.includes('cache-first')) this.stats.serviceWorker.cacheStrategy = 'cache-first';
    else if (content.includes('network-first')) this.stats.serviceWorker.cacheStrategy = 'network-first';
    else if (content.includes('stale-while-revalidate')) this.stats.serviceWorker.cacheStrategy = 'stale-while-revalidate';
    
    // Verificar suporte offline
    if (content.includes('offline') || content.includes('fetch')) {
      this.stats.serviceWorker.offlineSupport = true;
    }
    
    // Verificar estratégia de atualização
    if (content.includes('skipWaiting')) this.stats.serviceWorker.updateStrategy = 'skipWaiting';
    else if (content.includes('clients.claim')) this.stats.serviceWorker.updateStrategy = 'clients.claim';
  }

  analyzeImage(filePath, fileSize) {
    this.stats.performance.images.total++;
    
    // Verificar se é otimizado (tamanho razoável)
    if (fileSize < 100000) { // < 100KB
      this.stats.performance.images.optimized++;
    }
    
    // Verificar formato
    if (filePath.endsWith('.webp')) {
      this.stats.performance.images.webp++;
    }
  }

  analyzeIssues(content, filePath, lineCount, fileType) {
    // Problemas de nomenclatura
    const fileName = path.basename(filePath);
    
    if (fileType === '.js' && !fileName.match(/^[a-z][a-zA-Z0-9-]*\.js$/)) {
      this.stats.issues.structure.push({
        file: filePath,
        issue: 'Nome de arquivo JS não segue kebab-case',
        suggestion: 'Use kebab-case para arquivos JS (ex: app-main.js)'
      });
    }
    
    // Problemas de segurança
    if (content.includes('innerHTML') && !content.includes('textContent')) {
      this.stats.issues.security.push({
        file: filePath,
        issue: 'Uso de innerHTML sem sanitização',
        suggestion: 'Use textContent ou sanitize o HTML'
      });
    }
    
    // Problemas de acessibilidade
    if (fileType === '.html' && content.includes('<img') && !content.includes('alt=')) {
      this.stats.issues.accessibility.push({
        file: filePath,
        issue: 'Imagens sem atributo alt',
        suggestion: 'Adicione alt text para todas as imagens'
      });
    }
    
    // Problemas de estrutura
    if (lineCount > CONFIG.maxFileSize) {
      this.stats.issues.structure.push({
        file: filePath,
        issue: `Arquivo muito grande (${lineCount} linhas)`,
        suggestion: 'Considere quebrar em arquivos menores'
      });
    }
  }

  // Verificar arquivos PWA essenciais
  checkPWAFiles() {
    CONFIG.pwaFiles.forEach(file => {
      // Para app.js, verificar se existe na raiz OU em js/app.js
      if (file === 'app.js') {
        const existsInRoot = fs.existsSync(file);
        const existsInJs = fs.existsSync(`js/${file}`);
        if (!existsInRoot && !existsInJs) {
          this.stats.files.pwa.missing.push(file);
          this.stats.issues.pwa.push({
            file: file,
            issue: 'Arquivo PWA essencial ausente',
            suggestion: `Crie o arquivo ${file} ou js/${file}`
          });
        }
      } else {
        // Para outros arquivos, verificar normalmente
        if (!fs.existsSync(file)) {
          this.stats.files.pwa.missing.push(file);
          this.stats.issues.pwa.push({
            file: file,
            issue: 'Arquivo PWA essencial ausente',
            suggestion: `Crie o arquivo ${file}`
          });
        }
      }
    });
  }

  // Relatórios
  generateReport() {
    this.logSection('📊 ANÁLISE DE CÓDIGO PWA INTERBØX V2 2025');
    this.log('Node validado do Protocolo NΞØ executando análise...', 'purple');
    
    this.reportFiles();
    this.reportHTML();
    this.reportCSS();
    this.reportJavaScript();
    this.reportPWA();
    this.reportPerformance();
    this.reportIssues();
    this.reportRecommendations();
  }

  reportFiles() {
    this.logSection('📁 ARQUIVOS');
    this.log(`Total de arquivos analisados: ${this.stats.files.total}`, 'white');
    
    this.log('\nPor tipo:', 'yellow');
    Object.entries(this.stats.files.byType).forEach(([type, count]) => {
      this.log(`  ${type}: ${count}`, 'cyan');
    });
    
    this.log('\nPor tamanho:', 'yellow');
    this.log(`  Pequenos (<50 linhas): ${this.stats.files.bySize.small}`, 'green');
    this.log(`  Médios (50-200 linhas): ${this.stats.files.bySize.medium}`, 'yellow');
    this.log(`  Grandes (200-500 linhas): ${this.stats.files.bySize.large}`, 'orange');
    this.log(`  Muito grandes (>500 linhas): ${this.stats.files.bySize.xlarge}`, 'red');
    
    this.log('\nArquivos PWA essenciais:', 'yellow');
    this.log(`  Presentes: ${this.stats.files.pwa.total}/${CONFIG.pwaFiles.length}`, 'green');
    if (this.stats.files.pwa.missing.length > 0) {
      this.log(`  Ausentes: ${this.stats.files.pwa.missing.join(', ')}`, 'red');
    }
  }

  reportHTML() {
    this.logSection('🌐 HTML');
    this.log(`Total de arquivos HTML: ${this.stats.html.total}`, 'white');
    this.log(`Com viewport: ${this.stats.html.withViewport}`, 'cyan');
    this.log(`Com theme-color: ${this.stats.html.withThemeColor}`, 'cyan');
    this.log(`Com manifest: ${this.stats.html.withManifest}`, 'cyan');
    this.log(`Com service worker: ${this.stats.html.withServiceWorker}`, 'cyan');
    
    this.log('\nAcessibilidade:', 'yellow');
    this.log(`  Alt tags: ${this.stats.html.accessibility.altTags}`, 'cyan');
    this.log(`  Aria labels: ${this.stats.html.accessibility.ariaLabels}`, 'cyan');
    this.log(`  Tags semânticas: ${this.stats.html.accessibility.semanticTags}`, 'cyan');
  }

  reportCSS() {
    this.logSection('🎨 CSS');
    this.log(`Total de arquivos CSS: ${this.stats.css.total}`, 'white');
    this.log(`Custom properties: ${this.stats.css.customProperties}`, 'cyan');
    this.log(`Media queries: ${this.stats.css.mediaQueries}`, 'cyan');
    this.log(`Animações: ${this.stats.css.animations}`, 'cyan');
    this.log(`Grid usage: ${this.stats.css.gridUsage}`, 'cyan');
    this.log(`Flexbox usage: ${this.stats.css.flexboxUsage}`, 'cyan');
    
    this.log('\nRecursos PWA:', 'yellow');
    this.log(`  Safe area: ${this.stats.css.pwaSpecific.safeArea}`, 'cyan');
    this.log(`  Backdrop filter: ${this.stats.css.pwaSpecific.backdropFilter}`, 'cyan');
    this.log(`  Webkit prefixes: ${this.stats.css.pwaSpecific.webkitPrefixes}`, 'cyan');
  }

  reportJavaScript() {
    this.logSection('⚡ JAVASCRIPT');
    this.log(`Total de arquivos JS: ${this.stats.js.total}`, 'white');
    this.log(`Funções: ${this.stats.js.functions}`, 'cyan');
    this.log(`Com JSDoc: ${this.stats.js.withJSDoc}`, 'cyan');
    
    const documentationRate = this.stats.js.functions > 0 
      ? ((this.stats.js.withJSDoc / this.stats.js.functions) * 100).toFixed(1)
      : 0;
    this.log(`Taxa de documentação: ${documentationRate}%`, 'yellow');
    
    this.log('\nRecursos PWA:', 'yellow');
    this.log(`  Offline support: ${this.stats.js.pwaFeatures.offline}`, 'cyan');
    this.log(`  Install prompt: ${this.stats.js.pwaFeatures.install}`, 'cyan');
    this.log(`  Cache strategy: ${this.stats.js.pwaFeatures.cache}`, 'cyan');
    this.log(`  Notifications: ${this.stats.js.pwaFeatures.notifications}`, 'cyan');
  }

  reportPWA() {
    this.logSection('📱 PWA FEATURES');
    
    this.log('Manifest:', 'yellow');
    this.log(`  Existe: ${this.stats.manifest.exists ? '✓' : '✗'}`, this.stats.manifest.exists ? 'green' : 'red');
    this.log(`  Válido: ${this.stats.manifest.valid ? '✓' : '✗'}`, this.stats.manifest.valid ? 'green' : 'red');
    this.log(`  Ícones: ${this.stats.manifest.icons}`, 'cyan');
    this.log(`  Display: ${this.stats.manifest.display}`, 'cyan');
    this.log(`  Theme color: ${this.stats.manifest.themeColor}`, 'cyan');
    
    this.log('\nService Worker:', 'yellow');
    this.log(`  Existe: ${this.stats.serviceWorker.exists ? '✓' : '✗'}`, this.stats.serviceWorker.exists ? 'green' : 'red');
    this.log(`  Cache strategy: ${this.stats.serviceWorker.cacheStrategy}`, 'cyan');
    this.log(`  Offline support: ${this.stats.serviceWorker.offlineSupport ? '✓' : '✗'}`, this.stats.serviceWorker.offlineSupport ? 'green' : 'red');
    this.log(`  Update strategy: ${this.stats.serviceWorker.updateStrategy}`, 'cyan');
  }

  reportPerformance() {
    this.logSection('⚡ PERFORMANCE');
    
    const totalSizeKB = (this.stats.performance.totalSize / 1024).toFixed(2);
    this.log(`Tamanho total: ${totalSizeKB} KB`, 'white');
    
    this.log('\nImagens:', 'yellow');
    this.log(`  Total: ${this.stats.performance.images.total}`, 'cyan');
    this.log(`  Otimizadas: ${this.stats.performance.images.optimized}`, 'cyan');
    this.log(`  WebP: ${this.stats.performance.images.webp}`, 'cyan');
    
    const optimizationRate = this.stats.performance.images.total > 0 
      ? ((this.stats.performance.images.optimized / this.stats.performance.images.total) * 100).toFixed(1)
      : 0;
    this.log(`  Taxa de otimização: ${optimizationRate}%`, 'yellow');
  }

  reportIssues() {
    const totalIssues = this.stats.issues.pwa.length + 
                       this.stats.issues.performance.length + 
                       this.stats.issues.accessibility.length + 
                       this.stats.issues.security.length + 
                       this.stats.issues.structure.length;
    
    this.logSection('⚠️ PROBLEMAS ENCONTRADOS');
    this.log(`Total: ${totalIssues}`, totalIssues > 0 ? 'red' : 'green');
    
    if (this.stats.issues.pwa.length > 0) {
      this.log(`\nPWA (${this.stats.issues.pwa.length}):`, 'yellow');
      this.stats.issues.pwa.forEach(issue => {
        this.log(`  ${issue.file}: ${issue.issue}`, 'red');
        this.log(`    → ${issue.suggestion}`, 'cyan');
      });
    }
    
    if (this.stats.issues.performance.length > 0) {
      this.log(`\nPerformance (${this.stats.issues.performance.length}):`, 'yellow');
      this.stats.issues.performance.forEach(issue => {
        this.log(`  ${issue.file}: ${issue.issue}`, 'red');
        this.log(`    → ${issue.suggestion}`, 'cyan');
      });
    }
    
    if (this.stats.issues.accessibility.length > 0) {
      this.log(`\nAcessibilidade (${this.stats.issues.accessibility.length}):`, 'yellow');
      this.stats.issues.accessibility.forEach(issue => {
        this.log(`  ${issue.file}: ${issue.issue}`, 'red');
        this.log(`    → ${issue.suggestion}`, 'cyan');
      });
    }
    
    if (this.stats.issues.security.length > 0) {
      this.log(`\nSegurança (${this.stats.issues.security.length}):`, 'yellow');
      this.stats.issues.security.forEach(issue => {
        this.log(`  ${issue.file}: ${issue.issue}`, 'red');
        this.log(`    → ${issue.suggestion}`, 'cyan');
      });
    }
    
    if (this.stats.issues.structure.length > 0) {
      this.log(`\nEstrutura (${this.stats.issues.structure.length}):`, 'yellow');
      this.stats.issues.structure.forEach(issue => {
        this.log(`  ${issue.file}: ${issue.issue}`, 'red');
        this.log(`    → ${issue.suggestion}`, 'cyan');
      });
    }
  }

  reportRecommendations() {
    this.logSection('💡 RECOMENDAÇÕES PWA');
    
    const recommendations = [];
    
    // Recomendações PWA
    if (!this.stats.manifest.exists) {
      recommendations.push('Crie um manifest.webmanifest para funcionalidade PWA completa');
    }
    
    if (!this.stats.serviceWorker.exists) {
      recommendations.push('Implemente um service worker para cache e funcionalidade offline');
    }
    
    if (this.stats.html.withViewport === 0) {
      recommendations.push('Adicione meta viewport para responsividade mobile');
    }
    
    if (this.stats.html.withThemeColor === 0) {
      recommendations.push('Adicione meta theme-color para personalização do browser');
    }
    
    // Recomendações de performance
    if (this.stats.performance.images.optimized < this.stats.performance.images.total * 0.8) {
      recommendations.push('Otimize imagens para melhor performance');
    }
    
    if (this.stats.css.mediaQueries === 0) {
      recommendations.push('Adicione media queries para responsividade');
    }
    
    // Recomendações de acessibilidade
    if (this.stats.html.accessibility.altTags === 0 && this.stats.performance.images.total > 0) {
      recommendations.push('Adicione alt text para todas as imagens');
    }
    
    if (this.stats.html.accessibility.semanticTags < 3) {
      recommendations.push('Use mais tags semânticas (main, nav, header, footer)');
    }
    
    if (recommendations.length === 0) {
      this.log('🎉 Excelente! Sua PWA está seguindo as melhores práticas.', 'green');
    } else {
      recommendations.forEach((rec, index) => {
        this.log(`${index + 1}. ${rec}`, 'yellow');
      });
    }
    
    this.log('\n🔗 Recursos úteis:', 'purple');
    this.log('  • PWA Checklist: https://web.dev/pwa-checklist/', 'cyan');
    this.log('  • Lighthouse PWA Audit: https://developers.google.com/web/tools/lighthouse', 'cyan');
    this.log('  • Web App Manifest: https://developer.mozilla.org/en-US/docs/Web/Manifest', 'cyan');
  }

  // Executar análise
  async run() {
    this.log('🔍 Iniciando análise de código PWA...', 'blue');
    
    // Verificar arquivos PWA essenciais
    this.checkPWAFiles();
    
    // Analisar todos os arquivos
    const allFiles = this.getAllFiles(CONFIG.srcDir);
    this.log(`Analisando ${allFiles.length} arquivos...`, 'yellow');
    allFiles.forEach(file => this.analyzeFile(file));
    
    this.logSuccess('Análise concluída!');
    this.generateReport();
  }
}

// Executar se chamado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  const analyzer = new PWACodeAnalyzer();
  analyzer.run().catch(console.error);
}

export default PWACodeAnalyzer;
