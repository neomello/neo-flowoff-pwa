// Versão da PWA (sincronizada com package.json e sw.js)
const PWA_VERSION = '2.4.6';

// Registro do Service Worker com detecção de atualizações
if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      const registration = await navigator.serviceWorker.register('./sw.js');
      
      // Verificar atualizações a cada 60 minutos
      setInterval(() => registration.update(), 60 * 60 * 1000);
      
      // Verificar se há atualizações
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            // Nova versão disponível - notificar usuário
            showUpdateNotification();
          }
        });
      });
    } catch (error) {
      window.Logger?.error('Erro ao registrar Service Worker:', error);
    }
  });
  
  // Listener para controllerchange (quando SW assume controle)
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    // Recarregar após atualização do SW
    if (window._swUpdateReady) {
      window.location.reload();
    }
  });
}

// Notificação de atualização disponível
function showUpdateNotification() {
  // Evita mostrar múltiplas notificações
  if (document.getElementById('update-toast')) return;
  
  const toast = document.createElement('div');
  toast.id = 'update-toast';
  toast.innerHTML = `
    <div style="
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
    ">
      <span style="font-size: 24px;">🚀</span>
      <div>
        <div style="font-weight: 600; margin-bottom: 4px;">Nova versão disponível!</div>
        <div style="font-size: 0.85em; opacity: 0.9;">Clique para atualizar</div>
      </div>
      <button onclick="applyUpdate()" style="
        background: rgba(255,255,255,0.2);
        border: none;
        color: white;
        padding: 8px 16px;
        border-radius: 8px;
        cursor: pointer;
        font-weight: 600;
        transition: background 0.2s;
      " onmouseover="this.style.background='rgba(255,255,255,0.3)'" 
         onmouseout="this.style.background='rgba(255,255,255,0.2)'">
        Atualizar
      </button>
    </div>
  `;
  document.body.appendChild(toast);
}

// Aplicar atualização
window.applyUpdate = async function() {
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
const routes = ['home','projects','start','chat','ecosystem'];
const buttons = document.querySelectorAll('.glass-nav-item');
const sections = [...document.querySelectorAll('.route')];

function go(route){
  routes.forEach(r => {
    const element = document.getElementById(r);
    const isActive = r === route;
    element.classList.toggle('active', isActive);
  });
  buttons.forEach(b => b.classList.toggle('active', b.dataset.route===route));
  window.scrollTo({top:0, behavior:'smooth'});
}

// Tornar função go() disponível globalmente para testes
window.go = go;


buttons.forEach(b => b.addEventListener('click', () => go(b.dataset.route)));
go('home');

// Sheet modal
document.querySelectorAll('[data-open]').forEach(el=>{
  el.addEventListener('click', ()=> document.getElementById(el.dataset.open).showModal());
});

// Offline UI - Toast notification style
function setOffline(flag){
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
window.addEventListener('online', ()=>{
  setOffline(false);
  // Processar fila quando voltar online
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready.then(registration => {
      if ('sync' in registration) {
        registration.sync.register('form-submission').catch(() => {});
      }
    });
  }
});
window.addEventListener('offline', ()=>setOffline(true));
setOffline(!navigator.onLine);

// Escutar mensagens do Service Worker sobre sincronização
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.addEventListener('message', event => {
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
