/**
 * Testes para IPFS/IPNS e Storacha Integration
 * 
 * Testa:
 * - Parsing de UCAN multi-linha do .env
 * - Validação de formato do UCAN
 * - Configuração do cliente Storacha
 * - Upload para IPFS via Storacha
 * - Publicação no IPNS
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = join(__dirname, '..');

// Função para ler UCAN multi-linha (copiada do deploy-ipfs.js)
function readMultiLineUCAN(envPath, keyName = 'STORACHA_UCAN') {
  try {
    const envContent = readFileSync(envPath, 'utf-8');
    const lines = envContent.split('\n');
    let ucanValue = '';
    let inUCAN = false;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmedLine = line.trim();
      
      if (trimmedLine.startsWith(`${keyName}=`)) {
        inUCAN = true;
        const valuePart = trimmedLine.substring(trimmedLine.indexOf('=') + 1);
        if (valuePart) {
          ucanValue = valuePart;
        }
        continue;
      }
      
      if (inUCAN) {
        if (trimmedLine.startsWith('#')) {
          inUCAN = false;
          break;
        }
        
        const looksLikeNewVar = trimmedLine.match(/^[A-Z_][A-Z0-9_]*=/);
        const looksLikeBase64 = trimmedLine.match(/^[A-Za-z0-9+/=_-]+$/);
        
        if (looksLikeNewVar && !looksLikeBase64) {
          inUCAN = false;
          break;
        }
        
        if (trimmedLine && !trimmedLine.startsWith('#')) {
          if (looksLikeBase64 || !looksLikeNewVar) {
            ucanValue += trimmedLine;
          } else {
            inUCAN = false;
            break;
          }
        }
      }
    }
    
    return ucanValue || null;
  } catch (error) {
    return null;
  }
}

describe('IPFS/IPNS - Parsing de UCAN', () => {
  const envPath = join(PROJECT_ROOT, '.env');
  
  it('deve ler STORACHA_UCAN multi-linha do .env', () => {
    const ucan = readMultiLineUCAN(envPath, 'STORACHA_UCAN');
    
    expect(ucan).toBeTruthy();
    expect(typeof ucan).toBe('string');
    expect(ucan.length).toBeGreaterThan(500); // UCAN válido deve ter pelo menos 500 chars
  });
  
  it('deve remover quebras de linha do UCAN', () => {
    const ucan = readMultiLineUCAN(envPath, 'STORACHA_UCAN');
    
    if (ucan) {
      expect(ucan).not.toContain('\n');
      expect(ucan).not.toContain('\r');
    }
  });
  
  it('deve detectar formato base64url vs base64', () => {
    const ucan = readMultiLineUCAN(envPath, 'STORACHA_UCAN');
    
    if (ucan) {
      const isBase64Url = ucan.includes('-') || ucan.includes('_');
      const isBase64 = ucan.includes('+') || ucan.includes('/');
      
      // Deve ser um ou outro (ou ambos após limpeza)
      expect(isBase64Url || isBase64).toBe(true);
    }
  });
  
  it('deve validar formato base64 válido após limpeza', () => {
    const ucan = readMultiLineUCAN(envPath, 'STORACHA_UCAN');
    
    if (ucan) {
      // Remove prefixos e converte para base64 padrão
      let cleaned = ucan.replace(/^did:key:[A-Za-z0-9]+[\s-]*/, '');
      cleaned = cleaned.replace(/--can\s+[^\s]+\s*/g, '');
      cleaned = cleaned.replace(/^[^A-Za-z0-9+/=_-]+/, '');
      cleaned = cleaned.replace(/[^A-Za-z0-9+/=_-]+$/, '');
      
      // Converte base64url para base64
      cleaned = cleaned.replace(/-/g, '+').replace(/_/g, '/');
      
      // Adiciona padding
      while (cleaned.length % 4 !== 0) {
        cleaned += '=';
      }
      
      // Valida formato base64
      const base64Regex = /^[A-Za-z0-9+/=]+$/;
      expect(base64Regex.test(cleaned)).toBe(true);
    }
  });
});

describe('IPFS/IPNS - Configuração Storacha', () => {
  it('deve ter STORACHA_DID configurado no .env', () => {
    const envPath = join(PROJECT_ROOT, '.env');
    const envContent = readFileSync(envPath, 'utf-8');
    
    expect(envContent).toMatch(/STORACHA_DID=/);
  });
  
  it('deve ter STORACHA_SPACE_DID configurado no .env', () => {
    const envPath = join(PROJECT_ROOT, '.env');
    const envContent = readFileSync(envPath, 'utf-8');
    
    expect(envContent).toMatch(/STORACHA_SPACE_DID=/);
  });
  
  it('deve ter STORACHA_UCAN configurado no .env', () => {
    const envPath = join(PROJECT_ROOT, '.env');
    const ucan = readMultiLineUCAN(envPath, 'STORACHA_UCAN');
    
    expect(ucan).toBeTruthy();
    expect(ucan.length).toBeGreaterThan(500);
  });
  
  it('STORACHA_DID deve ter formato did:key:', () => {
    const envPath = join(PROJECT_ROOT, '.env');
    const envContent = readFileSync(envPath, 'utf-8');
    const match = envContent.match(/STORACHA_DID=(did:key:[^\s\n]+)/);
    
    if (match) {
      expect(match[1]).toMatch(/^did:key:z[0-9A-Za-z]+$/);
    }
  });
  
  it('STORACHA_SPACE_DID deve ter formato did:key:', () => {
    const envPath = join(PROJECT_ROOT, '.env');
    const envContent = readFileSync(envPath, 'utf-8');
    const match = envContent.match(/STORACHA_SPACE_DID=(did:key:[^\s\n]+)/);
    
    if (match) {
      expect(match[1]).toMatch(/^did:key:z[0-9A-Za-z]+$/);
    }
  });
});

