import "server-only";
import { query, queryOne } from "@/server/db";
import type { BlockedDate, BusinessSettings, Category, Product } from "./types";

export const PRODUCT_COLUMNS = `id::text, category_id::text, name, description, price::float8 as price, unit_label, image_url,
  is_available, is_featured, tags, variants, sort_order`;

export async function getCategories(): Promise<Category[]> {
  return query<Category>("select id::text, name, image_url, sort_order from categories order by sort_order, name");
}

export async function getProducts(): Promise<Product[]> {
  return query<Product>(`select ${PRODUCT_COLUMNS} from products order by sort_order, name`);
}

export async function getProduct(id: string): Promise<Product | null> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  return queryOne<Product>(`select ${PRODUCT_COLUMNS} from products where id = $1`, [id]);
}

export async function getProductsByIds(ids: string[]): Promise<Product[]> {
  const valid = ids.filter((id) => /^[0-9a-f-]{36}$/i.test(id));
  if (!valid.length) return [];
  return query<Product>(`select ${PRODUCT_COLUMNS} from products where id = any($1::uuid[])`, [valid]);
}

export async function getSettings(): Promise<BusinessSettings> {
  const row = await queryOne<BusinessSettings>(
    `select phone, email, instagram_url, facebook_url, pickup_address, pickup_notes, accepting_orders, closed_message,
            min_lead_hours, max_days_ahead, slot_interval_minutes, weekly_hours, time_zone, delivery_enabled, delivery_notes
       from business_settings where id = 1`,
  );
  if (!row) throw new Error("business_settings row missing: run `npm run db:setup`");
  return row;
}

export async function getBlockedDates(): Promise<BlockedDate[]> {
  return query<BlockedDate>("select date::text as date, reason from blocked_dates order by date");
}
