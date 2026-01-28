/**
 * Swap UI Module - NEØ FlowOFF
 * 
 * Interface de usuário para swap ETH → $NEOFLW
 * Integra com TokenSwap (js/token-swap.js)
 */

class SwapUI {
  constructor() {
    this.swapModal = null;
    this.tokenSwap = null;
    this.currentQuote = null;
    this.quoteInterval = null;
  }

  /**
   * Criar modal de swap
   */
  createSwapModal() {
    if (this.swapModal) return this.swapModal;

    const modal = document.createElement('dialog');
    modal.id = 'swap-modal';
    modal.className = 'swap-modal';

    const content = document.createElement('div');
    content.className = 'swap-modal-content';

    // Header
    const header = document.createElement('div');
    header.className = 'swap-header';
    header.style.cssText = 'display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;';

    const title = document.createElement('h3');
    title.textContent = '💱 Comprar $NEOFLW';
    title.style.cssText = 'margin: 0; font-size: 24px; background: linear-gradient(135deg, #ff2fb3, #00d0ff); -webkit-background-clip: text; background-clip: text; color: transparent;';

    const closeBtn = document.createElement('button');
    closeBtn.textContent = '×';
    closeBtn.className = 'close-btn';
    closeBtn.style.cssText = 'background: none; border: none; font-size: 32px; color: #9aa0aa; cursor: pointer; padding: 0; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; transition: color 0.2s;';
    closeBtn.onmouseover = () => closeBtn.style.color = '#e6e6f0';
    closeBtn.onmouseout = () => closeBtn.style.color = '#9aa0aa';
    closeBtn.onclick = () => modal.close();

    header.appendChild(title);
    header.appendChild(closeBtn);

    // Swap container
    const swapContainer = document.createElement('div');
    swapContainer.className = 'swap-container';
    swapContainer.style.cssText = 'display: flex; flex-direction: column; gap: 12px;';

    // Input (ETH)
    const inputBox = this.createTokenBox('input', 'Você paga', 'ETH', 'https://ethereum.org/static/6b935ac0e6194247347855dc3d328e83/6ed5f/eth-diamond-black.png');
    swapContainer.appendChild(inputBox);

    // Swap icon
    const swapIcon = document.createElement('div');
    swapIcon.style.cssText = 'display: flex; justify-content: center; margin: -6px 0;';
    const icon = document.createElement('div');
    icon.textContent = '⬇️';
    icon.style.cssText = 'width: 32px; height: 32px; border-radius: 8px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); display: flex; align-items: center; justify-content: center; font-size: 16px;';
    swapIcon.appendChild(icon);
    swapContainer.appendChild(swapIcon);

    // Output (NEOFLW)
    const outputBox = this.createTokenBox('output', 'Você recebe (estimado)', 'NEOFLW', '/public/logo.svg');
    swapContainer.appendChild(outputBox);

    content.appendChild(swapContainer);

    // Price info
    const priceInfo = document.createElement('div');
    priceInfo.id = 'price-info';
    priceInfo.style.cssText = 'margin-top: 16px; padding: 12px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); border-radius: 8px; font-size: 13px; color: #9aa0aa; display: none;';
    content.appendChild(priceInfo);

    // Slippage settings
    const slippageContainer = document.createElement('div');
    slippageContainer.style.cssText = 'margin-top: 16px; display: flex; align-items: center; justify-content: space-between;';
    
    const slippageLabel = document.createElement('span');
    slippageLabel.textContent = 'Slippage tolerance:';
    slippageLabel.style.cssText = 'font-size: 13px; color: #9aa0aa;';
    
    const slippageInput = document.createElement('input');
    slippageInput.type = 'number';
    slippageInput.id = 'slippage';
    slippageInput.value = '0.5';
    slippageInput.step = '0.1';
    slippageInput.min = '0.1';
    slippageInput.max = '5';
    slippageInput.style.cssText = 'width: 70px; padding: 6px 10px; border-radius: 6px; border: 1px solid rgba(255,255,255,0.1); background: rgba(255,255,255,0.05); color: #e6e6f0; font-size: 14px; text-align: right;';
    
    const slippagePercent = document.createElement('span');
    slippagePercent.textContent = '%';
    slippagePercent.style.cssText = 'margin-left: 4px; color: #9aa0aa;';
    
    slippageContainer.appendChild(slippageLabel);
    const rightSide = document.createElement('div');
    rightSide.style.cssText = 'display: flex; align-items: center; gap: 4px;';
    rightSide.appendChild(slippageInput);
    rightSide.appendChild(slippagePercent);
    slippageContainer.appendChild(rightSide);
    content.appendChild(slippageContainer);

    // Swap button
    const swapBtn = document.createElement('button');
    swapBtn.id = 'swap-button';
    swapBtn.textContent = 'Comprar $NEOFLW';
    swapBtn.disabled = true;
    swapBtn.style.cssText = 'margin-top: 24px; width: 100%; padding: 16px; border: none; border-radius: 12px; background: linear-gradient(135deg, #ff2fb3, #7a2cff); color: white; font-weight: 700; font-size: 16px; cursor: pointer; transition: all 0.2s; opacity: 0.5;';
    swapBtn.onclick = () => this.executeSwap();
    content.appendChild(swapBtn);

    // Status message
    const status = document.createElement('div');
    status.id = 'swap-status';
    status.style.cssText = 'margin-top: 16px; display: none; padding: 12px; border-radius: 8px; font-size: 14px;';
    content.appendChild(status);

    modal.appendChild(content);

    // Add styles
    this.addSwapStyles();

    document.body.appendChild(modal);
    this.swapModal = modal;

    // Event listeners
    const inputAmount = document.getElementById('input-amount');
    if (inputAmount) {
      inputAmount.addEventListener('input', () => this.updateQuote());
    }

    return modal;
  }

