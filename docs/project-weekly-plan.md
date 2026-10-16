# BRAKMASRA weekly project plan

Prepared 16 October 2026. Dates use Asia/Colombo time.

This is a proposed six-week delivery plan starting Monday 19 October. Dates are targets, dependent on access, merchant approval, business decisions, and testing. A missed launch gate moves the release date; it does not reduce the checks. No deployment, external account change, payment, or scheduled automation is authorized by this document.

## Starting position

Based on the current repository and the local verification report:

- Storefront, product pages, wishlist, cart, account/authentication interfaces, mobile navigation, and loading states are implemented.
- Admin supports product/variant/stock/photo management, collections, discounts, order fulfilment updates, messages, subscribers, team roles, and website content.
- Content supports English/Sinhala page text and images, plus blog drafts, publication, unpublication, recoverable trash, and restore. Layouts remain fixed.
- The latest full recorded run passed 299 tests across 46 files, lint, and a production build. The later product edit-button change passed lint/type checks and browser navigation checks.
- Twenty-two database checks passed in a rolled-back transaction; disposable browser product/content records were cleaned up.
- These checks establish a local baseline, not production readiness or a guarantee that every future workflow is complete.

The main blocker is `app/api/checkout/route.ts`: it does not create payment sessions or complete orders. Paid-order creation, stock reservation/release, checkout coupon redemption, and payment reconciliation need implementation and testing. Existing order-management screens do not complete that buying flow. Setting launch mode off does not enable a payment adapter.

## Before Week 1: decisions to prepare, 16–18 October

The shop owner should provide:

- [ ] Launch country/regions and whether international delivery is in scope.
- [ ] Business/merchant details needed to apply for a suitable payment provider. Verify merchant eligibility, settlement currency, refunds, and supported checkout currencies before choosing. Do not assume the current Stripe-shaped environment checks settle this choice.
- [ ] First-release product list, approved prices, size measurements, colour names, actual stock by variant, and product photography.
- [ ] Shipping zones, fees, delivery estimates, courier/fulfilment process, and returns rules for review.
- [ ] Decision on LKR/USD: display currency versus actual payment/settlement currency; rate source, update process, and rounding if conversion is offered.
- [ ] Production domain, access owners for hosting/database/email, and a support inbox.
- [ ] A person responsible for orders/support and a small set of pilot testers.

Never put credentials in the plan, repository, or chat. Supply secrets through the intended service's secure configuration.

## Weekly overview

| Week | Dates | Focus | Shop owner provides | Development outcome | Completion gate |
| --- | --- | --- | --- | --- | --- |
| 1 | 19–25 Oct | Freeze launch scope and establish staging | Catalogue, shipping/currency decisions, merchant application, domain/support details | Reviewed baseline PR, updated setup documentation, isolated staging database/storage, migrations, environment inventory, acceptance checklist | Team can test staging without changing real shop data; provider choice is confirmed or approval dependency recorded |
| 2 | 26 Oct–1 Nov | Secure checkout and payment integration | Approved provider sandbox access and final charge/shipping rules | Server-priced checkout, variant validation, transactional stock handling, payment session, verified callbacks/webhooks, safe retries | Sandbox success/failure/cancellation, tampered prices, duplicate callbacks, and last-item concurrency all behave correctly |
| 3 | 2–8 Nov | Complete order operations | Fulfilment/support process, email sender, refund/cancellation rules | Order/customer-account integration, notifications, tracking, stock release, coupon redemption, refund/reconciliation workflow | One test purchase can be paid, viewed, fulfilled, tracked, cancelled/refunded as applicable, and reconciled without duplicate effects |
| 4 | 9–15 Nov | Final catalogue/content and usability | Approved real catalogue, policies, bilingual copy, support details | Catalogue populated, content published, metadata/images reviewed, accessible customer/admin journeys | Owner signs off every first-release item/page and completes phone/desktop shopping and management tasks |
| 5 | 16–22 Nov | Production readiness and release rehearsal | Production access/settings and release acceptance | Staged end-to-end checks, current security/dependency review, backups/restore exercise, monitoring, deployment/rollback runbook | No unresolved payment/security/data-loss blocker; successful restore and deployment rehearsal; production configuration checked |
| 6 | 23–29 Nov | Controlled pilot and launch decision | Pilot group, operational cover, explicit release approval | Monitored pilot, reconciled orders/stock, fixes, launch handover | Pilot orders reconcile; fulfilment/support work; owner approves opening sales; otherwise remain gated |

