# Account entry redesign

Login, signup, forgot-password and reset-password share a full-width fashion
layout with the storefront Afacad typography, text wordmark, theme tokens,
language popup and theme toggle. Desktop pairs campaign photography with an
unboxed form on a continuous background. The header overlays the page without a
border, and campaign text overlays the photograph with a soft readability fade.
Mobile keeps this overlapping image and copy above the form. Inputs stay
at least 16px with 44–52px controls; the page scrolls naturally for exceptionally
short screens, enlarged text, error messages and the on-screen keyboard.
Portraits use contain to keep faces, sleeves
and complete shirt graphics visible. Form content appears immediately, avoiding
a faint first frame or animation-induced overflow.

Two new images were generated with the built-in image_gen tool exclusively for
these routes, then their studio backgrounds were removed with the same tool.
Login and recovery use `members-paradise-cutout.webp`; signup uses
`members-medusa-cutout.webp`, including its loading and closed states. Transparent
alpha blends the models into both themes without grey framing or image edges.
Their native 1086 × 1448 resolution is preserved in quality-95 WebP with full alpha
quality. Originals remain alongside the cutouts. Prompts and provenance are in
`auth-image-generation.json`.

Register now uses a wider form and paired name/email and password fields from
360px upward, with a single column on narrower phones. Spacing adapts to viewport
height. Tablet layouts give the form more width, and the register header uses a
smaller height on short desktop screens. The phone helper, password rules, legal
links and submit controls remain visible; no fixed-height overflow clipping is
used. Mobile campaign areas are 220px for login/recovery and 160px for register,
keeping the form close to the top. Unneeded leading input icons are removed from
the narrow register fields, while the password visibility buttons remain.

Source layout rules were reviewed at the 320px, 360px, 390px, 767px, 768px,
1024px, 1199px, 1280px, 1440px and 1920px breakpoints, and for desktop heights
of 640px, 700px, 768px and 900px. These are source checks, not browser-rendered
measurements; live viewport verification is still blocked as described below.

Server actions, Google sign-in, redirects, validation, password visibility,
password rules, code verification and resend cooldown are unchanged. Member
access still follows the existing launch and Supabase configuration gates.

Validation: production build, TypeScript, ESLint and all 190 existing tests
passed on 2026-10-15. Generated photos were inspected directly. Live browser
visual verification was completed after restarting the stopped preview server
and the user manually reopening the site. Login and register fit the tested
360×800, 390×844, 1024×768, 1280×640, 1280×720, 1440×900 and 1920×1080
English layouts. At 320px, natural scrolling keeps every field reachable. Sinhala
forms were checked at mobile and laptop widths in both themes. The small-screen
currency popup was repositioned to stay inside the viewport. See
`browser-verification.md` and `browser-readability-checks.json` for measured
results and screenshots.
