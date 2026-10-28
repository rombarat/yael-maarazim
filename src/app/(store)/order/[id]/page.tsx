import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Check, MapPin, Phone } from "lucide-react";
import { LinkButton } from "@/components/ui/button";
import { getSettings } from "@/lib/catalog";
import { getOrder, getOrderSummary } from "@/lib/admin-data";
import { deliveryFeeFromNotes } from "@/config/delivery";
import { formatDateLong, formatPrice, telHref } from "@/lib/format";
import { localizeSettings, tr } from "@/i18n/catalog";
import { messages } from "@/i18n/messages";
import { getLang } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  return { title: messages[await getLang()].order.metaTitle, robots: { index: false } };
}

export default async function OrderConfirmationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();

  const [order, full, rawSettings, lang] = await Promise.all([getOrderSummary(id), getOrder(id), getSettings(), getLang()]);
  if (!order || !full) notFound();
  // The stored total is the items only; a delivery fee is recorded in the notes (see config/delivery.ts).
  const deliveryFee = order.fulfillment_type === "delivery" ? deliveryFeeFromNotes(full.notes) : 0;
  const settings = localizeSettings(rawSettings, lang);
  const t = messages[lang].order;

  const firstName = order.customer_name.split(" ")[0];

  return (
    <div className="mx-auto max-w-[640px] px-4 pt-12 md:pt-16">
      <div className="flex size-14 items-center justify-center rounded-full bg-success text-white">
        <Check className="size-7" strokeWidth={2.5} />
      </div>
      <h1 className="mt-6 font-display text-[42px] leading-[1.05] md:text-[56px]">{t.thanks(firstName)}</h1>
      <p className="mt-3 text-[18px] text-ink/85">{t.body}</p>

      <div className="mt-8 overflow-hidden rounded-[var(--radius-panel)] border border-line bg-white">
        <div className="flex items-center justify-between bg-surface px-5 py-4">
          <span className="text-muted">{t.number}</span>
          <span className="tabular font-display text-[34px] leading-none">#{order.order_number}</span>
        </div>
        <dl className="divide-y divide-line px-5">
          <div className="flex justify-between gap-4 py-4">
            <dt className="text-muted">{order.fulfillment_type === "delivery" ? t.delivery : t.pickup}</dt>
            <dd className="text-end font-semibold">
              {formatDateLong(order.pickup_date, lang)}, <span className="tabular">{order.pickup_time}</span>
            </dd>
          </div>
          <div className="py-4">
            <dt className="sr-only">{t.items}</dt>
            <dd>
              <ul className="space-y-2">
                {order.items.map((item, i) => (
                  <li key={i} className="flex justify-between gap-4">
                    <span>
                      <span className="tabular font-semibold">{item.quantity}×</span> {tr(item.product_name, lang)}
                      {item.variant_label && <span className="text-muted"> ({tr(item.variant_label, lang)})</span>}
                    </span>
                    <span className="tabular shrink-0">{formatPrice(item.line_total, lang)}</span>
                  </li>
                ))}
              </ul>
            </dd>
          </div>
          {deliveryFee > 0 && (
            <div className="flex justify-between gap-4 py-4">
              <dt>{t.deliveryFee}</dt>
              <dd className="tabular">{formatPrice(deliveryFee, lang)}</dd>
            </div>
          )}
          <div className="flex items-baseline justify-between py-4">
            <dt className="font-semibold">{t.total}</dt>
            <dd className="tabular text-[22px] font-bold">{formatPrice(Number(order.total) + deliveryFee, lang)}</dd>
          </div>
        </dl>
      </div>

      {t.paymentNote && <p className="mt-4 rounded-lg bg-blush px-4 py-3 font-semibold text-brand-dark">{t.paymentNote}</p>}

      <ul className="mt-6 space-y-3 text-[16px]">
        {order.fulfillment_type === "pickup" && (settings.pickup_address || settings.pickup_notes) && (
          <li className="flex items-start gap-3">
            <MapPin className="mt-1 size-5 shrink-0 text-brand" />
            <span>
              {settings.pickup_address && <span className="block font-semibold">{settings.pickup_address}</span>}
              {settings.pickup_notes}
            </span>
          </li>
        )}
        {settings.phone && (
          <li className="flex items-start gap-3">
            <Phone className="mt-1 size-5 shrink-0 text-brand" />
            <span>
              {t.change}{" "}
              <a href={telHref(settings.phone)} className="font-semibold underline underline-offset-4" dir="ltr">
                {settings.phone}
              </a>
            </span>
          </li>
        )}
      </ul>

      <div className="mt-10">
        <LinkButton href="/" variant="secondary" size="lg">
          {t.home}
        </LinkButton>
      </div>
    </div>
  );
}
