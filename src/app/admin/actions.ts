"use server";

import { z } from "zod";
import { query, queryOne } from "@/server/db";
import { UnauthorizedError, endSession, requireAdmin, startSession } from "@/server/auth";
import { hashPassword, verifyPassword } from "@/server/passwords";
import { deleteImageIfUnused } from "@/server/images";
import { IS_DEMO } from "@/lib/demo";
import { ORDER_STATUSES, type ActionResult } from "@/lib/types";

/**
 * Every admin mutation. Each one re-checks the session (middleware is only the first gate)
 * and returns a user-facing Hebrew error instead of throwing.
 */
async function guarded<T>(fn: () => Promise<T>): Promise<ActionResult<T>> {
  try {
    await requireAdmin();
    return { ok: true, data: await fn() };
  } catch (e) {
    if (e instanceof UnauthorizedError) return { ok: false, error: "פג תוקף ההתחברות. התחברו מחדש." };
    if (e instanceof UserError) return { ok: false, error: e.message };
    console.error("admin action failed", e);
    return { ok: false, error: "השינוי לא נשמר. נסו שוב." };
  }
}

class UserError extends Error {}

const uuid = z.string().uuid();

// ───────── session ─────────

export async function login(email: string, password: string): Promise<ActionResult> {
  const admin = await queryOne<{ id: string; email: string; password_hash: string }>(
    "select id::text, email, password_hash from admin_users where lower(email) = lower($1)",
    [email.trim()],
  );
  if (!admin || !(await verifyPassword(password, admin.password_hash))) {
    await new Promise((r) => setTimeout(r, 600)); // slow down guessing
    return { ok: false, error: "האימייל או הסיסמה שגויים." };
  }
  await startSession({ id: admin.id, email: admin.email });
  return { ok: true, data: undefined };
}

export async function logout() {
  await endSession();
}

export async function changePassword(password: string) {
  return guarded(async () => {
    if (IS_DEMO) throw new UserError("בגרסת ההדגמה הסיסמה קבועה.");
    if (password.length < 8) throw new UserError("לפחות 8 תווים");
    const admin = await requireAdmin();
    await query("update admin_users set password_hash = $1 where id = $2", [await hashPassword(password), admin.id]);
  });
}

// ───────── orders ─────────

export async function updateOrderStatus(id: string, status: string) {
  return guarded(async () => {
    uuid.parse(id);
    if (!(ORDER_STATUSES as readonly string[]).includes(status)) throw new UserError("סטטוס לא תקין");
    await query("update orders set status = $1 where id = $2", [status, id]);
  });
}

/** Polled by the admin shell to announce new orders without a websocket. */
export async function ordersPulse() {
  return guarded(async () => {
    const row = await queryOne<{ latest: number | null; new_count: number }>(
      "select max(order_number) as latest, count(*) filter (where status = 'new')::int as new_count from orders",
    );
    return { latest: row?.latest ?? null, newCount: row?.new_count ?? 0 };
  });
}

export async function latestOrder() {
  return guarded(async () =>
    queryOne<{ id: string; order_number: number; customer_name: string }>(
      "select id::text, order_number, customer_name from orders order by order_number desc limit 1",
    ),
  );
}

// ───────── products ─────────

const price = z.number().min(0).max(100000);
const productInput = z.object({
  name: z.string().trim().min(2).max(120),
  category_id: uuid.nullable(),
  price,
  unit_label: z.string().trim().max(40),
  description: z.string().trim().max(1000),
  image_url: z.string().max(300).nullable(),
  is_available: z.boolean(),
  is_featured: z.boolean(),
  tags: z.array(z.string().trim().min(1).max(30)).max(12),
  variants: z.array(z.object({ id: z.string().min(1).max(40), label: z.string().trim().min(1).max(40), price })).max(10),
});
export type ProductInput = z.input<typeof productInput>;

export async function saveProduct(input: ProductInput, id?: string) {
  return guarded(async () => {
    const p = productInput.parse(input);
    const values = [
      p.name, p.category_id, p.price, p.unit_label, p.description, p.image_url,
      p.is_available, p.is_featured, p.tags, JSON.stringify(p.variants),
    ];
    if (id) {
      uuid.parse(id);
      const before = await queryOne<{ image_url: string | null }>("select image_url from products where id = $1", [id]);
      await query(
        `update products set name=$1, category_id=$2, price=$3, unit_label=$4, description=$5, image_url=$6,
                is_available=$7, is_featured=$8, tags=$9, variants=$10::jsonb where id = $11`,
        [...values, id],
      );
      if (before?.image_url && before.image_url !== p.image_url) await deleteImageIfUnused(before.image_url);
    } else {
      await query(
        `insert into products (name, category_id, price, unit_label, description, image_url, is_available, is_featured, tags, variants, sort_order)
         values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10::jsonb, 999)`,
        values,
      );
    }
  });
}

export async function setProductFlag(id: string, flag: "is_available" | "is_featured", value: boolean) {
  return guarded(async () => {
    uuid.parse(id);
    const column = flag === "is_available" ? "is_available" : "is_featured";
    await query(`update products set ${column} = $1 where id = $2`, [value, id]);
  });
}

