#!/usr/bin/env node
/**
 * ☁️ Configuração do Cloudinary
 * 
 * Módulo centralizado para configuração e uso do Cloudinary
 * Suporta fetch automático de imagens dos domínios autorizados
 * 
 * Uso:
 *   import { cloudinary, optimizeImage, fetchImage, uploadImage } from './scripts/cloudinary-config.js';
 */

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';
import { v2 as cloudinary } from 'cloudinary';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = join(__dirname, '..');

// Carrega .env
dotenv.config({ path: join(PROJECT_ROOT, '.env') });

// Domínios autorizados para fetch automático
const ALLOWED_DOMAINS = [
  'www.flowoff.xyz',
  'flowoff.xyz',
  'www.flowoff.com.br',
  'flowoff.com.br',
  'neoflw.vercel.app'
];

// Configuração do Cloudinary
const config = {
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || process.env.CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY || process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET || process.env.CLOUD_API_SECRET
};

// Valida se todas as credenciais estão configuradas
function validateConfig() {
  const missing = [];
  if (!config.cloud_name) missing.push('CLOUDINARY_CLOUD_NAME ou CLOUD_NAME');
  if (!config.api_key) missing.push('CLOUDINARY_API_KEY ou CLOUD_API_KEY');
  if (!config.api_secret) missing.push('CLOUDINARY_API_SECRET ou CLOUD_API_SECRET');

  if (missing.length > 0) {
    throw new Error(`❌ Cloudinary não configurado. Variáveis faltando: ${missing.join(', ')}`);
  }

  return true;
}

// Inicializa e configura o Cloudinary
if (config.cloud_name && config.api_key && config.api_secret) {
  cloudinary.config({
    cloud_name: config.cloud_name,
    api_key: config.api_key,
    api_secret: config.api_secret,
    secure: true
  });
}

/**
 * Valida se uma URL é de um domínio permitido
 * @param {string} url - URL da imagem
 * @returns {boolean}
 */
function isAllowedDomain(url) {
  try {
    const urlObj = new URL(url);
    return ALLOWED_DOMAINS.some(domain => 
      urlObj.hostname === domain || urlObj.hostname.endsWith('.' + domain)
    );
  } catch {
    return false;
  }
}

/**
 * Otimiza uma imagem existente no Cloudinary
 * @param {string} publicId - Public ID da imagem no Cloudinary
 * @param {object} options - Opções de transformação
 * @returns {string} URL otimizada
 */
export function optimizeImage(publicId, options = {}) {
  validateConfig();

  const defaultOptions = {
    fetch_format: 'auto',
    quality: 'auto',
    ...options
  };

  return cloudinary.url(publicId, defaultOptions);
}

/**
 * Busca e otimiza uma imagem de URL externa (fetch automático)
 * O Cloudinary busca a imagem automaticamente quando a URL é acessada pela primeira vez
 * 
 * @param {string} imageUrl - URL completa da imagem externa
 * @param {object} options - Opções de transformação
 * @returns {string} URL do Cloudinary com a imagem otimizada
 */
export function fetchImage(imageUrl, options = {}) {
  validateConfig();

  // Valida domínio se for URL externa
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    if (!isAllowedDomain(imageUrl)) {
      console.warn(`⚠️ Domínio não autorizado para fetch: ${imageUrl}`);
      // Retorna a URL original se não for permitido
      return imageUrl;
    }
  }

  const defaultOptions = {
    fetch_format: 'auto',
    quality: 'auto',
    ...options
  };

  // Cloudinary fetch automático: use a URL completa como public_id com tipo 'fetch'
  // Formato: https://res.cloudinary.com/CLOUD_NAME/image/fetch/TRANSFORMS/https://example.com/image.jpg
  // O Cloudinary busca automaticamente na primeira requisição
  return cloudinary.url(imageUrl, {
    ...defaultOptions,
    type: 'fetch',
    secure: true
  });
}

/**
 * Faz upload de uma imagem para o Cloudinary
 * Suporta upload de arquivo local, buffer, stream ou URL externa (com fetch automático)
 * 
 * @param {string|Buffer|ReadableStream} source - Caminho do arquivo, buffer, stream ou URL externa
 * @param {object} options - Opções de upload
 * @returns {Promise<object>} Resultado do upload
 */
export async function uploadImage(source, options = {}) {
  validateConfig();

  // Se for URL externa, valida domínio
  if (typeof source === 'string' && (source.startsWith('http://') || source.startsWith('https://'))) {
    if (!isAllowedDomain(source)) {
      console.warn(`⚠️ Domínio não autorizado para upload: ${source}`);
      throw new Error(`Domínio não autorizado: ${source}`);
    }
  }

  const uploadOptions = {
    folder: options.folder || 'flowoff',
    use_filename: options.use_filename !== false,
    unique_filename: options.unique_filename !== false,
    overwrite: options.overwrite || false,
    ...options
  };

  try {
    // Cloudinary automaticamente faz fetch se source for uma URL
    const result = await cloudinary.uploader.upload(source, uploadOptions);
    return {
      success: true,
      public_id: result.public_id,
      url: result.secure_url,
      width: result.width,
      height: result.height,
      format: result.format,
      bytes: result.bytes,
      created_at: result.created_at
    };
  } catch (error) {
    console.error('❌ Erro no upload:', error.message);
    throw error;
  }
}

/**
 * Transforma uma imagem com opções específicas
 * @param {string} publicId - Public ID da imagem
 * @param {object} transformations - Transformações a aplicar
 * @returns {string} URL transformada
 */
export function transformImage(publicId, transformations = {}) {
  validateConfig();

  const defaultTransformations = {
    crop: 'auto',
    gravity: 'auto',
    ...transformations
  };

  return cloudinary.url(publicId, defaultTransformations);
}

/**
 * Remove uma imagem do Cloudinary
 * @param {string} publicId - Public ID da imagem
 * @returns {Promise<object>} Resultado da remoção
 */
export async function deleteImage(publicId) {
  validateConfig();

  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return {
      success: result.result === 'ok',
      result: result.result
    };
  } catch (error) {
    console.error('❌ Erro ao remover imagem:', error.message);
    throw error;
  }
}

// Exporta instância configurada do Cloudinary
export { cloudinary };

// Exporta configuração para referência
export const CLOUDINARY_CONFIG = config;
export const ALLOWED_DOMAINS_LIST = ALLOWED_DOMAINS;
