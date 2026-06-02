import { Pool, type QueryResultRow } from "pg";

// Reuse a single pool across hot-reloads in dev and across the lifetime of the
// standalone server in production. The pool is created lazily on first use so
// that `next build` (which imports route modules) does not require DATABASE_URL.
declare global {
  var __weddingPgPool: Pool | undefined;
}

export function getPool(): Pool {
  if (!global.__weddingPgPool) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error("DATABASE_URL environment variable is not set");
    }
    global.__weddingPgPool = new Pool({ connectionString });
  }
  return global.__weddingPgPool;
}

export async function query<T extends QueryResultRow>(
  text: string,
  params?: unknown[]
) {
  return getPool().query<T>(text, params);
}
