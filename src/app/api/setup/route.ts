import { readFile } from "node:fs/promises";
import path from "node:path";
import { timingSafeEqual } from "node:crypto";
import { z } from "zod";
import { getDb } from "@/server/db";
import { hashPassword } from "@/server/passwords";
import { readCatalog, seedCatalog } from "@/server/seed";

/**
 * One-time setup of a fresh production database: tables, catalog and the first admin.
 * For hosts where the database URL can't be copied to a laptop (Vercel keeps it write-only).
 *
 * POST with `Authorization: Bearer <SETUP_TOKEN>` and JSON { adminEmail, adminPassword }.
 * - 404 unless the SETUP_TOKEN variable is set; remove it once setup is done.
 * - Refuses once any admin exists, so it can never overwrite the owner's account.
 * - Loads seed/catalog.json only into an empty database, so the owner's edits are never replaced.
 */
export const maxDuration = 300;

const input = z.object({
  adminEmail: z.string().trim().toLowerCase().email(),
  adminPassword: z.string().min(8).max(200),
});

function tokenMatches(header: string | null, token: string) {
  const given = Buffer.from(header ?? "");
  const expected = Buffer.from(`Bearer ${token}`);
  return given.length === expected.length && timingSafeEqual(given, expected);
}

export async function POST(request: Request) {
  const token = process.env.SETUP_TOKEN;
  if (!token) return new Response("Not found", { status: 404 });
  if (!tokenMatches(request.headers.get("authorization"), token)) return new Response("Unauthorized", { status: 401 });

  const parsed = input.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ ok: false, error: "adminEmail and adminPassword (8+ chars) required" }, { status: 400 });

  const db = await getDb();
  await db.exec(await readFile(path.join(process.cwd(), "db", "schema.sql"), "utf8"));

  const [{ n: admins }] = await db.query<{ n: number }>("select count(*)::int as n from admin_users");
  if (admins > 0) return Response.json({ ok: false, error: "Already set up" }, { status: 409 });

  const [{ n: products }] = await db.query<{ n: number }>("select count(*)::int as n from products");
  let seeded = 0;
  if (products === 0) {
    const catalog = await readCatalog();
    await seedCatalog(db, catalog, { wipeOrders: true });
    seeded = catalog.products.length;
  }

  await db.query("insert into admin_users (email, password_hash) values ($1, $2)", [
    parsed.data.adminEmail,
    await hashPassword(parsed.data.adminPassword),
  ]);

  return Response.json({ ok: true, seededProducts: seeded });
}
