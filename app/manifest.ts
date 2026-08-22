import type { MetadataRoute } from "next";
export default function manifest(): MetadataRoute.Manifest { return { name: "BRAKMASRA", short_name: "BRAKMASRA", description: "Horror, stories, mystery, and official merchandise.", start_url: "/", display: "standalone", background_color: "#050505", theme_color: "#050505", icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml" }] }; }
