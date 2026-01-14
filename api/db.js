import { neon } from '@neondatabase/serverless';

const connectionString =
  process.env.DATABASE_URL ||
  process.env.POSTGRES_URL ||
  process.env.DATABASE_URL_UNPOOLED ||
  process.env.POSTGRES_URL_NON_POOLING ||
  null;

if (!connectionString) {
  throw new Error('DATABASE_URL/POSTGRES_URL não configurado');
}

// Cliente SQL com suporte a parâmetros
const sql = neon(connectionString);

export async function query(text, params = []) {
  return sql.unsafe(text, params);
}

export async function ping() {
  const [row] = await sql`SELECT 1 AS ok`;
  return row?.ok === 1;
}

export { sql };
