/**
 * User Registration Module - NEØ FlowOFF
 * 
 * Sistema de cadastro de usuário com vinculação de wallet
 * Integra com API /api/register
 */

class UserRegistration {
  constructor() {
    this.isRegistered = false;
    this.currentUser = null;
    this.registrationModal = null;
  }

  /**
   * Verificar se usuário já está cadastrado (via localStorage)
   */
  isUserRegistered() {
    const userData = window.SafeLocalStorage?.getItem('user_data');
    if (userData) {
      try {
        this.currentUser = JSON.parse(userData);
        this.isRegistered = true;
        return true;
      } catch (e) {
        window.Logger?.error('Erro ao parse user_data:', e);
        return false;
      }
    }
    return false;
  }

  /**
   * Obter dados do usuário atual
   */
  getCurrentUser() {
    if (!this.isUserRegistered()) return null;
    return this.currentUser;
  }

  /**
   * Criar modal de registro
   */
  createRegistrationModal() {
    if (this.registrationModal) return this.registrationModal;

    const modal = document.createElement('dialog');
    modal.id = 'registration-modal';
    modal.className = 'registration-modal';

    const content = document.createElement('div');
    content.className = 'registration-modal-content';

    // Header
    const header = document.createElement('div');
    header.className = 'registration-header';

    const title = document.createElement('h3');
    title.textContent = '🎉 Bem-vindo ao NEØ FlowOFF';
    title.style.cssText = 'margin: 0; font-size: 24px; background: linear-gradient(135deg, #ff2fb3, #00d0ff); -webkit-background-clip: text; background-clip: text; color: transparent;';

    const subtitle = document.createElement('p');
    subtitle.textContent = 'Complete seu cadastro para aproveitar todos os recursos';
    subtitle.style.cssText = 'margin: 8px 0 0; color: #9aa0aa; font-size: 14px;';

    header.appendChild(title);
    header.appendChild(subtitle);

    // Form
    const form = document.createElement('form');
    form.id = 'registration-form';
    form.className = 'registration-form';
    form.style.cssText = 'display: flex; flex-direction: column; gap: 20px; margin-top: 24px;';

    // Email field
    const emailGroup = this.createFormGroup('email', 'Email', 'email', true);
    form.appendChild(emailGroup);

    // Username field (optional)
    const usernameGroup = this.createFormGroup('username', 'Nome de usuário (opcional)', 'text', false);
    form.appendChild(usernameGroup);

    // Full name field (optional)
    const fullNameGroup = this.createFormGroup('full_name', 'Nome completo (opcional)', 'text', false);
    form.appendChild(fullNameGroup);

    // Wallet info (readonly)
    const walletGroup = document.createElement('div');
    walletGroup.className = 'form-group';
    const walletLabel = document.createElement('label');
    walletLabel.textContent = 'Wallet conectada';
    walletLabel.style.cssText = 'font-size: 14px; font-weight: 600; color: #e6e6f0; margin-bottom: 8px;';
    
    const walletInput = document.createElement('input');
    walletInput.type = 'text';
    walletInput.id = 'wallet_address';
    walletInput.readonly = true;
    walletInput.placeholder = 'Conecte sua wallet primeiro';
    walletInput.style.cssText = 'padding: 12px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.1); background: rgba(255,255,255,0.05); color: #9aa0aa; width: 100%; box-sizing: border-box; font-size: 14px;';
    
    walletGroup.appendChild(walletLabel);
    walletGroup.appendChild(walletInput);
    form.appendChild(walletGroup);

    // Terms checkbox
    const termsGroup = document.createElement('div');
    termsGroup.style.cssText = 'display: flex; align-items: start; gap: 12px;';
    
    const termsCheckbox = document.createElement('input');
    termsCheckbox.type = 'checkbox';
    termsCheckbox.id = 'terms';
    termsCheckbox.required = true;
    termsCheckbox.style.cssText = 'margin-top: 4px; cursor: pointer;';
    
    const termsLabel = document.createElement('label');
    termsLabel.htmlFor = 'terms';
    termsLabel.innerHTML = 'Aceito os <a href="/terms" target="_blank" style="color: #ff2fb3; text-decoration: none;">Termos de Uso</a> e <a href="/privacy" target="_blank" style="color: #ff2fb3; text-decoration: none;">Política de Privacidade</a>';
    termsLabel.style.cssText = 'font-size: 13px; color: #9aa0aa; cursor: pointer; line-height: 1.5;';
    
    termsGroup.appendChild(termsCheckbox);
    termsGroup.appendChild(termsLabel);
    form.appendChild(termsGroup);

    // Status message
    const statusMessage = document.createElement('div');
    statusMessage.id = 'registration-status';
    statusMessage.style.cssText = 'display: none; padding: 12px; border-radius: 8px; font-size: 14px;';
    form.appendChild(statusMessage);

    // Buttons
    const buttonsGroup = document.createElement('div');
    buttonsGroup.style.cssText = 'display: flex; gap: 12px; margin-top: 8px;';

    const submitBtn = document.createElement('button');
    submitBtn.type = 'submit';
    submitBtn.textContent = 'Criar Conta';
    submitBtn.style.cssText = 'flex: 1; padding: 14px; border: none; border-radius: 8px; background: linear-gradient(135deg, #ff2fb3, #7a2cff); color: white; font-weight: 600; font-size: 16px; cursor: pointer; transition: transform 0.2s;';
    submitBtn.onmouseover = () => submitBtn.style.transform = 'translateY(-2px)';
    submitBtn.onmouseout = () => submitBtn.style.transform = 'translateY(0)';

    const cancelBtn = document.createElement('button');
    cancelBtn.type = 'button';
    cancelBtn.textContent = 'Agora Não';
    cancelBtn.style.cssText = 'padding: 14px 24px; border: 1px solid rgba(255,255,255,0.2); border-radius: 8px; background: transparent; color: #9aa0aa; font-weight: 600; font-size: 16px; cursor: pointer; transition: all 0.2s;';
    cancelBtn.onmouseover = () => {
      cancelBtn.style.background = 'rgba(255,255,255,0.05)';
      cancelBtn.style.color = '#e6e6f0';
    };
    cancelBtn.onmouseout = () => {
      cancelBtn.style.background = 'transparent';
      cancelBtn.style.color = '#9aa0aa';
    };
    cancelBtn.onclick = () => modal.close();

    buttonsGroup.appendChild(cancelBtn);
    buttonsGroup.appendChild(submitBtn);
    form.appendChild(buttonsGroup);

    // Form submit handler
    form.onsubmit = (e) => this.handleRegistration(e);

    content.appendChild(header);
    content.appendChild(form);
    modal.appendChild(content);

    // Add styles
    this.addModalStyles();

    document.body.appendChild(modal);
    this.registrationModal = modal;
    
    return modal;
  }

