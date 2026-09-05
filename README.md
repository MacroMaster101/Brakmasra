# BRAKMASRA

Official creator hub and merch-store foundation for the BRAKMASRA YouTube channel. The interface translates the label-inspired visual language into a fast, accessible dark-luxury experience: pitch-black surfaces, cold white typography, fine blood-red ornaments, and cinematic exploration imagery.

## What is included

- Home, videos, video detail, shorts, playlists, about, contact, shop, product, cart, checkout, admin, 404, sitemap, robots, and generated social card routes
- Verified fallback channel snapshot for `@Brakmasra`; server-side YouTube Data API refresh with hourly caching, durations and view counts, and a hard daily quota ceiling
- Product/variant-ready Supabase PostgreSQL schema with RLS, deliberately empty merch catalog, local cart, and guarded checkout adapter boundary
- Contact/newsletter endpoints with validation, honeypots, origin checks, size limits, and basic rate limiting
- CSP and modern security headers, semantic navigation, keyboard focus, reduced-motion handling, responsive layouts, and JSON-LD
- Tailwind v4 utilities layered over the original stylesheet, with scroll reveals, a rounded shape system, and a redesigned footer
- Vitest tests for public-data and cart helpers

## Brand system

| Token | Value |
| --- | --- |
| Background | `#050505` |
| Secondary background | `#0D0D0D` |
| Surface | `#151515` |
| Dark red | `#7A0000` |
| Primary red | `#B0000B` |
| Bright crimson | `#E01616` |
| Cold white | `#F2F2F0` |
| Silver | `#B7B7B7` |
| Ash | `#777777` |
| Border | `#3A0A0A` |

The display face uses the bundled system serif stack to avoid a render-blocking third-party font request. Body copy uses a local system sans stack.

## Local setup

Requirements: Node.js 20.9+ and npm.

```bash
npm install
copy .env.example .env
npm run dev
```

Open `http://localhost:3000`. Without environment variables the public site still renders from its verified channel snapshot; database writes, admin sessions, email delivery, and checkout are intentionally unavailable.

## Environment variables

See `.env.example` for every key. Important groups:

- `NEXT_PUBLIC_SITE_URL`: canonical production origin
- `YOUTUBE_API_KEY`, `YOUTUBE_CHANNEL_ID`: server-only channel refresh
- `SUPABASE_URL`, `SUPABASE_SECRET_KEY`: server-only Supabase Data API access
- `DATABASE_URL`: Supabase PostgreSQL pooled/direct connection for migrations and transactions
- `YOUTUBE_DAILY_CALL_BUDGET`, `YOUTUBE_REVALIDATE_SECONDS`: optional upstream quota ceiling and cache lifetime
- `SESSION_SECRET`, `ADMIN_EMAIL`, `ADMIN_PASSWORD_HASH`: admin authentication adapter
- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`: payment adapter
- `EMAIL_*`: contact/newsletter delivery
- optional approved social/support URLs

Never expose `YOUTUBE_API_KEY`, database, session, Stripe secret, webhook, or email credentials through `NEXT_PUBLIC_*` variables.

## YouTube integration

`lib/youtube.ts` requests channel statistics and uploads from the official YouTube Data API when configured, enriches each video with its duration and view count via `videos.list`, caches the result with Next.js revalidation, and falls back to `data/channel.ts` when the API is unavailable. The snapshot was collected from the public channel on 2026-08-22. Update it when content changes; no background scraper ships with the app.

One refresh costs 3 API units against the default 10,000/day allowance, so hourly caching uses roughly 72 units per day. A shared daily ceiling (`YOUTUBE_DAILY_CALL_BUDGET`, default 200 calls) plus a 15-minute cooldown after any upstream failure keep a stampede or a bad key from exhausting the quota; the snapshot is served whenever the budget is spent.

## Database and merch

Create a Supabase project, then apply `db/migrations/0001_initial.sql`, `db/migrations/0002_supabase_rls.sql`, and `db/migrations/0003_rate_limits.sql` using the Supabase SQL editor or CLI. The second migration enables RLS on every public table, removes browser-role access, and grants the server role access. Add `SUPABASE_URL` and the project secret key to `.env`; never expose that key through a `NEXT_PUBLIC_` variable. Keep `DATABASE_URL` for migrations and future transactional checkout operations.

The contact and newsletter endpoints now persist validated submissions through the server-only Supabase client. Products are not seeded because no verified merch catalog, photography, prices, inventory, shipping rules, or tax nexus was supplied. Add real product records and images before enabling checkout.

## Payments and checkout

The checkout endpoint validates the request and fails closed until a payment adapter and credentials are configured. Production implementation must load prices and stock from PostgreSQL, create the payment session server-side, verify signed webhooks, enforce idempotency, and decrement inventory transactionally. Raw card data must never touch this application.

## Admin

`/admin` is absent from public navigation and currently shows the integration checklist. Before production, connect server-side authentication with HTTP-only secure cookies, rotation/expiry, CSRF protection, rate limits, audit logs, and MFA.

## Scripts

```bash
npm run dev
npm run lint
npm run typecheck
npm test
npm run build
```

## Security, privacy, and deployment

- `next.config.ts` defines CSP, clickjacking, MIME-sniffing, referrer, permissions, and transport headers.
- Do not cache cart, checkout, admin, or private API responses at a CDN.
- Rate limiting is backed by PostgreSQL (`db/migrations/0003_rate_limits.sql`) so every instance shares one budget. Without Supabase configured it degrades to an in-memory counter that bounds a single instance only, so apply that migration before a multi-instance deployment.
- Add privacy, returns, shipping, and terms policies approved for the actual business and jurisdiction before accepting orders or newsletter subscriptions.
- On Vercel, set secrets separately for Preview and Production, configure the payment webhook to the production origin, run the SQL migration, and verify email DNS.

## Generated visual asset

`public/images/brakmasra-hero.png` was generated specifically for this project with OpenAI's built-in image generation tool. Final prompt: “an original cinematic Sri Lankan-inspired haunted exploration landscape at night, decaying colonial manor, tropical forest, fog, distant red moon, dark negative space for copy; pitch black, charcoal, silver, restrained blood red; no people, text, copyrighted characters, gore, neon, Halloween props, or watermark.”

## Production status

The public site — home, videos, shorts, playlists, about, contact — is complete and
runs on live channel data. The commerce and account surfaces are deliberately
inert until the owner supplies the pieces only they can provide:

| Area | Status |
| --- | --- |
| Public site, navigation, SEO, security headers | Ready |
| YouTube integration (live stats, durations, view counts, quota guard) | Ready |
| Contact and newsletter capture | Ready once Supabase is configured |
| Rate limiting | Shared via PostgreSQL once migration 0003 is applied |
| Merch catalog | Needs real products, photography, prices, inventory |
| Payments and webhooks | Needs a payment provider and verified credentials |
| Transactional email | Needs a provider and verified sending domain |
| Admin authentication | Needs a session provider, MFA, audit logging |
| Legal policies | Needs privacy, returns, shipping, and terms approved for the business |

**Do not accept orders or newsletter subscriptions until the last five rows are
complete.** The credential-free application shell can be built, reviewed, and
deployed as a content site now.
