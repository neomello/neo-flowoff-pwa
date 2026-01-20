// Sistema de logging condicional para produção
// Considera produção se estiver em IPFS gateways, ENS, ou domínios de produção
const isDevelopment =
  (window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1' ||
    window.location.hostname.includes('localhost')) &&
  !window.location.hostname.includes('ipfs.io') &&
  !window.location.hostname.includes('dweb.link') &&
  !window.location.hostname.includes('storacha.link') &&
  !window.location.hostname.includes('gateway.ipfs.io') &&
  !window.location.hostname.includes('.eth');

const safeConsole = window.console || {};
const nativeLog = safeConsole['log']?.bind(safeConsole) ?? (() => {});
const nativeWarn = safeConsole['warn']?.bind(safeConsole) ?? (() => {});
const nativeInfo = safeConsole['info']?.bind(safeConsole) ?? (() => {});
const nativeError = safeConsole['error']?.bind(safeConsole) ?? (() => {});

const Logger = {
  log: (...args) => {
    if (isDevelopment) {
      nativeLog(...args);
    }
  },

  error: (...args) => {
    nativeError(...args);
    // TODO: Enviar para serviço de monitoramento de erros (Sentry, etc)
  },

  warn: (...args) => {
    if (isDevelopment) {
      nativeWarn(...args);
    }
  },

  info: (...args) => {
    if (isDevelopment) {
      nativeInfo(...args);
    }
  },
};

// Exportar para uso global
window.Logger = Logger;
