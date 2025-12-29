# 📘 Guia Completo: Configuração IPFS com Storacha

## 🎯 Objetivo
Este guia instrui uma IA sobre como configurar e usar o Storacha para fazer upload de conteúdo para IPFS de forma descentralizada e permanente.

---

## 📋 Pré-requisitos

1. **Node.js** instalado (versão 18.x ou superior)
2. **IPFS Kubo** instalado e configurado localmente
3. **Storacha CLI** instalado globalmente: `npm install -g @storacha/cli`
4. **Conta Storacha** criada (opcional, mas recomendado)

---

## 🔧 Passo 1: Instalação e Configuração Inicial

### 1.1 Instalar Dependências

```bash
npm install @storacha/client files-from-path
```

### 1.2 Criar Agente Storacha

O Storacha usa um sistema de agentes (identidades) baseado em DID (Decentralized Identifier).

**Opção A: Usar Storacha CLI (Recomendado)**
```bash
# Criar um novo agente
storacha agent create

# Obter o DID do agente criado
storacha agent did
```

**Opção B: Usar código JavaScript**
```javascript
import { create } from '@storacha/client';

const client = await create();
const agentDID = client.agent?.did?.();
console.log('Agent DID:', agentDID);
```

**Salvar o Agent DID** - você precisará dele para gerar delegações.

---

## 🏗️ Passo 2: Criar ou Usar um Espaço Storacha

### 2.1 Criar um Novo Espaço

```bash
# Criar um novo espaço
storacha space create --name "MELLO"

# Listar espaços disponíveis
storacha space list

# Obter o DID do espaço criado
storacha space use <SPACE_DID>
storacha space did
```

### 2.2 Usar um Espaço Existente

Se você já tem um espaço, use o DID do espaço diretamente:
```bash
storacha space use did:key:z6Mkjee3CCaP6q2vhRnE3wRBGNqMxEq645EvnYocsbbeZiBR
```

---

## 🔐 Passo 3: Gerar Delegação (UCAN/Proof)

A delegação é um token UCAN que dá permissão ao seu agente para fazer upload no espaço.

### 3.1 Gerar Delegação via CLI

```bash
# 1. Use o espaço desejado
storacha space use <SPACE_DID>

# 2. Gere a delegação para seu Agent DID
storacha delegation create <AGENT_DID> \
  --can space/blob/add \
  --can space/index/add \
  --can filecoin/offer \
  --can upload/add \
  --base64
```

**Onde:**

- `<AGENT_DID>` é o DID do seu agente (obtido no Passo 1)
- `--can space/blob/add` - permissão para adicionar blobs
- `--can space/index/add` - permissão para adicionar ao índice
- `--can filecoin/offer` - permissão para ofertas Filecoin
- `--can upload/add` - permissão para upload
- `--base64` - retorna o token em base64 (necessário para uso no código)

### 3.2 Salvar o UCAN Token

O comando acima retornará um token base64 muito longo. **Copie todo o token** e salve no arquivo `.env`:

```env
STORACHA_UCAN=<token_base64_completo>
```

**⚠️ IMPORTANTE:** O token pode ter quebras de linha. Remova todas as quebras de linha antes de salvar.

---

## 📝 Passo 4: Configurar Variáveis de Ambiente

Adicione as seguintes variáveis no arquivo `.env`:

```env
# ----------------------------------------------------------------------------
# STORACHA (Web3 Descentralizado - RECOMENDADO)
# ----------------------------------------------------------------------------

# DID do seu agente/identidade Storacha (obtido no Passo 1)
STORACHA_DID=did:key:z4MXj1wBzi9jUstyPWmomSd1pFwszvphKndMbzxrAdxYPNYpEhdHeDWvtULKgrWfbbSXFeQZbpnSPihq2NFL1GaqvFGRPYRRKzap12r57RdqvUEBdvbravLoKd5ZTsU6AwfoE6qfn8cGvCkxeZTwSAH5ob3frxH85px2TGYDJ9hPGFnkFo5Ysoc2gk9fvK9Q1Esod5Mv6CMDbnT3icR2jYZWsaBNzzfB5vhd4YQtkghxuzZABtyJYYz54FbjD6AXuogZksorduWuZT4f8wKoinsZ86UqsKPHxquSDSfLjGiVaT8BTGoRg7kri8fZGKA2tukYug4TiQVDprgGEbL6N85XHDJ2RQ6EVwscrhLG38aSzqms1Mjjv

# UCAN/Proof de delegação do espaço (gerado no Passo 3)
STORACHA_UCAN=<seu_token_ucan_base64_aqui>

# Espaço Storacha específico para usar (DID do espaço - obtido no Passo 2)
STORACHA_SPACE_DID=did:key:z6Mkjee3CCaP6q2vhRnE3wRBGNqMxEq645EvnYocsbbeZiBR

# Opcional: email para login (se necessário no futuro)
STORACHA_EMAIL=seu-email@exemplo.com
```

