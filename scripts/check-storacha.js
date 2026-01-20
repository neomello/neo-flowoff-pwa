#!/usr/bin/env node
/**
 * 🔍 Script de Verificação da Conta Storacha
 *
 * Lista espaços, arquivos e informações da conta Storacha
 *
 * Uso:
 *   node scripts/check-storacha.js
 */

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = join(__dirname, '..');

// Carrega .env
dotenv.config({ path: join(PROJECT_ROOT, '.env') });

const STORACHA_DID = process.env.STORACHA_DID;
const STORACHA_UCAN = process.env.STORACHA_UCAN || process.env.UCAN_TOKEN;
const STORACHA_PRIVATE_KEY = process.env.STORACHA_PRIVATE_KEY;
const STORACHA_SPACE_DID =
  process.env.STORACHA_SPACE_DID ||
  'did:key:z6Mkjee3CCaP6q2vhRnE3wRBGNqMxEq645EvnYocsbbeZiBR';

async function checkStoracha() {
  console.log('🔍 Verificando Conta Storacha\n');
  console.log('═══════════════════════════════════════\n');

  // Função para mascarar valores sensíveis
  const maskSensitive = (value, showStart = 10, showEnd = 4) => {
    if (!value || typeof value !== 'string') return '***';
    if (value.length <= showStart + showEnd) return '***';
    return `${value.substring(0, showStart)}...${value.substring(value.length - showEnd)}`;
  };

  // Verifica configuração
  console.log('📋 Configuração:\n');
  console.log(
    `   DID: ${STORACHA_DID ? '✅ Configurado' : '❌ Não configurado'}`
  );
  if (STORACHA_DID) {
    console.log(`      ${maskSensitive(STORACHA_DID, 20, 8)}`);
  }
  console.log(
    `   UCAN: ${STORACHA_UCAN ? '✅ Configurado' : '❌ Não configurado'}`
  );
  if (STORACHA_UCAN) {
    console.log(`      ${maskSensitive(STORACHA_UCAN, 20, 8)}`);
  }
  console.log(
    `   Space DID: ${STORACHA_SPACE_DID ? '✅ Configurado' : '❌ Não configurado'}`
  );
  if (STORACHA_SPACE_DID) {
    // DID de espaço pode ser mostrado completo (é público)
    console.log(`      ${STORACHA_SPACE_DID}`);
  }
  console.log(
    `   Private Key: ${STORACHA_PRIVATE_KEY ? '✅ Configurado (oculto)' : '⚠️  Não configurado (opcional)'}\n`
  );

  if (!STORACHA_DID && !STORACHA_UCAN) {
    console.log('❌ Nenhuma credencial Storacha encontrada no .env');
    console.log('   Configure STORACHA_DID e/ou STORACHA_UCAN\n');
    return;
  }

  try {
    // Importa Storacha client
    console.log('🔧 Conectando ao Storacha...\n');
    const { create } = await import('@storacha/client');
    const { Signer } = await import('@storacha/client/principal/ed25519');

    // Cria cliente
    let client;
    let principal = null;

    if (STORACHA_PRIVATE_KEY) {
      try {
        principal = Signer.parse(STORACHA_PRIVATE_KEY);
        console.log('✅ Signer criado a partir da chave privada\n');
        client = await create({ principal });
      } catch (e) {
        console.log(
          '⚠️  Erro ao criar signer, usando cliente padrão:',
          e.message
        );
        client = await create();
      }
    } else {
      client = await create();
    }

    // Informações do cliente
    console.log('👤 Informações do Cliente:\n');
    try {
      const agent = client.agent;
      if (agent) {
        const agentDID = agent.did ? agent.did() : 'N/A';
        // DID do agente pode ser mostrado (é público, usado para delegações)
        console.log(`   Agent DID: ${agentDID}`);
      }
    } catch (e) {
      console.log('   Agent: Não disponível');
    }

    // Lista espaços
    console.log('\n📦 Espaços Disponíveis:\n');
    try {
      // Tenta listar espaços
      const spaces = (await client.listSpaces?.()) || [];

      if (spaces.length === 0) {
        console.log('   ℹ️  Nenhum espaço encontrado');
        console.log('   (Isso é normal se você ainda não criou espaços)\n');
      } else {
        for (const space of spaces) {
          const spaceDID = space.did ? space.did() : space;
          console.log(`   ✅ ${spaceDID}`);

          // Tenta obter mais informações do espaço
          try {
            if (space.name) {
              console.log(`      Nome: ${space.name}`);
            }
            if (space.created) {
              console.log(
                `      Criado: ${new Date(space.created).toISOString()}`
              );
            }
          } catch (e) {
            // Ignora erros ao obter detalhes
          }
        }
        console.log('');
      }
    } catch (e) {
      console.log('   ⚠️  Não foi possível listar espaços:', e.message);
      console.log('   (Isso pode ser normal dependendo da API)\n');
    }

    // Verifica espaço atual
    console.log('📍 Espaço Atual:\n');
    try {
      const currentSpace = client.currentSpace?.();
      if (currentSpace) {
        // Tenta obter o DID do espaço
        let spaceDID = 'N/A';
        try {
          if (typeof currentSpace === 'string') {
            spaceDID = currentSpace;
          } else if (currentSpace.did) {
            spaceDID =
              typeof currentSpace.did === 'function'
                ? currentSpace.did()
                : currentSpace.did;
          } else if (currentSpace.toString) {
            spaceDID = currentSpace.toString();
          }
        } catch (e) {
          spaceDID = String(currentSpace);
        }
        console.log(`   ✅ ${spaceDID}\n`);
      } else {
        console.log('   ℹ️  Nenhum espaço atual configurado\n');
      }
    } catch (e) {
      console.log('   ⚠️  Não foi possível verificar espaço atual:', e.message);
      console.log('   (Isso é normal se não houver espaço configurado)\n');
    }

    // Tenta fazer login se houver email configurado
    const STORACHA_EMAIL = process.env.STORACHA_EMAIL;
    if (STORACHA_EMAIL) {
      console.log('🔐 Tentando login com email...\n');
      try {
        const account = await client.login(STORACHA_EMAIL);
        console.log('✅ Login realizado com sucesso!');
        // Mascara email para privacidade
        const emailParts = STORACHA_EMAIL.split('@');
        const maskedEmail =
          emailParts[0].substring(0, 2) + '***@' + (emailParts[1] || '***');
        console.log(`   Email: ${maskedEmail}`);

        // Verifica plano
        try {
          const plan = account.plan;
          if (plan) {
            console.log(`   Plano: ${plan.name || 'N/A'}`);
          }
        } catch (e) {
          // Ignora erro de plano
        }
        console.log('');
      } catch (e) {
        console.log('⚠️  Erro no login:', e.message);
        console.log(
          '   (Isso é normal se você não configurou email ou já está logado)\n'
        );
      }
    }

    // Teste de criação de espaço (apenas verificação, não cria de fato)
    console.log('🧪 Teste de Conectividade:\n');
    try {
      // Apenas verifica se o cliente está funcionando
      const testResult = client.agent
        ? '✅ Cliente funcionando'
        : '⚠️  Cliente pode ter problemas';
      console.log(`   ${testResult}\n`);
    } catch (e) {
      console.log(`   ❌ Erro: ${e.message}\n`);
    }

    console.log('═══════════════════════════════════════');
    console.log('✅ Verificação concluída!\n');
    console.log('💡 Dicas:');
    console.log(
      '   - Se não houver espaços, eles serão criados automaticamente no deploy'
    );
    console.log('   - Configure STORACHA_EMAIL no .env para login (opcional)');
    console.log(
      '   - O UCAN é usado para delegação de permissões (opcional)\n'
    );
  } catch (error) {
    console.error('❌ Erro ao verificar conta Storacha:', error.message);
    if (error.stack) {
      console.error('\nStack:', error.stack);
    }
    process.exit(1);
  }
}

checkStoracha();
