import { readdir, readFile } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { neon } from '@neondatabase/serverless';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const MIGRATIONS_DIR = path.join(__dirname, '..', 'migrations');

const connectionString =
  process.env.DATABASE_URL ||
  process.env.POSTGRES_URL ||
  process.env.DATABASE_URL_UNPOOLED ||
  process.env.POSTGRES_URL_NON_POOLING;

if (!connectionString) {
  console.error('❌ DATABASE_URL não configurado');
  process.exit(1);
}

const sql = neon(connectionString);

async function ensureMigrationsTable() {
  await sql`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
}

async function getApplied() {
  const rows = await sql`SELECT name FROM schema_migrations`;
  return new Set(rows.map((r) => r.name));
}

async function applyMigration(name, content) {
  console.log(`➡️  Aplicando ${name}...`);
  await sql.unsafe(content);
  await sql`INSERT INTO schema_migrations (name) VALUES (${name}) ON CONFLICT (name) DO NOTHING`;
  console.log(`✅ ${name}`);
}

async function main() {
  console.log('🚀 Iniciando migrações');
  await ensureMigrationsTable();
  const applied = await getApplied();

  const files = (await readdir(MIGRATIONS_DIR))
    .filter((f) => f.endsWith('.sql'))
    .sort();

  for (const file of files) {
    if (applied.has(file)) {
      console.log(`↪️  Pulando ${file} (já aplicada)`);
      continue;
    }
    const fullPath = path.join(MIGRATIONS_DIR, file);
    const content = await readFile(fullPath, 'utf8');
    await applyMigration(file, content);
  }

  console.log('🏁 Migrações concluídas');
}

main().catch((err) => {
  console.error('❌ Erro nas migrações:', err);
  process.exit(1);
});
