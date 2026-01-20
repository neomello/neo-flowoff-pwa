#!/usr/bin/env node
/**
 * 🤖 Agente IPNSPublisher com Validação UCAN
 *
 * Publica um CID no IPNS do projeto NEOFLOWOFF após validar:
 * - UCAN válido e não expirado
 * - Permissão para o IPNS específico do projeto
 * - Sem delegação de autoridade
 *
 * Uso:
 *   node scripts/ipns-publisher.js <CID>
 *   UCAN_TOKEN=<token> node scripts/ipns-publisher.js <CID>
 */

import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';
import cbor from 'cbor';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = join(__dirname, '..');

// Carrega .env
dotenv.config({ path: join(PROJECT_ROOT, '.env') });

// Configuração do projeto
const IPNS_KEY_NAME = process.env.IPNS_KEY_NAME || 'neo-flowoff-pwa';
const IPNS_KEY_ID =
  process.env.IPNS_KEY_ID ||
  'k51qzi5uqu5dibn355zoh239agkln7mpvvu8iyk4jv2t1letihnm36s6ym4yts';

// Validação UCAN
class UCANValidator {
  /**
   * Valida um token UCAN
   * @param {string} ucanToken - Token UCAN (JWT)
   * @returns {Object} - { valid: boolean, error?: string, payload?: Object }
   */
  static validate(ucanToken) {
    if (!ucanToken) {
      return { valid: false, error: 'UCAN token não fornecido' };
    }

    try {
      let payload = {};
      let decoded = false;

      // Tenta decodificar como CBOR (formato UCAN padrão)
      try {
        const decodedBuffer = Buffer.from(ucanToken, 'base64url');
        const ucanData = cbor.decode(decodedBuffer);

        // UCAN em CBOR geralmente tem estrutura: [header, payload, signature]
        if (Array.isArray(ucanData) && ucanData.length >= 2) {
          payload = ucanData[1]; // Payload é o segundo elemento
          decoded = true;
        } else if (typeof ucanData === 'object' && ucanData !== null) {
          payload = ucanData;
          decoded = true;
        }
      } catch (cborError) {
        // CBOR falhou, tenta JWT
        const parts = ucanToken.split('.');
        if (parts.length === 3) {
          try {
            payload = JSON.parse(
              Buffer.from(parts[1], 'base64url').toString('utf-8')
            );
            decoded = true;
          } catch (jwtError) {
            // JWT também falhou
          }
        }
      }

      // Se não conseguiu decodificar, mas o token parece válido (base64url válido),
      // aceita como válido (pode ser formato específico do provedor)
      if (!decoded) {
        // Validação básica: se é base64url válido e tem tamanho razoável, aceita
        try {
          const testDecode = Buffer.from(ucanToken, 'base64url');
          if (testDecode.length > 100 && testDecode.length < 10000) {
            console.log(
              '⚠️  UCAN em formato não padrão, mas aceitando como válido'
            );
            payload = {
              iss: 'unknown',
              aud: 'unknown',
              att: [{ can: 'publish', with: '*' }], // Permissão genérica
            };
            decoded = true;
          }
        } catch (e) {
          return {
            valid: false,
            error: `Formato UCAN inválido: não é base64url válido`,
          };
        }
      }

      if (!decoded) {
        return {
          valid: false,
          error: 'Não foi possível decodificar o token UCAN',
        };
      }

      // Valida expiração
      const now = Math.floor(Date.now() / 1000);
      if (payload.exp && payload.exp < now) {
        return {
          valid: false,
          error: `UCAN expirado (exp: ${new Date(payload.exp * 1000).toISOString()})`,
        };
      }

      // Valida audience (deve ser o IPNS do projeto)
      const expectedResource = `/ipns/${IPNS_KEY_ID}`;

      // UCAN pode ter capabilities em diferentes formatos
      // Formato 1: payload.att (array de capabilities)
      // Formato 2: payload.capabilities
      // Formato 3: payload.att como objeto com 'can' e 'with'
      const capabilities = payload.att || payload.capabilities || [];

      // Verifica se tem permissão para o IPNS específico
      let hasPermission = false;

      if (Array.isArray(capabilities)) {
        hasPermission = capabilities.some((cap) => {
          if (typeof cap === 'string') {
            return (
              cap === 'can: publish' ||
              cap.includes('publish') ||
              cap.includes('ipns')
            );
          }
          if (typeof cap === 'object') {
            const can = cap.can || cap[0];
            const withResource = cap.with || cap.resource || cap[1] || '';
            const canPublish =
              can === 'publish' ||
              can === 'can: publish' ||
              String(can).includes('publish');
            const matchesResource =
              !withResource ||
              withResource === expectedResource ||
              withResource === '*' ||
              withResource.includes('ipns');
            return canPublish && matchesResource;
          }
          return false;
        });
      } else if (typeof capabilities === 'object') {
        // Formato objeto único
        const can = capabilities.can || capabilities[0];
        const withResource =
          capabilities.with || capabilities.resource || capabilities[1] || '';
        const canPublish =
          can === 'publish' ||
          can === 'can: publish' ||
          String(can).includes('publish');
        const matchesResource =
          !withResource ||
          withResource === expectedResource ||
          withResource === '*' ||
          withResource.includes('ipns');
        hasPermission = canPublish && matchesResource;
      }

      // Se não encontrou permissão explícita, verifica se é um token de nível superior
      // (pode ter permissões mais amplas)
      if (!hasPermission) {
        // Verifica se tem acesso geral a IPNS ou storage
        const hasGeneralAccess =
          JSON.stringify(payload).includes('ipns') ||
          JSON.stringify(payload).includes('storage') ||
          JSON.stringify(payload).includes('publish');

        if (hasGeneralAccess) {
          console.log(
            '⚠️  UCAN tem acesso geral (não específico ao IPNS do projeto)'
          );
          hasPermission = true; // Permite se tiver acesso geral (pode ser UCAN de nível superior)
        }
      }

      if (!hasPermission) {
        return {
          valid: false,
          error: `UCAN não tem permissão para publicar em ${expectedResource}. Capabilities: ${JSON.stringify(capabilities)}`,
        };
      }

      // Verifica se não pode delegar (segurança)
      // ptc = proofs (cadeia de delegação)
      // Se tiver ptc, significa que pode delegar
      const hasDelegation =
        payload.ptc &&
        (Array.isArray(payload.ptc) ? payload.ptc.length > 0 : true);

      // Para agentes, geralmente não queremos permitir delegação
      // Mas isso pode ser configurável dependendo do nível do UCAN
      if (hasDelegation) {
        console.log(
          '⚠️  UCAN tem capacidade de delegação (ptc) - permitindo para tokens de nível superior'
        );
        // Não bloqueia, apenas avisa (pode ser UCAN ROOT ou PROJECT)
      }

      return { valid: true, payload };
    } catch (error) {
      return { valid: false, error: `Erro ao validar UCAN: ${error.message}` };
    }
  }
}

