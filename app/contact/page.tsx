import type { Metadata } from "next";
import { ContactForm } from "@/components/contact-form";
export const metadata: Metadata = { title: "Contact", description: "Contact BRAKMASRA about orders, general questions, or business inquiries.", alternates: { canonical: "/contact" } };
export default function ContactPage() {
  return <div className="page-shell page-top">
    <header className="page-hero"><span className="eyebrow">Contact BRAKMASRA</span><h1>Keep the line open.</h1><p>Questions about products, orders, or working together? Send us a message.</p></header>
    <div className="contact-layout"><div className="contact-intro"><h2>What can we help with?</h2><p>Choose the closest topic and include any details that help us understand your request.</p><div className="support-options"><article><h3>Orders and sizing</h3><p>Include your order reference if you have one.</p></article><article><h3>Business inquiries</h3><p>Share the scope, timing, and best way to reply.</p></article></div><p className="muted">Never include passwords or payment card details.</p></div><ContactForm /></div>
  </div>;
}
