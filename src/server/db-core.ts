/**
 * Database access shared by the app (src/server/db.ts) and the CLI scripts (scripts/db.ts).
 *
 * - DATABASE_URL set   → Neon serverless driver over HTTP (production, Vercel).
 * - DATABASE_URL unset → PGlite, an in-process Postgres stored in ./.data/pglite (local dev, zero setup).
 *   PGlite allows one process at a time: stop `npm run dev` before running `npm run db:*` scripts.
 *
 * Queries are plain SQL with $1, $2 params. Cast numerics to float8 and dates/times to text in
 * SQL so both drivers return the same JS types.
 */
import type { PGlite } from "@electric-sql/pglite";

export type Row = Record<string, unknown>;

export interface Db {
  query<T = Row>(text: string, params?: unknown[]): Promise<T[]>;
  /** Runs a multi-statement script (schema setup). No params. */
  exec(script: string): Promise<void>;
  /** Flushes and closes (PGlite: avoids sequence gaps after an unclean exit). */
  close(): Promise<void>;
}

const g = globalThis as unknown as { __storeDb?: Promise<Db> };

async function createNeon(url: string): Promise<Db> {
  const { neon, Pool } = await import("@neondatabase/serverless");
  const sql = neon(url);
  return {
    query: async <T>(text: string, params: unknown[] = []) => (await sql.query(text, params)) as T[],
    // Multi-statement scripts need the WebSocket pool (the HTTP driver runs one statement per call).
    exec: async (script: string) => {
      const pool = new Pool({ connectionString: url });
      try {
        await pool.query(script);
      } finally {
        await pool.end();
      }
    },
    close: async () => {},
  };
}

async function createPglite(): Promise<Db> {
  const { PGlite } = await import("@electric-sql/pglite");
  const { mkdirSync } = await import("node:fs");
  const dir = process.env.PGLITE_DIR ?? "./.data/pglite";
  mkdirSync(dir, { recursive: true });
  const db: PGlite = new PGlite(dir);
  await db.waitReady;
  return {
    query: async <T>(text: string, params: unknown[] = []) => (await db.query<T>(text, params)).rows,
    exec: async (script: string) => {
      await db.exec(script);
    },
    close: () => db.close(),
  };
}

export function getDb(): Promise<Db> {
  g.__storeDb ??= process.env.DATABASE_URL ? createNeon(process.env.DATABASE_URL) : createPglite();
  return g.__storeDb;
}

export async function query<T = Row>(text: string, params?: unknown[]): Promise<T[]> {
  return (await getDb()).query<T>(text, params);
}

export async function queryOne<T = Row>(text: string, params?: unknown[]): Promise<T | null> {
  return (await query<T>(text, params))[0] ?? null;
}

/** Select-list fragments that normalise types across drivers. */
export const iso = (col: string) => `to_char(${col} at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')`;
