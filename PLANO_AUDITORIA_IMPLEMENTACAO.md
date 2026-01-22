# 🎯 Plano de Auditoria e Implementação por Fases

Baseado na análise recebida, vou estruturar um plano de ação prático e auditável em fases priorizadas.

---

## 📋 FASE 1: SEGURANÇA CRÍTICA (Prioridade Máxima)

**Prazo sugerido: 1-2 semanas**

### Checklist de Auditoria

-  [ ] **XSS - Cross-Site Scripting**
  -  [ ] Auditar todos os `innerHTML` no projeto
  -  [ ] Mapear handlers inline (`onclick`, `onmouseover`, `onmouseout`)
  -  [ ] Listar inputs que recebem dados do usuário

### Tarefas de Implementação

#### 1.1 Eliminar `innerHTML` com dados dinâmicos

```javascript
// Arquivo: wallet.js (linhas 172, 185, 200, 1143)
// Arquivo: desktop.js (linha 586)

// ANTES (❌ Vulnerável)
element.innerHTML = userData;

// DEPOIS (✅ Seguro)
element.textContent = userData;
// OU se precisar de HTML seguro:
import DOMPurify from 'dompurify';
element.innerHTML = DOMPurify.sanitize(userData);
```

#### 1.2 Remover handlers inline

```javascript
// Arquivo: index.html (linhas 198-199, 295, 127, 144)

// ANTES (❌)
// <button onclick="window.WalletManager?.toggle()">

// DEPOIS (✅)
// HTML:
// <button id="wallet-toggle">

// JavaScript:
document.getElementById('wallet-toggle')?.addEventListener('click', () => {
  window.WalletManager?.toggle();
});
```

#### 1.3 Implementar CSP (Content Security Policy)

```html
<!-- Adicionar no index.html -->
<meta http-equiv="Content-Security-Policy" 
      content="default-src 'self'; 
               script-src 'self'; 
               style-src 'self' 'unsafe-inline'; 
               img-src 'self' data: https:;">
```

### Métricas de Sucesso Fase 1

-  ✅ Zero `innerHTML` com dados não sanitizados
-  ✅ Zero handlers inline no HTML
-  ✅ CSP implementado sem erros de console
-  ✅ Teste manual: tentar injetar `<script>alert('XSS')</script>` em todos os inputs

---

## 🔧 FASE 2: CORREÇÃO DE BUGS CRÍTICOS

**Prazo sugerido: 1 semana**

### Checklist de Auditoria

-  [ ] **Memory Leaks**
  -  [ ] Listar todos os `setInterval` e `addEventListener`
  -  [ ] Verificar se há `clearInterval` e `removeEventListener` correspondentes

-  [ ] **Race Conditions**
  -  [ ] Identificar funções async sem proteção de concorrência
  -  [ ] Verificar formulários que podem ser submetidos múltiplas vezes

### Tarefas de Implementação

#### 2.1 Corrigir Memory Leaks

```javascript
// Arquivo: app.js (linhas 15-26)
// Arquivo: desktop.js (linhas 163-168)

class App {
  constructor() {
    this.intervals = [];
    this.listeners = [];
  }
  
  init() {
    // Registrar interval
    const intervalId = setInterval(() => {
      this.checkConnection();
    }, 30000);
    this.intervals.push(intervalId);
    
    // Registrar listener
    const resizeHandler = () => this.handleResize();
    window.addEventListener('resize', resizeHandler);
    this.listeners.push({ element: window, event: 'resize', handler: resizeHandler });
    
    // Cleanup
    window.addEventListener('beforeunload', () => this.cleanup());
  }
  
  cleanup() {
    // Limpar intervals
    this.intervals.forEach(id => clearInterval(id));
    this.intervals = [];
    
    // Limpar listeners
    this.listeners.forEach(({ element, event, handler }) => {
      element.removeEventListener(event, handler);
    });
    this.listeners = [];
  }
}
```

#### 2.2 Prevenir Race Conditions

