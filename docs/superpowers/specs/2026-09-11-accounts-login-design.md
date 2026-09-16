# Accounts & Login (Part 1): Design

- **Date:** 2026-09-11
- **Status:** approved in chat, section by section. Awaiting the owner's review of this written spec.
- **Owner decisions:** see the Decision log at the end.
- **Reference implementation:** `C:\Users\Kavisha Lakshan\Documents\GitHub\Mazora-Network`. The owner asked for "those login ways". This design copies Mazora's patterns and adapts them to BRAKMASRA's conventions.

## 1. Goal and scope

Add Supabase-based accounts to the BRAKMASRA store:

- **Customers** can:
  - sign up (with a 6-digit email code)
  - log in with email + password or Google
  - reset a forgotten password (with a 6-digit email code)
  - manage their account: profile & security, a saved Sri Lanka address, and order history
- **Staff** use the same login. A server-controlled role opens `/admin`.

This is **Part 1 of 2**. Part 2 (a separate spec) builds the admin dashboard, with contact messages and newsletter signups. Part 1 only gates `/admin` and shows a placeholder "Staff area".

### Out of scope (explicitly)

- The admin dashboard (Part 2).
- Discord login, username login, and manual identity linking.
- Authenticator-app 2-step codes (MFA). **These are still required for staff before launch.**
- An account-deletion page. Deletion can be done from the Supabase dashboard for now; it's a follow-up.
- Whether checkout requires an account (decided with the checkout work).
- Privacy policy or terms pages. **A privacy policy is required before public sign-up opens.**
- Admin audit log.
- Removing the unused `users` table from `0001`.

## 2. What people see

**Header.** A person icon next to the cart. When logged out, it opens the **login pop-up** over the current page. When logged in, it links to `/account`; staff also get an **Admin** link. The same views also exist as full pages: `/login`, `/register` and `/forgot-password`. Emails link to `/confirm-email`, which is a page.

**Log in (pop-up or `/login`):**
- **Continue with Google.** The user picks a Google account and returns to the page they were on, logged in.
- A divider, "or use email".
- Email and password fields, with a show/hide eye.
- A **Forgot password?** link and a **Log in** button.
- Every failure shows the same message, "Wrong email or password".
- A throttled attempt shows "Too many attempts. Please wait and try again."
- A **Create an account** link switches to sign-up.
- If the credentials are correct but the email is unconfirmed, the message is "Verify your email first", with a **Resend code** button.

**Sign up (`/register`):**
1. The form asks for name, email, password and confirm password. A live checklist shows the rules: 8+ characters, uppercase, lowercase, number and symbol. Every field shows its exact message instantly.
2. Server checks:
   - Rate limit.
   - Leaked-password check. It fails open: if the service is down, sign-up continues.
   - `signUp`.
3. The view changes to **Check your email**. The user enters the 6-digit code, or clicks the link in the email, and ends up logged in. A **Resend code** button has a 60-second cooldown.
4. An already-registered email gets the identical "check your email" screen. There is no enumeration.

**Forgot password (`/forgot-password`, 3 steps):**
1. Enter email. The reply is always neutral.
2. Enter the 6-digit code.
3. Enter a new password and confirm it. It must differ from the current password and pass the leaked-password check.

After that, the user is signed out and sees **Password updated, log in**. The emailed link is a fallback: it goes to `/confirm-email`, then to `/reset-password` (the new-password form).

**My account (`/account`, login required):**
- **Profile & security:**
  - Display name, which can be edited.
  - Email, read-only.
  - Sign-in methods: Google and/or password.
  - **Change password.** The current password is required if one exists. Google-only accounts can **set a password** instead. A successful change signs out the other sessions.
  - **Sign out.**
- **Saved address (Sri Lanka only):**
  - Full name.
  - Phone: accepts `07XXXXXXXX`, `+94 7X XXX XXXX` and landlines, and is stored normalized as `+94XXXXXXXXX`.
  - Address line 1, and line 2 (optional).
  - City.
  - District, chosen from the 25.
  - Postal code (5 digits).
- **Order history:** date, order number, status and total. The empty state reads "No orders yet".

**Staff:** someone becomes staff when the owner runs the role script. After login, staff land on `/admin`, a gated placeholder until Part 2. Anyone who is not signed-in staff gets the 404 page at `/admin`, whether logged out or a signed-in customer; it doesn't reveal that the area exists. Staff sign in through the header icon and are then sent to `/admin`.

**After login, where to:** an explicit `next` (the page the pop-up was opened on) wins. Otherwise staff go to `/admin` and customers to `/account`.

