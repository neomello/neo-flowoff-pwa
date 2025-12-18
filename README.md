# 🚀 NEØ.FLOWOFF PWA

**Agência de Marketing na Blockchain**  
Desenvolvimento de sistemas, WebApp's, IAs e tokenização.

---

## 📋 Sobre

PWA (Progressive Web App) da NEØ.FLOWOFF, uma agência especializada em:
- Marketing digital avançado e estratégia
- Blockchain e Web3
- Desenvolvimento de sistemas, WebApps e PWAs
- Tokenização de ativos
- Agentes IA personalizados
- Arquitetura de ecossistemas digitais

---

## 🚀 Início Rápido

### Desenvolvimento Local

```bash
# Instalar dependências
npm install

# Iniciar servidor de desenvolvimento
npm run dev
# ou
make dev

# Acesse: http://localhost:3000
```

### Build para Produção

```bash
# Build
npm run build
# ou
make build

# Resultado em: ./dist/
```

---

## 📁 Estrutura do Projeto

### Principais Diretórios

- `js/` - JavaScript do frontend
- `css/` - CSS modularizado
- `public/` - Assets públicos (imagens, ícones)
- `scripts/` - Scripts de build e automação
- `config/` - Configurações (token, etc)

---

## 🌐 Domínios

- **Web2:** 
  - `flowoff.xyz`
  - `flowoff.com.br`
- **Web3:** 
  - `neoflowoff.eth` (ENS → IPNS)

---

## 🪙 Token $NEOFLW

Token oficial na rede **Base**:

```bash
# Ver informações do token
npm run token:info
# ou
make token-info
```

- **Contrato:** `0x6575933669e530dC25aaCb496cD8e402B8f26Ff5`
- **Rede:** Base (Chain ID: 8453)
- **Dashboard:** [thirdweb.com/base/0x6575...](https://thirdweb.com/base/0x6575933669e530dC25aaCb496cD8e402B8f26Ff5)

---

## 🛠️ Scripts Disponíveis

```bash
npm start          # Inicia servidor
npm run dev        # Desenvolvimento com nodemon
npm run build      # Build para produção
npm run test       # Testes de validação
npm run token:info # Informações do token $NEOFLW
npm run deploy:ipfs # Deploy para IPFS/IPNS
```

### Comandos Make

```bash
make help          # Lista comandos
make build         # Build da PWA
make dev           # Servidor local
make token-info    # Info do token
make deploy-ipfs   # Deploy IPFS/IPNS
make validate      # Valida estrutura
make clean         # Limpa build
```

---

## 🔧 Tecnologias

- **Frontend:** HTML5, CSS3, JavaScript (ES6+)
- **Backend:** Node.js (server.js para dev)
- **Deploy:** Vercel (Web2) + IPFS/IPNS (Web3)
- **Token:** Base Network (Thirdweb)
- **IA:** OpenAI (GPT-4o-mini) + Google Gemini
- **PWA:** Service Worker, Manifest, Offline support

---

## 📦 Dependências

- `axios` - HTTP client
- `cbor` - UCAN token support
- `dotenv` - Variáveis de ambiente
- `openai` - API OpenAI

---

## 🔐 Variáveis de Ambiente

Crie um arquivo `.env` na raiz (veja `env-example.txt`):

```env
PORT=3000
NODE_ENV=development

# APIs de IA
# OPENAI_API_KEY=seu_token_aqui
# GOOGLE_API_KEY=seu_token_aqui

# Thirdweb (Token)
THIRDWEB_CLIENT_ID=seu_client_id_aqui

# IPFS/IPNS
IPNS_KEY_NAME=neo-flowoff-pwa
```

---

## 📄 Licença

MIT

---

## 👤 Autor

**MELLØ™** - Arquiteto de Ecossistemas Digitais

- Website: https://flowoff.xyz
- ENS: neoflowoff.eth
- WhatsApp: +55 62 98323-1110

---

**Versão:** 2.2.0  
**Última atualização:** 2025-12-18
