import type { Lang } from "@/i18n";

/**
 * Delivery areas and fees (₪), as Yael set them. The English site has its own list: it serves overseas
 * students (Kerem B'Yavne, Givat Washington), so its first areas and prices differ.
 * `he` is what the order shows in the admin; `en` is the English site's label.
 */
export type DeliveryArea = { id: string; he: string; en: string; fee: number };

const shared: DeliveryArea[] = [
  { id: "gderot", he: "גדרות", en: "Gderot", fee: 35 },
  { id: "gedera", he: "גדרה", en: "Gedera", fee: 40 },
  { id: "nahal-sorek", he: "נחל שורק", en: "Nahal Sorek", fee: 45 },
  { id: "yavne", he: "יבנה", en: "Yavne", fee: 40 },
  { id: "gan-yavne", he: "גן יבנה", en: "Gan Yavne", fee: 40 },
  { id: "kiryat-malakhi", he: "קרית מלאכי", en: "Kiryat Malakhi", fee: 50 },
  { id: "ashdod", he: "אשדוד", en: "Ashdod", fee: 50 },
];

export const deliveryAreas: Record<Lang, DeliveryArea[]> = {
  he: [
    { id: "kvutzat-yavne", he: "קבוצת יבנה", en: "Kvutzat Yavne", fee: 15 },
    { id: "givat-washington", he: "גבעת וושינגטון", en: "Givat Washington", fee: 15 },
    ...shared,
  ],
  en: [
    { id: "kerem-beyavne", he: "כרם ביבנה", en: "Kerem B'Yavne", fee: 20 },
    { id: "givat-washington", he: "גבעת וושינגטון", en: "Givat Washington", fee: 25 },
    ...shared,
  ],
};

export function findDeliveryArea(lang: Lang, id: string | null | undefined) {
  return deliveryAreas[lang].find((a) => a.id === id) ?? null;
}

/**
 * The first line of a delivery order's notes, in Hebrew for the owner: "משלוח לגדרה: ₪40".
 * The order total in the database is the items only, so this line is also where the fee is read back from.
 */
export function deliveryNoteLine(area: DeliveryArea, fromEnglishSite: boolean) {
  return `משלוח ל${area.he}: ₪${area.fee}${fromEnglishSite ? " (הזמנה מהאתר באנגלית)" : ""}`;
}

export function deliveryFeeFromNotes(notes: string) {
  const m = notes.match(/^משלוח ל.+?: ₪(\d+(?:\.\d+)?)/);
  return m ? Number(m[1]) : 0;
}
