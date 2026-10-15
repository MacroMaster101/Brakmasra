# Live browser verification — 2026-10-15

The local Next.js server was restarted on `127.0.0.1:3000`. Browser access became
available after the user manually reopened the site from the failed connection
page. Testing used the existing in-app browser through its supported APIs.

132 settled-content checks passed. Each route was awaited by its actual page
heading before measuring document width, text boundaries and clipping:

- English, light and dark: 320×740, 390×844, 768×1024 and 1280×720.
- Sinhala, light and dark: 390×844 and 1280×720.
- Routes: shop, Paradise Lost product, about, contact, cart, checkout, terms,
  privacy, login, signup and forgot-password. Cart/checkout show current launch
  states. Authenticated account/staff contents were not exercised.

Home was additionally checked from 320px through 1920px. No horizontal document
overflow, off-screen text or directly clipped text was measured in these checks.
English login and register fit 360×800 phones and short 1280×640 laptop views;
they were also checked at larger phone, tablet and desktop sizes. Very narrow
phones, enlarged text, validation feedback or a keyboard may require natural
vertical scrolling; controls are never hidden to manufacture a viewport fit.

Mobile navigation and its Shop submenu opened correctly. Product quick view fit
inside a 390×844 viewport without horizontal overflow. Password visibility toggled
between text/password without entering or submitting credentials. Currency and
language popup bounds and Escape dismissal were checked, including footer menus.
No sign-up, Google login, password-reset email, newsletter or payment was submitted.

Live testing found and fixed:

- Currency popup left edge at −20px on a 320px screen: the shared preference menu
  now measures its anchor and panel, keeps a 16px viewport gutter and repositions
  its pointer. Resize handling preserves the same bounds.
- Excess auth padding on 640px-tall laptops and a few extra pixels on 360px phones.
- Auth form entry opacity briefly making text appear faint; forms now appear
  immediately.

The browser viewport, English language, light theme and original slideshow state
were restored after testing. No console errors were recorded in the test tab.

Evidence:

- `browser-readability-checks.json`: measured route, viewport, clipping and popup data.
- `previews/verified-register-desktop.jpg`: 1440×900 register page.
- `previews/verified-login-mobile.jpg`: 390×844 login page.

Production build, TypeScript, ESLint and all 190 existing tests passed after the
final fixes. Measurements and representative screenshots cover the listed cases;
they do not imply exhaustive coverage of every device or authenticated state.
