// Sistema de fila offline para formulários
class OfflineQueue {
  constructor() {
    this.dbName = 'flowoff-queue';
    this.dbVersion = 1;
    this.storeName = 'pending-requests';
    this.db = null;
  }

  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };

      request.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          const store = db.createObjectStore(this.storeName, { keyPath: 'id', autoIncrement: true });
          store.createIndex('timestamp', 'timestamp', { unique: false });
          store.createIndex('retries', 'retries', { unique: false });
        }
      };
    });
  }

  async addRequest(data) {
    if (!this.db) await this.init();

    // Validar dados antes de adicionar
    if (!data || typeof data !== 'object') {
      throw new Error('Dados inválidos');
    }

    // Validar tamanho dos dados (50KB máximo)
    const dataSize = JSON.stringify(data).length;
    if (dataSize > 50000) {
      throw new Error('Dados muito grandes (máximo 50KB)');
    }

    // Validar URL
    if (!data.url || typeof data.url !== 'string' || data.url.length > 2000) {
      throw new Error('URL inválida');
    }

    // Validar método HTTP
    const validMethods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];
    const method = (data.method || 'GET').toUpperCase();
    if (!validMethods.includes(method)) {
      throw new Error('Método HTTP inválido');
    }

    const request = {
      url: data.url,
      method: method,
      headers: data.headers || {},
      body: data.body,
      timestamp: Date.now(),
      retries: 0,
      maxRetries: 5,
      status: 'pending'
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);

      // Verificar tamanho da fila antes de adicionar
      const countRequest = store.count();
      countRequest.onsuccess = () => {
        if (countRequest.result >= 100) {
          reject(new Error('Fila cheia (máximo 100 itens)'));
          return;
        }

        const addRequest = store.add(request);
        addRequest.onsuccess = () => resolve(addRequest.result);
        addRequest.onerror = () => reject(addRequest.error);
      };
      countRequest.onerror = () => reject(countRequest.error);
    });
  }

  async getAllPending() {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const index = store.index('timestamp');
      const request = index.getAll();

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  async removeRequest(id) {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async updateRequest(id, updates) {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const getRequest = store.get(id);

      getRequest.onsuccess = () => {
        const data = getRequest.result;
        if (data) {
          Object.assign(data, updates);
          const putRequest = store.put(data);
          putRequest.onsuccess = () => resolve();
          putRequest.onerror = () => reject(putRequest.error);
        } else {
          reject(new Error('Request not found'));
        }
      };
      getRequest.onerror = () => reject(getRequest.error);
    });
  }

  async clear() {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
}

// Exportar para uso global
window.OfflineQueue = OfflineQueue;

