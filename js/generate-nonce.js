// Gerador de nonce para CSP - deve ser executado no servidor
// Este arquivo é apenas para referência - o nonce deve ser gerado dinamicamente no servidor

function generateNonce() {
  // Em produção, usar crypto.randomBytes ou similar
  return btoa(
    String.fromCharCode(...crypto.getRandomValues(new Uint8Array(16)))
  );
}

// Para uso no servidor Node.js:
// const crypto = require('crypto');
// const nonce = crypto.randomBytes(16).toString('base64');