## Week 1 daily checklist

- **Monday:** agree the first release and acceptance checklist. Record business decisions and provider dependencies. Freeze optional redesigns.
- **Tuesday:** review the existing Git diff, separate completed work into reviewable feature PRs, confirm CI results, and update the README to match the current implementation. Do not describe launch mode off as a complete commerce integration.
- **Wednesday:** prepare isolated staging configuration and apply migrations, including the atomic catalogue migration. Verify storage/RLS/role separation with controlled accounts.
- **Thursday:** configure staging authentication redirects, sender/email templates, and test confirmation, Google sign-in if retained, recovery, account changes, and sign-out. The user performs credential changes where required.
- **Friday:** walk through admin product/photo/stock/collection/content workflows; confirm clear edit/save/delete feedback, permissions, and audit entries. Establish reproducible browser test coverage for core journeys.
- **Weekend review:** demonstrate staging, record blockers and approvals, choose Week 2 scope based on provider readiness.

## Week 2 implementation checklist: buying safely

- Reload live product/variant price, status, currency, and availability on the server. Reject inactive/unavailable items and invalid quantities; never trust browser totals.
- Implement shipping/address validation and agreed fee/tax treatment. Decide whether guest checkout is supported.
- Define pending order and payment states, immutable line-item price snapshots, and stable public order references.
- Reserve/decrement stock transactionally and define expiry, failed-payment, cancellation, and refund restocking rules. Test simultaneous buyers for the last item.
- Create provider sessions idempotently and verify signed provider events. Handle delayed/out-of-order/replayed events and network retries.
- Only trusted provider confirmation may mark an order paid. A browser success URL is not proof of payment.
- Add a useful customer confirmation, payment failure/retry experience, and a reconciliation path for missed callbacks.

## Week 3 implementation checklist: operating orders

- Show only the signed-in customer's orders in their account; verify access by a second customer and anonymous visitor.
- Keep payment state and fulfilment state consistent. Staff actions must not fabricate a successful payment.
- Send transactional confirmation/shipping/cancellation emails with retries and duplicate-send protection. Verify delivery through the configured sender.
- Complete shipment/tracking entry and customer visibility using the agreed courier process.
- Implement/verify discount eligibility, dates, minimum spend, limits, server totals, and concurrent redemption. Admin discount CRUD alone does not redeem a code.
- Define and exercise refunds, partial refunds if included, cancellation, returns, stock updates, and payment reconciliation. Use provider tools or an audited admin workflow as agreed; avoid unsynchronized status-only refunds.
- Verify contact and newsletter intake, admin handling/export, and intended follow-up delivery. A stored subscriber list is not a newsletter campaign system. Add campaign tooling only if it is in the launch scope.

## Week 4 content and experience checklist

- Replace demonstration product details with approved SKU/variant stock, prices, fabric/care, measurements, and realistic photo sets.
- Confirm upcoming categories have clear coming-soon states and cannot be purchased prematurely.
- Review English/Sinhala text, currency formatting, product search/filtering, wishlist/cart persistence, empty/error states, and keyboard focus.
- Verify login, registration, confirmation, recovery, and account screens at narrow widths and with the on-screen keyboard. Keep desktop auth cutouts and compact mobile animation as approved.
- Review real delivery/returns/privacy/terms/contact information with the responsible business owner; do not treat template wording as approved policy.
- Verify meaningful page titles/descriptions, product social images, sitemap entries, canonical URLs, image sharpness/transfer size, and redirect behaviour. Publish only approved journal stories.