  /**
   * Criar box de token (input ou output)
   */
  createTokenBox(type, label, symbol, iconUrl) {
    const box = document.createElement('div');
    box.className = `token-box ${type}-box`;
    box.style.cssText = 'padding: 16px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 12px;';

    const labelEl = document.createElement('div');
    labelEl.textContent = label;
    labelEl.style.cssText = 'font-size: 12px; color: #9aa0aa; margin-bottom: 8px; font-weight: 500;';

    const row = document.createElement('div');
    row.style.cssText = 'display: flex; align-items: center; justify-content: space-between; gap: 12px;';

    const input = document.createElement('input');
    input.type = 'text';
    input.id = `${type}-amount`;
    input.placeholder = '0.0';
    input.readOnly = type === 'output';
    input.style.cssText = 'flex: 1; background: transparent; border: none; color: #e6e6f0; font-size: 24px; font-weight: 600; outline: none; padding: 0;';
    
    const tokenInfo = document.createElement('div');
    tokenInfo.style.cssText = 'display: flex; align-items: center; gap: 8px; padding: 6px 12px; background: rgba(255,255,255,0.05); border-radius: 8px;';
    
    const tokenIcon = document.createElement('div');
    tokenIcon.style.cssText = 'width: 24px; height: 24px; border-radius: 50%; background: rgba(255,255,255,0.1);';
    
    const tokenSymbol = document.createElement('span');
    tokenSymbol.textContent = symbol;
    tokenSymbol.style.cssText = 'font-weight: 600; color: #e6e6f0; font-size: 16px;';
    
    tokenInfo.appendChild(tokenIcon);
    tokenInfo.appendChild(tokenSymbol);
    
    row.appendChild(input);
    row.appendChild(tokenInfo);

    box.appendChild(labelEl);
    box.appendChild(row);

    // Balance (apenas para input)
    if (type === 'input') {
      const balance = document.createElement('div');
      balance.id = 'eth-balance';
      balance.textContent = 'Saldo: carregando...';
      balance.style.cssText = 'margin-top: 8px; font-size: 12px; color: #9aa0aa; text-align: right;';
      box.appendChild(balance);
    }

    return box;
  }

  /**
   * Atualizar cotação quando usuário digita
   */
  async updateQuote() {
    const inputAmount = document.getElementById('input-amount')?.value;
    const outputAmount = document.getElementById('output-amount');
    const priceInfo = document.getElementById('price-info');
    const swapBtn = document.getElementById('swap-button');

    if (!inputAmount || parseFloat(inputAmount) <= 0) {
      if (outputAmount) outputAmount.value = '';
      if (priceInfo) priceInfo.style.display = 'none';
      if (swapBtn) {
        swapBtn.disabled = true;
        swapBtn.style.opacity = '0.5';
      }
      return;
    }

    try {
      // Inicializar TokenSwap se necessário
      if (!this.tokenSwap) {
        this.tokenSwap = window.TokenSwap;
      }

      // Obter cotação
      const quote = await this.tokenSwap.getQuote(inputAmount);
      this.currentQuote = quote;

      // Atualizar output
      if (outputAmount) {
        outputAmount.value = parseFloat(quote.amountOut).toFixed(4);
      }

      // Mostrar info de preço
      if (priceInfo) {
        const pricePerToken = (parseFloat(inputAmount) / parseFloat(quote.amountOut)).toFixed(8);
        priceInfo.textContent = `1 NEOFLW = ${pricePerToken} ETH`;
        priceInfo.style.display = 'block';
      }

      // Habilitar botão
      if (swapBtn) {
        swapBtn.disabled = false;
        swapBtn.style.opacity = '1';
      }

    } catch (error) {
      window.Logger?.error('Erro ao atualizar cotação:', error);
      if (outputAmount) outputAmount.value = 'Erro';
      if (priceInfo) {
        priceInfo.textContent = `⚠️ ${error.message}`;
        priceInfo.style.display = 'block';
        priceInfo.style.color = '#ef4444';
      }
    }
  }

