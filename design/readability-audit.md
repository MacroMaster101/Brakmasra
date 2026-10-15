# Site-wide readability pass — 2026-10-15

Reviewed the home page, shop and product cards/detail/quick view, about, contact,
cart, checkout/launch states, terms/privacy, login/signup/recovery, account pages,
staff pages and error states against the current light/dark storefront theme.

The shared typography layer uses a stable 16px root size, 16–18px descriptive
copy, stronger headings and action labels, and readable supporting text. Product
variants previously dropped to 8px on mobile, badges to about 8px, and quick-view
labels below 10px; these now use explicit pixel sizes and allow wrapping. Footer
contact information, newsletter consent, validation messages and legal links are
larger. Email addresses and long names wrap within their available widths.

Older dark-only fills and pale text were replaced in account fields, order rows,
staff panels, status badges and staff product forms. Success, error and role
states retain distinct meanings. The general error page uses the active theme,
while the photographic 404 page retains contrasting controls.

Mobile announcements use a short version of the existing launch notice and keep
the alert link visible. The announcement height is measured and shared with the
hero/header geometry. Mobile hero descriptions remain visible with a stronger
image fade behind the text. Section entrance animations no longer hide text
while waiting for an intersection callback. Account tabs wrap on phones.

Responsive source rules reviewed for 320px, 360px, 390px, 767/768px,
1023/1024px, 1199/1200px, 1440px and wide desktop layouts. All layouts retain
natural vertical scrolling when text, validation feedback, enlarged type or an
on-screen keyboard requires more space. Hidden accessibility labels, inactive
menu content and honeypot controls remain intentionally hidden.

Contrast calculations for the chosen body, supporting, success and error color
pairs range from 5.34:1 to 17.32:1, exceeding 4.5:1 for these tested pairs. These
calculations validate the palette, not every rendered image/text combination.

Production build (including TypeScript), ESLint and all 190 existing tests passed.
Live browser verification subsequently succeeded after the stopped dev server
was restarted and the user manually reopened the website. A matrix of 132 public
page/viewport/theme/language checks passed without measured horizontal overflow
or clipped text. Home and auth layouts, popup positioning and key UI interactions
were checked additionally. The browser verification found and fixed a currency
popup extending beyond the left edge on 320px screens, unnecessary short-screen
auth padding, and a faint auth-form entry animation. See `browser-verification.md`
for exact scope, limitations and screenshots.
