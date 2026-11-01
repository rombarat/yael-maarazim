/**
 * "לקוחות מספרים" on the home page, per language. The section stays hidden while a list is empty.
 * Only real customer words, as the owner sends them: a quote (`text`, optional `name`), or a screenshot of
 * the message (`image`, files in public/testimonials/), or both.
 */
export type Testimonial = { text?: string; name?: string; image?: { src: string; alt: string; width: number; height: number } };

export const testimonials: Record<"he" | "en", Testimonial[]> = {
  he: [],
  en: [],
};
