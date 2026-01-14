const CACHE = 'neo-flowoff-v2.4.4';
const QUEUE_NAME = 'form-submissions';
const MAX_RETRIES = 5;
const RETRY_DELAYS = [1000, 2000, 5000, 10000, 30000]; // Exponential backoff em ms

const ASSETS = [
  './', './index.html', './styles.css',
  './js/app.js', './js/wallet.js', './js/p5-background.js', './js/logger.js', './js/form-validator.js',
  './js/webp-support.js', './js/index-scripts.js', './js/offline-queue.js',
  './js/glass-morphism-bottom-bar.js', './js/utils.js',
  './manifest.webmanifest', './public/icon-192.png', './public/icon-512.png', './public/maskable-512.png',
  './public/flowoff logo.png', './public/FLOWPAY.png', './public/neo_ico.png',
  './public/logos/pink_metalic.png', './public/logos/neowhite.png', './public/logos/proia.png',
  './public/icons/icon-48x48.webp', './public/icons/icon-72x72.webp', './public/icons/icon-96x96.webp',
  './public/icons/icon-128x128.webp', './public/icons/icon-144x144.webp', './public/icons/icon-152x152.webp',
  './public/icons/icon-192x192.webp', './public/icons/icon-256x256.webp', './public/icons/icon-384x384.webp',
  './public/icons/icon-512x512.webp'
];

self.addEventListener('install', e=>{
  e.waitUntil(
    caches.open(CACHE).then(cache => {
      return Promise.allSettled(
        ASSETS.map(asset =>
          cache.add(asset).catch(() => {
            // Falhas silenciosas - alguns assets podem não existir
            return null;
          })
        )
      );
    })
  );
  // Não usa skipWaiting() aqui para permitir controle do usuário
});

// Listener para mensagem SKIP_WAITING do cliente
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

self.addEventListener('activate', e=>{
  e.waitUntil(
    Promise.all([
      caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))),
      processQueue().catch(() => {}) // Tentar processar fila na ativação
    ])
  );
  self.clients.claim();
});

