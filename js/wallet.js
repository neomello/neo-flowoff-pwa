/**
 * Wallet Manager - Thirdweb SDK v5 Integration
 * Gerencia conexão de wallet com abstração (embedded wallet)
 * 
 * Token: $NEOFLW na Base Network (Chain ID: 8453)
 * Contrato: 0x6575933669e530dC25aaCb496cD8e402B8f26Ff5
 * 
 * Integração:
 * - Usa Thirdweb SDK v5 com inAppWallet
 * - Suporta: Email, Google, Apple, X (Twitter), Telegram, MetaMask
 * - Configuração de metadata (nome, ícone, imagem)
 * - Fallback para RPC direto da Base Network
 */

// Importa SDK Thirdweb v5 (via CDN ou módulo ES6)
// Nota: Se usar módulo ES6, importe no topo: import { createThirdwebClient, inAppWallet } from "thirdweb";

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

// Verifica se o SDK está disponível (carregado via CDN ou módulo)
let thirdwebSDK = null;
if (typeof window !== 'undefined') {
  // Tenta carregar do CDN se não estiver disponível
  if (!window.thirdweb) {
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/thirdweb@latest/dist/thirdweb.umd.js';
    script.async = true;
    script.onload = () => {
      thirdwebSDK = window.thirdweb;
      console.log('✅ Thirdweb SDK carregado via CDN');
    };
    document.head.appendChild(script);
  } else {
    thirdwebSDK = window.thirdweb;
  }
}

class WalletManager {
  constructor() {
    this.connected = false;
    this.address = null;
    this.balance = null;
    this.modal = null;
    this.client = null;
    this.wallet = null;
    this.account = null;
    this.init();
  }

  async init() {
    this.createModal();
    this.loadState();
    await this.initThirdwebSDK();
  }

  // Inicializa Thirdweb SDK v5
  async initThirdwebSDK() {
    if (!THIRDWEB_CLIENT_ID) {
      console.warn('⚠️ THIRDWEB_CLIENT_ID não configurado. Funcionalidades limitadas.');
      return;
    }

    // Aguarda SDK carregar se necessário
    if (!thirdwebSDK && typeof window !== 'undefined') {
      await new Promise((resolve) => {
        const checkSDK = setInterval(() => {
          if (window.thirdweb) {
            thirdwebSDK = window.thirdweb;
            clearInterval(checkSDK);
            resolve();
          }
        }, 100);
        setTimeout(() => {
          clearInterval(checkSDK);
          resolve();
        }, 5000); // Timeout após 5s
      });
    }

    if (!thirdwebSDK) {
      console.warn('⚠️ Thirdweb SDK não disponível. Usando fallback.');
      return;
    }

    try {
      // Cria client Thirdweb (frontend usa clientId)
      this.client = thirdwebSDK.createThirdwebClient({
        clientId: THIRDWEB_CLIENT_ID
      });

      // Define Base Network (Chain ID: 8453)
      const baseChain = thirdwebSDK.defineChain(8453);

      // Configura inAppWallet com metadata (URLs absolutas para compatibilidade OAuth)
      const baseUrl = window.location.origin;
      this.wallet = thirdwebSDK.inAppWallet({
        client: this.client,
        chain: baseChain,
        metadata: {
          name: "NEØ.FLOWOFF",
          icon: `${baseUrl}/public/icons/icon-512x512.webp`, // URL absoluta
          image: {
            src: "https://flowoff.xyz/public/images/capa_neo_flowoff_webapp.png",
            alt: "Banner NEØ.FLOWOFF",
            width: 1200,
            height: 630
          }
        },
        hidePrivateKeyExport: true // Segurança adicional
      });

      console.log('✅ Thirdweb SDK inicializado com sucesso');
    } catch (error) {
      console.error('❌ Erro ao inicializar Thirdweb SDK:', error);
      // Fallback: tenta usar método alternativo se defineChain não existir
      try {
        const baseUrl = window.location.origin;
        this.wallet = thirdwebSDK.inAppWallet({
          client: this.client,
          chainId: 8453, // Base Network
          metadata: {
            name: "NEØ.FLOWOFF",
            icon: `${baseUrl}/public/icons/icon-512x512.webp`, // URL absoluta
            image: {
              src: "https://flowoff.xyz/public/images/capa_neo_flowoff_webapp.png",
              alt: "Banner NEØ.FLOWOFF",
              width: 1200,
              height: 630
            }
          }
        });
        console.log('✅ Thirdweb SDK inicializado (fallback)');
      } catch (fallbackError) {
        console.error('❌ Erro no fallback:', fallbackError);
      }
    }
  }

