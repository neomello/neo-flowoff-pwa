# 🔍 Verificação de ENS Domain

**Data**: 2025-01-27  
**Status**: Instruções para verificação

---

## 📋 Configuração Atual do ENS Domain

### Domain Configurado
- **ENS Domain**: `neoflowoff.eth`
- **Gateway IPFS**: `https://neoflowoff.eth.link`
- **IPNS Key**: `neo-flowoff-pwa`
- **IPNS ID**: `k51qzi5uqu5dibn355zoh239agkln7mpvvu8iyk4jv2t1letihnm36s6ym4yts`

### Onde está Configurado

1. **`api/utils.js`** (linha 54):
   ```javascript
   'https://neoflowoff.eth.link',
   ```

2. **`server.js`** (linha 86):
   ```javascript
   'https://neoflowoff.eth.link',
   ```

3. **Referências em HTML**:
   - `index.html` - Instagram: `@neoflowoff.eth`
   - `desktop.html` - Instagram: `@neoflowoff.eth`

---

## ✅ Como Verificar se o ENS Domain está Correto

### 1. Verificar Resolução do ENS

#### Opção A: Via Navegador (com extensão MetaMask)
1. Abra o MetaMask
2. Vá para "Settings" → "Advanced" → "Show incoming transactions"
3. Acesse: `https://neoflowoff.eth.link` no navegador
4. Verifique se o site carrega corretamente

#### Opção B: Via Terminal (usando `ens-resolver` ou `ethers`)
```bash
# Instalar ferramenta (se necessário)
npm install -g @ensdomains/ens

# Verificar resolução
ens resolve neoflowoff.eth
```

#### Opção C: Via Etherscan/ENS Explorer
1. Acesse: https://app.ens.domains/neoflowoff.eth
2. Verifique:
   - ✅ Domain está registrado
   - ✅ Content Hash aponta para IPFS/IPNS correto
   - ✅ Resolver está configurado

### 2. Verificar Content Hash no ENS

O Content Hash do ENS deve apontar para o IPNS ID atual:

**IPNS ID Atual**: `k51qzi5uqu5dibn355zoh239agkln7mpvvu8iyk4jv2t1letihnm36s6ym4yts`

**Como verificar**:
1. Acesse: https://app.ens.domains/neoflowoff.eth
2. Vá para a aba "Records"
3. Verifique o campo "Content Hash"
4. Deve conter: `/ipns/k51qzi5uqu5dibn355zoh239agkln7mpvvu8iyk4jv2t1letihnm36s6ym4yts`

### 3. Verificar Gateway IPFS

Teste se o gateway está funcionando:

```bash
# Testar acesso direto
curl -I https://neoflowoff.eth.link

# Deve retornar HTTP 200 ou 301/302 (redirect)
```

### 4. Verificar IPNS Resolution

Teste se o IPNS resolve corretamente:

```bash
# Via IPFS Gateway
curl -I https://ipfs.io/ipns/k51qzi5uqu5dibn355zoh239agkln7mpvvu8iyk4jv2t1letihnm36s6ym4yts

# Via dweb.link
curl -I https://dweb.link/ipns/k51qzi5uqu5dibn355zoh239agkln7mpvvu8iyk4jv2t1letihnm36s6ym4yts
```

---

## 🔧 Como Atualizar o ENS Domain (se necessário)

### Pré-requisitos
- MetaMask instalado e configurado
- Wallet com ETH suficiente para gas fees
- Acesso ao domain `neoflowoff.eth`

### Passos para Atualizar

1. **Acesse o ENS Manager**:
   - https://app.ens.domains/neoflowoff.eth

2. **Conecte sua Wallet**:
   - Clique em "Connect Wallet"
   - Selecione MetaMask
   - Confirme a conexão

3. **Atualize o Content Hash**:
   - Vá para a aba "Records"
   - Clique em "Edit" no campo "Content Hash"
   - Insira: `/ipns/k51qzi5uqu5dibn355zoh239agkln7mpvvu8iyk4jv2t1letihnm36s6ym4yts`
   - Confirme a transação no MetaMask
   - Aguarde confirmação (pode levar alguns minutos)

4. **Verifique a Atualização**:
   - Aguarde 5-10 minutos para propagação
   - Teste: `https://neoflowoff.eth.link`
   - Deve carregar o conteúdo do IPNS

---

## 📝 Checklist de Verificação

- [ ] ENS domain `neoflowoff.eth` está registrado
- [ ] Content Hash aponta para IPNS correto
- [ ] Gateway `neoflowoff.eth.link` está acessível
- [ ] IPNS resolve corretamente para o CID atual
- [ ] CORS está configurado para `neoflowoff.eth.link`
- [ ] Site carrega corretamente via ENS domain

---

## 🔗 Links Úteis

- **ENS Manager**: https://app.ens.domains/neoflowoff.eth
- **ENS Explorer**: https://ens.app/neoflowoff.eth
- **IPFS Gateway**: https://ipfs.io/ipns/k51qzi5uqu5dibn355zoh239agkln7mpvvu8iyk4jv2t1letihnm36s6ym4yts
- **dweb.link**: https://dweb.link/ipns/k51qzi5uqu5dibn355zoh239agkln7mpvvu8iyk4jv2t1letihnm36s6ym4yts

---

## ⚠️ Notas Importantes

1. **Propagação**: Mudanças no ENS podem levar 5-15 minutos para propagar
2. **Gas Fees**: Atualizar Content Hash requer ETH para gas fees
3. **IPNS vs IPFS**: ENS deve apontar para IPNS (não diretamente para CID)
4. **Gateway**: `.eth.link` é um gateway público que resolve ENS → IPFS/IPNS

---

**Última atualização**: 2025-01-27  
**IPNS ID Atual**: `k51qzi5uqu5dibn355zoh239agkln7mpvvu8iyk4jv2t1letihnm36s6ym4yts`
