
import { Resend } from 'resend';
import dotenv from 'dotenv';

dotenv.config();

const resend = new Resend(process.env.RESEND_API_KEY);

async function checkDomains() {
    try {
        console.log('🔍 Checking Resend domains...');
        const response = await resend.domains.list();

        console.log('DEBUG RAW RESPONSE:', JSON.stringify(response, null, 2));
        const domains = Array.isArray(response) ? response : (response.data?.data || response.data || []);

        console.log(`Found ${domains.length} domains.`);

        const targetDomain = 'neo.flowoff.xyz';
        const domain = domains.find(d => d.name === targetDomain);

        if (!domain) {
            console.log(`⚠️ Domain ${targetDomain} not found in Resend.`);
            console.log('Attempting to create it...');

            const createResponse = await resend.domains.create({
                name: targetDomain
            });

            if (createResponse.error) {
                console.error('❌ Error creating domain:', createResponse.error);
                return;
            }

            const newDomain = createResponse.data || createResponse;

            console.log(`✅ Domain ${targetDomain} created!`);
            console.log('👉 Please add these DNS records to your provider:');
            // Check if records are in newDomain or nested
            const records = newDomain.records || [];
            console.log(JSON.stringify(records, null, 2));

        } else {
            console.log(`ℹ️ Domain ${targetDomain} found (ID: ${domain.id}).`);
            console.log(`Status: ${domain.status}`);

            if (domain.status !== 'verified') {
                console.log('Fetching verification details...');
                const detailsResponse = await resend.domains.get(domain.id);
                const domainDetails = detailsResponse.data || detailsResponse;

                if (domainDetails && domainDetails.records) {
                    console.log('👉 DNS Records required:');

                    // Simple format for easier parsing
                    console.log('--- RECORDS START ---');
                    domainDetails.records.forEach(record => {
                        // Resend usually returns: record (type), name, value, etc.
                        // "type" might be called "record" or "type" depending on version
                        const type = record.record || record.type;
                        console.log(`${type} | ${record.name} | ${record.value}`);
                    });
                    console.log('--- RECORDS END ---');
                }

                await resend.domains.verify(domain.id);
                console.log('Verification check triggered.');
            } else {
                console.log('✅ Domain is verified and ready to send!');
            }
        }

    } catch (err) {
        console.error('Unexpected error:', err);
        console.error(err);
    }
}

checkDomains();
