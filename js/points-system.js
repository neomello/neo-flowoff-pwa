/**
 * Points System - NEØ FlowOFF
 * 
 * Sistema de pontos gamificado
 */

class PointsSystem {
  constructor() {
    this.currentPoints = 0;
    this.tier = 'bronze';
    this.walletAddress = null;
    this.actions = [];
  }

  /**
   * Inicializar sistema
   */
  async init(walletAddress) {
    this.walletAddress = walletAddress;
    await this.fetchBalance();
  }

  /**
   * Buscar saldo de pontos
   */
  async fetchBalance() {
    if (!this.walletAddress) return;

    try {
      const clientType = window.getClientType ? window.getClientType() : 'mobile';
      const response = await fetch(`/api/points/balance?wallet_address=${this.walletAddress}`, {
        headers: {
          'X-Client-Type': clientType,
        },
      });

      if (!response.ok) throw new Error('Erro ao buscar pontos');

      const data = await response.json();
      this.currentPoints = data.total_points;
      this.tier = data.tier;
      this.actions = data.actions || [];
      this.rankPosition = data.rank_position;

      // Disparar evento
      window.dispatchEvent(new CustomEvent('pointsUpdated', { 
        detail: data 
      }));

      return data;
    } catch (error) {
      console.error('❌ Erro ao buscar pontos:', error);
      return null;
    }
  }

  /**
   * Registrar ação e ganhar pontos
   */
  async recordAction(actionType, metadata = {}) {
    if (!this.walletAddress) {
      throw new Error('Wallet não conectada');
    }

    try {
      const clientType = window.getClientType ? window.getClientType() : 'mobile';
      const response = await fetch('/api/points/record', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Client-Type': clientType,
        },
        body: JSON.stringify({
          wallet_address: this.walletAddress,
          action_type: actionType,
          metadata,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao registrar pontos');
      }

      const data = await response.json();
      this.currentPoints = data.total_points;
      this.tier = data.tier;

      // Mostrar notificação
      this.showPointsToast(data.points_earned, actionType);

      // Disparar evento
      window.dispatchEvent(new CustomEvent('pointsEarned', { 
        detail: data 
      }));

      // Atualizar saldo
      await this.fetchBalance();

      return data;
    } catch (error) {
      console.error('❌ Erro ao registrar ação:', error);
      throw error;
    }
  }

  /**
   * Mostrar toast de pontos ganhos
   */
  showPointsToast(points, actionType) {
    const toast = document.createElement('div');
    toast.className = 'points-toast';
    toast.innerHTML = `
      <div class="points-toast-content">
        <div class="points-icon">🎉</div>
        <div class="points-text">
          <strong>+${points} pontos!</strong>
          <small>${this.getActionLabel(actionType)}</small>
        </div>
      </div>
    `;
    toast.style.cssText = `
      position: fixed;
      top: 80px;
      right: 20px;
      padding: 16px 24px;
      background: linear-gradient(135deg, #ff2fb3, #7a2cff);
      color: white;
      border-radius: 12px;
      box-shadow: 0 8px 24px rgba(255, 47, 179, 0.4);
      z-index: 10000;
      animation: slideInRight 0.3s ease-out;
    `;

    const style = document.createElement('style');
    style.textContent = `
      @keyframes slideInRight {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
      .points-toast-content {
        display: flex;
        align-items: center;
        gap: 12px;
      }
      .points-icon {
        font-size: 24px;
      }
      .points-text {
        display: flex;
        flex-direction: column;
      }
      .points-text strong {
        font-size: 16px;
      }
      .points-text small {
        font-size: 12px;
        opacity: 0.9;
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
    }, 3000);
  }

  /**
   * Label amigável da ação
   */
  getActionLabel(actionType) {
    const labels = {
      'signup': 'Cadastro concluído',
      'wallet_connect': 'Wallet conectada',
      'share_twitter': 'Compartilhado no Twitter',
      'share_facebook': 'Compartilhado no Facebook',
      'referral': 'Amigo convidado',
      'tutorial_complete': 'Tutorial completo',
      'first_purchase': 'Primeira compra',
      'daily_login': 'Login diário',
      'profile_complete': 'Perfil completo',
    };
    return labels[actionType] || actionType;
  }

  /**
   * Obter tier atual
   */
  getTierInfo() {
    const tiers = {
      'bronze': { name: 'Bronze', color: '#CD7F32', min: 0, max: 99 },
      'silver': { name: 'Silver', color: '#C0C0C0', min: 100, max: 249 },
      'gold': { name: 'Gold', color: '#FFD700', min: 250, max: 499 },
      'platinum': { name: 'Platinum', color: '#E5E4E2', min: 500, max: 999 },
      'diamond': { name: 'Diamond', color: '#B9F2FF', min: 1000, max: Infinity },
    };
    return tiers[this.tier] || tiers.bronze;
  }

  /**
   * Obter progresso para próximo tier
   */
  getProgress() {
    const tierInfo = this.getTierInfo();
    const nextTier = this.getNextTier();
    
    if (!nextTier) {
      return 100; // Já está no tier máximo
    }

    const progress = ((this.currentPoints - tierInfo.min) / (nextTier.min - tierInfo.min)) * 100;
    return Math.min(100, Math.max(0, progress));
  }

  /**
   * Obter próximo tier
   */
  getNextTier() {
    const tiers = ['bronze', 'silver', 'gold', 'platinum', 'diamond'];
    const currentIndex = tiers.indexOf(this.tier);
    
    if (currentIndex === -1 || currentIndex === tiers.length - 1) {
      return null; // Já está no tier máximo
    }

    const tierInfo = {
      'bronze': { name: 'Bronze', min: 0 },
      'silver': { name: 'Silver', min: 100 },
      'gold': { name: 'Gold', min: 250 },
      'platinum': { name: 'Platinum', min: 500 },
      'diamond': { name: 'Diamond', min: 1000 },
    };

    return tierInfo[tiers[currentIndex + 1]];
  }
}

// Exportar instância global
if (typeof window !== 'undefined') {
  window.PointsSystem = new PointsSystem();
}

export default PointsSystem;
