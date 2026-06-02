import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { getPool } from "@/lib/db";

// Arbitrary constant so concurrent instances/replicas serialize migrations.
const MIGRATION_LOCK_KEY = 873421;

// Applies every `db/*.sql` migration (in filename order) except seed files.
// All migrations are idempotent (CREATE/ALTER ... IF NOT EXISTS), so this is
// safe to run on every startup.
export async function runMigrations(): Promise<void> {
  if (!process.env.DATABASE_URL) {
    console.warn("[migrate] DATABASE_URL is not set — skipping migrations");
    return;
  }

  const dir = path.join(process.cwd(), "db");
  let files: string[];
  try {
    const all = await readdir(dir);
    files = all
      .filter((f) => f.endsWith(".sql") && !/seed/i.test(f))
      .sort();
  } catch (err) {
    console.error(`[migrate] could not read migrations dir at ${dir}:`, err);
    return;
  }

  if (files.length === 0) {
    console.warn(`[migrate] no migration files found in ${dir}`);
    return;
  }

  const client = await getPool().connect();
  try {
    await client.query("SELECT pg_advisory_lock($1)", [MIGRATION_LOCK_KEY]);
    for (const file of files) {
      const sql = await readFile(path.join(dir, file), "utf8");
      await client.query(sql);
      console.log(`[migrate] applied ${file}`);
    }
    console.log(`[migrate] up to date (${files.length} file(s))`);
  } catch (err) {
    console.error("[migrate] FAILED:", err);
    throw err;
  } finally {
    try {
      await client.query("SELECT pg_advisory_unlock($1)", [MIGRATION_LOCK_KEY]);
    } catch {
      /* lock auto-releases when the connection closes */
    }
    client.release();
  }
}
