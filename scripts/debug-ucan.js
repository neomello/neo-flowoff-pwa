
import { create } from '@storacha/client';
import * as Proof from '@storacha/client/proof';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '..', '.env') });

async function debug() {
    console.log('🔍 Debugging UCAN & Agent Identity...');

    try {
        const client = await create();
        const agentDID = client.agent.did();
        console.log(`👤 Local Agent DID: ${agentDID}`);

        const ucan = process.env.STORACHA_UCAN;
        if (!ucan) {
            console.error('❌ STORACHA_UCAN not found in .env');
            return;
        }
        console.log(`🎫 UCAN found (length: ${ucan.length})`);

        // Clean UCAN like deploy script does
        let cleanedUCAN = ucan.replace(/\s+/g, '').trim();

        try {
            const proof = await Proof.parse(cleanedUCAN);
            const output = {
                audience: proof.audience.did(),
                issuer: proof.issuer.did(),
                capabilities: proof.capabilities,
                expiration: proof.expiration
            };

            console.log('📜 Proof Details:');
            console.log(`   Audience: ${output.audience}`);
            console.log(`   Issuer:   ${output.issuer}`);
            console.log(`   Expires:  ${output.expiration ? new Date(output.expiration * 1000).toISOString() : 'Never'}`);

            if (output.audience === agentDID) {
                console.log('✅ SUCESSO: Audience matches Agent DID!');
            } else {
                console.error('❌ ERRO: Audience MISMATCH!');
                console.error(`   Esperado: ${agentDID}`);
                console.error(`   Encontrado: ${output.audience}`);
            }

        } catch (parseError) {
            console.error('❌ Error parsing UCAN:', parseError.message);
        }

    } catch (err) {
        console.error('Error creating client:', err);
    }
}

debug();
