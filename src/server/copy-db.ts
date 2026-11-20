/**
 * One-time move of the whole store to a new database (GET /api/copy-db while OLD_DATABASE_URL is set).
 *
 * Creates the tables in the new database, then copies every row from the old one: admin login,
 * categories, products, settings, closed days, orders and the uploaded photos. Never deletes anything
 * and never overwrites a row that is already there, so it is safe to open twice; a run that stops
 * halfway (photos are copied a few at a time) carries on from where it stopped.
 */
import { readFile } from "node:fs/promises";
import path from "node:path";
import type { Db } from "./db-core";

/** In foreign-key order. Photos (`images`) go last, in small batches. */
const TABLES = ["admin_users", "categories", "products", "blocked_dates", "orders", "order_items"] as const;
const IMAGE_BATCH = 4;

const count = async (db: Db, table: string) =>
  Number((await db.query<{ n: number }>(`select count(*)::int as n from ${table}`))[0].n);

/** Rows of `table` as one JSON array; bytea comes out as "\\x…" text, which Postgres reads back as bytea. */
async function rowsJson(db: Db, sql: string, params: unknown[] = []) {
  const [r] = await db.query<{ j: unknown }>(`select coalesce(json_agg(t), '[]'::json) as j from (${sql}) t`, params);
  return typeof r.j === "string" ? r.j : JSON.stringify(r.j);
}

async function insertJson(db: Db, table: string, json: string) {
  const rows = await db.query<{ n: number }>(
    `with ins as (insert into ${table} select * from json_populate_recordset(null::${table}, $1::json) on conflict do nothing returning 1)
     select count(*)::int as n from ins`,
    [json],
  );
  return Number(rows[0].n);
}

export type CopyResult = {
  done: boolean;
  copied: Record<string, number>;
  images: { copied: number; total: number };
  orderNumberNext?: number;
};

export async function copyDatabase(from: Db, to: Db, { budgetMs = 40_000, seedDir = process.cwd() } = {}): Promise<CopyResult> {
  const started = Date.now();
  await to.exec(await readFile(path.join(seedDir, "db", "schema.sql"), "utf8"));

  const copied: Record<string, number> = {};
  const firstRun = (await count(to, "categories")) === 0 && (await count(to, "orders")) === 0;

  for (const table of TABLES) {
    copied[table] = await insertJson(to, table, await rowsJson(from, `select * from ${table}`));
  }

  // The settings row exists from the start (schema default); take the old one on the first run only,
  // so a later run never undoes a change made in the new admin.
  if (firstRun) {
    const json = await rowsJson(from, "select * from business_settings where id = 1");
    if (json !== "[]") {
      await to.query("delete from business_settings where id = 1");
      copied.business_settings = await insertJson(to, "business_settings", json);
    }
  }

  // Order numbers carry on from the old store.
  const [seq] = await from.query<{ last_value: number; is_called: boolean }>("select last_value::int, is_called from order_number_seq");
  const [mx] = await to.query<{ m: number }>("select coalesce(max(order_number), 1000)::int as m from orders");
  const next = Math.max(seq.is_called ? Number(seq.last_value) + 1 : Number(seq.last_value), Number(mx.m) + 1);
  await to.query("select setval('order_number_seq', $1, false)", [next]);

  // Photos, a few per query (they are the bulk of the data).
  const have = new Set((await to.query<{ id: string }>("select id::text from images")).map((r) => r.id));
  const all = (await from.query<{ id: string }>("select id::text from images order by created_at, id")).map((r) => r.id);
  const missing = all.filter((id) => !have.has(id));
  let imageCount = 0;
  for (let i = 0; i < missing.length; i += IMAGE_BATCH) {
    if (Date.now() - started > budgetMs) break;
    const ids = missing.slice(i, i + IMAGE_BATCH);
    imageCount += await insertJson(to, "images", await rowsJson(from, "select * from images where id = any($1::uuid[])", [ids]));
  }
  const total = all.length;
  const nowHave = have.size + imageCount;

  return {
    done: nowHave >= total,
    copied: { ...copied, images: imageCount },
    images: { copied: nowHave, total },
    orderNumberNext: next,
  };
}