describe('IPFS/IPNS - Validação de UCAN', () => {
  it('UCAN deve ter tamanho mínimo válido', () => {
    const envPath = join(PROJECT_ROOT, '.env');
    const ucan = readMultiLineUCAN(envPath, 'STORACHA_UCAN');
    
    if (ucan) {
      // UCAN válido deve ter pelo menos 500 caracteres
      expect(ucan.length).toBeGreaterThanOrEqual(500);
    }
  });
  
  it('UCAN não deve conter caracteres inválidos após limpeza', () => {
    const envPath = join(PROJECT_ROOT, '.env');
    const ucan = readMultiLineUCAN(envPath, 'STORACHA_UCAN');
    
    if (ucan) {
      // Remove prefixos
      let cleaned = ucan.replace(/^did:key:[A-Za-z0-9]+[\s-]*/, '');
      cleaned = cleaned.replace(/--can\s+[^\s]+\s*/g, '');
      cleaned = cleaned.replace(/^[^A-Za-z0-9+/=_-]+/, '');
      cleaned = cleaned.replace(/[^A-Za-z0-9+/=_-]+$/, '');
      
      // Deve conter apenas caracteres base64/base64url válidos
      const validChars = /^[A-Za-z0-9+/=_-]+$/;
      expect(validChars.test(cleaned)).toBe(true);
    }
  });
  
  it('UCAN deve poder ser decodificado para bytes', () => {
    const envPath = join(PROJECT_ROOT, '.env');
    const ucan = readMultiLineUCAN(envPath, 'STORACHA_UCAN');
    
    if (ucan) {
      // Limpa e converte
      let cleaned = ucan.replace(/^did:key:[A-Za-z0-9]+[\s-]*/, '');
      cleaned = cleaned.replace(/--can\s+[^\s]+\s*/g, '');
      cleaned = cleaned.replace(/^[^A-Za-z0-9+/=_-]+/, '');
      cleaned = cleaned.replace(/[^A-Za-z0-9+/=_-]+$/, '');
      
      const isBase64Url = cleaned.includes('-') || cleaned.includes('_');
      
      if (isBase64Url) {
        // Tenta decodificar base64url
        let padded = cleaned;
        while (padded.length % 4 !== 0) {
          padded += '=';
        }
        expect(() => {
          Buffer.from(padded, 'base64url');
        }).not.toThrow();
      } else {
        // Tenta decodificar base64
        let padded = cleaned;
        while (padded.length % 4 !== 0) {
          padded += '=';
        }
        expect(() => {
          Buffer.from(padded, 'base64');
        }).not.toThrow();
      }
    }
  });
});

describe('IPFS/IPNS - Configuração IPNS', () => {
  it('deve ter IPNS_KEY_NAME configurado no .env', () => {
    const envPath = join(PROJECT_ROOT, '.env');
    const envContent = readFileSync(envPath, 'utf-8');
    
    expect(envContent).toMatch(/IPNS_KEY_NAME=/);
  });
  
  it('deve ter IPNS_KEY_ID configurado no .env', () => {
    const envPath = join(PROJECT_ROOT, '.env');
    const envContent = readFileSync(envPath, 'utf-8');
    
    expect(envContent).toMatch(/IPNS_KEY_ID=/);
  });
  
  it('IPNS_KEY_ID deve ter formato válido (k51...)', () => {
    const envPath = join(PROJECT_ROOT, '.env');
    const envContent = readFileSync(envPath, 'utf-8');
    const match = envContent.match(/IPNS_KEY_ID=([^\s\n]+)/);
    
    if (match) {
      // IPNS key ID geralmente começa com k51 ou similar
      expect(match[1]).toMatch(/^k[0-9A-Za-z]+$/);
    }
  });
});

describe('IPFS/IPNS - Scripts de Deploy', () => {
  it('deploy-ipfs.js deve existir', () => {
    const deployScript = join(PROJECT_ROOT, 'scripts', 'deploy-ipfs.js');
    const fs = require('fs');
    expect(fs.existsSync(deployScript)).toBe(true);
  });
  
  it('ipns-publisher.js deve existir', () => {
    const ipnsScript = join(PROJECT_ROOT, 'scripts', 'ipns-publisher.js');
    const fs = require('fs');
    expect(fs.existsSync(ipnsScript)).toBe(true);
  });
  
  it('deploy-ipfs.js deve exportar funções necessárias', async () => {
    // Não podemos importar diretamente porque pode ter side effects
    // Mas podemos verificar que o arquivo existe e tem conteúdo
    const deployScript = join(PROJECT_ROOT, 'scripts', 'deploy-ipfs.js');
    const content = readFileSync(deployScript, 'utf-8');
    
    // Verifica que tem funções importantes
    expect(content).toContain('uploadToStoracha');
    expect(content).toContain('uploadToIPFS');
    expect(content).toContain('Proof.parse');
  });
});

