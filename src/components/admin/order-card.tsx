"use client";

import Link from "next/link";
import { CalendarDays, ChevronLeft, MessageSquareText, Phone, Truck } from "lucide-react";
import clsx from "clsx";
import { StatusSelect } from "./status-select";
import { formatPhone, formatPrice, formatRelative, formatTime, telHref } from "@/lib/format";
import { pickupLabel } from "@/lib/admin-format";
import type { Order } from "@/lib/types";

export function OrderCard({ order, today }: { order: Order; today: string }) {
  const items = order.order_items ?? [];
  const isNew = order.status === "new";
  const pickup = pickupLabel(order.pickup_date, today);
  const done = order.status === "completed" || order.status === "cancelled";

  return (
    <article
      className={clsx(
        "relative rounded-[var(--radius-panel)] border bg-white p-4 md:p-5",
        isNew ? "border-alert/40" : "border-line",
        done && "opacity-70",
      )}
      // Accent bar on the reading-start (right) edge for orders that still need a first look
      style={isNew ? { boxShadow: "inset -4px 0 0 var(--color-alert)" } : undefined}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <Link href={`/admin/orders/${order.id}`} className="tabular text-[20px] font-bold hover:underline">
              #{order.order_number}
            </Link>
            <span className="truncate text-[17px] font-semibold">{order.customer_name}</span>
          </div>
          <p className="mt-0.5 text-[13px] text-muted">התקבלה {formatRelative(order.created_at)}</p>
        </div>
        <StatusSelect key={order.status} orderId={order.id} orderNumber={order.order_number} status={order.status} />
      </div>

      <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-[15px]">
        <span className={clsx("inline-flex items-center gap-1.5", pickup.urgent && !done && "font-bold text-alert")}>
          <CalendarDays className="size-4" />
          {pickup.label} <span className="tabular">{formatTime(order.pickup_time)}</span>
        </span>
        {order.fulfillment_type === "delivery" && (
          <span className="inline-flex items-center gap-1.5 font-semibold text-brand">
            <Truck className="size-4" />
            משלוח
          </span>
        )}
        <a href={telHref(order.phone)} className="tabular inline-flex items-center gap-1.5 text-brand hover:underline" dir="ltr">
          <Phone className="size-4" />
          {formatPhone(order.phone)}
        </a>
      </div>

      {order.fulfillment_type === "delivery" && order.delivery_address && (
        <p className="mt-2 text-[15px] text-muted">{order.delivery_address}</p>
      )}

      <ul className="mt-3 space-y-0.5 text-[15px]">
        {items.map((i) => (
          <li key={i.id}>
            <span className="tabular font-bold">{i.quantity}×</span> {i.product_name}
            {i.variant_label && <span className="text-muted"> ({i.variant_label})</span>}
          </li>
        ))}
      </ul>

      {order.notes && (
        <p className="mt-3 flex items-start gap-2 rounded-lg bg-[#fbf3e8] px-3 py-2 text-[14px]">
          <MessageSquareText className="mt-0.5 size-4 shrink-0 text-accent" />
          {order.notes}
        </p>
      )}

      <div className="mt-4 flex items-center justify-between border-t border-line pt-3">
        <span className="tabular text-[18px] font-bold">{formatPrice(order.total)}</span>
        <Link href={`/admin/orders/${order.id}`} className="inline-flex h-10 items-center gap-1 rounded-full px-3 text-[15px] font-semibold text-brand hover:bg-surface">
          פרטים מלאים
          <ChevronLeft className="size-4" />
        </Link>
      </div>
    </article>
  );
}
