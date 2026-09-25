import type { Metadata } from "next";
import { LegalView } from "@/components/legal-view";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Terms of Service",
  description: "The rules for using the BRAKMASRA website and member accounts.",
  path: "/terms",
});

export default function TermsPage() {
  return <LegalView document="terms" />;
}
