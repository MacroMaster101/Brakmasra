import type { Metadata } from "next";
import { headers } from "next/headers";
import { HomeView } from "@/components/home-view";
import { products } from "@/data/products";
import { socialLinks } from "@/data/site";
import { commerceEnabled } from "@/lib/features";
import { homeJsonLd, pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({ path: "/" });

export default async function Home() {
  const nonce = (await headers()).get("x-nonce") ?? undefined;
  const jsonLd = homeJsonLd(socialLinks.map((link) => link.href));

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
