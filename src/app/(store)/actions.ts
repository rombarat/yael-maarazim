"use server";

import { z } from "zod";
import { queryOne } from "@/server/db";
import { getProductsByIds } from "@/lib/catalog";
import type { ActionResult, Product } from "@/lib/types";

const orderInput = z.object({
  name: z.string().trim().min(2).max(80),
  phone: z.string().max(20),
  notes: z.string().max(600),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  time: z.string().regex(/^\d{2}:\d{2}$/),
  fulfillment: z.enum(["pickup", "delivery"]),
  address: z.string().trim().max(200),
  /** The customer ticked the terms and privacy box. Required by the checkout. */
  accepted_terms: z.literal(true),
  items: z
    .array(
      z.object({
        product_id: z.string().uuid(),
        variant_id: z.string().max(40).nullable(),
        quantity: z.number().int().min(1).max(50),
      }),
    )
    .min(1)
    .max(40),
});

/**
 * Error codes come from the place_order() database function (see db/schema.sql)
 * and are turned into Hebrew by lib/order-errors.ts on the client.
 */
export async function placeOrder(input: z.input<typeof orderInput>): Promise<ActionResult<{ id: string }>> {
  const parsed = orderInput.safeParse(input);
  if (!parsed.success) return { ok: false, error: "INVALID_INPUT" };
  const o = parsed.data;
  try {
    const row = await queryOne<{ r: { id: string } }>(
      "select place_order($1, $2, $3, $4::date, $5::time, $6::jsonb, $7, $8) as r",
      [o.name, o.phone, o.notes, o.date, o.time, JSON.stringify(o.items), o.fulfillment, o.fulfillment === "delivery" ? o.address : null],
    );
    return { ok: true, data: { id: row!.r.id } };
  } catch (e) {
    const message = e instanceof Error ? e.message : "";
    // Only pass through our own codes, never raw database errors.
    const code = /^[A-Z_]+(:.*)?$/.test(message) ? message : "UNKNOWN";
    if (code === "UNKNOWN") console.error("placeOrder failed", e);
    return { ok: false, error: code };
  }
}

/** Fresh prices/availability for the cart (an owner may have changed them since it was filled). */
export async function fetchCartProducts(ids: string[]): Promise<Product[]> {
  return getProductsByIds(ids.slice(0, 60));
}
