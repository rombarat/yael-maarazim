# יעל מתוקים באהבה: design

Brief: a home business in the Gedera/Yavne area making gift boxes of sweets, birth packages, event and number
cakes, protein desserts, hosting trays and fruit designs. Customers order gifts and food for events, mostly
from their phone. The real photos are bright, colourful boxes on wood or grass; the logo is a red heart-and-whisk
badge with black line drawings.

## Tokens (src/app/globals.css)
| Token | Value | Source |
|---|---|---|
| ink | #2b1a1a | logo black, warmed toward the red |
| brand | #cf3232 | logo red (#db3736) darkened a touch for 5:1 on white |
| brand-dark | #a8262a | hover/pressed |
| accent | #e08b8b | logo's pink hearts (step numerals only) |
| success | #4f6b32 | the grass the boxes are photographed on |
| alert | #a3204e | berry, so the cart badge differs from the red buttons |
| paper / surface / line | #fffaf7 / #fbeeea / #f0dcd6 | blush whites, photos stay true |
| muted | #7a5d5a | 5.7:1 on paper |

## Type
Suez One (display, heavy, close to the logo lettering) + Rubik (UI and body). Both with Hebrew subsets.

## Layout
- Header: the name as a red wordmark (the real logo is a tall badge with the phone inside, so it lives in the footer).
- Hero: arch with the rose / white-heart / brûlée box.
- Seven category tiles (one row on desktop), favourites grid, "בהזמנה אישית" for work priced per event
  (fruit designs, fruit boats, workshops) with WhatsApp links, Yael's story with her real photo.

## Principles
1. Photos sell; type and colour stay quiet.
2. Only facts from the catalog and Drive photos. Unknowns are editable in the admin.
3. Pickup or delivery is chosen at checkout; delivery fee is arranged by phone (as in the catalog).
4. Legal pages read live contact details from the settings, so they never go stale.
