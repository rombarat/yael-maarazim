import { timingSafeEqual } from "node:crypto";
import { getDb } from "@/server/db";
import { addMissingFromCatalog, readCatalog } from "@/server/seed";

/**
 * Adds the categories from seed/catalog.json that the live database doesn't have yet, with their products
 * (`npm run db:add-new` for hosts where the database URL can't be copied to a laptop).
 * Existing categories, products, prices and orders are never changed. Safe to call twice.
 *
 * POST with `Authorization: Bearer <SETUP_TOKEN>`. 404 unless SETUP_TOKEN is set; remove it afterwards.
 */
export const maxDuration = 60;

function tokenMatches(header: string | null, token: string) {
  const given = Buffer.from(header ?? "");
  const expected = Buffer.from(`Bearer ${token}`);
  return given.length === expected.length && timingSafeEqual(given, expected);
}

export async function POST(request: Request) {
  const token = process.env.SETUP_TOKEN;
  if (!token) return new Response("Not found", { status: 404 });
  if (!tokenMatches(request.headers.get("authorization"), token)) return new Response("Unauthorized", { status: 401 });

  const added = await addMissingFromCatalog(await getDb(), await readCatalog());
  return Response.json({ ok: true, ...added });
}
