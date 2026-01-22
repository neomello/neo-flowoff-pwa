// Import Vercel Speed Insights for performance monitoring
import './speed-insights.js';

// Versão da PWA (sincronizada com package.json e sw.js)
const PWA_VERSION = '1.0.7';

// Registro do Service Worker com detecção de atualizações
if ('serviceWorker' in navigator) {
  // Armazenar referências para cleanup adequado
  let swUpdateInterval = null;
  let registrationInstance = null;
  const cleanupFunctions = [];

  window.addEventListener('load', async () => {
    try {
      registrationInstance = await navigator.serviceWorker.register('./sw.js');

      // Verificar atualizações a cada 60 minutos
      // Armazena interval ID para limpeza
      swUpdateInterval = setInterval(
        () => {
          try {
            if (registrationInstance) {
              registrationInstance.update().catch((err) => {
                window.Logger?.warn('Erro ao atualizar Service Worker:', err);
              });
            }
          } catch (error) {
            window.Logger?.warn('Erro ao atualizar Service Worker:', error);
          }
        },
        60 * 60 * 1000
      );

      // Limpa interval quando página é descarregada
      const cleanup = () => {
        if (swUpdateInterval) {
          clearInterval(swUpdateInterval);
          swUpdateInterval = null;
        }
      };

      // Armazenar função de cleanup
      cleanupFunctions.push(cleanup);

      // Registrar cleanup no beforeunload
      const beforeUnloadHandler = () => cleanup();
      window.addEventListener('beforeunload', beforeUnloadHandler);
      cleanupFunctions.push(() => {
        window.removeEventListener('beforeunload', beforeUnloadHandler);
      });

      // Verificar se há atualizações
      const updateFoundHandler = () => {
        const newWorker = registrationInstance?.installing;
        if (!newWorker) return;

        const stateChangeHandler = () => {
          if (
            newWorker.state === 'installed' &&
            navigator.serviceWorker.controller
          ) {
            // Nova versão disponível - notificar usuário
            showUpdateNotification();
          }
        };

        newWorker.addEventListener('statechange', stateChangeHandler);
        cleanupFunctions.push(() => {
          newWorker.removeEventListener('statechange', stateChangeHandler);
        });
      };

      registrationInstance.addEventListener('updatefound', updateFoundHandler);
      cleanupFunctions.push(() => {
        if (registrationInstance) {
          registrationInstance.removeEventListener('updatefound', updateFoundHandler);
        }
      });
    } catch (error) {
      window.Logger?.error('Erro ao registrar Service Worker:', error);
    }
  });

  // Listener para controllerchange (quando SW assume controle)
  const controllerChangeHandler = () => {
    // Recarregar após atualização do SW
    if (window._swUpdateReady) {
      window.location.reload();
    }
  };

  navigator.serviceWorker.addEventListener('controllerchange', controllerChangeHandler);

  // Cleanup global ao descarregar página
  window.addEventListener('beforeunload', () => {
    cleanupFunctions.forEach(fn => {
      try {
        fn();
      } catch (e) {
        window.Logger?.warn('Erro durante cleanup:', e);
      }
    });
    cleanupFunctions.length = 0;
    
    if (swUpdateInterval) {
      clearInterval(swUpdateInterval);
      swUpdateInterval = null;
    }

    navigator.serviceWorker.removeEventListener('controllerchange', controllerChangeHandler);
  });
}

// Armazena timeout de remoção do toast
let updateToastRemoveTimeout = null;

