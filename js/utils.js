/**
 * Utilitários de Segurança e Sanitização
 * Previne XSS e valida entradas
 */

// Sanitiza HTML para prevenir XSS
function sanitizeHTML(str) {
  if (typeof str !== 'string') return '';

  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// Valida endereço Ethereum/Base
function isValidEthereumAddress(address) {
  if (!address || typeof address !== 'string') return false;

  // Formato: 0x seguido de 40 caracteres hexadecimais
  const ethAddressRegex = /^0x[a-fA-F0-9]{40}$/;
  return ethAddressRegex.test(address);
}

// Valida email de forma robusta
function isValidEmail(email) {
  if (!email || typeof email !== 'string') return false;

  // Regex mais rigoroso
  const emailRegex =
    /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

  if (!emailRegex.test(email)) return false;

  // Validações adicionais
  const parts = email.split('@');
  if (parts.length !== 2) return false;

  const [local, domain] = parts;

  // Local part não pode ser vazio ou muito longo
  if (!local || local.length > 64) return false;

  // Domain não pode ser vazio ou muito longo
  if (!domain || domain.length > 255) return false;

  // Domain deve ter pelo menos um ponto
  if (!domain.includes('.')) return false;

  // Domain não pode começar ou terminar com ponto ou hífen
  if (
    domain.startsWith('.') ||
    domain.endsWith('.') ||
    domain.startsWith('-') ||
    domain.endsWith('-')
  )
    return false;

  return true;
}

// Valida e sanitiza entrada de usuário
function sanitizeInput(input, type = 'text') {
  if (input === null || input === undefined) return '';

  const str = String(input).trim();

  switch (type) {
    case 'email':
      return isValidEmail(str) ? str.toLowerCase() : '';
    case 'address':
      return isValidEthereumAddress(str) ? str : '';
    case 'number':
      const num = parseFloat(str);
      return isNaN(num) ? '' : String(num);
    case 'text':
    default:
      return sanitizeHTML(str);
  }
}

// Cria elemento DOM de forma segura
function createSafeElement(tag, attributes = {}, textContent = '') {
  const element = document.createElement(tag);

  // Aplica atributos permitidos
  const allowedAttributes = [
    'id',
    'class',
    'type',
    'href',
    'src',
    'alt',
    'title',
    'aria-label',
    'role',
    'data-route',
  ];

  Object.entries(attributes).forEach(([key, value]) => {
    if (
      allowedAttributes.includes(key) ||
      key.startsWith('data-') ||
      key.startsWith('aria-')
    ) {
      element.setAttribute(key, sanitizeHTML(String(value)));
    }
  });

  // Define conteúdo de texto de forma segura
  if (textContent) {
    element.textContent = textContent;
  }

  return element;
}

// Substitui innerHTML de forma segura
function setSafeHTML(element, html) {
  if (!element || !(element instanceof Element)) return;

  // Limpa o elemento
  element.textContent = '';

  // Cria um parser temporário
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  // Move nós de forma segura
  Array.from(doc.body.childNodes).forEach((node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      element.appendChild(document.createTextNode(node.textContent));
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      // Sanitiza atributos perigosos
      Array.from(node.attributes).forEach((attr) => {
        if (
          attr.name.startsWith('on') ||
          attr.name === 'javascript:' ||
          (attr.name === 'data:' && !attr.value.startsWith('data:image/'))
        ) {
          node.removeAttribute(attr.name);
        }
      });
      element.appendChild(node);
    }
  });
}

// Valida JSON antes de parse
function safeJSONParse(str, defaultValue = null) {
  if (!str || typeof str !== 'string') return defaultValue;

  try {
    const parsed = JSON.parse(str);
    return parsed;
  } catch (e) {
    window.Logger?.warn('Erro ao fazer parse de JSON:', e);
    return defaultValue;
  }
}

// Valida localStorage antes de usar
function safeLocalStorageGet(key, defaultValue = null) {
  try {
    const value = localStorage.getItem(key);
    if (value === null) return defaultValue;
    return safeJSONParse(value, defaultValue);
  } catch (e) {
    window.Logger?.warn('Erro ao ler localStorage:', e);
    return defaultValue;
  }
}

function safeLocalStorageSet(key, value) {
  try {
    const serialized = JSON.stringify(value);
    localStorage.setItem(key, serialized);
    return true;
  } catch (e) {
    window.Logger?.error('Erro ao escrever localStorage:', e);
    return false;
  }
}

// Exporta para uso global
window.SecurityUtils = {
  sanitizeHTML,
  isValidEthereumAddress,
  isValidEmail,
  sanitizeInput,
  createSafeElement,
  setSafeHTML,
  safeJSONParse,
  safeLocalStorageGet,
  safeLocalStorageSet,
};