```javascript
// Arquivo: form-validator.js (linha 337)

class FormValidator {
  constructor() {
    this.isSubmitting = false;
    this.submitPromise = null;
  }
  
  async handleSubmit(e) {
    e.preventDefault();
    
    // Prevenir múltiplas submissões
    if (this.isSubmitting) {
      return this.submitPromise; // Retorna a promise em andamento
    }
    
    this.isSubmitting = true;
    
    this.submitPromise = (async () => {
      try {
        await this.validateAndSubmit();
      } finally {
        this.isSubmitting = false;
        this.submitPromise = null;
      }
    })();
    
    return this.submitPromise;
  }
}
```

### Métricas de Sucesso Fase 2

-  ✅ Usar DevTools Memory Profiler: sem crescimento de memória após 5min de uso
-  ✅ Teste: clicar 10x rapidamente no botão de submit → apenas 1 requisição
-  ✅ Console sem warnings de listeners não removidos

---

## ⚡ FASE 3: PERFORMANCE INICIAL

**Prazo sugerido: 1-2 semanas**

### Checklist de Auditoria

-  [ ] Rodar Lighthouse e registrar scores atuais
-  [ ] Identificar recursos bloqueantes no carregamento
-  [ ] Mapear imagens sem lazy loading

### Tarefas de Implementação

#### 3.1 Otimizar Carregamento de Scripts

```html
<!-- index.html -->

<!-- ❌ ANTES: Bloqueante -->
<script src="js/app.js"></script>

<!-- ✅ DEPOIS -->
<script src="js/app.js" defer></script>
<script src="js/analytics.js" async></script>
```

#### 3.2 Implementar Lazy Loading de Imagens

```html
<!-- ❌ ANTES -->
<img src="large-image.jpg" alt="Description">

<!-- ✅ DEPOIS -->
<img src="large-image.jpg" 
     loading="lazy" 
     decoding="async" 
     alt="Description">
```

#### 3.3 Otimizar Event Listeners

```javascript
// Criar utilitário de throttle
// Arquivo: js/utils/performance.js

export function throttle(func, wait) {
  let timeout;
  let previous = 0;
  
  return function executedFunction(...args) {
    const now = Date.now();
    const remaining = wait - (now - previous);
    
    if (remaining <= 0) {
      if (timeout) {
        clearTimeout(timeout);
        timeout = null;
      }
      previous = now;
      func.apply(this, args);
    } else if (!timeout) {
      timeout = setTimeout(() => {
        previous = Date.now();
        timeout = null;
        func.apply(this, args);
      }, remaining);
    }
  };
}

// Uso:
// Arquivo: desktop.js (linhas 163-168)
import { throttle } from './utils/performance.js';

const handleResize = throttle(() => {
  this.updateLayout();
}, 250);

window.addEventListener('resize', handleResize);
```

### Métricas de Sucesso Fase 3

-  ✅ Lighthouse Performance Score: > 80
-  ✅ First Contentful Paint: < 1.8s
-  ✅ Time to Interactive: < 3.8s
-  ✅ Total Bundle Size: redução de pelo menos 20%

---

## ♿ FASE 4: ACESSIBILIDADE

**Prazo sugerido: 1-2 semanas**

### Checklist de Auditoria

-  [ ] Rodar axe DevTools e listar todos os issues
-  [ ] Testar navegação 100% por teclado (sem mouse)
-  [ ] Testar com screen reader (NVDA ou VoiceOver)

### Tarefas de Implementação

#### 4.1 Adicionar ARIA Labels

```html
<!-- Arquivo: index.html -->

<!-- ❌ ANTES -->
<button class="menu-btn">
  <svg>...</svg>
</button>

<!-- ✅ DEPOIS -->
<button class="menu-btn" 
        aria-label="Abrir menu de navegação"
        aria-expanded="false">
  <svg aria-hidden="true">...</svg>
</button>
```

#### 4.2 Implementar Focus Trap em Modais