---

## 💻 Passo 5: Implementação no Código

### 5.1 Estrutura Básica

```javascript
import { create } from '@storacha/client';
import { filesFromPaths } from 'files-from-path';
import * as Proof from '@storacha/client/proof';
import dotenv from 'dotenv';

dotenv.config();

const STORACHA_DID = process.env.STORACHA_DID;
const STORACHA_SPACE_DID = process.env.STORACHA_SPACE_DID;
const STORACHA_UCAN = process.env.STORACHA_UCAN;

// Limpar e converter UCAN (se necessário)
let ucanToken = STORACHA_UCAN?.replace(/\s+/g, '').trim();
if (ucanToken) {
  // Converter base64url para base64 padrão (se necessário)
  ucanToken = ucanToken.replace(/-/g, '+').replace(/_/g, '/');
  // Adicionar padding se necessário
  while (ucanToken.length % 4 !== 0) {
    ucanToken += '=';
  }
}
```

### 5.2 Função de Upload

```javascript
async function uploadToStoracha(directoryPath) {
  try {
    // 1. Criar cliente Storacha
    const client = await create();
    
    // 2. Obter DID do agente (para logs/debug)
    const agentDID = client.agent?.did?.();
    console.log('Agent DID:', agentDID);
    
    // 3. Adicionar espaço usando proof/UCAN
    if (STORACHA_UCAN) {
      const proof = await Proof.parse(STORACHA_UCAN);
      const addedSpace = await client.addSpace(proof);
      await client.setCurrentSpace(addedSpace.did());
      console.log('Espaço adicionado:', addedSpace.did());
    } else if (STORACHA_SPACE_DID) {
      // Alternativa: usar espaço diretamente (requer que agente já tenha acesso)
      await client.setCurrentSpace(STORACHA_SPACE_DID);
      console.log('Espaço configurado:', STORACHA_SPACE_DID);
    }
    
    // 4. Preparar arquivos do diretório
    const files = await filesFromPaths([directoryPath]);
    console.log(`${files.length} arquivo(s) preparado(s)`);
    
    // 5. Fazer upload
    const cid = await client.uploadDirectory(files, { 
      space: client.currentSpace?.() 
    });
    
    console.log('✅ Upload concluído! CID:', cid);
    console.log('🌐 Gateway: https://storacha.link/ipfs/' + cid);
    
    return cid;
  } catch (error) {
    console.error('❌ Erro no upload:', error.message);
    throw error;
  }
}
```

### 5.3 Tratamento de Erros Comuns

```javascript
// Erro de permissão
if (error.message.includes('space/blob/add')) {
  console.error('💡 Erro de permissão!');
  console.error('   O espaço precisa de uma delegação (proof) válida.');
  console.error('   Gere uma nova delegação usando:');
  console.error('   storacha delegation create <AGENT_DID> \\');
  console.error('     --can space/blob/add \\');
  console.error('     --can space/index/add \\');
  console.error('     --can filecoin/offer \\');
  console.error('     --can upload/add \\');
  console.error('     --base64');
}
```

---

## 🔄 Passo 6: Publicação no IPNS (Opcional)

Para publicar o CID no IPNS (InterPlanetary Name System), você precisa:

### 6.1 Configurar IPNS no .env

```env
# Nome da key IPNS no Kubo
IPNS_KEY_NAME=meu-projeto-pwa

# ID público IPNS (gerado automaticamente ao criar a key)
IPNS_KEY_ID=k51qzi5uqu5dibn355zoh239agkln7mpvvu8iyk4jv2t1letihnm36s6ym4yts

# UCAN Token para publicação IPNS (pode ser o mesmo STORACHA_UCAN ou diferente)
UCAN_TOKEN=<seu_token_ucan>
```

### 6.2 Criar IPNS Key (se não existir)

```bash
# Criar uma nova key IPNS
ipfs key gen meu-projeto-pwa

# Listar keys existentes
ipfs key list

# Obter o ID da key
ipfs key list -l | grep meu-projeto-pwa
```

### 6.3 Publicar no IPNS

```bash
# Publicar CID no IPNS
ipfs name publish /ipfs/<CID> --key=<IPNS_KEY_NAME>

# Verificar publicação
ipfs name resolve /ipns/<IPNS_KEY_ID>
```

**⚠️ IMPORTANTE:** O IPFS local precisa ter o conteúdo (fazer pin) antes de publicar no IPNS:

```bash
# Fazer pin do CID (busca da rede se necessário)
ipfs pin add <CID>

# Depois publicar
ipfs name publish /ipfs/<CID> --key=<IPNS_KEY_NAME>
```

---

## 📦 Passo 7: Script de Deploy Completo

Exemplo de script que faz build, upload e publicação:

