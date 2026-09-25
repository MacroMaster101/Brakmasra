import type { Metadata, Viewport } from "next";
import { Noto_Sans_Sinhala } from "next/font/google";
import { cookies } from "next/headers";
import { connection } from "next/server";
import "./globals.css";
import { SiteFrame } from "@/components/site-frame";
import { site } from "@/data/site";
import { getSiteUrl } from "@/lib/auth";
import { launchMode } from "@/lib/features";
import { LANGUAGE_COOKIE, parseLanguage } from "@/lib/i18n";
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

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: { default: defaultTitle, template: `%s | ${site.name}` },
  description: site.description,
  applicationName: site.name,
  ...socialMetadata(defaultTitle, site.description),
};

export const viewport: Viewport = { colorScheme: "dark", themeColor: "#050505", width: "device-width", initialScale: 1 };

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  await connection();
  const lang = parseLanguage((await cookies()).get(LANGUAGE_COOKIE)?.value);
  const member = memberSummary(await getCurrentMember());

  return (
    <html lang={lang} className={notoSinhala.variable} data-scroll-behavior="smooth">
      <body>
        <div id="page-top-sentinel" aria-hidden="true" />
        <SiteFrame initialLang={lang} launchMode={launchMode} member={member}>{children}</SiteFrame>
        <SpeedInsights />
        <Analytics />
      </body>
    </html>
  );
}
