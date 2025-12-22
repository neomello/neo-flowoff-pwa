/**
 * Thirdweb Widgets - JavaScript Vanilla Implementation
 * Implementa ConnectEmbed e BuyWidget usando Thirdweb SDK v5 (sem React)
 * 
 * Token: $NEOFLW na Base Network
 */

// Configuração
const THIRDWEB_CONFIG = {
  clientId: window.THIRDWEB_CLIENT_ID || '',
  chainId: 8453, // Base
  tokenAddress: '0x6575933669e530dC25aaCb496cD8e402B8f26Ff5', // NEOFLW
  chainName: 'base'
};

// Inicializa cliente Thirdweb quando SDK estiver carregado
let thirdwebClient = null;
let baseChain = null;

function initThirdweb() {
  if (typeof thirdweb === 'undefined') {
    console.warn('Thirdweb SDK não carregado ainda');
    return false;
  }

  try {
    // Cria cliente Thirdweb usando API do SDK v5
    thirdwebClient = thirdweb.createThirdwebClient({
      clientId: THIRDWEB_CONFIG.clientId
    });

    // Define chain Base usando helper do SDK
    baseChain = thirdweb.defineChain(THIRDWEB_CONFIG.chainId);

    console.log('✅ Thirdweb inicializado');
    return true;
  } catch (error) {
    console.error('❌ Erro ao inicializar Thirdweb:', error);
    // Fallback: usa configuração manual
    baseChain = {
      id: THIRDWEB_CONFIG.chainId,
      name: 'Base',
      nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
      rpc: 'https://mainnet.base.org'
    };
    return true;
  }
}

/**
 * ConnectEmbed Widget - Login/Cadastro com Embedded Wallet
 * Suporta: Email, Google, Apple, X, Telegram
 */
