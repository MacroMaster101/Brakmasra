import type { Metadata } from "next";
import { site } from "@/data/site";
import { getSiteUrl } from "@/lib/auth";

export const defaultTitle = `${site.name} | ${site.tagline}`;
export const logoPath = "/images/logo.png";
const defaultImages = ["/opengraph-image"];

// Next.js replaces a parent's whole `openGraph`/`twitter` object when a page
// sets its own, so every page builds both from here to keep the shared fields.
export function socialMetadata(title: string, description: string, url?: string, images = defaultImages): Metadata {
  return {
    openGraph: { type: "website", siteName: site.name, locale: "en_US", title, description, images, ...(url ? { url } : {}) },
    twitter: { card: "summary_large_image", title, description, images },
  };
}

type PageSeo = { title?: string; description?: string; path: string; images?: string[] };

/** Title, description, canonical URL and share cards for one public page. */
export function pageMetadata({ title, description = site.description, path, images }: PageSeo): Metadata {
  return {
    ...(title ? { title } : {}),
    description,
    alternates: { canonical: path },
    ...socialMetadata(title ? `${title} | ${site.name}` : defaultTitle, description, path, images),
  };
}

/** Organization and WebSite structured data for the home page. */
export function homeJsonLd(sameAs: string[]) {
  const url = getSiteUrl();
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${url}/#organization`,
        name: site.name,
        url,
        logo: `${url}${logoPath}`,
        description: site.description,
        email: site.supportEmail,
        contactPoint: { "@type": "ContactPoint", contactType: "customer support", email: site.supportEmail, availableLanguage: ["English", "Sinhala"] },
        ...(sameAs.length ? { sameAs } : {}),
      },
      {
        "@type": "WebSite",
        "@id": `${url}/#website`,
        name: site.name,
        url,
        inLanguage: ["en", "si"],
        publisher: { "@id": `${url}/#organization` },
      },
    ],
  };
}
