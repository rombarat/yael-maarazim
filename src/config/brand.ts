/**
 * Everything that makes this store *this business*.
 * Fill it from the research step (real name, real story, real copy). Never invent facts:
 * if something is unknown, leave it out (null / empty) and the section disappears.
 *
 * Colours and fonts live in src/app/globals.css (@theme for the admin, .store for the storefront)
 * and src/app/layout.tsx.
 * Contact details, hours and pickup rules live in the database (admin → settings),
 * so the owner can change them without a developer.
 */

type Img = { src: string; alt: string; width?: number; height?: number };

export const brand = {
  /** Shown in the header when there is no logo, in titles and in the footer. */
  name: "יעל מתוקים באהבה",
  /** Who greets in the admin ("בוקר טוב, <ownerName>"). Empty → no name. */
  ownerName: "יעל",

  /**
   * Admin wordmark. null → the name in the display face. The storefront header shows the badge
   * (the real round logo) next to the name instead.
   */
  logo: null as (Img & { width: number; height: number }) | null,
  badge: { src: "/brand/logo.png", alt: "הלוגו של יעל מתוקים באהבה", width: 1421, height: 1469 } as Img & { width: number; height: number },
  /** Square favicon in /public/brand. */
  icon: "/brand/icon.png" as string | null,

  meta: {
    title: "יעל מתוקים באהבה | מארזים, עוגות, מגשי אירוח ועיצובי פירות",
    description:
      "מארזי מתוקים, מארזי לידה, עוגות לאירועים, קינוחי חלבון, מגשי אירוח, עיצובי פירות וסדנאות, בעבודת יד ובכשרות מהודרת. משלוחים או איסוף עצמי.",
  },

  /** Top of the page, under the header: what she makes, in one sentence (the page's h1). */
  intro: {
    title: "מארזים, עוגות, מגשי אירוח ועיצובי פירות, בעבודת יד ובאהבה",
    line: "כל המוצרים בכשרות מהודרת, מהחומרים הכי משובחים וטריים.",
  },

  /**
   * Categories ordered by talking to Yael rather than through the cart (workshops are tailored to each group).
   * Matched by category name. A product with price 0 is also "price on request", in any category.
   */
  contactCategories: ["סדנאות"],

  /** Short "about" block at the end of the page. null hides it. */
  story: {
    title: "נעים להכיר, יעל",
    paragraphs: [
      "אני יעל, ואני מכינה מארזים מפנקים, עוגות לאירועים, עיצובי פירות ומגשי אירוח, ומעבירה סדנאות. כל הזמנה נבנית בעבודת יד, בהתאמה וביחס אישי.",
    ],
    image: { src: "/brand/story.webp", alt: "יעל עומדת מאחורי סירת פירות מעוצבת עם השלט של יעל מתוקים באהבה" },
  } as { title: string; paragraphs: string[]; image: Img | null } | null,

  /** Footer line under the name. */
  footerBlurb: "מארזים מפנקים, עוגות לאירועים, קינוחי חלבון, מגשי אירוח ועיצובי פירות בעבודת יד. כל המוצרים בכשרות מהודרת.",

  /** Quick tags offered in the product form (dietary info etc.). */
  productTagPresets: ["חלבי", "פרווה", "מינימום סוכר", "מינימום פחמימות", "עשיר בחלבון", "בעונה"],

  /** Placeholder examples in admin forms, to match the business vocabulary. */
  examples: {
    productName: "למשל: מארז לב בריבוע",
    unitLabel: "למשל: קופסה 25×25 ס״מ, מגש, 12 יחידות",
    categoryName: "למשל: מארזי לידה",
  },

  /** Details for the legal pages (privacy, terms, accessibility). */
  legal: {
    /** Trade name shown in the terms. */
    operator: "יעל מתוקים באהבה",
    /**
     * Consumer Protection Law §14ג requires the seller's legal name, ID / business number and address
     * in distance sales. Fill these in before going live; empty fields are simply not shown.
     */
    ownerLegalName: "יעל שהם",
    businessId: "038597266",
    businessAddress: "כרם ביבנה",
    lastUpdated: "27 באוקטובר 2026",
    /** Delivery area, shown only while deliveries are switched on in the admin. */
    serviceArea: "גדרה, יבנה, חבל יבנה, נחל שורק והסביבה",
  },
};

export const ownerGreetingName = brand.ownerName ? `, ${brand.ownerName}` : "";