// Notificação de atualização disponível
function showUpdateNotification() {
  // Evita mostrar múltiplas notificações
  const existingToast = document.getElementById('update-toast');
  if (existingToast) {
    // Limpa timeout anterior se existir
    if (updateToastRemoveTimeout) {
      clearTimeout(updateToastRemoveTimeout);
      updateToastRemoveTimeout = null;
    }
    return;
  }

  const toast = document.createElement('div');
  toast.id = 'update-toast';
  toast.style.cssText = `
    position: fixed;
    bottom: 100px;
    left: 50%;
    transform: translateX(-50%);
    background: linear-gradient(135deg, rgba(139, 92, 246, 0.95), rgba(59, 130, 246, 0.95));
    color: white;
    padding: 16px 24px;
    border-radius: 16px;
    box-shadow: 0 8px 32px rgba(0,0,0,0.3);
    backdrop-filter: blur(10px);
    z-index: 10000;
    display: flex;
    align-items: center;
    gap: 16px;
    font-family: inherit;
    max-width: 90vw;
    cursor: pointer;
  `;

  const icon = document.createElement('span');
  icon.textContent = '🚀';
  icon.style.fontSize = '24px';

  const textDiv = document.createElement('div');
  const title = document.createElement('div');
  title.textContent = 'Nova versão disponível!';
  title.style.cssText = 'font-weight: 600; margin-bottom: 4px;';
  const subtitle = document.createElement('div');
  subtitle.textContent = 'Clique para atualizar';
  subtitle.style.cssText = 'font-size: 0.85em; opacity: 0.9;';
  textDiv.appendChild(title);
  textDiv.appendChild(subtitle);

  const updateBtn = document.createElement('button');
  updateBtn.textContent = 'Atualizar';
  updateBtn.style.cssText = `
    background: rgba(255,255,255,0.2);
    border: none;
    color: white;
    padding: 8px 16px;
    border-radius: 8px;
    cursor: pointer;
    font-weight: 600;
    transition: background 0.2s;
  `;
  updateBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    window.applyUpdate();
  });
  updateBtn.addEventListener('mouseenter', () => {
    updateBtn.style.background = 'rgba(255,255,255,0.3)';
  });
  updateBtn.addEventListener('mouseleave', () => {
    updateBtn.style.background = 'rgba(255,255,255,0.2)';
  });

  toast.appendChild(icon);
  toast.appendChild(textDiv);
  toast.appendChild(updateBtn);

  toast.addEventListener('click', () => {
    window.applyUpdate();
  });

  document.body.appendChild(toast);
}

// Aplicar atualização
window.applyUpdate = async function () {
  window._swUpdateReady = true;
  const registration = await navigator.serviceWorker.ready;
  if (registration.waiting) {
    registration.waiting.postMessage({ type: 'SKIP_WAITING' });
  } else {
    window.location.reload();
  }
};

// Disponibiliza versão globalmente
window.PWA_VERSION = PWA_VERSION;

// Router super simples (hashless) - Compatível com Glass Morphism Bottom Bar
const buttons = document.querySelectorAll('.glass-nav-item');
const sections = [...document.querySelectorAll('.route')];
const detectedRoutes = sections.map((section) => section.id).filter(Boolean);
const routes = detectedRoutes.length
  ? detectedRoutes
  : ['home', 'projects', 'start', 'miniapp', 'ecosystem'];

function go(route) {
  let hasSection = false;
  routes.forEach((r) => {
    const element = document.getElementById(r);
    if (!element) return;
    const isActive = r === route;
    element.classList.toggle('active', isActive);
    if (isActive) {
      hasSection = true;
    }
  });
  if (buttons.length) {
    buttons.forEach((b) =>
      b.classList.toggle('active', b.dataset.route === route)
    );
  }
  if (hasSection) {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}

// Tornar função go() disponível globalmente para testes
window.go = go;

if (buttons.length) {
  buttons.forEach((b) =>
    b.addEventListener('click', () => go(b.dataset.route))
  );
  go('home');
}

// Sheet modal
document.querySelectorAll('[data-open]').forEach((el) => {
  el.addEventListener('click', () =>
    document.getElementById(el.dataset.open).showModal()
  );
});

// Offline UI - Toast notification style
function setOffline(flag) {
  const el = document.getElementById('offline');
  if (el) {
    if (flag) {
      el.classList.add('show');
      el.classList.remove('hiding');
    } else {
      el.classList.add('hiding');
      setTimeout(() => {
        el.classList.remove('show', 'hiding');
      }, 300);
    }
  }

  // Notificar validador de formulário sobre mudança de status
  if (window.FormValidator) {
    window.FormValidator.isOnline = !flag;
  }
}
window.addEventListener('online', () => {
  setOffline(false);
  // Processar fila quando voltar online
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready.then((registration) => {
      if ('sync' in registration) {
        registration.sync.register('form-submission').catch(() => { });
      }
    });
  }
});
window.addEventListener('offline', () => setOffline(true));
setOffline(!navigator.onLine);

// Escutar mensagens do Service Worker sobre sincronização
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.addEventListener('message', (event) => {
    // Não retornar true - não precisamos manter o canal aberto
    // Apenas processar a mensagem se ela existir
    if (event && event.data && event.data.type === 'FORM_SYNC_SUCCESS') {
      // Notificar usuário sobre sincronização bem-sucedida
      const statusEl = document.getElementById('lead-status');
      if (statusEl) {
        statusEl.textContent = '✓ Formulário sincronizado com sucesso!';
        statusEl.style.color = '#4ade80';
        setTimeout(() => {
          if (statusEl.textContent.includes('sincronizado')) {
            statusEl.textContent = '';
          }
        }, 3000);
      }
    }
    // Não retornar nada (undefined = false = não espera resposta assíncrona)
  });
}

// Formulário agora é gerenciado por js/form-validator.js
