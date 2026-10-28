import { IS_DEMO } from "@/lib/demo";
import { getDb } from "@/server/db";
import { readCatalog, seedCatalog, seedSampleOrders } from "@/server/seed";

/**
 * Nightly reset for the public showcase deployment (vercel.json schedules it).
 * Does nothing unless NEXT_PUBLIC_DEMO_MODE=true, so the real store is never touched.
 * Vercel Cron sends `Authorization: Bearer <CRON_SECRET>`.
 */
export async function GET(request: Request) {
  if (!IS_DEMO) return new Response("Not found", { status: 404 });
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return new Response("Unauthorized", { status: 401 });
  }
  const db = await getDb();
  const catalog = await readCatalog();
  await seedCatalog(db, catalog, { wipeOrders: true });
  await seedSampleOrders(db, catalog.sampleOrders ?? []);
  await db.query("update business_settings set accepting_orders = true where id = 1");
  return Response.json({ ok: true, products: catalog.products.length });
}
