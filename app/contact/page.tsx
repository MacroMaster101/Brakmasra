import type { Metadata } from "next";
import { ContactView } from "@/components/contact-view";

export const metadata: Metadata = {
  title: "Contact",
  description: "Contact BRAKMASRA about orders, general questions, or business inquiries.",
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  return <ContactView />;
}
