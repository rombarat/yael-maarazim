"use client";

import { useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import { CalendarX, MapPin, ShoppingBag, Store, Truck } from "lucide-react";
import { z } from "zod";
import { toast } from "sonner";
import { Button, LinkButton } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/field";
import { EmptyState } from "@/components/ui/empty-state";
import { PageSpinner } from "@/components/ui/spinner";
import { cartTotals, useCart, useCartHydrated } from "@/lib/cart-store";
import { formatDateLong, formatPrice, telHref } from "@/lib/format";
import { getPickupDays } from "@/lib/pickup";
import { isProductError, isSlotError, orderErrorMessage } from "@/lib/order-errors";
import { fetchCartProducts, placeOrder } from "@/app/(store)/actions";
import type { BlockedDate, BusinessSettings } from "@/lib/types";
import { CartLines } from "./cart-lines";
import { PickupPicker } from "./pickup-picker";
import { useCartSync } from "./use-cart-sync";
import { deliveryAreas, findDeliveryArea } from "@/config/delivery";
import { useLang, useT } from "@/i18n/client";
import { STORE_TOASTER } from "./store-toaster";
import { messages } from "@/i18n/messages";

type CheckoutErrors = (typeof messages)["he"]["checkout"]["errors"];

const makeSchema = (e: CheckoutErrors) =>
  z.object({
    name: z.string().trim().min(2, e.name).max(80, e.nameLong),
    phone: z
      .string()
      .transform((v) => v.replace(/[^\d+]/g, "").replace(/^\+972/, "0"))
      .refine((v) => /^0\d{8,9}$/.test(v), e.phone),
    greeting: z.string().trim().max(250, e.greeting),
    notes: z.string().max(300, e.notes),
    date: z.string({ error: e.date }),
    time: z.string({ error: e.time }),
    fulfillment: z.enum(["pickup", "delivery"]),
    address: z.string().trim().max(200, e.addressLong),
    accepted: z.literal(true, { error: e.accepted }),
  });

type ErrorKey = "name" | "phone" | "greeting" | "notes" | "pickup" | "area" | "address" | "accepted";
type Errors = Partial<Record<ErrorKey, string>>;
/** Order of the fields on the page, to scroll to the first problem. */
const FIELD_ORDER: ErrorKey[] = ["area", "address", "pickup", "name", "phone", "greeting", "notes", "accepted"];

export function CheckoutForm({ settings, blocked }: { settings: BusinessSettings; blocked: BlockedDate[] }) {
  const router = useRouter();
  const lang = useLang();
  const t = useT();
  const c = t.checkout;
  const schema = useMemo(() => makeSchema(c.errors), [c.errors]);
  const hydrated = useCartHydrated();
  const lines = useCart((s) => s.lines);
  const clear = useCart((s) => s.clear);
  const sync = useCart((s) => s.sync);
  const { total, hasUnavailable } = cartTotals(lines);
  useCartSync(hydrated);

  const days = useMemo(() => getPickupDays(settings, blocked), [settings, blocked]);
  const [date, setDate] = useState<string | null>(null);
  const [time, setTime] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [greeting, setGreeting] = useState("");
  const [notes, setNotes] = useState("");
  const [fulfillment, setFulfillment] = useState<"pickup" | "delivery">("pickup");
  const [address, setAddress] = useState("");
  const [areaId, setAreaId] = useState("");
  const [accepted, setAccepted] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [submitting, setSubmitting] = useState(false);
  const [placed, setPlaced] = useState(false);

  if (!hydrated) return <PageSpinner label={c.loading} />;
  if (placed) return <PageSpinner label={c.sent} />;

  if (lines.length === 0) {
    return (
      <EmptyState
        icon={<ShoppingBag className="size-6" />}
        title={c.emptyTitle}
        body={c.emptyBody}
        action={<LinkButton href="/">{t.cart.browse}</LinkButton>}
      />
    );
  }

  const closed = !settings.accepting_orders;
  const delivery = settings.delivery_enabled && fulfillment === "delivery";
  const area = delivery ? findDeliveryArea(lang, areaId) : null;
  const deliveryFee = area?.fee ?? 0;

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    const parsed = schema.safeParse({
      name,
      phone,
      greeting,
      notes,
      date: date ?? undefined,
      time: time ?? undefined,
      fulfillment: delivery ? "delivery" : "pickup",
      address,
      accepted,
    });
    // Checked on its own so it shows together with the other errors, not only after they are fixed.
    const addressMissing = delivery && address.trim().length < 3;
    const areaMissing = delivery && !area;
    if (!parsed.success || addressMissing || areaMissing) {
      const next: Errors = {};
      for (const issue of parsed.success ? [] : parsed.error.issues) {
        const key = issue.path[0];
        if (key === "date" || key === "time") next.pickup ??= issue.message;
        else if (FIELD_ORDER.includes(key as ErrorKey)) next[key as ErrorKey] ??= issue.message;
      }
      if (addressMissing) next.address ??= c.errors.address;
      if (areaMissing) next.area ??= c.errors.area;
      setErrors(next);
      const firstId = FIELD_ORDER.find((k) => next[k]) ?? "notes";
      document.getElementById(firstId)?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    setErrors({});
    setSubmitting(true);

    const res = await placeOrder({
      name: parsed.data.name,
      phone: parsed.data.phone,
      greeting: parsed.data.greeting,
      notes: parsed.data.notes,
      date: parsed.data.date,
      time: parsed.data.time,
      fulfillment: parsed.data.fulfillment,
      address: parsed.data.address,
      area: area?.id ?? null,
      accepted_terms: true,
      items: lines
        .filter((l) => !l.unavailable)
        .map((l) => ({ product_id: l.productId, variant_id: l.variantId, quantity: l.quantity })),
    }).catch(() => ({ ok: false as const, error: "NETWORK" }));

    if (!res.ok) {
      setSubmitting(false);
      const message = orderErrorMessage(res.error, lang);
      toast.error(message, { toasterId: STORE_TOASTER });
      if (isProductError(res.error)) {
        sync(await fetchCartProducts(lines.map((l) => l.productId)).catch(() => []));
      }
      if (res.error === "INVALID_ADDRESS") setErrors({ address: message });
      if (res.error === "INVALID_AREA") setErrors({ area: message });
      if (isSlotError(res.error)) {
        setTime(null);
        setErrors({ pickup: message });
      }
      return;
    }

    const order = res.data;
    setPlaced(true);
    clear();
    router.replace(`/order/${order.id}`);
  };

  return (
    <form onSubmit={onSubmit} noValidate className="mt-8 grid gap-10 md:grid-cols-[1fr_380px] md:items-start md:gap-12">
      <div className="min-w-0 space-y-10">
        {closed && (
          <div className="rounded-[var(--radius-panel)] border border-alert/25 bg-alert-soft p-5 text-alert" role="status">
            <p className="font-semibold">{c.closedTitle}</p>
            <p className="mt-1">
              {settings.closed_message || (settings.phone ? c.orderByPhone : c.tryLater)}{" "}
              {settings.phone && (
                <a href={telHref(settings.phone)} className="font-semibold underline" dir="ltr">
                  {settings.phone}
                </a>
              )}
            </p>
          </div>
        )}

        {settings.delivery_enabled && (
          <fieldset>
            <legend className="font-display text-[28px] leading-none md:text-[32px]">{c.howTitle}</legend>
            <div className="mt-5 grid grid-cols-2 gap-3">
              {(
                [
                  { value: "pickup", label: c.pickup, icon: Store },
                  { value: "delivery", label: c.delivery, icon: Truck },
                ] as const
              ).map((o) => (
                <label
                  key={o.value}
                  className={clsx(
                    "flex min-h-14 items-center gap-3 rounded-[var(--radius-panel)] border px-4 py-3 font-semibold transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-brand",
                    fulfillment === o.value ? "border-brand bg-surface text-brand" : "border-line bg-white hover:border-brand/40",
                  )}
                >
                  <input
                    type="radio"
                    name="fulfillment"
                    value={o.value}
                    checked={fulfillment === o.value}
                    onChange={() => setFulfillment(o.value)}
                    className="sr-only"
                  />
                  <o.icon className="size-5 shrink-0" strokeWidth={1.75} />
                  {o.label}
                </label>
              ))}
            </div>
            {delivery && (
              <div className="mt-5 space-y-3">
                <Field label={c.area} htmlFor="area" error={errors.area}>
                  <select
                    id="area"
                    name="area"
                    value={areaId}
                    onChange={(e) => {
                      setAreaId(e.target.value);
                      if (errors.area) setErrors((er) => ({ ...er, area: undefined }));
                    }}
                    aria-invalid={!!errors.area}
                    className={clsx(
                      "h-12 w-full rounded-xl border bg-white px-4 text-[17px] text-ink transition-colors focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/15",
                      errors.area ? "border-alert" : "border-line",
                    )}
                  >
                    <option value="" disabled>
                      {c.areaChoose}
                    </option>
                    {deliveryAreas[lang].map((a) => (
                      <option key={a.id} value={a.id}>
                        {lang === "en" ? a.en : a.he} ({formatPrice(a.fee, lang)})
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label={c.address} htmlFor="address" error={errors.address} hint={c.addressHint}>
                  <Input
                    id="address"
                    name="address"
                    autoComplete="street-address"
                    value={address}
                    onChange={(e) => {
                      setAddress(e.target.value);
                      if (errors.address) setErrors((er) => ({ ...er, address: undefined }));
                    }}
                    invalid={!!errors.address}
                    maxLength={200}
                  />
                </Field>
              </div>
            )}
          </fieldset>
        )}

        <section aria-labelledby="pickup-title" id="pickup" className="scroll-mt-28">
          <h2 id="pickup-title" className="font-display text-[28px] leading-none md:text-[32px]">
            {delivery ? c.whenDelivery : c.whenPickup}
          </h2>
          <p className="mt-2 text-muted">
            {settings.min_lead_hours > 0 && c.leadTime(settings.min_lead_hours)}
            {!settings.delivery_enabled && c.pickupOnly}
          </p>
          <div className="mt-5">
            {days.length === 0 ? (
              <div className="flex items-start gap-3 rounded-[var(--radius-panel)] bg-surface p-5">
                <CalendarX className="mt-0.5 size-5 shrink-0 text-brand" />
                <p>
                  {c.noSlots}
                  {settings.phone && (
                    <>
                      {" "}{c.orderByPhone}{" "}
                      <a href={telHref(settings.phone)} className="font-semibold underline" dir="ltr">
                        {settings.phone}
                      </a>
                    </>
                  )}
                </p>
              </div>
            ) : (
              <PickupPicker
                days={days}
                date={date}
                time={time}
                onDate={(d) => {
                  setDate(d);
                  setTime(null);
                }}
                onTime={(t) => {
                  setTime(t);
                  setErrors((e) => ({ ...e, pickup: undefined }));
                }}
                error={errors.pickup}
              />
            )}
          </div>
          {!delivery && (settings.pickup_address || settings.pickup_notes) && (
            <p className="mt-5 flex items-start gap-2 text-[15px] text-muted">
              <MapPin className="mt-1 size-4 shrink-0" />
              <span>
                {settings.pickup_address && <span className="block font-semibold text-ink">{settings.pickup_address}</span>}
                {settings.pickup_notes}
              </span>
            </p>
          )}
          {!delivery && settings.delivery_enabled && (
            <p className="mt-3 flex items-start gap-2 text-[15px] text-muted">
              <Truck className="mt-1 size-4 shrink-0" />
              <span>{t.pickupAlsoDelivery(t.serviceArea)}</span>
            </p>
          )}
        </section>

        <section aria-labelledby="details-title" className="space-y-5">
          <h2 id="details-title" className="font-display text-[28px] leading-none md:text-[32px]">
            {c.detailsTitle}
          </h2>
          <Field label={c.name} htmlFor="name" error={errors.name}>
            <Input
              id="name"
              name="name"
              autoComplete="name"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (errors.name) setErrors((er) => ({ ...er, name: undefined }));
              }}
              invalid={!!errors.name}
              maxLength={80}
            />
          </Field>
          <Field label={c.phone} htmlFor="phone" error={errors.phone} hint={c.phoneHint}>
            <Input
              id="phone"
              name="phone"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              dir="ltr"
              className={lang === "en" ? "text-left" : "text-right"}
              placeholder="050-1234567"
              value={phone}
              onChange={(e) => {
                setPhone(e.target.value);
                if (errors.phone) setErrors((er) => ({ ...er, phone: undefined }));
              }}
              invalid={!!errors.phone}
            />
          </Field>
          <Field label={c.greeting} htmlFor="greeting" optional optionalLabel={c.optional} error={errors.greeting} hint={c.greetingHint}>
            <Textarea
              id="greeting"
              name="greeting"
              rows={3}
              value={greeting}
              onChange={(e) => {
                setGreeting(e.target.value);
                if (errors.greeting) setErrors((er) => ({ ...er, greeting: undefined }));
              }}
              maxLength={250}
              invalid={!!errors.greeting}
            />
          </Field>
          <Field label={c.notes} htmlFor="notes" optional optionalLabel={c.optional} error={errors.notes} hint={c.notesHint}>
            <Textarea
              id="notes"
              name="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              maxLength={300}
              invalid={!!errors.notes}
            />
          </Field>
        </section>
      </div>

      <aside aria-labelledby="summary-title" className="min-w-0 rounded-[var(--radius-panel)] border border-line bg-white p-5 md:sticky md:top-28">
        <h2 id="summary-title" className="font-display text-[26px] leading-none">
          {c.summaryTitle}
        </h2>
        <div className="mt-2">
          <CartLines lines={lines} compact />
        </div>
        <div className="mt-2 space-y-1 border-t border-line pt-4">
          {date && time && (
            <p className="text-[15px] text-muted">
              {delivery ? c.delivery : c.pickup}: {formatDateLong(date, lang)}, <span className="tabular">{time}</span>
            </p>
          )}
          {delivery && (
            <>
              <div className="flex items-baseline justify-between text-[16px]">
                <span className="text-muted">{c.subtotal}</span>
                <span className="tabular">{formatPrice(total, lang)}</span>
              </div>
              <div className="flex items-baseline justify-between text-[16px]">
                <span className="text-muted">{area ? c.deliveryTo(lang === "en" ? area.en : area.he) : c.delivery}</span>
                <span className="tabular">{area ? formatPrice(deliveryFee, lang) : c.areaChoose}</span>
              </div>
            </>
          )}
          <div className="flex items-baseline justify-between">
            <span className="font-semibold">{c.totalToPay}</span>
            <span className="tabular text-[24px] font-bold">{formatPrice(total + deliveryFee, lang)}</span>
          </div>
          <p className="text-[14px] text-muted">{c.noPaymentNow}</p>
          <p className="text-[14px] text-muted">{t.refrigerate}</p>
          {c.paymentNote && <p className="rounded-lg bg-blush px-3 py-2 text-[15px] font-semibold text-brand-dark">{c.paymentNote}</p>}
        </div>

        <div className="mt-5">
          <label htmlFor="accepted" className="flex cursor-pointer items-start gap-3 text-[15px] leading-snug">
            <input
              id="accepted"
              type="checkbox"
              checked={accepted}
              onChange={(e) => {
                setAccepted(e.target.checked);
                if (errors.accepted) setErrors((er) => ({ ...er, accepted: undefined }));
              }}
              aria-invalid={!!errors.accepted}
              aria-describedby={errors.accepted ? "accepted-error" : undefined}
              className="mt-0.5 size-5 shrink-0 accent-[var(--color-brand)]"
            />
            <span>
              {c.acceptPrefix}
              <Link href="/terms" target="_blank" className="font-semibold text-brand underline underline-offset-2">
                {c.terms}
              </Link>
              {c.and}
              <Link href="/privacy" target="_blank" className="font-semibold text-brand underline underline-offset-2">
                {c.privacy}
              </Link>
            </span>
          </label>
          {errors.accepted && (
            <p id="accepted-error" role="alert" className="mt-2 text-[14px] text-alert">
              {errors.accepted}
            </p>
          )}
        </div>

        <Button type="submit" size="lg" className="mt-5 w-full" loading={submitting} disabled={closed || hasUnavailable || days.length === 0}>
          {submitting ? c.submitting : c.submit}
        </Button>
        {hasUnavailable && <p className="mt-2 text-center text-[14px] text-alert">{t.cart.removeSoldOut}</p>}
      </aside>
    </form>
  );
}
