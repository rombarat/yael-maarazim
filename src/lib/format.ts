import type { Lang } from "@/i18n";
import type { Product } from "./types";

/** Storefront functions take the language (default Hebrew); the admin always calls them without it. */
const LOCALE: Record<Lang, string> = { he: "he-IL", en: "en-IL" };

const ils = Object.fromEntries(
  (["he", "en"] as const).map((lang) => [
    lang,
    new Intl.NumberFormat(LOCALE[lang], { style: "currency", currency: "ILS", maximumFractionDigits: 2, minimumFractionDigits: 0 }),
  ]),
) as Record<Lang, Intl.NumberFormat>;

export function formatPrice(value: number, lang: Lang = "he") {
  return ils[lang].format(Number(value));
}

/** "החל מ-₪20" for products with price options, otherwise the plain price. */
export function productPriceLabel(product: Pick<Product, "price" | "variants">, lang: Lang = "he") {
  if (product.variants.length > 0) {
    const prices = product.variants.map((v) => Number(v.price));
    const min = Math.min(...prices);
    // Options that only differ in colour or flavour cost the same: show the plain price.
    if (min === Math.max(...prices)) return formatPrice(min, lang);
    return lang === "en" ? `From ${formatPrice(min, lang)}` : `החל מ-${formatPrice(min, lang)}`;
  }
  return formatPrice(product.price, lang);
}

function parseDate(date: string) {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d, 12));
}

/** "יום שני, 12 באוקטובר" */
export function formatDateLong(date: string, lang: Lang = "he") {
  return new Intl.DateTimeFormat(lang === "en" ? "en-GB" : "he-IL", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "UTC",
  }).format(parseDate(date));
}

/** "12.10" */
export function formatDateShort(date: string, lang: Lang = "he") {
  return new Intl.DateTimeFormat(lang === "en" ? "en-GB" : "he-IL", { day: "numeric", month: "numeric", timeZone: "UTC" }).format(
    parseDate(date),
  );
}

const WEEKDAYS = ["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי", "שבת"];
const WEEKDAYS_EN = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/** "שני" / "Mon" */
export function formatWeekday(date: string, lang: Lang = "he") {
  return (lang === "en" ? WEEKDAYS_EN : WEEKDAYS)[parseDate(date).getUTCDay()];
}

export function formatTime(time: string) {
  return time.slice(0, 5);
}

/** "לפני 5 דק׳", "היום 14:20", "10.10 14:20" */
export function formatRelative(iso: string) {
  const then = new Date(iso);
  const diffMin = Math.round((Date.now() - then.getTime()) / 60000);
  if (diffMin < 1) return "עכשיו";
  if (diffMin < 60) return `לפני ${diffMin} דק׳`;
  const time = new Intl.DateTimeFormat("he-IL", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Jerusalem",
  }).format(then);
  const sameDay =
    new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jerusalem" }).format(then) ===
    new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jerusalem" }).format(new Date());
  if (sameDay) return `היום ${time}`;
  const date = new Intl.DateTimeFormat("he-IL", {
    day: "numeric",
    month: "numeric",
    timeZone: "Asia/Jerusalem",
  }).format(then);
  return `${date} ${time}`;
}

/** "0501234567" → "050-1234567", "031234567" → "03-1234567" */
export function formatPhone(phone: string) {
  const d = phone.replace(/\D/g, "");
  if (d.length === 10) return `${d.slice(0, 3)}-${d.slice(3)}`;
  if (d.length === 9) return `${d.slice(0, 2)}-${d.slice(2)}`;
  return phone;
}

export function telHref(phone: string) {
  return `tel:${phone.replace(/[^0-9+]/g, "")}`;
}

export function whatsappHref(phone: string) {
  const digits = phone.replace(/\D/g, "");
  const intl = digits.startsWith("0") ? `972${digits.slice(1)}` : digits;
  return `https://wa.me/${intl}`;
}
