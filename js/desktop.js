/**
 * NEØ FlowOFF - Desktop Experience
 * Versão específica para desktop com navegação lateral e múltiplas colunas
 */

class DesktopExperience {
  constructor() {
    this.currentSection = 'home';
    this.sidebarCollapsed = false;
    this.isMobile = false;

    // Elementos DOM
    this.sidebar = null;
    this.main = null;
    this.header = null;
    this.sections = null;
    this.navItems = null;

    // Estado
    this.scrollPosition = 0;
    this.lastActivity = Date.now();

    this.init();
  }

  /**
   * Inicializa a experiência desktop
   */
  init() {
    window.Logger?.log('🚀 Inicializando Desktop Experience v2.0.0');

    // Verifica se deve redirecionar para mobile
    if (this.shouldRedirectToMobile()) {
      this.redirectToMobile();
      return;
    }

    // Marca como experiência desktop
    localStorage.setItem('desktop-mode', 'true');
    localStorage.setItem('desktop-visit-time', Date.now().toString());

    this.cacheElements();
    this.bindEvents();
    this.initializeSections();
    this.initializeSidebar();
    this.initializeScroll();
    this.initializeKeyboard();

    // Animação de entrada
    this.playIntroAnimation();

    window.Logger?.log('✅ Desktop Experience inicializada');
  }

  /**
   * Verifica se deve redirecionar para versão mobile
   */
  shouldRedirectToMobile() {
    const isMobileDevice = this.detectMobileDevice();
    const isSmallScreen = window.innerWidth < 1024 || window.innerHeight < 768;
    const forceDesktop = localStorage.getItem('force-desktop') === 'true';

    // Não redireciona se forçado desktop ou se não for mobile
    if (forceDesktop || (!isMobileDevice && !isSmallScreen)) {
      return false;
    }

    // Redireciona para mobile se for dispositivo móvel ou tela pequena
    if (isMobileDevice || isSmallScreen) {
      // Verifica se já tentou redirecionar recentemente
      const lastMobileRedirect = localStorage.getItem('last-mobile-redirect');
      const now = Date.now();

      if (!lastMobileRedirect || now - parseInt(lastMobileRedirect) > 30000) {
        // 30 segundos
        return true;
      }
    }

    return false;
  }

