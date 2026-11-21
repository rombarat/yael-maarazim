/**
 * Loads seed/catalog.json (+ seed/images/*) into the database.
 * Used by `npm run db:seed`, `npm run db:reset` and the demo reset cron route.
 * No "server-only" import: the CLI scripts use it too.
 */
import { readFile } from "node:fs/promises";
import path from "node:path";
import type { Db } from "./db-core";

type SeedVariant = { id: string; label: string; price: number };
type SeedProduct = {
  category: string;
  name: string;
  description?: string;
  price: number;
  unit_label?: string;
  image?: string;
  is_available?: boolean;
  is_featured?: boolean;
  tags?: string[];
  variants?: SeedVariant[];
};
type SeedOrder = {
  customer_name: string;
  phone: string;
  notes?: string;
  /** Delivery address; omit for pickup. */
  delivery_address?: string;
  /** Pickup N open days from today (negative = in the past). */
  day_offset: number;
  time: string;
  status: string;
  hours_ago: number;
  items: { product: string; qty: number; variant?: string }[];
};
/** A one-off alignment of a live store with a new printed catalog (see syncCatalog). */
type SyncPlan = {
  /** Category → product names in catalog order. Only these categories are touched. */
  order: Record<string, string[]>;
  moves?: { name: string; from: string; to: string }[];
  renames?: { category: string; from: string; to: string }[];
  remove?: { category: string; name: string }[];
};
export type Catalog = {
  settings?: Record<string, unknown>;
  categories: { name: string; image?: string }[];
  products: SeedProduct[];
  sampleOrders?: SeedOrder[];
  sync?: SyncPlan;
};

const SETTINGS_KEYS = [
  "phone", "email", "instagram_url", "facebook_url", "pickup_address", "pickup_notes",
  "min_lead_hours", "max_days_ahead", "slot_interval_minutes", "weekly_hours", "time_zone", "closed_message",
  "delivery_enabled", "delivery_notes",
];

