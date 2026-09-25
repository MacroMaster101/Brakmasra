import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/auth";
import { products } from "@/data/products";

const pages = ["", "/shop", "/about", "/contact"];
const legalPages = ["/privacy", "/terms"];

export default function sitemap(): MetadataRoute.Sitemap {
  const base = getSiteUrl();
  return [
    ...pages.map((path) => ({ url: `${base}${path}`, changeFrequency: path === "" ? "weekly" as const : "monthly" as const, priority: path === "" ? 1 : 0.7 })),
    ...legalPages.map((path) => ({ url: `${base}${path}`, changeFrequency: "yearly" as const, priority: 0.3 })),
    ...products.filter((product) => !product.preview).map((product) => ({ url: `${base}/shop/${product.slug}`, changeFrequency: "weekly" as const, priority: 0.8 })),
  ];
}
