/**
 * Storefront language. Hebrew is the default; English is a cookie the header button sets.
 * The admin is Hebrew only and never reads it.
 */
export type Lang = "he" | "en";

export const LANG_COOKIE = "lang";

export function toLang(value: string | undefined | null): Lang {
  return value === "en" ? "en" : "he";
}

export const dirOf = (lang: Lang) => (lang === "en" ? "ltr" : "rtl");