  /**
   * Executar swap
   */
  async executeSwap() {
    const inputAmount = document.getElementById('input-amount')?.value;
    const slippage = parseFloat(document.getElementById('slippage')?.value || '0.5');
    const statusDiv = document.getElementById('swap-status');
    const swapBtn = document.getElementById('swap-button');

    if (!inputAmount || parseFloat(inputAmount) <= 0) {
      this.showStatus('error', 'Digite um valor válido');
      return;
    }

    try {
      // Desabilitar botão
      swapBtn.disabled = true;
      swapBtn.textContent = 'Executando swap...';

      // Inicializar TokenSwap
      if (!this.tokenSwap) {
        this.tokenSwap = window.TokenSwap;
      }

      // Executar swap
      const result = await this.tokenSwap.swapETHForNEOFLW(inputAmount, slippage);

      // Sucesso!
      this.showStatus('success', `✅ Swap concluído! Você recebeu ${parseFloat(result.amountOut).toFixed(4)} NEOFLW`);
      
      // Link para transação
      const explorerLink = document.createElement('a');
      explorerLink.href = result.explorer;
      explorerLink.target = '_blank';
      explorerLink.textContent = 'Ver transação';
      explorerLink.style.cssText = 'color: #ff2fb3; text-decoration: none; font-weight: 600; margin-left: 8px;';
      statusDiv.appendChild(explorerLink);

      // Resetar form após 3 segundos
      setTimeout(() => {
        document.getElementById('input-amount').value = '';
        document.getElementById('output-amount').value = '';
        swapBtn.textContent = 'Comprar $NEOFLW';
        swapBtn.disabled = true;
        swapBtn.style.opacity = '0.5';
      }, 3000);

      // Disparar evento
      const event = new CustomEvent('swapCompleted', { 
        detail: result 
      });
      window.dispatchEvent(event);

    } catch (error) {
      window.Logger?.error('❌ Erro no swap:', error);
      this.showStatus('error', error.message);
      
      // Reabilitar botão
      swapBtn.disabled = false;
      swapBtn.textContent = 'Tentar Novamente';
    }
  }

  /**
   * Mostrar mensagem de status
   */
  showStatus(type, message) {
    const statusDiv = document.getElementById('swap-status');
    if (!statusDiv) return;

    statusDiv.style.display = 'block';
    statusDiv.textContent = message;

    if (type === 'success') {
      statusDiv.style.background = 'rgba(74, 222, 128, 0.1)';
      statusDiv.style.color = '#4ade80';
      statusDiv.style.border = '1px solid rgba(74, 222, 128, 0.3)';
    } else if (type === 'error') {
      statusDiv.style.background = 'rgba(239, 68, 68, 0.1)';
      statusDiv.style.color = '#ef4444';
      statusDiv.style.border = '1px solid rgba(239, 68, 68, 0.3)';
    } else {
      statusDiv.style.background = 'rgba(0, 208, 255, 0.1)';
      statusDiv.style.color = '#00d0ff';
      statusDiv.style.border = '1px solid rgba(0, 208, 255, 0.3)';
    }
  }

  /**
   * Adicionar estilos
   */
  addSwapStyles() {
    if (document.getElementById('swap-modal-styles')) return;

    const style = document.createElement('style');
    style.id = 'swap-modal-styles';
    style.textContent = `
      .swap-modal {
        border: none;
        border-radius: 20px;
        padding: 32px;
        max-width: 480px;
        width: 90vw;
        background: linear-gradient(180deg, rgba(15, 15, 22, 0.95), rgba(10, 10, 16, 0.98));
        backdrop-filter: blur(20px);
        -webkit-backdrop-filter: blur(20px);
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
        border: 1px solid rgba(255, 255, 255, 0.1);
      }
      .swap-modal::backdrop {
        background: rgba(0, 0, 0, 0.8);
        backdrop-filter: blur(8px);
      }
      @media (max-width: 600px) {
        .swap-modal {
          padding: 24px;
        }
      }
    `;
    document.head.appendChild(style);
  }

  /**
   * Abrir modal de swap
   * @param {string} walletAddress - Endereço da wallet conectada
   */
  async openSwapModal(walletAddress) {
    if (!walletAddress) {
      alert('Conecte sua wallet primeiro');
      return;
    }

    const modal = this.createSwapModal();
    
    // Buscar saldo de ETH
    try {
      const { ethers } = await import('https://cdn.jsdelivr.net/npm/ethers@5.7.2/dist/ethers.esm.min.js');
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const balance = await provider.getBalance(walletAddress);
      const ethBalance = ethers.utils.formatEther(balance);
      
      const balanceDiv = document.getElementById('eth-balance');
      if (balanceDiv) {
        balanceDiv.textContent = `Saldo: ${parseFloat(ethBalance).toFixed(6)} ETH`;
      }
    } catch (error) {
      window.Logger?.error('Erro ao buscar saldo ETH:', error);
    }

    modal.showModal();
  }

  /**
   * Fechar modal
   */
  closeSwapModal() {
    if (this.swapModal) {
      this.swapModal.close();
      
      // Limpar interval de cotação
      if (this.quoteInterval) {
        clearInterval(this.quoteInterval);
        this.quoteInterval = null;
      }
    }
  }
}

// Exportar instância global
if (typeof window !== 'undefined') {
  window.SwapUI = new SwapUI();
}

export default SwapUI;
