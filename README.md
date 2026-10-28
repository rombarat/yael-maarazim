# Online store + admin

Hebrew/RTL store with pickup ordering and an owner admin panel. Next.js 15, Postgres
(Neon in production, PGlite locally — no account needed to start).

## Start locally
```bash
npm install
npm run setup                                  # tables + seed/catalog.json
npm run admin:create -- you@example.com a-strong-password
npm run dev                                    # http://localhost:3000, admin at /admin
```
Stop `npm run dev` before running other `npm run db:*` commands against the local database.

## Make it a business
- `src/config/brand.ts` — name, copy, logo, hero/story photos
- `src/app/globals.css` (`@theme`) — colours; `src/app/layout.tsx` — fonts
- `seed/catalog.json` + `seed/images/` — products, categories, hours, contact
- `public/brand/` — logo, icon, hero and story photos

## Commands
| Command | What it does |
|---|---|
| `npm run db:setup` | create/upgrade tables (safe to re-run) |
| `npm run db:seed` | replace the catalog from `seed/` (keeps orders) |
| `npm run db:reset` | catalog + delete orders + sample orders |
| `npm run admin:create -- <email> <password>` | create an admin or reset its password |

## Environment
See `.env.example`: `DATABASE_URL` (Neon), `AUTH_SECRET` (required in production),
`NEXT_PUBLIC_DEMO_MODE` + `CRON_SECRET` (showcase deployment only).