  /**
   * Detecta se é um dispositivo móvel
   */
  detectMobileDevice() {
    return (
      /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
      ) ||
      'ontouchstart' in window ||
      (window.innerWidth < 768 && window.innerHeight < 1024)
    );
  }

  /**
   * Redireciona para versão mobile
   */
  redirectToMobile() {
    window.Logger?.log('📱 Redirecionando para versão mobile...');

    localStorage.setItem('last-mobile-redirect', Date.now().toString());
    localStorage.setItem('mobile-redirect-from', 'desktop');

    // Pequeno delay para mostrar feedback
    setTimeout(() => {
      window.location.href = 'index.html?from=desktop';
    }, 1000);
  }

  /**
   * Cache dos elementos DOM
   */
  cacheElements() {
    this.sidebar = document.getElementById('desktop-sidebar');
    this.main = document.getElementById('desktop-main');
    this.header = document.getElementById('desktop-header');
    this.sections = document.querySelectorAll('.desktop-section');
    this.navItems = document.querySelectorAll('.nav-item');

    // Botões de controle
    this.sidebarToggle = document.getElementById('sidebar-toggle');
    this.themeToggle = document.getElementById('theme-toggle');
    this.walletBtn = document.getElementById('wallet-btn-desktop');

    // Formulário de contato
    this.contactForm = document.getElementById('desktop-lead-form');
  }

  /**
   * Vincula eventos
   */
  bindEvents() {
    // Toggle sidebar
    if (this.sidebarToggle) {
      this.sidebarToggle.addEventListener('click', () => this.toggleSidebar());
    }

    // Toggle tema
    if (this.themeToggle) {
      this.themeToggle.addEventListener('click', () => this.toggleTheme());
    }

    // Navegação
    this.navItems.forEach((item) => {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        const section = item.dataset.section;
        if (section) {
          this.navigateToSection(section);
        }
      });
    });

    // Formulário de contato
    if (this.contactForm) {
      this.contactForm.addEventListener('submit', (e) =>
        this.handleContactSubmit(e)
      );
    }

    // Resize da janela
    window.addEventListener('resize', () => this.handleResize());

    // Atividade do usuário
    document.addEventListener('mousemove', () => this.updateActivity());
    document.addEventListener('keydown', () => this.updateActivity());
    document.addEventListener('click', () => this.updateActivity());

    // Scroll
    window.addEventListener('scroll', () => this.handleScroll());
  }

  /**
   * Inicializa as seções
   */
  initializeSections() {
    // Esconde todas as seções exceto a ativa
    this.sections.forEach((section) => {
      if (section.id === 'home-section') {
        section.classList.add('active');
      } else {
        section.classList.remove('active');
      }
    });

    // Verifica se há hash na URL
    const hash = window.location.hash.substring(1);
    if (hash && this.isValidSection(hash)) {
      this.navigateToSection(hash);
    }
  }

  /**
   * Inicializa a sidebar
   */
  initializeSidebar() {
    // Recupera estado da sidebar do localStorage
    const collapsed = localStorage.getItem('sidebar-collapsed') === 'true';
    if (collapsed) {
      this.collapseSidebar();
    }

    // Auto-collapse em telas menores
    if (window.innerWidth < 1200) {
      this.collapseSidebar();
    }
  }

  /**
   * Inicializa scroll
   */
  initializeScroll() {
    // Scroll suave
    this.scrollToTop();

    // Salva posição do scroll
    const savedScroll = localStorage.getItem('desktop-scroll-position');
    if (savedScroll) {
      window.scrollTo(0, parseInt(savedScroll));
    }
  }

  /**
   * Inicializa atalhos de teclado
   */
  initializeKeyboard() {
    document.addEventListener('keydown', (e) => {
      // Ctrl/Cmd + K: Toggle sidebar
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        this.toggleSidebar();
      }

      // Ctrl/Cmd + /: Toggle tema
      if ((e.ctrlKey || e.metaKey) && e.key === '/') {
        e.preventDefault();
        this.toggleTheme();
      }

      // Escape: Fecha sidebar se estiver aberta
      if (e.key === 'Escape' && !this.sidebarCollapsed) {
        this.collapseSidebar();
      }

      // Navegação com setas
      if (e.key === 'ArrowUp' && e.ctrlKey) {
        e.preventDefault();
        this.scrollToTop();
      }
    });
  }

  /**
   * Animação de entrada
   */
  playIntroAnimation() {
    // Anima elementos da sidebar
    const sidebarItems = this.sidebar.querySelectorAll('.nav-item');
    sidebarItems.forEach((item, index) => {
      item.style.opacity = '0';
      item.style.transform = 'translateX(-20px)';

      setTimeout(() => {
        item.style.transition = 'all 0.3s ease';
        item.style.opacity = '1';
        item.style.transform = 'translateX(0)';
      }, index * 50);
    });

    // Anima seção ativa
    const activeSection = document.querySelector('.desktop-section.active');
    if (activeSection) {
      activeSection.style.opacity = '0';
      activeSection.style.transform = 'translateY(20px)';

      setTimeout(() => {
        activeSection.style.transition = 'all 0.5s ease';
        activeSection.style.opacity = '1';
        activeSection.style.transform = 'translateY(0)';
      }, 300);
    }
  }

  /**
   * Navega para uma seção
   */
  navigateToSection(sectionId) {
    if (!this.isValidSection(sectionId) || sectionId === this.currentSection) {
      return;
    }

    window.Logger?.log(`📍 Navegando para seção: ${sectionId}`);

    // Atualiza navegação
    this.updateNavigation(sectionId);

    // Transição de seções
    this.transitionSections(sectionId);

    // Atualiza URL
    window.history.pushState(null, null, `#${sectionId}`);

    // Scroll to top da seção
    this.scrollToSection(sectionId);

    this.currentSection = sectionId;
  }

  /**
   * Verifica se a seção é válida
   */
  isValidSection(sectionId) {
    const validSections = [
      'home',
      'about',
      'services',
      'projects',
      'token',
      'insights',
      'contact',
    ];
    return validSections.includes(sectionId);
  }

  /**
   * Atualiza navegação ativa
   */
  updateNavigation(sectionId) {
    this.navItems.forEach((item) => {
      if (item.dataset.section === sectionId) {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
    });

    // Atualiza breadcrumb
    const breadcrumbItem = document.querySelector('.breadcrumb-item.active');
    if (breadcrumbItem) {
      breadcrumbItem.textContent = this.getSectionTitle(sectionId);
    }
  }

  /**
   * Transição entre seções
   */
  transitionSections(newSectionId) {
    const currentSection = document.querySelector('.desktop-section.active');
    const newSection = document.getElementById(`${newSectionId}-section`);

    if (!newSection) return;

    // Animação de saída
    if (currentSection) {
      currentSection.style.transition = 'all 0.3s ease';
      currentSection.style.opacity = '0';
      currentSection.style.transform = 'translateX(-20px)';

      setTimeout(() => {
        currentSection.classList.remove('active');
        currentSection.style.opacity = '';
        currentSection.style.transform = '';
      }, 300);
    }

    // Animação de entrada
    setTimeout(
      () => {
        newSection.classList.add('active');
        newSection.style.opacity = '0';
        newSection.style.transform = 'translateX(20px)';

        setTimeout(() => {
          newSection.style.transition = 'all 0.3s ease';
          newSection.style.opacity = '1';
          newSection.style.transform = 'translateX(0)';
        }, 50);
      },
      currentSection ? 200 : 0
    );
  }

  /**
   * Toggle sidebar
   */
  toggleSidebar() {
    if (this.sidebarCollapsed) {
      this.expandSidebar();
    } else {
      this.collapseSidebar();
    }
  }

  /**
   * Expande sidebar
   */
  expandSidebar() {
    this.sidebar.classList.remove('collapsed');
    this.main.classList.remove('sidebar-collapsed');
    this.sidebarCollapsed = false;
    localStorage.setItem('sidebar-collapsed', 'false');

    // Feedback visual
    this.showToast('Sidebar expandida', 'info');
  }

  /**
   * Collapse sidebar
   */
  collapseSidebar() {
    this.sidebar.classList.add('collapsed');
    this.main.classList.add('sidebar-collapsed');
    this.sidebarCollapsed = true;
    localStorage.setItem('sidebar-collapsed', 'true');

    // Feedback visual
    this.showToast('Sidebar recolhida', 'info');
  }

  /**
   * Toggle tema
   */
  toggleTheme() {
    const currentTheme =
      document.documentElement.getAttribute('data-theme') || 'dark';
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('desktop-theme', newTheme);

    // Atualiza ícone
    this.updateThemeIcon(newTheme);

    // Feedback
    this.showToast(
      `Tema ${newTheme === 'dark' ? 'escuro' : 'claro'} ativado`,
      'success'
    );
  }

  /**
   * Atualiza ícone do tema
   */
  updateThemeIcon(theme) {
    const icon = this.themeToggle.querySelector('svg');
    if (icon) {
      icon.style.transform =
        theme === 'dark' ? 'rotate(0deg)' : 'rotate(180deg)';
    }
  }

  /**
   * Scroll para uma seção
   */
  scrollToSection(sectionId) {
    const section = document.getElementById(`${sectionId}-section`);
    if (section) {
      const headerHeight = this.header.offsetHeight;
      const offsetTop = section.offsetTop - headerHeight - 20;

      window.scrollTo({
        top: offsetTop,
        behavior: 'smooth',
      });
    }
  }

  /**
   * Scroll para o topo
   */
  scrollToTop() {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  }

  /**
   * Trata redimensionamento da janela
   */
  handleResize() {
    // Auto-collapse em telas menores
    if (window.innerWidth < 1200 && !this.sidebarCollapsed) {
      this.collapseSidebar();
    } else if (window.innerWidth >= 1200 && this.sidebarCollapsed) {
      // Auto-expand em telas maiores (opcional)
      // this.expandSidebar();
    }

    // Redirecionamento se necessário
    if (this.shouldRedirectToMobile()) {
      this.redirectToMobile();
    }
  }

  /**
   * Trata scroll da página
   */
  handleScroll() {
    this.scrollPosition = window.scrollY;

    // Salva posição do scroll
    localStorage.setItem(
      'desktop-scroll-position',
      this.scrollPosition.toString()
    );

    // Atualiza header com efeito scroll
    if (this.scrollPosition > 50) {
      this.header.classList.add('scrolled');
    } else {
      this.header.classList.remove('scrolled');
    }
  }

  /**
   * Atualiza atividade do usuário
   */
  updateActivity() {
    this.lastActivity = Date.now();
  }

  /**
   * Trata submissão do formulário de contato
   */
  async handleContactSubmit(e) {
    e.preventDefault();

    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());

    // Validação básica
    if (!data.name || !data.email || !data.whats || !data.type) {
      this.showToast('Preencha todos os campos obrigatórios', 'error');
      return;
    }

    // Simula envio
    this.showToast('Enviando mensagem...', 'info');

    try {
      // Aqui seria a chamada real para a API
      await this.simulateApiCall(data);

      this.showToast('Mensagem enviada com sucesso!', 'success');
      e.target.reset();

      // Redireciona para WhatsApp após sucesso
      setTimeout(() => {
        window.open('https://wa.me/+5562983231110', '_blank');
      }, 2000);
    } catch (error) {
      window.Logger?.error('Erro ao enviar formulário:', error);
      this.showToast('Erro ao enviar mensagem. Tente novamente.', 'error');
    }
  }

  /**
   * Simula chamada de API
   */
  async simulateApiCall(data) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        // Simula 90% de sucesso
        if (Math.random() > 0.1) {
          resolve({ success: true });
        } else {
          reject(new Error('API Error'));
        }
      }, 2000);
    });
  }

  /**
   * Mostra toast notification
   */
  showToast(message, type = 'info') {
    // Remove toasts existentes
    const existingToasts = document.querySelectorAll('.desktop-toast');
    existingToasts.forEach((toast) => toast.remove());

    // Cria novo toast de forma segura (sem innerHTML com dados dinâmicos)
    const toast = document.createElement('div');
    toast.className = `desktop-toast toast-${type}`;
    
    const toastContent = document.createElement('div');
    toastContent.className = 'toast-content';
    
    const toastMessage = document.createElement('span');
    toastMessage.className = 'toast-message';
    toastMessage.textContent = message; // Usar textContent ao invés de innerHTML
    
    const toastClose = document.createElement('button');
    toastClose.className = 'toast-close';
    toastClose.textContent = '×';
    toastClose.setAttribute('aria-label', 'Fechar notificação');
    // Remover handler inline - usar addEventListener
    toastClose.addEventListener('click', () => {
      toast.remove();
    });
    
    toastContent.appendChild(toastMessage);
    toast.appendChild(toastContent);
    toast.appendChild(toastClose);

    // Adiciona ao DOM
    document.body.appendChild(toast);

    // Animação de entrada
    setTimeout(() => {
      toast.classList.add('show');
    }, 10);

    // Auto-remove após 5 segundos
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    }, 5000);
  }

  /**
   * Obtém título da seção
   */
  getSectionTitle(sectionId) {
    const titles = {
      home: 'Home',
      about: 'Sobre',
      services: 'Serviços',
      projects: 'Projetos',
      token: '$NEOFLW',
      insights: 'Insights',
      contact: 'Contato',
    };
    return titles[sectionId] || 'NEØ FlowOFF';
  }

  /**
   * Destroi a experiência desktop
   */
  destroy() {
    window.Logger?.log('🗑️ Destruindo Desktop Experience');

    // Remove event listeners
    window.removeEventListener('resize', this.handleResize);
    window.removeEventListener('scroll', this.handleScroll);

    // Limpa localStorage
    localStorage.removeItem('desktop-mode');
    localStorage.removeItem('sidebar-collapsed');
    localStorage.removeItem('desktop-scroll-position');
  }
}

