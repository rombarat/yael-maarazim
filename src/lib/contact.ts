import { brand } from "@/config/brand";
import { whatsappHref } from "./format";
import type { Product } from "./types";

/**
 * Products ordered by talking to Yael instead of through the cart: everything in a contact category
 * (workshops), and anything with price 0 and no options ("price on request" until the owner sets one).
 */
export function isContactOnly(product: Pick<Product, "price" | "variants">, categoryName?: string | null) {
  if (categoryName && brand.contactCategories.includes(categoryName)) return true;
  return product.variants.length === 0 && Number(product.price) === 0;
}

/** WhatsApp chat with a first message already typed. */
export function whatsappMessageHref(phone: string, text: string) {
  return `${whatsappHref(phone)}?text=${encodeURIComponent(text)}`;
}

export function productInquiry(productName: string) {
  return `היי ${brand.ownerName}, אשמח לפרטים על ${productName}`;
}
