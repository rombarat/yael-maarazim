import type { BusinessSettings, Category, Product } from "@/lib/types";
import { catalogEn } from "./catalog-en";
import type { Lang } from "./index";

/** Catalog or settings text in the given language (Hebrew, or the stored Hebrew when no English exists). */
export function tr(text: string, lang: Lang) {
  return lang === "en" ? (catalogEn[text.trim()] ?? text) : text;
}

export function localizeProduct<P extends Pick<Product, "name" | "description" | "unit_label" | "tags" | "variants">>(p: P, lang: Lang): P {
  if (lang === "he") return p;
  return {
    ...p,
    name: tr(p.name, lang),
    description: tr(p.description, lang),
    unit_label: tr(p.unit_label, lang),
    tags: p.tags.map((t) => tr(t, lang)),
    variants: p.variants.map((v) => ({ ...v, label: tr(v.label, lang) })),
  };
}

export function localizeCategory<C extends Pick<Category, "name">>(c: C, lang: Lang): C {
  return lang === "he" ? c : { ...c, name: tr(c.name, lang) };
}

export function localizeSettings(s: BusinessSettings, lang: Lang): BusinessSettings {
  if (lang === "he") return s;
  return {
    ...s,
    pickup_notes: tr(s.pickup_notes, lang),
    delivery_notes: tr(s.delivery_notes, lang),
    closed_message: tr(s.closed_message, lang),
  };
}
