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
              <button class="wallet-option" onclick="WalletManager.connectWallet()">
                <span class="wallet-option-icon">🦊</span>
                <span>Wallet</span>
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
        document.getElementById('wallet-balance').textContent = this.formatBalance(this.balance);
      }
    } else {
      disconnected.style.display = 'block';
      connected.style.display = 'none';
    }
  }

  // Atualiza botão do header
  updateButton() {
    const btn = document.getElementById('wallet-btn');
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

  // Conexão via Email (Embedded Wallet)
  async connectEmail() {
    const email = prompt('Digite seu email:');
    if (!email || !email.includes('@')) {
      alert('Email inválido');
      return;
    }
    
    await this.simulateConnect(email);
  }

  // Conexão via Google
  async connectGoogle() {
    // Redireciona para OAuth do Thirdweb
    if (THIRDWEB_CLIENT_ID) {
      const redirectUrl = encodeURIComponent(window.location.href);
      window.location.href = `https://embedded-wallet.thirdweb.com/auth/google?clientId=${THIRDWEB_CLIENT_ID}&redirectUrl=${redirectUrl}`;
    } else {
      await this.simulateConnect('google');
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

  // Simula conexão (para demo sem Thirdweb configurado)
  async simulateConnect(method) {
    // Gera endereço mock baseado no método
    const hash = await this.hashString(method + Date.now());
    this.address = '0x' + hash.slice(0, 40);
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

  // Busca balance do token
  async fetchBalance() {
    if (!this.address) return;
    
    try {
      const response = await fetch('https://mainnet.base.org', {
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
      
      const json = await response.json();
      if (json.result && json.result !== '0x') {
        const balance = BigInt(json.result);
        const decimals = BigInt(10 ** TOKEN_CONFIG.decimals);
        const intPart = balance / decimals;
        const decPart = (balance % decimals) / BigInt(10 ** (TOKEN_CONFIG.decimals - 2));
        this.balance = `${intPart}.${decPart.toString().padStart(2, '0')}`;
      } else {
        this.balance = '0.00';
      }
      
      document.getElementById('wallet-balance').textContent = this.formatBalance(this.balance);
    } catch (error) {
      console.error('Erro ao buscar balance:', error);
      this.balance = '0.00';
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

  // Desconecta
  disconnect() {
    this.connected = false;
    this.address = null;
    this.balance = null;
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
WalletManager.connectWallet = () => window.WalletManager.connectWallet();
WalletManager.copyAddress = () => window.WalletManager.copyAddress();
WalletManager.viewOnExplorer = () => window.WalletManager.viewOnExplorer();
WalletManager.disconnect = () => window.WalletManager.disconnect();
