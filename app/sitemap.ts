import type { MetadataRoute } from "next";
import { videos } from "@/data/channel";
export default function sitemap(): MetadataRoute.Sitemap { const base = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"; const pages = ["", "/videos", "/shorts", "/playlists", "/about", "/shop", "/contact"]; return [...pages.map((path) => ({ url: `${base}${path}`, changeFrequency: path === "" ? "weekly" as const : "monthly" as const, priority: path === "" ? 1 : 0.7 })), ...videos.map((video) => ({ url: `${base}/videos/${video.id}`, changeFrequency: "monthly" as const, priority: 0.6 }))]; }