class ConnectEmbedWidget {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.wallet = null;
    this.connected = false;
    this.address = null;
  }

  async init() {
    if (!initThirdweb()) {
      this.showError('Thirdweb SDK não carregado');
      return;
    }

    if (!this.container) {
      console.error('Container não encontrado:', this.containerId);
      return;
    }

    this.render();
    await this.checkConnection();
  }

  async checkConnection() {
    try {
      // Verifica se já existe wallet conectada
      const savedWallet = localStorage.getItem('thirdweb_wallet');
      if (savedWallet) {
        const walletData = JSON.parse(savedWallet);
        this.address = walletData.address;
        this.connected = true;
        this.render();
      }
    } catch (error) {
      console.error('Erro ao verificar conexão:', error);
    }
  }

  render() {
    if (this.connected) {
      this.renderConnected();
    } else {
      this.renderDisconnected();
    }
  }

  renderDisconnected() {
    this.container.innerHTML = `
      <div class="connect-embed-widget">
        <div class="connect-embed-header">
          <h3>🪙 Conecte sua Wallet</h3>
          <p class="connect-embed-subtitle">Cadastro ultra-simples • Sem MetaMask necessário</p>
        </div>
        
        <div class="connect-embed-body">
          <div class="connect-options">
            <button class="connect-option-btn" data-strategy="email" onclick="connectEmbed.connect('email')">
              <span class="connect-icon">📧</span>
              <span>Email</span>
            </button>
            
            <button class="connect-option-btn" data-strategy="google" onclick="connectEmbed.connect('google')">
              <span class="connect-icon">G</span>
              <span>Google</span>
            </button>
            
            <button class="connect-option-btn" data-strategy="apple" onclick="connectEmbed.connect('apple')">
              <span class="connect-icon">🍎</span>
              <span>Apple</span>
            </button>
            
            <button class="connect-option-btn" data-strategy="x" onclick="connectEmbed.connect('x')">
              <span class="connect-icon">𝕏</span>
              <span>X (Twitter)</span>
            </button>
            
            <button class="connect-option-btn" data-strategy="telegram" onclick="connectEmbed.connect('telegram')">
              <span class="connect-icon">✈️</span>
              <span>Telegram</span>
            </button>
            
            <button class="connect-option-btn connect-wallet" data-strategy="wallet" onclick="connectEmbed.connect('wallet')">
              <span class="connect-icon">🦊</span>
              <span>MetaMask/Wallet</span>
            </button>
          </div>
          
          <div class="connect-info">
            <p>✨ Wallet criada automaticamente após login</p>
            <p>🔒 Seguro e descentralizado</p>
          </div>
        </div>
      </div>
    `;
  }

  renderConnected() {
    const shortAddress = `${this.address.slice(0, 6)}...${this.address.slice(-4)}`;
    this.container.innerHTML = `
      <div class="connect-embed-widget connected">
        <div class="connect-embed-header">
          <h3>✅ Wallet Conectada</h3>
        </div>
        
        <div class="connect-embed-body">
          <div class="wallet-info">
            <div class="wallet-address">
              <span class="wallet-label">Endereço:</span>
              <span class="wallet-value">${shortAddress}</span>
            </div>
            <button class="disconnect-btn" onclick="connectEmbed.disconnect()">Desconectar</button>
          </div>
        </div>
      </div>
    `;
  }

  async connect(strategy) {
    if (!THIRDWEB_CONFIG.clientId) {
      this.showError('Thirdweb Client ID não configurado');
      return;
    }

    try {
      // Para embedded wallet, usa o modal/iframe do Thirdweb
      if (strategy === 'wallet') {
        // Conecta wallet externa via SDK
        if (typeof thirdweb !== 'undefined' && initThirdweb()) {
          try {
            const wallet = await thirdweb.connect({
              client: thirdwebClient,
              chain: baseChain
            });
            const account = await wallet.getAccount();
            this.address = account.address;
            this.connected = true;
            this.saveAndRender(strategy);
          } catch (error) {
            console.error('Erro ao conectar wallet externa:', error);
            this.showError('Erro ao conectar wallet. Verifique se MetaMask está instalado.');
          }
        }
      } else {
        // Para login social/email, abre modal do Thirdweb Embedded Wallet
        const authUrl = `https://embedded-wallet.thirdweb.com/auth/${strategy}?` +
          `clientId=${THIRDWEB_CONFIG.clientId}&` +
          `chainId=${THIRDWEB_CONFIG.chainId}&` +
          `redirectUrl=${encodeURIComponent(window.location.href)}`;
        
        // Abre em popup ou redireciona
        const popup = window.open(
          authUrl,
          'thirdweb-auth',
          'width=500,height=700,scrollbars=yes,resizable=yes'
        );

        // Escuta mensagem do popup quando autenticação completa
        window.addEventListener('message', (event) => {
          if (event.origin.includes('thirdweb.com') && event.data.type === 'WALLET_CONNECTED') {
            this.address = event.data.address;
            this.connected = true;
            this.saveAndRender(strategy);
            if (popup) popup.close();
          }
        });
      }
    } catch (error) {
      console.error('Erro ao conectar:', error);
      this.showError(`Erro ao conectar: ${error.message || 'Tente novamente'}`);
    }
  }

  saveAndRender(strategy) {
    localStorage.setItem('thirdweb_wallet', JSON.stringify({
      address: this.address,
      strategy: strategy,
      timestamp: Date.now()
    }));
    this.render();
    this.onConnected();
  }

  disconnect() {
    this.connected = false;
    this.address = null;
    this.wallet = null;
    localStorage.removeItem('thirdweb_wallet');
    this.render();
    this.onDisconnected();
  }

  onConnected() {
    // Callback quando conecta
    if (window.onWalletConnected) {
      window.onWalletConnected(this.address);
    }
    
    // Dispara evento customizado
    window.dispatchEvent(new CustomEvent('walletConnected', {
      detail: { address: this.address }
    }));
  }

  onDisconnected() {
    // Callback quando desconecta
    if (window.onWalletDisconnected) {
      window.onWalletDisconnected();
    }
    
    window.dispatchEvent(new CustomEvent('walletDisconnected'));
  }

  showError(message) {
    this.container.innerHTML = `
      <div class="connect-embed-widget error">
        <p>❌ ${message}</p>
      </div>
    `;
  }

  getWallet() {
    return this.wallet;
  }

  getAddress() {
    return this.address;
  }

  isConnected() {
    return this.connected;
  }
}

/**
 * BuyWidget - Widget de Compra de Token NEOFLW
 * Permite comprar NEOFLW via cartão/PIX/etc usando Thirdweb Payments
 */
class BuyWidget {
  constructor(containerId, options = {}) {
    this.container = document.getElementById(containerId);
    this.options = {
      amount: options.amount || '50', // Quantidade em NEOFLW ou ETH
      theme: options.theme || 'dark',
      tokenAddress: options.tokenAddress || THIRDWEB_CONFIG.tokenAddress,
      ...options
    };
  }