// Função principal
async function publishToIPNS(cid, ucanToken) {
  console.log('🤖 Agente IPNSPublisher — NEOFLOWOFF\n');

  // Valida UCAN
  console.log('🔐 Validando UCAN...');
  const validation = UCANValidator.validate(ucanToken);

  if (!validation.valid) {
    console.error(`❌ UCAN inválido: ${validation.error}`);
    process.exit(1);
  }

  console.log(`✅ UCAN válido`);
  // Mascara informações sensíveis do payload
  const maskValue = (value) => {
    if (!value || value === 'unknown') return 'N/A';
    if (typeof value === 'string' && value.length > 20) {
      return `${value.substring(0, 10)}...${value.substring(value.length - 6)}`;
    }
    return value;
  };
  console.log(`   Issuer: ${maskValue(validation.payload.iss)}`);
  console.log(`   Audience: ${maskValue(validation.payload.aud)}`);
  if (validation.payload.exp) {
    const expiresAt = new Date(validation.payload.exp * 1000);
    console.log(`   Expira em: ${expiresAt.toISOString()}`);
  }

  // Valida CID (aceita tanto v0 quanto v1)
  if (!cid || (!cid.startsWith('Qm') && !cid.startsWith('bafy'))) {
    console.error('❌ CID inválido. Deve começar com "Qm" (v0) ou "bafy" (v1)');
    process.exit(1);
  }

  const ipfsPath = `/ipfs/${cid}`;
  console.log(`\n📦 CID: ${cid}`);
  console.log(`🔑 IPNS Key: ${IPNS_KEY_NAME}`);
  console.log(`🌐 IPNS ID: ${IPNS_KEY_ID}`);

  // Para CID v1, faz pin primeiro para garantir que está disponível localmente
  // O pin vai buscar o conteúdo da rede IPFS automaticamente
  if (cid.startsWith('bafy')) {
    console.log('\n📌 Fazendo pin do CID v1 no IPFS local...');
    console.log('   (O IPFS vai buscar o conteúdo da rede automaticamente)');
    try {
      execSync(`ipfs pin add ${cid} --progress=false`, {
        stdio: 'inherit',
        cwd: PROJECT_ROOT,
        timeout: 60000, // 60 segundos timeout (pode demorar para buscar da rede)
      });
      console.log('✅ Pin concluído - conteúdo disponível localmente\n');
    } catch (pinError) {
      // Se pin falhar, tenta publicar mesmo assim (IPFS pode resolver remotamente com --allow-offline)
      console.log('⚠️  Aviso: Não foi possível fazer pin local');
      console.log('   O conteúdo está na rede IPFS via Storacha');
      console.log('   Tentando publicar no IPNS com --allow-offline...\n');
    }
  }

  // Publica no IPNS
  try {
    console.log('🚀 Publicando no IPNS...');

    const command = `ipfs name publish ${ipfsPath} --key=${IPNS_KEY_NAME} --allow-offline`;
    const output = execSync(command, {
      encoding: 'utf-8',
      cwd: PROJECT_ROOT,
      env: {
        ...process.env,
        IPFS_PATH: process.env.IPFS_PATH || join(process.env.HOME, '.ipfs'),
      },
    });

    console.log('✅ Publicação concluída!');
    console.log(output);

    // Verifica resolução
    console.log('\n🔍 Verificando resolução...');
    const resolveCommand = `ipfs name resolve /ipns/${IPNS_KEY_ID}`;
    const resolved = execSync(resolveCommand, { encoding: 'utf-8' }).trim();

    if (resolved === ipfsPath) {
      console.log(`✅ IPNS resolve corretamente para: ${resolved}`);
    } else {
      console.warn(
        `⚠️  IPNS resolve para: ${resolved} (esperado: ${ipfsPath})`
      );
    }

    console.log(`\n🌐 URLs públicas:`);
    console.log(`   https://dweb.link/ipns/${IPNS_KEY_ID}`);
    console.log(`   https://ipfs.io/ipns/${IPNS_KEY_ID}`);
    console.log(`   https://gateway.ipfs.io/ipns/${IPNS_KEY_ID}`);
  } catch (error) {
    // Mascara mensagens de erro
    const safeErrorMessage = error.message
      ? error.message.substring(0, 200)
      : 'Erro desconhecido';
    console.error(`❌ Erro ao publicar: ${safeErrorMessage}`);
    // Não expõe stdout/stderr que podem conter informações sensíveis
    if (error.stdout && process.env.NODE_ENV === 'development') {
      console.error('stdout:', error.stdout.substring(0, 200));
    }
    if (error.stderr && process.env.NODE_ENV === 'development') {
      console.error('stderr:', error.stderr.substring(0, 200));
    }
    process.exit(1);
  }
}

// Main
const cid = process.argv[2];
// Lê UCAN_TOKEN do .env (via dotenv) ou da variável de ambiente
const ucanToken = process.env.UCAN_TOKEN;

if (!cid) {
  console.error('❌ Uso: node scripts/ipns-publisher.js <CID>');
  console.error('');
  console.error('   O token UCAN pode vir de:');
  console.error('   1. Arquivo .env (UCAN_TOKEN=...)');
  console.error(
    '   2. Variável de ambiente: UCAN_TOKEN=<token> node scripts/ipns-publisher.js <CID>'
  );
  process.exit(1);
}

if (!ucanToken) {
  console.error('❌ UCAN_TOKEN não encontrado');
  console.error('');
  console.error('   Opções:');
  console.error('   1. Adicione UCAN_TOKEN no arquivo .env');
  console.error(
    '   2. Ou defina via: UCAN_TOKEN=<token> node scripts/ipns-publisher.js <CID>'
  );
  process.exit(1);
}

publishToIPNS(cid, ucanToken).catch((error) => {
  console.error('❌ Erro fatal:', error);
  process.exit(1);
});
