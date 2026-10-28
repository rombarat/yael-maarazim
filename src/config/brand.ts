/**
 * Everything that makes this store *this business*.
 * Fill it from the research step (real name, real story, real copy). Never invent facts:
 * if something is unknown, leave it out (null / empty) and the section disappears.
 *
 * Colours and fonts live in src/app/globals.css (@theme) and src/app/layout.tsx.
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
   * The real logo is a round badge with the phone number inside: too tall for the header,
   * so the header uses the name as a wordmark and the badge appears in the footer.
   */
  logo: null as (Img & { width: number; height: number }) | null,
  badge: { src: "/brand/logo.png", alt: "הלוגו של יעל מתוקים באהבה", width: 1421, height: 1469 } as Img & { width: number; height: number },
  /** Square favicon in /public/brand. */
  icon: "/brand/icon.png" as string | null,

  meta: {
    title: "יעל מתוקים באהבה | מארזים מפנקים, עוגות ומגשי אירוח",
    description:
      "מארזי מתוקים, מארזי לידה, עוגות לאירועים, קינוחי חלבון ומגשי אירוח בעבודת יד, בכשרות מהודרת. מזמינים באתר ואוספים.",
  },

  hero: {
    /** Small line above the name: what the business is, in 2–4 words. */
    eyebrow: "מארזים ומתוקים בעבודת יד",
    /** One sentence, written for customers, true to the business. */
    line: "אצלנו הכל נעשה במגע של אהבה, מהחומרים הכי משובחים וטריים, בהתאמה וביחס אישי.",
    /** The strongest real product photo. Shown inside the arch. */
    image: {
      src: "/brand/hero.webp",
      alt: "מארז מפנק עם לב שוקולד לבן, קרם ברולה, ארטיקים מצופים, מקרונים וורד אדום",
      position: "50% 50%",
    } as (Img & { position?: string }) | null,
  },

  /** About section. Only real, sourced facts. null hides the section. */
  story: {
    title: "נעים להכיר, יעל",
    paragraphs: [
      "אני יעל, ואני מכינה מארזים מפנקים, עוגות לאירועים, עיצובי פירות ומגשי אירוח. כל מארז נבנה בעבודת יד, מהחומרים הכי משובחים וטריים, בהתאמה וביחס אישי.",
      "כל המוצרים בכשרות מהודרת.",
      "רוצים משהו מיוחד לאירוע?",
    ],
    image: { src: "/brand/story.webp", alt: "יעל עומדת מאחורי סירת פירות מעוצבת עם השלט של יעל מתוקים באהבה" },
    contactCta: "דברו איתי",
  } as { title: string; paragraphs: string[]; image: Img | null; contactCta?: string } | null,

  /** Footer blurb under the logo. */
  footerBlurb: "מארזים מפנקים, עוגות לאירועים, קינוחי חלבון ומגשי אירוח בעבודת יד. כל המוצרים בכשרות מהודרת.",

  /** Section titles on the home page. */
  home: {
    categoriesTitle: "מה בא לכם?",
    featuredTitle: "האהובים שלנו",
  },

  /**
   * Work that is priced per event and ordered by phone, not through the cart.
   * Shown on the home page with a WhatsApp link.
   */
  custom: {
    title: "בהזמנה אישית",
    intro: "עיצובי פירות, סירות פירות וסדנאות מתוקות מתאימים לכל אירוע בנפרד. ספרו לי מה חוגגים ונבנה את זה יחד.",
    items: [
      {
        title: "עיצובי פירות לאירועים",
        body: "מגשים ועיצובים מפירות העונה, בגדלים לכל אירוע.",
        image: { src: "/brand/custom-fruit.webp", alt: "מגש פירות עגול ומעוצב עם פרחי מלון, אננס ופיטאיה" },
      },
      {
        title: "סירות פירות",
        body: "סירת עץ ארוכה מלאה פירות חתוכים, מרכז שולחן שכולם מדברים עליו.",
        image: { src: "/brand/custom-boat.webp", alt: "סירת פירות ארוכה עם ענבים, מלון, קיווי ותפוחים מגולפים" },
      },
      {
        title: "סדנאות",
        body: "סדנאות פירות ומתוקים לילדים ולמבוגרים: עוגת מספרים, עוגיות מקושטות, קאפקייקס ועוד.",
        image: { src: "/brand/custom-workshop.webp", alt: "משתתפות בסדנה מציגות את מגשי הפירות שהכינו" },
      },
    ],
  },

  /** "How to order" steps. They describe the real flow, so they rarely need changes. */
  howToOrder: [
    { title: "בוחרים מארז או מגש", body: "מארז מתוקים למתנה, עוגה לאירוע או מגשי אירוח לכל המשפחה." },
    { title: "מוסיפים לסל", body: "בוחרים גודל וכמות ורואים את הסכום המלא, בלי הפתעות." },
    { title: "בוחרים מועד איסוף ושולחים", body: "ממלאים שם וטלפון, בוחרים יום ושעה, ואני חוזרת אליכם לאישור." },
  ],

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