  async init() {
    if (!initThirdweb()) {
      this.showError('Thirdweb SDK não carregado');
      return;
    }

    if (!this.container) {
      console.error('Container não encontrado:', this.containerId);
      return;
    }

    this.render();
  }

  render() {
    this.container.innerHTML = `
      <div class="buy-widget ${this.options.theme}">
        <div class="buy-widget-header">
          <h3>💰 Comprar $NEOFLW</h3>
          <p class="buy-widget-subtitle">Compre tokens diretamente • Sem KYC complexo</p>
        </div>
        
        <div class="buy-widget-body">
          <div class="buy-amount-section">
            <label>Quantidade:</label>
            <div class="buy-amount-input">
              <input type="number" id="buy-amount" value="${this.options.amount}" min="1" step="0.01">
              <select id="buy-currency">
                <option value="NEOFLW">NEOFLW</option>
                <option value="ETH">ETH</option>
              </select>
            </div>
          </div>
          
          <div class="buy-methods">
            <p class="buy-methods-title">Métodos de pagamento:</p>
            <div class="buy-methods-grid">
              <div class="buy-method-card">
                <span class="buy-method-icon">💳</span>
                <span>Cartão</span>
              </div>
              <div class="buy-method-card">
                <span class="buy-method-icon">🏦</span>
                <span>PIX</span>
              </div>
              <div class="buy-method-card">
                <span class="buy-method-icon">🌐</span>
                <span>Transferência</span>
              </div>
            </div>
          </div>
          
          <button class="buy-btn" onclick="buyWidget.executeBuy()">
            Comprar $NEOFLW
          </button>
          
          <div class="buy-info">
            <p>🔒 Transações seguras via Thirdweb Payments</p>
            <p>⚡ Processamento rápido</p>
          </div>
        </div>
      </div>
    `;
  }

  async executeBuy() {
    const amount = document.getElementById('buy-amount')?.value || this.options.amount;
    const currency = document.getElementById('buy-currency')?.value || 'NEOFLW';

    // Verifica se wallet está conectada
    if (!connectEmbed || !connectEmbed.isConnected()) {
      alert('Por favor, conecte sua wallet primeiro!');
      connectEmbed?.init();
      return;
    }

    try {
      // Usa Thirdweb Payments para compra
      // Nota: Esta é uma implementação simplificada
      // Para produção completa, use a API de Payments do Thirdweb
      
      const buyUrl = `https://payments.thirdweb.com/buy?` +
        `clientId=${THIRDWEB_CONFIG.clientId}&` +
        `chainId=${THIRDWEB_CONFIG.chainId}&` +
        `tokenAddress=${this.options.tokenAddress}&` +
        `amount=${amount}&` +
        `currency=${currency}`;

      // Abre em nova aba ou iframe
      window.open(buyUrl, '_blank', 'width=600,height=800');
      
    } catch (error) {
      console.error('Erro ao executar compra:', error);
      this.showError(`Erro ao comprar: ${error.message}`);
    }
  }

  showError(message) {
    this.container.innerHTML = `
      <div class="buy-widget error">
        <p>❌ ${message}</p>
      </div>
    `;
  }
}

// Instâncias globais
let connectEmbed = null;
let buyWidget = null;

// Inicializa quando DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
  // Aguarda SDK carregar
  if (typeof thirdweb !== 'undefined') {
    initWidgets();
  } else {
    // Aguarda SDK carregar via CDN
    window.addEventListener('load', () => {
      setTimeout(initWidgets, 1000);
    });
  }
});

function initWidgets() {
  // Inicializa ConnectEmbed se container existir
  const connectContainer = document.getElementById('connect-embed-container');
  if (connectContainer) {
    connectEmbed = new ConnectEmbedWidget('connect-embed-container');
    connectEmbed.init();
  }

  // Inicializa BuyWidget se container existir
  const buyContainer = document.getElementById('buy-widget-container');
  if (buyContainer) {
    buyWidget = new BuyWidget('buy-widget-container');
    buyWidget.init();
  }
}

// Exporta para uso global
window.ConnectEmbedWidget = ConnectEmbedWidget;
window.BuyWidget = BuyWidget;
window.connectEmbed = connectEmbed;
window.buyWidget = buyWidget;

