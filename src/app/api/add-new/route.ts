import { timingSafeEqual } from "node:crypto";
import { getDb } from "@/server/db";
import { addMissingFromCatalog, readCatalog } from "@/server/seed";

/**
 * Adds the categories from seed/catalog.json that the live database doesn't have yet, with their products
 * (`npm run db:add-new` for hosts where the database URL can't be copied to a laptop).
 * Existing categories, products, prices and orders are never changed. Safe to call twice.
 *
 * POST with `Authorization: Bearer <SETUP_TOKEN>`. 404 unless SETUP_TOKEN is set; remove it afterwards.
 * Optional JSON body `{ "enableDelivery": true, "minLeadHours": 24 }` also sets those two settings
 * (the same fields as in the admin).
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

  const body = (await request.json().catch(() => null)) as { enableDelivery?: unknown; minLeadHours?: unknown } | null;
  const db = await getDb();
  const added = await addMissingFromCatalog(db, await readCatalog());
  if (body?.enableDelivery === true) await db.query("update business_settings set delivery_enabled = true where id = 1");
  const hours = body?.minLeadHours;
  if (typeof hours === "number" && Number.isInteger(hours) && hours >= 0 && hours <= 336) {
    await db.query("update business_settings set min_lead_hours = $1 where id = 1", [hours]);
  }
  const [s] = await db.query<{ delivery_enabled: boolean; min_lead_hours: number }>(
    "select delivery_enabled, min_lead_hours from business_settings where id = 1",
  );
  return Response.json({ ok: true, ...added, deliveryEnabled: s.delivery_enabled, minLeadHours: s.min_lead_hours });
}
