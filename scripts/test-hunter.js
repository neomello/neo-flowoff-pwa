
import dotenv from 'dotenv';
import https from 'https';

dotenv.config();

const HUNTER_API_KEY = process.env.HUNTER_API_KEY;

if (!HUNTER_API_KEY) {
    console.error('❌ HUNTER_API_KEY not found in .env');
    process.exit(1);
}

const verifyEmail = (email) => {
    return new Promise((resolve, reject) => {
        const url = `https://api.hunter.io/v2/email-verifier?email=${encodeURIComponent(email)}&api_key=${HUNTER_API_KEY}`;

        https.get(url, (res) => {
            let data = '';

            res.on('data', (chunk) => {
                data += chunk;
            });

            res.on('end', () => {
                try {
                    const json = JSON.parse(data);
                    resolve(json);
                } catch (e) {
                    reject(e);
                }
            });
        }).on('error', (err) => {
            reject(err);
        });
    });
};

async function runTest() {
    const testEmails = [
        'nettoaeb1@gmail.com',   // Valid
        'test.ignore@example.com' // Likely invalid/accept_all
    ];

    console.log('🕵️‍♀️ Testing Hunter.io Email Verification...\n');

    for (const email of testEmails) {
        console.log(`Checking: ${email}...`);
        try {
            const result = await verifyEmail(email);

            if (result.errors) {
                console.error('❌ API Error:', result.errors);
            } else {
                const { status, score, result: reason, regexp, mx_records } = result.data;
                console.log(`✅ Result for ${email}:`);
                console.log(`   Status: ${status}`);
                console.log(`   Score: ${score}%`);
                console.log(`   Reason: ${reason || 'N/A'}`);
                console.log(`   MX Records: ${mx_records ? 'Yes' : 'No'}`);
                console.log('---');
            }
        } catch (error) {
            console.error('❌ Unexpected error:', error);
        }
    }
}

runTest();
