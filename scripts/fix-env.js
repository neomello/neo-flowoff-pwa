
import fs from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = join(__dirname, '..', '.env');

try {
    let content = fs.readFileSync(envPath, 'utf8');
    console.log(`Lendo .env (${content.length} bytes)...`);

    // Detecta a concatenação feia
    if (content.includes('requireSTORACHA_UCAN')) {
        console.log('⚠️  Detectado erro de concatenação!');
        content = content.replace('requireSTORACHA_UCAN', 'require\nSTORACHA_UCAN');
        fs.writeFileSync(envPath, content);
        console.log('✅ Corrigido erro de concatenação no .env');
    } else {
        console.log('ℹ️  Nenhum erro de concatenação "requireSTORACHA_UCAN" encontrado.');
    }

    // Verifica se temos STORACHA_SPACE_DID na mesma linha que aspas do UCAN
    // Isso pode acontecer se "..."STORACHA_SPACE_DID ficar junto
    if (content.match(/"STORACHA_SPACE_DID=/)) {
        console.log('⚠️  Detectado erro de concatenação UCAN/SPACE_DID!');
        content = content.replace(/"STORACHA_SPACE_DID=/, '"\nSTORACHA_SPACE_DID=');
        fs.writeFileSync(envPath, content);
        console.log('✅ Corrigido erro de concatenação UCAN/SPACE_DID');
    }

} catch (err) {
    console.error('Erro ao corrigir .env:', err);
}
