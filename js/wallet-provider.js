/**
 * Wallet Provider - NEØ FlowOFF
 *
 * Estado Atual: Sistema em desenvolvimento ativo
 * - MetaMask: ✅ Funcional
 * - Web3Auth: 🚧 Em implementação
 * - WalletConnect: 🚧 Em implementação
 * - Embedded Wallets: 🚧 Em implementação
 *
 * Para transparência com usuários, este arquivo informa claramente
 * o estado atual do sistema wallet.
 */

// Estado atual do sistema wallet
const WALLET_SYSTEM_STATUS = {
  metamask: 'functional',
  web3auth: 'implementing',
  walletconnect: 'implementing',
  embedded: 'implementing',
  smartAccounts: 'implementing'
};

// Modal informativo sobre estado do sistema
function showWalletStatusModal(feature) {
  const modal = document.createElement('dialog');
  modal.className = 'wallet-status-modal';
  modal.innerHTML = `
    <div class="wallet-status-content">
      <div class="status-header">
        <div class="status-icon">🔄</div>
        <h3>Sistema Wallet em Desenvolvimento</h3>
        <button class="status-close" onclick="this.closest('dialog').close()">×</button>
      </div>

      <div class="status-body">
        <p><strong>MetaMask:</strong> ✅ Funcional - Use para conectar</p>
        <p><strong>Web3Auth:</strong> 🚧 Em implementação</p>
        <p><strong>WalletConnect:</strong> 🚧 Em implementação</p>
        <p><strong>Carteiras Embutidas:</strong> 🚧 Em implementação</p>

        <div class="status-divider"></div>

        <p class="status-message">
          Estamos desenvolvendo uma experiência completa de wallet.
          Por enquanto, use <strong>MetaMask</strong> para acessar todas as funcionalidades.
        </p>

        <div class="status-actions">
          <button class="btn primary" onclick="window.WalletManager?.connectMetaMask()">
            Usar MetaMask
          </button>
          <button class="btn ghost" onclick="this.closest('dialog').close()">
            Entendi
          </button>
        </div>
      </div>
    </div>
  `;

  // Estilos inline para o modal
  const style = document.createElement('style');
  style.textContent = `
    .wallet-status-modal {
      border: none;
      border-radius: 20px;
      padding: 0;
      max-width: 450px;
      background: linear-gradient(180deg, rgba(15,15,24,.95), rgba(8,8,12,.85));
      backdrop-filter: blur(20px);
      box-shadow: 0 20px 40px rgba(0,0,0,.5);
    }

    .wallet-status-modal::backdrop {
      background: rgba(0,0,0,0.7);
      backdrop-filter: blur(8px);
    }

    .wallet-status-content {
      color: white;
      padding: 0;
    }

    .status-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 24px 24px 0;
    }

    .status-icon {
      font-size: 24px;
    }

    .status-header h3 {
      margin: 0;
      font-size: 18px;
      font-weight: 600;
    }

    .status-close {
      background: none;
      border: none;
      color: rgba(255,255,255,0.7);
      font-size: 24px;
      cursor: pointer;
      padding: 4px;
      border-radius: 50%;
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;
    }

    .status-close:hover {
      background: rgba(255,255,255,0.1);
      color: white;
    }

    .status-body {
      padding: 24px;
    }

    .status-body p {
      margin: 8px 0;
      line-height: 1.5;
    }

    .status-divider {
      height: 1px;
      background: rgba(255,255,255,0.1);
      margin: 20px 0;
    }

    .status-message {
      background: rgba(255,47,179,0.1);
      border: 1px solid rgba(255,47,179,0.2);
      border-radius: 12px;
      padding: 16px;
      margin: 16px 0;
      text-align: center;
    }

    .status-actions {
      display: flex;
      gap: 12px;
      margin-top: 24px;
    }

    .status-actions .btn {
      flex: 1;
    }
  `;

  document.head.appendChild(style);
  document.body.appendChild(modal);
  modal.showModal();

  // Fechar ao clicar fora
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.close();
      modal.remove();
      style.remove();
    }
  });
}

// Provider principal - estado honesto
window.WalletProvider = {
  // Inicialização
  init: function() {
    console.log('🔄 Wallet Provider: Sistema em desenvolvimento ativo');
    console.log('✅ MetaMask: Funcional');
    console.log('🚧 Web3Auth: Em implementação');
    console.log('🚧 WalletConnect: Em implementação');
  },

  // Conexão - redireciona para funcionalidades existentes
  connect: function() {
    console.log('🎯 Wallet Connect: Redirecionando para sistema funcional');

    // Se MetaMask estiver disponível, conectar diretamente
    if (window.WalletManager && typeof window.ethereum !== 'undefined') {
      window.WalletManager.connectMetaMask();
      return;
    }

    // Caso contrário, mostrar status e abrir modal
    showWalletStatusModal('connect');
  },

  // Compra - informa sobre desenvolvimento
  buy: function() {
    console.log('💰 Wallet Buy: Sistema em desenvolvimento');
    showWalletStatusModal('buy');
  },

  // Status do sistema
  getStatus: function() {
    return WALLET_SYSTEM_STATUS;
  },

  // Verificar se funcionalidade está disponível
  isAvailable: function(feature) {
    return WALLET_SYSTEM_STATUS[feature] === 'functional';
  }
};

// Log inicial
console.log('🎯 Wallet Provider carregado - Estado: DESENVOLVIMENTO ATIVO');
console.log('💡 Use MetaMask para funcionalidades completas');
console.log('📊 Status:', WALLET_SYSTEM_STATUS);
