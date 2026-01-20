// Setup global para testes
import { beforeEach, afterEach, vi } from 'vitest';

// Mock do DOM básico
beforeEach(() => {
  // Limpar localStorage antes de cada teste
  if (typeof localStorage !== 'undefined') {
    localStorage.clear();
  }

  // Mock de window.open
  if (typeof window !== 'undefined') {
    window.open = vi.fn();
  }

  // Mock de navigator.vibrate
  if (typeof navigator !== 'undefined') {
    navigator.vibrate = vi.fn();
  }

  // Mock de Logger
  if (typeof window !== 'undefined') {
    window.Logger = {
      info: vi.fn(),
      error: vi.fn(),
      log: vi.fn(),
      warn: vi.fn(),
    };

    // Mock de SecurityUtils
    window.SecurityUtils = {
      sanitizeHTML: (str) => str || '',
      isValidEthereumAddress: (addr) => /^0x[a-fA-F0-9]{40}$/.test(addr || ''),
      isValidEmail: (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email || ''),
      sanitizeInput: (input, type) => String(input || ''),
      safeLocalStorageGet: (key, defaultValue) => {
        try {
          const item = localStorage.getItem(key);
          return item ? JSON.parse(item) : defaultValue;
        } catch {
          return defaultValue;
        }
      },
      safeLocalStorageSet: (key, value) => {
        try {
          localStorage.setItem(key, JSON.stringify(value));
          return true;
        } catch {
          return false;
        }
      },
    };
  }

  // Mock de fetch
  global.fetch = vi.fn(() =>
    Promise.resolve({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ success: true }),
    })
  );

  // Mock de Service Worker
  if (typeof navigator !== 'undefined' && !navigator.serviceWorker) {
    navigator.serviceWorker = {
      ready: Promise.resolve({
        sync: {
          register: vi.fn(() => Promise.resolve()),
        },
      }),
    };
  }
});

afterEach(() => {
  // Limpar mocks após cada teste
  vi.clearAllMocks();

  // Limpar body
  if (typeof document !== 'undefined' && document.body) {
    document.body.innerHTML = '';
  }
});
