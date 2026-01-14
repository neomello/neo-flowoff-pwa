-- Migration 001: schema inicial para Neon Postgres
-- Tabelas: users, leads, wallet_sessions, tx_logs, audit_logs

BEGIN;

CREATE TABLE IF NOT EXISTS users (
  wallet_address TEXT PRIMARY KEY,
  email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

CREATE TABLE IF NOT EXISTS leads (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT,
  whats TEXT,
  type TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_leads_email ON leads(email);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at);

CREATE TABLE IF NOT EXISTS wallet_sessions (
  id BIGSERIAL PRIMARY KEY,
  wallet_address TEXT NOT NULL REFERENCES users(wallet_address) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  user_agent TEXT,
  ip TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_wallet_sessions_wallet ON wallet_sessions(wallet_address);
CREATE INDEX IF NOT EXISTS idx_wallet_sessions_created_at ON wallet_sessions(created_at);

CREATE TABLE IF NOT EXISTS tx_logs (
  id BIGSERIAL PRIMARY KEY,
  tx_hash TEXT NOT NULL,
  wallet_address TEXT REFERENCES users(wallet_address) ON DELETE SET NULL,
  status TEXT NOT NULL,
  chain_id INTEGER NOT NULL,
  value NUMERIC(78,0) DEFAULT 0,
  token_address TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (tx_hash)
);

CREATE INDEX IF NOT EXISTS idx_tx_logs_wallet ON tx_logs(wallet_address);
CREATE INDEX IF NOT EXISTS idx_tx_logs_created_at ON tx_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_tx_logs_status ON tx_logs(status);

CREATE TABLE IF NOT EXISTS audit_logs (
  id BIGSERIAL PRIMARY KEY,
  event TEXT NOT NULL,
  payload JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);

COMMIT;