// CSS para toasts
const toastStyles = `
  .desktop-toast {
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: 10000;
    background: rgba(15,15,24,.95);
    border: 1px solid rgba(255,255,255,.1);
    border-radius: 8px;
    padding: 16px 20px;
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    box-shadow: 0 8px 32px rgba(0,0,0,.3);
    transform: translateX(400px);
    opacity: 0;
    transition: all 0.3s ease;
    max-width: 400px;
    font-size: 14px;
    color: #e6e6f0;
  }

  .desktop-toast.show {
    transform: translateX(0);
    opacity: 1;
  }

  .toast-content {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .toast-info { border-left: 4px solid #00d0ff; }
  .toast-success { border-left: 4px solid #4ade80; }
  .toast-warning { border-left: 4px solid #f59e0b; }
  .toast-error { border-left: 4px solid #ef4444; }

  .toast-close {
    background: none;
    border: none;
    color: #9aa0aa;
    cursor: pointer;
    font-size: 18px;
    padding: 0;
    margin-left: auto;
    transition: color 0.2s ease;
  }

  .toast-close:hover {
    color: #e6e6f0;
  }
`;

// Adiciona estilos dos toasts
const styleSheet = document.createElement('style');
styleSheet.textContent = toastStyles;
document.head.appendChild(styleSheet);

// Inicializa quando DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
  window.DesktopExperience = new DesktopExperience();
});

// Cleanup quando página for descarregada
window.addEventListener('beforeunload', () => {
  if (window.DesktopExperience) {
    window.DesktopExperience.destroy();
  }
});

// API global para debug
window.debugDesktop = {
  toggleSidebar: () => window.DesktopExperience?.toggleSidebar(),
  navigateTo: (section) => window.DesktopExperience?.navigateToSection(section),
  toggleTheme: () => window.DesktopExperience?.toggleTheme(),
  getState: () => ({
    currentSection: window.DesktopExperience?.currentSection,
    sidebarCollapsed: window.DesktopExperience?.sidebarCollapsed,
    isMobile: window.DesktopExperience?.isMobile,
    scrollPosition: window.DesktopExperience?.scrollPosition,
  }),
};

window.Logger?.log('🎯 Desktop Experience v2.0.0 carregada');
window.Logger?.log('💡 Use window.debugDesktop para debugging');
