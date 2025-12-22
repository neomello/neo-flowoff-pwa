// index-scripts.js - Scripts específicos do index.html

// === MOBILE MENU TOGGLE ===
const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
const mobileMenuDropdown = document.getElementById('mobile-menu-dropdown');
const walletBtnMobile = document.getElementById('wallet-btn-mobile');

// Toggle do menu mobile
function toggleMobileMenu() {
  const isOpen = mobileMenuDropdown.classList.contains('show');
  
  if (isOpen) {
    closeMobileMenu();
  } else {
    openMobileMenu();
  }
}

function openMobileMenu() {
  mobileMenuDropdown.classList.add('show');
  mobileMenuToggle.classList.add('active');
  mobileMenuDropdown.style.display = 'block';
  
  // Sincronizar estado do botão mobile com a wallet
  syncMobileWalletButton();
}

function closeMobileMenu() {
  mobileMenuDropdown.classList.remove('show');
  mobileMenuToggle.classList.remove('active');
  
  // Delay para animação
  setTimeout(() => {
    if (!mobileMenuDropdown.classList.contains('show')) {
      mobileMenuDropdown.style.display = 'none';
    }
  }, 350);
}

// Sincroniza estado do botão mobile com WalletManager
function syncMobileWalletButton() {
  if (!walletBtnMobile) return;
  
  const textEl = walletBtnMobile.querySelector('.wallet-btn-text-mobile');
  const arrowEl = walletBtnMobile.querySelector('.wallet-btn-arrow');
  
  if (window.WalletManager && window.WalletManager.connected) {
    walletBtnMobile.classList.add('connected');
    textEl.textContent = window.WalletManager.formatAddress(window.WalletManager.address);
    arrowEl.textContent = '✓';
  } else {
    walletBtnMobile.classList.remove('connected');
    textEl.textContent = 'ACESSAR';
    arrowEl.textContent = '→';
  }
}

// Event listeners
if (mobileMenuToggle) {
  mobileMenuToggle.addEventListener('click', toggleMobileMenu);
}

// Fechar menu ao clicar fora
document.addEventListener('click', (e) => {
  if (mobileMenuDropdown && mobileMenuDropdown.classList.contains('show')) {
    if (!mobileMenuToggle.contains(e.target) && !mobileMenuDropdown.contains(e.target)) {
      closeMobileMenu();
    }
  }
});

// Fechar menu ao redimensionar para desktop
window.addEventListener('resize', () => {
  if (window.innerWidth > 600 && mobileMenuDropdown) {
    closeMobileMenu();
  }
});

// Expor funções globalmente
window.closeMobileMenu = closeMobileMenu;
window.syncMobileWalletButton = syncMobileWalletButton;

// === DETECÇÃO DE DESKTOP COM PREVENÇÃO DE LOOPS ===
function detectDesktop() {
  // Verificar se usuário forçou modo desktop
  const forceDesktop = localStorage.getItem('force-desktop');
  if (forceDesktop === 'true') {
    return false; // Não redirecionar
  }

  // Verificar se é desktop baseado em várias características
  const isDesktop = window.innerWidth >= 1024 && 
                   window.innerHeight >= 768 && 
                   !navigator.userAgent.match(/Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i) &&
                   !('ontouchstart' in window) &&
                   window.matchMedia('(pointer: fine)').matches;
  
  if (isDesktop) {
    // Verificar se já está na página desktop
    if (!window.location.pathname.includes('desktop.html')) {
      // Prevenir loop: verificar se não veio do desktop.html recentemente
      const lastDesktopVisit = localStorage.getItem('last-desktop-visit');
      const now = Date.now();
      
      if (!lastDesktopVisit || (now - parseInt(lastDesktopVisit)) > 10000) { // 10 segundos
        localStorage.setItem('last-desktop-visit', now.toString());
        window.location.href = 'desktop.html';
        return true;
      } else {
        return false;
      }
    }
  }
  return false;
}

// Executar detecção quando a página carregar
detectDesktop();

// Force CSS reload
const link = document.querySelector('link[href*="styles.css"]');
if (link) {
  link.href = link.href.split('?')[0] + '?v=' + Date.now();
}

// === REGISTRO DO SERVICE WORKER ===
if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      const registration = await navigator.serviceWorker.register('./sw.js', {
        scope: './'
      });
      
      // Verificar se há atualizações
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // Nova versão disponível - será notificado pelo sistema de atualização
              window.Logger?.info('Nova versão do Service Worker disponível');
            }
          });
        }
      });
      
      window.Logger?.info('Service Worker registrado com sucesso');
    } catch (error) {
      window.Logger?.error('Erro ao registrar Service Worker:', error);
    }
  });
}

