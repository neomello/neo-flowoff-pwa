import {
  setCORSHeaders,
  handleOptions,
  parseJsonBody,
  enforceRateLimit,
  sanitizeText,
  isValidEthereumAddress,
  setSecurityHeaders,
  detectClientType,
} from './utils.js';
import { query } from './db.js';

const MAX_BODY_SIZE = 8000;

/**
 * API: Registro de Usuário - NEØ FlowOFF
 * 
 * POST /api/register
 * Body: {
 *   email: string (obrigatório),
 *   wallet_address: string (obrigatório),
 *   provider: string (obrigatório - 'metamask', 'web3auth', 'walletconnect'),
 *   username?: string (opcional),
 *   full_name?: string (opcional),
 * }
 * 
 * Fluxo:
 * 1. Valida inputs
 * 2. Verifica se email/wallet já existe
 * 3. Cria usuário na tabela `users`
 * 4. Vincula wallet na tabela `user_wallets`
 * 5. Retorna dados do usuário criado
 * 
 * Rate Limit: 10 requests/hora por IP
 */
export default async function handler(req, res) {
  // Preflight
  if (req.method === 'OPTIONS') {
    return handleOptions(req, res);
  }

  setCORSHeaders(req, res);
  setSecurityHeaders(res);

  if (req.method !== 'POST') {
    return res.status(405).json({ 
      error: 'Method not allowed',
      allowed: ['POST'],
    });
  }

  try {
    // Rate limit rigoroso: 10 requests/hora
    const clientType = detectClientType(req);
    const rateLimit = clientType === 'desktop' ? 20 : 10;
    
    if (!enforceRateLimit(req, res, { 
      limit: rateLimit,
      windowMs: 60 * 60 * 1000, // 1 hora
    })) {
      return;
    }

    // Parse body
    const body = await parseJsonBody(req, res, MAX_BODY_SIZE);
    if (!body) return;

    // ================================================
    // 1. VALIDAÇÃO DE INPUTS
    // ================================================

    const email = sanitizeText(body.email, 255);
    const walletAddress = sanitizeText(body.wallet_address || body.wallet, 128);
    const provider = sanitizeText(body.provider, 64);
    const username = sanitizeText(body.username, 64) || null;
    const fullName = sanitizeText(body.full_name || body.fullName, 128) || null;
    const chainId = parseInt(body.chain_id || body.chainId || '8453', 10);

    // Validações obrigatórias
    if (!email) {
      return res.status(400).json({ 
        error: 'Email é obrigatório',
        field: 'email',
      });
    }

    if (!walletAddress) {
      return res.status(400).json({ 
        error: 'Endereço da wallet é obrigatório',
        field: 'wallet_address',
      });
    }

    if (!provider) {
      return res.status(400).json({ 
        error: 'Provider é obrigatório (ex: metamask, web3auth)',
        field: 'provider',
      });
    }

    // Validar formato do email
    const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ 
        error: 'Email inválido',
        field: 'email',
      });
    }

    // Validar endereço Ethereum
    if (!isValidEthereumAddress(walletAddress)) {
      return res.status(400).json({ 
        error: 'Endereço da wallet inválido',
        field: 'wallet_address',
      });
    }

    // Validar provider permitido
    const allowedProviders = ['metamask', 'web3auth', 'walletconnect', 'coinbase', 'phantom'];
    if (!allowedProviders.includes(provider.toLowerCase())) {
      return res.status(400).json({ 
        error: 'Provider não suportado',
        field: 'provider',
        allowed: allowedProviders,
      });
    }

    // ================================================
    // 2. VERIFICAR SE JÁ EXISTE
    // ================================================

    // Verificar se email já está cadastrado
    const existingEmail = await query(
      'SELECT id, email FROM users WHERE email = $1',
      [email]
    );

    if (existingEmail.length > 0) {
      return res.status(409).json({ 
        error: 'Email já cadastrado',
        field: 'email',
        user_id: existingEmail[0].id,
      });
    }

    // Verificar se wallet já está cadastrada
    const existingWallet = await query(
      `SELECT w.id, w.user_id, u.email 
       FROM user_wallets w 
       JOIN users u ON w.user_id = u.id 
       WHERE w.wallet_address = $1`,
      [walletAddress.toLowerCase()]
    );

    if (existingWallet.length > 0) {
      return res.status(409).json({ 
        error: 'Wallet já vinculada a outro usuário',
        field: 'wallet_address',
        user_id: existingWallet[0].user_id,
        user_email: existingWallet[0].email,
      });
    }

    // ================================================
    // 3. CRIAR USUÁRIO (TRANSAÇÃO)
    // ================================================

    // Iniciar transação (simplified - Neon não suporta BEGIN/COMMIT na API)
    let userId;
    let walletId;

    try {
      // 3.1. Criar usuário
      const newUser = await query(
        `INSERT INTO users (email, username, full_name, is_verified) 
         VALUES ($1, $2, $3, false) 
         RETURNING id, email, username, full_name, created_at`,
        [email, username, fullName]
      );

      if (newUser.length === 0) {
        throw new Error('Falha ao criar usuário');
      }

      userId = newUser[0].id;

      // 3.2. Vincular wallet como primária
      const newWallet = await query(
        `INSERT INTO user_wallets (user_id, wallet_address, provider, chain_id, is_primary, is_verified) 
         VALUES ($1, $2, $3, $4, true, false) 
         RETURNING id, wallet_address, provider, is_primary, created_at`,
        [userId, walletAddress.toLowerCase(), provider.toLowerCase(), chainId]
      );

      if (newWallet.length === 0) {
        // Rollback manual: deletar usuário
        await query('DELETE FROM users WHERE id = $1', [userId]);
        throw new Error('Falha ao vincular wallet');
      }

      walletId = newWallet[0].id;

      // ================================================
      // 4. REGISTRAR SESSÃO (opcional)
      // ================================================
      const ipRaw = req.headers['x-forwarded-for']?.split(',')[0]?.trim() 
                    || req.socket?.remoteAddress 
                    || null;
      const userAgent = sanitizeText(req.headers['user-agent'], 256) || null;

      if (ipRaw) {
        await query(
          `INSERT INTO user_sessions (user_id, wallet_address, ip_address, user_agent, expires_at) 
           VALUES ($1, $2, $3, $4, NOW() + INTERVAL '30 days')`,
          [userId, walletAddress.toLowerCase(), sanitizeText(ipRaw, 64), userAgent]
        );
      }

      // ================================================
      // 5. RESPOSTA DE SUCESSO
      // ================================================
      
      res.status(201).json({
        success: true,
        message: 'Usuário registrado com sucesso',
        user: {
          id: newUser[0].id,
          email: newUser[0].email,
          username: newUser[0].username,
          full_name: newUser[0].full_name,
          created_at: newUser[0].created_at,
          wallet: {
            id: newWallet[0].id,
            address: newWallet[0].wallet_address,
            provider: newWallet[0].provider,
            is_primary: newWallet[0].is_primary,
            created_at: newWallet[0].created_at,
          },
        },
      });

    } catch (dbError) {
      // Erro no banco de dados
      console.error('❌ Erro ao criar usuário:', dbError);
      
      // Tentar rollback se userId foi criado
      if (userId) {
        try {
          await query('DELETE FROM users WHERE id = $1', [userId]);
        } catch (rollbackError) {
          console.error('❌ Erro no rollback:', rollbackError);
        }
      }

      return res.status(500).json({ 
        error: 'Erro ao criar usuário no banco de dados',
        details: process.env.NODE_ENV === 'development' ? dbError.message : undefined,
      });
    }

  } catch (error) {
    console.error('❌ Erro na API /register:', error);
    
    return res.status(500).json({ 
      error: 'Erro interno do servidor',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
    });
  }
}
