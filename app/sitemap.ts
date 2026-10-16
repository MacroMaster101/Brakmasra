import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/auth";
import { getCatalog } from "@/lib/store";
import { getPublicContent } from "@/lib/content";

const pages = ["", "/shop", "/about", "/contact"];
const legalPages = ["/privacy", "/terms"];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = getSiteUrl();
  const [products, content] = await Promise.all([getCatalog(), getPublicContent()]);
  return [
    ...pages.map((path) => ({ url: `${base}${path}`, changeFrequency: path === "" ? "weekly" as const : "monthly" as const, priority: path === "" ? 1 : 0.7 })),
    ...legalPages.map((path) => ({ url: `${base}${path}`, changeFrequency: "yearly" as const, priority: 0.3 })),
    { url: `${base}/blog`, changeFrequency: "monthly" as const, priority: 0.7 },
    ...content.posts.map((post) => ({ url: `${base}/blog/${post.slug}`, changeFrequency: "monthly" as const, priority: 0.5 })),
    ...products.filter((product) => !product.preview).map((product) => ({ url: `${base}/shop/${product.slug}`, changeFrequency: "weekly" as const, priority: 0.8 })),
  ];
}