  /**
   * Criar grupo de formulário
   */
  createFormGroup(id, label, type, required) {
    const group = document.createElement('div');
    group.className = 'form-group';

    const labelEl = document.createElement('label');
    labelEl.htmlFor = id;
    labelEl.textContent = label + (required ? ' *' : '');
    labelEl.style.cssText = 'font-size: 14px; font-weight: 600; color: #e6e6f0; margin-bottom: 8px; display: block;';

    const input = document.createElement('input');
    input.type = type;
    input.id = id;
    input.name = id;
    input.required = required;
    input.style.cssText = 'padding: 12px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.1); background: rgba(255,255,255,0.05); color: #e6e6f0; width: 100%; box-sizing: border-box; font-size: 14px; transition: border-color 0.2s;';
    input.onfocus = () => input.style.borderColor = '#ff2fb3';
    input.onblur = () => input.style.borderColor = 'rgba(255,255,255,0.1)';

    group.appendChild(labelEl);
    group.appendChild(input);
    return group;
  }

  /**
   * Adicionar estilos do modal
   */
  addModalStyles() {
    if (document.getElementById('registration-modal-styles')) return;

    const style = document.createElement('style');
    style.id = 'registration-modal-styles';
    style.textContent = `
      .registration-modal {
        border: none;
        border-radius: 20px;
        padding: 32px;
        max-width: 500px;
        width: 90vw;
        background: linear-gradient(180deg, rgba(15, 15, 22, 0.95), rgba(10, 10, 16, 0.98));
        backdrop-filter: blur(20px);
        -webkit-backdrop-filter: blur(20px);
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
        border: 1px solid rgba(255, 255, 255, 0.1);
      }
      .registration-modal::backdrop {
        background: rgba(0, 0, 0, 0.8);
        backdrop-filter: blur(8px);
      }
      @media (max-width: 600px) {
        .registration-modal {
          padding: 24px;
          max-width: 90vw;
        }
      }
    `;
    document.head.appendChild(style);
  }

