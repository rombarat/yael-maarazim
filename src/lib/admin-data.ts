import "server-only";
import { iso, query, queryOne } from "@/server/db";
import type { Order, OrderSummary } from "./types";

const ORDER_SELECT = `
  select o.id::text, o.order_number, o.customer_name, o.phone, o.notes, o.fulfillment_type, o.delivery_address,
         o.pickup_date::text as pickup_date, to_char(o.pickup_time, 'HH24:MI') as pickup_time,
         o.status, o.total::float8 as total, ${iso("o.created_at")} as created_at, ${iso("o.updated_at")} as updated_at,
         coalesce((
           select json_agg(json_build_object(
             'id', i.id, 'product_id', i.product_id, 'product_name', i.product_name, 'variant_label', i.variant_label,
             'unit_price', i.unit_price::float8, 'quantity', i.quantity, 'line_total', i.line_total::float8
           ) order by i.product_name)
           from order_items i where i.order_id = o.id), '[]'::json) as order_items
    from orders o`;

export async function getOrders(): Promise<Order[]> {
  return query<Order>(`${ORDER_SELECT} order by o.created_at desc limit 500`);
}

export async function getOrder(id: string): Promise<Order | null> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  return queryOne<Order>(`${ORDER_SELECT} where o.id = $1`, [id]);
}

/** Public confirmation page: looked up by the unguessable order id, no personal details beyond the first name. */
export async function getOrderSummary(id: string): Promise<OrderSummary | null> {
  const order = await getOrder(id);
  if (!order) return null;
  return {
    id: order.id,
    order_number: order.order_number,
    customer_name: order.customer_name,
    fulfillment_type: order.fulfillment_type,
    pickup_date: order.pickup_date,
    pickup_time: order.pickup_time,
    status: order.status,
    total: order.total,
    items: (order.order_items ?? []).map((i) => ({
      product_name: i.product_name,
      variant_label: i.variant_label,
      quantity: i.quantity,
      line_total: i.line_total,
    })),
  };
}

export async function getNewOrderCount() {
  const row = await queryOne<{ n: number }>("select count(*)::int as n from orders where status = 'new'");
  return row?.n ?? 0;
}