// === MENU HAMBÚRGUER ===
document.addEventListener('DOMContentLoaded', function() {
  const menuToggle = document.getElementById('menu-toggle');
  const headerMenu = document.getElementById('header-menu');
  
  if (!menuToggle || !headerMenu) return;
  
  const menuOverlay = document.createElement('div');
  menuOverlay.className = 'menu-overlay';
  document.body.appendChild(menuOverlay);

  // Função para fechar o menu
  function closeMenu() {
    menuToggle.classList.remove('active');
    headerMenu.classList.remove('active');
    menuOverlay.classList.remove('active');
    document.body.style.overflow = '';
    
    // Garantir que modal-open seja removido se estiver presente
    document.body.classList.remove('modal-open');
    
    // Remover estilos inline para permitir transição CSS
    setTimeout(() => {
      headerMenu.style.right = '';
      headerMenu.style.visibility = '';
      headerMenu.style.opacity = '';
    }, 10);
  }

  // Toggle menu
  menuToggle.addEventListener('click', (e) => {
    e.stopPropagation();
    e.preventDefault();
    const isActive = headerMenu.classList.contains('active');
    
    if (isActive) {
      // Fechar menu suavemente
      closeMenu();
    } else {
      // Abrir menu suavemente
      headerMenu.style.display = 'block';
      headerMenu.style.visibility = 'visible';
      headerMenu.style.zIndex = '1005';
      
      // Garantir que modal-open seja removido ao abrir o menu
      document.body.classList.remove('modal-open');
      
      // Pequeno delay para garantir que o display está aplicado antes da transição
      requestAnimationFrame(() => {
        menuToggle.classList.add('active');
        headerMenu.classList.add('active');
        menuOverlay.classList.add('active');
        document.body.style.overflow = 'hidden';
        
        // Aplicar estilos para transição suave
        headerMenu.style.right = '0';
        headerMenu.style.opacity = '1';
      });
    }
  });

  // Fechar ao clicar no overlay
  menuOverlay.addEventListener('click', (e) => {
    e.stopPropagation();
    closeMenu();
  });

  // Fechar ao clicar em um link
  const menuLinks = headerMenu.querySelectorAll('.menu-link');
  menuLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      const href = link.getAttribute('href');
      
      // Se for um link de âncora (#)
      if (href && href.startsWith('#')) {
        const targetId = href.substring(1);
        const targetElement = document.getElementById(targetId);
        
        // Fechar menu imediatamente
        closeMenu();
        
        // Se estiver na home, fazer scroll suave após fechar o menu
        const currentRoute = document.querySelector('.route.active');
        if (currentRoute && currentRoute.id === 'home' && targetElement) {
          e.preventDefault();
          
          // Aguardar um pouco para o menu começar a fechar
          setTimeout(() => {
            const headerHeight = document.querySelector('.topbar')?.offsetHeight || 0;
            const targetPosition = targetElement.offsetTop - headerHeight - 20;
            
            window.scrollTo({
              top: targetPosition,
              behavior: 'smooth'
            });
          }, 100);
        }
      } else {
        // Para outros links, fechar o menu normalmente
        closeMenu();
      }
    });
  });

  // Fechar ao pressionar ESC
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && headerMenu.classList.contains('active')) {
      closeMenu();
    }
  });
});

// Efeito de blur no header durante scroll
const header = document.getElementById('main-header');
let lastScrollY = window.scrollY;
let ticking = false;

function updateHeader() {
  const scrollY = window.scrollY;
  
  if (scrollY > 50) {
    header.classList.add('scrolled');
  } else {
    header.classList.remove('scrolled');
  }
  
  lastScrollY = scrollY;
  ticking = false;
}

function requestTick() {
  if (!ticking) {
    requestAnimationFrame(updateHeader);
    ticking = true;
  }
}

window.addEventListener('scroll', requestTick, { passive: true });

// === GLASS MORPHISM OVERLAY CONTROL ===
const glassOverlay = document.getElementById('glass-overlay');
let overlayTicking = false;

function updateGlassOverlay() {
  const scrollY = window.scrollY;
  const windowHeight = window.innerHeight;
  const documentHeight = document.documentElement.scrollHeight;
  
  // Calcular se deve mostrar o overlay
  const shouldShowOverlay = scrollY > 100 && (scrollY + windowHeight) < (documentHeight - 50);
  
  if (shouldShowOverlay) {
    glassOverlay.classList.add('active');
  } else {
    glassOverlay.classList.remove('active');
  }
  
  overlayTicking = false;
}

function requestOverlayTick() {
  if (!overlayTicking) {
    requestAnimationFrame(updateGlassOverlay);
    overlayTicking = true;
  }
}

window.addEventListener('scroll', requestOverlayTick, { passive: true });

// Atualizar na carga inicial
updateGlassOverlay();