  /**
   * Mostrar modal de registro
   * @param {string} walletAddress - Endereço da wallet conectada
   * @param {string} provider - Provider usado (metamask, web3auth, etc)
   */
  async showRegistrationModal(walletAddress, provider = 'metamask') {
    // Verificar se já está registrado
    if (this.isUserRegistered()) {
      window.Logger?.info('Usuário já registrado:', this.currentUser);
      return this.currentUser;
    }

    const modal = this.createRegistrationModal();
    
    // Preencher wallet address
    const walletInput = document.getElementById('wallet_address');
    if (walletInput) {
      walletInput.value = walletAddress;
    }

    // Guardar provider para uso no submit
    modal.dataset.provider = provider;
    modal.dataset.walletAddress = walletAddress;

    modal.showModal();
  }

  /**
   * Handler do formulário de registro
   */
  async handleRegistration(event) {
    event.preventDefault();

    const form = event.target;
    const modal = form.closest('.registration-modal');
    const statusDiv = document.getElementById('registration-status');
    const submitBtn = form.querySelector('button[type="submit"]');

    // Desabilitar botão
    submitBtn.disabled = true;
    submitBtn.textContent = 'Registrando...';

    // Coletar dados
    const formData = {
      email: form.email.value.trim(),
      username: form.username?.value.trim() || null,
      full_name: form.full_name?.value.trim() || null,
      wallet_address: modal.dataset.walletAddress,
      provider: modal.dataset.provider || 'metamask',
      chain_id: 8453, // BASE
    };

    try {
      // Chamar API
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Token': window.API_TOKEN || '',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao registrar usuário');
      }

      // Sucesso!
      window.Logger?.info('✅ Usuário registrado:', data.user);

      // Salvar dados do usuário
      window.SafeLocalStorage?.setItem('user_data', JSON.stringify(data.user));
      this.currentUser = data.user;
      this.isRegistered = true;

      // Mostrar mensagem de sucesso
      statusDiv.style.display = 'block';
      statusDiv.style.background = 'rgba(74, 222, 128, 0.1)';
      statusDiv.style.color = '#4ade80';
      statusDiv.style.border = '1px solid rgba(74, 222, 128, 0.3)';
      statusDiv.textContent = '✅ Cadastro concluído com sucesso!';

      // Fechar modal após 2 segundos
      setTimeout(() => {
        modal.close();
        
        // Disparar evento customizado
        const event = new CustomEvent('userRegistered', { 
          detail: data.user 
        });
        window.dispatchEvent(event);
      }, 2000);

    } catch (error) {
      window.Logger?.error('❌ Erro no registro:', error);

      // Mostrar mensagem de erro
      statusDiv.style.display = 'block';
      statusDiv.style.background = 'rgba(239, 68, 68, 0.1)';
      statusDiv.style.color = '#ef4444';
      statusDiv.style.border = '1px solid rgba(239, 68, 68, 0.3)';
      statusDiv.textContent = `❌ ${error.message}`;

      // Reabilitar botão
      submitBtn.disabled = false;
      submitBtn.textContent = 'Tentar Novamente';
    }
  }

  /**
   * Logout (limpar dados do usuário)
   */
  logout() {
    window.SafeLocalStorage?.removeItem('user_data');
    this.currentUser = null;
    this.isRegistered = false;
    window.Logger?.info('Usuário deslogado');
  }
}

// Exportar instância global
if (typeof window !== 'undefined') {
  window.UserRegistration = new UserRegistration();
}

export default UserRegistration;
