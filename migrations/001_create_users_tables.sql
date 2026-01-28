-- ================================================
-- MIGRAÇÃO 001: Tabelas de Usuários e Wallets
-- NEØ FlowOFF - Sistema de Registro de Usuário
-- ================================================
-- Data: 2026-01-28
-- Autor: NEØ FlowOFF Dev Team
-- ================================================

-- ================================================
-- 1. TABELA: users
-- Armazena informações básicas dos usuários
-- ================================================

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  username TEXT,
  full_name TEXT,
  avatar_url TEXT,
  
  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  last_login_at TIMESTAMP,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  is_verified BOOLEAN DEFAULT false,
  
  -- Preferências
  preferences JSONB DEFAULT '{}',
  
  -- Constraints
  CONSTRAINT email_valid CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active) WHERE is_active = true;

-- ================================================
-- 2. TABELA: user_wallets
-- Vincula wallets a usuários (1 usuário pode ter N wallets)
-- ================================================

CREATE TABLE IF NOT EXISTS user_wallets (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Informações da wallet
  wallet_address TEXT NOT NULL,
  provider TEXT NOT NULL, -- 'metamask', 'web3auth', 'walletconnect', etc
  chain_id INTEGER DEFAULT 8453, -- BASE Mainnet
  
  -- Status
  is_primary BOOLEAN DEFAULT false,
  is_verified BOOLEAN DEFAULT false,
  
  -- Metadata
  label TEXT, -- Nome amigável da wallet (ex: "Minha Wallet Principal")
  created_at TIMESTAMP DEFAULT NOW(),
  last_used_at TIMESTAMP,
  
  -- Constraints
  UNIQUE(user_id, wallet_address),
  CONSTRAINT wallet_address_valid CHECK (wallet_address ~* '^0x[a-fA-F0-9]{40}$')
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_user_wallets_user_id ON user_wallets(user_id);
CREATE INDEX IF NOT EXISTS idx_user_wallets_address ON user_wallets(wallet_address);
CREATE INDEX IF NOT EXISTS idx_user_wallets_primary ON user_wallets(user_id, is_primary) WHERE is_primary = true;

-- Garantir apenas 1 wallet primária por usuário
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_wallets_one_primary 
  ON user_wallets(user_id) 
  WHERE is_primary = true;

-- ================================================
-- 3. TABELA: user_sessions (opcional - para tracking)
-- Registra sessões de login dos usuários
-- ================================================

CREATE TABLE IF NOT EXISTS user_sessions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  wallet_address TEXT,
  
  -- Informações da sessão
  session_token TEXT UNIQUE,
  ip_address TEXT,
  user_agent TEXT,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP,
  last_activity_at TIMESTAMP DEFAULT NOW(),
  
  -- Status
  is_active BOOLEAN DEFAULT true
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_user_sessions_active ON user_sessions(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires ON user_sessions(expires_at);

-- ================================================
-- 4. FUNÇÃO: Atualizar updated_at automaticamente
-- ================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Aplicar trigger na tabela users
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ================================================
-- 5. FUNÇÃO: Garantir apenas 1 wallet primária
-- ================================================

CREATE OR REPLACE FUNCTION ensure_one_primary_wallet()
RETURNS TRIGGER AS $$
BEGIN
  -- Se marcando wallet como primária, desmarcar outras
  IF NEW.is_primary = true THEN
    UPDATE user_wallets 
    SET is_primary = false 
    WHERE user_id = NEW.user_id 
      AND id != NEW.id 
      AND is_primary = true;
  END IF;
  
  -- Se desmarcando última primária, marcar outra
  IF TG_OP = 'UPDATE' AND OLD.is_primary = true AND NEW.is_primary = false THEN
    -- Buscar se usuário tem outras wallets
    IF NOT EXISTS (SELECT 1 FROM user_wallets WHERE user_id = NEW.user_id AND is_primary = true) THEN
      -- Marcar a wallet mais antiga como primária
      UPDATE user_wallets 
      SET is_primary = true 
      WHERE id = (
        SELECT id FROM user_wallets 
        WHERE user_id = NEW.user_id 
          AND id != NEW.id
        ORDER BY created_at ASC
        LIMIT 1
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Aplicar trigger
DROP TRIGGER IF EXISTS ensure_one_primary_wallet_trigger ON user_wallets;
CREATE TRIGGER ensure_one_primary_wallet_trigger
  BEFORE INSERT OR UPDATE ON user_wallets
  FOR EACH ROW
  EXECUTE FUNCTION ensure_one_primary_wallet();

-- ================================================
-- 6. DADOS DE EXEMPLO (OPCIONAL - apenas dev)
-- ================================================

-- Descomentar para criar usuário de teste
-- INSERT INTO users (email, username, full_name, is_verified) VALUES
--   ('netto@neoflowoff.eth', 'nettomello', 'Netto Mello', true),
--   ('test@neoflowoff.eth', 'testuser', 'Test User', false);

-- INSERT INTO user_wallets (user_id, wallet_address, provider, is_primary, is_verified) VALUES
--   (1, '0x470a8c640ffc2c16aeb6be803a948420e2ae8456', 'metamask', true, true),
--   (2, '0x742d35Cc6634C0532925a3b844Bc454e4438f44e', 'web3auth', true, false);

-- ================================================
-- 7. VIEWS ÚTEIS
-- ================================================

-- View: Usuários com suas wallets
CREATE OR REPLACE VIEW v_users_with_wallets AS
SELECT 
  u.id,
  u.email,
  u.username,
  u.full_name,
  u.is_active,
  u.is_verified,
  u.created_at,
  u.last_login_at,
  COALESCE(
    json_agg(
      json_build_object(
        'wallet_address', w.wallet_address,
        'provider', w.provider,
        'is_primary', w.is_primary,
        'label', w.label
      ) ORDER BY w.is_primary DESC, w.created_at ASC
    ) FILTER (WHERE w.id IS NOT NULL),
    '[]'::json
  ) as wallets
FROM users u
LEFT JOIN user_wallets w ON u.id = w.user_id
GROUP BY u.id;

-- ================================================
-- 8. GRANTS (ajustar conforme necessário)
-- ================================================

-- GRANT SELECT, INSERT, UPDATE ON users TO your_api_user;
-- GRANT SELECT, INSERT, UPDATE ON user_wallets TO your_api_user;
-- GRANT USAGE ON SEQUENCE users_id_seq TO your_api_user;
-- GRANT USAGE ON SEQUENCE user_wallets_id_seq TO your_api_user;

-- ================================================
-- FIM DA MIGRAÇÃO 001
-- ================================================

-- Para rollback (reverter):
-- DROP VIEW IF EXISTS v_users_with_wallets;
-- DROP TRIGGER IF EXISTS ensure_one_primary_wallet_trigger ON user_wallets;
-- DROP TRIGGER IF EXISTS update_users_updated_at ON users;
-- DROP FUNCTION IF EXISTS ensure_one_primary_wallet();
-- DROP FUNCTION IF EXISTS update_updated_at_column();
-- DROP TABLE IF EXISTS user_sessions CASCADE;
-- DROP TABLE IF EXISTS user_wallets CASCADE;
-- DROP TABLE IF EXISTS users CASCADE;