```javascript
#!/usr/bin/env node
import { execSync } from 'child_process';
import { filesFromPaths } from 'files-from-path';
import { create } from '@storacha/client';
import * as Proof from '@storacha/client/proof';
import dotenv from 'dotenv';

dotenv.config();

const DIST_DIR = './dist';
const STORACHA_DID = process.env.STORACHA_DID;
const STORACHA_SPACE_DID = process.env.STORACHA_SPACE_DID;
const STORACHA_UCAN = process.env.STORACHA_UCAN;

async function build() {
  console.log('🔨 Fazendo build...');
  execSync('npm run build', { stdio: 'inherit' });
  console.log('✅ Build concluído\n');
}

async function uploadToStoracha() {
  console.log('🌐 Fazendo upload via Storacha...\n');
  
  const client = await create();
  
  // Adicionar espaço usando proof
  if (STORACHA_UCAN) {
    const proof = await Proof.parse(STORACHA_UCAN);
    const space = await client.addSpace(proof);
    await client.setCurrentSpace(space.did());
    console.log('✅ Espaço configurado:', space.did());
  }
  
  // Preparar e fazer upload
  const files = await filesFromPaths([DIST_DIR]);
  const cid = await client.uploadDirectory(files);
  
  console.log('✅ Upload concluído! CID:', cid);
  return cid;
}

async function publishToIPNS(cid) {
  console.log('🌐 Publicando no IPNS...');
  
  // Fazer pin primeiro (busca da rede se necessário)
  try {
    execSync(`ipfs pin add ${cid}`, { stdio: 'inherit' });
  } catch (error) {
    console.log('⚠️  Pin falhou, tentando publicar mesmo assim...');
  }
  
  // Publicar
  const IPNS_KEY_NAME = process.env.IPNS_KEY_NAME || 'meu-projeto-pwa';
  execSync(`ipfs name publish /ipfs/${cid} --key=${IPNS_KEY_NAME}`, {
    stdio: 'inherit'
  });
  
  console.log('✅ Publicação no IPNS concluída!');
}

async function main() {
  try {
    await build();
    const cid = await uploadToStoracha();
    await publishToIPNS(cid);
    console.log('\n✅ Deploy completo!');
  } catch (error) {
    console.error('❌ Erro:', error);
    process.exit(1);
  }
}

main();
```

---

## ✅ Checklist de Configuração

- [ ] Storacha CLI instalado
- [ ] Agent DID obtido e salvo no `.env`
- [ ] Espaço Storacha criado ou identificado
- [ ] Space DID salvo no `.env`
- [ ] Delegação (UCAN) gerada e salva no `.env`
- [ ] IPFS Kubo instalado e rodando localmente
- [ ] IPNS key criada (se usar IPNS)
- [ ] Script de deploy testado localmente

---

## 🐛 Troubleshooting

### Erro: "space/blob/add permission denied"
**Solução:** A delegação não tem as permissões corretas. Gere uma nova delegação com todas as permissões necessárias.

### Erro: "block was not found locally"
**Solução:** O IPFS local não tem o conteúdo. Faça `ipfs pin add <CID>` primeiro, ou use `--allow-offline` (mas pode falhar).

### Erro: "UCAN inválido"
**Solução:** Verifique se o token UCAN está completo, sem quebras de linha, e em formato base64 válido.

### Erro: "Agent DID não encontrado"
**Solução:** Certifique-se de que o `STORACHA_DID` no `.env` corresponde ao DID do agente que gerou a delegação.

---

## 📚 Recursos Adicionais

- **Storacha Docs:** https://docs.storacha.network
- **Storacha Console:** https://console.storacha.network
- **IPFS Docs:** https://docs.ipfs.tech
- **UCAN Spec:** https://github.com/ucan-wg/spec

---

## 🎓 Conceitos Importantes

### DID (Decentralized Identifier)
Identificador descentralizado usado para identificar agentes e espaços no Storacha. Formato: `did:key:z...`

### UCAN (User-Controlled Authorization Network)
Token de autorização que delega permissões de um espaço para um agente. Formato: base64 (muito longo).

### Espaço (Space)
Container no Storacha onde você faz upload de conteúdo. Cada espaço tem um DID único.

### Agente (Agent)
Identidade no Storacha que pode fazer upload em espaços (se tiver delegação válida).

### CID (Content Identifier)
Hash do conteúdo no IPFS. Formato: `bafy...` (v1) ou `Qm...` (v0).

### IPNS (InterPlanetary Name System)
Sistema de nomes do IPFS que permite apontar um nome fixo para um CID que pode mudar.

---

## 💡 Dicas Finais

1. **Sempre teste localmente** antes de fazer deploy em produção
2. **Mantenha backups** do UCAN token (é difícil regenerar)
3. **Use IPNS** para ter uma URL fixa que aponta para o conteúdo mais recente
4. **Monitore o console Storacha** para ver uploads e espaços
5. **O conteúdo no Storacha é permanente** - não pode ser deletado facilmente

---

**Última atualização:** 2025-12-15
