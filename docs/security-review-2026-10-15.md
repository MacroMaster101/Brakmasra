# Security and GitHub readiness review — 2026-10-15

The source is suitable for a reviewed GitHub commit, with the development-only advisories below disclosed. This is a local code, dependency, build, and anonymous HTTP review, not a penetration test or confirmation that the production Supabase/Vercel accounts are configured correctly. No commit, push, deployment, account creation, valid form submission, or production database change was performed.

## Changes made

- Updated Next.js and its lint configuration from 16.3.4 to 16.3.8, sharp from 0.35.4 to 0.35.5, and drizzle-kit from 0.31.10 to 0.31.11. Applied compatible fixes for brace-expansion and source-map-js through the lockfile.
- Added a signed, 15-minute password-recovery grant. A verified recovery OTP issues the grant; the reset page and server action require it for the same user and session. Regular sign-in sessions cannot use the reset action to bypass the account password-change checks. The cookie is HttpOnly, SameSite=Lax, Secure in production, and cleared after a successful reset or logout. The existing six-digit recovery flow and verified recovery-token callback are supported; an OAuth callback cannot request a recovery grant by adding URL flags.
- Recovery grants use `RECOVERY_SIGNING_SECRET` (32+ random characters), falling back to the server-only Supabase secret. Missing signing configuration fails closed. No secret was added to source.
- Fixed confirmation redirects to preserve safe query parameters/fragments and omit provider errors or tokens from failure redirects.
- Rejected inherited object-property names when parsing legacy roles.
- Fixed same-origin checks for NextURL's loopback hostname normalization. Requests still require the actual protocol/Host origin; forwarded-host hints are not trusted.
- Set Node.js 24 LTS in `.nvmrc` and package engines. Node 20 is end of life. Local validation used Node 24.14.1; CI and hosting should install the latest patched Node 24 release.
- Added a production npm audit gate to the existing read-only CI workflow and weekly Dependabot checks. Updated the local Supabase password policy to match the application's strength rules. Remote provider settings were not changed.

## Verification

- ESLint and standalone TypeScript check passed.
- 204 tests passed across 32 files, including new recovery authorization, tampering/expiry/session binding, callback handling, malformed roles, and same-origin regression coverage.
- Production build passed on Next.js 16.3.8.
- `npm audit --omit=dev`: zero reported vulnerabilities. The complete dependency audit still has nine development-only findings, described below.
- The Git candidate scan found no matching high-confidence credential patterns or configured server secrets in candidate text files, and no configured server-secret values in `.next/static` browser bundles. `.env`, `.next`, and `node_modules` are ignored. No `.env`, `.env.local`, `.env.production`, `.pem`, or `.key` filenames were found in the available Git history. This is a targeted scan, not exhaustive historical secret detection.
- No candidate file exceeded 50 MiB.
- All 31 anonymous production HTTP checks passed: public routes, anonymous account/admin/export denial, recovery-page denial, protected secret paths, cron authentication, cross-origin form rejection, oversized-body rejection, launch checkout lock, hardening headers, and unique per-request CSP nonces. Next.js may express an anonymous reset-page redirect in streamed HTML with status 200; the check verifies the redirect target and absence of a password form.
- HTTP results are recorded in `design/production-security-checks.json`; dependency evidence is in `design/security-audit-{before,after,production}.json` and the targeted secret scan summary in `design/repository-security-scan.json`.

## Remaining dependency findings

| Dependency chain | Severity / package findings | Exposure and next step |
| --- | --- | --- |
| eslint-config-next → @next/eslint-plugin-next → fast-glob → micromatch → braces | 5 high | Development lint tooling. No production dependency exposure in the npm audit. Monitor for an upstream compatible fix; do not feed untrusted glob patterns to these tools. |
| drizzle-kit → @esbuild-kit/esm-loader → @esbuild-kit/core-utils → esbuild | 4 moderate | Development database tooling. The advisory concerns esbuild's development server. Do not expose database tooling or development servers publicly; update when compatible fixes are available. |

These are nine affected package entries across two underlying advisory chains, not nine independently demonstrated exploits. `npm audit fix --force` proposes downgrading eslint-config-next to 14.2.35 and drizzle-kit to 0.18.1. Those breaking downgrades were not applied. The full audit is not clean, even though the production-only audit is clean.

## Reviewed controls and limits

Server actions re-check the member's verified server-controlled role and permissions. API handlers retain same-origin checks, bounded request parsing, validation, rate limiting, and generic error responses. Upload handlers validate size/signature, bound decoded pixels, and re-encode images. SQL migrations enable RLS and revoke anonymous/authenticated table access. Cron requests require a configured secret and timing-safe comparison. Production CSP uses per-request script nonces, blocks framing, and excludes development `unsafe-eval`.

The shared rate limiter degrades to per-process counters during a database outage. Those counters cannot provide a global budget across serverless instances. Hosting-level abuse controls and the deployed rate-limit migrations still need verification.

Private staff/customer journeys were reviewed in source and unit tests, not exercised against real accounts. A real recovery email was not sent, credentials were not changed, and live RLS/provider settings were not inspected.

## Before deployment

- Keep `BRAKMASRA_LAUNCH_MODE=on`; checkout is intentionally unavailable and the payment adapter is not implemented. This review does not make purchasing ready for launch.
- Configure secrets through hosting settings, use the exact HTTPS site/callback URLs, and keep demo authentication disabled in production.
- Apply and verify the Supabase migrations and email templates in the intended production project. Check confirmation, secure password changes, recovery codes, staff roles, and RLS using controlled test accounts.
- Keep Node 24 patched on hosting and local machines. The project version declaration does not update an existing local Node installation.
- Review the Git diff, commit the new source/assets and lockfile together, and enable GitHub secret scanning/push protection where available. Those repository settings were not changed in this review.

## Advisory sources

- [Next.js ImageResponse advisory](https://github.com/advisories/GHSA-vcvr-r3jv-pc5j)
- [sharp/librsvg advisory](https://github.com/advisories/GHSA-wq5f-xc86-pv6w)
- [braces stack-exhaustion advisory](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm)
- [esbuild development-server advisory](https://github.com/advisories/GHSA-67mh-4wv8-2f99)
- [Node.js supported release status](https://nodejs.org/en/about/previous-releases)
