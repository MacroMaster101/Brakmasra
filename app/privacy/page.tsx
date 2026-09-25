import type { Metadata } from "next";
import { LegalView } from "@/components/legal-view";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "What BRAKMASRA collects when you use the site, why, and the choices you have.",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return <LegalView document="privacy" />;
}
