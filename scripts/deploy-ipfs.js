#!/usr/bin/env node
/**
 * 🚀 Script de Deploy Completo para IPFS/IPNS
 * 
 * Executa:
 * 1. Build da PWA
 * 2. Upload para IPFS
 * 3. Publicação no IPNS
 * 4. Commit e Push para Git
 * 
 * Uso:
 *   node scripts/deploy-ipfs.js
 *   UCAN_TOKEN=<token> node scripts/deploy-ipfs.js
 */

import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';
import fs from 'fs';
import { filesFromPaths } from 'files-from-path';
import * as Proof from '@storacha/client/proof';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = join(__dirname, '..');

// Carrega .env
dotenv.config({ path: join(PROJECT_ROOT, '.env') });

const DIST_DIR = join(PROJECT_ROOT, 'dist');
const IPNS_KEY_NAME = process.env.IPNS_KEY_NAME || 'neo-flowoff-pwa';

// Configuração Storacha (Web3 descentralizado)
const STORACHA_DID = process.env.STORACHA_DID || 'did:key:z4MXj1wBzi9jUstyPWmomSd1pFwszvphKndMbzxrAdxYPNYpEhdHeDWvtULKgrWfbbSXFeQZbpnSPihq2NFL1GaqvFGRPYRRKzap12r57RdqvUEBdvbravLoKd5ZTsU6AwfoE6qfn8cGvCkxeZTwSAH5ob3frxH85px2TGYDJ9hPGFnkFo5Ysoc2gk9fvK9Q1Esod5Mv6CMDbnT3icR2jYZWsaBNzzfB5vhd4YQtkghxuzZABtyJYYz54FbjD6AXuogZksorduWuZT4f8wKoinsZ86UqsKPHxquSDSfLjGiVaT8BTGoRg7kri8fZGKA2tukYug4TiQVDprgGEbL6N85XHDJ2RQ6EVwscrhLG38aSzqms1Mjjv';
const STORACHA_SPACE_DID = process.env.STORACHA_SPACE_DID || 'did:key:z6Mkjee3CCaP6q2vhRnE3wRBGNqMxEq645EvnYocsbbeZiBR';

// Função para ler UCAN multi-linha do .env manualmente
// @param {string} envPath - Caminho do arquivo .env
// @param {string} keyName - Nome da variável a ler ('STORACHA_UCAN' ou 'UCAN_TOKEN')
function readMultiLineUCAN(envPath, keyName = null) {
  try {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    const lines = envContent.split('\n');
    let ucanValue = '';
    let inUCAN = false;
    let targetKey = keyName || 'STORACHA_UCAN';
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmedLine = line.trim();
      
      // Detecta início da variável específica
      if (trimmedLine.startsWith(`${targetKey}=`)) {
        inUCAN = true;
        const valuePart = trimmedLine.substring(trimmedLine.indexOf('=') + 1);
        if (valuePart) {
          ucanValue = valuePart;
        }
        continue;
      }
      
      // Se estamos dentro de um UCAN
      if (inUCAN) {
        // Para se encontrar um comentário no início da linha
        if (trimmedLine.startsWith('#')) {
          inUCAN = false;
          break;
        }
        
        // Para se encontrar uma nova variável (começa com letra maiúscula seguida de =)
        // Mas só para se não parecer ser continuação de base64
        const looksLikeNewVar = trimmedLine.match(/^[A-Z_][A-Z0-9_]*=/);
        const looksLikeBase64 = trimmedLine.match(/^[A-Za-z0-9+/=_-]+$/); // Linha inteira parece base64
        
        if (looksLikeNewVar && !looksLikeBase64) {
          // É uma nova variável e não parece base64
          inUCAN = false;
          break;
        }
        
        // Se parece base64 válido OU não parece ser uma nova variável, adiciona como continuação
        if (trimmedLine && !trimmedLine.startsWith('#')) {
          // Se a linha parece ser base64 válido ou não é uma variável, adiciona
          if (looksLikeBase64 || !looksLikeNewVar) {
            ucanValue += trimmedLine;
          } else {
            // Linha vazia ou não parece continuação, para
            inUCAN = false;
            break;
          }
        }
      }
    }
    
    return ucanValue || null;
  } catch (error) {
    console.debug('Erro ao ler UCAN multi-linha:', error.message);
    return null;
  }
}

