# 🪙 Token NEOFLW - Documentação Completa

**Token oficial da NEØ.FLOWOFF na Base Network**

---

## 📋 Informações Básicas

- **Nome:** NEOFlowOFF
- **Símbolo:** NEOFLW
- **Decimais:** 18
- **Rede:** Base (Chain ID: 8453)
- **Padrão:** ERC-20
- **Twitter/X:** [@neoflw_on_chain](https://twitter.com/neoflw_on_chain)

---

## 🔗 Endereços e Links

### Contrato do Token
- **Endereço:** `0x6575933669e530dC25aaCb496cD8e402B8f26Ff5`
- **Basescan (Token):** https://basescan.org/token/0x6575933669e530dc25aacb496cd8e402b8f26ff5
- **Basescan (Contrato):** https://basescan.org/address/0x6575933669e530dc25aacb496cd8e402b8f26ff5
- **Thirdweb Dashboard:** https://thirdweb.com/base/0x6575933669e530dC25aaCb496cD8e402B8f26Ff5

### Pool de Liquidez (Uniswap V3)
- **Pool:** NEOFLW/WETH
- **NFT da Posição (LP):** https://basescan.org/nft/0x46a15b0b27311cedf172ab29e4f4766fbe7f4364/945419
- **Uniswap Pools (Base):** https://app.uniswap.org/explore/pools/8453
- **Transação de Liquidez:** https://basescan.org/tx/0x2d554f992624e5931d88966d3dbb23f28c4ab5ce01e9140f729b124738977f59

### Dexscreener
- **Dexscreener (Base - NEOFLW):** https://dexscreener.com/base/0x6575933669e530dC25aaCb496cD8e402B8f26Ff5

---

## ✅ Status do Projeto

### Tarefas Concluídas

- [x] **Deploy do Token NEOFLW**  
  Contrato: `0x6575933669e530dC25aaCb496cD8e402B8f26Ff5`
  
- [x] **Criação e injeção de liquidez inicial na pool Uniswap V3 (NEOFLW/WETH)**  
  Transação confirmada: `0x2d554f992624e5931d88966d3dbb23f28c4ab5ce01e9140f729b124738977f59`
  
- [x] **Visualização e gestão no Uniswap Pools**  
  Pool ativa e visível em: https://app.uniswap.org/explore/pools/8453
  
- [x] **Pool indexada na Dexscreener**  
  Disponível em: https://dexscreener.com/base/0x6575933669e530dC25aaCb496cD8e402B8f26Ff5

### Tarefas Pendentes

- [ ] **Revisar se a logo IPFS carrega corretamente**
  - Verificar acesso: `https://ipfs.io/ipfs/[CID_DA_IMAGEM]`
  - Testar gateways alternativos:
    - `https://cloudflare-ipfs.com/ipfs/[CID]`
    - `https://dweb.link/ipfs/[CID]`
  - Se não carregar, reupar usando:
    - [nft.storage](https://nft.storage/)
    - [web3.storage](https://web3.storage/)
  - Atualizar referência on-chain se necessário (via função admin/minter)

---

## 🛠️ Recursos do Token

### Features Implementadas
- ✅ Mintable (permitido criar novos tokens)
- ✅ Burnable (permitido queimar tokens)
- ✅ Permit (assinatura para aprovação de gastos)
- ✅ Votes (governança por votação)
- ✅ Delegatable (delegação de votos)

### Compilador
- **Versão:** v0.8.23+commit.f704f362

---

## 📊 Comandos Úteis

### Ver informações do token localmente
```bash
npm run token:info
# ou
make token-info
```

### Verificar token no Basescan
```bash
# Abrir no navegador
open https://basescan.org/token/0x6575933669e530dc25aacb496cd8e402b8f26ff5
```

### Acessar dashboard Thirdweb
```bash
open https://thirdweb.com/base/0x6575933669e530dC25aaCb496cD8e402B8f26Ff5
```

---

## 🔍 Verificação de Integridade

### Checklist de Validação

- [x] Token deployado e verificado no Basescan
- [x] Liquidez ativa na Uniswap V3
- [x] Pool visível no Uniswap Explorer
- [x] Pool indexada no Dexscreener
- [x] NFT de posição LP criada e visível
- [ ] Logo IPFS acessível (verificar)
- [ ] Metadata do token completa (verificar)

---

## 📝 Notas Importantes

- O token está totalmente funcional na Base Network
- A liquidez foi injetada com sucesso na pool Uniswap V3
- A pool está sendo indexada automaticamente pelo Dexscreener
- Se a imagem do token não aparecer, reenvie para IPFS e atualize a referência on-chain

---

## 🔗 Links Rápidos

| Recurso | Link |
|---------|------|
| Token (Basescan) | https://basescan.org/token/0x6575933669e530dc25aacb496cd8e402b8f26ff5 |
| Contrato (Basescan) | https://basescan.org/address/0x6575933669e530dc25aacb496cd8e402b8f26ff5 |
| Thirdweb Dashboard | https://thirdweb.com/base/0x6575933669e530dC25aaCb496cD8e402B8f26Ff5 |
| Uniswap Pools | https://app.uniswap.org/explore/pools/8453 |
| Dexscreener | https://dexscreener.com/base/0x6575933669e530dC25aaCb496cD8e402B8f26Ff5 |
| NFT LP Position | https://basescan.org/nft/0x46a15b0b27311cedf172ab29e4f4766fbe7f4364/945419 |
| Twitter/X | https://twitter.com/neoflw_on_chain |

---

**Última atualização:** 2025-01-XX  
**Mantido por:** MELLØ™ - NEØ.FLOWOFF

