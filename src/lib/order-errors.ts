import type { Lang } from "@/i18n";
import { tr } from "@/i18n/catalog";
import { messages } from "@/i18n/messages";

const SLOT_ERRORS = new Set(["DATE_BLOCKED", "DAY_CLOSED", "DATE_TOO_FAR", "TIME_OUTSIDE_HOURS", "LEAD_TIME", "INVALID_SLOT"]);

/** Maps error codes raised by `place_order` to customer-facing text. */
export function orderErrorMessage(raw: string | undefined, lang: Lang = "he") {
  const m = messages[lang].orderErrors;
  const message = raw ?? "";
  const [code, detail] = message.split(":");
  if (SLOT_ERRORS.has(code)) return m.slot;
  switch (code) {
    case "ORDERS_CLOSED":
      return m.closed;
    case "INVALID_NAME":
      return m.name;
    case "INVALID_ADDRESS":
      return m.address;
    case "DELIVERY_DISABLED":
      return m.deliveryDisabled;
    case "INVALID_PHONE":
      return m.phone;
    case "EMPTY_CART":
      return m.empty;
    case "PRODUCT_UNAVAILABLE":
      return m.unavailable(tr(detail ?? "", lang));
    case "VARIANT_REQUIRED":
      return m.variant(tr(detail ?? "", lang));
    case "PRODUCT_NOT_FOUND":
      return m.notFound;
    case "INVALID_QUANTITY":
    case "TOO_MANY_ITEMS":
      return m.quantity;
    default:
      return m.network;
  }
}

export function isSlotError(raw: string | undefined) {
  return SLOT_ERRORS.has((raw ?? "").split(":")[0]);
}

export function isProductError(raw: string | undefined) {
  const code = (raw ?? "").split(":")[0];
  return code.startsWith("PRODUCT_") || code === "VARIANT_REQUIRED";
}
