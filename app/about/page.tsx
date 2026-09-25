import type { Metadata } from "next";
import { AboutView } from "@/components/about-view";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "About",
  description:
    "The story behind BRAKMASRA: paranormal investigations, psychological horror, and the official store.",
  path: "/about",
});

// Official YouTube channel link
const channelUrl = "https://www.youtube.com/@Brakmasra";

export default function AboutPage() {
  return <AboutView channelUrl={channelUrl} />;
}
