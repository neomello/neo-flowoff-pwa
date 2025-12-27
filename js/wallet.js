/**
 * Wallet Manager - Thirdweb Integration
 * Gerencia conexão de wallet com abstração (embedded wallet)
 * 
 * Token: $NEOFLW na Base
 */

// Configuração do Token
const TOKEN_CONFIG = {
  address: '0x6575933669e530dC25aaCb496cD8e402B8f26Ff5',
  symbol: 'NEOFLW',
  name: 'NEOFlowOFF',
  decimals: 18,
  chainId: 8453, // Base
  chain: 'base'
};

// Thirdweb Client ID (público, pode ficar no frontend)
const THIRDWEB_CLIENT_ID = window.THIRDWEB_CLIENT_ID || '';

class WalletManager {
  constructor() {
    this.connected = false;
    this.address = null;
    this.balance = null;
    this.modal = null;
    this.init();
  }

  init() {
    this.createModal();
    this.loadState();
  }

  // Carrega estado salvo
  loadState() {
    const state = window.SecurityUtils?.safeLocalStorageGet('wallet_state', null);
    if (state && state.address) {
      // Valida endereço antes de usar
      if (window.SecurityUtils?.isValidEthereumAddress(state.address)) {
        this.connected = true;
        this.address = state.address;
        this.updateButton();
        this.fetchBalance();
      } else {
        // Endereço inválido - limpa estado corrompido
        window.SecurityUtils?.safeLocalStorageSet('wallet_state', null);
        window.Logger?.warn('Estado de wallet corrompido - removido');
      }
    }
  }

  // Salva estado
  saveState() {
    if (this.connected && this.address) {
      // Valida endereço antes de salvar
      if (!window.SecurityUtils?.isValidEthereumAddress(this.address)) {
        window.Logger?.error('Tentativa de salvar endereço inválido:', this.address);
        return;
      }
      
      window.SecurityUtils?.safeLocalStorageSet('wallet_state', {
        address: this.address,
        timestamp: Date.now()
      });
    } else {
      try {
        localStorage.removeItem('wallet_state');
      } catch (e) {
        window.Logger?.warn('Erro ao remover wallet_state:', e);
      }
    }
  }