// Limpa o UCAN removendo espaços, quebras de linha e outros caracteres inválidos
// Converte de base64url para base64 padrão (Storacha espera base64 padrão)
// Prioriza STORACHA_UCAN sobre UCAN_TOKEN
let rawUCAN = process.env.STORACHA_UCAN || process.env.UCAN_TOKEN;

// Se não encontrou no env padrão ou está muito curto, tenta ler multi-linha manualmente
if (!rawUCAN || rawUCAN.length < 500) {
  const envPath = join(PROJECT_ROOT, '.env');
  // Tenta ler STORACHA_UCAN primeiro, depois UCAN_TOKEN
  const storachaUCAN = readMultiLineUCAN(envPath, 'STORACHA_UCAN');
  const ucanToken = readMultiLineUCAN(envPath, 'UCAN_TOKEN');
  
  // Prioriza STORACHA_UCAN se existir e for maior
  const multiLineUCAN = (storachaUCAN && storachaUCAN.length > 500) 
    ? storachaUCAN 
    : (ucanToken && ucanToken.length > 500) ? ucanToken : null;
  
  if (multiLineUCAN && multiLineUCAN.length > (rawUCAN?.length || 0)) {
    rawUCAN = multiLineUCAN;
    console.log(`📝 UCAN lido de formato multi-linha do .env (${multiLineUCAN.length} chars)`);
  } else if (rawUCAN && rawUCAN.length < 500) {
    console.warn(`⚠️  UCAN muito curto (${rawUCAN.length} chars). Tentando ler multi-linha...`);
  }
}

// Mantém formato original e versão limpa para tentativas
let STORACHA_UCAN_ORIGINAL = rawUCAN ? rawUCAN.replace(/\s+/g, '').trim() : null;
let STORACHA_UCAN = null;
let STORACHA_UCAN_BASE64 = null;

if (STORACHA_UCAN_ORIGINAL) {
  // Remove prefixos comuns que não são parte do base64:
  // - "did:key:..." seguido de espaço ou fim
  // - "--can ..." (comandos)
  // - Qualquer texto antes do primeiro caractere base64 válido
  let cleanedUCAN = STORACHA_UCAN_ORIGINAL.replace(/^did:key:[A-Za-z0-9]+[\s-]*/, ''); // Remove did:key:...
  cleanedUCAN = cleanedUCAN.replace(/--can\s+[^\s]+\s*/g, ''); // Remove --can commands
  cleanedUCAN = cleanedUCAN.replace(/^[^A-Za-z0-9+/=_-]+/, ''); // Remove outros prefixos não-base64
  cleanedUCAN = cleanedUCAN.replace(/[^A-Za-z0-9+/=_-]+$/, ''); // Remove sufixos não-base64
  
  // Detecta formato: base64url tem - e _, base64 padrão tem + e /
  const isBase64Url = cleanedUCAN.includes('-') || cleanedUCAN.includes('_');
  
  if (isBase64Url) {
    // Mantém base64url original para tentativas
    STORACHA_UCAN = cleanedUCAN;
    // Também cria versão base64 padrão para tentativas alternativas
    STORACHA_UCAN_BASE64 = cleanedUCAN.replace(/-/g, '+').replace(/_/g, '/');
    // Adiciona padding se necessário
    while (STORACHA_UCAN_BASE64.length % 4 !== 0) {
      STORACHA_UCAN_BASE64 += '=';
    }
  } else {
    // Já é base64 padrão
    STORACHA_UCAN = cleanedUCAN;
    // Adiciona padding se necessário
    while (STORACHA_UCAN.length % 4 !== 0) {
      STORACHA_UCAN += '=';
    }
    STORACHA_UCAN_BASE64 = STORACHA_UCAN;
  }
  
  // Validação básica: deve ter pelo menos 100 caracteres para ser um UCAN válido
  if (STORACHA_UCAN.length < 100) {
    console.warn(`⚠️  UCAN parece muito curto (${STORACHA_UCAN.length} chars). Pode estar incompleto.`);
  }
}

const USE_STORACHA = STORACHA_UCAN && STORACHA_DID;