```javascript
// Arquivo: js/components/Modal.js

class Modal {
  constructor(element) {
    this.element = element;
    this.focusableElements = null;
    this.firstFocusable = null;
    this.lastFocusable = null;
  }
  
  open() {
    this.element.classList.add('active');
    this.previousFocus = document.activeElement;
    
    // Capturar elementos focáveis
    this.focusableElements = this.element.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    this.firstFocusable = this.focusableElements[0];
    this.lastFocusable = this.focusableElements[this.focusableElements.length - 1];
    
    // Focar primeiro elemento
    this.firstFocusable?.focus();
    
    // Trap focus
    this.element.addEventListener('keydown', this.handleKeyDown.bind(this));
  }
  
  handleKeyDown(e) {
    if (e.key === 'Tab') {
      if (e.shiftKey) {
        if (document.activeElement === this.firstFocusable) {
          e.preventDefault();
          this.lastFocusable?.focus();
        }
      } else {
        if (document.activeElement === this.lastFocusable) {
          e.preventDefault();
          this.firstFocusable?.focus();
        }
      }
    }
    
    if (e.key === 'Escape') {
      this.close();
    }
  }
  
  close() {
    this.element.classList.remove('active');
    this.previousFocus?.focus();
    this.element.removeEventListener('keydown', this.handleKeyDown);
  }
}
```

#### 4.3 Melhorar Mensagens de Erro em Formulários

```html
<!-- ❌ ANTES -->
<input type="email" id="email">
<span class="error">Email inválido</span>

<!-- ✅ DEPOIS -->
<label for="email">Email</label>
<input type="email" 
       id="email" 
       aria-describedby="email-error"
       aria-invalid="true">
<span id="email-error" 
      class="error" 
      role="alert" 
      aria-live="polite">
  Email inválido. Use o formato: exemplo@dominio.com
</span>
```

### Métricas de Sucesso Fase 4

-  ✅ axe DevTools: 0 issues críticos
-  ✅ Lighthouse Accessibility Score: > 95
-  ✅ Navegação completa por teclado sem travar
-  ✅ Screen reader consegue entender toda a interface

---

## 🎨 FASE 5: REFATORAÇÃO E PADRÕES

**Prazo sugerido: 2-3 semanas**

### Checklist de Auditoria

-  [ ] Identificar código duplicado (usar ferramenta como jscpd)
-  [ ] Listar funções com mais de 50 linhas
-  [ ] Verificar `console.log` em produção

### Tarefas de Implementação

#### 5.1 Extrair Constantes e Remover Magic Numbers

```javascript
// Criar arquivo: js/config/constants.js

export const TIMEOUTS = {
  CONNECTION_CHECK: 30000, // 30 segundos
  SESSION_TIMEOUT: 60000,  // 1 minuto
  DEBOUNCE_INPUT: 300,     // 300ms
  TOAST_DURATION: 3000,    // 3 segundos
};

export const BREAKPOINTS = {
  MOBILE: 768,
  TABLET: 1024,
  DESKTOP: 1440,
};

export const API = {
  BASE_URL: import.meta.env.VITE_API_URL || 'https://api.flowoff.com',
  TIMEOUT: 15000,
  RETRY_ATTEMPTS: 3,
};

// Uso:
// Arquivo: desktop.js (linha 74)
import { TIMEOUTS } from './config/constants.js';

setInterval(() => {
  this.checkConnection();
}, TIMEOUTS.CONNECTION_CHECK);
```

#### 5.2 Quebrar Funções Longas

```javascript
// Arquivo: form-validator.js
// ANTES: handleSubmit() com 118 linhas

// DEPOIS: Dividir em funções menores
class FormValidator {
  async handleSubmit(e) {
    e.preventDefault();
    
    if (!this.canSubmit()) return;
    
    const formData = this.collectFormData();
    const validationResult = await this.validateFormData(formData);
    
    if (!validationResult.isValid) {
      this.displayErrors(validationResult.errors);
      return;
    }
    
    await this.submitFormData(formData);
  }
  
  canSubmit() {
    return !this.isSubmitting;
  }
  
  collectFormData() {
    // Lógica de coleta
  }
  
  async validateFormData(data) {
    // Lógica de validação
  }
  
  displayErrors(errors) {
    // Lógica de exibição
  }
  
  async submitFormData(data) {
    // Lógica de envio
  }
}
```

#### 5.3 Implementar Logger Condicional