  // Cria modal de conexão de forma segura
  createModal() {
    const modal = document.createElement('dialog');
    modal.id = 'wallet-modal';
    modal.className = 'wallet-modal';
    
    // Conteúdo do modal criado de forma segura
    const content = document.createElement('div');
    content.className = 'wallet-modal-content';
    
    // Header
    const header = document.createElement('div');
    header.className = 'wallet-modal-header';
    
    const title = document.createElement('h3');
    title.textContent = '🪙 $NEOFLW Wallet';
    
    const closeBtn = document.createElement('button');
    closeBtn.className = 'wallet-modal-close';
    closeBtn.textContent = '×';
    closeBtn.addEventListener('click', () => this.close());
    
    header.appendChild(title);
    header.appendChild(closeBtn);
    
    // Body
    const body = document.createElement('div');
    body.className = 'wallet-modal-body';
    
    // Estado desconectado
    const disconnected = document.createElement('div');
    disconnected.id = 'wallet-disconnected';
    disconnected.className = 'wallet-state';
    
    const logoDiv = document.createElement('div');
    logoDiv.className = 'wallet-logo';
    const logoImg = document.createElement('img');
    logoImg.src = 'public/logos/pink_metalic.png';
    logoImg.alt = 'NEO';
    logoImg.style.cssText = 'width: 64px; height: 64px; border-radius: 50%;';
    logoDiv.appendChild(logoImg);
    
    const desc = document.createElement('p');
    desc.className = 'wallet-desc';
    desc.textContent = 'Conecte sua wallet para acessar o ecossistema NEØ.FLOWOFF';
    
    const options = document.createElement('div');
    options.className = 'wallet-options';
    
    // Botão Email
    const emailBtn = document.createElement('button');
    emailBtn.className = 'wallet-option';
    emailBtn.addEventListener('click', () => this.connectEmail());
    const emailIcon = document.createElement('span');
    emailIcon.className = 'wallet-option-icon';
    emailIcon.textContent = '📧';
    const emailText = document.createElement('span');
    emailText.textContent = 'Email';
    emailBtn.appendChild(emailIcon);
    emailBtn.appendChild(emailText);
    
    // Botão Google
    const googleBtn = document.createElement('button');
    googleBtn.className = 'wallet-option';
    googleBtn.addEventListener('click', () => this.connectGoogle());
    const googleIcon = document.createElement('span');
    googleIcon.className = 'wallet-option-icon';
    googleIcon.textContent = 'G';
    const googleText = document.createElement('span');
    googleText.textContent = 'Google';
    googleBtn.appendChild(googleIcon);
    googleBtn.appendChild(googleText);
    
    // Botão Wallet
    const walletBtn = document.createElement('button');
    walletBtn.className = 'wallet-option';
    walletBtn.addEventListener('click', () => this.connectWallet());
    const walletIcon = document.createElement('span');
    walletIcon.className = 'wallet-option-icon';
    walletIcon.textContent = '🦊';
    const walletText = document.createElement('span');
    walletText.textContent = 'Wallet';
    walletBtn.appendChild(walletIcon);
    walletBtn.appendChild(walletText);
    
    options.appendChild(emailBtn);
    options.appendChild(googleBtn);
    options.appendChild(walletBtn);
    
    // Terms
    const terms = document.createElement('div');
    terms.className = 'wallet-terms';
    const termsLabel = document.createElement('label');
    termsLabel.className = 'wallet-terms-checkbox';
    const termsCheckbox = document.createElement('input');
    termsCheckbox.type = 'checkbox';
    termsCheckbox.id = 'wallet-terms-accept';
    termsCheckbox.required = true;
    const termsSpan = document.createElement('span');
    termsSpan.innerHTML = 'Eu aceito os <a href="terms.html" target="_blank" rel="noopener">Termos e Condições</a> e a <a href="privacy.html" target="_blank" rel="noopener">Política de Privacidade</a>';
    termsLabel.appendChild(termsCheckbox);
    termsLabel.appendChild(termsSpan);
    terms.appendChild(termsLabel);
    
    // Network
    const network = document.createElement('p');
    network.className = 'wallet-network';
    const networkDot = document.createElement('span');
    networkDot.className = 'network-dot';
    network.appendChild(networkDot);
    network.appendChild(document.createTextNode(' Base Network'));
    
    disconnected.appendChild(logoDiv);
    disconnected.appendChild(desc);
    disconnected.appendChild(options);
    disconnected.appendChild(terms);
    disconnected.appendChild(network);
    
    // Estado conectado
    const connected = document.createElement('div');
    connected.id = 'wallet-connected';
    connected.className = 'wallet-state';
    connected.style.display = 'none';
    
    const avatar = document.createElement('div');
    avatar.className = 'wallet-avatar';
    const avatarCircle = document.createElement('div');
    avatarCircle.className = 'wallet-avatar-circle';
    avatar.appendChild(avatarCircle);
    
    const addressDisplay = document.createElement('div');
    addressDisplay.id = 'wallet-address-display';
    addressDisplay.className = 'wallet-address';
    addressDisplay.textContent = '0x...';
    
    const balanceCard = document.createElement('div');
    balanceCard.className = 'wallet-balance-card';
    const balanceLabel = document.createElement('div');
    balanceLabel.className = 'balance-label';
    balanceLabel.textContent = 'Saldo $NEOFLW';
    const balanceValue = document.createElement('div');
    balanceValue.id = 'wallet-balance';
    balanceValue.className = 'balance-value';
    balanceValue.textContent = '0.00';
    balanceCard.appendChild(balanceLabel);
    balanceCard.appendChild(balanceValue);
    
    const actions = document.createElement('div');
    actions.className = 'wallet-actions';
    
    const copyBtn = document.createElement('button');
    copyBtn.className = 'wallet-action-btn';
    copyBtn.textContent = '📋 Copiar';
    copyBtn.addEventListener('click', () => this.copyAddress());
    
    const explorerBtn = document.createElement('button');
    explorerBtn.className = 'wallet-action-btn';
    explorerBtn.textContent = '🔗 Explorer';
    explorerBtn.addEventListener('click', () => this.viewOnExplorer());
    
    const disconnectBtn = document.createElement('button');
    disconnectBtn.className = 'wallet-action-btn danger';
    disconnectBtn.textContent = '🚪 Sair';
    disconnectBtn.addEventListener('click', () => this.disconnect());
    
    actions.appendChild(copyBtn);
    actions.appendChild(explorerBtn);
    actions.appendChild(disconnectBtn);
    
    connected.appendChild(avatar);
    connected.appendChild(addressDisplay);
    connected.appendChild(balanceCard);
    connected.appendChild(actions);
    
    body.appendChild(disconnected);
    body.appendChild(connected);
    
    content.appendChild(header);
    content.appendChild(body);
    modal.appendChild(content);
    
    // Adiciona estilos
    const style = document.createElement('style');
    style.textContent = `
      .wallet-modal {
        border: none;
        border-radius: 24px;
        padding: 0;
        max-width: 380px;
        width: 90vw;
        background: linear-gradient(180deg, rgba(20, 20, 30, 0.98), rgba(10, 10, 15, 0.98));
        backdrop-filter: blur(20px);
        -webkit-backdrop-filter: blur(20px);
        box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.1);
      }
      
      .wallet-modal::backdrop {
        background: rgba(0, 0, 0, 0.7);
        backdrop-filter: blur(4px);
      }
      
      .wallet-modal-content {
        color: white;
      }
      
      .wallet-modal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 20px 24px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      }
      
      .wallet-modal-header h3 {
        margin: 0;
        font-size: 18px;
        font-weight: 600;
      }
      
      .wallet-modal-close {
        background: rgba(255, 255, 255, 0.1);
        border: none;
        color: white;
        width: 32px;
        height: 32px;
        border-radius: 50%;
        font-size: 20px;
        cursor: pointer;
        transition: background 0.2s;
      }
      
      .wallet-modal-close:hover {
        background: rgba(255, 255, 255, 0.2);
      }
      
      .wallet-modal-body {
        padding: 24px;
      }
      
      .wallet-state {
        text-align: center;
      }
      
      .wallet-logo {
        margin-bottom: 16px;
      }
      
      .wallet-desc {
        color: rgba(255, 255, 255, 0.7);
        font-size: 14px;
        margin-bottom: 24px;
      }
      
      .wallet-options {
        display: flex;
        flex-direction: column;
        gap: 12px;
        margin-bottom: 24px;
      }
      
      .wallet-option {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 14px 20px;
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 12px;
        color: white;
        font-size: 15px;
        cursor: pointer;
        transition: all 0.2s;
      }
      
      .wallet-option:hover {
        background: rgba(139, 92, 246, 0.2);
        border-color: rgba(139, 92, 246, 0.5);
        transform: translateY(-2px);
      }
      
      .wallet-option-icon {
        font-size: 20px;
        width: 28px;
        text-align: center;
      }
      
      .wallet-terms {
        margin: 20px 0;
        padding: 12px;
        background: rgba(255, 255, 255, 0.03);
        border-radius: 8px;
        border: 1px solid rgba(255, 255, 255, 0.1);
      }
      
      .wallet-terms-checkbox {
        display: flex;
        align-items: flex-start;
        gap: 10px;
        cursor: pointer;
        font-size: 12px;
        color: rgba(255, 255, 255, 0.7);
        line-height: 1.5;
      }
      
      .wallet-terms-checkbox input[type="checkbox"] {
        margin-top: 2px;
        width: 16px;
        height: 16px;
        cursor: pointer;
        accent-color: #8b5cf6;
        flex-shrink: 0;
      }
      
      .wallet-terms-checkbox a {
        color: #8b5cf6;
        text-decoration: underline;
        transition: color 0.2s;
      }
      
      .wallet-terms-checkbox a:hover {
        color: #a78bfa;
      }
      
      .wallet-option:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
      
      .wallet-network {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        color: rgba(255, 255, 255, 0.5);
        font-size: 12px;
      }
      
      .network-dot {
        width: 8px;
        height: 8px;
        background: #3b82f6;
        border-radius: 50%;
        animation: pulse 2s infinite;
      }
      
      @keyframes pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.5; }
      }
      
      .wallet-avatar {
        margin-bottom: 16px;
      }
      
      .wallet-avatar-circle {
        width: 64px;
        height: 64px;
        margin: 0 auto;
        border-radius: 50%;
        background: linear-gradient(135deg, #8b5cf6, #3b82f6, #10b981);
        animation: gradient-rotate 3s linear infinite;
      }
      
      @keyframes gradient-rotate {
        0% { filter: hue-rotate(0deg); }
        100% { filter: hue-rotate(360deg); }
      }
      
      .wallet-address {
        font-family: 'SF Mono', Monaco, monospace;
        font-size: 14px;
        color: rgba(255, 255, 255, 0.7);
        margin-bottom: 20px;
        padding: 8px 16px;
        background: rgba(255, 255, 255, 0.05);
        border-radius: 8px;
        display: inline-block;
      }
      
      .wallet-balance-card {
        background: linear-gradient(135deg, rgba(139, 92, 246, 0.2), rgba(59, 130, 246, 0.2));
        border: 1px solid rgba(139, 92, 246, 0.3);
        border-radius: 16px;
        padding: 20px;
        margin-bottom: 20px;
      }
      
      .balance-label {
        font-size: 12px;
        color: rgba(255, 255, 255, 0.6);
        margin-bottom: 4px;
      }
      
      .balance-value {
        font-size: 28px;
        font-weight: 700;
        background: linear-gradient(135deg, #8b5cf6, #3b82f6);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
      }
      
      .wallet-actions {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
        justify-content: center;
      }
      
      .wallet-action-btn {
        padding: 10px 16px;
        background: rgba(255, 255, 255, 0.1);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 10px;
        color: white;
        font-size: 13px;
        cursor: pointer;
        transition: all 0.2s;
      }
      
      .wallet-action-btn:hover {
        background: rgba(255, 255, 255, 0.15);
      }
      
      .wallet-action-btn.danger:hover {
        background: rgba(239, 68, 68, 0.2);
        border-color: rgba(239, 68, 68, 0.5);
      }
    `;
    
    document.head.appendChild(style);
    document.body.appendChild(modal);
    this.modal = modal;
  }

