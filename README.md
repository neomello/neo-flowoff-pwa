# NEØ FlowOFF PWA

PWA da NEØ·FlowOFF - Progressive Web Application para acesso ao ecossistema FlowOFF.

## 🚀 Sobre

Aplicação web progressiva que oferece acesso ao ecossistema NEØ FlowOFF com chat IA, integração Web3 e funcionalidades offline.

## 📊 Arquitetura de Deploy

```mermaid
flowchart TB
subgraph SOURCE["📦 NEØ.FLOWOFF PWA"]
CODE["Código Fonte<br/>GitHub"]
end
subgraph WEB2["🌐 WEB2 - Vercel"]
    VERCEL["Vercel Edge<br/>CDN Global"]
    FLOWXYZ["flowoff.xyz"]
    FLOWBR["flowoff.com.br"]
    PREVIEW["*.vercel.app"]
end

subgraph WEB3["⛓️ WEB3 - Descentralizado"]
    STORACHA["Storacha<br/>IPFS Upload"]
    IPFS["IPFS<br/>Content Hash"]
    IPNS["IPNS<br/>Mutable Pointer"]
    ENS["ENS<br/>neoflowoff.eth"]
end

subgraph GATEWAYS["🚪 Gateways IPFS"]
    GW1["dweb.link"]
    GW2["w3s.link"]
    GW3["ipfs.io"]
end

subgraph USERS["👥 Usuários"]
    USER1["🌍 Global"]
    USER2["🇧🇷 Brasil"]
    USER3["🦊 Web3 Native"]
end

CODE -->|"make deploy"| VERCEL
CODE -->|"make deploy-ipfs"| STORACHA

VERCEL --> FLOWXYZ
VERCEL --> FLOWBR
VERCEL --> PREVIEW

STORACHA --> IPFS
IPFS --> IPNS
IPNS --> ENS
IPNS --> GW1
IPNS --> GW2
IPNS --> GW3

FLOWXYZ --> USER1
FLOWBR --> USER2
ENS --> USER3
GW1 --> USER3

style SOURCE fill:#1a1a2e,stroke:#8b5cf6,color:#fff
style WEB2 fill:#0f172a,stroke:#3b82f6,color:#fff
style WEB3 fill:#0f172a,stroke:#10b981,color:#fff
style GATEWAYS fill:#1e1e2e,stroke:#f59e0b,color:#fff
style USERS fill:#1e1e2e,stroke:#ec4899,color:#fff
```

## ⚡ Início Rápido

```bash
# Clone e instale
git clone git@github.com:neomello/neo-flowoff-pwa.git
cd neo-flowoff-pwa
npm install

# Configure variáveis de ambiente
cp env-example.txt .env

# Desenvolvimento
npm run dev

# Build para produção
npm run build
```

## 🌐 Deploy

### Web2 (Vercel)

```bash
make deploy
```

Deploy automático via Vercel para `flowoff.xyz` e `flowoff.com.br`.

### Web3 (IPFS/IPNS)

```bash
make deploy-ipfs
```

Deploy descentralizado via Storacha para IPFS/IPNS e ENS (`neoflowoff.eth.link`).

## 📚 Documentação

-  [Domínios e Deploy](./docs/DOMINIOS.md) - Arquitetura completa de deploy
-  [Guia Storacha/IPFS](./GUIA_STORACHA_IPFS.md) - Configuração Web3
-  [Contribuindo](./CONTRIBUTING.md) - Padrões de contribuição
-  [Segurança](./SECURITY.md) - Política de segurança

## 🛡️ Segurança

Implementa sanitização de entradas, rate limiting, CORS restrito e validação robusta. Consulte `SECURITY.md` para detalhes.

## 📄 Licença

MIT

---

<div align="center">
  <a href="mailto:neo@neoprotocol.space">
    <img src="https://img.shields.io/badge/-neo@neoprotocol.space-ff008e?style=flat-square&logo=gmail&logoColor=white" alt="Email" />
  </a>
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