export async function deleteProduct(id: string) {
  return guarded(async () => {
    uuid.parse(id);
    const row = await queryOne<{ image_url: string | null }>("delete from products where id = $1 returning image_url", [id]);
    if (row?.image_url) await deleteImageIfUnused(row.image_url);
  });
}

/** Drops an uploaded image that was replaced before the product form was saved. */
export async function discardUpload(url: string) {
  return guarded(() => deleteImageIfUnused(url));
}

// ───────── categories ─────────

const categoryName = z.string().trim().min(1).max(40);

export async function createCategory(name: string) {
  return guarded(async () => {
    const n = categoryName.parse(name);
    const exists = await queryOne("select 1 from categories where name = $1", [n]);
    if (exists) throw new UserError("כבר יש קטגוריה בשם הזה");
    return (await queryOne<{ id: string; name: string; image_url: string | null; sort_order: number }>(
      `insert into categories (name, sort_order) values ($1, coalesce((select max(sort_order) from categories), 0) + 1)
       returning id::text, name, image_url, sort_order`,
      [n],
    ))!;
  });
}

export async function renameCategory(id: string, name: string) {
  return guarded(async () => {
    uuid.parse(id);
    const n = categoryName.parse(name);
    const taken = await queryOne("select 1 from categories where name = $1 and id <> $2", [n, id]);
    if (taken) throw new UserError("כבר יש קטגוריה בשם הזה");
    await query("update categories set name = $1 where id = $2", [n, id]);
  });
}

/** Persists the full order in one go: ids in their new order. */
export async function reorderCategories(ids: string[]) {
  return guarded(async () => {
    z.array(uuid).max(100).parse(ids);
    await query(
      `update categories c set sort_order = o.pos
         from unnest($1::uuid[]) with ordinality as o(id, pos) where c.id = o.id`,
      [ids],
    );
  });
}

export async function deleteCategory(id: string) {
  return guarded(async () => {
    uuid.parse(id);
    await query("delete from categories where id = $1", [id]);
  });
}

// ───────── pickup & settings ─────────

const hhmm = z.string().regex(/^\d{2}:\d{2}$/);
const pickupInput = z.object({
  weekly_hours: z.record(z.enum(["0", "1", "2", "3", "4", "5", "6"]), z.object({ open: z.boolean(), start: hhmm, end: hhmm })),
  min_lead_hours: z.number().int().min(0).max(336),
  slot_interval_minutes: z.union([z.literal(15), z.literal(30), z.literal(60), z.literal(90), z.literal(120)]),
  max_days_ahead: z.number().int().min(1).max(120),
  closed_message: z.string().trim().max(200),
  delivery_enabled: z.boolean(),
  delivery_notes: z.string().trim().max(300),
});

export async function savePickupSettings(input: z.input<typeof pickupInput>) {
  return guarded(async () => {
    const p = pickupInput.parse(input);
    for (const day of Object.values(p.weekly_hours)) {
      if (day.open && day.end <= day.start) throw new UserError("שעת הסיום צריכה להיות אחרי שעת ההתחלה");
    }
    await query(
      `update business_settings set weekly_hours=$1::jsonb, min_lead_hours=$2, slot_interval_minutes=$3,
              max_days_ahead=$4, closed_message=$5, delivery_enabled=$6, delivery_notes=$7 where id = 1`,
      [JSON.stringify(p.weekly_hours), p.min_lead_hours, p.slot_interval_minutes, p.max_days_ahead, p.closed_message,
       p.delivery_enabled, p.delivery_notes],
    );
  });
}

export async function setAcceptingOrders(on: boolean) {
  return guarded(async () => {
    if (IS_DEMO && !on) throw new UserError("בגרסת ההדגמה החנות תמיד פתוחה להזמנות.");
    await query("update business_settings set accepting_orders = $1 where id = 1", [on]);
  });
}

export async function blockDate(date: string, reason: string) {
  return guarded(async () => {
    z.string().regex(/^\d{4}-\d{2}-\d{2}$/).parse(date);
    const exists = await queryOne("select 1 from blocked_dates where date = $1::date", [date]);
    if (exists) throw new UserError("התאריך הזה כבר סגור");
    await query("insert into blocked_dates (date, reason) values ($1::date, $2)", [date, reason.trim().slice(0, 60)]);
  });
}

export async function unblockDate(date: string) {
  return guarded(async () => {
    await query("delete from blocked_dates where date = $1::date", [date]);
  });
}

const optionalUrl = z.string().trim().max(300).refine((v) => !v || /^https?:\/\/\S+\.\S+/.test(v));
const businessInput = z.object({
  phone: z.string().trim().max(20).refine((v) => !v || /^0\d{1,2}-?\d{7}$/.test(v.replace(/\s/g, ""))),
  email: z.string().trim().max(120).refine((v) => !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)),
  instagram_url: optionalUrl,
  facebook_url: optionalUrl,
  pickup_address: z.string().trim().max(160),
  pickup_notes: z.string().trim().max(300),
});

export async function saveBusinessSettings(input: z.input<typeof businessInput>) {
  return guarded(async () => {
    const b = businessInput.parse(input);
    await query(
      `update business_settings set phone=$1, email=$2, instagram_url=$3, facebook_url=$4, pickup_address=$5, pickup_notes=$6
        where id = 1`,
      [b.phone, b.email, b.instagram_url, b.facebook_url, b.pickup_address, b.pickup_notes],
    );
  });
}