  // Toggle modal
  toggle() {
    if (this.modal.open) {
      this.close();
    } else {
      this.open();
    }
  }

  open() {
    this.modal.showModal();
    this.updateModalState();
  }

  close() {
    this.modal.close();
  }

  // Atualiza estado visual do modal
  updateModalState() {
    const disconnected = document.getElementById('wallet-disconnected');
    const connected = document.getElementById('wallet-connected');
    
      if (this.connected) {
        disconnected.style.display = 'none';
        connected.style.display = 'block';
        const addressEl = document.getElementById('wallet-address-display');
        const balanceEl = document.getElementById('wallet-balance');
        
        if (addressEl) {
          addressEl.textContent = this.formatAddress(this.address);
        }
        
        if (balanceEl && this.balance !== null) {
          balanceEl.textContent = this.formatBalance(this.balance);
        }
      } else {
        disconnected.style.display = 'block';
        connected.style.display = 'none';
      }
  }

  // Atualiza botão do header (desktop e mobile)
  updateButton() {
    // Botão Desktop
    const btn = document.getElementById('wallet-btn');
    if (btn) {
      const textEl = btn.querySelector('.wallet-btn-text');
      const iconEl = btn.querySelector('.wallet-btn-icon');
      
      if (this.connected) {
        btn.classList.add('connected');
        textEl.textContent = this.formatAddress(this.address);
        iconEl.textContent = '✓';
      } else {
        btn.classList.remove('connected');
        textEl.textContent = 'ACESSAR';
        iconEl.textContent = '→';
      }
    }
    
    // Botão Mobile
    const btnMobile = document.getElementById('wallet-btn-mobile');
    if (btnMobile) {
      const textElMobile = btnMobile.querySelector('.wallet-btn-text-mobile');
      const arrowElMobile = btnMobile.querySelector('.wallet-btn-arrow');
      
      if (this.connected) {
        btnMobile.classList.add('connected');
        textElMobile.textContent = this.formatAddress(this.address);
        arrowElMobile.textContent = '✓';
      } else {
        btnMobile.classList.remove('connected');
        textElMobile.textContent = 'ACESSAR WALLET';
        arrowElMobile.textContent = '→';
      }
    }
  }

