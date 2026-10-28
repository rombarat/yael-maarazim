# יעל מתוקים באהבה: design

Brief: a home business in the Gedera/Yavne area making gift boxes of sweets, birth packages, event and number
cakes, mousse and cheese cakes, protein desserts, hosting trays, fruit designs and workshops. Customers order
gifts and food for events, mostly from their phone. Yael asked for one simple page that shows everything she
offers, sorted by category, like her printed catalog.

## Structure (one page)
1. Header: the real logo badge next to the name, and the cart.
2. Short intro: one sentence (h1), delivery or pickup, lead time, phone. No hero photo.
3. Sticky category chips that follow the scroll.
4. Every category with all its products. Details (sizes, quantity) open in a dialog over the page.
5. "נעים להכיר" with WhatsApp and phone, then the footer (hours, social, legal pages).

Other routes are only what ordering needs: checkout, order confirmation, legal pages. `/shop` and
`/product/<id>` redirect to the page (the product link opens its dialog).

## Ordering by WhatsApp instead of the cart
- Categories listed in `brand.contactCategories` (workshops): every item shows "לתיאום בוואטסאפ".
- Any product with price 0 and no options shows "מחיר בתיאום" and the WhatsApp button. Once the owner
  sets a price in the admin it becomes a normal cart item (used for the fruit designs until prices are set).

## Tokens (`.store` in src/app/globals.css, storefront only; the admin keeps `@theme`)
| Token | Value | Source |
|---|---|---|
| paper | #ffffff | the logo badge's white; photos stay true |
| ink | #231f20 | the logo's black line drawings |
| brand | #c4262c | logo red (#db3736) darkened for 5.7:1 on white |
| blush | #fdeeee | the logo's pink hearts (about block, hovers) |
| success | #3f6b2a | the grass the boxes are photographed on (tags) |
| surface / line / muted | #f7f2f1 / #ece3e2 / #6b6061 | quiet neutrals, muted is 6:1 |

## Type
Fredoka (rounded, close to the logo lettering) for the name, headings and prices; Assistant for text.
Both with Hebrew subsets. The admin keeps Suez One + Rubik.

## The one bold thing
Category names in large red Fredoka, followed by the curl-and-heart from the logo's border. Everything else
stays quiet: no card borders or shadows, no entrance animations.

## English
A button in the header switches the storefront to English (a `lang` cookie; the store wrapper gets
`lang="en" dir="ltr"`). The admin never reads it and stays Hebrew.
- UI text: `src/i18n/messages.ts` (Hebrew and English side by side).
- Catalog text: `src/i18n/catalog-en.ts`, keyed by the exact Hebrew text. A product the owner adds or
  edits shows its Hebrew text on the English site until an English line is added there.
- Orders are stored with the Hebrew product names, so the admin reads them as before.
- Legal pages stay in Hebrew, with a one-line note on the English site.
