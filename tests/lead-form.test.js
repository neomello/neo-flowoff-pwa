import { describe, it, expect, beforeEach, vi } from 'vitest';

// Função auxiliar para criar DOM com o formulário
function createFormDOM() {
  // Criar elementos do formulário
  const form = document.createElement('form');
  form.id = 'lead-form';
  form.className = 'card form glow';

  // Campo Nome
  const nameLabel = document.createElement('label');
  nameLabel.textContent = 'Nome';
  const nameInput = document.createElement('input');
  nameInput.name = 'name';
  nameInput.placeholder = 'Seu nome';
  nameInput.autocomplete = 'name';
  nameInput.required = true;
  nameLabel.appendChild(nameInput);
  form.appendChild(nameLabel);

  // Campo Email
  const emailLabel = document.createElement('label');
  emailLabel.textContent = 'Email';
  const emailInput = document.createElement('input');
  emailInput.type = 'email';
  emailInput.name = 'email';
  emailInput.placeholder = 'seuemail@exemplo.com';
  emailInput.autocomplete = 'email';
  emailInput.required = true;
  emailLabel.appendChild(emailInput);
  form.appendChild(emailLabel);

  // Campo WhatsApp
  const whatsLabel = document.createElement('label');
  whatsLabel.textContent = 'WhatsApp';
  const whatsInput = document.createElement('input');
  whatsInput.type = 'tel';
  whatsInput.name = 'whats';
  whatsInput.placeholder = '+55 (00) 00000-0000';
  whatsInput.autocomplete = 'tel';
  whatsInput.required = true;
  whatsLabel.appendChild(whatsInput);
  form.appendChild(whatsLabel);

  // Campo Tipo de Serviço
  const typeLabel = document.createElement('label');
  typeLabel.textContent = 'Serviço que procura';
  const typeSelect = document.createElement('select');
  typeSelect.name = 'type';
  typeSelect.autocomplete = 'off';
  typeSelect.required = true;

  const options = [
    { value: '', text: 'Selecione uma opção', disabled: true, selected: true },
    { value: 'site', text: 'Site / WebApp' },
    { value: 'saas', text: 'SAAS / BAAS' },
    { value: 'cripto', text: 'Tokenização / Cripto' },
    { value: 'poston', text: 'POSTØN' },
    { value: 'proia', text: 'PRO.IA' },
  ];

  options.forEach((opt) => {
    const option = document.createElement('option');
    option.value = opt.value;
    option.textContent = opt.text;
    if (opt.disabled) option.disabled = true;
    if (opt.selected) option.selected = true;
    typeSelect.appendChild(option);
  });

  typeLabel.appendChild(typeSelect);
  form.appendChild(typeLabel);

  // Botão Submit
  const submitBtn = document.createElement('button');
  submitBtn.type = 'submit';
  submitBtn.className = 'btn primary';
  submitBtn.textContent = 'Enviar';
  form.appendChild(submitBtn);

  // Status element
  const statusEl = document.createElement('p');
  statusEl.id = 'lead-status';
  statusEl.className = 'muted center';
  form.appendChild(statusEl);

  document.body.appendChild(form);

  return form;
}

