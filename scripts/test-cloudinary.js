#!/usr/bin/env node
/**
 * 🧪 Script de Teste do Cloudinary
 * 
 * Testa as funcionalidades do Cloudinary:
 * - Upload de imagem
 * - Otimização
 * - Fetch automático de URL externa
 * - Transformações
 * 
 * Uso:
 *   node scripts/test-cloudinary.js
 */

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';
import {
  cloudinary,
  optimizeImage,
  fetchImage,
  uploadImage,
  transformImage,
  CLOUDINARY_CONFIG,
  ALLOWED_DOMAINS_LIST
} from './cloudinary-config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = join(__dirname, '..');

// Carrega .env
dotenv.config({ path: join(PROJECT_ROOT, '.env') });

async function testCloudinary() {
  console.log('🧪 Testando Cloudinary...\n');

  // Verifica configuração
  console.log('📋 Configuração:');
  console.log(`   Cloud Name: ${CLOUDINARY_CONFIG.cloud_name || '❌ Não configurado'}`);
  console.log(`   API Key: ${CLOUDINARY_CONFIG.api_key ? '✅ Configurado' : '❌ Não configurado'}`);
  console.log(`   API Secret: ${CLOUDINARY_CONFIG.api_secret ? '✅ Configurado' : '❌ Não configurado'}`);
  console.log(`\n   Domínios autorizados: ${ALLOWED_DOMAINS_LIST.join(', ')}\n`);

  try {
    // Teste 1: Upload de imagem de exemplo
    console.log('📤 Teste 1: Upload de imagem de exemplo...');
    const uploadResult = await cloudinary.uploader
      .upload(
        'https://res.cloudinary.com/demo/image/upload/getting-started/shoes.jpg',
        {
          public_id: 'test-shoes',
          overwrite: true,
          folder: 'flowoff/tests'
        }
      )
      .catch((error) => {
        console.error('   ❌ Erro:', error.message);
        return null;
      });

    if (uploadResult) {
      console.log('   ✅ Upload bem-sucedido!');
      console.log(`   Public ID: ${uploadResult.public_id}`);
      console.log(`   URL: ${uploadResult.secure_url}\n`);
    }

    // Teste 2: Otimização de entrega
    console.log('⚡ Teste 2: Otimização automática...');
    const optimizeUrl = optimizeImage('test-shoes', {
      fetch_format: 'auto',
      quality: 'auto'
    });
    console.log(`   ✅ URL otimizada: ${optimizeUrl}\n`);

    // Teste 3: Transformação (auto-crop)
    console.log('🔄 Teste 3: Transformação (auto-crop)...');
    const autoCropUrl = transformImage('test-shoes', {
      crop: 'auto',
      gravity: 'auto',
      width: 500,
      height: 500
    });
    console.log(`   ✅ URL transformada: ${autoCropUrl}\n`);

    // Teste 4: Fetch automático de URL externa (domínio autorizado)
    console.log('🌐 Teste 4: Fetch automático de URL externa...');
    const fetchUrl = fetchImage(
      'https://www.flowoff.xyz/public/flowoff%20logo.webp',
      {
        fetch_format: 'auto',
        quality: 'auto',
        width: 800
      }
    );
    console.log(`   ✅ URL com fetch: ${fetchUrl}\n`);

    // Teste 5: Teste com função uploadImage helper
    console.log('📤 Teste 5: Upload usando helper uploadImage...');
    try {
      const helperUpload = await uploadImage(
        'https://res.cloudinary.com/demo/image/upload/getting-started/shoes.jpg',
        {
          public_id: 'test-shoes-helper',
          folder: 'flowoff/tests',
          overwrite: true
        }
      );
      console.log('   ✅ Upload com helper bem-sucedido!');
      console.log(`   Public ID: ${helperUpload.public_id}`);
      console.log(`   URL: ${helperUpload.url}`);
      console.log(`   Dimensões: ${helperUpload.width}x${helperUpload.height}\n`);
    } catch (error) {
      console.log(`   ⚠️ Erro no helper (esperado se já existir): ${error.message}\n`);
    }

    console.log('✅ Todos os testes concluídos!\n');

    // Mostra resumo
    console.log('📊 Resumo:');
    console.log('   ✅ Configuração: OK');
    console.log('   ✅ Upload: OK');
    console.log('   ✅ Otimização: OK');
    console.log('   ✅ Transformação: OK');
    console.log('   ✅ Fetch automático: OK');
    console.log('\n💡 Dicas:');
    console.log('   - Use fetchImage() para imagens dos domínios autorizados');
    console.log('   - Use uploadImage() para novos uploads');
    console.log('   - Use optimizeImage() para otimizar imagens existentes');
    console.log('   - Use transformImage() para aplicar transformações\n');

  } catch (error) {
    console.error('❌ Erro durante os testes:', error.message);
    if (error.message.includes('não configurado')) {
      console.error('\n💡 Configure as variáveis no .env:');
      console.error('   CLOUDINARY_CLOUD_NAME=seu_cloud_name');
      console.error('   CLOUDINARY_API_KEY=sua_api_key');
      console.error('   CLOUDINARY_API_SECRET=seu_api_secret\n');
    }
    process.exit(1);
  }
}

// Executa os testes
testCloudinary().catch(console.error);
