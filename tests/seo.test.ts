import { afterEach, describe, expect, it } from "vitest";
import { site } from "@/data/site";
import { defaultTitle, homeJsonLd, pageMetadata } from "@/lib/seo";

const original = process.env.NEXT_PUBLIC_SITE_URL;

afterEach(() => {
  process.env.NEXT_PUBLIC_SITE_URL = original;
});

describe("pageMetadata", () => {
  it("gives each page its own share title, description, and URL", () => {
    const meta = pageMetadata({ title: "About", description: "The story.", path: "/about" });
    expect(meta.title).toBe("About");
    expect(meta.alternates).toEqual({ canonical: "/about" });
    expect(meta.openGraph).toMatchObject({ siteName: site.name, title: "About | BRAKMASRA", description: "The story.", url: "/about" });
    expect(meta.twitter).toMatchObject({ title: "About | BRAKMASRA", description: "The story." });
  });

  it("falls back to the site title and description for the home page", () => {
    const meta = pageMetadata({ path: "/" });
    expect(meta.title).toBeUndefined();
    expect(meta.description).toBe(site.description);
    expect(meta.openGraph).toMatchObject({ title: defaultTitle, url: "/" });
  });

  it("uses page images when given, the generated card otherwise", () => {
    expect(pageMetadata({ path: "/shop/x", images: ["/images/x.png"] }).openGraph).toMatchObject({ images: ["/images/x.png"] });
    expect(pageMetadata({ path: "/" }).openGraph).toMatchObject({ images: ["/opengraph-image"] });
  });
});

describe("homeJsonLd", () => {
  it("links the organization, logo, and profiles to the site origin", () => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://brakmasra.com/";
    const tiktok = "https://www.tiktok.com/@Brakmasraofficial";
    const [organization, website] = homeJsonLd([tiktok])["@graph"];
    expect(organization).toMatchObject({
      "@type": "Organization",
      url: "https://brakmasra.com",
      logo: "https://brakmasra.com/images/logo.png",
      sameAs: [tiktok],
    });
    expect(website).toMatchObject({ "@type": "WebSite", publisher: { "@id": "https://brakmasra.com/#organization" } });
  });

  it("leaves sameAs out when no profiles are configured", () => {
    expect(homeJsonLd([])["@graph"][0]).not.toHaveProperty("sameAs");
  });
});
