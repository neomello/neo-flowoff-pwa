/**
 * Wallet Manager - RPC Direct Integration
 * Gerencia conexão de wallet via RPC direto (preparado para migração futura)
 *
 * Token: $NEOFLW na Polygon
 *
 * Nota: Preparado para integração futura com ZeroDev/WalletConnect/Base x402
 *
 * ⚠️ STATUS: Wallet implementada mas aguardando backend Neon SQL
 * Para habilitar: defina window.WALLET_ENABLED = true
 */



// Configuração do Token
// Configuração do Token
const TOKEN_CONFIG = {
  address: '0x41F4ff3d45DED9C1332e4908F637B75fe83F5d6B',
  symbol: 'NEOFLW',
  name: 'NEOFlowOFF',
  decimals: 18,
  chainId: 8453, // Base Mainnet
  chain: 'base',
};

class WalletManager {
  constructor() {
    this.connected = false;
    this.address = null;
    this.balance = null;
    this.modal = null;
    this.rpcRequestCount = 0;
    this.rpcRequestResetTime = 60000; // 1 minuto
    this.lastRpcRequestTime = 0;
    this.maxRpcRequestsPerMinute = 10;
    this.init();
  }

  init() {
    this.createModal();
    this.loadState();
  }



  // Carrega estado salvo
  loadState() {
    const state = window.SecurityUtils?.safeLocalStorageGet(
      'wallet_state',
      null
    );
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
        window.Logger?.error(
          'Tentativa de salvar endereço inválido:',
          this.address
        );
        return;
      }

