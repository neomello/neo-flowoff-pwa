# NEØ FlowOFF PWA

PWA da NEØ·FlowOFF - Progressive Web Application para acesso ao ecossistema FlowOFF.

## Descrição

Aplicação web progressiva (PWA) desenvolvida para fornecer acesso completo ao ecossistema NEØ FlowOFF, incluindo:

-  Chat com IA (NEO)
-  Integração com wallet Web3 ($NEOFLW)
-  Formulários de contato com sincronização offline
-  Interface moderna com Glass Morphism
-  Suporte completo offline via Service Worker

## Instalação

```bash
# Clone o repositório
git clone git@github.com:neomello/neo-flowoff-pwa.git
cd neo-flowoff-pwa

# Instale as dependências
npm install

# Configure variáveis de ambiente
cp env-example.txt .env
# Edite .env com suas configurações

# Inicie o servidor de desenvolvimento
npm run dev
```

## Uso

### Desenvolvimento

```bash
npm run dev
```

Acesse `http://localhost:3000`

### Produção

```bash
npm run build
npm start
```

### Deploy IPFS

```bash
npm run deploy:ipfs
```

## Estrutura

```text
neo-flowoff-pwa/
├── js/
│   ├── app.js              # App principal
│   ├── chat-ai.js          # Chat com IA
│   ├── wallet.js           # Gerenciamento de wallet
│   ├── form-validator.js   # Validação de formulários
│   └── ...
├── css/                    # Estilos modulares
├── public/                 # Assets públicos
├── docs/                   # Documentação
├── scripts/                # Scripts de build e deploy
├── sw.js                   # Service Worker
└── server.js               # Servidor Node.js
```

## Tecnologias

-  Vanilla JavaScript (ES6+)
-  Service Worker (PWA)
-  IndexedDB (Fila offline)
-  Node.js (Servidor)
-  IPFS/Storacha (Deploy descentralizado)

## Segurança

Este projeto implementa:

-  Sanitização de todas as entradas de usuário
-  Rate limiting em operações críticas
-  CORS restrito em produção
-  Validação robusta de dados
-  Prevenção de XSS e CSRF

Consulte `SECURITY.md` para mais informações.

## Contribuindo

Este projeto segue os padrões NEØ. Consulte `CONTRIBUTING.md` para mais informações.

## Licença

MIT

---

## Contact

[neo@neoprotocol.space](mailto:neo@neoprotocol.space)

</div>

<div align="center">
  <a href="https://x.com/node_mello">
    <img src="https://img.shields.io/badge/-@node_mello-ff008e?style=flat-square&logo=twitter&logoColor=white" alt="Twitter @node_mello" />
  </a>
  <a href="https://www.instagram.com/neoprotocol.eth/">
    <img src="https://img.shields.io/badge/-@neoprotocol.eth-ff008e?style=flat-square&logo=instagram&logoColor=white" alt="Instagram @neoprotocol.eth" />
  </a>
  <a href="https://etherscan.io/">
    <img src="https://img.shields.io/badge/-neomello.eth-ff008e?style=flat-square&logo=ethereum&logoColor=white" alt="Ethereum neomello.eth" />
  </a>
</div>

<div align="center">
  <i>"Expand until silence becomes structure."</i>
</div>
