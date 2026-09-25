<div align="center">
  <img src="public/images/logo.png" alt="BRAKMASRA Logo" width="148" />

  # 🌟 BRAKMASRA 🌟

  **The Official BRAKMASRA Merchandise Storefront**

  [![Next.js](https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
  [![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
  [![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
  [![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)
  [![Drizzle](https://img.shields.io/badge/Drizzle_ORM-C5F74F?style=for-the-badge&logo=drizzle&logoColor=black)](https://orm.drizzle.team/)
  [![Vitest](https://img.shields.io/badge/Vitest-729B1B?style=for-the-badge&logo=vitest&logoColor=white)](https://vitest.dev/)
</div>

<br />

Welcome to the **BRAKMASRA** source repository! 🚀 This is a high-performance, dark-luxury e-commerce platform built natively on Next.js 16.

> 🔒 **Public Launch State**: The site is currently configured in a safe launch mode (`BRAKMASRA_LAUNCH_MODE=on`). Visitors can browse the upcoming collection, but member access, cart, checkout, and purchasing are locked behind branded "coming soon" gates. The fully completed authentication and commerce foundations remain safely behind feature flags until you are ready to drop!

---

## ✨ Features Included

- 📱 **Fully Responsive:** Beautifully crafted pages for Home, Shop, Product, About, Contact, Account, Cart, Checkout, Auth, and Admin.
- 🚧 **Launch Gates:** Polished "coming soon" overlays for unfinished purchasing journeys to build hype safely.
- 🗄️ **Secure Data:** Supabase PostgreSQL schema & Drizzle migrations, fortified with Row-Level Security (RLS).
- 🛡️ **Hardened APIs:** Server-validated endpoints with Zod, honeypots, strict origin checks, and robust rate limiting.
- 🔐 **Authentication Ready:** Complete Supabase Email/Password and Google OAuth foundations (currently disabled for safety).
- 🛒 **Commerce Core:** Local cart state and a guarded checkout adapter boundary.
- ♿ **Accessibility & SEO:** Content Security Policy (CSP), security headers, accessible focus states, reduced-motion support, sitemap, robots.txt, and dynamic social cards.
- ⚡ **Sleek UX:** Silky smooth route loading states and an immersive first-visit loader.

---

## 🛠️ Local Development

Get up and running in seconds. Requirements: **Node.js 20.9+** & **npm**.

```bash
# 1. Install dependencies
npm install

# 2. Setup your local environment
copy .env.example .env

# 3. Spin up the dev server
npm run dev
```

🌐 Open [http://localhost:3000](http://localhost:3000) and enjoy the vibes.

---

## 🚦 Launch Gate System

Your production environment comes with a built-in safety net:

```env
BRAKMASRA_LAUNCH_MODE=on
AUTH_DEMO_MODE=
```

- **`BRAKMASRA_LAUNCH_MODE=on`**: Enables the public "coming-soon" release. It is a server-only fail-safe that blocks access to authentication, cart, checkout, and purchasing.
- **`BRAKMASRA_LAUNCH_MODE=off`**: Flips the switch! Unlocks the complete e-commerce experience.
- **`AUTH_DEMO_MODE=on`**: For local testing only! With launch mode off, it creates a fake member session without hitting Supabase. (Automatically disabled in production).

---

## 🔑 Environment Variables

Check `.env.example` to see exactly what you need. **Never commit your `.env` file!**

🔑 **Required for Production:**
- `NEXT_PUBLIC_SITE_URL`: Your exact domain (e.g., `https://brakmasra.com`)
- `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY`
- `DATABASE_URL`: Server-only PostgreSQL pooler URL for Drizzle
- `BRAKMASRA_LAUNCH_MODE`: Controls the launch gate.

> ⚠️ **SECURITY WARNING:** Never expose database URLs, Supabase secret keys, Stripe secrets, or email credentials through a `NEXT_PUBLIC_` variable!

---

## 🗃️ Database (Supabase + Drizzle)

The Supabase CLI manages migration history in `supabase/migrations/`. 

```bash
# Link your project & push migrations
supabase link --project-ref YOUR_PROJECT_REF
supabase db push
```

We use **Drizzle ORM** for incredible type-safe schema tooling (`db/schema.ts`). Need to view the DB locally? Just run:
```bash
npm run db:studio
```

---

## 🚀 Deployment Checklist

Before going live on **Vercel**, ensure you have:
1. [x] Set the exact `NEXT_PUBLIC_SITE_URL`.
2. [x] Set `BRAKMASRA_LAUNCH_MODE=on` for the hype phase.
3. [x] Added all Supabase variables in your Vercel settings so contact & newsletter forms work.
4. [x] Pushed all migrations to your live Supabase database.
5. [x] Verified all routes (`/`, `/shop`, `/login`, etc.) are behaving securely.

---

## 🧪 Quality Gate

Run this command suite before committing to ensure pristine code quality:

```bash
npm run lint       # ESLint check
npm run typecheck  # TypeScript validation
npm test           # Vitest unit tests
npm run build      # Next.js production build
```

---

## 🎨 Visual Assets

All bespoke hero images, account artwork, and product photography live in `public/images/`. The official brand mark is `logo.png`.