## 3. Architecture

**Approach A (owner-approved):** server-checked cookie sessions.
- All Supabase auth calls run on the server, through `@supabase/ssr`, with httpOnly cookies.
- There is **no browser Supabase client** and no `NEXT_PUBLIC_` Supabase variable.
- Database access for account data uses the existing server-only secret client (`lib/supabase.ts`), and only after the session user is verified.
- Tables stay locked to `anon`/`authenticated` (matching migration 0002).

### Units

Each unit has one job. The pure units are unit-tested.

| Unit | Responsibility | Interface |
| --- | --- | --- |
| `lib/auth/config.ts` | Reads `SUPABASE_URL` + `SUPABASE_PUBLISHABLE_KEY`; returns `null` when either is missing (fail-closed) | `authConfig(): { url, key } \| null` |
| `lib/auth/client.ts` (`server-only`) | Cookie-bound Supabase auth client. Cookies are `httpOnly`, `secure` in production, `sameSite: "lax"`, `path: "/"`. Setting cookies from a Server Component is a no-op, because the proxy refreshes them | `createAuthClient(): Promise<SupabaseClient \| null>` |
| `proxy.ts` | Runs only when an `sb-*-auth-token` cookie exists. It refreshes the session via `getClaims()`, clears dead-session cookies (`refresh_token_not_found`, `refresh_token_already_used`, `session_expired`) and sets `Cache-Control: private, no-store`. Static assets are excluded. It does not enforce access | Next 16 proxy convention |
| `lib/auth/session.ts` (`server-only`) | Verified user via `getUser()`, and the gatekeepers | `getCurrentUser()`, `requireUser(next: string)` (redirects to `/login?next=…`), `requireStaff()` (returns 404 for non-staff) |
| `lib/auth/roles.ts` | Pure role logic | `ROLES = ["admin","support"] as const`, `roleFromAppMetadata(meta): Role \| null`, `isStaff(role)`, `landingPathFor(role)` |
| `lib/auth/safe-next.ts` | Pure open-redirect guard (Mazora's normalization: strips `\t\r\n`, maps `\` to `/`, requires a single leading `/`) | `safeNext(value, fallback = "/"): string` |
| `lib/auth/password.ts` | Pure password rules, plus the leaked-password check (HIBP range API, k-anonymity, 3 s timeout, fails open) | `passwordRuleResults(pw)`, `isPasswordBreached(pw): Promise<boolean>` |
| `lib/auth/messages.ts` | Every user-facing auth message in one place | constants |
| `lib/auth/throttle.ts` (`server-only`) | Wraps `lib/rate-limit.ts`. Both keys must pass: IP (`auth:<action>:ip:<ip>`) and identity (`auth:<action>:id:<sha256(lowercased email)>`). Returns a message or `null` | `throttleAuth(action, { limit, windowMs, identity? })` |
| `lib/request.ts` (modified) | Adds `clientAddress(headers: Headers)`. `requestKey` reuses it, and server actions call it with `await headers()` | as described |
| `lib/validation/auth.ts` | zod schemas: `loginSchema`, `registerSchema` (with a confirm refine), `resetRequestSchema`, `codeSchema` (`^\d{6}$`), `newPasswordSchema`, `changePasswordSchema`, `displayNameSchema` (Mazora's rules), plus `fieldErrors(zodError)` and `formValues(formData)` | shared by the client and server |
| `lib/validation/address.ts` | `SRI_LANKA_DISTRICTS` (25), `addressSchema`, `normalizeSriLankaPhone(raw): string \| null` | shared by the client and server |
| `lib/actions/auth.ts` (`"use server"`) | `loginAction`, `googleAction`, `registerAction`, `verifySignupCodeAction`, `resendSignupCodeAction`, `confirmEmailAction`, `requestResetAction`, `verifyResetCodeAction`, `finishResetAction`, `signOutAction` | `(prev: AuthResult, fd: FormData) => Promise<AuthResult>`, where `AuthResult = { ok: boolean; message?: string; errors?: Record<string,string>; unverifiedEmail?: string }` |
| `lib/actions/account.ts` (`"use server"`) | `updateNameAction`, `changePasswordAction` (includes Mazora's `accountHasPassword` / `markHasPassword` via `app_metadata.has_password`), `saveAddressAction` | same result shape |
| `app/auth/callback/route.ts` | `exchangeCodeForSession`. The redirect origin is `NEXT_PUBLIC_SITE_URL` in production (never forwarded headers). Destination: `safeNext(next)`, or `landingPathFor(role)`. Failure goes to `/login?error=oauth_failed` | GET |
| `app/api/auth/me/route.ts` | Header state. Without an auth cookie it returns `{ signedIn: false }` immediately; otherwise it calls `getUser()` and returns `{ signedIn, name, staff }`. Sent with `no-store` | GET |
| `components/auth/auth-dialog.tsx` | Client provider plus the modal: a portal, `aria-modal`, focus trap, Esc/overlay to close, and focus returned on close. Views: `login`, `register`, `verify`, `forgot`. **The dialog content is loaded lazily with `next/dynamic` the first time it opens**, so zod and the forms never ship with the shop pages | `<AuthDialogProvider>`, `useAuthDialog().open(view, { next })` |
| `components/auth/auth-link.tsx` | Opens the dialog when JS is available; otherwise the plain `href` navigates to the page | `<AuthLink view href>` |
| `components/auth/*-form.tsx`, `password-input.tsx`, `otp-input.tsx`, `google-button.tsx` | Views ported from Mazora (show/hide password, live rules, 6-cell code input with paste support), styled in the BRAKMASRA dark-luxury look | — |
| `app/login`, `app/register`, `app/forgot-password`, `app/reset-password`, `app/confirm-email` | Full-page versions with `robots: noindex` | pages |
| `app/account/page.tsx` + `components/account/*` | `requireUser("/account")`, then profile & security, the address form and order history | page |
| `app/admin/page.tsx` (modified) | `requireStaff()`, then the "Staff area" placeholder | page |
| `components/header.tsx` (modified) | Account button (fetches `/api/auth/me`): logged out → opens the dialog; logged in → `/account` (plus **Admin** for staff) | — |
| `scripts/set-role.mjs` | `node --env-file=.env scripts/set-role.mjs <email> <admin\|support\|none>`. Uses the secret key to set `app_metadata.role` without dropping other `app_metadata` keys | CLI |

### Project-rule exception, owner-approved

zod **may** be imported by the auth and account client components, **only** through the lazily loaded dialog content and the `/account`, `/login`, `/register`, `/forgot-password`, `/reset-password` and `/confirm-email` routes. The contact form keeps its zod-free `lib/contact-topics.ts` split. A test asserts that `components/header.tsx` and `app/layout.tsx` do not import zod.

## 4. Data

New file `db/migrations/0004_accounts.sql`. It is applied after 0001–0003, none of which has ever been applied, because no Supabase project exists yet.

```sql
CREATE TABLE customer_addresses (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL CHECK (char_length(full_name) BETWEEN 2 AND 80),
  phone text NOT NULL CHECK (phone ~ '^\+94[0-9]{9}$'),
  line1 text NOT NULL CHECK (char_length(line1) BETWEEN 3 AND 120),
  line2 text CHECK (line2 IS NULL OR char_length(line2) <= 120),
  city text NOT NULL CHECK (char_length(city) BETWEEN 2 AND 60),
  district text NOT NULL CHECK (district IN (
    'Ampara','Anuradhapura','Badulla','Batticaloa','Colombo','Galle','Gampaha',
    'Hambantota','Jaffna','Kalutara','Kandy','Kegalle','Kilinochchi','Kurunegala',
    'Mannar','Matale','Matara','Monaragala','Mullaitivu','Nuwara Eliya',
    'Polonnaruwa','Puttalam','Ratnapura','Trincomalee','Vavuniya')),
  postal_code text NOT NULL CHECK (postal_code ~ '^[0-9]{5}$'),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE customer_addresses ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON customer_addresses FROM anon, authenticated;
GRANT ALL ON customer_addresses TO service_role;

ALTER TABLE orders ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;
CREATE INDEX orders_user_id_idx ON orders (user_id);
```

- **Display name:** `user_metadata.display_name`, set at sign-up and editable. Google accounts fall back to `full_name` or `name`. It is display-only and never used for authorization.
- **Role:** `app_metadata.role`, which only the service role can write. `app_metadata.has_password` records password existence for OAuth-first accounts, following Mazora.
- **Order history:** `select public_id, created_at, status, total_minor, currency from orders where user_id = $me order by created_at desc limit 50`, run through the secret client. Totals use `formatMoney`.

## 5. Setup steps for the owner

The spec only lists these steps; the build does not perform them. The owner pastes every secret. Claude never handles key values.

1. **Supabase project.** Create one in the Mumbai or Singapore region. Into `.env`, copy:
   - Project URL → `SUPABASE_URL`
   - publishable key → `SUPABASE_PUBLISHABLE_KEY`
   - secret key → `SUPABASE_SECRET_KEY`
   - optionally, the connection string → `DATABASE_URL`
2. **SQL.** Run `0001` → `0002` → `0003` → `0004` in the SQL editor. Or log in to the Supabase CLI and let Claude apply them.
3. **Authentication → Providers:**
   - **Email:** enabled, "Confirm email" ON, new sign-ups allowed, email OTP length 6.
   - **Password rules:** minimum 8, requiring lowercase, uppercase, digits and symbols. This matches the app, so Supabase also enforces it.
4. **Google Cloud Console:**
   1. Configure the OAuth consent screen: External, app name BRAKMASRA, support email, authorized domains = your domain and `<project-ref>.supabase.co`.
   2. Create Credentials → OAuth client ID → Web application:
      - Authorized JavaScript origins: `http://localhost:3000`, `https://<your-domain>`.
      - Authorized redirect URI: `https://<project-ref>.supabase.co/auth/v1/callback`.
   3. Paste the Client ID and secret into Supabase → Providers → Google.
5. **Authentication → URL Configuration:**
   - Site URL = `https://<your-domain>` (`http://localhost:3000` while testing).
   - Redirect URLs: `http://localhost:3000/auth/callback`, `https://<your-domain>/auth/callback`.
6. **Authentication → Email Templates:**
   - **Confirm signup:**
     ```html
     <h2>Confirm your BRAKMASRA account</h2>
     <p>Your code: <strong style="font-size:24px;letter-spacing:4px">{{ .Token }}</strong></p>
     <p>Or <a href="{{ .SiteURL }}/confirm-email?token_hash={{ .TokenHash }}&type=email">confirm your email here</a>.</p>
     <p>If you didn't create a BRAKMASRA account, you can ignore this email.</p>
     ```
   - **Reset password:**
     ```html
     <h2>Reset your BRAKMASRA password</h2>
     <p>Your code: <strong style="font-size:24px;letter-spacing:4px">{{ .Token }}</strong></p>
     <p>Or <a href="{{ .SiteURL }}/confirm-email?token_hash={{ .TokenHash }}&type=recovery">reset it here</a>.</p>
     <p>If you didn't ask for this, you can ignore this email.</p>
     ```
7. **Authentication → SMTP.** Connect an email service such as Resend before real customers sign up. The built-in sender allows only a few emails an hour and is for testing only.
8. **Become admin.** Sign up, then run `node --env-file=.env scripts/set-role.mjs <your-email> admin`.

### `.env` and `.env.example` changes (made by the build)

- **Add** `SUPABASE_PUBLISHABLE_KEY=`. It's commented as the key used server-side for user logins: safe to expose by design, but kept server-only here.
- **Remove** `SESSION_SECRET`, `ADMIN_EMAIL` and `ADMIN_PASSWORD_HASH`, all empty and superseded by Supabase Auth.
- **Remove** the 3 leftover YouTube comment lines from the private `.env`.

## 6. Security

- **Sessions:** httpOnly, `secure` in production, SameSite=Lax cookies. Pages, actions and routes only trust `getUser()`/`getClaims()` verification; the proxy refreshes and clears dead sessions.
- **Staff:** `requireStaff()` runs on every `/admin` request and reads `app_metadata.role`, which the user can't write. Non-staff get a 404.
- **No enumeration:**
  - One login failure message.
  - An already-registered email gets the same success screen as a new sign-up (Supabase returns a user with `identities.length === 0`; no data is created for it).
  - Resend and reset requests always return a neutral message.
  - Details are logged server-side only.
- **Rate limits** (per IP **and** per hashed email):

  | Action | Limit |
  | --- | --- |
  | login | 8 / 15 min |
  | register | 5 / 60 min |
  | verify signup code | 5 / 15 min |
  | resend code | 3 / 15 min |
  | reset request | 3 / 15 min |
  | verify reset code | 5 / 15 min |
  | finish reset | 10 / 15 min |
  | Google start | 10 / 15 min |
  | change password | 10 / 15 min |
  | save address | 10 / 15 min |

  The limiter runs **before** the outbound leaked-password check.
- **Redirects:** `safeNext` is applied to every `next`, and the callback origin comes from configuration.
- **Passwords:** a leaked-password check at sign-up, reset and change. A change requires the current password when one exists, the new password must differ, and other sessions are revoked after a change.
- **Email links:** `/confirm-email` requires a button press (a POST server action). An email scanner's GET can't use up the token.
- **Guards:** the `server-only` package on every server auth module, so importing one into a client component breaks the build.
- **CSP:** unchanged. Google login is a top-level navigation. Server actions are same-origin fetches, so `form-action 'self'` and `connect-src 'self'` still hold.
- **Fail-closed:** if `authConfig()` is `null`, every form shows "Login isn't set up yet", and `/account` and `/admin` stay closed.
- **Caching and indexing:** auth pages and `/account` are `noindex`, and `robots.ts` disallows `/account`, `/auth`, `/login`, `/register`, `/forgot-password`, `/reset-password` and `/confirm-email`.

## 7. Error handling

| Situation | User sees | Server |
| --- | --- | --- |
| Wrong credentials or unknown email | "Wrong email or password." | nothing logged |
| Correct credentials, unconfirmed email | "Verify your email first", plus **Resend code** | — |
| Throttled | "Too many attempts. Please wait and try again." | — |
| Code wrong or expired | "That code is wrong or has expired." | — |
| Confirmation email failed to send | "We couldn't send the email right now. Try again in a few minutes." | logs the status and code |
| OAuth failed or cancelled | the login page shows "Google sign-in couldn't be completed. Please try again." | — |
| Supabase not configured | "Login isn't set up yet." | — |
| Unexpected Supabase or DB error | "Something went wrong. Please try again." | logs the details |

## 8. Testing

- **Unit (Vitest, node):**
  - `safeNext`: `/account` ok; `//evil.com`, `/\evil.com`, `/\t/evil.com` and `https://evil.com` all fall back.
  - `roleFromAppMetadata`, `isStaff`, `landingPathFor`.
  - `passwordRuleResults`.
  - `isPasswordBreached` with a mocked `fetch`: breached → true; clean → false; network error or timeout → false (fails open).
  - Every zod schema. Confirm mismatch. A 6-digit code rejects 5 digits and letters. Address: phone normalization (`0771234567` → `+94771234567`; `+94 77 123 4567` ok; `12345` rejected), a 25-district whitelist, and a 5-digit postal code.
  - Throttle key hashing: no raw email in the key.
  - Callback origin selection: production uses the configured URL.
  - `/api/auth/me` with no cookie → `{ signedIn: false }`, without calling Supabase.
  - The no-zod-in-header/layout guard.
- **Gate:** `lint`, `typecheck`, `test` and `build` pass for every task.
- **Browser, before the owner's Supabase setup:**
  - The account icon opens the dialog.
  - Instant field messages work.
  - Views switch: login ↔ register ↔ forgot.
  - "Login isn't set up yet" appears.
  - `/account` redirects to `/login?next=/account`.
  - `/admin` returns 404.
  - Shop pages don't load zod.
  - No console or CSP errors.
- **End-to-end, after the owner's setup:**
  - Sign up with a real email code.
  - Resend.
  - Log out and log back in.
  - Forgot password with a code.
  - Google login.
  - Save an address.
  - Change password (other sessions revoked).
  - Grant admin with the script, then `/admin` opens.
  - The customer account still gets the 404 on `/admin`.

## 9. Follow-ups (tracked, not in Part 1)

- **Part 2:** the admin dashboard (messages & signups).
- **MFA:** authenticator-app codes for staff, before launch.
- **Privacy policy page:** needed before public sign-up opens (and before orders or the newsletter).
- **Email:** custom SMTP (Resend) before real customers.
- **Account deletion:** a self-service page.
- **Checkout:** decide guest vs account checkout. The checkout adapter sets `orders.user_id`.
- **Cleanup:** drop the unused `users` table from `0001`.

## 10. Decision log (owner's answers, 2026-09-11)

1. Cleanup: remove the YouTube keys from `.env` (**done**). Keep the notes folder, the plan file and the `CLAUDE.md` changes for later.
2. Login audience: originally admin-only, then **customers + admin** once "Customer sign-up" was chosen.
3. First admin scope: messages & signups. This became Part 2.
4. Login methods: **email + password and Google** ("click Google button and choose profile").
5. Architecture: **A, server-checked cookie sessions**.
6. Follow Mazora-Network's login patterns.
7. Extras: **forgot password (email code), customer sign-up, login pop-up**. Not Discord.
8. Build order: **2 parts, login first**.
9. Account page: **profile & security, saved shipping address, order history**.
10. Shipping: **Sri Lanka only**.
11. Form checks: **instant zod in the browser, lazily loaded** (the project-rule exception above).
