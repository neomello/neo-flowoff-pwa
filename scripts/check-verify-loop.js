
import { Resend } from 'resend';
import dotenv from 'dotenv';

dotenv.config();

const resend = new Resend(process.env.RESEND_API_KEY);

async function optimizeVerification() {
    const targetDomain = 'neo.flowoff.xyz';
    console.log(`🔄 Checking verification status for ${targetDomain}...`);

    for (let i = 0; i < 6; i++) {
        try {
            const response = await resend.domains.list();
            const domains = Array.isArray(response) ? response : (response.data?.data || response.data || []);
            const domain = domains.find(d => d.name === targetDomain);

            if (domain) {
                console.log(`[Attempt ${i + 1}/6] Status: ${domain.status}`);
                if (domain.status === 'verified') {
                    console.log('✅ DOMAIN VERIFIED!');
                    return;
                }
                // Trigger verify again
                await resend.domains.verify(domain.id);
            }
        } catch (e) {
            console.error(e);
        }
        await new Promise(r => setTimeout(r, 10000)); // Wait 10s
    }
    console.log('Still pending... please check back later.');
}

optimizeVerification();
