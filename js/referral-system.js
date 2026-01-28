/**
 * Referral System - NEØ FlowOFF
 * 
 * Sistema de convites e referral
 */

class ReferralSystem {
  constructor() {
    this.referralCode = null;
    this.walletAddress = null;
    this.totalReferrals = 0;
  }

  /**
   * Inicializar sistema
   */
  async init(walletAddress) {
    this.walletAddress = walletAddress;
    await this.getOrCreateReferralCode();
    await this.checkForReferralCode(); // Verificar se chegou via link de referral
  }

  /**
   * Obter ou criar código de referral
   */
  async getOrCreateReferralCode() {
    if (!this.walletAddress) return null;

    try {
      const response = await fetch('/api/referral?action=create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          wallet_address: this.walletAddress,
        }),
      });

      if (!response.ok) throw new Error('Erro ao criar código de referral');

      const data = await response.json();
      this.referralCode = data.referral_code;
      this.shareUrl = data.share_url;

      return data;
    } catch (error) {
      console.error('❌ Erro ao obter código de referral:', error);
      return null;
    }
  }

  /**
   * Verificar se usuário chegou via link de referral
   */
  async checkForReferralCode() {
    const urlParams = new URLSearchParams(window.location.search);
    const refCode = urlParams.get('ref');

    if (refCode && this.walletAddress) {
      // Salvar código para usar após conexão de wallet
      window.SafeLocalStorage?.setItem('pending_referral', refCode);
      
      // Se já estiver conectado, usar o código imediatamente
      await this.useReferralCode(refCode);
    }
  }

  /**
   * Usar código de referral
   */
  async useReferralCode(code) {
    if (!this.walletAddress) {
      console.warn('⚠️ Wallet não conectada. Salvando código para depois.');
      window.SafeLocalStorage?.setItem('pending_referral', code);
      return;
    }

    try {
      const response = await fetch('/api/referral?action=use', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          referral_code: code,
          referee_wallet: this.walletAddress,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao usar código de referral');
      }

      const data = await response.json();

      // Remover código pendente
      window.SafeLocalStorage?.removeItem('pending_referral');

      // Mostrar notificação
      this.showReferralSuccess();

      // Disparar evento
      window.dispatchEvent(new CustomEvent('referralUsed', { 
        detail: data 
      }));

      return data;
    } catch (error) {
      console.error('❌ Erro ao usar código de referral:', error);
      // Se erro, manter código salvo para tentar depois
      return null;
    }
  }

  /**
   * Tentar usar código pendente
   */
  async processPendingReferral() {
    const pendingCode = window.SafeLocalStorage?.getItem('pending_referral');
    if (pendingCode && this.walletAddress) {
      await this.useReferralCode(pendingCode);
    }
  }

  /**
   * Compartilhar código de referral
   */
  async share(platform = 'copy') {
    if (!this.referralCode) {
      await this.getOrCreateReferralCode();
    }

    const text = `🚀 Junte-se ao NEØ FlowOFF e ganhe tokens $NEOFLW!\n\nUse meu código de convite: ${this.referralCode}\n\n${this.shareUrl}`;

    switch (platform) {
      case 'twitter':
        const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
        window.open(twitterUrl, '_blank');
        
        // Registrar pontos por compartilhamento
        if (window.PointsSystem) {
          setTimeout(() => {
            window.PointsSystem.recordAction('share_twitter', { 
              referral_code: this.referralCode 
            }).catch(err => console.warn('Erro ao registrar pontos:', err));
          }, 2000);
        }
        break;

      case 'facebook':
        const fbUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(this.shareUrl)}`;
        window.open(fbUrl, '_blank');
        
        if (window.PointsSystem) {
          setTimeout(() => {
            window.PointsSystem.recordAction('share_facebook', { 
              referral_code: this.referralCode 
            }).catch(err => console.warn('Erro ao registrar pontos:', err));
          }, 2000);
        }
        break;

      case 'copy':
      default:
        try {
          await navigator.clipboard.writeText(this.shareUrl);
          this.showCopySuccess();
        } catch (error) {
          // Fallback para navegadores que não suportam clipboard API
          this.fallbackCopy(this.shareUrl);
        }
        break;
    }
  }

  /**
   * Fallback para copiar (sem clipboard API)
   */
  fallbackCopy(text) {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    
    try {
      document.execCommand('copy');
      this.showCopySuccess();
    } catch (error) {
      console.error('Erro ao copiar:', error);
    } finally {
      document.body.removeChild(textarea);
    }
  }

  /**
   * Mostrar sucesso ao copiar
   */
  showCopySuccess() {
    if (window.WalletOnboarding) {
      window.WalletOnboarding.showAchievementToast('✅ Link copiado!');
    }
  }

  /**
   * Mostrar sucesso ao usar referral
   */
  showReferralSuccess() {
    if (window.WalletOnboarding) {
      window.WalletOnboarding.showAchievementToast('🎉 Referral usado! Você ganhou pontos!');
    }
  }

  /**
   * Mostrar modal de compartilhamento
   */
  showShareModal() {
    const modal = document.createElement('dialog');
    modal.id = 'referral-share-modal';
    modal.className = 'referral-modal';

    const content = document.createElement('div');
    content.className = 'referral-content';
    content.style.cssText = 'padding: 32px; color: white;';

    // Header
    const header = document.createElement('div');
    header.style.cssText = 'text-align: center; margin-bottom: 24px;';
    
    const icon = document.createElement('div');
    icon.textContent = '🎁';
    icon.style.cssText = 'font-size: 48px; margin-bottom: 16px;';
    
    const title = document.createElement('h2');
    title.textContent = 'Convide Amigos';
    title.style.cssText = 'margin: 0 0 8px; font-size: 24px; background: linear-gradient(135deg, #ff2fb3, #00d0ff); -webkit-background-clip: text; background-clip: text; color: transparent;';
    
    const subtitle = document.createElement('p');
    subtitle.textContent = 'Ganhe 50 pontos para cada amigo que conectar a wallet!';
    subtitle.style.cssText = 'margin: 0; color: #9aa0aa; font-size: 14px;';

    header.appendChild(icon);
    header.appendChild(title);
    header.appendChild(subtitle);

    // Link de referral
    const linkContainer = document.createElement('div');
    linkContainer.style.cssText = 'margin: 24px 0; padding: 16px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; display: flex; gap: 12px; align-items: center;';
    
    const linkInput = document.createElement('input');
    linkInput.type = 'text';
    linkInput.value = this.shareUrl || 'Gerando...';
    linkInput.readonly = true;
    linkInput.style.cssText = 'flex: 1; background: transparent; border: none; color: #e6e6f0; font-size: 14px; outline: none;';
    
    const copyBtn = document.createElement('button');
    copyBtn.textContent = '📋 Copiar';
    copyBtn.style.cssText = 'padding: 8px 16px; background: rgba(255,255,255,0.1); border: none; border-radius: 8px; color: white; cursor: pointer; font-weight: 600; transition: all 0.2s;';
    copyBtn.onmouseover = () => copyBtn.style.background = 'rgba(255,255,255,0.2)';
    copyBtn.onmouseout = () => copyBtn.style.background = 'rgba(255,255,255,0.1)';
    copyBtn.onclick = () => this.share('copy');
    
    linkContainer.appendChild(linkInput);
    linkContainer.appendChild(copyBtn);

    // Botões de compartilhamento
    const shareButtons = document.createElement('div');
    shareButtons.style.cssText = 'display: flex; gap: 12px; margin-top: 24px;';
    
    const twitterBtn = this.createShareButton('🐦 Twitter', () => this.share('twitter'));
    const facebookBtn = this.createShareButton('📘 Facebook', () => this.share('facebook'));
    
    shareButtons.appendChild(twitterBtn);
    shareButtons.appendChild(facebookBtn);

    // Botão fechar
    const closeBtn = document.createElement('button');
    closeBtn.textContent = 'Fechar';
    closeBtn.style.cssText = 'margin-top: 24px; width: 100%; padding: 14px; border: 1px solid rgba(255,255,255,0.2); border-radius: 12px; background: transparent; color: #9aa0aa; font-weight: 600; cursor: pointer;';
    closeBtn.onclick = () => modal.close();

    content.appendChild(header);
    content.appendChild(linkContainer);
    content.appendChild(shareButtons);
    content.appendChild(closeBtn);
    modal.appendChild(content);

    // Estilos
    const style = document.createElement('style');
    style.textContent = `
      .referral-modal {
        border: none;
        border-radius: 20px;
        max-width: 480px;
        width: 90vw;
        background: linear-gradient(180deg, rgba(15, 15, 22, 0.98), rgba(10, 10, 16, 0.98));
        backdrop-filter: blur(20px);
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.6);
        border: 1px solid rgba(255, 255, 255, 0.1);
      }
      .referral-modal::backdrop {
        background: rgba(0, 0, 0, 0.85);
        backdrop-filter: blur(8px);
      }
    `;
    document.head.appendChild(style);
    document.body.appendChild(modal);
    modal.showModal();
  }

  /**
   * Criar botão de compartilhamento
   */
  createShareButton(label, onClick) {
    const btn = document.createElement('button');
    btn.textContent = label;
    btn.style.cssText = 'flex: 1; padding: 14px; border: none; border-radius: 12px; background: rgba(255,255,255,0.1); color: white; font-weight: 600; cursor: pointer; transition: all 0.2s;';
    btn.onmouseover = () => {
      btn.style.background = 'rgba(255,47,179,0.2)';
      btn.style.transform = 'translateY(-2px)';
    };
    btn.onmouseout = () => {
      btn.style.background = 'rgba(255,255,255,0.1)';
      btn.style.transform = 'translateY(0)';
    };
    btn.onclick = onClick;
    return btn;
  }
}

// Exportar instância global
if (typeof window !== 'undefined') {
  window.ReferralSystem = new ReferralSystem();
}

export default ReferralSystem;