// Função para mascarar valores sensíveis nos logs
function maskSensitive(value, showStart = 10, showEnd = 4) {
  if (!value || typeof value !== 'string') return '***';
  if (value.length <= showStart + showEnd) return '***';
  return `${value.substring(0, showStart)}...${value.substring(value.length - showEnd)}`;
}

async function runCommand(command, options = {}) {
  try {
    const output = execSync(command, {
      encoding: 'utf-8',
      cwd: PROJECT_ROOT,
      stdio: 'inherit',
      ...options
    });
    return { success: true, output };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function build() {
  console.log('\n🔨 Passo 1: Build da PWA...\n');
  // Atualiza versão automaticamente antes do build (patch)
  // Nota: Se BUILD_BUMP_VERSION estiver definido, build.js também atualizará
  // Mas fazemos aqui para garantir que sempre aconteça antes do build
  console.log('🔄 Atualizando versão (patch) antes do build...\n');
  const bumpResult = await runCommand('npm run version:bump -- patch', {
    stdio: 'pipe'
  });
  if (bumpResult.success) {
    console.log('✅ Versão atualizada!\n');
  } else {
    console.warn('⚠️  Falha ao atualizar versão. Continuando build...\n');
  }
  
  // Desabilita atualização duplicada no build.js
  const result = await runCommand('npm run build', {
    env: { ...process.env, BUILD_BUMP_VERSION: '' }
  });
  if (!result.success) {
    console.error('❌ Erro no build');
    process.exit(1);
  }
  console.log('✅ Build concluído\n');
}

async function uploadToStoracha() {
  console.log('🌐 Fazendo upload via Storacha (Web3 descentralizado)...\n');
  
  try {
    // Importa Storacha client
    const { create } = await import('@storacha/client');
    
    // Cria cliente Storacha
    console.log('🔧 Criando cliente Storacha...');
    const client = await create();
    
    // Mostra o DID do agente (útil para gerar delegações)
    try {
      const agentDID = client.agent?.did?.() || 'N/A';
      console.log(`   Agent DID: ${agentDID}\n`);
      console.log('💡 Use este DID para gerar delegações do espaço para este agente\n');
    } catch (e) {
      // Ignora se não conseguir obter o DID
    }
    
    // Configura o espaço - prioriza usar o espaço existente configurado
    let space;
    console.log(`📦 Configurando espaço Storacha...\n`);
    console.log(`   Espaço desejado: ${STORACHA_SPACE_DID}\n`);
    
    // PRIMEIRO: Tenta usar o proof/UCAN para adicionar o espaço
    if (STORACHA_UCAN) {
      try {
        console.log('🔐 Adicionando espaço usando proof/UCAN...');
        
        // Valida se o UCAN parece ser base64 válido (já foi convertido e limpo acima)
        const base64Regex = /^[A-Za-z0-9+/=]+$/;
        if (!base64Regex.test(STORACHA_UCAN)) {
          throw new Error(`UCAN contém caracteres inválidos após conversão. Tamanho: ${STORACHA_UCAN.length} chars. Primeiros 50: ${STORACHA_UCAN.substring(0, 50)}...`);
        }
        
        // Valida tamanho mínimo (UCAN válido deve ter pelo menos alguns KB)
        if (STORACHA_UCAN.length < 500) {
          throw new Error(`UCAN parece muito curto (${STORACHA_UCAN.length} chars). Pode estar incompleto ou truncado. Verifique o .env.`);
        }
        
        console.log(`   UCAN tamanho: ${STORACHA_UCAN.length} caracteres`);
        console.log(`   UCAN preview: ${STORACHA_UCAN.substring(0, 50)}...${STORACHA_UCAN.substring(STORACHA_UCAN.length - 20)}\n`);
        
        // Segundo o guia Storacha (linha 182), Proof.parse() aceita string diretamente:
        // const proof = await Proof.parse(STORACHA_UCAN);
        // Mas o UCAN precisa estar limpo (sem quebras de linha) e em formato base64 válido
        // O guia também menciona converter base64url para base64 padrão se necessário
        
        // Prepara UCAN conforme guia: limpo, convertido para base64 padrão, com padding
        const ucanForParse = STORACHA_UCAN_BASE64 || STORACHA_UCAN;
        
        // Tenta múltiplos formatos conforme documentação e prática comum
        let proof;
        const attempts = [];
        
        // Tentativa 1: String base64 padrão (conforme guia linha 182)
        // O guia mostra: const proof = await Proof.parse(STORACHA_UCAN);
        attempts.push({ name: 'base64 string (conforme guia)', value: ucanForParse });
        
        // Tentativa 2: Bytes decodificados de base64 (CAR files geralmente são bytes)
        // O proof é um CAR file, que pode precisar ser decodificado
        try {
          const decodedBase64 = Buffer.from(ucanForParse, 'base64');
          attempts.push({ name: 'base64 bytes (CAR file)', value: decodedBase64 });
        } catch (e) {
          console.log(`   ⚠️  Não foi possível decodificar base64: ${e.message.substring(0, 50)}`);
        }
        
        // Tentativa 3: Bytes decodificados de base64url (se formato original era base64url)
        if (STORACHA_UCAN !== ucanForParse) {
          try {
            let base64urlPadded = STORACHA_UCAN;
            while (base64urlPadded.length % 4 !== 0) {
              base64urlPadded += '=';
            }
            const decodedBase64Url = Buffer.from(base64urlPadded, 'base64url');
            attempts.push({ name: 'base64url bytes', value: decodedBase64Url });
          } catch (e) {
            // Ignora erro
          }
        }
        
        // Tenta cada formato até um funcionar
        let lastError = null;
        for (const attempt of attempts) {
          try {
            console.log(`   Tentando formato: ${attempt.name}...`);
            proof = await Proof.parse(attempt.value);
            console.log(`   ✅ Sucesso com formato: ${attempt.name}\n`);
            break;
          } catch (error) {
            lastError = error;
            const errorMsg = error.message || String(error);
            console.log(`   ❌ Falhou: ${errorMsg.substring(0, 80)}...`);
            continue;
          }
        }
        
        if (!proof) {
          const errorDetails = lastError ? `\n   Último erro: ${lastError.message}` : '';
          throw new Error(`Todas as tentativas de parse falharam.${errorDetails}\n   Verifique se o UCAN está completo e foi gerado com --base64 para o Agent DID correto.\n   Agent DID atual: ${client.agent?.did?.() || 'N/A'}`);
        }
        
        // Adiciona o espaço usando o proof parseado
        const addedSpace = await client.addSpace(proof);
        await client.setCurrentSpace(addedSpace.did());
        space = addedSpace;
        
        const spaceDID = space.did();
        console.log(`✅ Espaço adicionado via proof: ${spaceDID}\n`);
        
        // Verifica se é o espaço desejado
        if (STORACHA_SPACE_DID && spaceDID === STORACHA_SPACE_DID) {
          console.log(`✅ Espaço correto configurado: ${spaceDID}\n`);
        } else if (STORACHA_SPACE_DID) {
          console.log(`⚠️  Espaço adicionado (${spaceDID}) difere do desejado (${STORACHA_SPACE_DID})`);
          console.log(`   Usando o espaço do proof: ${spaceDID}\n`);
        }
      } catch (proofError) {
        const errorMsg = proofError.message || String(proofError);
        console.error(`❌ Erro ao usar proof: ${errorMsg.substring(0, 150)}`);
        throw new Error(`Não foi possível adicionar espaço usando proof. Verifique se o STORACHA_UCAN está correto e foi gerado para o Agent DID correto. Erro: ${errorMsg}`);
      }
    } else {
      // SEM PROOF: Tenta usar o espaço diretamente (requer que o agente já tenha acesso)
      if (STORACHA_SPACE_DID) {
        try {
          console.log(`🔗 Tentando usar espaço diretamente: ${STORACHA_SPACE_DID}...`);
          await client.setCurrentSpace(STORACHA_SPACE_DID);
          const currentSpace = client.currentSpace?.();
          const spaceDID = typeof currentSpace === 'string' 
            ? currentSpace 
            : (currentSpace?.did?.() || STORACHA_SPACE_DID);
          
          console.log(`✅ Espaço configurado diretamente: ${spaceDID}\n`);
          space = { did: () => spaceDID };
        } catch (setError) {
          const errorMsg = setError.message || String(setError);
          console.error(`❌ Não foi possível usar espaço existente: ${errorMsg.substring(0, 150)}`);
          throw new Error(`Não foi possível usar o espaço ${STORACHA_SPACE_DID}. Você precisa gerar um proof/UCAN usando 'storacha delegation create'. Erro: ${errorMsg}`);
        }
      } else {
        throw new Error('STORACHA_UCAN ou STORACHA_SPACE_DID deve ser configurado no .env');
      }
    }
    
    // Verifica se temos um espaço válido
    if (!space) {
      throw new Error('Espaço não foi configurado');
    }
    
    const spaceDID = space.did();
    console.log(`🔍 Espaço final configurado: ${spaceDID}\n`);
    
    // Verifica espaço atual do cliente
    const currentSpaceCheck = client.currentSpace?.();
    if (currentSpaceCheck) {
      const currentDID = typeof currentSpaceCheck === 'string' 
        ? currentSpaceCheck 
        : (currentSpaceCheck.did?.() || String(currentSpaceCheck));
      console.log(`🔍 Espaço atual do cliente: ${currentDID}\n`);
      
      if (currentDID !== spaceDID) {
        console.log('⚠️  Aviso: Espaço configurado difere do espaço atual do cliente\n');
      }
    }

    // Prepara arquivos do diretório dist
    console.log('📦 Preparando arquivos do diretório...');
    const files = await filesFromPaths([DIST_DIR]);
    console.log(`   ${files.length} arquivo(s) preparado(s)\n`);

    // Verifica se o espaço tem permissões antes de fazer upload
    const finalSpaceDID = space.did();
    console.log(`🔐 Verificando permissões do espaço: ${finalSpaceDID}\n`);
    
    // Faz upload do diretório passando o espaço
    console.log('📤 Enviando para Storacha/IPFS...');
    console.log('   (Isso pode falhar se o espaço não tiver permissões de escrita)\n');
    
    const cid = await client.uploadDirectory(files, { space });

    console.log(`✅ Upload via Storacha concluído! CID: ${cid}\n`);
    console.log(`🌐 Gateway: https://storacha.link/ipfs/${cid}\n`);
    return cid;
  } catch (error) {
    // Mascara mensagens de erro que podem conter informações sensíveis
    const safeErrorMessage = error.message ? error.message.substring(0, 200) : 'Erro desconhecido';
    console.error('❌ Erro no upload via Storacha:', safeErrorMessage);
    
    // Mensagens de ajuda específicas
    if (error.message && error.message.includes('space/blob/add')) {
      console.error('\n💡 Erro de permissão detectado!');
      console.error('   O espaço precisa de uma delegação (proof) válida.\n');
      console.error('💡 Como resolver:');
      console.error('   1. Gere uma delegação do espaço para seu agente usando Storacha CLI:');
      console.error('      storacha space use <SPACE_DID>');
      console.error('      storacha delegation create <AGENT_DID> \\');
      console.error('        --can space/blob/add \\');
      console.error('        --can space/index/add \\');
      console.error('        --can filecoin/offer \\');
      console.error('        --can upload/add \\');
      console.error('        --base64');
      console.error('');
      console.error('   2. Use o output base64 como STORACHA_UCAN no .env');
      console.error('   3. Verifique no console: https://console.storacha.network\n');
    }
    
    // Não expõe stack trace completo (pode conter informações sensíveis)
    if (error.stack && process.env.NODE_ENV === 'development') {
      console.error('\nStack (dev only):', error.stack.substring(0, 500));
    }
    throw error;
  }
}

// Função removida - usando files-from-path agora

async function uploadToIPFSLocal() {
  console.log('📦 Fazendo upload via IPFS local...\n');
  
  // Verifica se IPFS está instalado
  try {
    execSync('which ipfs', { stdio: 'ignore' });
  } catch {
    console.error('❌ IPFS CLI não encontrado. Instale o IPFS: https://docs.ipfs.tech/install/');
    process.exit(1);
  }

  // Faz upload para IPFS
  const command = `ipfs add -r --pin --quiet ${DIST_DIR}`;
  const output = execSync(command, {
    encoding: 'utf-8',
    cwd: PROJECT_ROOT
  });

  // Extrai o CID do diretório (última linha é o diretório raiz)
  const lines = output.trim().split('\n').filter(line => line.trim());
  const lastLine = lines[lines.length - 1];
  
  // Com --quiet, o formato é apenas o CID
  const cid = lastLine.trim();
  
  if (!cid || !cid.startsWith('Qm')) {
    console.error('❌ Não foi possível extrair o CID do upload');
    console.error('Output:', output);
    process.exit(1);
  }
  
  // Esta função não deve ser mais usada - Storacha é obrigatório
  throw new Error('Upload local não é mais suportado. Use Storacha para upload permanente.');
}

// Função removida - Storacha faz pinning automático no upload

async function uploadToIPFS() {
  console.log('📦 Passo 2: Upload para IPFS...\n');
  
  // Verifica se dist existe
  if (!fs.existsSync(DIST_DIR)) {
    console.error('❌ Diretório dist/ não encontrado. Execute o build primeiro.');
    process.exit(1);
  }

  let cid;

  // Storacha é obrigatório - não faz fallback para local
  if (!USE_STORACHA) {
    console.error('❌ Storacha não configurado!');
    console.error('   Configure STORACHA_UCAN e STORACHA_DID no .env');
    console.error('   Use: node scripts/get-agent-did.js para obter seu Agent DID');
    console.error('   Depois gere o proof com: storacha delegation create <AGENT_DID> ...\n');
    throw new Error('STORACHA_UCAN e STORACHA_DID devem ser configurados no .env');
  }

  // Faz upload via Storacha (obrigatório)
  cid = await uploadToStoracha();
  console.log('✅ Upload via Storacha concluído! O conteúdo está permanentemente disponível na rede IPFS (Web3).\n');
  
  return cid;
}

async function publishToIPNS(cid) {
  console.log('🌐 Passo 3: Publicação no IPNS...\n');
  
  // Usa UCAN_TOKEN ou STORACHA_UCAN como fallback
  const ucanToken = process.env.UCAN_TOKEN || process.env.STORACHA_UCAN;
  if (!ucanToken) {
    console.error('❌ UCAN_TOKEN ou STORACHA_UCAN não encontrado no .env');
    process.exit(1);
  }

  // Executa o script de publicação IPNS
  const command = `node scripts/ipns-publisher.js ${cid}`;
  const result = await runCommand(command, {
    env: { ...process.env, UCAN_TOKEN: ucanToken }
  });

  if (!result.success) {
    console.error('❌ Erro ao publicar no IPNS');
    process.exit(1);
  }

  console.log('✅ Publicação no IPNS concluída!\n');
}

async function commitAndPush() {
  console.log('📝 Passo 4: Commit e Push...\n');

  // Verifica status do git
  const status = execSync('git status --porcelain', {
    encoding: 'utf-8',
    cwd: PROJECT_ROOT
  }).trim();

  if (!status) {
    console.log('ℹ️  Nenhuma mudança para commitar');
    return;
  }

  // Adiciona todos os arquivos
  console.log('📦 Adicionando arquivos ao git...');
  await runCommand('git add -A');

  // Commit
  const commitMessage = `Deploy IPFS/IPNS - ${new Date().toISOString()}`;
  console.log(`💾 Commit: ${commitMessage}`);
  const commitResult = await runCommand(`git commit -m "${commitMessage}"`);
  
  if (!commitResult.success) {
    console.error('❌ Erro no commit');
    process.exit(1);
  }

  // Push
  console.log('🚀 Push para origin...');
  const pushResult = await runCommand('git push origin main');
  
  if (!pushResult.success) {
    console.error('❌ Erro no push');
    process.exit(1);
  }

  console.log('✅ Commit e push concluídos!\n');
}

// Main
async function main() {
  console.log('🚀 Deploy Completo para IPFS/IPNS\n');
  console.log('═══════════════════════════════════════\n');

  try {
    await build();
    const cid = await uploadToIPFS();
    await publishToIPNS(cid);
    await commitAndPush();

    console.log('═══════════════════════════════════════');
    console.log('✅ Deploy completo concluído com sucesso!');
    console.log('═══════════════════════════════════════\n');
  } catch (error) {
    console.error('❌ Erro fatal:', error);
    process.exit(1);
  }
}

main();
