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
export type Catalog = {
  settings?: Record<string, unknown>;
  categories: { name: string; image?: string }[];
  products: SeedProduct[];
  sampleOrders?: SeedOrder[];
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
