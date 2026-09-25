import type { Metadata } from "next";
import { ContactView } from "@/components/contact-view";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Contact",
  description: "Contact BRAKMASRA about orders, general questions, or business inquiries.",
  path: "/contact",
});

export default function ContactPage() {
  return <ContactView />;
}