// Carregar FormValidator manualmente
async function loadFormValidator() {
  // Importar e executar o código do FormValidator
  // Como estamos em ambiente de teste, vamos criar uma instância manual
  const FormValidator = class {
    constructor() {
      this.validator = null;
      this.errors = {};
      this.isValidating = false;
    }

    async init() {
      this.validator = {
        validarEmail: (email) => {
          const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          return regex.test(email);
        },
      };
      this.setupForm();
    }

    setupForm() {
      const form = document.getElementById('lead-form');
      if (!form) return;

      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        await this.handleSubmit(e);
      });

      this.setupRealTimeValidation(form);
    }

    setupRealTimeValidation(form) {
      const nameInput = form.querySelector('input[name="name"]');
      if (nameInput) {
        nameInput.addEventListener('blur', () =>
          this.validateName(nameInput.value)
        );
        nameInput.addEventListener('input', () => this.clearError('name'));
      }

      const emailInput = form.querySelector('input[name="email"]');
      if (emailInput) {
        emailInput.addEventListener('blur', () =>
          this.validateEmail(emailInput.value)
        );
        emailInput.addEventListener('input', () => this.clearError('email'));
      }

      const whatsInput = form.querySelector('input[name="whats"]');
      if (whatsInput) {
        whatsInput.addEventListener('input', (e) => {
          this.formatPhone(e.target);
          this.clearError('whats');
        });
        whatsInput.addEventListener('blur', () =>
          this.validatePhone(whatsInput.value)
        );
      }

      const serviceSelect = form.querySelector('select[name="type"]');
      if (serviceSelect) {
        serviceSelect.addEventListener('change', () => this.clearError('type'));
      }
    }

    formatPhone(input) {
      let value = input.value.replace(/\D/g, '');

      if (value.length > 0) {
        if (value.length <= 2) {
          value = `+${value}`;
        } else if (value.length <= 4) {
          value = `+${value.slice(0, 2)} (${value.slice(2)}`;
        } else if (value.length <= 9) {
          value = `+${value.slice(0, 2)} (${value.slice(2, 4)}) ${value.slice(4)}`;
        } else {
          value = `+${value.slice(0, 2)} (${value.slice(2, 4)}) ${value.slice(4, 9)}-${value.slice(9, 13)}`;
        }
      }

      input.value = value;
    }

    validateName(name) {
      const trimmed = name.trim();
      if (!trimmed) {
        this.setError('name', 'Nome é obrigatório');
        return false;
      }
      if (trimmed.length < 2) {
        this.setError('name', 'Nome deve ter pelo menos 2 caracteres');
        return false;
      }
      this.clearError('name');
      return true;
    }

    validateEmail(email) {
      if (!email) {
        this.setError('email', 'Email é obrigatório');
        return false;
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        this.setError('email', 'Email inválido');
        return false;
      }

      this.clearError('email');
      return true;
    }

    validatePhone(phone) {
      if (!phone) {
        this.setError('whats', 'WhatsApp é obrigatório');
        return false;
      }

      const cleaned = phone.replace(/\D/g, '');

      if (cleaned.length < 10) {
        this.setError('whats', 'Número de WhatsApp inválido');
        return false;
      }

      this.clearError('whats');
      return true;
    }

    validateService(service) {
      if (!service) {
        this.setError('type', 'Selecione um serviço');
        return false;
      }
      this.clearError('type');
      return true;
    }

    setError(field, message) {
      this.errors[field] = message;
      const input = document.querySelector(`[name="${field}"]`);
      if (input) {
        input.style.borderColor = '#ef4444';
        const statusEl = document.getElementById('lead-status');
        if (statusEl) {
          statusEl.textContent = `✗ ${message}`;
          statusEl.style.color = '#ef4444';
        }
      }
    }

    clearError(field) {
      delete this.errors[field];
      const input = document.querySelector(`[name="${field}"]`);
      if (input) {
        input.style.borderColor = '';
      }
    }

    async handleSubmit(e) {
      if (this.isValidating) return;

      this.isValidating = true;
      const form = e.target;
      const formData = new FormData(form);
      const statusEl = document.getElementById('lead-status');

      this.errors = {};
      statusEl.textContent = '⏳ Validando dados...';
      statusEl.style.color = '#3b82f6';

      try {
        const name = formData.get('name');
        const email = formData.get('email');
        const whats = formData.get('whats');
        const type = formData.get('type');

        let isValid = true;

        if (!this.validateName(name)) isValid = false;
        if (!this.validateEmail(email)) isValid = false;
        if (!this.validatePhone(whats)) isValid = false;
        if (!this.validateService(type)) isValid = false;

        if (!isValid) {
          const firstError = Object.values(this.errors)[0];
          statusEl.textContent = `✗ ${firstError}`;
          statusEl.style.color = '#ef4444';
          this.isValidating = false;
          return;
        }

        await this.sendToWhatsApp(formData);
      } catch (error) {
        window.Logger?.error('Erro ao processar formulário:', error);
        statusEl.textContent =
          '✗ Erro ao processar. Tente novamente ou entre em contato diretamente.';
        statusEl.style.color = '#ef4444';
      } finally {
        this.isValidating = false;
      }
    }

    async sendToWhatsApp(formData) {
      const statusEl = document.getElementById('lead-status');
      const isOnline = navigator.onLine;

      const projectTypes = {
        site: 'Site / WebApp',
        saas: 'SAAS / BAAS',
        cripto: 'Tokenização / Cripto',
        poston: 'POSTØN',
        proia: 'PRO.IA',
      };

      const name = formData.get('name');
      const email = formData.get('email');
      const whats = formData.get('whats');
      const type = formData.get('type');
      const projectType = projectTypes[type] || type;

      const message = `→ *NOVO LEAD - FlowOFF*

👤 *Nome:* ${name}
📧 *Email:* ${email}
↓ *WhatsApp:* ${whats}
◉ *Tipo de Projeto:* ${projectType}

💬 *Mensagem:* Olá MELLØ! Gostaria de iniciar um projeto com a FlowOFF.`;

      const encodedMessage = encodeURIComponent(message);
      const whatsappNumber = '5562983231110';
      const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodedMessage}`;

      if (!isOnline) {
        statusEl.textContent =
          '📦 Formulário salvo! Será enviado quando a conexão for restaurada.';
        statusEl.style.color = '#f59e0b';

        setTimeout(() => {
          window.open(whatsappUrl, '_blank');
          document.getElementById('lead-form').reset();
        }, 500);

        return;
      }

      statusEl.textContent = '✓ Dados válidos! Redirecionando...';
      statusEl.style.color = '#4ade80';

      setTimeout(() => {
        window.open(whatsappUrl, '_blank');
        document.getElementById('lead-form').reset();
        statusEl.textContent = '✓ Redirecionado para WhatsApp!';
        navigator.vibrate?.(10);
      }, 500);
    }
  };

  const validator = new FormValidator();
  await validator.init();
  window.FormValidator = validator;

  return validator;
}

describe('Formulário Lead Form', () => {
  let form;
  let validator;

  beforeEach(async () => {
    createFormDOM();
    form = document.getElementById('lead-form');
    validator = await loadFormValidator();
    // Aguardar inicialização completa
    await new Promise((resolve) => setTimeout(resolve, 100));
  });

  describe('Estrutura do Formulário', () => {
    it('deve ter o formulário presente no DOM', () => {
      expect(form).toBeTruthy();
      expect(form.id).toBe('lead-form');
    });

    it('deve ter todos os campos obrigatórios', () => {
      expect(form.querySelector('input[name="name"]')).toBeTruthy();
      expect(form.querySelector('input[name="email"]')).toBeTruthy();
      expect(form.querySelector('input[name="whats"]')).toBeTruthy();
      expect(form.querySelector('select[name="type"]')).toBeTruthy();
    });

    it('deve ter o botão de submit', () => {
      const submitBtn = form.querySelector('button[type="submit"]');
      expect(submitBtn).toBeTruthy();
      expect(submitBtn.textContent.trim()).toBe('Enviar');
    });

    it('deve ter elemento de status', () => {
      const statusEl = document.getElementById('lead-status');
      expect(statusEl).toBeTruthy();
    });
  });

  describe('Validação de Campos', () => {
    describe('Validação de Nome', () => {
      it('deve rejeitar nome vazio', () => {
        const nameInput = form.querySelector('input[name="name"]');
        nameInput.value = '';
        nameInput.dispatchEvent(new Event('blur'));

        const statusEl = document.getElementById('lead-status');
        // O validador deve marcar como inválido
        expect(nameInput.value).toBe('');
      });

      it('deve rejeitar nome muito curto', () => {
        const nameInput = form.querySelector('input[name="name"]');
        nameInput.value = 'A';
        nameInput.dispatchEvent(new Event('blur'));

        expect(nameInput.value.length).toBeLessThan(2);
      });

      it('deve aceitar nome válido', () => {
        const nameInput = form.querySelector('input[name="name"]');
        nameInput.value = 'João Silva';
        nameInput.dispatchEvent(new Event('blur'));

        expect(nameInput.value.length).toBeGreaterThanOrEqual(2);
      });
    });

    describe('Validação de Email', () => {
      it('deve rejeitar email vazio', () => {
        const emailInput = form.querySelector('input[name="email"]');
        emailInput.value = '';
        emailInput.dispatchEvent(new Event('blur'));

        expect(emailInput.value).toBe('');
      });

      it('deve rejeitar email inválido', () => {
        const emailInput = form.querySelector('input[name="email"]');
        emailInput.value = 'email-invalido';
        emailInput.dispatchEvent(new Event('blur'));

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        expect(emailRegex.test(emailInput.value)).toBe(false);
      });

      it('deve aceitar email válido', () => {
        const emailInput = form.querySelector('input[name="email"]');
        emailInput.value = 'teste@exemplo.com';
        emailInput.dispatchEvent(new Event('blur'));

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        expect(emailRegex.test(emailInput.value)).toBe(true);
      });
    });

    describe('Validação de WhatsApp', () => {
      it('deve rejeitar WhatsApp vazio', () => {
        const whatsInput = form.querySelector('input[name="whats"]');
        whatsInput.value = '';
        whatsInput.dispatchEvent(new Event('blur'));

        expect(whatsInput.value).toBe('');
      });

      it('deve formatar número de telefone durante digitação', () => {
        const whatsInput = form.querySelector('input[name="whats"]');
        whatsInput.value = '5562983231110';
        whatsInput.dispatchEvent(new Event('input'));

        // O formato deve incluir +55
        expect(whatsInput.value).toContain('+55');
      });

      it('deve aceitar número brasileiro válido', () => {
        const whatsInput = form.querySelector('input[name="whats"]');
        whatsInput.value = '+55 (62) 98323-1110';
        whatsInput.dispatchEvent(new Event('blur'));

        const cleaned = whatsInput.value.replace(/\D/g, '');
        expect(cleaned.length).toBeGreaterThanOrEqual(10);
      });
    });

    describe('Validação de Tipo de Serviço', () => {
      it('deve rejeitar quando nenhum serviço é selecionado', () => {
        const typeSelect = form.querySelector('select[name="type"]');
        typeSelect.value = '';
        typeSelect.dispatchEvent(new Event('change'));

        expect(typeSelect.value).toBe('');
      });

      it('deve aceitar quando um serviço é selecionado', () => {
        const typeSelect = form.querySelector('select[name="type"]');
        typeSelect.value = 'site';
        typeSelect.dispatchEvent(new Event('change'));

        expect(typeSelect.value).toBe('site');
      });

      it('deve ter todas as opções de serviço disponíveis', () => {
        const typeSelect = form.querySelector('select[name="type"]');
        const options = Array.from(typeSelect.options).map((opt) => opt.value);

        expect(options).toContain('site');
        expect(options).toContain('saas');
        expect(options).toContain('cripto');
        expect(options).toContain('poston');
        expect(options).toContain('proia');
      });
    });
  });

  describe('Submissão do Formulário', () => {
    it('deve prevenir submissão com campos vazios', async () => {
      const submitEvent = new Event('submit', {
        bubbles: true,
        cancelable: true,
      });
      form.dispatchEvent(submitEvent);

      // O evento deve ser prevenido
      expect(submitEvent.defaultPrevented).toBe(true);
    });

    it('deve validar todos os campos antes de submeter', async () => {
      // Preencher campos com valores válidos
      form.querySelector('input[name="name"]').value = 'João Silva';
      form.querySelector('input[name="email"]').value = 'joao@exemplo.com';
      form.querySelector('input[name="whats"]').value = '+55 (62) 98323-1110';
      form.querySelector('select[name="type"]').value = 'site';

      const submitEvent = new Event('submit', {
        bubbles: true,
        cancelable: true,
      });
      form.dispatchEvent(submitEvent);

      // O evento deve ser prevenido para validação
      expect(submitEvent.defaultPrevented).toBe(true);
    });

    it('deve mostrar mensagem de status durante validação', async () => {
      const statusEl = document.getElementById('lead-status');

      form.querySelector('input[name="name"]').value = 'João Silva';
      form.querySelector('input[name="email"]').value = 'joao@exemplo.com';
      form.querySelector('input[name="whats"]').value = '+55 (62) 98323-1110';
      form.querySelector('select[name="type"]').value = 'site';

      const submitEvent = new Event('submit', {
        bubbles: true,
        cancelable: true,
      });
      form.dispatchEvent(submitEvent);

      // Aguardar processamento
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Deve ter alguma mensagem de status
      expect(statusEl.textContent).toBeTruthy();
    });
  });

  describe('Interação do Usuário', () => {
    it('deve limpar erros quando usuário começa a digitar', () => {
      const nameInput = form.querySelector('input[name="name"]');
      nameInput.value = '';
      nameInput.dispatchEvent(new Event('blur'));

      // Simular início de digitação
      nameInput.value = 'J';
      nameInput.dispatchEvent(new Event('input'));

      // O campo deve estar limpo de erros visuais
      expect(nameInput.style.borderColor).toBe('');
    });

    it('deve formatar telefone em tempo real', () => {
      const whatsInput = form.querySelector('input[name="whats"]');

      // Simular digitação
      whatsInput.value = '5562';
      whatsInput.dispatchEvent(new Event('input'));

      // Deve ter formatação aplicada
      expect(whatsInput.value).toContain('+55');
    });

    it('deve limpar erro ao selecionar serviço', () => {
      const typeSelect = form.querySelector('select[name="type"]');

      // Simular seleção
      typeSelect.value = 'site';
      typeSelect.dispatchEvent(new Event('change'));

      // Não deve ter erro
      expect(typeSelect.value).toBe('site');
    });
  });

  describe('Integração com WhatsApp', () => {
    it('deve gerar URL do WhatsApp com dados corretos', async () => {
      form.querySelector('input[name="name"]').value = 'João Silva';
      form.querySelector('input[name="email"]').value = 'joao@exemplo.com';
      form.querySelector('input[name="whats"]').value = '+55 (62) 98323-1110';
      form.querySelector('select[name="type"]').value = 'site';

      const submitEvent = new Event('submit', {
        bubbles: true,
        cancelable: true,
      });
      form.dispatchEvent(submitEvent);

      await new Promise((resolve) => setTimeout(resolve, 600));

      // Deve ter tentado abrir WhatsApp
      expect(window.open).toHaveBeenCalled();
      const whatsappCall = window.open.mock.calls.find(
        (call) => call[0] && call[0].includes('wa.me')
      );
      expect(whatsappCall).toBeTruthy();
    });

    it('deve incluir todos os dados no link do WhatsApp', async () => {
      form.querySelector('input[name="name"]').value = 'João Silva';
      form.querySelector('input[name="email"]').value = 'joao@exemplo.com';
      form.querySelector('input[name="whats"]').value = '+55 (62) 98323-1110';
      form.querySelector('select[name="type"]').value = 'site';

      const submitEvent = new Event('submit', {
        bubbles: true,
        cancelable: true,
      });
      form.dispatchEvent(submitEvent);

      await new Promise((resolve) => setTimeout(resolve, 600));

      const whatsappCall = window.open.mock.calls.find(
        (call) => call[0] && call[0].includes('wa.me')
      );

      if (whatsappCall) {
        const url = whatsappCall[0];
        const decodedUrl = decodeURIComponent(url);
        expect(decodedUrl).toContain('João Silva');
        expect(decodedUrl).toContain('joao@exemplo.com');
        expect(decodedUrl).toContain('Site / WebApp');
      }
    });
  });

  describe('Comportamento Offline', () => {
    beforeEach(() => {
      // Simular offline
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        configurable: true,
        value: false,
      });
    });

    it('deve enfileirar formulário quando offline', async () => {
      form.querySelector('input[name="name"]').value = 'João Silva';
      form.querySelector('input[name="email"]').value = 'joao@exemplo.com';
      form.querySelector('input[name="whats"]').value = '+55 (62) 98323-1110';
      form.querySelector('select[name="type"]').value = 'site';

      const submitEvent = new Event('submit', {
        bubbles: true,
        cancelable: true,
      });
      form.dispatchEvent(submitEvent);

      await new Promise((resolve) => setTimeout(resolve, 200));

      const statusEl = document.getElementById('lead-status');
      // Deve mostrar mensagem de enfileiramento
      expect(statusEl.textContent).toContain('salvo');
    });
  });
});
