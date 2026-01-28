/**
 * Leaderboard Widget - NEØ FlowOFF
 * 
 * Widget de ranking de pontos
 */

class LeaderboardWidget {
  constructor() {
    this.leaderboard = [];
    this.stats = {};
    this.myPosition = null;
  }

  /**
   * Buscar leaderboard
   */
  async fetch(limit = 100) {
    try {
      const response = await fetch(`/api/leaderboard?limit=${limit}`);
      
      if (!response.ok) throw new Error('Erro ao buscar leaderboard');

      const data = await response.json();
      this.leaderboard = data.leaderboard;
      this.stats = data.stats;

      return data;
    } catch (error) {
      console.error('❌ Erro ao buscar leaderboard:', error);
      return null;
    }
  }

  /**
   * Criar widget de leaderboard
   */
  async createWidget(containerSelector = 'body') {
    await this.fetch();

    const container = document.querySelector(containerSelector);
    if (!container) {
      console.error('Container não encontrado:', containerSelector);
      return;
    }

    const widget = document.createElement('div');
    widget.id = 'leaderboard-widget';
    widget.className = 'leaderboard-widget';
    widget.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      width: 320px;
      max-height: 500px;
      background: linear-gradient(180deg, rgba(15, 15, 22, 0.98), rgba(10, 10, 16, 0.98));
      backdrop-filter: blur(20px);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 16px;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);
      z-index: 9999;
      overflow: hidden;
      display: none;
    `;

    // Header
    const header = document.createElement('div');
    header.style.cssText = 'padding: 16px; background: rgba(255, 47, 179, 0.1); border-bottom: 1px solid rgba(255, 255, 255, 0.1); display: flex; justify-content: space-between; align-items: center;';
    
    const title = document.createElement('h3');
    title.textContent = '🏆 Leaderboard';
    title.style.cssText = 'margin: 0; font-size: 16px; color: #e6e6f0; font-weight: 700;';
    
    const closeBtn = document.createElement('button');
    closeBtn.textContent = '×';
    closeBtn.style.cssText = 'background: none; border: none; color: #9aa0aa; font-size: 24px; cursor: pointer; padding: 0; width: 24px; height: 24px;';
    closeBtn.onclick = () => widget.style.display = 'none';
    
    header.appendChild(title);
    header.appendChild(closeBtn);

    // Stats
    const statsDiv = document.createElement('div');
    statsDiv.style.cssText = 'padding: 16px; background: rgba(255, 255, 255, 0.03); border-bottom: 1px solid rgba(255, 255, 255, 0.1); display: grid; grid-template-columns: 1fr 1fr; gap: 8px;';
    
    const stat1 = this.createStat('👥', this.stats.total_participants || 0, 'Participantes');
    const stat2 = this.createStat('💎', this.stats.total_points_distributed || 0, 'Pontos');
    
    statsDiv.appendChild(stat1);
    statsDiv.appendChild(stat2);

    // Lista
    const list = document.createElement('div');
    list.style.cssText = 'max-height: 300px; overflow-y: auto; padding: 8px;';
    
    if (this.leaderboard.length === 0) {
      const empty = document.createElement('p');
      empty.textContent = 'Nenhum participante ainda';
      empty.style.cssText = 'text-align: center; color: #9aa0aa; padding: 32px;';
      list.appendChild(empty);
    } else {
      this.leaderboard.forEach((user, index) => {
        list.appendChild(this.createUserRow(user, index + 1));
      });
    }

    widget.appendChild(header);
    widget.appendChild(statsDiv);
    widget.appendChild(list);

    // Adicionar estilos de scrollbar
    const style = document.createElement('style');
    style.textContent = `
      .leaderboard-widget > div:last-child::-webkit-scrollbar {
        width: 6px;
      }
      .leaderboard-widget > div:last-child::-webkit-scrollbar-track {
        background: rgba(255, 255, 255, 0.05);
        border-radius: 3px;
      }
      .leaderboard-widget > div:last-child::-webkit-scrollbar-thumb {
        background: rgba(255, 47, 179, 0.5);
        border-radius: 3px;
      }
    `;
    document.head.appendChild(style);

    container.appendChild(widget);
    return widget;
  }

  /**
   * Criar stat card
   */
  createStat(icon, value, label) {
    const stat = document.createElement('div');
    stat.style.cssText = 'text-align: center;';
    
    const iconEl = document.createElement('div');
    iconEl.textContent = icon;
    iconEl.style.cssText = 'font-size: 20px; margin-bottom: 4px;';
    
    const valueEl = document.createElement('div');
    valueEl.textContent = value.toLocaleString();
    valueEl.style.cssText = 'font-size: 18px; font-weight: 700; color: #ff2fb3;';
    
    const labelEl = document.createElement('div');
    labelEl.textContent = label;
    labelEl.style.cssText = 'font-size: 11px; color: #9aa0aa;';
    
    stat.appendChild(iconEl);
    stat.appendChild(valueEl);
    stat.appendChild(labelEl);
    return stat;
  }

  /**
   * Criar linha de usuário
   */
  createUserRow(user, position) {
    const row = document.createElement('div');
    row.style.cssText = 'display: flex; align-items: center; gap: 12px; padding: 12px; margin: 4px 0; background: rgba(255, 255, 255, 0.03); border-radius: 8px; transition: all 0.2s;';
    
    row.onmouseover = () => row.style.background = 'rgba(255, 47, 179, 0.1)';
    row.onmouseout = () => row.style.background = 'rgba(255, 255, 255, 0.03)';

    // Rank
    const rank = document.createElement('div');
    rank.textContent = this.getRankEmoji(position);
    rank.style.cssText = 'font-size: 20px; width: 24px; text-align: center;';
    
    // Info
    const info = document.createElement('div');
    info.style.cssText = 'flex: 1;';
    
    const name = document.createElement('div');
    name.textContent = user.username || `${user.wallet_address.slice(0, 6)}...${user.wallet_address.slice(-4)}`;
    name.style.cssText = 'font-size: 14px; font-weight: 600; color: #e6e6f0;';
    
    const tier = document.createElement('div');
    tier.textContent = this.getTierBadge(user.tier);
    tier.style.cssText = 'font-size: 11px; color: #9aa0aa; margin-top: 2px;';
    
    info.appendChild(name);
    info.appendChild(tier);
    
    // Pontos
    const points = document.createElement('div');
    points.textContent = `${user.total_points} pts`;
    points.style.cssText = 'font-size: 14px; font-weight: 700; color: #ff2fb3;';

    row.appendChild(rank);
    row.appendChild(info);
    row.appendChild(points);
    return row;
  }

  /**
   * Emoji do ranking
   */
  getRankEmoji(position) {
    if (position === 1) return '🥇';
    if (position === 2) return '🥈';
    if (position === 3) return '🥉';
    return `#${position}`;
  }

  /**
   * Badge do tier
   */
  getTierBadge(tier) {
    const badges = {
      'bronze': '🥉 Bronze',
      'silver': '🥈 Silver',
      'gold': '🥇 Gold',
      'platinum': '💎 Platinum',
      'diamond': '💠 Diamond',
    };
    return badges[tier] || tier;
  }

  /**
   * Mostrar widget
   */
  show() {
    const widget = document.getElementById('leaderboard-widget');
    if (widget) {
      widget.style.display = 'block';
    }
  }

  /**
   * Esconder widget
   */
  hide() {
    const widget = document.getElementById('leaderboard-widget');
    if (widget) {
      widget.style.display = 'none';
    }
  }

  /**
   * Toggle widget
   */
  toggle() {
    const widget = document.getElementById('leaderboard-widget');
    if (widget) {
      widget.style.display = widget.style.display === 'none' ? 'block' : 'none';
    }
  }
}

// Exportar instância global
if (typeof window !== 'undefined') {
  window.LeaderboardWidget = new LeaderboardWidget();
}

export default LeaderboardWidget;
