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

const schema = z.object({
    name: z.string().trim().min(2, "נא למלא שם מלא").max(80, "השם ארוך מדי"),
    phone: z
      .string()
      .transform((v) => v.replace(/[^\d+]/g, "").replace(/^\+972/, "0"))
      .refine((v) => /^0\d{8,9}$/.test(v), "מספר טלפון לא תקין. לדוגמה: 050-1234567"),
    notes: z.string().max(600, "ההערה ארוכה מדי (עד 600 תווים)"),
    date: z.string({ error: "בחרו יום ושעה" }),
    time: z.string({ error: "בחרו שעה" }),
    fulfillment: z.enum(["pickup", "delivery"]),
    address: z.string().trim().max(200, "הכתובת ארוכה מדי"),
    accepted: z.literal(true, { error: "כדי לשלוח הזמנה צריך לאשר את התקנון ואת מדיניות הפרטיות" }),
});
const ADDRESS_MISSING = "נא למלא כתובת מלאה: עיר, רחוב ומספר בית";

type ErrorKey = "name" | "phone" | "notes" | "pickup" | "address" | "accepted";
type Errors = Partial<Record<ErrorKey, string>>;
/** Order of the fields on the page, to scroll to the first problem. */
const FIELD_ORDER: ErrorKey[] = ["address", "pickup", "name", "phone", "notes", "accepted"];