  // Carrega estado salvo
  loadState() {
    const saved = localStorage.getItem('wallet_state');
    if (saved) {
      try {
        const state = JSON.parse(saved);
        if (state.address) {
          this.connected = true;
          this.address = state.address;
          this.updateButton();
          this.fetchBalance();
        }
      } catch (e) {
        localStorage.removeItem('wallet_state');
      }
    }
  }

  // Salva estado
  saveState() {
    if (this.connected && this.address) {
      localStorage.setItem('wallet_state', JSON.stringify({
        address: this.address,
        timestamp: Date.now()
      }));
    } else {
      localStorage.removeItem('wallet_state');
    }
  }

  // Cria modal de conexão
  createModal() {
    const modal = document.createElement('dialog');
    modal.id = 'wallet-modal';
    modal.className = 'wallet-modal';
    modal.innerHTML = `
      <div class="wallet-modal-content">
        <div class="wallet-modal-header">
          <h3>🪙 $NEOFLW Wallet</h3>
          <button class="wallet-modal-close" onclick="WalletManager.close()">×</button>
        </div>
        
        <div class="wallet-modal-body">
          <!-- Estado: Desconectado -->
          <div id="wallet-disconnected" class="wallet-state">
            <div class="wallet-logo">
              <img src="public/logos/pink_metalic.png" alt="NEO" style="width: 64px; height: 64px; border-radius: 50%;">
            </div>
            <p class="wallet-desc">Conecte sua wallet para acessar o ecossistema NEØ.FLOWOFF</p>
            
            <div class="wallet-options">
              <button class="wallet-option" onclick="WalletManager.connectEmail()">
                <span class="wallet-option-icon">📧</span>
                <span>Email</span>
              </button>
              <button class="wallet-option" onclick="WalletManager.connectGoogle()">
                <span class="wallet-option-icon">G</span>
                <span>Google</span>
              </button>
              <button class="wallet-option" onclick="WalletManager.connectApple()">
                <span class="wallet-option-icon">🍎</span>
                <span>Apple</span>
              </button>
              <button class="wallet-option" onclick="WalletManager.connectX()">
                <span class="wallet-option-icon">𝕏</span>
                <span>X (Twitter)</span>
              </button>
              <button class="wallet-option" onclick="WalletManager.connectTelegram()">
                <span class="wallet-option-icon">✈️</span>
                <span>Telegram</span>
              </button>
              <button class="wallet-option" onclick="WalletManager.connectWallet()">
                <span class="wallet-option-icon">🦊</span>
                <span>MetaMask</span>
              </button>
            </div>
            
            <p class="wallet-network">
              <span class="network-dot"></span>
              Base Network
            </p>
          </div>
          
          <!-- Estado: Conectado -->
          <div id="wallet-connected" class="wallet-state" style="display: none;">
            <div class="wallet-avatar">
              <div class="wallet-avatar-circle"></div>
            </div>
            <div class="wallet-address" id="wallet-address-display">0x...</div>
            
            <div class="wallet-balance-card">
              <div class="balance-label">Saldo $NEOFLW</div>
              <div class="balance-value" id="wallet-balance">0.00</div>
            </div>
            
            <div class="wallet-actions">
              <button class="wallet-action-btn" onclick="WalletManager.copyAddress()">
                📋 Copiar
              </button>
              <button class="wallet-action-btn" onclick="WalletManager.viewOnExplorer()">
                🔗 Explorer
              </button>
              <button class="wallet-action-btn danger" onclick="WalletManager.disconnect()">
                🚪 Sair
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
    
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
      document.getElementById('wallet-address-display').textContent = this.formatAddress(this.address);
      if (this.balance !== null) {
        this.updateBalanceDisplay();
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

  // Conexão via Email (Embedded Wallet) - SDK v5
  async connectEmail() {
    if (!this.wallet) {
      await this.initThirdwebSDK();
      if (!this.wallet) {
        alert('SDK Thirdweb não disponível. Tente novamente.');
        return;
      }
    }

    const email = prompt('Digite seu email:');
    if (!email || !email.includes('@')) {
      alert('Email inválido');
      return;
    }

    try {
      const account = await this.wallet.connect({
        strategy: "email",
        email: email
      });

      if (account && account.address) {
        this.address = account.address;
        this.connected = true;
        this.account = account;
        this.saveState();
        this.updateButton();
        this.updateModalState();
        await this.fetchBalance();
        this.close();
        this.showToast('✅ Wallet conectada com sucesso!');
        await this.onWalletConnected('email', email);
      }
    } catch (error) {
      console.error('Erro ao conectar via email:', error);
      const errorMsg = this.getErrorMessage(error);
      alert(`Erro ao conectar: ${errorMsg}`);
      // Reporta erro internamente (não crítico)
      this.reportError('email', error);
    }
  }

  // Conexão via Google - SDK v5
  async connectGoogle() {
    if (!this.wallet) {
      await this.initThirdwebSDK();
      if (!this.wallet) {
        alert('SDK Thirdweb não disponível. Tente novamente.');
        return;
      }
    }

    try {
      const account = await this.wallet.connect({
        strategy: "google"
        // identifier não necessário para OAuth - SDK gerencia popup
      });

      if (account && account.address) {
        this.address = account.address;
        this.connected = true;
        this.account = account;
        this.saveState();
        this.updateButton();
        this.updateModalState();
        await this.fetchBalance();
        this.close();
        this.showToast('✅ Wallet conectada com sucesso!');
        await this.onWalletConnected('google');
      }
    } catch (error) {
      console.error('Erro ao conectar via Google:', error);
      const errorMsg = this.getErrorMessage(error);
      alert(`Erro ao conectar: ${errorMsg}`);
      this.reportError('google', error);
    }
  }

  // Conexão via Apple - SDK v5
  async connectApple() {
    if (!this.wallet) {
      await this.initThirdwebSDK();
      if (!this.wallet) {
        alert('SDK Thirdweb não disponível. Tente novamente.');
        return;
      }
    }

    try {
      const account = await this.wallet.connect({
        strategy: "apple"
      });

      if (account && account.address) {
        this.address = account.address;
        this.connected = true;
        this.account = account;
        this.saveState();
        this.updateButton();
        this.updateModalState();
        await this.fetchBalance();
        this.close();
        this.showToast('✅ Wallet conectada com sucesso!');
        await this.onWalletConnected('apple');
      }
    } catch (error) {
      console.error('Erro ao conectar via Apple:', error);
      const errorMsg = this.getErrorMessage(error);
      alert(`Erro ao conectar: ${errorMsg}`);
      this.reportError('apple', error);
    }
  }

  // Conexão via X (Twitter) - SDK v5
  async connectX() {
    if (!this.wallet) {
      await this.initThirdwebSDK();
      if (!this.wallet) {
        alert('SDK Thirdweb não disponível. Tente novamente.');
        return;
      }
    }

    try {
      const account = await this.wallet.connect({
        strategy: "x"
      });

      if (account && account.address) {
        this.address = account.address;
        this.connected = true;
        this.account = account;
        this.saveState();
        this.updateButton();
        this.updateModalState();
        await this.fetchBalance();
        this.close();
        this.showToast('✅ Wallet conectada com sucesso!');
        await this.onWalletConnected('x');
      }
    } catch (error) {
      console.error('Erro ao conectar via X:', error);
      const errorMsg = this.getErrorMessage(error);
      alert(`Erro ao conectar: ${errorMsg}`);
      this.reportError('x', error);
    }
  }

  // Conexão via Telegram - SDK v5
  async connectTelegram() {
    if (!this.wallet) {
      await this.initThirdwebSDK();
      if (!this.wallet) {
        alert('SDK Thirdweb não disponível. Tente novamente.');
        return;
      }
    }

    try {
      const account = await this.wallet.connect({
        strategy: "telegram"
      });

      if (account && account.address) {
        this.address = account.address;
        this.connected = true;
        this.account = account;
        this.saveState();
        this.updateButton();
        this.updateModalState();
        await this.fetchBalance();
        this.close();
        this.showToast('✅ Wallet conectada com sucesso!');
        await this.onWalletConnected('telegram');
      }
    } catch (error) {
      console.error('Erro ao conectar via Telegram:', error);
      const errorMsg = this.getErrorMessage(error);
      alert(`Erro ao conectar: ${errorMsg}`);
      this.reportError('telegram', error);
    }
  }

  // Callback quando wallet é conectada (para criar lead automaticamente)
  async onWalletConnected(strategy, identifier = null) {
    try {
      // Cria lead automaticamente quando wallet é criada/conectada
      const leadData = {
        name: identifier || strategy,
        email: strategy === 'email' ? identifier : null,
        whats: null,
        type: 'wallet_connect',
        wallet_address: this.address,
        auth_strategy: strategy,
        timestamp: Date.now()
      };

      // Envia para API de leads (opcional - pode ser desabilitado)
      if (typeof fetch !== 'undefined') {
        fetch('/api/lead', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Wallet-Connection': 'true'
          },
          body: JSON.stringify(leadData)
        }).catch(err => {
          console.debug('Lead não enviado (opcional):', err);
        });
      }
    } catch (error) {
      console.debug('Erro ao criar lead (não crítico):', error);
    }
  }

  // Conexão via Wallet externa
  async connectWallet() {
    if (typeof window.ethereum !== 'undefined') {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        if (accounts && accounts[0]) {
          this.address = accounts[0];
          this.connected = true;
          this.saveState();
          this.updateButton();
          this.updateModalState();
          this.fetchBalance();
          this.close();
        }
      } catch (error) {
        console.error('Erro ao conectar wallet:', error);
        alert('Erro ao conectar. Tente novamente.');
      }
    } else {
      alert('Nenhuma wallet detectada. Instale MetaMask ou similar.');
    }
  }

  // Desconecta wallet do Thirdweb SDK (sempre chamar para limpar autenticação)
  async disconnectWallet() {
    if (this.wallet) {
      try {
        // Verifica se está conectado antes de desconectar
        const isConnected = await this.wallet.isConnected?.() || this.account !== null;
        if (isConnected) {
          await this.wallet.disconnect();
          console.log('✅ Wallet desconectada do SDK');
        }
      } catch (error) {
        console.debug('Erro ao desconectar wallet SDK (não crítico):', error);
        // Continua mesmo se desconexão SDK falhar
      }
    }
  }

  // Extrai mensagem de erro amigável para o usuário
  getErrorMessage(error) {
    if (!error) return 'Erro desconhecido';
    
    const errorStr = error.message || error.toString() || '';
    
    // Mensagens específicas de OAuth
    if (errorStr.includes('popup') || errorStr.includes('blocked')) {
      return 'Popup bloqueado. Permita popups para este site.';
    }
    if (errorStr.includes('cancelled') || errorStr.includes('canceled')) {
      return 'Conexão cancelada pelo usuário.';
    }
    if (errorStr.includes('network') || errorStr.includes('fetch')) {
      return 'Erro de conexão. Verifique sua internet.';
    }
    if (errorStr.includes('timeout')) {
      return 'Tempo esgotado. Tente novamente.';
    }
    
    // Mensagem genérica se não identificar tipo específico
    return errorStr.length > 100 ? 'Erro ao conectar. Tente novamente.' : errorStr;
  }

  // Reporta erro internamente (para analytics/monitoramento)
  reportError(strategy, error) {
    try {
      // Pode enviar para serviço de analytics, logging, etc.
      const errorData = {
        strategy,
        error: error?.message || error?.toString(),
        timestamp: Date.now(),
        userAgent: navigator.userAgent,
        url: window.location.href
      };
      
      // Log interno (pode ser expandido para enviar a serviço externo)
      window.Logger?.error('Wallet connection error:', errorData);
      
      // Opcional: enviar para endpoint de erro (se existir)
      if (typeof fetch !== 'undefined' && window.location.hostname !== 'localhost') {
        fetch('/api/error', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(errorData)
        }).catch(() => {
          // Ignora erros de reporte (não crítico)
        });
      }
    } catch (reportError) {
      // Ignora erros de reporte (não crítico)
      console.debug('Erro ao reportar erro:', reportError);
    }
  }

  // Busca balance do token usando SDK (quando disponível), Thirdweb API ou RPC direto
  async fetchBalance() {
    if (!this.address) return;
    
    // Prioridade 1: Tenta usar SDK Thirdweb extensions/erc20 (mais robusto)
    // Nota: Requer import ESM: import { getContract, balanceOf } from "thirdweb/extensions/erc20"
    // Por enquanto, usa API REST (mais compatível com CDN)
    // Para migração futura ESM, descomente e ajuste:
    /*
    if (this.client && thirdwebSDK && this.account) {
      try {
        const { getContract } = thirdwebSDK;
        const { balanceOf } = thirdwebSDK.extensions?.erc20 || {};
        
        if (getContract && balanceOf) {
          const baseChain = thirdwebSDK.defineChain?.(8453) || { id: 8453 };
          const contract = getContract({
            client: this.client,
            chain: baseChain,
            address: TOKEN_CONFIG.address
          });
          
          const balance = await balanceOf({
            contract,
            address: this.address
          });
          
          const decimals = BigInt(10 ** TOKEN_CONFIG.decimals);
          const intPart = balance / decimals;
          const decPart = (balance % decimals) / BigInt(10 ** (TOKEN_CONFIG.decimals - 2));
          this.balance = `${intPart}.${decPart.toString().padStart(2, '0')}`;
          this.updateBalanceDisplay();
          return;
        }
      } catch (error) {
        window.Logger?.debug('SDK balanceOf não disponível, tentando API:', error);
      }
    }
    */
    
    // Prioridade 2: Tenta usar Thirdweb API REST (mais confiável que RPC direto)
    if (THIRDWEB_CLIENT_ID) {
      try {
        const response = await fetch(
          `https://pay.thirdweb.com/v1/wallets/${this.address}/balance?chainId=${TOKEN_CONFIG.chainId}&tokenAddress=${TOKEN_CONFIG.address}`,
          {
            headers: {
              'x-client-id': THIRDWEB_CLIENT_ID
            }
          }
        );
        
