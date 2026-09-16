import type { Metadata } from "next";
import { AboutView } from "@/components/about-view";

export const metadata: Metadata = {
  title: "About",
  description:
    "The story behind BRAKMASRA: paranormal investigations, psychological horror, and the official store.",
  alternates: { canonical: "/about" },
};

// Official YouTube channel link
const channelUrl = "https://www.youtube.com/@Brakmasra";

export default function AboutPage() {
  return <AboutView channelUrl={channelUrl} />;
}
