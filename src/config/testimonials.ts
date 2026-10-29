/**
 * "לקוחות מספרים" on the home page, per language. The section stays hidden while a list is empty.
 * Only real customer words, as the owner sends them; `name` is optional (first name or initials).
 */
export type Testimonial = { text: string; name?: string };

export const testimonials: Record<"he" | "en", Testimonial[]> = {
  he: [],
  en: [],
};
