/**
 * Database CLI.
 *   npm run db:setup                     create/upgrade tables (idempotent)
 *   npm run db:seed                      replace the catalog with seed/catalog.json (keeps orders)
 *   npm run db:add-new                   add the catalog's new categories (with their products), change nothing else
 *   npm run db:reset                     catalog + wipe orders + sample orders (demo / fresh start)
 *   npm run admin:create -- <email> <password>   create the admin or reset its password
 *
 * Uses DATABASE_URL (Neon) if set, otherwise the local PGlite database in ./.data/pglite.
 * Stop `npm run dev` first when using PGlite (one process at a time).
 */
import { readFile } from "node:fs/promises";
import path from "node:path";
import { getDb } from "../src/server/db-core";
import { hashPassword } from "../src/server/passwords";
import { addMissingFromCatalog, readCatalog, seedCatalog, seedSampleOrders } from "../src/server/seed";

async function loadEnv() {
  // Minimal .env.local loader so the CLI sees the same DATABASE_URL as Next.js.
  for (const file of [".env.local", ".env"]) {
    try {
      const text = await readFile(path.join(process.cwd(), file), "utf8");
      for (const line of text.split(/\r?\n/)) {
        const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
        if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
      }
    } catch {
      /* no file */
    }
  }
}

async function main() {
  await loadEnv();
  const [command, ...args] = process.argv.slice(2);
  const db = await getDb();
  const where = process.env.DATABASE_URL ? "Neon (DATABASE_URL)" : "local PGlite (.data/pglite)";

  switch (command) {
    case "setup": {
      await db.exec(await readFile(path.join(process.cwd(), "db", "schema.sql"), "utf8"));
      console.log(`✓ schema ready in ${where}`);
      break;
    }
    case "seed": {
      const catalog = await readCatalog();
      await seedCatalog(db, catalog);
      console.log(`✓ seeded ${catalog.categories.length} categories, ${catalog.products.length} products into ${where}`);
      break;
    }
    case "add-new": {
      const added = await addMissingFromCatalog(db, await readCatalog());
      console.log(`✓ added to ${where}: ${added.categories.length} categories, ${added.products.length} products`);
      for (const name of [...added.categories, ...added.products]) console.log(`  + ${name}`);
      break;
    }
    case "reset": {
      const catalog = await readCatalog();
      await seedCatalog(db, catalog, { wipeOrders: true });
      await seedSampleOrders(db, catalog.sampleOrders ?? []);
      console.log(`✓ reset ${where}: catalog + ${catalog.sampleOrders?.length ?? 0} sample orders`);
      break;
    }
    case "admin": {
      const [email, password] = args;
      if (!email || !password || password.length < 8) {
        console.error("usage: npm run admin:create -- <email> <password (8+ chars)>");
        process.exit(1);
      }
      await db.query(
        `insert into admin_users (email, password_hash) values ($1, $2)
         on conflict (email) do update set password_hash = excluded.password_hash`,
        [email.trim().toLowerCase(), await hashPassword(password)],
      );
      console.log(`✓ admin ${email} ready`);
      break;
    }
    default:
      console.error("commands: setup | seed | add-new | reset | admin <email> <password>");
      process.exit(1);
  }
  await db.close();
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
