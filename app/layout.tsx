import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { CartProvider } from "@/components/cart-provider";
import { BackToTop } from "@/components/back-to-top";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: "BRAKMASRA — Horror, Stories & Mystery", template: "%s | BRAKMASRA" },
  description: "The official BRAKMASRA creator hub for mysterious road trips, paranormal investigations, haunted explorations, and official merchandise.",
  alternates: { canonical: "/" },
  openGraph: { type: "website", siteName: "BRAKMASRA", title: "BRAKMASRA — Horror, Stories & Mystery", description: "Explore mysterious journeys, paranormal investigations, and haunted places with BRAKMASRA.", images: ["/opengraph-image"] },
  twitter: { card: "summary_large_image", title: "BRAKMASRA — Horror, Stories & Mystery", images: ["/opengraph-image"] },
  icons: { icon: "/icon.svg" },
};

export const viewport: Viewport = { colorScheme: "dark", themeColor: "#050505", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body><CartProvider><Header /><main id="content">{children}</main><Footer /><BackToTop /></CartProvider></body></html>;
}
