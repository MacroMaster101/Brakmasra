# Store-Only Site Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the BRAKMASRA creator hub into a store-only website — Home (store landing), Shop, Product, Cart, Checkout, About, Contact — with every YouTube feature, route, API call, env var, CSP host, and link removed.

**Architecture:** Phase 1 removes YouTube and repositions the existing pages around the store. New small data modules (`data/site.ts`, `data/navigation.ts`, `lib/contact-topics.ts`, `lib/contact.ts`) replace `data/channel.ts`. A source-scanning guard test stops YouTube code from coming back. Phase 2 finishes the storefront UI that is still stubbed today (product grid, product detail page, add-to-cart), driven by `data/products.ts` and pure helpers in `lib/catalog.ts`. Each phase ends with a green `lint` / `typecheck` / `test` / `build`.

**Tech Stack:** Next.js 16 (App Router), React 19, TypeScript 6, Tailwind v4 utilities layered over `app/globals.css`, zod 4, Vitest 5 (node environment), Supabase (unchanged).

**Spec:** No separate spec document. The requirements are the owner's request of 2026-09-11 ("store only, plus about and contact pages, no YouTube things") and the **Decisions** section below.

## Decisions (defaults — the owner can flip any before execution)

| # | Decision | Default in this plan |
| --- | --- | --- |
| D1 | Primary navigation | Home · Shop · About · Contact, plus the cart icon. The YouTube "Subscribe" button and the header video-search icon are removed. |
| D2 | Brand look | Keep the dark-luxury design, hero image, and BRAKMASRA sigil. The channel story is retold as the *brand* story on About, with no YouTube mention. |
| D3 | Newsletter | Keep it, reworded as merch-drop alerts. |
| D4 | Social links | Keep optional TikTok / Facebook / X links (env-driven). Remove the YouTube link. |
| D5 | Contact topics | `General inquiry`, `Order support`, `Business inquiry`. `Sponsorship` (a channel topic) is removed. |
| D6 | Old URLs `/videos`, `/shorts`, `/playlists` | Return the existing 404 page. No redirects (add a `redirects()` entry to `next.config.ts` later if the site was already indexed). |
| D7 | Legal pages (shipping, returns, privacy, terms) | Out of scope: they need owner-approved text. Required before accepting orders (see README). |
| D8 | Database migrations | Untouched. Already-applied migrations are never edited; the leftover `featured_content.kind` values and a comment in `0003` are harmless. |

## Global Constraints

- Before claiming any task done: `npm run lint`, `npm run typecheck`, `npm test`, `npm run build` must all pass (from `CLAUDE.md`).
- **Never run `git commit` or `git push`.** The owner commits. At each **Checkpoint** step, list the changed files and a suggested commit message, then stop. Never add `Co-Authored-By` trailers.
- 2-space indent, LF line endings, final newline (`.editorconfig`).
- Server-only secrets never get a `NEXT_PUBLIC_` prefix.
- Keep all security headers in `next.config.ts` (CSP, `X-Frame-Options: DENY`, `nosniff`, HSTS, Referrer-Policy, Permissions-Policy).
- Keep zod validation plus the honeypot, origin, size, and rate-limit guards on `/api/contact` and `/api/newsletter`.
- Payment, email, and admin adapters stay fail-closed. No fake integrations, no hardcoded secrets.
- Never invent products. `data/products.ts` stays empty; test fixtures live only in `tests/`.
- Product prices are **minor units** (e.g. `850000` = LKR 8,500.00), matching `lib/cart.ts` `formatMoney` and the DB `price_minor` columns.
- Product photos must live under `public/` (e.g. `/products/<slug>/front.jpg`). A remote image host must be added to **both** `images.remotePatterns` and CSP `img-src` together.
- JSX text must use curly quotes/apostrophes (`’ “ ”`). Straight `'` or `"` in JSX text fails `react/no-unescaped-entities`.
- Do not import `zod` into client components (bundle size). That is why `lib/contact-topics.ts` is split from `lib/contact.ts`.

## File Map

| Action | Path | Responsibility |
| --- | --- | --- |
| Create | `data/site.ts` | Brand identity strings and env-driven social links |
| Create | `data/navigation.ts` | Header and footer link lists |
| Create | `lib/contact-topics.ts` | Contact topic list (client-safe, no zod) |
| Create | `lib/contact.ts` | Contact zod schema (server) |
| Create | `lib/catalog.ts` | Product lookup, search, and variant → cart-line builder |
| Create | `components/product-card.tsx` | Product tile |
| Create | `components/shop-catalog.tsx` | Client search and grid for `/shop` |
| Create | `components/add-to-cart.tsx` | Client size/color/qty form on the product page |
| Create | `tests/site.test.ts`, `tests/navigation.test.ts`, `tests/contact.test.ts`, `tests/sitemap.test.ts`, `tests/security-headers.test.ts`, `tests/store-only.test.ts`, `tests/catalog.test.ts` | Specs |
| Modify | `components/header.tsx`, `components/footer.tsx`, `components/contact-form.tsx` | Store navigation, no YouTube |
| Modify | `app/page.tsx`, `app/about/page.tsx`, `app/contact/page.tsx`, `app/not-found.tsx`, `app/layout.tsx`, `app/manifest.ts`, `app/opengraph-image.tsx`, `app/sitemap.ts` | Store copy, metadata, SEO |
| Modify | `app/api/contact/route.ts` | Use the shared schema |
| Modify | `app/shop/page.tsx`, `app/shop/[slug]/page.tsx` | Real storefront |
| Modify | `next.config.ts`, `.env.example`, `app/globals.css`, `README.md` | Remove YouTube hosts, env vars, styles, docs |
| Delete | `app/videos/` (both pages), `app/shorts/`, `app/playlists/`, `app/api/youtube/`, `lib/youtube.ts`, `data/channel.ts`, `components/video-card.tsx`, `components/video-search.tsx`, `tests/channel.test.ts` | YouTube integration |

---

# Phase 1 — Store-only conversion

### Task 1: Site identity and navigation data

**Files:**
- Create: `data/site.ts`
- Create: `data/navigation.ts`
- Test: `tests/site.test.ts`, `tests/navigation.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `site: { name: string; tagline: string; slogan: string; description: string; summary: string }`
  - `type SocialLink = { label: string; handle: string; href: string }`
  - `buildSocialLinks(env: Record<string, string | undefined>): SocialLink[]`
  - `socialLinks: SocialLink[]`
  - `type NavLink = { label: string; href: string }`
  - `primaryNav: NavLink[]`
  - `footerColumns: { title: string; links: NavLink[] }[]`

- [ ] **Step 1: Write the failing tests**

`tests/site.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { buildSocialLinks, site } from "@/data/site";

describe("site identity", () => {
  it("describes the store, not a video channel", () => {
    expect(site.name).toBe("BRAKMASRA");
    for (const text of [site.tagline, site.slogan, site.description, site.summary]) {
      expect(text).not.toMatch(/youtube|subscribe|channel|video/i);
    }
  });

  it("only lists social links that have an approved URL", () => {
    const links = buildSocialLinks({ NEXT_PUBLIC_TIKTOK_URL: "https://www.tiktok.com/@Brakmasraofficial" });
    expect(links).toEqual([{ label: "TikTok", handle: "@Brakmasraofficial", href: "https://www.tiktok.com/@Brakmasraofficial" }]);
  });

  it("returns no social links when none are configured", () => {
    expect(buildSocialLinks({})).toEqual([]);
  });
});
```

`tests/navigation.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { footerColumns, primaryNav } from "@/data/navigation";

const storeRoutes = ["/", "/shop", "/about", "/contact", "/cart"];

