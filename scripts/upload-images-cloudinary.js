#!/usr/bin/env node
/**
 * 📤 Upload de Imagens para Cloudinary
 * 
 * Faz upload de todas as imagens da pasta public/ para o Cloudinary
 * Mantém a estrutura de pastas original
 * 
 * Uso:
 *   node scripts/upload-images-cloudinary.js
 *   node scripts/upload-images-cloudinary.js --dry-run  (apenas lista arquivos)
 *   node scripts/upload-images-cloudinary.js --folder flowoff  (especifica pasta base)
 */

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readdir, stat } from 'fs/promises';
import { existsSync, writeFileSync } from 'fs';
import dotenv from 'dotenv';
import { uploadImage } from './cloudinary-config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = join(__dirname, '..');

// Carrega .env
dotenv.config({ path: join(PROJECT_ROOT, '.env') });

const PUBLIC_DIR = join(PROJECT_ROOT, 'public');
const ALLOWED_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.webp', '.svg', '.gif'];
const DRY_RUN = process.argv.includes('--dry-run');

// Pasta base no Cloudinary (extraída dos argumentos ou padrão)
const args = process.argv.slice(2);
const folderArg = args.find(arg => arg.startsWith('--folder='));
const CLOUDINARY_FOLDER = folderArg 
  ? folderArg.split('=')[1] 
  : 'flowoff/public';

/**
 * Verifica se arquivo é uma imagem
 */
function isImageFile(filename) {
  const ext = filename.toLowerCase().substring(filename.lastIndexOf('.'));
  return ALLOWED_EXTENSIONS.includes(ext);
}

/**
 * Recupera recursivamente todos os arquivos de imagem
 */
async function getAllImages(dir, baseDir = dir) {
  const files = [];
  
  try {
    const entries = await readdir(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = join(dir, entry.name);
      
      if (entry.isDirectory()) {
        // Ignora node_modules e outras pastas desnecessárias
        if (!entry.name.startsWith('.') && entry.name !== 'node_modules') {
          const subFiles = await getAllImages(fullPath, baseDir);
          files.push(...subFiles);
        }
      } else if (entry.isFile() && isImageFile(entry.name)) {
        const relativePath = fullPath.replace(baseDir + '/', '');
        files.push({
          fullPath,
          relativePath,
          filename: entry.name,
          stat: await stat(fullPath)
        });
      }
    }
  } catch (error) {
    console.error(`Erro ao ler diretório ${dir}:`, error.message);
  }
  
  return files;
}

/**
 * Calcula public_id mantendo estrutura de pastas
 */
function getPublicId(relativePath) {
  // Remove extensão
  const withoutExt = relativePath.replace(/\.[^/.]+$/, '');
  // Substitui barras e espaços
  const sanitized = withoutExt.replace(/\s+/g, '-').replace(/\/+/g, '/');
  // Retorna apenas o caminho relativo (sem pasta base, será usado no folder)
  return sanitized;
}

/**
 * Faz upload de uma imagem
 */
async function uploadImageFile(imageFile, cloudinaryFolder) {
  const publicId = getPublicId(imageFile.relativePath);
  const fullPublicId = `${cloudinaryFolder}/${publicId}`;
  const sizeKB = (imageFile.stat.size / 1024).toFixed(2);
  
  console.log(`\n📤 Upload: ${imageFile.relativePath}`);
  console.log(`   Tamanho: ${sizeKB} KB`);
  console.log(`   Public ID: ${fullPublicId}`);
  
  if (DRY_RUN) {
    console.log(`   ⏭️  Dry run - não enviado`);
    return { skipped: true, publicId: fullPublicId };
  }
  
  try {
    const result = await uploadImage(imageFile.fullPath, {
      folder: cloudinaryFolder,
      public_id: publicId, // Apenas o caminho relativo, folder será adicionado
      use_filename: false, // Usa public_id customizado
      unique_filename: false,
      overwrite: true, // Sobrescreve se já existir
      resource_type: 'auto' // Detecta tipo automaticamente
    });
    
    console.log(`   ✅ Upload bem-sucedido!`);
    console.log(`   URL: ${result.url}`);
    
    return {
      success: true,
      publicId: result.public_id,
      url: result.url,
      relativePath: imageFile.relativePath,
      size: imageFile.stat.size
    };
  } catch (error) {
    console.error(`   ❌ Erro: ${error.message}`);
    return {
      success: false,
      error: error.message,
      relativePath: imageFile.relativePath
    };
  }
}

