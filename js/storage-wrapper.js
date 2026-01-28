/**
 * Safe Storage Wrapper
 * Previne crashes em private mode e adiciona validação
 */

class SafeStorage {
  constructor(storage) {
    this.storage = storage;
    this.available = this.testAvailability();
    this.fallbackStore = new Map();
  }

  testAvailability() {
    try {
      const testKey = '__storage_test__';
      this.storage.setItem(testKey, 'test');
      this.storage.removeItem(testKey);
      return true;
    } catch (e) {
      window.Logger?.warn('Storage não disponível (private mode?):', e);
      return false;
    }
  }

  getItem(key) {
    if (!key || typeof key !== 'string') return null;
    
    try {
      if (this.available) {
        return this.storage.getItem(key);
      }
      return this.fallbackStore.get(key) || null;
    } catch (e) {
      window.Logger?.warn(`Erro ao ler storage key: ${key}`, e);
      return this.fallbackStore.get(key) || null;
    }
  }

  setItem(key, value) {
    if (!key || typeof key !== 'string') return false;
    
    try {
      if (this.available) {
        this.storage.setItem(key, value);
        return true;
      }
      this.fallbackStore.set(key, value);
      return true;
    } catch (e) {
      // QuotaExceededError ou private mode
      window.Logger?.warn(`Erro ao escrever storage key: ${key}`, e);
      this.fallbackStore.set(key, value);
      return false;
    }
  }

  removeItem(key) {
    if (!key || typeof key !== 'string') return;
    
    try {
      if (this.available) {
        this.storage.removeItem(key);
      }
      this.fallbackStore.delete(key);
    } catch (e) {
      window.Logger?.warn(`Erro ao remover storage key: ${key}`, e);
      this.fallbackStore.delete(key);
    }
  }

  clear() {
    try {
      if (this.available) {
        this.storage.clear();
      }
      this.fallbackStore.clear();
    } catch (e) {
      window.Logger?.warn('Erro ao limpar storage:', e);
      this.fallbackStore.clear();
    }
  }

  key(index) {
    try {
      if (this.available) {
        return this.storage.key(index);
      }
      const keys = Array.from(this.fallbackStore.keys());
      return keys[index] || null;
    } catch (e) {
      return null;
    }
  }

  get length() {
    try {
      if (this.available) {
        return this.storage.length;
      }
      return this.fallbackStore.size;
    } catch (e) {
      return this.fallbackStore.size;
    }
  }
}

// Criar wrappers globais seguros
if (typeof window !== 'undefined') {
  window.SafeLocalStorage = new SafeStorage(localStorage);
  window.SafeSessionStorage = new SafeStorage(sessionStorage);
  
  // Helper para migrar código existente
  window.safeLocalStorage = {
    getItem: (key) => window.SafeLocalStorage.getItem(key),
    setItem: (key, value) => window.SafeLocalStorage.setItem(key, value),
    removeItem: (key) => window.SafeLocalStorage.removeItem(key),
    clear: () => window.SafeLocalStorage.clear(),
  };
}