describe("site navigation", () => {
  it("offers only the store pages in the primary menu", () => {
    expect(primaryNav.map((link) => link.href)).toEqual(["/", "/shop", "/about", "/contact"]);
  });

  it("links only to store routes from the footer", () => {
    const hrefs = footerColumns.flatMap((column) => column.links.map((link) => link.href));
    expect(hrefs.length).toBeGreaterThan(0);
    for (const href of hrefs) expect(storeRoutes).toContain(href);
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run tests/site.test.ts tests/navigation.test.ts`
Expected: FAIL. Vitest cannot resolve `@/data/site` or `@/data/navigation`.

- [ ] **Step 3: Write the implementation**

`data/site.ts`:

```ts
export const site = {
  name: "BRAKMASRA",
  tagline: "Official Store",
  slogan: "Wear the mark of the unknown.",
  description:
    "Official BRAKMASRA merchandise — dark apparel and accessories inspired by mysterious journeys and haunted places, released in limited, verified drops.",
  summary: "Dark apparel and accessories from BRAKMASRA, released in limited, verified drops.",
};

export type SocialLink = { label: string; handle: string; href: string };

export function buildSocialLinks(env: Record<string, string | undefined>): SocialLink[] {
  return [
    { label: "TikTok", handle: "@Brakmasraofficial", href: env.NEXT_PUBLIC_TIKTOK_URL },
    { label: "Facebook", handle: "@Brakmasra", href: env.NEXT_PUBLIC_FACEBOOK_URL },
    { label: "X", handle: "@Brakmasra", href: env.NEXT_PUBLIC_X_URL },
  ].filter((item): item is SocialLink => Boolean(item.href));
}

// Literal process.env reads so Next.js can inline the public values.
export const socialLinks = buildSocialLinks({
  NEXT_PUBLIC_TIKTOK_URL: process.env.NEXT_PUBLIC_TIKTOK_URL,
  NEXT_PUBLIC_FACEBOOK_URL: process.env.NEXT_PUBLIC_FACEBOOK_URL,
  NEXT_PUBLIC_X_URL: process.env.NEXT_PUBLIC_X_URL,
});
```

`data/navigation.ts`:

```ts
export type NavLink = { label: string; href: string };

export const primaryNav: NavLink[] = [
  { label: "Home", href: "/" },
  { label: "Shop", href: "/shop" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
];

export const footerColumns: { title: string; links: NavLink[] }[] = [
  { title: "Store", links: [{ label: "Shop", href: "/shop" }, { label: "Cart", href: "/cart" }] },
  { title: "Help", links: [{ label: "Order support", href: "/contact" }] },
  { title: "Brand", links: [{ label: "Our story", href: "/about" }] },
];
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run tests/site.test.ts tests/navigation.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 5: Checkpoint** — stop and hand to the owner. Changed: `data/site.ts`, `data/navigation.ts`, `tests/site.test.ts`, `tests/navigation.test.ts`. Suggested message: `feat: add store identity and navigation data`.

---

### Task 2: Store-focused contact topics

**Files:**
- Create: `lib/contact-topics.ts`, `lib/contact.ts`
- Modify: `app/api/contact/route.ts` (replace the inline schema at line 7)
- Modify: `components/contact-form.tsx` (topic `<select>` at line 17)
- Modify: `app/contact/page.tsx` (copy)
- Test: `tests/contact.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `contactTopics: readonly ["General inquiry", "Order support", "Business inquiry"]` from `lib/contact-topics.ts`
  - `contactSchema` (zod object) from `lib/contact.ts`

- [ ] **Step 1: Write the failing test**

`tests/contact.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { contactSchema } from "@/lib/contact";
import { contactTopics } from "@/lib/contact-topics";

const valid = {
  name: "Nimal",
  email: "nimal@example.com",
  topic: "Order support",
  message: "Where is my order right now?",
  consent: "true",
  website: "",
};

describe("contact form contract", () => {
  it("offers store-focused topics only", () => {
    expect(contactTopics).toEqual(["General inquiry", "Order support", "Business inquiry"]);
  });

  it("accepts a valid store inquiry", () => {
    expect(contactSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects the retired sponsorship topic", () => {
    expect(contactSchema.safeParse({ ...valid, topic: "Sponsorship" }).success).toBe(false);
  });

  it("rejects a filled honeypot", () => {
    expect(contactSchema.safeParse({ ...valid, website: "spam.example" }).success).toBe(false);
  });

  it("rejects submissions without consent", () => {
    expect(contactSchema.safeParse({ ...valid, consent: "false" }).success).toBe(false);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run tests/contact.test.ts`
Expected: FAIL. Vitest cannot resolve `@/lib/contact`.

- [ ] **Step 3: Write the implementation**

`lib/contact-topics.ts`:

```ts
// Client-safe: imported by the contact form, so it must not pull in zod.
export const contactTopics = ["General inquiry", "Order support", "Business inquiry"] as const;
```

`lib/contact.ts`:

```ts
import { z } from "zod";
import { contactTopics } from "@/lib/contact-topics";

export const contactSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.email().max(254),
  topic: z.enum(contactTopics),
  message: z.string().trim().min(10).max(2000),
  consent: z.literal("true"),
  website: z.string().max(0).optional(),
});
```

In `app/api/contact/route.ts`, delete `import { z } from "zod";` and the `const schema = z.object({...});` line. Add the import and use the shared schema:

```ts
import { contactSchema } from "@/lib/contact";
```

```ts
  const parsed = contactSchema.safeParse(await request.json().catch(() => null));
```

Leave every other guard (origin, 8192-byte size cap, rate limit, Supabase fail-closed) exactly as it is.

In `components/contact-form.tsx`, add the import and replace the hardcoded `<option>` list:

```tsx
import { contactTopics } from "@/lib/contact-topics";
```

```tsx
      <label>Topic<select name="topic" required defaultValue=""><option value="" disabled>Select an inquiry</option>{contactTopics.map((topic) => <option key={topic}>{topic}</option>)}</select></label>
```

Replace `app/contact/page.tsx` with:

```tsx
import type { Metadata } from "next";
import { ContactForm } from "@/components/contact-form";
export const metadata: Metadata = { title: "Contact", description: "Contact BRAKMASRA about orders, general questions, or business inquiries." };
export default function ContactPage() { return <div className="page-shell page-top"><header className="page-hero"><span className="eyebrow">Get in touch</span><h1>Contact</h1><p>Order support, general questions, and business inquiries.</p></header><div className="contact-layout"><div><h2>How can we help?</h2><p>Choose the topic that fits your message and the BRAKMASRA team will reply to the email you provide. Direct email and WhatsApp support details will be listed here soon.</p><p className="muted">Please do not submit payment card data, passwords, or other highly sensitive information.</p></div><ContactForm /></div></div>; }
```

- [ ] **Step 4: Run the tests and typecheck**

Run: `npx vitest run tests/contact.test.ts && npm run typecheck`
Expected: PASS (5 tests), typecheck clean.

- [ ] **Step 5: Checkpoint** — changed: `lib/contact-topics.ts`, `lib/contact.ts`, `app/api/contact/route.ts`, `components/contact-form.tsx`, `app/contact/page.tsx`, `tests/contact.test.ts`. Suggested message: `feat: store-focused contact topics with shared schema`.

---

### Task 3: Header and footer without YouTube

**Files:**
- Modify: `components/header.tsx` (full rewrite)
- Modify: `components/footer.tsx` (full rewrite)
- Modify: `app/globals.css` (nav rules for the removed Subscribe button and search icon)

**Interfaces:**
- Consumes: `primaryNav`, `footerColumns` (`@/data/navigation`); `site`, `socialLinks` (`@/data/site`) from Task 1.
- Produces: nothing new.

The data tests from Task 1 cover the link lists. This task is verified by typecheck, a grep, and a browser check.

- [ ] **Step 1: Rewrite `components/header.tsx`**

```tsx
"use client";

import Link from "next/link";
import { Menu, ShoppingBag, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { BrandMark } from "@/components/icons";
import { useCart } from "@/components/cart-provider";
import { primaryNav } from "@/data/navigation";

export function Header() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const { count } = useCart();
  const isActive = (href: string) => pathname === href || (href !== "/" && pathname.startsWith(`${href}/`));

  return (
    <header className="site-header">
      <a className="skip-link" href="#content">Skip to content</a>
      <div className="nav-shell">
        <Link className="brand" href="/" aria-label="BRAKMASRA home">
          <BrandMark />
          <span>BRAKMASRA</span>
        </Link>
        <nav className={`nav-links ${open ? "is-open" : ""}`} aria-label="Primary">
          <button className="mobile-close" onClick={() => setOpen(false)} aria-label="Close menu"><X /></button>
          {primaryNav.map(({ label, href }) => (
            <Link key={href} href={href} onClick={() => setOpen(false)} aria-current={isActive(href) ? "page" : undefined}>{label}</Link>
          ))}
        </nav>
        <div className="nav-actions">
          <Link className="icon-button cart-link" href="/cart" aria-label={`Cart with ${count} items`}><ShoppingBag />{count > 0 && <span>{count}</span>}</Link>
          <button className="icon-button mobile-menu" onClick={() => setOpen(true)} aria-label="Open menu"><Menu /></button>
        </div>
      </div>
      {open && <button className="nav-scrim" onClick={() => setOpen(false)} aria-label="Close menu overlay" />}
    </header>
  );
}
```

- [ ] **Step 2: Rewrite `components/footer.tsx`**

```tsx
import Link from "next/link";
import { ArrowUpRight, ShoppingBag } from "lucide-react";
import { footerColumns } from "@/data/navigation";
import { site, socialLinks } from "@/data/site";
import { BrandMark, Ornament } from "@/components/icons";

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="site-footer">
      <span className="footer-watermark" aria-hidden>BRAKMASRA</span>

      <div className="footer-shell">
        {/* Closing call to action — back into the store */}
        <section className="footer-cta">
          <div>
            <span className="footer-cta-eyebrow"><i />{site.tagline}</span>
            <h2>{site.slogan}</h2>
          </div>
          <Link className="button button-primary" href="/shop">
            <ShoppingBag />Shop the collection
          </Link>
        </section>

        <div className="footer-grid">
          <div className="footer-intro">
            <div className="footer-brand"><BrandMark /><span>BRAKMASRA</span></div>
            <p>{site.summary}</p>
            <Ornament className="footer-ornament" />
            {socialLinks.length > 0 && (
              <div className="footer-social">
                {socialLinks.map((social) => (
                  <a key={social.label} href={social.href} target="_blank" rel="noreferrer">{social.label} <ArrowUpRight /></a>
                ))}
              </div>
            )}
          </div>

          {footerColumns.map((column) => (
            <nav key={column.title} className="footer-col" aria-label={column.title}>
              <h2>{column.title}</h2>
              {column.links.map((link) => <Link key={link.label} href={link.href}>{link.label}</Link>)}
            </nav>
          ))}
        </div>

        <div className="footer-bottom">
          <span>© {year} BRAKMASRA. All rights reserved.</span>
          <Link href="/contact">Contact</Link>
        </div>
      </div>
    </footer>
  );
}
```

- [ ] **Step 3: Update the nav CSS in `app/globals.css`**

Make these exact edits inside `@layer legacy`:

1. `.mobile-menu, .mobile-close, .mobile-subscribe, .nav-scrim { display: none; }` → `.mobile-menu, .mobile-close, .nav-scrim { display: none; }`
2. Delete the line `.button.mobile-subscribe { display: none; }`
3. In `@media (max-width: 1050px)`, delete the line `  .desktop-subscribe { display: none; }`
4. In `@media (max-width: 820px)`, change `  .mobile-menu, .mobile-close, .button.mobile-subscribe { display: inline-flex; }` → `  .mobile-menu, .mobile-close { display: inline-flex; }`
5. In `@media (max-width: 820px)`, delete the line `  .mobile-subscribe { margin-top: 1.5rem; }`
6. In `@media (max-width: 600px)`, delete the line `  .nav-actions > .icon-button:first-child { display: none; }`. **Required:** with the search icon gone, the cart icon becomes the first child, and this rule would hide the cart on phones.

- [ ] **Step 4: Verify**

Run: `rg -n -i "youtube|subscribe|/videos" components/header.tsx components/footer.tsx` → expected: no output.
Run: `rg -n "subscribe|icon-button:first-child" app/globals.css` → expected: no output.
Run: `npm run typecheck && npm test` → expected: typecheck clean. All tests pass (`tests/channel.test.ts` still exists and passes until Task 7).

- [ ] **Step 5: Browser check**

Start the dev server with the Browser preview tooling (`npm run dev`, port 3000). Open `/`:
- Desktop: the header shows Home · Shop · About · Contact and the cart icon, with no Subscribe button. The footer shows Store / Help / Brand columns with no YouTube text.
- `resize_window` preset `mobile`: the cart icon is visible, and the menu button opens the drawer with the 4 links.
- `read_console_messages` with `onlyErrors`: no new errors.

- [ ] **Step 6: Checkpoint** — changed: `components/header.tsx`, `components/footer.tsx`, `app/globals.css`. Suggested message: `feat: store navigation in header and footer`.

---

### Task 4: Home page as the store landing

**Files:**
- Modify: `app/page.tsx` (full rewrite)

**Interfaces:**
- Consumes: `site`, `socialLinks` (Task 1); `products` (`@/data/products`); `Reveal`, `NewsletterForm` (existing).
- Produces: nothing new. Task 9 later fills the product grid.

- [ ] **Step 1: Replace `app/page.tsx` with:**

```tsx
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Mail, ShoppingBag } from "lucide-react";
import { Reveal } from "@/components/reveal";
import { NewsletterForm } from "@/components/newsletter-form";
import { products } from "@/data/products";
import { site, socialLinks } from "@/data/site";

const shell = "mx-auto w-full max-w-[1240px] px-5 sm:px-6";
const section = "py-[clamp(4.5rem,9vw,8rem)]";
const secondaryBtn =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-clot bg-transparent px-5 font-mono text-[.72rem] font-semibold uppercase tracking-[.16em] text-bone transition hover:border-blood hover:bg-blood/10";
const arrowLink =
  "inline-flex items-center gap-2 font-mono text-[.72rem] font-semibold uppercase tracking-[.16em] text-bone transition hover:text-ember";

export default function Home() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: site.name,
    url: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
    description: site.description,
    ...(socialLinks.length ? { sameAs: socialLinks.map((link) => link.href) } : {}),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />

      {/* Hero */}
      <section className="hero">
        <Image className="hero-image" src="/images/brakmasra-hero.png" alt="Moonlit abandoned manor surrounded by tropical forest and fog" fill priority sizes="100vw" />
        <div className="hero-overlay" />
        <div className="hero-content page-shell">
          <span className="hero-kicker">OFFICIAL <i /> MERCH <i /> STORE</span>
          <h1>BRAK<span>MASRA</span></h1>
          <p>{site.description}</p>
          <div className="button-row">
            <Link className="button button-primary" href="/shop"><ShoppingBag />Shop the collection</Link>
            <Link className="button button-secondary" href="/about">Our story</Link>
          </div>
        </div>
      </section>

      {/* Official merch */}
      <section className={`${shell} ${section}`}>
        <Reveal>
          <div className="mb-9 flex items-end justify-between gap-6">
            <FieldHeading index="Store" kicker="Wear the mark" title="Official merch" />
            <Link className={`${arrowLink} shrink-0`} href="/shop">Enter the store <ArrowRight size={15} /></Link>
          </div>
          {products.length ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3" />
          ) : (
            <div className="rounded-3xl border border-edge bg-pitch px-6 py-[clamp(3.5rem,8vw,6.5rem)] text-center" style={{ backgroundImage: "linear-gradient(135deg, rgba(122,0,0,.1), transparent 45%)" }}>
              <ShoppingBag className="mx-auto text-blood" size={38} />
              <h3 className="mt-4 font-serif text-[clamp(1.6rem,4vw,2.4rem)] text-bone">The first drop is being prepared</h3>
              <p className="mx-auto mt-2 max-w-xl text-ash">Official BRAKMASRA merch is on the way. Join the drop alerts below to hear first.</p>
              <Link className={`${secondaryBtn} mt-6`} href="/shop">Visit the shop</Link>
            </div>
          )}
        </Reveal>
      </section>

      {/* Story */}
      <section className="border-y border-edge bg-pitch">
        <div className={`${shell} ${section}`}>
          <Reveal className="grid items-center gap-[clamp(2.5rem,8vw,7rem)] md:grid-cols-2">
            <div>
              <FieldHeading index="Dossier" kicker="Beyond the light" title="About BRAKMASRA" />
              <p className="mt-5 text-ash">BRAKMASRA was born on mysterious road trips, night explorations, and ghost hunts — from abandoned locations to places known for paranormal stories. The store carries that mark.</p>
              <Link className={`${secondaryBtn} mt-6`} href="/about">Read our story</Link>
            </div>
            <blockquote className="rounded-2xl border-l-2 border-blood bg-ink p-[clamp(1.75rem,4vw,3rem)] font-serif text-[clamp(1.3rem,2.4vw,1.7rem)] italic leading-relaxed text-bone">
              “{site.slogan}”
              <cite className="mt-5 block font-mono text-[.66rem] not-italic uppercase tracking-[.16em] text-smoke">— BRAKMASRA</cite>
            </blockquote>
          </Reveal>
        </div>
      </section>

      {/* Support */}
      <section className={`${shell} ${section}`}>
        <Reveal className="flex flex-col items-start justify-between gap-6 rounded-2xl border border-edge bg-surface p-[clamp(1.75rem,4vw,3rem)] md:flex-row md:items-center">
          <div>
            <FieldHeading index="Support" kicker="We are here" title="Questions about an order?" />
            <p className="mt-4 max-w-xl text-ash">Sizing, orders, or business requests — send a message and the BRAKMASRA team will reply by email.</p>
          </div>
          <Link className={`${secondaryBtn} shrink-0`} href="/contact"><Mail size={16} />Contact us</Link>
        </Reveal>
      </section>

      {/* Newsletter */}
      <section className="border-y border-edge bg-pitch py-[clamp(4.5rem,8vw,7.5rem)]" style={{ backgroundImage: "radial-gradient(circle at 78% 50%, rgba(122,0,0,.18), transparent 38%)" }}>
        <div className={shell}>
          <Reveal className="grid items-center gap-[clamp(2.5rem,8vw,7rem)] md:grid-cols-2">
            <div>
              <FieldHeading index="Signal" kicker="Drop alerts" title="Join the darkness" />
              <p className="mt-5 text-ash">Be first to hear about new merch drops and restocks. No false urgency. No noise.</p>
            </div>
            <NewsletterForm />
          </Reveal>
        </div>
      </section>
    </>
  );
}

/* ---- Local presentational helper (homepage-scoped) ---- */

function FieldHeading({ index, kicker, title }: { index?: string; kicker: string; title: string }) {
  return (
    <div className="max-w-[620px]">
      <div className="flex items-center gap-3 font-mono text-[.7rem] uppercase tracking-[.22em]">
        <span aria-hidden className="h-px w-8 bg-blood" />
        {index && <span className="text-smoke">{index}</span>}
        <span className="text-ember">{kicker}</span>
      </div>
      <h2 className="mt-4 font-serif text-[clamp(2.1rem,5vw,3.6rem)] leading-[1.02] tracking-[-.02em] text-bone">{title}</h2>
    </div>
  );
}
```

- [ ] **Step 2: Verify**

Run: `rg -n -i "youtube|ytimg|getYouTubeData|data/channel|/videos|/shorts" app/page.tsx` → expected: no output.
Run: `npm run typecheck && npm run lint` → expected: clean.

- [ ] **Step 3: Browser check** — reload `/`. You should see the hero with "Shop the collection", no stats box, then merch empty state → story → support → newsletter. `read_console_messages` with `onlyErrors` should show nothing new. Take a screenshot as proof.

- [ ] **Step 4: Checkpoint** — changed: `app/page.tsx`. Suggested message: `feat: home page becomes the store landing`.

---

### Task 5: About, 404, and site metadata

**Files:**
- Modify: `app/about/page.tsx` (full rewrite)
- Modify: `app/not-found.tsx`
- Modify: `app/layout.tsx` (metadata block, lines 10–18)
- Modify: `app/manifest.ts`, `app/opengraph-image.tsx`

**Interfaces:**
- Consumes: `site` (Task 1).
- Produces: nothing new.

- [ ] **Step 1: Replace `app/about/page.tsx` with:**

The hero PNG is 1672×941. It replaces the YouTube avatar that was hosted on `yt3.googleusercontent.com`.

```tsx
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { BadgeCheck, Mail, Sparkles } from "lucide-react";
import { site } from "@/data/site";

export const metadata: Metadata = { title: "About", description: "The story behind BRAKMASRA and its official merch store." };

export default function AboutPage() {
  return (
    <div className="page-shell page-top">
      <header className="page-hero"><span className="eyebrow">Into the unknown</span><h1>About BRAKMASRA</h1></header>
      <div className="about-layout">
        <div className="creator-portrait">
          <Image src="/images/brakmasra-hero.png" alt="Moonlit abandoned manor surrounded by tropical forest and fog" width={1672} height={941} priority sizes="(max-width: 820px) 100vw, 40vw" />
        </div>
        <div className="prose">
          <h2>Mystery has a mark</h2>
          <p>BRAKMASRA began with mysterious road trips, night explorations, and ghost hunts — abandoned places and locations known for paranormal stories.</p>
          <p>{site.description}</p>
          <div className="button-row">
            <Link className="button button-primary" href="/shop">Shop the collection</Link>
            <Link className="button button-secondary" href="/contact">Contact us</Link>
          </div>
        </div>
      </div>
      <div className="values-grid">
        <article><Sparkles /><h2>The mark</h2><p>Designs rooted in the atmosphere of BRAKMASRA’s explorations: pitch black, cold white, blood red.</p></article>
        <article><BadgeCheck /><h2>Verified drops</h2><p>Products appear only once real photos, prices, and stock are confirmed.</p></article>
        <article><Mail /><h2>Real support</h2><p>Questions about an order are answered through the contact page.</p></article>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Replace `app/not-found.tsx` with:**

```tsx
import Link from "next/link";
export default function NotFound() { return <div className="not-found"><span className="eyebrow">404 · Signal lost</span><h1>Lost in the dark</h1><p>The page you were looking for has vanished.</p><div className="button-row"><Link className="button button-primary" href="/">Return home</Link><Link className="button button-secondary" href="/shop">Shop merch</Link><Link className="button button-secondary" href="/contact">Contact us</Link></div></div>; }
```

- [ ] **Step 3: Update `app/layout.tsx` metadata**

Add `import { site } from "@/data/site";` below the existing imports. Replace the `metadata` object with:

```ts
export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: "BRAKMASRA — Official Store", template: "%s | BRAKMASRA" },
  description: site.description,
  alternates: { canonical: "/" },
  openGraph: { type: "website", siteName: "BRAKMASRA", title: "BRAKMASRA — Official Store", description: site.description, images: ["/opengraph-image"] },
  twitter: { card: "summary_large_image", title: "BRAKMASRA — Official Store", images: ["/opengraph-image"] },
  icons: { icon: "/icon.svg" },
};
```

- [ ] **Step 4: Update the manifest and social card**

In `app/manifest.ts`, change `description: "Horror, stories, mystery, and official merchandise."` to `description: "Official BRAKMASRA merchandise store."`.

In `app/opengraph-image.tsx`, change `export const alt = "BRAKMASRA — Horror, Stories & Mystery";` to `export const alt = "BRAKMASRA — Official Store";`. Change the kicker text `HORROR · STORIES · MYSTERY` to `OFFICIAL · MERCH · STORE`.

- [ ] **Step 5: Verify**

Run: `rg -n -i "youtube|channel|data/channel|/videos" app/about app/not-found.tsx app/layout.tsx app/manifest.ts app/opengraph-image.tsx` → expected: no output.
Run: `npm run typecheck && npm run lint` → expected: clean.
Browser: `/about` shows the hero image portrait and three value cards. A random URL such as `/nope` shows the 404 page with Shop/Contact buttons.

- [ ] **Step 6: Checkpoint** — changed: `app/about/page.tsx`, `app/not-found.tsx`, `app/layout.tsx`, `app/manifest.ts`, `app/opengraph-image.tsx`. Suggested message: `feat: store-focused about page, 404, and metadata`.

---

### Task 6: Store-only sitemap

**Files:**
- Modify: `app/sitemap.ts` (full rewrite)
- Test: `tests/sitemap.test.ts`

**Interfaces:**
- Consumes: `products` (`@/data/products`).
- Produces: `default function sitemap(): MetadataRoute.Sitemap`.

- [ ] **Step 1: Write the failing test**

`tests/sitemap.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import sitemap from "@/app/sitemap";

describe("sitemap", () => {
  it("lists the store, about, and contact pages first", () => {
    const paths = sitemap().map((entry) => new URL(entry.url).pathname);
    expect(paths.slice(0, 4)).toEqual(["/", "/shop", "/about", "/contact"]);
  });

  it("adds only product pages after the static pages", () => {
    const paths = sitemap().map((entry) => new URL(entry.url).pathname);
    for (const path of paths.slice(4)) expect(path).toMatch(/^\/shop\/[^/]+$/);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run tests/sitemap.test.ts`
Expected: FAIL. The first test fails because the paths contain `/videos`, and the second fails on the `/videos/<id>` entries.

- [ ] **Step 3: Replace `app/sitemap.ts` with:**

```ts
import type { MetadataRoute } from "next";
import { products } from "@/data/products";

const pages = ["", "/shop", "/about", "/contact"];

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  return [
    ...pages.map((path) => ({ url: `${base}${path}`, changeFrequency: path === "" ? "weekly" as const : "monthly" as const, priority: path === "" ? 1 : 0.7 })),
    ...products.map((product) => ({ url: `${base}/shop/${product.slug}`, changeFrequency: "weekly" as const, priority: 0.8 })),
  ];
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run tests/sitemap.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 5: Checkpoint** — changed: `app/sitemap.ts`, `tests/sitemap.test.ts`. Suggested message: `feat: store-only sitemap`.

---

### Task 7: Remove the YouTube integration

**Files:**
- Test: `tests/store-only.test.ts`, `tests/security-headers.test.ts`
- Delete: `app/videos/page.tsx`, `app/videos/[slug]/page.tsx`, `app/shorts/page.tsx`, `app/playlists/page.tsx`, `app/api/youtube/route.ts`, `lib/youtube.ts`, `data/channel.ts`, `components/video-card.tsx`, `components/video-search.tsx`, `tests/channel.test.ts`
- Modify: `next.config.ts`, `.env.example`, `app/globals.css`, `README.md`

**Interfaces:**
- Consumes: Tasks 3–6 have already removed every import of `@/data/channel` and `@/lib/youtube` outside the files deleted here.
- Produces: a permanent regression guard (`tests/store-only.test.ts`).

- [ ] **Step 1: Write the failing tests**

`tests/store-only.test.ts`:

```ts
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, sep } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const scanned = ["app", "components", "lib", "data", "next.config.ts", ".env.example"];
const banned = /youtube|ytimg|yt3\.|googleapis|["'`]\/(videos|shorts|playlists)\b/i;

function walk(path: string): string[] {
  const full = join(root, path);
  if (!existsSync(full)) return [];
  if (statSync(full).isFile()) return [path.split(sep).join("/")];
  return readdirSync(full).flatMap((name) => walk(join(path, name)));
}

describe("store-only site", () => {
  it("has no YouTube integration or video links left in source", () => {
    const offenders = scanned.flatMap(walk).filter((file) => banned.test(readFileSync(join(root, file), "utf8")));
    expect(offenders).toEqual([]);
  });

  it.each([
    "app/videos",
    "app/shorts",
    "app/playlists",
    "app/api/youtube",
    "lib/youtube.ts",
    "data/channel.ts",
    "components/video-card.tsx",
    "components/video-search.tsx",
  ])("has removed %s", (path) => {
    expect(existsSync(join(root, path))).toBe(false);
  });
});
```

`tests/security-headers.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import nextConfig from "@/next.config";

async function headerMap() {
  const rules = (await nextConfig.headers?.()) ?? [];
  return new Map(rules[0].headers.map((header) => [header.key, header.value]));
}

describe("security headers", () => {
  it("keeps the CSP locked to this origin with no YouTube hosts", async () => {
    const csp = (await headerMap()).get("Content-Security-Policy") ?? "";
    expect(csp).toContain("default-src 'self'");
    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).toContain("img-src 'self' data:;");
    expect(csp).not.toMatch(/youtube|ytimg|yt3|googleapis/);
  });

  it("keeps the hardening headers", async () => {
    const headers = await headerMap();
    expect(headers.get("X-Frame-Options")).toBe("DENY");
    expect(headers.get("X-Content-Type-Options")).toBe("nosniff");
    expect(headers.get("Strict-Transport-Security")).toContain("max-age=63072000");
  });

  it("allows no remote image hosts", () => {
    expect(nextConfig.images?.remotePatterns).toBeUndefined();
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run tests/store-only.test.ts tests/security-headers.test.ts`
Expected: FAIL.
- `offenders` lists the video pages, `app/api/youtube/route.ts`, `lib/youtube.ts`, `data/channel.ts`, `components/video-card.tsx`, `next.config.ts`, and `.env.example`.
- The 8 "has removed" cases fail.
- The CSP and `remotePatterns` assertions fail. The hardening-headers test already passes.

- [ ] **Step 3: Delete the YouTube files and the stale Next.js cache**

`.next` must go: `tsconfig.json` includes `.next/types/**/*.ts`, and stale generated types for the deleted routes would break `typecheck`. Plain `rm` keeps the owner's git index untouched.

```bash
rm -rf app/videos app/shorts app/playlists app/api/youtube lib/youtube.ts data/channel.ts components/video-card.tsx components/video-search.tsx tests/channel.test.ts .next
```

- [ ] **Step 4: Lock down `next.config.ts`**

Replace the `csp` array and the `images` block. Everything else, including `headers()`, stays unchanged.

```ts
const csp = [
  "default-src 'self'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "object-src 'none'",
  `script-src 'self' 'unsafe-inline'${isDevelopment ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data:",
  "font-src 'self' data:",
  `connect-src 'self'${isDevelopment ? " ws: wss:" : ""}`,
  "frame-src 'none'",
  "media-src 'self'",
  ...(isDevelopment ? [] : ["upgrade-insecure-requests"]),
].join("; ");
```

```ts
  images: {
    formats: ["image/avif", "image/webp"],
  },
```

- [ ] **Step 5: Remove the YouTube block from `.env.example`**

Delete this whole block, from the `# YouTube  (used now — server-only)` header rule through `YOUTUBE_REVALIDATE_SECONDS=` plus the blank line after it:

```
# -----------------------------------------------------------------------------
# YouTube  (used now — server-only)
# -----------------------------------------------------------------------------
# Data API v3 key for live channel refresh. Falls back to data/channel.ts when
# absent. Never expose through NEXT_PUBLIC_.
YOUTUBE_API_KEY=
YOUTUBE_CHANNEL_ID=UCJS5mX07b98qeG4Lhqa12XQ

# Optional quota guards (safe to leave blank).
# One refresh costs 2 API units against a 10,000 unit/day free allowance.
# YOUTUBE_DAILY_CALL_BUDGET  max upstream calls per UTC day (default 200)
# YOUTUBE_REVALIDATE_SECONDS cache lifetime, min 300 (default 3600)
YOUTUBE_DAILY_CALL_BUDGET=
YOUTUBE_REVALIDATE_SECONDS=

```

Tell the owner to delete the same `YOUTUBE_*` keys from their private `.env` and from the Vercel project settings.

- [ ] **Step 6: Remove video-only styles from `app/globals.css`**

Delete these rules. They were used only by the deleted video components and the old home stats box. Keep `.text-link` and `.result-count`, which Phase 2 reuses.

Inside `@layer legacy`:
- The six `.stats …` rules after `.hero-content > p` (`.stats`, `.stats div`, `.stats div:last-child`, `.stats strong, .stats span`, `.stats strong`, `.stats span`)
- `.subheading`, `.play`, `.play.large`, `.play svg`, `.video-thumb:hover .play`, `.duration`
- `.video-card`, `.video-card:hover`, `.video-thumb`, `.video-thumb img`, `.video-card:hover .video-thumb img`, `.video-copy`, `.video-copy h3`, `.video-copy p`
- Both `.shorts-grid` lines, `.video-card.vertical .video-thumb`, `.video-card.vertical .video-thumb img`
- `.video-player`, `.video-player iframe`, `.video-detail`, `.video-detail h1`, `.video-detail p`
- In `@media (max-width: 820px)`: the two `.stats` lines
- In `@media (max-width: 600px)`: the four `.stats` lines. Also change `  .card-grid, .shorts-grid, .skeleton-grid { grid-template-columns: 1fr; }` → `  .card-grid, .skeleton-grid { grid-template-columns: 1fr; }`

Unlayered shape and motion section:
- Remove `.video-card,` and `.video-player,` from the `border-radius: var(--r-md)` selector list
- `.empty-state,\n.stats { border-radius: var(--r-lg); }` → `.empty-state { border-radius: var(--r-lg); }`
- Delete `.stats { overflow: hidden; }`, `.video-card { overflow: hidden; }`, and `.duration { border-radius: var(--r-pill); padding: .22rem .6rem; }`
- Remove `.video-card,` from the transition selector list
- Delete `.video-card:hover { transform: translateY(-4px); box-shadow: 0 18px 40px -22px rgba(224, 22, 22, .55); }`
- In the final `prefers-reduced-motion` block, remove the line `  .video-card:hover,`

Verify: `rg -n "video-|shorts-grid|\.stats|\.play\b|\.duration|\.subheading" app/globals.css` → expected: no output.

- [ ] **Step 7: Update `README.md`**

- Line 3: replace the first sentence with `Official merch store for BRAKMASRA.` Keep the rest of the paragraph (the visual-language description).
- "What is included":
  - Replace the routes bullet with `- Home, shop, product, cart, checkout, about, contact, admin, 404, sitemap, robots, and generated social card routes`.
  - Delete the "Verified fallback channel snapshot…" bullet.
  - Replace the tests bullet with `- Vitest tests for site data, navigation, contact validation, catalog and cart helpers, sitemap, security headers, and a store-only guard that blocks YouTube code from returning`.
- "Local setup": change `the public site still renders from its verified channel snapshot;` to `the public site still renders;`.
- "Environment variables":
  - Delete the `YOUTUBE_API_KEY, YOUTUBE_CHANNEL_ID` bullet and the `YOUTUBE_DAILY_CALL_BUDGET…` bullet.
  - In the "Never expose" sentence, delete `` `YOUTUBE_API_KEY`, ``.
- Delete the whole `## YouTube integration` section (heading plus its two paragraphs).
- "Production status":
  - Change the intro to `The public site — home, shop, about, contact — is complete. The commerce and account surfaces are deliberately inert until the owner supplies the pieces only they can provide:`.
  - Delete the `YouTube integration (…)` table row.
  - Change the last sentence to `The credential-free application shell can be built, reviewed, and deployed as a storefront preview now.`

Verify: `rg -n -i "youtube|channel snapshot" README.md` → expected: no output.

- [ ] **Step 8: Run the full gate**

Run: `npm test` → expected: all tests PASS, including every `store-only` case and all 3 `security-headers` tests.
Run: `npm run typecheck && npm run lint` → expected: clean.
Run: `npm run build` → expected: success. The route list shows `/`, `/about`, `/contact`, `/shop`, `/shop/[slug]`, `/cart`, `/checkout`, `/admin`, `/api/contact`, `/api/newsletter`, `/api/checkout`, and no `/videos`, `/shorts`, `/playlists`, or `/api/youtube`.

- [ ] **Step 9: Browser check** — restart the dev server (the `.next` folder was deleted). Visit `/`, `/shop`, `/about`, `/contact`, `/cart`, and `/checkout`. `read_console_messages` with `onlyErrors`: no CSP violations. `/videos` and `/shorts` show the 404 page.

- [ ] **Step 10: Checkpoint (end of Phase 1)** — list all deleted and modified files. Suggested message: `feat!: remove YouTube integration; site is store-only`.

---

# Phase 2 — Finish the storefront

Today `/shop` renders an empty `<div className="card-grid" />` even when products exist, and `/shop/[slug]` returns `null`. This phase makes the store work as soon as the owner adds verified products to `data/products.ts`.

### Task 8: Catalog helpers

**Files:**
- Create: `lib/catalog.ts`
- Test: `tests/catalog.test.ts`

**Interfaces:**
- Consumes: `Product` (`@/data/products`), `CartLine` (`@/lib/cart`).
- Produces:
  - `MAX_LINE_QUANTITY = 10` (matches the clamp in `cart-provider.tsx` and the checkout schema)
  - `findProduct(slug: string, list?: Product[]): Product | undefined`
  - `searchProducts(query: string, list?: Product[]): Product[]`
  - `type VariantChoice = { size: string; color: string; quantity: number }`
  - `toCartLine(product: Product, choice: VariantChoice): CartLine | null`

- [ ] **Step 1: Write the failing test**

`tests/catalog.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import type { Product } from "@/data/products";
import { findProduct, searchProducts, toCartLine } from "@/lib/catalog";

// Test fixtures only — never copy these into data/products.ts.
const hoodie: Product = {
  id: "3f2b7c1e-8a4d-4b6f-9c2e-1d5a7b9e0f11",
  slug: "sigil-hoodie",
  name: "Sigil Hoodie",
  description: "Heavyweight black hoodie with the BRAKMASRA sigil.",
  price: 850000,
  currency: "LKR",
  images: ["/products/sigil-hoodie/front.jpg"],
  sizes: ["M", "L"],
  colors: ["Black"],
  fabric: "Cotton fleece",
  care: ["Cold wash"],
  stock: 3,
};
const cap: Product = {
  ...hoodie,
  id: "9a1c3e5f-2b4d-4c6e-8f0a-b1c2d3e4f5a6",
  slug: "night-cap",
  name: "Night Cap",
  description: "Embroidered cap.",
  images: ["/products/night-cap/front.jpg"],
  sizes: [],
};
const list = [hoodie, cap];

describe("catalog helpers", () => {
  it("finds a product by slug", () => {
    expect(findProduct("sigil-hoodie", list)).toBe(hoodie);
    expect(findProduct("missing", list)).toBeUndefined();
  });

  it("searches name and description case-insensitively", () => {
    expect(searchProducts("SIGIL", list)).toEqual([hoodie]);
    expect(searchProducts("embroidered", list)).toEqual([cap]);
    expect(searchProducts("   ", list)).toEqual(list);
  });

  it("builds a cart line for a valid in-stock variant", () => {
    expect(toCartLine(hoodie, { size: "L", color: "Black", quantity: 2 })).toEqual({
      productId: hoodie.id,
      slug: "sigil-hoodie",
      name: "Sigil Hoodie",
      image: "/products/sigil-hoodie/front.jpg",
      size: "L",
      color: "Black",
      quantity: 2,
      unitPrice: 850000,
      currency: "LKR",
    });
  });

  it("accepts an empty size for one-size products", () => {
    expect(toCartLine(cap, { size: "", color: "Black", quantity: 1 })?.size).toBe("");
  });

  it("rejects unknown variants and impossible quantities", () => {
    expect(toCartLine(hoodie, { size: "XXL", color: "Black", quantity: 1 })).toBeNull();
    expect(toCartLine(hoodie, { size: "L", color: "Red", quantity: 1 })).toBeNull();
    expect(toCartLine(hoodie, { size: "L", color: "Black", quantity: 4 })).toBeNull();
    expect(toCartLine(hoodie, { size: "L", color: "Black", quantity: 0 })).toBeNull();
    expect(toCartLine(hoodie, { size: "L", color: "Black", quantity: 1.5 })).toBeNull();
  });

  it("rejects products without a photo", () => {
    expect(toCartLine({ ...hoodie, images: [] }, { size: "L", color: "Black", quantity: 1 })).toBeNull();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run tests/catalog.test.ts`
Expected: FAIL. Vitest cannot resolve `@/lib/catalog`.

- [ ] **Step 3: Write `lib/catalog.ts`**

```ts
import { products as catalog, type Product } from "@/data/products";
import type { CartLine } from "@/lib/cart";

export const MAX_LINE_QUANTITY = 10;

export function findProduct(slug: string, list: Product[] = catalog): Product | undefined {
  return list.find((product) => product.slug === slug);
}

export function searchProducts(query: string, list: Product[] = catalog): Product[] {
  const needle = query.trim().toLowerCase();
  if (!needle) return list;
  return list.filter((product) => `${product.name} ${product.description}`.toLowerCase().includes(needle));
}

export type VariantChoice = { size: string; color: string; quantity: number };

/** Builds a cart line only for a real, photographed, in-stock variant; otherwise null. */
export function toCartLine(product: Product, choice: VariantChoice): CartLine | null {
  const sizeOk = product.sizes.length ? product.sizes.includes(choice.size) : choice.size === "";
  const colorOk = product.colors.length ? product.colors.includes(choice.color) : choice.color === "";
  const maxQuantity = Math.min(MAX_LINE_QUANTITY, product.stock);
  const quantityOk = Number.isInteger(choice.quantity) && choice.quantity >= 1 && choice.quantity <= maxQuantity;
  const image = product.images[0];
  if (!sizeOk || !colorOk || !quantityOk || !image) return null;

  return {
    productId: product.id,
    slug: product.slug,
    name: product.name,
    image,
    size: choice.size,
    color: choice.color,
    quantity: choice.quantity,
    unitPrice: product.price,
    currency: product.currency,
  };
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run tests/catalog.test.ts`
Expected: PASS (6 tests).

- [ ] **Step 5: Checkpoint** — changed: `lib/catalog.ts`, `tests/catalog.test.ts`. Suggested message: `feat: catalog lookup, search, and cart-line helpers`.

---

### Task 9: Product card, shop grid, and home featured grid

**Files:**
- Create: `components/product-card.tsx`, `components/shop-catalog.tsx`
- Modify: `app/shop/page.tsx` (full rewrite)
- Modify: `app/page.tsx` (fill the product grid from Task 4)

**Interfaces:**
- Consumes: `searchProducts` (Task 8), `formatMoney` (`@/lib/cart`), `Product`.
- Produces: `ProductCard({ product }: { product: Product })`, `ShopCatalog({ products }: { products: Product[] })`.

The helper logic is already unit-tested in Task 8. This task is UI wiring, verified by typecheck, build, and the browser with a temporary fixture.

- [ ] **Step 1: Create `components/product-card.tsx`**

```tsx
import Image from "next/image";
import Link from "next/link";
import type { Product } from "@/data/products";
import { formatMoney } from "@/lib/cart";

export function ProductCard({ product }: { product: Product }) {
  const image = product.images[0];
  const soldOut = product.stock <= 0;

  return (
    <Link href={`/shop/${product.slug}`} className="group block overflow-hidden rounded-2xl border border-edge bg-surface transition duration-300 hover:-translate-y-1 hover:border-blood hover:shadow-[0_18px_40px_-22px_var(--color-ember)]">
      <div className="relative aspect-[4/5] overflow-hidden bg-pitch">
        {image && <Image src={image} alt={product.name} fill sizes="(max-width:640px) 100vw, (max-width:1050px) 50vw, 33vw" className="object-cover transition-transform duration-500 group-hover:scale-[1.04]" />}
        {(soldOut || product.badge) && (
          <span className="absolute left-3 top-3 rounded-full bg-ink/85 px-3 py-1 font-mono text-[.66rem] uppercase tracking-[.14em] text-ember">{soldOut ? "Sold out" : product.badge}</span>
        )}
      </div>
      <div className="flex items-baseline justify-between gap-4 p-4">
        <h3 className="m-0 font-serif text-[1.05rem] leading-snug text-bone">{product.name}</h3>
        <p className="m-0 shrink-0 font-mono text-[.8rem] text-ash">{formatMoney(product.price, product.currency)}</p>
      </div>
    </Link>
  );
}
```

- [ ] **Step 2: Create `components/shop-catalog.tsx`**

```tsx
"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import type { Product } from "@/data/products";
import { searchProducts } from "@/lib/catalog";
import { ProductCard } from "@/components/product-card";

export function ShopCatalog({ products }: { products: Product[] }) {
  const [query, setQuery] = useState("");
  const results = searchProducts(query, products);

  return (
    <>
      <div className="shop-tools">
        <label className="search-field">
          <Search />
          <span className="sr-only">Search products</span>
          <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search products…" />
        </label>
      </div>
      <p className="result-count" aria-live="polite">{results.length} {results.length === 1 ? "product" : "products"}</p>
      {results.length ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {results.map((product) => <ProductCard key={product.id} product={product} />)}
        </div>
      ) : (
        <div className="empty-state"><h2>Nothing matches “{query.trim()}”</h2><p>Try a different word, or clear the search to see every product.</p></div>
      )}
    </>
  );
}
```

- [ ] **Step 3: Replace `app/shop/page.tsx` with:**

This drops the disabled search and "Filters" controls that showed while the store was empty.

```tsx
import type { Metadata } from "next";
import { ShoppingBag } from "lucide-react";
import { ShopCatalog } from "@/components/shop-catalog";
import { products } from "@/data/products";

export const metadata: Metadata = { title: "Official Merch", description: "Shop official BRAKMASRA merchandise and verified limited drops." };

export default function ShopPage() {
  return (
    <div className="page-shell page-top">
      <header className="page-hero"><span className="eyebrow">Wear the mark</span><h1>Official merch</h1><p>Verified products and limited drops from BRAKMASRA.</p></header>
      {products.length ? (
        <ShopCatalog products={products} />
      ) : (
        <div className="empty-state"><ShoppingBag /><h2>The store is not open yet</h2><p>Official BRAKMASRA merch is not available yet. Check back soon — the first drop is on the way.</p></div>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Fill the home product grid**

In `app/page.tsx`, add `import { ProductCard } from "@/components/product-card";`. Then replace `<div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3" />` with:

```tsx
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {products.slice(0, 3).map((product) => <ProductCard key={product.id} product={product} />)}
            </div>
```

- [ ] **Step 5: Verify**

Run: `npm run typecheck && npm run lint && npm test` → expected: clean and PASS.

Browser check with a **temporary** fixture (revert it before the checkpoint):
- Copy the `hoodie` object from `tests/catalog.test.ts` into the `products` array in `data/products.ts`, and change its `images` to `["/images/brakmasra-hero.png"]` so a real local file exists.
- Reload `/` and `/shop`. The card shows the image, "Sigil Hoodie", and "LKR 8,500.00" (exact formatting comes from `Intl` `en-LK`). Typing "zzz" in the search box shows the "Nothing matches" state.
- **Revert `data/products.ts` to `export const products: Product[] = [];`.** Confirm with `rg -n "sigil" data/products.ts` → no output.

- [ ] **Step 6: Checkpoint** — changed: `components/product-card.tsx`, `components/shop-catalog.tsx`, `app/shop/page.tsx`, `app/page.tsx`. Suggested message: `feat: product cards and searchable shop grid`.

---

### Task 10: Product detail page and add-to-cart

**Files:**
- Create: `components/add-to-cart.tsx`
- Modify: `app/shop/[slug]/page.tsx` (full rewrite)

**Interfaces:**
- Consumes: `findProduct`, `toCartLine`, `MAX_LINE_QUANTITY` (Task 8); `useCart().add` (`@/components/cart-provider`); `formatMoney`.
- Produces: `AddToCart({ product }: { product: Product })`.

- [ ] **Step 1: Create `components/add-to-cart.tsx`**

```tsx
"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { ShoppingBag } from "lucide-react";
import { useCart } from "@/components/cart-provider";
import type { Product } from "@/data/products";
import { MAX_LINE_QUANTITY, toCartLine } from "@/lib/catalog";

export function AddToCart({ product }: { product: Product }) {
  const { add } = useCart();
  const [result, setResult] = useState<{ text: string; added: boolean } | null>(null);
  const maxQuantity = Math.min(MAX_LINE_QUANTITY, product.stock);

  if (maxQuantity < 1) return <p className="mt-6 font-mono text-[.8rem] uppercase tracking-[.16em] text-smoke">Sold out</p>;

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const line = toCartLine(product, {
      size: String(data.get("size") ?? ""),
      color: String(data.get("color") ?? ""),
      quantity: Number(data.get("quantity")),
    });
    if (!line) {
      setResult({ text: "Choose an available size, color, and quantity.", added: false });
      return;
    }
    add(line);
    setResult({ text: `${line.name} added to your cart.`, added: true });
  }

  return (
    <form className="mt-6 grid gap-4" onSubmit={submit}>
      {product.sizes.length > 0 && (
        <label className="grid gap-2">Size
          <select name="size" required defaultValue="">
            <option value="" disabled>Select a size</option>
            {product.sizes.map((size) => <option key={size}>{size}</option>)}
          </select>
        </label>
      )}
      {product.colors.length > 0 && (
        <label className="grid gap-2">Color
          <select name="color" required defaultValue={product.colors.length === 1 ? product.colors[0] : ""}>
            {product.colors.length > 1 && <option value="" disabled>Select a color</option>}
            {product.colors.map((color) => <option key={color}>{color}</option>)}
          </select>
        </label>
      )}
      <label className="grid gap-2">Quantity
        <input name="quantity" type="number" min={1} max={maxQuantity} defaultValue={1} required />
      </label>
      <button className="button button-primary" type="submit"><ShoppingBag />Add to cart</button>
      <p className="form-status" aria-live="polite">
        {result?.text}
        {result?.added && <> <Link className="text-link" href="/cart">View cart</Link></>}
      </p>
    </form>
  );
}
```

- [ ] **Step 2: Replace `app/shop/[slug]/page.tsx` with:**

```tsx
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { AddToCart } from "@/components/add-to-cart";
import { products } from "@/data/products";
import { formatMoney } from "@/lib/cart";
import { findProduct } from "@/lib/catalog";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return products.map((product) => ({ slug: product.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const product = findProduct((await params).slug);
  if (!product) return { title: "Product not found" };
  return { title: product.name, description: product.description, alternates: { canonical: `/shop/${product.slug}` }, openGraph: { images: product.images.slice(0, 1) } };
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const product = findProduct(slug);
  if (!product) notFound();

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    image: product.images.map((src) => new URL(src, siteUrl).toString()),
    brand: { "@type": "Brand", name: "BRAKMASRA" },
    offers: {
      "@type": "Offer",
      url: `${siteUrl}/shop/${product.slug}`,
      priceCurrency: product.currency,
      price: (product.price / 100).toFixed(2),
      availability: product.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
    },
  };

  return (
    <div className="page-shell page-top">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <Link className="text-link" href="/shop"><ArrowLeft />Back to the shop</Link>
      <div className="mt-8 grid gap-[clamp(2rem,6vw,5rem)] md:grid-cols-[1.1fr_.9fr]">
        <div className="grid gap-4">
          {product.images.map((src, index) => (
            <div key={src} className="relative aspect-[4/5] overflow-hidden rounded-2xl border border-edge bg-pitch">
              <Image src={src} alt={index === 0 ? product.name : `${product.name} — view ${index + 1}`} fill priority={index === 0} sizes="(max-width: 768px) 100vw, 55vw" className="object-cover" />
            </div>
          ))}
        </div>
        <div className="md:sticky md:top-[calc(var(--header)+2rem)] md:self-start">
          {product.badge && <span className="eyebrow">{product.badge}</span>}
          <h1 className="mt-3 font-serif text-[clamp(2.2rem,5vw,3.6rem)] leading-[1.05] text-bone">{product.name}</h1>
          <p className="mt-3 font-mono text-[1.1rem] text-ember">{formatMoney(product.price, product.currency)}</p>
          <p className="mt-5 text-ash">{product.description}</p>
          <AddToCart product={product} />
          <dl className="mt-8 grid gap-4 border-t border-edge pt-6 text-[.9rem]">
            <div>
              <dt className="font-mono text-[.7rem] uppercase tracking-[.16em] text-smoke">Fabric</dt>
              <dd className="m-0 mt-1 text-ash">{product.fabric}</dd>
            </div>
            <div>
              <dt className="font-mono text-[.7rem] uppercase tracking-[.16em] text-smoke">Care</dt>
              <dd className="m-0 mt-1 text-ash"><ul className="m-0 pl-5">{product.care.map((step) => <li key={step}>{step}</li>)}</ul></dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Verify**

Run: `npm run typecheck && npm run lint && npm test` → expected: clean and PASS.

Browser check with the same **temporary** fixture as Task 9, Step 5 (hoodie with `images: ["/images/brakmasra-hero.png"]`):
- Open `/shop/sigil-hoodie`. It shows the image, price, and description. The size select has M/L; color defaults to Black.
- Submit without a size: the browser's `required` blocks it. Pick L, quantity 2, submit: you see "Sigil Hoodie added to your cart." and a "View cart" link. The header cart badge shows 2.
- `/cart` shows the line with its subtotal. `/shop/does-not-exist` shows the 404 page.
- `read_console_messages` with `onlyErrors`: none.
- **Revert `data/products.ts` to the empty array** and confirm with `rg -n "sigil" data/products.ts` → no output.

- [ ] **Step 4: Checkpoint** — changed: `components/add-to-cart.tsx`, `app/shop/[slug]/page.tsx`. Suggested message: `feat: product detail page with add-to-cart`.

---

### Task 11: Final verification and handoff

**Files:** none new. `README.md` only if a check below finds something stale.

- [ ] **Step 1: Full gate from a clean cache**

```bash
rm -rf .next && npm run lint && npm run typecheck && npm test && npm run build
```

Expected: all four succeed. `npm test` reports these files, with no `channel.test.ts`: `cart`, `site`, `navigation`, `contact`, `sitemap`, `security-headers`, `store-only`, `catalog`.

- [ ] **Step 2: Repository-wide YouTube sweep**

Run: `rg -n -i "youtube|ytimg|yt3\.|getYouTubeData|data/channel|/videos|/shorts|/playlists" --glob '!node_modules' --glob '!package-lock.json' --glob '!docs/**' --glob '!db/migrations/**'`
Expected: no output. `db/migrations/0003_rate_limits.sql` keeps one historical comment (see D8).

- [ ] **Step 3: Browser tour** — run the production server (`npm run start` via the Browser preview tooling) and check:
- `/`, `/shop`, `/about`, `/contact`, `/cart`, `/checkout`: render with no console errors and no CSP violations.
- `/videos`, `/shorts`, `/playlists`, `/api/youtube`: 404.
- `/sitemap.xml`: exactly 4 URLs (products are still empty).
- `/contact`: the topic list shows General inquiry / Order support / Business inquiry.
- Mobile (`resize_window` preset `mobile`): the cart icon is visible, the menu works, and nothing scrolls horizontally.
- Screenshots of `/` desktop and mobile as proof. Reset with `resize_window` preset `desktop`.

- [ ] **Step 4: Handoff** — report every changed or deleted file, the test counts, and the build route list. Remind the owner to:
1. Commit (the agent never commits).
2. Remove `YOUTUBE_*` keys from `.env` and hosting settings.
3. Add verified products and photos under `public/products/`.
4. Supply legal policies before opening checkout.

---

## Out of scope (tracked for later)

- Legal pages: shipping, returns, privacy, terms (D7).
- Real payments (Stripe session plus webhooks), transactional email, admin authentication. The adapters stay fail-closed.
- Loading products from Supabase instead of `data/products.ts`.
- A migration to narrow `featured_content.kind` to `product`/`collection` (D8).
- 301 redirects for the old video URLs, if the site was already indexed (D6).