      window.SecurityUtils?.safeLocalStorageSet('wallet_state', {
        address: this.address,
        timestamp: Date.now(),
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
    desc.textContent =
      'Conecte sua wallet para acessar o ecossistema NEØ.FLOWOFF';

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

    // Botão MetaMask
    const metamaskBtn = document.createElement('button');
    metamaskBtn.className = 'wallet-option wallet-option-primary';
    metamaskBtn.addEventListener('click', () => this.connectMetaMask());
    const metamaskIcon = document.createElement('span');
    metamaskIcon.className = 'wallet-option-icon';
    metamaskIcon.innerHTML =
      '<svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M22.56 2.5L12.5 9.5L2.44 2.5L12.5 0L22.56 2.5Z" fill="#E2761B"/><path d="M2.44 2.5L12.5 9.5L22.56 2.5L12.5 0L2.44 2.5Z" fill="#E4761B"/><path d="M22.56 2.5L12.5 9.5L2.44 2.5L12.5 0L22.56 2.5Z" fill="#CD6116"/></svg>';
    const metamaskText = document.createElement('span');
    metamaskText.textContent = 'MetaMask';
    metamaskBtn.appendChild(metamaskIcon);
    metamaskBtn.appendChild(metamaskText);

    // Botão Web3Auth (Embedded Wallets)
    const web3authBtn = document.createElement('button');
    web3authBtn.className = 'wallet-option';
    web3authBtn.addEventListener('click', () => this.connectWeb3Auth());
    const web3authIcon = document.createElement('span');
    web3authIcon.className = 'wallet-option-icon';
    web3authIcon.innerHTML =
      '<svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" fill="#8B5CF6"/></svg>';
    const web3authText = document.createElement('span');
    web3authText.textContent = 'Web3Auth';
    web3authBtn.appendChild(web3authIcon);
    web3authBtn.appendChild(web3authText);

    // Botão WalletConnect
    const walletConnectBtn = document.createElement('button');
    walletConnectBtn.className = 'wallet-option';
    walletConnectBtn.addEventListener('click', () =>
      this.connectWalletConnect()
    );
    const walletConnectIcon = document.createElement('span');
    walletConnectIcon.className = 'wallet-option-icon';
    walletConnectIcon.innerHTML =
      '<svg width="24" height="24" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" fill="#3B99FC"/></svg>';
    const walletConnectText = document.createElement('span');
    walletConnectText.textContent = 'WalletConnect';
    walletConnectBtn.appendChild(walletConnectIcon);
    walletConnectBtn.appendChild(walletConnectText);

    // Separador
    const separator = document.createElement('div');
    separator.className = 'wallet-separator';
    const separatorLine = document.createElement('div');
    separatorLine.className = 'wallet-separator-line';
    const separatorText = document.createElement('span');
    separatorText.textContent = 'ou';
    separator.appendChild(separatorLine);
    separator.appendChild(separatorText);
    separator.appendChild(separatorLine.cloneNode(true));

    options.appendChild(metamaskBtn);
    options.appendChild(web3authBtn);
    options.appendChild(walletConnectBtn);
    options.appendChild(separator);
    options.appendChild(emailBtn);
    options.appendChild(googleBtn);

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
    // Criar links de forma segura (sem innerHTML)
    const termsText1 = document.createTextNode('Eu aceito os ');
    const termsLink1 = document.createElement('a');
    termsLink1.href = 'terms.html';
    termsLink1.target = '_blank';
    termsLink1.rel = 'noopener';
    termsLink1.textContent = 'Termos e Condições';
    const termsText2 = document.createTextNode(' e a ');
    const termsLink2 = document.createElement('a');
    termsLink2.href = 'privacy.html';
    termsLink2.target = '_blank';
    termsLink2.rel = 'noopener';
    termsLink2.textContent = 'Política de Privacidade';

    termsSpan.appendChild(termsText1);
    termsSpan.appendChild(termsLink1);
    termsSpan.appendChild(termsText2);
    termsSpan.appendChild(termsLink2);
    termsLabel.appendChild(termsCheckbox);
    termsLabel.appendChild(termsSpan);
    terms.appendChild(termsLabel);

    // Network
    const network = document.createElement('p');
    network.className = 'wallet-network';
    const networkDot = document.createElement('span');
    networkDot.className = 'network-dot';
    network.appendChild(networkDot);
    network.appendChild(document.createTextNode(' Base Mainnet'));

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

    // Estilos são carregados via css/wallet.css
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
    return num.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  // Verifica se termos foram aceitos
  checkTermsAccepted() {
    const checkbox = document.getElementById('wallet-terms-accept');
    if (!checkbox || !checkbox.checked) {
      alert(
        'Por favor, aceite os Termos e Condições e a Política de Privacidade para continuar.'
      );
      return false;
    }
    return true;
  }

  // Conexão via Email (Embedded Wallet)
  async connectEmail() {
    if (!this.checkTermsAccepted()) return;

    // Criar modal seguro para entrada de email (não usar prompt())
    const emailModal = document.createElement('dialog');
    emailModal.className = 'wallet-modal';
    emailModal.style.cssText = `
      border: none;
      border-radius: 16px;
      padding: 24px;
      max-width: 400px;
      background: linear-gradient(180deg, rgba(20, 20, 30, 0.98), rgba(10, 10, 15, 0.98));
      backdrop-filter: blur(20px);
    `;

    const emailForm = document.createElement('form');
    emailForm.method = 'dialog';

    const title = document.createElement('h3');
    title.textContent = 'Conectar com Email';
    title.style.cssText = 'margin: 0 0 16px 0; color: white;';

    const emailInput = document.createElement('input');
    emailInput.type = 'email';
    emailInput.placeholder = 'seuemail@exemplo.com';
    emailInput.required = true;
    emailInput.autocomplete = 'email';
    emailInput.style.cssText = `
      width: 100%;
      padding: 12px;
      border: 1px solid rgba(255,255,255,0.2);
      border-radius: 8px;
      background: rgba(255,255,255,0.05);
      color: white;
      margin-bottom: 16px;
      font-size: 14px;
    `;

    const buttonContainer = document.createElement('div');
    buttonContainer.style.cssText =
      'display: flex; gap: 8px; justify-content: flex-end;';

    const cancelBtn = document.createElement('button');
    cancelBtn.type = 'button';
    cancelBtn.textContent = 'Cancelar';
    cancelBtn.style.cssText =
      'padding: 8px 16px; background: rgba(255,255,255,0.1); border: none; border-radius: 8px; color: white; cursor: pointer;';
    cancelBtn.addEventListener('click', () => emailModal.close());

    const submitBtn = document.createElement('button');
    submitBtn.type = 'submit';
    submitBtn.textContent = 'Conectar';
    submitBtn.style.cssText =
      'padding: 8px 16px; background: #8b5cf6; border: none; border-radius: 8px; color: white; cursor: pointer; font-weight: 600;';

    emailForm.appendChild(title);
    emailForm.appendChild(emailInput);
    buttonContainer.appendChild(cancelBtn);
    buttonContainer.appendChild(submitBtn);
    emailForm.appendChild(buttonContainer);
    emailModal.appendChild(emailForm);
    document.body.appendChild(emailModal);

    emailModal.showModal();

    emailForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = emailInput.value.trim();

      // Validação robusta de email
      if (!email || !window.SecurityUtils?.isValidEmail(email)) {
        alert('Email inválido. Por favor, digite um email válido.');
        return;
      }

      // Sanitiza email antes de usar
      const sanitizedEmail = window.SecurityUtils?.sanitizeInput(
        email,
        'email'
      );
      if (!sanitizedEmail) {
        alert('Email inválido');
        return;
      }

      emailModal.close();
      emailModal.remove();

      // Usa fallback (será substituído por ZeroDev/WalletConnect futuramente)
      await this.simulateConnect(sanitizedEmail);
    });

    // Fechar ao clicar fora
    emailModal.addEventListener('click', (e) => {
      if (e.target === emailModal) {
        emailModal.close();
        emailModal.remove();
      }
    });
  }

