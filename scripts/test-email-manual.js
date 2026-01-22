
import { Resend } from 'resend';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// Load environment variables
dotenv.config();

const RESEND_API_KEY = process.env.RESEND_API_KEY;

if (!RESEND_API_KEY) {
    console.error('❌ RESEND_API_KEY not found in .env');
    process.exit(1);
}

const resend = new Resend(RESEND_API_KEY);
const cwd = process.cwd();

// Helper to fill templates
const fill = (tpl, vars) => {
    return tpl.replace(/{{\s*([\w]+)\s*}}/g, (_, k) => vars[k] ?? "");
};

async function sendTestEmail() {
    const targetEmail = 'juliatattoo62@gmail.com';
    console.log(`📧 Sending test email to ${targetEmail}...`);

    try {
        // Load confirmation template
        const confirmationTplPath = path.join(cwd, 'emails', 'lead-confirmation.html');
        let htmlContent = '';

        if (fs.existsSync(confirmationTplPath)) {
            const tpl = fs.readFileSync(confirmationTplPath, 'utf8');
            const vars = {
                type: "Teste Manual",
                name: "Julia Tattoo",
                email: targetEmail,
                whats: "5511999999999",
                cep: "00000-000",
                message: "Esta é uma mensagem de teste enviada manualmente.",
                timestamp: new Date().toISOString(),
                whatsapp_link: "https://wa.me/5511999999999",
                source: "script",
                page: "test-script",
                utm: "test"
            };
            htmlContent = fill(tpl, vars);
        } else {
            console.warn('⚠️ Template not found, using simple HTML.');
            htmlContent = '<p>Este é um email de teste simples.</p>';
        }

        // Send Confirmation Email
        const data = await resend.emails.send({
            from: 'NEØ FlowOFF <contato@neo.flowoff.xyz>',
            to: [targetEmail],
            subject: `Teste de Envio: Confirmação`,
            html: htmlContent,
        });

        console.log('✅ Email enviado com sucesso!');
        console.log('Resend Response:', data);

    } catch (error) {
        console.error('❌ Erro ao enviar email:', error);
    }
}

sendTestEmail();
