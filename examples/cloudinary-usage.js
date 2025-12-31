#!/usr/bin/env node
/**
 * 📚 Exemplos de Uso do Cloudinary
 * 
 * Demonstra como usar o Cloudinary para:
 * - Upload de imagens
 * - Otimização automática
 * - Fetch de imagens externas dos domínios autorizados
 * - Transformações (resize, crop, etc)
 * 
 * Uso:
 *   node examples/cloudinary-usage.js
 */

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';
import {
  optimizeImage,
  fetchImage,
  uploadImage,
  transformImage
} from '../scripts/cloudinary-config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = join(__dirname, '..');

// Carrega .env
dotenv.config({ path: join(PROJECT_ROOT, '.env') });

async function examples() {
  console.log('📚 Exemplos de Uso do Cloudinary\n');

  // Exemplo 1: Fetch automático de imagem dos domínios autorizados
  console.log('🌐 Exemplo 1: Fetch automático de imagem externa');
  console.log('   (O Cloudinary busca e otimiza a imagem automaticamente)\n');
  
  const fetchUrl = fetchImage(
    'https://www.flowoff.xyz/public/flowoff%20logo.webp',
    {
      fetch_format: 'auto',  // Auto-detecta melhor formato (WebP, AVIF, etc)
      quality: 'auto',        // Qualidade automática otimizada
      width: 800              // Redimensiona para 800px de largura
    }
  );
  
  console.log('   URL original: https://www.flowoff.xyz/public/flowoff%20logo.webp');
  console.log(`   URL otimizada: ${fetchUrl}\n`);
  console.log('   💡 O Cloudinary vai buscar a imagem, otimizá-la e servir via CDN\n');

  // Exemplo 2: Otimização de imagem já no Cloudinary
  console.log('⚡ Exemplo 2: Otimização de imagem existente');
  console.log('   (Imagem já está no Cloudinary, apenas otimizamos)\n');
  
  const optimizedUrl = optimizeImage('test-shoes', {
    fetch_format: 'auto',
    quality: 'auto',
    width: 1200,
    height: 800,
    crop: 'limit'  // Mantém proporção, limita dimensões
  });
  
  console.log(`   Public ID: test-shoes`);
  console.log(`   URL otimizada: ${optimizedUrl}\n`);

  // Exemplo 3: Transformação com auto-crop
  console.log('🔄 Exemplo 3: Transformação com auto-crop');
  console.log('   (Corta automaticamente focando no conteúdo principal)\n');
  
  const croppedUrl = transformImage('test-shoes', {
    width: 500,
    height: 500,
    crop: 'auto',      // Crop automático inteligente
    gravity: 'auto',   // Detecta área de interesse automaticamente
    quality: 'auto'
  });
  
  console.log(`   URL transformada: ${croppedUrl}\n`);

  // Exemplo 4: Upload de nova imagem
  console.log('📤 Exemplo 4: Upload de nova imagem');
  console.log('   (Upload de arquivo local ou URL para o Cloudinary)\n');
  
  try {
    const uploadResult = await uploadImage(
      'https://res.cloudinary.com/demo/image/upload/getting-started/shoes.jpg',
      {
        folder: 'flowoff/uploads',  // Organiza em pastas
        public_id: 'my-image',       // Nome customizado
        overwrite: false,            // Não sobrescreve se já existir
        use_filename: true,          // Usa nome do arquivo
        unique_filename: true        // Adiciona hash único se conflito
      }
    );
    
    console.log('   ✅ Upload bem-sucedido!');
    console.log(`   Public ID: ${uploadResult.public_id}`);
    console.log(`   URL: ${uploadResult.url}`);
    console.log(`   Dimensões: ${uploadResult.width}x${uploadResult.height}`);
    console.log(`   Formato: ${uploadResult.format}`);
    console.log(`   Tamanho: ${(uploadResult.bytes / 1024).toFixed(2)} KB\n`);
  } catch (error) {
    console.log(`   ⚠️ Erro (esperado se já existir): ${error.message}\n`);
  }

  // Exemplo 5: Uso prático - Imagens responsivas
  console.log('📱 Exemplo 5: Imagens responsivas para diferentes dispositivos');
  console.log('   (Gerar URLs otimizadas para mobile, tablet, desktop)\n');
  
  const basePublicId = 'test-shoes';
  
  const mobileUrl = optimizeImage(basePublicId, {
    width: 400,
    quality: 'auto',
    fetch_format: 'auto'
  });
  
  const tabletUrl = optimizeImage(basePublicId, {
    width: 800,
    quality: 'auto',
    fetch_format: 'auto'
  });
  
  const desktopUrl = optimizeImage(basePublicId, {
    width: 1200,
    quality: 'auto',
    fetch_format: 'auto'
  });
  
  console.log('   Mobile (400px):  ', mobileUrl);
  console.log('   Tablet (800px):  ', tabletUrl);
  console.log('   Desktop (1200px):', desktopUrl);
  console.log('\n   💡 Use srcset ou media queries no HTML para responsividade\n');

  // Exemplo 6: Lazy loading com placeholder
  console.log('🖼️ Exemplo 6: Placeholder para lazy loading');
  console.log('   (Gera versão pequena/blurred enquanto carrega a original)\n');
  
  const placeholderUrl = transformImage('test-shoes', {
    width: 50,
    height: 50,
    crop: 'fill',
    quality: 'auto',
    effect: 'blur:300'  // Blur forte para placeholder
  });
  
  const fullImageUrl = optimizeImage('test-shoes', {
    width: 1200,
    quality: 'auto'
  });
  
  console.log('   Placeholder (blur):', placeholderUrl);
  console.log('   Imagem completa:   ', fullImageUrl);
  console.log('\n   💡 HTML exemplo:');
  console.log('   <img src="' + placeholderUrl + '" data-src="' + fullImageUrl + '" loading="lazy" />\n');

  console.log('✅ Exemplos concluídos!\n');
  console.log('📖 Documentação completa: https://cloudinary.com/documentation');
  console.log('🧪 Teste sua configuração: node scripts/test-cloudinary.js\n');
}

examples().catch(console.error);