```javascript
// Arquivo: js/utils/logger.js

class Logger {
  constructor() {
    this.isDevelopment = import.meta.env.MODE === 'development';
  }
  
  log(...args) {
    if (this.isDevelopment) {
      console.log('[LOG]', ...args);
    }
  }
  
  error(...args) {
    // Erros sempre logam, mas podem enviar para serviço de monitoramento
    console.error('[ERROR]', ...args);
    this.sendToMonitoring('error', args);
  }
  
  warn(...args) {
    if (this.isDevelopment) {
      console.warn('[WARN]', ...args);
    }
  }
  
  sendToMonitoring(level, data) {
    // Enviar para Sentry, LogRocket, etc.
  }
}

export const logger = new Logger();

// Uso global:
window.Logger = logger;

// Substituir todos os console.log por:
// logger.log('mensagem');
```

#### 5.4 Eliminar Variáveis Globais

```javascript
// Criar arquivo: js/core/app-state.js

class AppState {
  constructor() {
    this.modules = new Map();
  }
  
  register(name, module) {
    this.modules.set(name, module);
  }
  
  get(name) {
    return this.modules.get(name);
  }
}

const appState = new AppState();

// Substituir:
// window.WalletManager = new WalletManager();
// window.go = (route) => {...};

// Por:
appState.register('wallet', new WalletManager());
appState.register('router', new Router());

export default appState;
```

### Métricas de Sucesso Fase 5

-  ✅ Código duplicado: < 5%
-  ✅ Funções com mais de 50 linhas: < 10%
-  ✅ Zero `console.log` em produção
-  ✅ ESLint: 0 warnings

---

## 📊 FASE 6: MONITORAMENTO E TESTES

**Prazo sugerido: 2 semanas**

### Tarefas de Implementação

#### 6.1 Configurar Testes Unitários

```javascript
// Arquivo: tests/validators.test.js

import { describe, it, expect } from 'vitest';
import { validateEmail, validateCPF } from '../js/utils/validation.js';

describe('Validação de Email', () => {
  it('deve validar emails corretos', () => {
    expect(validateEmail('test@example.com')).toBe(true);
    expect(validateEmail('user+tag@domain.co')).toBe(true);
  });
  
  it('deve rejeitar emails inválidos', () => {
    expect(validateEmail('invalid')).toBe(false);
    expect(validateEmail('@example.com')).toBe(false);
    expect(validateEmail('test@')).toBe(false);
  });
});

describe('Validação de CPF', () => {
  it('deve validar CPFs corretos', () => {
    expect(validateCPF('123.456.789-09')).toBe(true);
  });
  
  it('deve rejeitar CPFs inválidos', () => {
    expect(validateCPF('000.000.000-00')).toBe(false);
    expect(validateCPF('123')).toBe(false);
  });
});
```

#### 6.2 Implementar Monitoramento de Performance

```javascript
// Arquivo: js/utils/performance-monitor.js

class PerformanceMonitor {
  constructor() {
    this.metrics = {};
  }
  
  measurePageLoad() {
    if (window.performance && window.performance.timing) {
      const timing = window.performance.timing;
      
      this.metrics = {
        dns: timing.domainLookupEnd - timing.domainLookupStart,
        tcp: timing.connectEnd - timing.connectStart,
        request: timing.responseStart - timing.requestStart,
        response: timing.responseEnd - timing.responseStart,
        dom: timing.domComplete - timing.domLoading,
        total: timing.loadEventEnd - timing.navigationStart,
      };
      
      this.sendMetrics();
    }
  }
  
  sendMetrics() {
    // Enviar para analytics
    console.log('Performance Metrics:', this.metrics);
  }
}

// Inicializar
window.addEventListener('load', () => {
  const monitor = new PerformanceMonitor();
  monitor.measurePageLoad();
});
```

### Métricas de Sucesso Fase 6

-  ✅ Cobertura de testes: > 70% nas funções críticas
-  ✅ Todos os testes passando
-  ✅ Performance tracking ativo

---

## 🎯 PRÓXIMOS PASSOS IMEDIATOS

1.  **Criar branch de trabalho**:
   ```bash
   git checkout -b refactor/security-phase-1
   ```

2.  **Começar pela Fase 1** (segurança é crítica)

3.  **Usar checklist diário**: Marque itens concluídos no `PROGRESS.md`

4.  **Fazer commits atômicos**:
   ```bash
   git commit -m "fix(security): remove innerHTML from wallet.js line 172"
   ```

5.  **Revisar antes de merge**: Cada fase deve ter PR separado

---

**Última atualização**: 2025-01-27  
**Versão**: 1.0.0