        if (response.ok) {
          const data = await response.json();
          if (data.result) {
            const balanceValue = data.result.balance || data.result.value || data.result;
            if (balanceValue !== undefined && balanceValue !== null) {
              const balance = typeof balanceValue === 'string' 
                ? BigInt(balanceValue.startsWith('0x') ? balanceValue : `0x${balanceValue}`)
                : BigInt(balanceValue);
              const decimals = BigInt(10 ** TOKEN_CONFIG.decimals);
              const intPart = balance / decimals;
              const decPart = (balance % decimals) / BigInt(10 ** (TOKEN_CONFIG.decimals - 2));
              this.balance = `${intPart}.${decPart.toString().padStart(2, '0')}`;
              this.updateBalanceDisplay();
              return;
            }
          }
        }
      } catch (error) {
        window.Logger?.debug('Thirdweb API não disponível, usando RPC direto');
      }
    }
    
    // Fallback: RPC direto da Base usando endpoint público
    try {
      // Tenta múltiplos endpoints públicos da Base
      const rpcEndpoints = [
        'https://base-mainnet.g.alchemy.com/v2/demo',
        'https://base.llamarpc.com',
        'https://base.publicnode.com',
        'https://mainnet.base.org'
      ];
      
      let lastError = null;
      for (const rpcUrl of rpcEndpoints) {
        try {
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
            throw new Error(`RPC error: ${response.status}`);
          }
          
          const json = await response.json();
          
          // Verifica se há erro na resposta
          if (json.error) {
            throw new Error(json.error.message || 'RPC error');
          }
          
          if (json.result && json.result !== '0x' && json.result !== '0x0') {
            const balance = BigInt(json.result);
            const decimals = BigInt(10 ** TOKEN_CONFIG.decimals);
            const intPart = balance / decimals;
            const decPart = (balance % decimals) / BigInt(10 ** (TOKEN_CONFIG.decimals - 2));
            this.balance = `${intPart}.${decPart.toString().padStart(2, '0')}`;
            this.updateBalanceDisplay();
            return; // Sucesso, sai do loop
          } else {
            this.balance = '0.00';
            this.updateBalanceDisplay();
            return; // Saldo zero é válido
          }
        } catch (error) {
          lastError = error;
          // Continua tentando próximo endpoint
          continue;
        }
      }
      
      // Se todos os endpoints falharam
      throw lastError || new Error('Todos os endpoints RPC falharam');
    } catch (error) {
      console.error('Erro ao buscar balance:', error);
      this.balance = '0.00';
      this.updateBalanceDisplay();
      
      // Log apenas erros não relacionados a CORS
      if (error.message && !error.message.includes('CORS') && !error.message.includes('Failed to fetch')) {
        window.Logger?.warn('Não foi possível buscar saldo do token. Verifique sua conexão.');
      }
    }
  }

  // Atualiza display do balance
  updateBalanceDisplay() {
    const balanceEl = document.getElementById('wallet-balance');
    if (balanceEl) {
      balanceEl.textContent = this.formatBalance(this.balance);
    }
  }

  // Copia endereço
  copyAddress() {
    if (this.address) {
      navigator.clipboard.writeText(this.address);
      this.showToast('📋 Endereço copiado!');
    }
  }

  // Abre explorer
  viewOnExplorer() {
    if (this.address) {
      window.open(`https://basescan.org/address/${this.address}`, '_blank');
    }
  }

  // Desconecta (sempre chama disconnectWallet para limpar autenticação persistente)
  async disconnect() {
    // IMPORTANTE: Sempre desconectar do SDK para limpar autenticação persistente
    await this.disconnectWallet();
    
    this.connected = false;
    this.address = null;
    this.balance = null;
    this.account = null;
    localStorage.removeItem('wallet_state');
    this.updateButton();
    this.updateModalState();
    this.showToast('👋 Wallet desconectada');
  }

  // Toast notification
  showToast(message) {
    const toast = document.createElement('div');
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
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
      toast.style.animation = 'toast-out 0.3s ease forwards';
      setTimeout(() => toast.remove(), 300);
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
WalletManager.connectApple = () => window.WalletManager.connectApple();
WalletManager.connectX = () => window.WalletManager.connectX();
WalletManager.connectTelegram = () => window.WalletManager.connectTelegram();
WalletManager.connectWallet = () => window.WalletManager.connectWallet();
WalletManager.copyAddress = () => window.WalletManager.copyAddress();
WalletManager.viewOnExplorer = () => window.WalletManager.viewOnExplorer();
WalletManager.disconnect = () => window.WalletManager.disconnect();