/**
 * Função principal
 */
async function uploadAllImages() {
  console.log('📤 Upload de Imagens para Cloudinary\n');
  console.log('='.repeat(60));
  
  if (DRY_RUN) {
    console.log('⚠️  MODO DRY RUN - Nenhum arquivo será enviado\n');
  }
  
  // Verifica se pasta public existe
  if (!existsSync(PUBLIC_DIR)) {
    console.error(`❌ Pasta public não encontrada: ${PUBLIC_DIR}`);
    process.exit(1);
  }
  
  console.log(`📁 Diretório: ${PUBLIC_DIR}`);
  console.log(`☁️  Pasta Cloudinary: ${CLOUDINARY_FOLDER}\n`);
  
  // Lista todas as imagens
  console.log('🔍 Buscando imagens...');
  const images = await getAllImages(PUBLIC_DIR);
  
  if (images.length === 0) {
    console.log('⚠️  Nenhuma imagem encontrada!');
    process.exit(0);
  }
  
  console.log(`✅ Encontradas ${images.length} imagem(ns)\n`);
  
  // Mostra lista se dry run
  if (DRY_RUN) {
    console.log('📋 Arquivos que seriam enviados:');
    images.forEach((img, index) => {
      const sizeKB = (img.stat.size / 1024).toFixed(2);
      console.log(`   ${index + 1}. ${img.relativePath} (${sizeKB} KB)`);
    });
    console.log('');
    return;
  }
  
  // Faz upload
  const results = {
    success: [],
    failed: [],
    totalSize: 0
  };
  
  console.log('🚀 Iniciando uploads...\n');
  
  for (let i = 0; i < images.length; i++) {
    const image = images[i];
    console.log(`\n[${i + 1}/${images.length}]`);
    
    const result = await uploadImageFile(image, CLOUDINARY_FOLDER);
    
    if (result.success) {
      results.success.push(result);
      results.totalSize += result.size;
    } else if (!result.skipped) {
      results.failed.push(result);
    }
    
    // Pequeno delay para não sobrecarregar a API
    if (i < images.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
  
  // Relatório final
  console.log('\n' + '='.repeat(60));
  console.log('📊 RELATÓRIO FINAL\n');
  console.log(`✅ Sucesso: ${results.success.length}`);
  console.log(`❌ Falhas: ${results.failed.length}`);
  console.log(`📦 Total: ${images.length}`);
  console.log(`💾 Tamanho total: ${(results.totalSize / 1024 / 1024).toFixed(2)} MB\n`);
  
  if (results.success.length > 0) {
    console.log('✅ Imagens enviadas com sucesso:\n');
    results.success.forEach((result, index) => {
      console.log(`${index + 1}. ${result.relativePath}`);
      console.log(`   Public ID: ${result.publicId}`);
      console.log(`   URL: ${result.url}\n`);
    });
  }
  
  if (results.failed.length > 0) {
    console.log('\n❌ Falhas:\n');
    results.failed.forEach((result, index) => {
      console.log(`${index + 1}. ${result.relativePath}`);
      console.log(`   Erro: ${result.error}\n`);
    });
  }
  
  // Gera arquivo de mapeamento (URLs)
  if (results.success.length > 0) {
    const mappingFile = join(PROJECT_ROOT, 'cloudinary-mapping.json');
    const mapping = {};
    
    results.success.forEach(result => {
      mapping[result.relativePath] = {
        url: result.url,
        publicId: result.publicId
      };
    });
    
    writeFileSync(mappingFile, JSON.stringify(mapping, null, 2));
    console.log(`\n📝 Mapeamento salvo em: cloudinary-mapping.json`);
    console.log('   Use este arquivo para atualizar URLs no código\n');
  }
  
  console.log('💡 Próximos passos:');
  console.log('   1. Revise as URLs geradas');
  console.log('   2. Atualize as referências no código se necessário');
  console.log('   3. Use fetchImage() para imagens futuras dos domínios autorizados\n');
}

// Executa
uploadAllImages().catch(error => {
  console.error('\n❌ Erro fatal:', error.message);
  process.exit(1);
});