// === UPDATE DETECTION SYSTEM ===
const updateBanner = document.getElementById('update-banner');
const updateBtn = document.getElementById('update-btn');
const updateDismiss = document.getElementById('update-dismiss');

let updateAvailable = false;
let updateWorker = null;
let bannerShown = false;

// Detectar atualizações do Service Worker
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    showUpdateBanner();
  });

  // Verificar se há uma nova versão disponível
  navigator.serviceWorker.getRegistration().then(registration => {
    if (registration) {
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            showUpdateBanner();
          }
        });
      });
    }
  });
}

// Função para mostrar toast de atualização
function showUpdateBanner() {
  if (bannerShown || localStorage.getItem('update-dismissed') === 'true') {
    return;
  }
  
  if (updateBanner) {
    updateBanner.classList.add('show');
    updateBanner.classList.remove('hiding');
    bannerShown = true;
    
    // Vibração se disponível
    navigator.vibrate?.(100);
  }
}

// Função para esconder toast de atualização
function hideUpdateBanner() {
  if (updateBanner) {
    updateBanner.classList.add('hiding');
    setTimeout(() => {
      updateBanner.classList.remove('show', 'hiding');
      bannerShown = false;
    }, 300);
  }
}

// Botão atualizar
if (updateBtn) {
  updateBtn.addEventListener('click', () => {
    window.location.reload();
  });
}

// Botão dispensar
if (updateDismiss) {
  updateDismiss.addEventListener('click', (e) => {
    e.stopPropagation();
    hideUpdateBanner();
    localStorage.setItem('update-dismissed', 'true');
  });
}

// Clicar no toast também atualiza
if (updateBanner) {
  updateBanner.addEventListener('click', (e) => {
    if (e.target !== updateDismiss) {
      window.location.reload();
    }
  });
}

// Auto-hide após 15 segundos
setTimeout(() => {
  if (bannerShown) {
    hideUpdateBanner();
  }
}, 15000);

// Função para testar o toast manualmente (debug)
window.testUpdateBanner = () => {
  if (updateBanner) {
    localStorage.removeItem('update-dismissed');
    updateBanner.classList.add('show');
    updateBanner.classList.remove('hiding');
    bannerShown = true;
  }
};

// Função para testar offline toast (debug)
window.testOfflineBanner = () => {
  const offline = document.getElementById('offline');
  if (offline) {
    offline.classList.add('show');
    offline.classList.remove('hiding');
  }
};

// Função para limpar o estado do banner (debug)
window.clearUpdateState = () => {
  localStorage.removeItem('update-dismissed');
};

// Verificar atualizações periodicamente (a cada 5 minutos)
setInterval(() => {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistration().then(registration => {
      if (registration) {
        registration.update();
      }
    });
  }
}, 5 * 60 * 1000); // 5 minutos

// === MODAIS DOS PROJETOS ===
document.addEventListener('DOMContentLoaded', function() {
  // Event listeners para abrir modais
  document.querySelectorAll('[data-modal]').forEach(item => {
    item.addEventListener('click', function() {
      const modalId = this.getAttribute('data-modal');
      const modal = document.getElementById(`modal-${modalId}`);
      if (modal) {
        modal.showModal();
        document.body.style.overflow = 'hidden'; // Previne scroll do body
        document.body.classList.add('modal-open'); // Adiciona classe para escurecer fundo
      }
    });
  });

  // Event listeners para fechar modais
  document.querySelectorAll('[data-close]').forEach(button => {
    button.addEventListener('click', function() {
      const modalId = this.getAttribute('data-close');
      const modal = document.getElementById(modalId);
      if (modal) {
        modal.close();
        document.body.style.overflow = ''; // Restaura scroll do body
        document.body.classList.remove('modal-open'); // Remove classe para restaurar fundo
      }
    });
  });

  // Fechar modal clicando fora dele
  document.querySelectorAll('.project-modal').forEach(modal => {
    modal.addEventListener('click', function(e) {
      if (e.target === this) {
        this.close();
        document.body.style.overflow = '';
        document.body.classList.remove('modal-open'); // Remove classe para restaurar fundo
      }
    });
  });

  // Garantir que todos os modais estejam fechados ao carregar
  document.addEventListener('DOMContentLoaded', function() {
    const modals = document.querySelectorAll('.project-modal');
    modals.forEach(modal => {
      if (modal.open) {
        modal.close();
      }
    });
    document.body.style.overflow = '';
  });

  // Fechar modal com ESC
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
      const openModal = document.querySelector('.project-modal[open]');
      if (openModal) {
        openModal.close();
        document.body.style.overflow = '';
        document.body.classList.remove('modal-open'); // Remove classe para restaurar fundo
      }
    }
  });
});