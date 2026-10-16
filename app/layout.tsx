import type { Metadata, Viewport } from "next";
import { Afacad, Noto_Sans_Sinhala } from "next/font/google";
import { cookies, headers } from "next/headers";
import { connection } from "next/server";
import "./globals.css";
import "./storefront.css";
import "./storefront-navigation.css";
import "./storefront-auth.css";
import "./storefront-typography.css";
import "./storefront-about.css";
import "./storefront-editorial.css";
import "./storefront-shop.css";
import "./storefront-search.css";
import "./storefront-wishlist.css";
import "./storefront-cart.css";
import "./storefront-product.css";
import { ContentProvider } from "@/components/content-provider";
import { getPublicContent } from "@/lib/content";
import "./control-room.css";
import "./storefront-loading.css";
import "./storefront-visibility.css";
import { SiteFrame } from "@/components/site-frame";
import { site } from "@/data/site";
import { getSiteUrl } from "@/lib/auth";
import { launchMode } from "@/lib/features";
import { LANGUAGE_COOKIE, parseLanguage } from "@/lib/i18n";
import { CURRENCY_COOKIE, parseCurrency } from "@/lib/currency";
import { getUsdRate } from "@/lib/exchange-rates";
import { getCatalog } from "@/lib/store";
import { buildShopMenu } from "@/data/shop-menu";
import { getCurrentMember, memberSummary } from "@/lib/member";
import { defaultTitle, socialMetadata } from "@/lib/seo";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/next";

// Self-hosted Sinhala face. Only the Sinhala subset ships, so Latin text keeps
// the system stack, and the file downloads only when Sinhala glyphs render.
const notoSinhala = Noto_Sans_Sinhala({
  subsets: ["sinhala"],
  display: "swap",
  preload: false,
  adjustFontFallback: false,
  variable: "--font-sinhala",
});
const storefrontFont = Afacad({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-store",
});

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: { default: defaultTitle, template: `%s | ${site.name}` },
  description: site.description,
  applicationName: site.name,
  ...socialMetadata(defaultTitle, site.description),
};

export const viewport: Viewport = {
  colorScheme: "light dark",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fafafa" },
    { media: "(prefers-color-scheme: dark)", color: "#111112" },
  ],
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  await connection();
  const preferences = await cookies();
  const lang = parseLanguage(preferences.get(LANGUAGE_COOKIE)?.value);
  const currency = parseCurrency(preferences.get(CURRENCY_COOKIE)?.value);
  const usdRate = launchMode ? null : await getUsdRate();
  const [currentMember, catalog, content] = await Promise.all([getCurrentMember(), getCatalog(), getPublicContent()]);
  const member = memberSummary(currentMember);
  const shopMenu = buildShopMenu(catalog);
  const nonce = (await headers()).get("x-nonce") ?? undefined;

  return (
    <html
      lang={lang}
      className={`${notoSinhala.variable} ${storefrontFont.variable}`}
      data-scroll-behavior="smooth"
      suppressHydrationWarning
    >
      <head>
        <script
          nonce={nonce}
          dangerouslySetInnerHTML={{
            __html: `try{var theme=localStorage.getItem('brakmasra_theme');document.documentElement.dataset.theme=theme==='light'||theme==='dark'?theme:matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'}catch(e){}`,
          }}
        />
      </head>
      <body>
        <ContentProvider content={content}>
        <SiteFrame
          initialLang={lang}
          initialCurrency={currency}
          usdRate={usdRate}
          launchMode={launchMode}
          member={member}
          shopMenu={shopMenu}
        >
          {children}
        </SiteFrame>
        </ContentProvider>
        {process.env.VERCEL === "1" && (
          <>
            <SpeedInsights />
            <Analytics />
          </>
        )}
      </body>
    </html>
  );
}
