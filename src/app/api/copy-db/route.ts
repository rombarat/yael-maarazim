import { getDb } from "@/server/db";
import { copyDatabase } from "@/server/copy-db";
import type { Db } from "@/server/db-core";

/**
 * One-time move to a new database: set OLD_DATABASE_URL (the previous store's connection string) on the
 * project, redeploy, open this URL and reopen it until it says "done": true. Then delete OLD_DATABASE_URL.
 * 404 while OLD_DATABASE_URL is not set. Copies into DATABASE_URL; never deletes or overwrites rows.
 */
export const dynamic = "force-dynamic";
export const maxDuration = 60;

async function oldDb(url: string): Promise<Db> {
  const { neon } = await import("@neondatabase/serverless");
  const sql = neon(url);
  return {
    query: async <T>(text: string, params: unknown[] = []) => (await sql.query(text, params)) as T[],
    exec: async () => {
      throw new Error("read-only");
    },
    close: async () => {},
  };
}

export async function GET() {
  const oldUrl = process.env.OLD_DATABASE_URL;
  if (!oldUrl) return new Response("Not found", { status: 404 });
  if (oldUrl === process.env.DATABASE_URL) {
    return Response.json({ ok: false, error: "OLD_DATABASE_URL is the same database as DATABASE_URL" }, { status: 400 });
  }
  try {
    const result = await copyDatabase(await oldDb(oldUrl), await getDb());
    return Response.json({
      ok: true,
      ...result,
      next: result.done ? "Done. Delete OLD_DATABASE_URL in Vercel and redeploy." : "Photos still copying: reload this page.",
    });
  } catch (e) {
    return Response.json({ ok: false, error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