## Week 5 quality and operations checklist

- Run current lint, type checks, unit/integration tests, production build, and dependency/security scans. Existing reports are dated evidence, not a current all-clear.
- Add/exercise browser end-to-end coverage for browse → product → cart → checkout → account order and admin fulfilment, plus auth/recovery/content publication.
- Test phone/tablet/desktop, light/dark, English/Sinhala, keyboard/screen-reader essentials, slow network, failed uploads, and API/provider errors.
- Verify deployed HTTPS/site URL, allowed callbacks, server-only secrets, demo mode disabled, RLS, storage access, webhook secrets, cron authentication, rate limiting, and restricted admin access.
- Check production logging/alerts without exposing credentials or unnecessary personal data. Assign who receives and handles failures.
- Back up database and uploaded assets; demonstrate restoration in an isolated environment. Record retention/access decisions and recovery steps.
- Rehearse migration/deployment/rollback; account for schema changes that cannot be reversed by rolling back application code alone.
- Verify hosting/storage/image transformation/database limits and set usage monitoring or budgets where supported.

## Week 6 pilot checklist

- Obtain explicit approval before production deployment/opening sales and before any live payment used for verification. Record any approved test-payment limit.
- Start with a small agreed tester group and a limited first-release catalogue.
- Reconcile each pilot payment, order, stock change, notification, and fulfilment event.
- Fix release blockers, repeat affected tests, and keep a rollback/ordering-disable option available.
- Open general sales only after the launch gate below passes. If provider approval is delayed, publish browse-only/prelaunch content while purchasing remains gated.
- Hand over: catalogue edits, stock changes, order fulfilment, support, refunds, content publishing, backup/restore, incident handling, and access ownership.

## Required launch gate

- [ ] Payment provider approved and verified in the intended production environment.
- [ ] Server-calculated totals/currencies/shipping are correct; test payments reconcile.
- [ ] Duplicate events/retries do not duplicate orders, charges, emails, discounts, or stock changes.
- [ ] Stock cannot oversell under the agreed policy; cancellation/expiry/restocking are verified.
- [ ] Customer orders, confirmation messages, tracking, support, and refund process work.
- [ ] Catalogue/stock, delivery estimates, policies, and business contact details are approved.
- [ ] Anonymous/customer/staff access checks pass; secrets, roles, migrations, and RLS are verified.
- [ ] Backup/restore, monitoring, deployment and rollback have named owners and tested steps.
- [ ] Responsive/accessibility checks and CI pass; no unresolved release blocker remains.
- [ ] Owner explicitly approves launch.

## Weekly working routine

- **Monday:** agree a small weekly outcome and resolve required owner inputs.
- **Tuesday–Thursday:** implement and verify against acceptance criteria; report blockers promptly.
- **Friday:** demonstrate on staging, inspect failures, review PRs, and update this checklist.
- **After every change:** run checks appropriate to its risk; repeat affected end-to-end flows before release.
- **After launch:** daily order/payment/stock reconciliation and error/support review in the first week; weekly dependency/backups/access/analytics review thereafter.

## Defer until the first buying flow is stable

Loyalty points, advanced sales dashboards, automated marketing campaigns, reviews/social proof, drag-and-drop page building, extra payment providers, and new categories without real stock. Treat these as a separate backlog rather than promises of existing functionality.

## Evidence

- `design/control-room-verification.md`: current management/loading verification and limits.
- `docs/security-review-2026-10-15.md`: earlier security review; rerun current checks before release.
- `app/api/checkout/route.ts`: incomplete payment adapter boundary.
- `.github/workflows/ci.yml`: existing automated quality gates.
