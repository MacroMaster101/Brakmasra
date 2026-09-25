import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/auth";

export default function robots(): MetadataRoute.Robots {
  const base = getSiteUrl();
  return {
    rules: [{
      userAgent: "*",
      allow: "/",
      disallow: [
        "/account",
        "/admin",
        "/api",
        "/auth",
        "/cart",
        "/checkout",
        "/forgot-password",
        "/login",
        "/reset-password",
        "/signup",
      ],
    }],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
