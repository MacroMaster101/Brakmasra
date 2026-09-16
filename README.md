# BRAKMASRA

Official BRAKMASRA merchandise storefront built with Next.js 16, React 19, TypeScript, Supabase, Drizzle, and Vitest.

The public launch configuration is deliberately safe: visitors can browse the site and upcoming collection, while member access, cart, checkout, and purchasing show branded coming-soon states. The completed authentication and commerce foundations remain behind explicit feature flags for later activation.

## Included

- Responsive home, shop, product, about, contact, account, cart, checkout, authentication, admin, 404, sitemap, robots, manifest, and social-card routes
- Public coming-soon states for unfinished account and purchasing journeys
- Supabase PostgreSQL schema and migrations with row-level security
- Server-validated contact and newsletter endpoints with honeypots, origin checks, payload limits, and rate limiting
- Supabase email/password and Google authentication foundation, disabled by default
- Local cart and guarded checkout adapter boundary, disabled by default
- Content security policy, security headers, accessible focus states, responsive layouts, and reduced-motion support
- Route loading states plus a first-visit loading experience

## Local setup

Requirements: Node.js 20.9 or newer and npm.

```bash
npm install
copy .env.example .env
npm run dev
```

Open `http://localhost:3000`.

## Launch gate

The safe production defaults are:

```env
BRAKMASRA_LAUNCH_MODE=on
AUTH_DEMO_MODE=
```

Keep `BRAKMASRA_LAUNCH_MODE=on` for the public coming-soon release. It is a server-only, fail-safe gate: `on` or a missing value shows launch-status pages for authentication, account, cart, checkout, and purchasing. Set it to `off` to restore every completed implementation.

For a local account preview, set `BRAKMASRA_LAUNCH_MODE=off` and `AUTH_DEMO_MODE=on`. This creates a fake member session without calling Supabase. Demo mode only works in development and is ignored when `NODE_ENV=production`.

The checkout API also fails closed while commerce is disabled, so a direct request cannot start an unfinished payment flow.

## Environment

Copy `.env.example` and provide only the values used by the selected deployment:

- `NEXT_PUBLIC_SITE_URL`: exact canonical production origin, such as `https://brakmasra.com`
- `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY`: Supabase project access
- `DATABASE_URL`: server-only Supabase PostgreSQL pooler URL for Drizzle tooling
- `BRAKMASRA_LAUNCH_MODE`: server-only gate for all unfinished public routes
- `AUTH_DEMO_MODE`: development-only fake member session
- Stripe, email, social, and analytics values are reserved for their corresponding integrations

Never expose database, Supabase secret, Stripe secret, webhook, or email credentials through a `NEXT_PUBLIC_` variable.

## Supabase and Drizzle

Supabase CLI owns the production migration history in `supabase/migrations/`. Link the project and apply pending migrations:

```bash
supabase link --project-ref YOUR_PROJECT_REF
supabase migration list
supabase db push
```

Drizzle provides typed schema tooling through `db/schema.ts` and `drizzle.config.ts`. `DATABASE_URL` is required only for Drizzle commands such as `npm run db:studio`.

The contact and newsletter endpoints use the server-only Supabase client. Without valid Supabase variables, the public pages still render and those forms return a controlled unavailable response.

## Authentication activation

Before enabling authentication:

1. Configure the deployed URL as the Supabase Auth Site URL.
2. Add local and production `/auth/confirm` URLs to the allowed redirect list.
3. Configure custom SMTP for confirmation and password-reset messages.
4. Configure the Google OAuth client and enable Google in Supabase.
5. Test sign-up, confirmation, login, logout, password recovery, and session refresh on the production domain.
6. Set `BRAKMASRA_LAUNCH_MODE=off` and redeploy only after the commerce checklist is also complete.

## Commerce activation

Before enabling commerce:

1. Replace the launch catalogue with verified database records and final photography.
2. Verify prices, variants, inventory, shipping, tax, returns, privacy, and terms.
3. Connect a payment provider with server-created sessions and signed webhooks.
4. Reload every price and stock value on the server before payment.
5. Add idempotency and transactional inventory updates.
6. Complete a real sandbox order and refund test.
7. Set `BRAKMASRA_LAUNCH_MODE=off` and redeploy only after the authentication checklist is also complete.

Raw payment card data must never pass through this application.

## Deployment checklist

1. Set the exact production `NEXT_PUBLIC_SITE_URL`.
2. Keep `BRAKMASRA_LAUNCH_MODE=on` and `AUTH_DEMO_MODE` empty for the coming-soon release.
3. Add Supabase variables if contact and newsletter capture should be live.
4. Run the migrations already included in `supabase/migrations/`.
5. Add approved privacy text before collecting newsletter subscriptions.
6. Run the complete quality gate below.
7. Deploy the build output on Vercel or another Next.js-compatible Node platform.
8. Verify `/`, `/shop`, a product page, `/login`, `/cart`, `/checkout`, `/robots.txt`, and `/sitemap.xml` on the production domain.

## Quality gate

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

The ignored `.env`, `.env.backup`, `.next`, `node_modules`, and TypeScript build-info files are local-only and must not be committed.

## Visual assets

The hero, account artwork, and product photography in `public/images/` were created for this storefront. `public/images/brakmasra-logo-reference.png` is the supplied brand artwork and can be replaced with the final transparent logo without changing the page structure.
