/**
 * Wallet Onboarding Module - NEØ FlowOFF
 * 
 * Experiência pós-conexão: boas-vindas, registro, próximos passos
 */

class WalletOnboarding {
  constructor() {
    this.hasSeenWelcome = false;
    this.isFirstConnection = false;
  }

  /**
   * Verificar se é primeira conexão desta wallet
   */
  checkFirstConnection(walletAddress) {
    const key = `wallet_first_${walletAddress?.toLowerCase()}`;
    const hasConnectedBefore = window.SafeLocalStorage?.getItem(key);
    
    if (!hasConnectedBefore) {
      this.isFirstConnection = true;
      window.SafeLocalStorage?.setItem(key, 'true');
      return true;
    }
    
    return false;
  }

  /**
   * Mostrar modal de boas-vindas após conexão
   */
  async showWelcomeModal(walletAddress, provider = 'MetaMask') {
    // Verificar se já viu o welcome (evitar spam)
    const welcomeKey = `welcome_seen_${walletAddress?.toLowerCase()}`;
    if (window.SafeLocalStorage?.getItem(welcomeKey)) {
      return; // Já viu, não mostrar novamente
    }

    const modal = document.createElement('dialog');
    modal.id = 'wallet-welcome-modal';
    modal.className = 'wallet-welcome-modal';

    const content = document.createElement('div');
    content.className = 'welcome-content';

    // Header com animação
    const header = document.createElement('div');
    header.className = 'welcome-header';
    
    const icon = document.createElement('div');
    icon.className = 'welcome-icon';
    icon.innerHTML = '🎉';
    icon.style.cssText = 'font-size: 64px; animation: bounce 1s ease-in-out;';
    
    const title = document.createElement('h2');
    title.textContent = 'Bem-vindo ao NEØ FlowOFF!';
    title.style.cssText = 'margin: 16px 0 8px; font-size: 28px; background: linear-gradient(135deg, #ff2fb3, #00d0ff); -webkit-background-clip: text; background-clip: text; color: transparent; font-weight: 700;';
    
    const subtitle = document.createElement('p');
    subtitle.textContent = 'Sua wallet está conectada. Agora você pode:';
    subtitle.style.cssText = 'margin: 0; color: #9aa0aa; font-size: 16px;';

    header.appendChild(icon);
    header.appendChild(title);
    header.appendChild(subtitle);

    // Lista de ações disponíveis
    const actionsList = document.createElement('div');
    actionsList.className = 'welcome-actions';
    actionsList.style.cssText = 'margin: 32px 0; display: flex; flex-direction: column; gap: 16px;';

    // Ação 1: Comprar $NEOFLW
    const action1 = this.createActionItem(
      '💰',
      'Comprar $NEOFLW',
      'Adquira tokens $NEOFLW na BASE Network',
      () => {
        modal.close();
        window.SwapUI?.openSwapModal(walletAddress);
      }
    );
    actionsList.appendChild(action1);

    // Ação 2: Registrar-se (se não registrado)
    if (window.UserRegistration && !window.UserRegistration.isUserRegistered()) {
      const action2 = this.createActionItem(
        '📝',
        'Criar Conta',
        'Registre-se para desbloquear recursos exclusivos',
        () => {
          modal.close();
          setTimeout(() => {
            window.UserRegistration.showRegistrationModal(walletAddress, provider);
          }, 300);
        }
      );
      actionsList.appendChild(action2);
    }

    // Ação 3: Convidar Amigos (Referral)
    const action3 = this.createActionItem(
      '🎁',
      'Convidar Amigos',
      'Ganhe 50 pontos para cada amigo que conectar',
      () => {
        modal.close();
        if (window.ReferralSystem) {
          window.ReferralSystem.showShareModal();
        }
      }
    );
    actionsList.appendChild(action3);

    // Ação 4: Ver Leaderboard
    const action4 = this.createActionItem(
      '🏆',
      'Ver Ranking',
      'Veja sua posição no ranking de pontos',
      () => {
        modal.close();
        if (window.LeaderboardWidget) {
          window.LeaderboardWidget.createWidget().then(() => {
            window.LeaderboardWidget.show();
          });
        }
      }
    );
    actionsList.appendChild(action4);

    // Footer com "Não mostrar novamente"
    const footer = document.createElement('div');
    footer.className = 'welcome-footer';
    footer.style.cssText = 'margin-top: 24px; padding-top: 24px; border-top: 1px solid rgba(255,255,255,0.1);';

    const checkboxLabel = document.createElement('label');
    checkboxLabel.style.cssText = 'display: flex; align-items: center; gap: 8px; cursor: pointer; color: #9aa0aa; font-size: 14px;';
    
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.onchange = (e) => {
      if (e.target.checked) {
        window.SafeLocalStorage?.setItem(welcomeKey, 'true');
      }
    };
    
    const checkboxText = document.createElement('span');
    checkboxText.textContent = 'Não mostrar esta mensagem novamente';
    
    checkboxLabel.appendChild(checkbox);
    checkboxLabel.appendChild(checkboxText);
    footer.appendChild(checkboxLabel);

    // Botão fechar
    const closeBtn = document.createElement('button');
    closeBtn.textContent = 'Entendi!';
    closeBtn.className = 'welcome-close-btn';
    closeBtn.style.cssText = 'margin-top: 20px; width: 100%; padding: 14px; border: none; border-radius: 12px; background: linear-gradient(135deg, #ff2fb3, #7a2cff); color: white; font-weight: 700; font-size: 16px; cursor: pointer; transition: transform 0.2s;';
    closeBtn.onmouseover = () => closeBtn.style.transform = 'translateY(-2px)';
    closeBtn.onmouseout = () => closeBtn.style.transform = 'translateY(0)';
    closeBtn.onclick = () => modal.close();
    footer.appendChild(closeBtn);

    content.appendChild(header);
    content.appendChild(actionsList);
    content.appendChild(footer);
    modal.appendChild(content);

    // Estilos
    this.addWelcomeStyles();

    document.body.appendChild(modal);
    modal.showModal();

    // Fechar ao clicar fora
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.close();
      }
    });

    // Animar entrada
    setTimeout(() => {
      content.style.opacity = '1';
      content.style.transform = 'translateY(0)';
    }, 50);
  }

  /**
   * Criar item de ação clicável
   */
  createActionItem(emoji, title, description, onClick) {
    const item = document.createElement('div');
    item.className = 'welcome-action-item';
    item.style.cssText = 'display: flex; align-items: start; gap: 16px; padding: 20px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; cursor: pointer; transition: all 0.3s;';
    
    item.onmouseover = () => {
      item.style.background = 'rgba(255,47,179,0.1)';
      item.style.borderColor = 'rgba(255,47,179,0.3)';
      item.style.transform = 'translateX(4px)';
    };
    
    item.onmouseout = () => {
      item.style.background = 'rgba(255,255,255,0.03)';
      item.style.borderColor = 'rgba(255,255,255,0.08)';
      item.style.transform = 'translateX(0)';
    };
    
    item.onclick = onClick;

    const emojiEl = document.createElement('div');
    emojiEl.textContent = emoji;
    emojiEl.style.cssText = 'font-size: 32px; flex-shrink: 0;';

    const textContainer = document.createElement('div');
    textContainer.style.cssText = 'flex: 1;';

    const titleEl = document.createElement('h3');
    titleEl.textContent = title;
    titleEl.style.cssText = 'margin: 0 0 4px; font-size: 18px; font-weight: 600; color: #e6e6f0;';

    const descEl = document.createElement('p');
    descEl.textContent = description;
    descEl.style.cssText = 'margin: 0; font-size: 14px; color: #9aa0aa; line-height: 1.5;';

    textContainer.appendChild(titleEl);
    textContainer.appendChild(descEl);

    item.appendChild(emojiEl);
    item.appendChild(textContainer);

    return item;
  }

  /**
   * Adicionar estilos do modal
   */
  addWelcomeStyles() {
    if (document.getElementById('welcome-modal-styles')) return;

    const style = document.createElement('style');
    style.id = 'welcome-modal-styles';
    style.textContent = `
      .wallet-welcome-modal {
        border: none;
        border-radius: 24px;
        padding: 0;
        max-width: 540px;
        width: 90vw;
        background: linear-gradient(180deg, rgba(15, 15, 22, 0.98), rgba(10, 10, 16, 0.98));
        backdrop-filter: blur(20px);
        -webkit-backdrop-filter: blur(20px);
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.6);
        border: 1px solid rgba(255, 255, 255, 0.1);
      }
      
      .wallet-welcome-modal::backdrop {
        background: rgba(0, 0, 0, 0.85);
        backdrop-filter: blur(8px);
      }
      
      .welcome-content {
        padding: 40px;
        opacity: 0;
        transform: translateY(20px);
        transition: all 0.4s ease-out;
      }
      
      .welcome-header {
        text-align: center;
      }
      
      @keyframes bounce {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-10px); }
      }
      
      @media (max-width: 600px) {
        .welcome-content {
          padding: 24px;
        }
        
        .welcome-header h2 {
          font-size: 24px !important;
        }
      }
    `;
    document.head.appendChild(style);
  }

  /**
   * Mostrar toast de conquista (opcional)
   */
  showAchievementToast(message) {
    const toast = document.createElement('div');
    toast.className = 'achievement-toast';
    toast.textContent = message;
    toast.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 16px 24px;
      background: linear-gradient(135deg, #ff2fb3, #7a2cff);
      color: white;
      border-radius: 12px;
      box-shadow: 0 8px 24px rgba(255, 47, 179, 0.4);
      z-index: 10000;
      font-weight: 600;
      animation: slideInRight 0.3s ease-out;
    `;

    const style = document.createElement('style');
    style.textContent = `
      @keyframes slideInRight {
        from {
          transform: translateX(100%);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }
    `;
    document.head.appendChild(style);
    document.body.appendChild(toast);

    setTimeout(() => {
      toast.style.animation = 'slideInRight 0.3s ease-out reverse';
      setTimeout(() => {
        toast.remove();
        style.remove();
      }, 300);
    }, 4000);
  }
}

// Exportar instância global
if (typeof window !== 'undefined') {
  window.WalletOnboarding = new WalletOnboarding();
}

export default WalletOnboarding;