self.addEventListener('fetch', e=>{
  const req = e.request;
  const url = new URL(req.url);

  // Filtrar requisições problemáticas
  if (
    url.protocol === 'chrome-extension:' ||
    url.protocol === 'moz-extension:' ||
    url.protocol === 'safari-extension:' ||
    url.hostname.includes('metamask') ||
    url.hostname.includes('tronlink') ||
    url.hostname.includes('bybit') ||
    url.pathname.includes('taaft.com-image-generator') ||
    url.pathname.includes('.backup') ||
    url.pathname.includes('installHook.js') ||
    url.pathname.includes('lockdown-install.js') ||
    url.pathname.includes('POSTON.png')
  ) {
    return;
  }

  // Interceptar submissões de formulário para Background Sync
  // Validação mais robusta
  const isFormSubmission = req.method === 'POST' &&
    (url.pathname.includes('/api/lead') || req.headers.get('X-Form-Submission') === 'true');

  if (isFormSubmission) {
    e.respondWith(handleFormSubmission(req).catch(error => {
      console.error('Erro ao processar submissão de formulário:', error);
      return new Response(JSON.stringify({
        success: false,
        error: 'Erro ao processar formulário. Tente novamente.'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }));
    return;
  }

  // Para CSS e JS, sempre buscar da rede primeiro
  if (req.url.includes('.css') || req.url.includes('.js')) {
    e.respondWith(
      fetch(req).then(res => {
        if (res.status === 200) {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put(req, copy)).catch(() => {});
        }
        return res;
      }).catch(() => caches.match(req))
    );
  } else {
    e.respondWith(
      fetch(req).then(res => {
        if (res.status === 200) {
          const copy = res.clone();
          caches.open(CACHE).then(c=>c.put(req, copy)).catch(() => {});
        }
        return res;
      }).catch(() => {
        return caches.match(req).then(cached => {
          if (cached) return cached;
          return new Response('Resource not available', { status: 404 });
        });
      })
    );
  }
});

// Handler para submissões de formulário com retry logic
async function handleFormSubmission(request) {
  // Valida request antes de processar
  if (!request || !request.url) {
    throw new Error('Request inválido');
  }

  try {
    // Tentar enviar imediatamente com timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

    const response = await fetch(request.clone(), {
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (response.ok) {
      return response;
    }

    // Se falhar, adicionar à fila para retry
    throw new Error(`HTTP ${response.status}`);
  } catch (error) {
    // Ignora abort (timeout) - adiciona à fila
    if (error.name === 'AbortError') {
      console.warn('Timeout ao enviar formulário, enfileirando...');
    }

    // Salvar na fila para Background Sync
    let formData = {};
    try {
      const clonedRequest = request.clone();
      formData = await clonedRequest.json();

      // Valida dados básicos
      if (!formData || typeof formData !== 'object') {
        formData = {};
      }
    } catch (parseError) {
      console.warn('Erro ao parsear formData:', parseError);
      formData = {};
    }

    // Adicionar à fila de Background Sync
    const queuedResponse = await queueForRetry(request, formData);

    // Tentar registrar Background Sync
    try {
      if (self.registration && 'sync' in self.registration) {
        await self.registration.sync.register(QUEUE_NAME).catch(() => {});
      }
    } catch (syncError) {
      // Background Sync não suportado - já enfileirado no IndexedDB
    }

    return queuedResponse;
  }
}

// Função auxiliar para enfileirar requisição
async function queueForRetry(request, data) {
  try {
    // Validar tamanho dos dados antes de enfileirar
    const dataSize = JSON.stringify(data).length;
    if (dataSize > 50000) { // 50KB máximo
      console.warn('Dados muito grandes para enfileirar');
      return new Response(JSON.stringify({
        success: false,
        error: 'Dados muito grandes'
      }), {
        status: 413,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Verificar tamanho da fila antes de adicionar
    const db = await openQueueDB();
    const transaction = db.transaction(['queue'], 'readwrite');
    const store = transaction.objectStore('queue');
    const countRequest = store.count();

    const count = await new Promise((resolve, reject) => {
      countRequest.onsuccess = () => resolve(countRequest.result);
      countRequest.onerror = () => reject(countRequest.error);
    });

    if (count >= MAX_QUEUE_SIZE) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Fila cheia. Tente novamente mais tarde.'
      }), {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const queueItem = {
      url: request.url,
      method: request.method,
      headers: Object.fromEntries(request.headers.entries()),
      body: data,
      timestamp: Date.now(),
      retries: 0,
      lastAttempt: null
    };

    await new Promise((resolve, reject) => {
      const addRequest = store.add(queueItem);
      addRequest.onsuccess = () => resolve();
      addRequest.onerror = () => reject(addRequest.error);
    });

    // Tentar processar a fila imediatamente
    processQueue().catch(() => {});
  } catch (error) {
    // Erro ao salvar na fila - continuar mesmo assim
    console.error('Erro ao enfileirar:', error);
  }

  return new Response(JSON.stringify({
    success: false,
    queued: true,
    message: 'Formulário enfileirado. Será enviado quando a conexão for restaurada.'
  }), {
    status: 202,
    headers: { 'Content-Type': 'application/json' }
  });
}

// Background Sync event handler
self.addEventListener('sync', event => {
  if (event.tag === QUEUE_NAME) {
    event.waitUntil(processQueue());
  }
});

// Flag para prevenir processamento simultâneo
let isProcessingQueue = false;
const MAX_QUEUE_SIZE = 100; // Limite máximo de itens na fila

// Processar fila de requisições pendentes
async function processQueue() {
  // Previne race condition - não processa se já estiver processando
  if (isProcessingQueue) {
    return;
  }

  isProcessingQueue = true;

  try {
    const db = await openQueueDB();
    const transaction = db.transaction(['queue'], 'readwrite');
    const store = transaction.objectStore('queue');
    const index = store.index('timestamp');
    const getAllRequest = index.getAll();

    const requests = await new Promise((resolve, reject) => {
      getAllRequest.onsuccess = () => resolve(getAllRequest.result || []);
      getAllRequest.onerror = () => reject(getAllRequest.error);
    });

    if (requests.length === 0) {
      isProcessingQueue = false;
      return;
    }

    // Limitar tamanho da fila - remover itens mais antigos se exceder limite
    if (requests.length > MAX_QUEUE_SIZE) {
      const sortedRequests = requests.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
      const toRemove = sortedRequests.slice(0, requests.length - MAX_QUEUE_SIZE);

      for (const item of toRemove) {
        await new Promise((resolve, reject) => {
          const deleteRequest = store.delete(item.id);
          deleteRequest.onsuccess = () => resolve();
          deleteRequest.onerror = () => reject(deleteRequest.error);
        });
      }

      // Recarregar lista após limpeza
      const getAllRequest2 = index.getAll();
      const requests2 = await new Promise((resolve, reject) => {
        getAllRequest2.onsuccess = () => resolve(getAllRequest2.result || []);
        getAllRequest2.onerror = () => reject(getAllRequest2.error);
      });

      if (requests2.length === 0) {
        isProcessingQueue = false;
        return;
      }

      // Usar lista atualizada
      requests.length = 0;
      requests.push(...requests2);
    }

    for (const item of requests) {
      if (item.retries >= MAX_RETRIES) {
        // Remover após max retries
        await new Promise((resolve, reject) => {
          const deleteRequest = store.delete(item.id);
          deleteRequest.onsuccess = () => resolve();
          deleteRequest.onerror = () => reject(deleteRequest.error);
        });
        continue;
      }

      try {
        // Timeout de 15 segundos para requisições
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000);

        const fetchRequest = new Request(item.url, {
          method: item.method,
          headers: item.headers,
          body: JSON.stringify(item.body),
          signal: controller.signal
        });

        const response = await fetch(fetchRequest);
        clearTimeout(timeoutId);

        if (response.ok) {
          // Sucesso - remover da fila
          await new Promise((resolve, reject) => {
            const deleteRequest = store.delete(item.id);
            deleteRequest.onsuccess = () => resolve();
            deleteRequest.onerror = () => reject(deleteRequest.error);
          });

          // Notificar clientes (com tratamento de erro para evitar mensagens fechadas)
          try {
            const clients = await self.clients.matchAll();
            clients.forEach(client => {
              // Verificar se o cliente ainda está ativo antes de enviar
              if (client && !client.closed) {
                client.postMessage({
                  type: 'FORM_SYNC_SUCCESS',
                  id: item.id
                }).catch(() => {
                  // Ignorar erros de mensagens fechadas
                });
              }
            });
          } catch (error) {
            // Ignorar erros ao enviar mensagens para clientes fechados
          }
        } else {
          // Incrementar retries
          item.retries++;
          item.lastError = `HTTP ${response.status}`;
          item.lastAttempt = Date.now();
          await new Promise((resolve, reject) => {
            const putRequest = store.put(item);
            putRequest.onsuccess = () => resolve();
            putRequest.onerror = () => reject(putRequest.error);
          });
        }
      } catch (error) {
        // Incrementar retries com exponential backoff
        item.retries++;
        item.lastError = error.name === 'AbortError' ? 'Timeout' : error.message;
        item.lastAttempt = Date.now();

        await new Promise((resolve, reject) => {
          const putRequest = store.put(item);
          putRequest.onsuccess = () => resolve();
          putRequest.onerror = () => reject(putRequest.error);
        });

        // Agendar próximo retry apenas se não excedeu max retries
        if (item.retries < MAX_RETRIES) {
          const delay = RETRY_DELAYS[Math.min(item.retries - 1, RETRY_DELAYS.length - 1)];
          setTimeout(() => processQueue(), delay);
        }
      }
    }
  } catch (error) {
    // Erro ao processar fila - tentar novamente mais tarde
    console.error('Erro ao processar fila:', error);
    setTimeout(() => {
      isProcessingQueue = false;
      processQueue();
    }, 5000);
  } finally {
    // Garante que flag é resetada mesmo em caso de erro
    isProcessingQueue = false;
  }
}

// Abrir IndexedDB para fila
function openQueueDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('flowoff-queue', 1);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains('queue')) {
        const store = db.createObjectStore('queue', { keyPath: 'id', autoIncrement: true });
        store.createIndex('timestamp', 'timestamp', { unique: false });
        store.createIndex('retries', 'retries', { unique: false });
      }
    };
  });
}

// Processar fila quando voltar online
self.addEventListener('online', () => {
  // Aguardar um pouco para garantir que a conexão está estável
  setTimeout(() => {
    processQueue().catch(() => {});
  }, 1000);
});

// Processar fila na ativação
self.addEventListener('activate', e => {
  e.waitUntil(
    Promise.all([
      caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))),
      processQueue()
    ])
  );
  self.clients.claim();
});
