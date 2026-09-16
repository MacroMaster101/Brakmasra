import type { Metadata, Viewport } from "next";
import "./globals.css";
import { SiteFrame } from "@/components/site-frame";
import { site } from "@/data/site";
import { launchMode } from "@/lib/features";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: "BRAKMASRA | Official Store", template: "%s | BRAKMASRA" },
  description: site.description,
  openGraph: { type: "website", siteName: "BRAKMASRA", title: "BRAKMASRA | Official Store", description: site.description, images: ["/opengraph-image"] },
  twitter: { card: "summary_large_image", title: "BRAKMASRA | Official Store", images: ["/opengraph-image"] },
  icons: { icon: "/icon.svg" },
};

export const viewport: Viewport = { colorScheme: "dark", themeColor: "#050505", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en" data-scroll-behavior="smooth"><body><div id="page-top-sentinel" aria-hidden="true" /><SiteFrame launchMode={launchMode}>{children}</SiteFrame><SpeedInsights /><Analytics /></body></html>;
}