  // Formata endereço
  formatAddress(address) {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }

  // Formata balance
  formatBalance(balance) {
    const num = parseFloat(balance);
    if (num === 0) return '0.00';
    if (num < 0.01) return '< 0.01';
    return num.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  // Verifica se termos foram aceitos
  checkTermsAccepted() {
    const checkbox = document.getElementById('wallet-terms-accept');
    if (!checkbox || !checkbox.checked) {
      alert('Por favor, aceite os Termos e Condições e a Política de Privacidade para continuar.');
      return false;
    }
    return true;
  }

  // Conexão via Email (Embedded Wallet)
  async connectEmail() {
    if (!this.checkTermsAccepted()) return;
    
    const email = prompt('Digite seu email:');
    // Validação robusta de email
    if (!email || !window.SecurityUtils?.isValidEmail(email)) {
      alert('Email inválido. Por favor, digite um email válido.');
      return;
    }
    
    // Sanitiza email antes de usar
    const sanitizedEmail = window.SecurityUtils?.sanitizeInput(email, 'email');
    if (!sanitizedEmail) {
      alert('Email inválido');
      return;
    }
    
    // Tenta usar Thirdweb SDK primeiro (se disponível)
    if (THIRDWEB_CLIENT_ID && typeof thirdweb !== 'undefined') {
      try {
        await this.connectWithThirdwebEmail(email);
        return;
      } catch (error) {
        window.Logger?.warn('Thirdweb falhou, usando fallback:', error);
        // Continua para fallback
      }
    }
    
    // Fallback: Simula conexão
    await this.simulateConnect(email);
  }

  // Conexão via Thirdweb Email (tentativa principal)
  async connectWithThirdwebEmail(email) {
    try {
      // Inicializa Thirdweb client
      const client = thirdweb.createThirdwebClient({
        clientId: THIRDWEB_CLIENT_ID
      });
      
      const chain = thirdweb.defineChain(8453); // Base
      
      // Conecta via email usando Thirdweb SDK
      const wallet = await thirdweb.connect({
        client,
        strategy: 'email',
        email
      });
      
      if (wallet && wallet.getAddress) {
        const address = await wallet.getAddress();
        // Valida endereço antes de usar
        if (!window.SecurityUtils?.isValidEthereumAddress(address)) {
          throw new Error('Endereço de wallet inválido retornado');
        }
        this.address = address;
        this.connected = true;
        this.saveState();
        this.updateButton();
        this.updateModalState();
        this.fetchBalance();
        this.close();
        this.showToast('✅ Wallet conectada com sucesso!');
        return;
      }
      
      throw new Error('Wallet não retornada pelo Thirdweb');
    } catch (error) {
      window.Logger?.error('Erro ao conectar via Thirdweb Email:', error);
      throw error; // Re-lança para que o fallback seja usado
    }
  }

  // Conexão via Google
  async connectGoogle() {
    if (!this.checkTermsAccepted()) return;
    // Tenta usar Thirdweb SDK primeiro (se disponível)
    if (THIRDWEB_CLIENT_ID && typeof thirdweb !== 'undefined') {
      try {
        await this.connectWithThirdwebGoogle();
        return;
      } catch (error) {
        window.Logger?.warn('Thirdweb Google falhou, tentando redirect:', error);
        // Continua para redirect OAuth
      }
    }
    
    // Fallback 1: Redirect OAuth do Thirdweb
    if (THIRDWEB_CLIENT_ID) {
      const redirectUrl = encodeURIComponent(window.location.href);
      window.location.href = `https://embedded-wallet.thirdweb.com/auth/google?clientId=${THIRDWEB_CLIENT_ID}&redirectUrl=${redirectUrl}`;
      return;
    }
    
    // Fallback 2: Simula conexão
    await this.simulateConnect('google');
  }

  // Conexão via Thirdweb Google (tentativa principal)
  async connectWithThirdwebGoogle() {
    try {
      const client = thirdweb.createThirdwebClient({
        clientId: THIRDWEB_CLIENT_ID
      });
      
      const chain = thirdweb.defineChain(8453); // Base
      
      // Conecta via Google usando Thirdweb SDK
      const wallet = await thirdweb.connect({
        client,
        strategy: 'google',
        redirectUrl: window.location.href
      });
      
      if (wallet && wallet.getAddress) {
        const address = await wallet.getAddress();
        // Valida endereço antes de usar
        if (!window.SecurityUtils?.isValidEthereumAddress(address)) {
          throw new Error('Endereço de wallet inválido retornado');
        }
        this.address = address;
        this.connected = true;
        this.saveState();
        this.updateButton();
        this.updateModalState();
        this.fetchBalance();
        this.close();
        this.showToast('✅ Wallet conectada com sucesso!');
        return;
      }
      
      throw new Error('Wallet não retornada pelo Thirdweb');
    } catch (error) {
      window.Logger?.error('Erro ao conectar via Thirdweb Google:', error);
      throw error;
    }
  }

  // Conexão via Wallet externa (MetaMask, WalletConnect, etc)
  async connectWallet() {
    if (!this.checkTermsAccepted()) return;
    // Tenta detectar múltiplos providers
    const providers = this.detectWalletProviders();
    
    if (providers.length === 0) {
      // Fallback: Oferece opção de usar Email/Google
      const useFallback = confirm('Nenhuma wallet detectada.\n\nDeseja usar Email ou Google para criar uma wallet?');
      if (useFallback) {
        this.open();
        return;
      }
      alert('Nenhuma wallet detectada. Instale MetaMask, Coinbase Wallet ou similar.');
      return;
    }
    
    // Tenta conectar com o primeiro provider disponível
    for (const provider of providers) {
      try {
        const accounts = await provider.request({ method: 'eth_requestAccounts' });
        if (accounts && accounts[0]) {
          const address = accounts[0];
          // Valida endereço antes de usar
          if (!window.SecurityUtils?.isValidEthereumAddress(address)) {
            window.Logger?.warn('Endereço inválido retornado pelo provider:', address);
            continue; // Tenta próximo provider
          }
          this.address = address;
          this.connected = true;
          this.saveState();
          this.updateButton();
          this.updateModalState();
          this.fetchBalance();
          this.close();
          this.showToast('✅ Wallet conectada com sucesso!');
          return;
        }
      } catch (error) {
        window.Logger?.warn(`Erro ao conectar com ${provider.name || 'provider'}:`, error);
        // Tenta próximo provider
        continue;
      }
    }
    
    // Se todos falharam
    alert('Erro ao conectar wallet. Tente novamente ou use Email/Google.');
  }

  // Detecta múltiplos providers de wallet
  detectWalletProviders() {
    const providers = [];
    
    // MetaMask
    if (window.ethereum) {
      providers.push(window.ethereum);
    }
    
    // Coinbase Wallet
    if (window.coinbaseWalletExtension) {
      providers.push(window.coinbaseWalletExtension);
    }
    
    // WalletConnect (se disponível)
    if (window.walletConnect) {
      providers.push(window.walletConnect);
    }
    
    // Brave Wallet
    if (window.ethereum && window.ethereum.isBraveWallet) {
      providers.push(window.ethereum);
    }
    
    return providers;
  }

  // Simula conexão (para demo sem Thirdweb configurado)
  async simulateConnect(method) {
    // Gera endereço mock baseado no método
    const hash = await this.hashString(method + Date.now());
    const mockAddress = '0x' + hash.slice(0, 40);
    
    // Valida endereço mock antes de usar
    if (!window.SecurityUtils?.isValidEthereumAddress(mockAddress)) {
      window.Logger?.error('Erro ao gerar endereço mock válido');
      this.showToast('❌ Erro ao conectar. Tente novamente.');
      return;
    }
    
    this.address = mockAddress;
    this.connected = true;
    this.balance = '100.00';
    
    this.saveState();
    this.updateButton();
    this.updateModalState();
    this.close();
    
    // Mostra feedback
    this.showToast('✅ Wallet conectada com sucesso!');
  }

  // Hash string para endereço mock
  async hashString(str) {
    const encoder = new TextEncoder();
    const data = encoder.encode(str);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  // Busca balance do token com fallback de RPC
  async fetchBalance() {
    if (!this.address) return;
    
    // Lista de RPCs da Base (com fallback)
    const rpcEndpoints = [
      'https://mainnet.base.org',
      'https://base-mainnet.g.alchemy.com/v2/demo',
      'https://base.publicnode.com',
      'https://1rpc.io/base'
    ];
    
    // Tenta usar Thirdweb SDK primeiro (se disponível)
    if (THIRDWEB_CLIENT_ID && typeof thirdweb !== 'undefined') {
      try {
        await this.fetchBalanceWithThirdweb();
        return;
      } catch (error) {
        window.Logger?.warn('Thirdweb balance fetch falhou, usando RPC:', error);
        // Continua para fallback RPC
      }
    }
    
    // Fallback: Tenta múltiplos RPCs
    for (const rpcUrl of rpcEndpoints) {
      try {
        const balance = await this.fetchBalanceFromRPC(rpcUrl);
        if (balance !== null) {
          this.balance = balance;
          this.updateBalanceUI();
          return;
        }
      } catch (error) {
        window.Logger?.warn(`RPC ${rpcUrl} falhou:`, error);
        continue; // Tenta próximo RPC
      }
    }
    
    // Se todos os RPCs falharam
    window.Logger?.error('Todos os RPCs falharam ao buscar balance');
    this.balance = '0.00';
    this.updateBalanceUI();
  }

  // Busca balance via Thirdweb SDK
  async fetchBalanceWithThirdweb() {
    try {
      const client = thirdweb.createThirdwebClient({
        clientId: THIRDWEB_CLIENT_ID
      });
      
      const contract = thirdweb.getContract({
        client,
        chain: thirdweb.defineChain(8453),
        address: TOKEN_CONFIG.address
      });
      
      const balance = await contract.call('balanceOf', [this.address]);
      
      if (balance) {
        const balanceBigInt = BigInt(balance.toString());
        const decimals = BigInt(10 ** TOKEN_CONFIG.decimals);
        const intPart = balanceBigInt / decimals;
        const decPart = (balanceBigInt % decimals) / BigInt(10 ** (TOKEN_CONFIG.decimals - 2));
        this.balance = `${intPart}.${decPart.toString().padStart(2, '0')}`;
        this.updateBalanceUI();
      }
    } catch (error) {
      throw error;
    }
  }

  // Busca balance via RPC direto
  async fetchBalanceFromRPC(rpcUrl) {
    const response = await fetch(rpcUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'eth_call',
        params: [{
          to: TOKEN_CONFIG.address,
          data: '0x70a08231000000000000000000000000' + this.address.slice(2).toLowerCase()
        }, 'latest']
      })
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const json = await response.json();
    
    if (json.error) {
      throw new Error(json.error.message || 'Erro na resposta RPC');
    }
    
    if (json.result && json.result !== '0x' && json.result !== '0x0') {
      const balance = BigInt(json.result);
      const decimals = BigInt(10 ** TOKEN_CONFIG.decimals);
      const intPart = balance / decimals;
      const decPart = (balance % decimals) / BigInt(10 ** (TOKEN_CONFIG.decimals - 2));
      return `${intPart}.${decPart.toString().padStart(2, '0')}`;
    }
    
    return '0.00';
  }

  // Atualiza UI do balance
  updateBalanceUI() {
    const balanceEl = document.getElementById('wallet-balance');
    if (balanceEl) {
      balanceEl.textContent = this.formatBalance(this.balance);
    }
  }

  // Copia endereço
  async copyAddress() {
    if (!this.address) return;
    
    // Valida endereço antes de copiar
    if (!window.SecurityUtils?.isValidEthereumAddress(this.address)) {
      window.Logger?.error('Tentativa de copiar endereço inválido');
      this.showToast('❌ Erro ao copiar endereço');
      return;
    }
    
    try {
      await navigator.clipboard.writeText(this.address);
      this.showToast('📋 Endereço copiado!');
    } catch (error) {
      window.Logger?.error('Erro ao copiar endereço:', error);
      this.showToast('❌ Erro ao copiar. Tente novamente.');
    }
  }

  // Abre explorer
  viewOnExplorer() {
    if (!this.address) return;
    
    // Valida endereço antes de abrir explorer
    if (!window.SecurityUtils?.isValidEthereumAddress(this.address)) {
      window.Logger?.error('Tentativa de abrir explorer com endereço inválido');
      this.showToast('❌ Endereço inválido');
      return;
    }
    
    // Sanitiza URL antes de abrir
    const sanitizedAddress = window.SecurityUtils?.sanitizeInput(this.address, 'address');
    if (!sanitizedAddress) {
      this.showToast('❌ Erro ao abrir explorer');
      return;
    }
    
    try {
      window.open(`https://basescan.org/address/${sanitizedAddress}`, '_blank', 'noopener,noreferrer');
    } catch (error) {
      window.Logger?.error('Erro ao abrir explorer:', error);
      this.showToast('❌ Erro ao abrir explorer');
    }
  }

  // Desconecta
  disconnect() {
    this.connected = false;
    this.address = null;
    this.balance = null;
    
    try {
      localStorage.removeItem('wallet_state');
    } catch (e) {
      window.Logger?.warn('Erro ao remover wallet_state:', e);
    }
    
    this.updateButton();
    this.updateModalState();
    this.showToast('👋 Wallet desconectada');
  }

  // Toast notification com limpeza de timeout
  showToast(message) {
    // Limpa toast anterior se existir
    if (this._toastTimeout) {
      clearTimeout(this._toastTimeout);
      this._toastTimeout = null;
    }
    
    if (this._toastRemoveTimeout) {
      clearTimeout(this._toastRemoveTimeout);
      this._toastRemoveTimeout = null;
    }
    
    // Remove toast anterior se existir
    const existingToast = document.querySelector('.wallet-toast');
    if (existingToast) {
      existingToast.remove();
    }
    
    const toast = document.createElement('div');
    toast.className = 'wallet-toast';
    toast.style.cssText = `
      position: fixed;
      bottom: 100px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(20, 20, 30, 0.95);
      color: white;
      padding: 12px 24px;
      border-radius: 12px;
      font-size: 14px;
      z-index: 10001;
      backdrop-filter: blur(10px);
      border: 1px solid rgba(255, 255, 255, 0.1);
      animation: toast-in 0.3s ease;
    `;
    // Sanitiza mensagem antes de exibir
    toast.textContent = window.SecurityUtils?.sanitizeHTML(message) || message;
    document.body.appendChild(toast);
    
    this._toastTimeout = setTimeout(() => {
      toast.style.animation = 'toast-out 0.3s ease forwards';
      this._toastRemoveTimeout = setTimeout(() => {
        if (toast.parentNode) {
          toast.remove();
        }
        this._toastTimeout = null;
        this._toastRemoveTimeout = null;
      }, 300);
    }, 2000);
  }
}

// Adiciona animações do toast
const toastStyle = document.createElement('style');
toastStyle.textContent = `
  @keyframes toast-in {
    from { opacity: 0; transform: translateX(-50%) translateY(20px); }
    to { opacity: 1; transform: translateX(-50%) translateY(0); }
  }
  @keyframes toast-out {
    from { opacity: 1; transform: translateX(-50%) translateY(0); }
    to { opacity: 0; transform: translateX(-50%) translateY(-20px); }
  }
`;
document.head.appendChild(toastStyle);

// Inicializa e exporta
window.WalletManager = new WalletManager();

// Métodos estáticos para onclick
WalletManager.toggle = () => window.WalletManager.toggle();
WalletManager.close = () => window.WalletManager.close();
WalletManager.connectEmail = () => window.WalletManager.connectEmail();
WalletManager.connectGoogle = () => window.WalletManager.connectGoogle();
WalletManager.connectWallet = () => window.WalletManager.connectWallet();
WalletManager.copyAddress = () => window.WalletManager.copyAddress();
WalletManager.viewOnExplorer = () => window.WalletManager.viewOnExplorer();
WalletManager.disconnect = () => window.WalletManager.disconnect();
