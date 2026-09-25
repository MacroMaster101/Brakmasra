import type { Metadata } from "next";
import { headers } from "next/headers";
import { HomeView } from "@/components/home-view";
import { products } from "@/data/products";
import { site, socialLinks } from "@/data/site";
import { commerceEnabled } from "@/lib/features";

export const metadata: Metadata = { alternates: { canonical: "/" } };

export default async function Home() {
  const nonce = (await headers()).get("x-nonce") ?? undefined;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: site.name,
    url: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
    description: site.description,
    email: site.supportEmail,
    contactPoint: { "@type": "ContactPoint", contactType: "customer support", email: site.supportEmail, availableLanguage: ["English", "Sinhala"] },
    ...(socialLinks.length ? { sameAs: socialLinks.map((link) => link.href) } : {}),
  };

  return (
    <>
      <script
        nonce={nonce}
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
      <HomeView products={products} commerceEnabled={commerceEnabled} />
    </>
  );
}
