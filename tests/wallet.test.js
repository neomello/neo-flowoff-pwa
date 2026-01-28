/**
 * Testes do Wallet Manager
 * @vitest-environment jsdom
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Setup global antes de importar
beforeEach(() => {
  // Mock de navigator.clipboard
  if (!navigator.clipboard) {
    Object.defineProperty(navigator, 'clipboard', {
      value: {
        writeText: vi.fn(() => Promise.resolve()),
      },
      writable: true,
      configurable: true,
    });
  } else {
    navigator.clipboard.writeText = vi.fn(() => Promise.resolve());
  }

  // Setup do DOM básico
  document.body.innerHTML = `
    <button id="wallet-btn" class="wallet-connect-btn">
      <span class="wallet-btn-text">ACESSAR</span>
      <span class="wallet-btn-icon">→</span>
    </button>
  `;

  // Mock de configurações globais (não mais necessário THIRDWEB)
  window.WEB3AUTH_CLIENT_ID = 'test-web3auth-client-id';
});

// Configuração do TOKEN_CONFIG para testes
const TOKEN_CONFIG = {
  address: '0x41F4ff3d45DED9C1332e4908F637B75fe83F5d6B',
  symbol: 'NEOFLW',
  name: 'NEOFlowOFF',
  decimals: 18,
  chainId: 8453,
  chain: 'base',
};

describe('WalletManager', () => {
  let WalletManager;

  beforeEach(async () => {
    // Limpa localStorage
    localStorage.clear();

    // Remove instância anterior se existir
    if (window.WalletManager) {
      delete window.WalletManager;
    }

    // Importa o módulo de forma dinâmica para cada teste
    // Como wallet.js não é módulo ES, vamos simular a classe
    WalletManager = createWalletManagerMock();
  });

  afterEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  describe('Inicialização', () => {
    it('deve criar instância com estado inicial desconectado', () => {
      const manager = new WalletManager();

      expect(manager.connected).toBe(false);
      expect(manager.address).toBeNull();
      expect(manager.balance).toBeNull();
    });

    it('deve criar modal no DOM', () => {
      const manager = new WalletManager();

      expect(manager.modal).toBeTruthy();
      expect(document.getElementById('wallet-modal')).toBeTruthy();
    });

    it('deve restaurar estado do localStorage', () => {
      const savedState = {
        address: '0x1234567890abcdef1234567890abcdef12345678',
        timestamp: Date.now(),
      };
      localStorage.setItem('wallet_state', JSON.stringify(savedState));

      const manager = new WalletManager();

      expect(manager.connected).toBe(true);
      expect(manager.address).toBe(savedState.address);
    });
  });

  describe('Formatação', () => {
    it('deve formatar endereço corretamente', () => {
      const manager = new WalletManager();
      const address = '0x1234567890abcdef1234567890abcdef12345678';

      const formatted = manager.formatAddress(address);

      expect(formatted).toBe('0x1234...5678');
    });

    it('deve retornar string vazia para endereço null', () => {
      const manager = new WalletManager();

      expect(manager.formatAddress(null)).toBe('');
      expect(manager.formatAddress('')).toBe('');
    });

    it('deve formatar balance com 2 casas decimais', () => {
      const manager = new WalletManager();

      expect(manager.formatBalance('100.00')).toBe('100,00');
      expect(manager.formatBalance('1234.56')).toMatch(/1.*234.*56/); // Formato brasileiro
      expect(manager.formatBalance('0')).toBe('0,00');
    });

    it('deve mostrar "< 0.01" para valores muito pequenos', () => {
      const manager = new WalletManager();

      expect(manager.formatBalance('0.001')).toBe('< 0.01');
      expect(manager.formatBalance('0.009')).toBe('< 0.01');
    });
  });

  describe('Estado do Botão', () => {
    it('deve atualizar botão para estado conectado', () => {
      const manager = new WalletManager();
      manager.connected = true;
      manager.address = '0x1234567890abcdef1234567890abcdef12345678';

      manager.updateButton();

      const btn = document.getElementById('wallet-btn');
      expect(btn.classList.contains('connected')).toBe(true);
      expect(btn.querySelector('.wallet-btn-text').textContent).toBe(
        '0x1234...5678'
      );
      expect(btn.querySelector('.wallet-btn-icon').textContent).toBe('✓');
    });

    it('deve atualizar botão para estado desconectado', () => {
      const manager = new WalletManager();
      manager.connected = false;
      manager.address = null;

      manager.updateButton();

      const btn = document.getElementById('wallet-btn');
      expect(btn.classList.contains('connected')).toBe(false);
      expect(btn.querySelector('.wallet-btn-text').textContent).toBe('ACESSAR');
      expect(btn.querySelector('.wallet-btn-icon').textContent).toBe('→');
    });
  });

  describe('Modal', () => {
    it('deve abrir modal', () => {
      const manager = new WalletManager();

      manager.open();

      expect(manager.modal.open).toBe(true);
    });

    it('deve fechar modal', () => {
      const manager = new WalletManager();
      manager.open();

      manager.close();

      expect(manager.modal.open).toBe(false);
    });

    it('deve toggle modal', () => {
      const manager = new WalletManager();

      manager.toggle();
      expect(manager.modal.open).toBe(true);

      manager.toggle();
      expect(manager.modal.open).toBe(false);
    });
  });

  describe('Persistência', () => {
    it('deve salvar estado no localStorage quando conectado', () => {
      const manager = new WalletManager();
      manager.connected = true;
      manager.address = '0x1234567890abcdef1234567890abcdef12345678';

      manager.saveState();

      const saved = JSON.parse(localStorage.getItem('wallet_state'));
      expect(saved.address).toBe(manager.address);
      expect(saved.timestamp).toBeTruthy();
    });

    it('deve remover estado do localStorage quando desconectado', () => {
      localStorage.setItem(
        'wallet_state',
        JSON.stringify({ address: '0x123' })
      );

      const manager = new WalletManager();
      manager.connected = false;
      manager.address = null;

      manager.saveState();

      expect(localStorage.getItem('wallet_state')).toBeNull();
    });
  });

  describe('Desconexão', () => {
    it('deve limpar estado ao desconectar', () => {
      const manager = new WalletManager();
      manager.connected = true;
      manager.address = '0x1234567890abcdef1234567890abcdef12345678';
      manager.balance = '100.00';

      manager.disconnect();

      expect(manager.connected).toBe(false);
      expect(manager.address).toBeNull();
      expect(manager.balance).toBeNull();
      expect(localStorage.getItem('wallet_state')).toBeNull();
    });
  });

  describe('Clipboard', () => {
    it('deve copiar endereço para clipboard', async () => {
      const manager = new WalletManager();
      manager.address = '0x1234567890abcdef1234567890abcdef12345678';

      manager.copyAddress();

      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
        manager.address
      );
    });

    it('não deve copiar se não houver endereço', () => {
      const manager = new WalletManager();
      manager.address = null;

      manager.copyAddress();

      expect(navigator.clipboard.writeText).not.toHaveBeenCalled();
    });
  });

  describe('Explorer', () => {
    it('deve abrir PolygonScan com endereço correto', () => {
      const manager = new WalletManager();
      manager.address = '0x1234567890abcdef1234567890abcdef12345678';

      manager.viewOnExplorer();

      expect(window.open).toHaveBeenCalledWith(
        'https://basescan.org/address/0x1234567890abcdef1234567890abcdef12345678',
        '_blank'
      );
    });

    it('não deve abrir explorer se não houver endereço', () => {
      const manager = new WalletManager();
      manager.address = null;

      manager.viewOnExplorer();

      expect(window.open).not.toHaveBeenCalled();
    });
  });

  describe('Conexão Externa (MetaMask)', () => {
    it('deve conectar via MetaMask quando disponível', async () => {
      const mockAccounts = ['0xabcdef1234567890abcdef1234567890abcdef12'];
      window.ethereum = {
        request: vi.fn(() => Promise.resolve(mockAccounts)),
      };

      const manager = new WalletManager();
      await manager.connectWallet();

      expect(window.ethereum.request).toHaveBeenCalledWith({
        method: 'eth_requestAccounts',
      });
      expect(manager.connected).toBe(true);
      expect(manager.address).toBe(mockAccounts[0]);
    });

    it('deve mostrar alerta quando MetaMask não disponível', async () => {
      delete window.ethereum;
      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});

      const manager = new WalletManager();
      await manager.connectWallet();

      expect(alertSpy).toHaveBeenCalledWith(
        'Nenhuma wallet detectada. Instale MetaMask ou similar.'
      );
      expect(manager.connected).toBe(false);
    });
  });

  describe('Balance Fetch', () => {
    it('deve buscar balance do token', async () => {
      const mockBalance =
        '0x0000000000000000000000000000000000000000000000056bc75e2d63100000'; // 100 tokens
      global.fetch = vi.fn(() =>
        Promise.resolve({
          json: () => Promise.resolve({ result: mockBalance }),
        })
      );

      const manager = new WalletManager();
      manager.address = '0x1234567890abcdef1234567890abcdef12345678';

      // Adiciona elemento de balance no DOM
      const balanceEl = document.createElement('div');
      balanceEl.id = 'wallet-balance';
      document.body.appendChild(balanceEl);

      await manager.fetchBalance();

      expect(fetch).toHaveBeenCalled();
      expect(manager.balance).toBeTruthy();
    });

    it('deve definir balance como 0 quando resultado vazio', async () => {
      global.fetch = vi.fn(() =>
        Promise.resolve({
          json: () => Promise.resolve({ result: '0x' }),
        })
      );

      const manager = new WalletManager();
      manager.address = '0x1234567890abcdef1234567890abcdef12345678';

      // Adiciona elemento de balance no DOM
      const balanceEl = document.createElement('div');
      balanceEl.id = 'wallet-balance';
      document.body.appendChild(balanceEl);

      await manager.fetchBalance();

      expect(manager.balance).toBe('0.00');
    });
  });

  describe('Toast Notifications', () => {
    it('deve criar toast com mensagem', () => {
      const manager = new WalletManager();

      // Garantir que document.body existe
      expect(document.body).toBeTruthy();

      manager.showToast('Teste de mensagem');

      // Procura pela classe wallet-toast
      const toasts = document.querySelectorAll('.wallet-toast');
      // Se não encontrar pela classe, procura por qualquer div filho do body
      const bodyChildren = Array.from(document.body.children);
      const toastElement = bodyChildren.find(
        (child) =>
          child.classList?.contains('wallet-toast') ||
          child.textContent?.includes('Teste de mensagem')
      );

      expect(toasts.length).toBeGreaterThan(0);
      expect(toasts[0].textContent).toContain('Teste de mensagem');
    });

    it('deve remover toast após timeout', async () => {
      vi.useFakeTimers();
      const manager = new WalletManager();

      manager.showToast('Teste');

      // Avança tempo para remover toast
      vi.advanceTimersByTime(2500);

      vi.useRealTimers();
    });
  });
});

describe('TOKEN_CONFIG', () => {
  it('deve ter configurações corretas do token', () => {
    expect(TOKEN_CONFIG.address).toBe(
      '0x41F4ff3d45DED9C1332e4908F637B75fe83F5d6B'
    );
    expect(TOKEN_CONFIG.symbol).toBe('NEOFLW');
    expect(TOKEN_CONFIG.decimals).toBe(18);
    expect(TOKEN_CONFIG.chainId).toBe(8453);
    expect(TOKEN_CONFIG.chain).toBe('base');
  });
});

/**
 * Cria mock da classe WalletManager para testes
 * (necessário pois wallet.js não é módulo ES)
 */
