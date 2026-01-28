-- ================================================
-- MIGRAÇÃO 002: Sistema de Pontos e Referral
-- NEØ FlowOFF - Gamificação e Airdrop
-- ================================================
-- Data: 2026-01-28
-- Autor: NEØ FlowOFF Dev Team
-- ================================================

-- ================================================
-- 1. TABELA: user_points
-- Rastreia todas as ações que geram pontos
-- ================================================

CREATE TABLE IF NOT EXISTS user_points (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  wallet_address TEXT NOT NULL,
  
  -- Tipo de ação
  action_type TEXT NOT NULL, -- 'signup', 'wallet_connect', 'share_social', 'referral', 'tutorial_complete', 'first_purchase'
  points INTEGER NOT NULL,
  
  -- Metadata adicional (JSON flexível)
  metadata JSONB DEFAULT '{}',
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  
  -- Constraints
  CHECK (points >= 0)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_user_points_user_id ON user_points(user_id);
CREATE INDEX IF NOT EXISTS idx_user_points_wallet ON user_points(wallet_address);
CREATE INDEX IF NOT EXISTS idx_user_points_action ON user_points(action_type);
CREATE INDEX IF NOT EXISTS idx_user_points_created ON user_points(created_at DESC);

-- ================================================
-- 2. TABELA: user_totals
-- Cache de totais por usuário (performance)
-- ================================================

CREATE TABLE IF NOT EXISTS user_totals (
  id SERIAL PRIMARY KEY,
  user_id INTEGER UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  wallet_address TEXT UNIQUE NOT NULL,
  
  -- Totais
  total_points INTEGER DEFAULT 0,
  total_tokens_claimed DECIMAL(18,8) DEFAULT 0,
  
  -- Rankings
  rank_position INTEGER,
  tier TEXT, -- 'diamond', 'platinum', 'gold', 'silver', 'bronze'
  
  -- Timestamps
  updated_at TIMESTAMP DEFAULT NOW(),
  
  -- Constraints
  CHECK (total_points >= 0),
  CHECK (total_tokens_claimed >= 0)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_user_totals_user_id ON user_totals(user_id);
CREATE INDEX IF NOT EXISTS idx_user_totals_wallet ON user_totals(wallet_address);
CREATE INDEX IF NOT EXISTS idx_user_totals_points ON user_totals(total_points DESC);
CREATE INDEX IF NOT EXISTS idx_user_totals_rank ON user_totals(rank_position);

-- ================================================
-- 3. TABELA: referrals
-- Sistema de referral (convites)
-- ================================================

CREATE TABLE IF NOT EXISTS referrals (
  id SERIAL PRIMARY KEY,
  referrer_user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  referrer_wallet TEXT NOT NULL,
  
  -- Informações do referido
  referee_wallet TEXT NOT NULL,
  referee_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  
  -- Código de referral (único por referrer)
  referral_code TEXT NOT NULL,
  
  -- Pontos concedidos
  points_awarded INTEGER DEFAULT 0,
  bonus_awarded BOOLEAN DEFAULT false,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP, -- Quando o referido completou alguma ação
  
  -- Constraints
  UNIQUE(referrer_user_id, referee_wallet),
  CHECK (points_awarded >= 0)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON referrals(referrer_user_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referee ON referrals(referee_wallet);
CREATE INDEX IF NOT EXISTS idx_referrals_code ON referrals(referral_code);
CREATE INDEX IF NOT EXISTS idx_referrals_active ON referrals(is_active) WHERE is_active = true;

-- ================================================
-- 4. TABELA: token_claims
-- Histórico de resgates de tokens
-- ================================================

CREATE TABLE IF NOT EXISTS token_claims (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  wallet_address TEXT NOT NULL,
  
  -- Detalhes do claim
  points_used INTEGER NOT NULL,
  tokens_received DECIMAL(18,8) NOT NULL,
  
  -- Transação on-chain
  tx_hash TEXT,
  tx_status TEXT DEFAULT 'pending', -- 'pending', 'confirmed', 'failed'
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  confirmed_at TIMESTAMP,
  
  -- Constraints
  CHECK (points_used > 0),
  CHECK (tokens_received > 0)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_token_claims_user_id ON token_claims(user_id);
CREATE INDEX IF NOT EXISTS idx_token_claims_wallet ON token_claims(wallet_address);
CREATE INDEX IF NOT EXISTS idx_token_claims_tx_hash ON token_claims(tx_hash);
CREATE INDEX IF NOT EXISTS idx_token_claims_status ON token_claims(tx_status);
CREATE INDEX IF NOT EXISTS idx_token_claims_created ON token_claims(created_at DESC);

-- ================================================
-- 5. TABELA: leaderboard_snapshots
-- Snapshots do ranking para histórico
-- ================================================

CREATE TABLE IF NOT EXISTS leaderboard_snapshots (
  id SERIAL PRIMARY KEY,
  snapshot_date DATE NOT NULL UNIQUE,
  
  -- Top users (JSON array)
  top_users JSONB NOT NULL,
  
  -- Estatísticas gerais
  total_participants INTEGER DEFAULT 0,
  total_points_distributed INTEGER DEFAULT 0,
  
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_leaderboard_date ON leaderboard_snapshots(snapshot_date DESC);

-- ================================================
-- 6. FUNÇÃO: Atualizar totais do usuário
-- ================================================

CREATE OR REPLACE FUNCTION update_user_totals()
RETURNS TRIGGER AS $$
DECLARE
  current_total INTEGER;
BEGIN
  -- Calcular total de pontos
  SELECT COALESCE(SUM(points), 0) INTO current_total
  FROM user_points
  WHERE wallet_address = NEW.wallet_address;
  
  -- Atualizar ou inserir em user_totals
  INSERT INTO user_totals (user_id, wallet_address, total_points, updated_at)
  VALUES (NEW.user_id, NEW.wallet_address, current_total, NOW())
  ON CONFLICT (wallet_address) 
  DO UPDATE SET 
    total_points = current_total,
    updated_at = NOW();
  
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Aplicar trigger
DROP TRIGGER IF EXISTS update_user_totals_trigger ON user_points;
CREATE TRIGGER update_user_totals_trigger
  AFTER INSERT ON user_points
  FOR EACH ROW
  EXECUTE FUNCTION update_user_totals();

-- ================================================
-- 7. FUNÇÃO: Atribuir tier automaticamente
-- ================================================

CREATE OR REPLACE FUNCTION assign_user_tier()
RETURNS TRIGGER AS $$
BEGIN
  -- Atribuir tier baseado em pontos
  NEW.tier = CASE
    WHEN NEW.total_points >= 1000 THEN 'diamond'
    WHEN NEW.total_points >= 500 THEN 'platinum'
    WHEN NEW.total_points >= 250 THEN 'gold'
    WHEN NEW.total_points >= 100 THEN 'silver'
    ELSE 'bronze'
  END;
  
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Aplicar trigger
DROP TRIGGER IF EXISTS assign_user_tier_trigger ON user_totals;
CREATE TRIGGER assign_user_tier_trigger
  BEFORE INSERT OR UPDATE ON user_totals
  FOR EACH ROW
  EXECUTE FUNCTION assign_user_tier();

-- ================================================
-- 8. FUNÇÃO: Atualizar rankings (batch)
-- ================================================

CREATE OR REPLACE FUNCTION update_rankings()
RETURNS void AS $$
BEGIN
  WITH ranked_users AS (
    SELECT 
      id,
      ROW_NUMBER() OVER (ORDER BY total_points DESC, updated_at ASC) as new_rank
    FROM user_totals
    WHERE total_points > 0
  )
  UPDATE user_totals ut
  SET rank_position = ru.new_rank
  FROM ranked_users ru
  WHERE ut.id = ru.id;
END;
$$ language 'plpgsql';

-- ================================================
-- 9. VIEW: Leaderboard ativa
-- ================================================

CREATE OR REPLACE VIEW v_leaderboard AS
SELECT 
  ut.rank_position,
  ut.wallet_address,
  u.username,
  u.email,
  ut.total_points,
  ut.total_tokens_claimed,
  ut.tier,
  ut.updated_at
FROM user_totals ut
LEFT JOIN users u ON ut.user_id = u.id
WHERE ut.total_points > 0
ORDER BY ut.rank_position ASC
LIMIT 100;

-- ================================================
-- 10. VIEW: Estatísticas de referral
-- ================================================

CREATE OR REPLACE VIEW v_referral_stats AS
SELECT 
  r.referrer_user_id,
  r.referrer_wallet,
  u.username,
  u.email,
  COUNT(r.id) as total_referrals,
  COUNT(r.id) FILTER (WHERE r.completed_at IS NOT NULL) as completed_referrals,
  SUM(r.points_awarded) as total_points_earned,
  MAX(r.created_at) as last_referral_at
FROM referrals r
LEFT JOIN users u ON r.referrer_user_id = u.id
GROUP BY r.referrer_user_id, r.referrer_wallet, u.username, u.email
ORDER BY total_referrals DESC;

-- ================================================
-- 11. CONFIGURAÇÃO: Tabela de pontos por ação
-- ================================================

CREATE TABLE IF NOT EXISTS points_config (
  id SERIAL PRIMARY KEY,
  action_type TEXT UNIQUE NOT NULL,
  points INTEGER NOT NULL,
  max_per_user INTEGER, -- NULL = ilimitado
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  
  CHECK (points >= 0)
);

-- Valores padrão
INSERT INTO points_config (action_type, points, max_per_user, description) VALUES
  ('signup', 10, 1, 'Cadastro no site'),
  ('wallet_connect', 20, 1, 'Conectar wallet pela primeira vez'),
  ('share_twitter', 15, 5, 'Compartilhar no Twitter (máx 5x)'),
  ('share_facebook', 15, 5, 'Compartilhar no Facebook (máx 5x)'),
  ('referral', 50, NULL, 'Convidar amigo que conecta wallet'),
  ('tutorial_complete', 30, 1, 'Completar tutorial'),
  ('first_purchase', 100, 1, 'Primeira compra de tokens'),
  ('daily_login', 5, 1, 'Login diário (streaks)'),
  ('profile_complete', 25, 1, 'Completar perfil 100%')
ON CONFLICT (action_type) DO NOTHING;

-- ================================================
-- 12. TABELA: Whitelist para airdrop
-- ================================================

CREATE TABLE IF NOT EXISTS airdrop_whitelist (
  id SERIAL PRIMARY KEY,
  wallet_address TEXT UNIQUE NOT NULL,
  email TEXT,
  
  -- Tier do airdrop
  tier INTEGER DEFAULT 3, -- 1 = Tier 1 (top), 2 = Tier 2, 3 = Tier 3
  tokens_allocated DECIMAL(18,8) DEFAULT 0,
  tokens_claimed DECIMAL(18,8) DEFAULT 0,
  
  -- Status
  is_eligible BOOLEAN DEFAULT true,
  has_claimed BOOLEAN DEFAULT false,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  claimed_at TIMESTAMP,
  
  -- Metadata
  source TEXT, -- 'early_signup', 'referral', 'manual', etc
  
  -- Constraints
  CHECK (tokens_allocated >= 0),
  CHECK (tokens_claimed >= 0),
  CHECK (tokens_claimed <= tokens_allocated),
  CONSTRAINT wallet_address_valid CHECK (wallet_address ~* '^0x[a-fA-F0-9]{40}$')
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_airdrop_wallet ON airdrop_whitelist(wallet_address);
CREATE INDEX IF NOT EXISTS idx_airdrop_tier ON airdrop_whitelist(tier);
CREATE INDEX IF NOT EXISTS idx_airdrop_eligible ON airdrop_whitelist(is_eligible) WHERE is_eligible = true;
CREATE INDEX IF NOT EXISTS idx_airdrop_unclaimed ON airdrop_whitelist(has_claimed) WHERE has_claimed = false;

-- ================================================
-- FIM DA MIGRAÇÃO 002
-- ================================================

-- Para rollback (reverter):
-- DROP VIEW IF EXISTS v_referral_stats;
-- DROP VIEW IF EXISTS v_leaderboard;
-- DROP FUNCTION IF EXISTS update_rankings();
-- DROP FUNCTION IF EXISTS assign_user_tier();
-- DROP FUNCTION IF EXISTS update_user_totals();
-- DROP TABLE IF EXISTS airdrop_whitelist CASCADE;
-- DROP TABLE IF EXISTS points_config CASCADE;
-- DROP TABLE IF EXISTS leaderboard_snapshots CASCADE;
-- DROP TABLE IF EXISTS token_claims CASCADE;
-- DROP TABLE IF EXISTS referrals CASCADE;
-- DROP TABLE IF EXISTS user_totals CASCADE;
-- DROP TABLE IF EXISTS user_points CASCADE;