const MIME: Record<string, string> = { ".webp": "image/webp", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png" };

export async function readCatalog(seedDir = path.join(process.cwd(), "seed")): Promise<Catalog> {
  return JSON.parse(await readFile(path.join(seedDir, "catalog.json"), "utf8"));
}

async function storeImage(db: Db, seedDir: string, file: string | undefined, cache: Map<string, string>) {
  if (!file) return null;
  if (file.startsWith("/") || file.startsWith("http")) return file; // already a URL
  const cached = cache.get(file);
  if (cached) return cached;
  const bytes = await readFile(path.join(seedDir, "images", file));
  const type = MIME[path.extname(file).toLowerCase()] ?? "application/octet-stream";
  const [row] = await db.query<{ id: string }>(
    "insert into images (content_type, data) values ($1, decode($2, 'base64')) returning id::text",
    [type, bytes.toString("base64")],
  );
  const url = `/api/images/${row.id}`;
  cache.set(file, url);
  return url;
}

/** Replaces the whole catalog (and, with `wipeOrders`, all orders). */
export async function seedCatalog(db: Db, catalog: Catalog, { wipeOrders = false, seedDir = path.join(process.cwd(), "seed") } = {}) {
  if (wipeOrders) {
    await db.query("delete from orders");
    await db.query("delete from blocked_dates");
    await db.query("select setval('order_number_seq', 1001, false)");
  }
  await db.query("delete from products");
  await db.query("delete from categories");
  await db.query("delete from images");

  if (catalog.settings) {
    const entries = Object.entries(catalog.settings).filter(([k]) => SETTINGS_KEYS.includes(k));
    for (const [key, value] of entries) {
      const v = key === "weekly_hours" ? JSON.stringify(value) : value;
      await db.query(`update business_settings set ${key} = $1${key === "weekly_hours" ? "::jsonb" : ""} where id = 1`, [v]);
    }
  }

  const images = new Map<string, string>();
  const categoryIds = new Map<string, string>();
  for (const [i, c] of catalog.categories.entries()) {
    const [row] = await db.query<{ id: string }>(
      "insert into categories (name, image_url, sort_order) values ($1, $2, $3) returning id::text",
      [c.name, await storeImage(db, seedDir, c.image, images), i + 1],
    );
    categoryIds.set(c.name, row.id);
  }

  const order = new Map<string, number>();
  for (const p of catalog.products) {
    const categoryId = categoryIds.get(p.category);
    if (!categoryId) throw new Error(`Product "${p.name}": unknown category "${p.category}"`);
    const sort = (order.get(p.category) ?? 0) + 1;
    order.set(p.category, sort);
    await db.query(
      `insert into products (category_id, name, description, price, unit_label, image_url, is_available, is_featured, tags, variants, sort_order)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10::jsonb,$11)`,
      [
        categoryId, p.name, p.description ?? "", p.price, p.unit_label ?? "",
        await storeImage(db, seedDir, p.image, images),
        p.is_available ?? true, p.is_featured ?? false, p.tags ?? [], JSON.stringify(p.variants ?? []), sort,
      ],
    );
  }
}

/**
 * Adds the catalog's categories that the database doesn't have yet (matched by name), with their products,
 * and fills categories that exist but are still empty with the catalog's products for them.
 * A category that has products is left alone, so a product the owner renamed or deleted never comes back.
 * Never deletes or changes anything.
 */
export async function addMissingFromCatalog(db: Db, catalog: Catalog, { seedDir = path.join(process.cwd(), "seed") } = {}) {
  const images = new Map<string, string>();
  const categoryIds = new Map(
    (await db.query<{ id: string; name: string }>("select id::text, name from categories")).map((c) => [c.name, c.id]),
  );
  const added = { categories: [] as string[], products: [] as string[] };
  const empty = new Set(
    (
      await db.query<{ name: string }>(
        "select c.name from categories c where not exists (select 1 from products p where p.category_id = c.id)",
      )
    ).map((c) => c.name),
  );

  for (const [i, c] of catalog.categories.entries()) {
    if (categoryIds.has(c.name)) continue;
    // Right after the category that precedes it in the catalog; the others keep their order.
    const before = catalog.categories.slice(0, i).map((x) => x.name).reverse().find((n) => categoryIds.has(n));
    const [{ pos }] = await db.query<{ pos: number }>(
      before
        ? "select sort_order + 1 as pos from categories where name = $1"
        : "select coalesce(min(sort_order), 1) as pos from categories where $1::text is null",
      [before ?? null],
    );
    await db.query("update categories set sort_order = sort_order + 1 where sort_order >= $1", [pos]);
    const [row] = await db.query<{ id: string }>(
      "insert into categories (name, image_url, sort_order) values ($1, $2, $3) returning id::text",
      [c.name, await storeImage(db, seedDir, c.image, images), pos],
    );
    categoryIds.set(c.name, row.id);
    added.categories.push(c.name);
  }

  for (const p of catalog.products) {
    if (!added.categories.includes(p.category) && !empty.has(p.category)) continue;
    const categoryId = categoryIds.get(p.category)!;
    await db.query(
      `insert into products (category_id, name, description, price, unit_label, image_url, is_available, is_featured, tags, variants, sort_order)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10::jsonb,
               (select coalesce(max(sort_order), 0) + 1 from products where category_id = $1))`,
      [
        categoryId, p.name, p.description ?? "", p.price, p.unit_label ?? "",
        await storeImage(db, seedDir, p.image, images),
        p.is_available ?? true, p.is_featured ?? false, p.tags ?? [], JSON.stringify(p.variants ?? []),
      ],
    );
    added.products.push(p.name);
  }
  return added;
}

/** Sample orders around today, for demos. Bypasses place_order's lead-time rule on purpose. */
export async function seedSampleOrders(db: Db, orders: SeedOrder[]) {
  const [s] = await db.query<{ weekly_hours: Record<string, { open: boolean }>; tz: string; today: string }>(
    "select weekly_hours, time_zone as tz, (now() at time zone time_zone)::date::text as today from business_settings where id = 1",
  );
  const isOpen = (d: Date) => Boolean(s.weekly_hours[String(d.getUTCDay())]?.open);
  /** today (or the next open day) for 0; otherwise N open days forward/back. */
  const openDay = (offset: number) => {
    const d = new Date(`${s.today}T12:00:00Z`);
    if (offset === 0) {
      for (let i = 0; i < 14 && !isOpen(d); i++) d.setUTCDate(d.getUTCDate() + 1);
    } else {
      for (let left = Math.abs(offset), i = 0; left > 0 && i < 60; i++) {
        d.setUTCDate(d.getUTCDate() + Math.sign(offset));
        if (isOpen(d)) left--;
      }
    }
    return d.toISOString().slice(0, 10);
  };

  for (const o of orders) {
    const date = openDay(o.day_offset);
    const [order] = await db.query<{ id: string }>(
      `insert into orders (customer_name, phone, notes, fulfillment_type, delivery_address, pickup_date, pickup_time, status, total, created_at, updated_at)
       values ($1,$2,$3,$8,$9,$4::date,$5::time,$6,0, now() - $7::float8 * interval '1 hour', now() - $7::float8 * interval '1 hour') returning id::text`,
      [o.customer_name, o.phone, o.notes ?? "", date, o.time, o.status, o.hours_ago, o.delivery_address ? "delivery" : "pickup", o.delivery_address ?? null],
    );
    for (const item of o.items) {
      await db.query(
        `insert into order_items (order_id, product_id, product_name, variant_label, unit_price, quantity, line_total)
         select $1, p.id, p.name, v.value ->> 'label',
                coalesce((v.value ->> 'price')::numeric, p.price), $3::int, coalesce((v.value ->> 'price')::numeric, p.price) * $3::int
           from products p
           left join lateral (select value from jsonb_array_elements(p.variants) where value ->> 'id' = $4) v on true
          where p.name = $2`,
        [order.id, item.product, item.qty, item.variant ?? null],
      );
    }
    await db.query("update orders set total = (select coalesce(sum(line_total), 0) from order_items where order_id = $1) where id = $1", [order.id]);
  }
}

/**
 * Renames categories (old name → new name; skipped when the old one is gone or the new one exists),
 * then sets the category order to the catalog's order. Categories the catalog doesn't list keep their
 * relative order after it. Products, prices and orders are not touched.
 */
export async function renameAndOrderCategories(db: Db, catalog: Catalog, renames: Record<string, string>) {
  const renamed: string[] = [];
  for (const [from, to] of Object.entries(renames)) {
    const [{ n }] = await db.query<{ n: number }>("select count(*)::int as n from categories where name = $1", [to]);
    if (n > 0) continue;
    const rows = await db.query<{ id: string }>("update categories set name = $2 where name = $1 returning id::text", [from, to]);
    if (rows.length) renamed.push(`${from} → ${to}`);
  }
  const wanted = catalog.categories.map((c) => c.name);
  const rows = await db.query<{ id: string; name: string }>("select id::text, name from categories order by sort_order, name");
  const ordered = [
    ...wanted.flatMap((name) => rows.filter((r) => r.name === name)),
    ...rows.filter((r) => !wanted.includes(r.name)),
  ];
  for (const [i, r] of ordered.entries()) {
    await db.query("update categories set sort_order = $2 where id = $1", [r.id, i + 1]);
  }
  return { renamed, order: ordered.map((r) => r.name) };
}

/**
 * Brings the categories listed in catalog.sync.order in line with the catalog: moves, renames and removes
 * the listed products, then for every catalog product in those categories updates its price, size label
 * and options (adding its photo or description only if it has none) or adds it if missing, and finally
 * puts the products in catalog order. Products the owner added that the catalog doesn't name are kept,
 * after the catalog ones. Other categories are not touched. Safe to run twice.
 */
export async function syncCatalog(db: Db, catalog: Catalog, { seedDir = path.join(process.cwd(), "seed") } = {}) {
  const plan = catalog.sync;
  if (!plan) return null;
  const images = new Map<string, string>();
  const cats = new Map(
    (await db.query<{ id: string; name: string }>("select id::text, name from categories")).map((c) => [c.name, c.id]),
  );
  const done = { moved: [] as string[], renamed: [] as string[], removed: [] as string[], updated: [] as string[], added: [] as string[] };
  const productId = async (category: string, name: string) =>
    (await db.query<{ id: string }>("select id::text from products where category_id = $1 and name = $2 limit 1", [cats.get(category) ?? null, name]))[0]?.id;

  for (const m of plan.moves ?? []) {
    const id = await productId(m.from, m.name);
    if (id && cats.has(m.to) && !(await productId(m.to, m.name))) {
      await db.query("update products set category_id = $1 where id = $2", [cats.get(m.to), id]);
      done.moved.push(`${m.name}: ${m.from} → ${m.to}`);
    }
  }
  for (const r of plan.renames ?? []) {
    const id = await productId(r.category, r.from);
    if (id && !(await productId(r.category, r.to))) {
      await db.query("update products set name = $1 where id = $2", [r.to, id]);
      done.renamed.push(`${r.from} → ${r.to}`);
    }
  }
  for (const r of plan.remove ?? []) {
    const id = await productId(r.category, r.name);
    if (id) {
      // Past orders keep their own copy of the name and price (order_items.product_id becomes null).
      await db.query("delete from products where id = $1", [id]);
      done.removed.push(r.name);
    }
  }

  for (const [category, names] of Object.entries(plan.order)) {
    const categoryId = cats.get(category);
    if (!categoryId) continue;
    for (const p of catalog.products.filter((x) => x.category === category)) {
      const [row] = await db.query<{ id: string; image_url: string | null; description: string }>(
        "select id::text, image_url, description from products where category_id = $1 and name = $2 limit 1",
        [categoryId, p.name],
      );
      if (row) {
        await db.query(
          `update products set price = $2, unit_label = $3, variants = $4::jsonb,
                  image_url = coalesce(image_url, $5), description = case when description = '' then $6 else description end
            where id = $1`,
          [row.id, p.price, p.unit_label ?? "", JSON.stringify(p.variants ?? []), row.image_url ? null : await storeImage(db, seedDir, p.image, images), p.description ?? ""],
        );
        done.updated.push(p.name);
      } else {
        await db.query(
          `insert into products (category_id, name, description, price, unit_label, image_url, is_available, is_featured, tags, variants, sort_order)
           values ($1,$2,$3,$4,$5,$6,true,false,$7,$8::jsonb,0)`,
          [categoryId, p.name, p.description ?? "", p.price, p.unit_label ?? "", await storeImage(db, seedDir, p.image, images), p.tags ?? [], JSON.stringify(p.variants ?? [])],
        );
        done.added.push(p.name);
      }
    }
    // Catalog order first, then anything else in the category in its current order.
    const rows = await db.query<{ id: string; name: string }>(
      "select id::text, name from products where category_id = $1 order by sort_order, created_at",
      [categoryId],
    );
    const rank = (n: string) => (names.indexOf(n) === -1 ? names.length : names.indexOf(n));
    const sorted = rows.map((r, i) => ({ ...r, i })).sort((a, b) => rank(a.name) - rank(b.name) || a.i - b.i);
    for (const [i, r] of sorted.entries()) await db.query("update products set sort_order = $1 where id = $2", [i + 1, r.id]);
  }
  return done;
}
