import type { Metadata } from "next";
import { LegalView } from "@/components/legal-view";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "The rules for using the BRAKMASRA website and member accounts.",
  alternates: { canonical: "/terms" },
};

export default function TermsPage() {
  return <LegalView document="terms" />;
}
