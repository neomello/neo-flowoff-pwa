#!/usr/bin/env node
/**
 * Script para substituir imagens do projeto atual pelas versões otimizadas
 * do projeto em /Users/nettomello/CODIGOS/web_apps/neo-flowoff-pwa/public
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

const sourcePublic =
  '/Users/nettomello/CODIGOS/web_apps/neo-flowoff-pwa/public';
const targetPublic = path.join(projectRoot, 'public');

// Script runs silently in production.

// Verifica se a pasta origem existe
if (!fs.existsSync(sourcePublic)) {
  console.error(`❌ Pasta origem não encontrada: ${sourcePublic}`);
  process.exit(1);
}

// Função para encontrar todas as imagens recursivamente
function findImages(dir) {
  const images = [];
  const files = fs.readdirSync(dir, { withFileTypes: true });

  for (const file of files) {
    const fullPath = path.join(dir, file.name);
    const ext = path.extname(file.name).toLowerCase();

    if (file.isDirectory()) {
      images.push(...findImages(fullPath));
    } else if (
      ['.png', '.jpg', '.jpeg', '.webp', '.gif', '.svg'].includes(ext)
    ) {
      images.push(fullPath);
    }
  }

  return images;
}

// Encontra todas as imagens na origem
const sourceImages = findImages(sourcePublic);

let replaced = 0;
let skipped = 0;
let errors = 0;

// Processa cada imagem
for (const sourceImage of sourceImages) {
  // Calcula o caminho relativo
  const relativePath = path.relative(sourcePublic, sourceImage);
  const targetImage = path.join(targetPublic, relativePath);

  // Verifica se a imagem destino existe (ou se queremos criar a estrutura)
  const targetDir = path.dirname(targetImage);

  try {
    // Cria o diretório se não existir
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    // Copia o arquivo
    fs.copyFileSync(sourceImage, targetImage);

    // Compara tamanhos
    const sourceSize = fs.statSync(sourceImage).size;
    const targetSize = fs.existsSync(targetImage)
      ? fs.statSync(targetImage).size
      : 0;

    if (sourceSize === targetSize) {
      replaced++;
    } else {
      errors++;
    }
  } catch (error) {
    errors++;
    console.error(`  ❌ Erro ao copiar ${relativePath}:`, error.message);
  }
}

// Substitution complete; replaced=${replaced}, errors=${errors}.