  // Conexão via Google
  async connectGoogle() {
    if (!this.checkTermsAccepted()) return;
    // Usa fallback (será substituído por ZeroDev/WalletConnect futuramente)
    await this.simulateConnect('google');
  }

  // Método auxiliar para processar conexão de wallet
  async handleConnect(address, method) {
    // Valida endereço antes de usar
    if (!address || !window.SecurityUtils?.isValidEthereumAddress(address)) {
      window.Logger?.warn('Endereço inválido retornado:', address);
      this.showNotification('Erro: endereço de wallet inválido.', 'error');
      return;
    }

    this.address = address;
    this.connected = true;
    this.saveState();
    this.updateButton();
    this.updateModalState();
    this.fetchBalance();
    this.showToast(`✅ Wallet conectada com sucesso! (${method})`);

    // Registra sessão no backend (se habilitado)
    if (WALLET_ENABLED) {
      this.recordWalletSession(address, method).catch((error) => {
        window.Logger?.warn('Falha ao registrar sessão no backend:', error);
        // Não exibe erro ao usuário - operação em background
      });
    }
  }

  // Registra sessão de wallet no backend Neon
  async recordWalletSession(walletAddress, provider) {
    try {
      const response = await fetch('/api/wallet-sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          wallet_address: walletAddress,
          provider: provider,
        }),
      });

      if (!response.ok) {
        throw new Error(`Erro ao registrar sessão: ${response.status}`);
      }

      const data = await response.json();
      window.Logger?.info('Sessão de wallet registrada:', data);
      return data;
    } catch (error) {
      window.Logger?.error('Erro ao registrar sessão de wallet:', error);
      throw error;
    }
  }

  // Callback quando Web3Auth conecta
  async onWeb3AuthConnected(provider) {
    try {
      // Extrair endereço do provider Web3Auth
      const accounts = await provider.request({ method: 'eth_accounts' });
      if (accounts && accounts[0]) {
        await this.handleConnect(accounts[0], 'Web3Auth');
        this.close();
      }
    } catch (error) {
      window.Logger?.error('Erro ao processar Web3Auth:', error);
      this.showNotification('Erro ao conectar via Web3Auth.', 'error');
    }
  }

  // Callback quando WalletConnect conecta
  async onWalletConnectConnected(provider) {
    try {
      // Extrair endereço do provider WalletConnect
      const address = provider.address;
      if (address) {
        await this.handleConnect(address, 'WalletConnect');
        this.close();
      }
    } catch (error) {
      window.Logger?.error('Erro ao processar WalletConnect:', error);
      this.showNotification('Erro ao conectar via WalletConnect.', 'error');
    }
  }

  // Callback quando provider está pronto
  onProviderReady(provider) {
    console.log('🔗 Wallet Provider pronto:', provider.getStatus());
    // Aqui você pode adicionar lógica adicional quando o provider estiver inicializado
  }

  // Conexão via MetaMask
  async connectMetaMask() {
    if (!this.checkTermsAccepted()) return;

    if (typeof window.ethereum === 'undefined') {
      this.showNotification(
        'MetaMask não detectado. Instale a extensão MetaMask.',
        'error'
      );
      window.open('https://metamask.io/download/', '_blank');
      return;
    }

    try {
      this.showLoading('Conectando ao MetaMask...');

      // Solicita conexão
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      });

      if (accounts && accounts.length > 0) {
        const address = accounts[0];

        // Verifica se está na rede correta (Polygon)
        const chainId = await window.ethereum.request({
          method: 'eth_chainId',
        });
        if (parseInt(chainId, 16) !== 137) {
          // Tenta trocar para Polygon
          try {
            await window.ethereum.request({
              method: 'wallet_switchEthereumChain',
              params: [{ chainId: '0x89' }], // Polygon Mainnet
            });
          } catch (switchError) {
            // Se a rede não existir, adiciona
            if (switchError.code === 4902) {
              await window.ethereum.request({
                method: 'wallet_addEthereumChain',
                params: [
                  {
                    chainId: '0x89',
                    chainName: 'Polygon Mainnet',
                    nativeCurrency: {
                      name: 'MATIC',
                      symbol: 'MATIC',
                      decimals: 18,
                    },
                    rpcUrls: [
                      window?.DRPC_RPC_KEY || 'https://polygon-rpc.com',
                    ], // DRPC_RPC_KEY já é URL completa
                    blockExplorerUrls: ['https://polygonscan.com'],
                  },
                ],
              });
            }
          }
        }

        await this.handleConnect(address, 'MetaMask');
        this.close();
      }
    } catch (error) {
      window.Logger?.error('Erro ao conectar MetaMask:', error);
      this.showNotification(
        'Erro ao conectar MetaMask. Tente novamente.',
        'error'
      );
    } finally {
      this.hideLoading();
    }
  }

  // Conexão via Web3Auth
  async connectWeb3Auth() {
    if (!this.checkTermsAccepted()) return;

    try {
      if (window.WalletProvider && window.WalletProvider.connectWeb3Auth) {
        await window.WalletProvider.connectWeb3Auth();
      } else {
        this.showNotification(
          'Web3Auth não está disponível. Use MetaMask.',
          'error'
        );
        // Fallback para MetaMask
        setTimeout(() => {
          this.connectMetaMask();
        }, 2000);
      }
    } catch (error) {
      window.Logger?.error('Erro Web3Auth:', error);
      this.showNotification(
        'Erro ao conectar via Web3Auth. Tente MetaMask.',
        'error'
      );
    }
  }

  // Conexão via WalletConnect
  async connectWalletConnect() {
    if (!this.checkTermsAccepted()) return;

    try {
      if (window.WalletProvider && window.WalletProvider.connectWalletConnect) {
        await window.WalletProvider.connectWalletConnect();
      } else {
        this.showNotification(
          'WalletConnect não está disponível. Use MetaMask.',
          'error'
        );
        // Fallback para MetaMask
        setTimeout(() => {
          this.connectMetaMask();
        }, 2000);
      }
    } catch (error) {
      window.Logger?.error('Erro WalletConnect:', error);
      this.showNotification(
        'Erro ao conectar via WalletConnect. Tente MetaMask.',
        'error'
      );
    }
  }

  // Conexão via Wallet externa (MetaMask, WalletConnect, etc)
  async connectWallet() {
    if (!this.checkTermsAccepted()) return;
    // Tenta detectar múltiplos providers
    const providers = this.detectWalletProviders();

    if (providers.length === 0) {
      // Fallback: Oferece opção de usar Email/Google
      const useFallback = confirm(
        'Nenhuma wallet detectada.\n\nDeseja usar Email ou Google para criar uma wallet?'
      );
      if (useFallback) {
        this.open();
        return;
      }
      alert(
        'Nenhuma wallet detectada. Instale MetaMask, Coinbase Wallet ou similar.'
      );
      return;
    }

    // Tenta conectar com o primeiro provider disponível
    for (const provider of providers) {
      try {
        const accounts = await provider.request({
          method: 'eth_requestAccounts',
        });
        if (accounts && accounts[0]) {
          const address = accounts[0];
          // Valida endereço antes de usar
          if (!window.SecurityUtils?.isValidEthereumAddress(address)) {
            window.Logger?.warn(
              'Endereço inválido retornado pelo provider:',
              address
            );
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
        window.Logger?.warn(
          `Erro ao conectar com ${provider.name || 'provider'}:`,
          error
        );
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

  // Simula conexão (será substituído por ZeroDev/WalletConnect futuramente)
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
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  }

  // Busca balance do token com fallback de RPC
  async fetchBalance() {
    if (!this.address) return;

    // Lista de RPCs da Polygon (com fallback)
    const rpcEndpoints = [
      // DRPC primeiro se disponível (DRPC_RPC_KEY já é URL completa)
      ...(window?.DRPC_RPC_KEY ? [window.DRPC_RPC_KEY] : []),
      'https://polygon-rpc.com',
      'https://rpc-mainnet.matic.network',
      'https://polygon-mainnet.g.alchemy.com/v2/demo',
      'https://polygon.publicnode.com',
      'https://1rpc.io/matic',
    ];

    // Busca balance via RPC direto (preparado para migração futura)
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

  // Busca balance via RPC direto com rate limiting e timeout
  async fetchBalanceFromRPC(rpcUrl) {
    // Rate limiting
    const now = Date.now();
    if (now - this.lastRpcRequestTime < this.rpcRequestResetTime) {
      this.rpcRequestCount++;
      if (this.rpcRequestCount > this.maxRpcRequestsPerMinute) {
        throw new Error('Rate limit excedido. Aguarde um momento.');
      }
    } else {
      this.rpcRequestCount = 1;
      this.lastRpcRequestTime = now;
    }

    // Validar endereço antes de fazer requisição
    if (
      !this.address ||
      !window.SecurityUtils?.isValidEthereumAddress(this.address)
    ) {
      throw new Error('Endereço inválido');
    }

    // Timeout de 10 segundos
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    try {
      const response = await fetch(rpcUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'eth_call',
          params: [
            {
              to: TOKEN_CONFIG.address,
              data:
                '0x70a08231000000000000000000000000' +
                this.address.slice(2).toLowerCase(),
            },
            'latest',
          ],
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const json = await response.json();

      if (json.error) {
        throw new Error(json.error.message || 'Erro na resposta RPC');
      }

      // Validar tamanho da resposta
      const resultStr = JSON.stringify(json);
      if (resultStr.length > 1000) {
        throw new Error('Resposta RPC muito grande');
      }

      if (json.result && json.result !== '0x' && json.result !== '0x0') {
        const balance = BigInt(json.result);
        const decimals = BigInt(10 ** TOKEN_CONFIG.decimals);
        const intPart = balance / decimals;
        const decPart =
          (balance % decimals) / BigInt(10 ** (TOKEN_CONFIG.decimals - 2));
        return `${intPart}.${decPart.toString().padStart(2, '0')}`;
      }

      return '0.00';
    } catch (error) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        throw new Error('Timeout ao buscar balance');
      }
      throw error;
    }
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
    const sanitizedAddress = window.SecurityUtils?.sanitizeInput(
      this.address,
      'address'
    );
    if (!sanitizedAddress) {
      this.showToast('❌ Erro ao abrir explorer');
      return;
    }

    try {
      window.open(
        `https://polygonscan.com/address/${sanitizedAddress}`,
        '_blank',
        'noopener,noreferrer'
      );
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

  // Mostra notificação no modal
  showNotification(message, type = 'info') {
    const body = this.modal?.querySelector('.wallet-modal-body');
    if (!body) {
      this.showToast(message);
      return;
    }

    // Remove notificação anterior se existir
    const existing = body.querySelector('.wallet-notification');
    if (existing) existing.remove();

    const notification = document.createElement('div');
    notification.className = `wallet-notification wallet-notification-${type}`;
    notification.textContent = message;
    notification.style.cssText = `
      padding: 12px 16px;
      margin-bottom: 16px;
      border-radius: 12px;
      font-size: 14px;
      font-weight: 500;
      animation: notificationSlideIn 0.3s ease;
      background: ${type === 'error' ? 'rgba(239, 68, 68, 0.2)' : type === 'success' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(59, 130, 246, 0.2)'};
      border: 1px solid ${type === 'error' ? 'rgba(239, 68, 68, 0.4)' : type === 'success' ? 'rgba(16, 185, 129, 0.4)' : 'rgba(59, 130, 246, 0.4)'};
      color: white;
    `;

    const disconnected = body.querySelector('#wallet-disconnected');
    if (disconnected && disconnected.style.display !== 'none') {
      disconnected.insertBefore(notification, disconnected.firstChild);
    } else {
      body.insertBefore(notification, body.firstChild);
    }

    setTimeout(() => {
      notification.style.animation = 'notificationSlideOut 0.3s ease';
      setTimeout(() => notification.remove(), 300);
    }, 4000);
  }

  // Mostra loading no modal
  showLoading(message = 'Carregando...') {
    const body = this.modal?.querySelector('.wallet-modal-body');
    if (!body) return;

    // Remove loading anterior se existir
    const existing = body.querySelector('.wallet-loading');
    if (existing) existing.remove();

    const loading = document.createElement('div');
    loading.className = 'wallet-loading';
    loading.innerHTML = `
      <div style="display: flex; flex-direction: column; align-items: center; gap: 12px; padding: 24px;">
        <div style="width: 40px; height: 40px; border: 3px solid rgba(255,255,255,0.1); border-top-color: #ff2fb3; border-radius: 50%; animation: spin 0.8s linear infinite;"></div>
        <span style="color: rgba(255,255,255,0.8); font-size: 14px;">${message}</span>
      </div>
    `;
    loading.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(10, 10, 16, 0.9);
      backdrop-filter: blur(4px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      border-radius: 24px;
    `;

    const style = document.createElement('style');
    style.textContent = `
      @keyframes spin {
        to { transform: rotate(360deg); }
      }
      @keyframes notificationSlideIn {
        from { opacity: 0; transform: translateY(-10px); }
        to { opacity: 1; transform: translateY(0); }
      }
      @keyframes notificationSlideOut {
        from { opacity: 1; transform: translateY(0); }
        to { opacity: 0; transform: translateY(-10px); }
      }
    `;
    if (!document.querySelector('#wallet-animations')) {
      style.id = 'wallet-animations';
      document.head.appendChild(style);
    }

    body.style.position = 'relative';
    body.appendChild(loading);
  }

  // Esconde loading
  hideLoading() {
    const body = this.modal?.querySelector('.wallet-modal-body');
    const loading = body?.querySelector('.wallet-loading');
    if (loading) loading.remove();
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
WalletManager.connectEmail = () => window.WalletManager?.connectEmail();
WalletManager.connectGoogle = () => window.WalletManager?.connectGoogle();
WalletManager.connectMetaMask = () => window.WalletManager?.connectMetaMask();
WalletManager.connectWeb3Auth = () => window.WalletManager?.connectWeb3Auth();
WalletManager.connectWalletConnect = () =>
  window.WalletManager?.connectWalletConnect();
WalletManager.connectWallet = () => window.WalletManager?.connectWallet();
WalletManager.copyAddress = () => window.WalletManager.copyAddress();
WalletManager.viewOnExplorer = () => window.WalletManager.viewOnExplorer();
WalletManager.disconnect = () => window.WalletManager.disconnect();
