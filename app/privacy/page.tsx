import type { Metadata } from "next";
import { LegalView } from "@/components/legal-view";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Privacy Policy",
  description: "What BRAKMASRA collects when you use the site, why, and the choices you have.",
  path: "/privacy",
});

export default function PrivacyPage() {
  return <LegalView document="privacy" />;
}
