#!/usr/bin/env node
/**
 * 🔍 Script para obter o Agent DID do cliente Storacha
 *
 * Use este DID para gerar delegações do espaço para este agente
 *
 * Uso:
 *   node scripts/get-agent-did.js
 */

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = join(__dirname, '..');

// Carrega .env
dotenv.config({ path: join(PROJECT_ROOT, '.env') });

async function getAgentDID() {
  try {
    const { create } = await import('@storacha/client');
    const client = await create();

    const agentDID = client.agent?.did?.() || 'N/A';

    console.log('\n🔍 Agent DID do Cliente Storacha:\n');
    console.log(`   ${agentDID}\n`);
    console.log('📋 Use este DID para gerar delegação:\n');
    console.log(
      `   storacha space use did:key:z6Mkjee3CCaP6q2vhRnE3wRBGNqMxEq645EvnYocsbbeZiBR`
    );
    console.log(`   storacha delegation create ${agentDID} \\`);
    console.log(`     --can space/blob/add \\`);
    console.log(`     --can space/index/add \\`);
    console.log(`     --can filecoin/offer \\`);
    console.log(`     --can upload/add \\`);
    console.log(`     --base64\n`);
    console.log('💡 Copie o output base64 e cole como STORACHA_UCAN no .env\n');

    return agentDID;
  } catch (error) {
    console.error('❌ Erro:', error.message);
    process.exit(1);
  }
}

getAgentDID();