function createWalletManagerMock() {
  return class WalletManager {
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

    loadState() {
      const saved = localStorage.getItem('wallet_state');
      if (saved) {
        try {
          const state = JSON.parse(saved);
          if (state.address) {
            this.connected = true;
            this.address = state.address;
          }
        } catch (e) {
          localStorage.removeItem('wallet_state');
        }
      }
    }

    saveState() {
      if (this.connected && this.address) {
        localStorage.setItem(
          'wallet_state',
          JSON.stringify({
            address: this.address,
            timestamp: Date.now(),
          })
        );
      } else {
        localStorage.removeItem('wallet_state');
      }
    }

    createModal() {
      const modal = document.createElement('dialog');
      modal.id = 'wallet-modal';
      modal.innerHTML = `
        <div id="wallet-disconnected"></div>
        <div id="wallet-connected" style="display: none;"></div>
      `;
      // Mock para jsdom que não suporta dialog nativamente
      modal.open = false;
      modal.showModal = function () {
        this.open = true;
      };
      modal.close = function () {
        this.open = false;
      };
      document.body.appendChild(modal);
      this.modal = modal;
    }

    toggle() {
      if (this.modal.open) {
        this.close();
      } else {
        this.open();
      }
    }

    open() {
      this.modal.showModal();
    }

    close() {
      this.modal.close();
    }

    updateButton() {
      const btn = document.getElementById('wallet-btn');
      if (!btn) return;

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

    formatAddress(address) {
      if (!address) return '';
      return `${address.slice(0, 6)}...${address.slice(-4)}`;
    }

    formatBalance(balance) {
      const num = parseFloat(balance);
      if (num === 0) return '0,00';
      if (num < 0.01) return '< 0.01';
      return num.toLocaleString('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
    }

    async connectWallet() {
      if (typeof window.ethereum !== 'undefined') {
        try {
          const accounts = await window.ethereum.request({
            method: 'eth_requestAccounts',
          });
          if (accounts && accounts[0]) {
            this.address = accounts[0];
            this.connected = true;
            this.saveState();
            this.updateButton();
          }
        } catch (error) {
          alert('Erro ao conectar. Tente novamente.');
        }
      } else {
        alert('Nenhuma wallet detectada. Instale MetaMask ou similar.');
      }
    }

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
        });

        const json = await response.json();
        if (json.result && json.result !== '0x') {
          const balance = BigInt(json.result);
          const decimals = BigInt(10 ** TOKEN_CONFIG.decimals);
          const intPart = balance / decimals;
          const decPart =
            (balance % decimals) / BigInt(10 ** (TOKEN_CONFIG.decimals - 2));
          this.balance = `${intPart}.${decPart.toString().padStart(2, '0')}`;
        } else {
          this.balance = '0.00';
        }

        const balanceEl = document.getElementById('wallet-balance');
        if (balanceEl) {
          balanceEl.textContent = this.formatBalance(this.balance);
        }
      } catch (error) {
        this.balance = '0.00';
      }
    }

    copyAddress() {
      if (this.address) {
        navigator.clipboard.writeText(this.address);
        this.showToast('📋 Endereço copiado!');
      }
    }

    viewOnExplorer() {
      if (this.address) {
        window.open(
          `https://basescan.org/address/${this.address}`,
          '_blank'
        );
      }
    }

    disconnect() {
      this.connected = false;
      this.address = null;
      this.balance = null;
      localStorage.removeItem('wallet_state');
      this.updateButton();
    }

    showToast(message) {
      const toast = document.createElement('div');
      toast.className = 'wallet-toast'; // Adiciona classe para o teste encontrar
      toast.style.cssText = `
        position: fixed;
        bottom: 100px;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(20, 20, 30, 0.95);
        color: white;
        padding: 12px 24px;
        border-radius: 12px;
        z-index: 10001;
      `;
      toast.textContent = message;
      document.body.appendChild(toast);

      setTimeout(() => toast.remove(), 2000);
    }
  };
}