export function CheckoutForm({ settings, blocked }: { settings: BusinessSettings; blocked: BlockedDate[] }) {
  const router = useRouter();
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
  const [notes, setNotes] = useState("");
  const [fulfillment, setFulfillment] = useState<"pickup" | "delivery">("pickup");
  const [address, setAddress] = useState("");
  const [accepted, setAccepted] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [submitting, setSubmitting] = useState(false);
  const [placed, setPlaced] = useState(false);

  if (!hydrated) return <PageSpinner />;
  if (placed) return <PageSpinner label="ההזמנה נשלחה, מעבירים לאישור…" />;

  if (lines.length === 0) {
    return (
      <EmptyState
        icon={<ShoppingBag className="size-6" />}
        title="הסל ריק"
        body="כדי להזמין, הוסיפו קודם מוצרים מהחנות."
        action={<LinkButton href="/shop">לחנות</LinkButton>}
      />
    );
  }

  const closed = !settings.accepting_orders;
  const delivery = settings.delivery_enabled && fulfillment === "delivery";

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    const parsed = schema.safeParse({
      name,
      phone,
      notes,
      date: date ?? undefined,
      time: time ?? undefined,
      fulfillment: delivery ? "delivery" : "pickup",
      address,
      accepted,
    });
    // Checked on its own so it shows together with the other errors, not only after they are fixed.
    const addressMissing = delivery && address.trim().length < 6;
    if (!parsed.success || addressMissing) {
      const next: Errors = {};
      for (const issue of parsed.success ? [] : parsed.error.issues) {
        const key = issue.path[0];
        if (key === "date" || key === "time") next.pickup ??= issue.message;
        else if (FIELD_ORDER.includes(key as ErrorKey)) next[key as ErrorKey] ??= issue.message;
      }
      if (addressMissing) next.address ??= ADDRESS_MISSING;
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
      notes: parsed.data.notes,
      date: parsed.data.date,
      time: parsed.data.time,
      fulfillment: parsed.data.fulfillment,
      address: parsed.data.address,
      accepted_terms: true,
      items: lines
        .filter((l) => !l.unavailable)
        .map((l) => ({ product_id: l.productId, variant_id: l.variantId, quantity: l.quantity })),
    }).catch(() => ({ ok: false as const, error: "NETWORK" }));

    if (!res.ok) {
      setSubmitting(false);
      const message = orderErrorMessage(res.error);
      toast.error(message);
      if (isProductError(res.error)) {
        sync(await fetchCartProducts(lines.map((l) => l.productId)).catch(() => []));
      }
      if (res.error === "INVALID_ADDRESS") setErrors({ address: message });
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
            <p className="font-semibold">כרגע לא מקבלים הזמנות דרך האתר</p>
            <p className="mt-1">
              {settings.closed_message || (settings.phone ? "אפשר להזמין בטלפון" : "נסו שוב בקרוב.")}{" "}
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
            <legend className="font-display text-[28px] leading-none md:text-[32px]">איך לקבל את ההזמנה?</legend>
            <div className="mt-5 grid grid-cols-2 gap-3">
              {(
                [
                  { value: "pickup", label: "איסוף עצמי", icon: Store },
                  { value: "delivery", label: "משלוח", icon: Truck },
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
                {settings.delivery_notes && <p className="text-[15px] text-muted">{settings.delivery_notes}</p>}
                <Field label="כתובת למשלוח" htmlFor="address" error={errors.address} hint="עיר, רחוב, מספר בית, ואם צריך גם קומה ודירה">
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
            {delivery ? "מתי להביא?" : "מתי לאסוף?"}
          </h2>
          <p className="mt-2 text-muted">
            {settings.min_lead_hours > 0 && `הזמנה לפחות ${settings.min_lead_hours} שעות מראש. `}
            {!settings.delivery_enabled && "איסוף עצמי בלבד."}
          </p>
          <div className="mt-5">
            {days.length === 0 ? (
              <div className="flex items-start gap-3 rounded-[var(--radius-panel)] bg-surface p-5">
                <CalendarX className="mt-0.5 size-5 shrink-0 text-brand" />
                <p>
                  אין כרגע מועדים פנויים באתר.
                  {settings.phone && (
                    <>
                      {" "}אפשר להזמין בטלפון{" "}
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
        </section>

        <section aria-labelledby="details-title" className="space-y-5">
          <h2 id="details-title" className="font-display text-[28px] leading-none md:text-[32px]">
            הפרטים שלך
          </h2>
          <Field label="שם מלא" htmlFor="name" error={errors.name}>
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
          <Field label="טלפון" htmlFor="phone" error={errors.phone} hint="נחזור אליכם למספר הזה לאישור ההזמנה">
            <Input
              id="phone"
              name="phone"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              dir="ltr"
              className="text-right"
              placeholder="050-1234567"
              value={phone}
              onChange={(e) => {
                setPhone(e.target.value);
                if (errors.phone) setErrors((er) => ({ ...er, phone: undefined }));
              }}
              invalid={!!errors.phone}
            />
          </Field>
          <Field label="הערות להזמנה" htmlFor="notes" optional error={errors.notes} hint="למשל: כיתוב על העוגה, צבעים, אלרגיות">
            <Textarea
              id="notes"
              name="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              maxLength={600}
              invalid={!!errors.notes}
            />
          </Field>
        </section>
      </div>

      <aside aria-labelledby="summary-title" className="min-w-0 rounded-[var(--radius-panel)] border border-line bg-white p-5 md:sticky md:top-28">
        <h2 id="summary-title" className="font-display text-[26px] leading-none">
          ההזמנה שלך
        </h2>
        <div className="mt-2">
          <CartLines lines={lines} compact />
        </div>
        <div className="mt-2 space-y-1 border-t border-line pt-4">
          {date && time && (
            <p className="text-[15px] text-muted">
              {delivery ? "משלוח" : "איסוף"}: {formatDateLong(date)}, <span className="tabular">{time}</span>
            </p>
          )}
          <div className="flex items-baseline justify-between">
            <span className="font-semibold">סה״כ לתשלום</span>
            <span className="tabular text-[24px] font-bold">{formatPrice(total)}</span>
          </div>
          <p className="text-[14px] text-muted">
            אין צורך בתשלום עכשיו. התשלום מול העסק{delivery ? ", ודמי המשלוח יתואמו איתכם." : "."}
          </p>
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
              קראתי ואני מסכים/ה ל
              <Link href="/terms" target="_blank" className="font-semibold text-brand underline underline-offset-2">
                תקנון האתר
              </Link>{" "}
              ול
              <Link href="/privacy" target="_blank" className="font-semibold text-brand underline underline-offset-2">
                מדיניות הפרטיות
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
          {submitting ? "שולחים…" : "שליחת הזמנה"}
        </Button>
        {hasUnavailable && <p className="mt-2 text-center text-[14px] text-alert">הסירו את המוצרים שאזלו כדי להמשיך.</p>}
      </aside>
    </form>
  );
}
