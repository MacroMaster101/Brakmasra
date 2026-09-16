import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, PackageCheck, Sparkles } from "lucide-react";
import { ProductCard } from "@/components/product-card";
import { NewsletterForm } from "@/components/newsletter-form";
import { Reveal } from "@/components/reveal";
import { products } from "@/data/products";
import { site, socialLinks } from "@/data/site";
import { commerceEnabled } from "@/lib/features";

export const metadata: Metadata = { alternates: { canonical: "/" } };

export default function Home() {
  const jsonLd = { "@context": "https://schema.org", "@type": "Organization", name: site.name, url: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000", description: site.description, ...(socialLinks.length ? { sameAs: socialLinks.map((link) => link.href) } : {}) };
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />

      <section className="home-hero">
        <Image className="home-hero-image" src="/images/brakmasra-hero.png" alt="Moonlit manor deep in a misty tropical forest" fill loading="eager" sizes="100vw" />
        <div className="home-hero-scrim" />
        <div className="page-shell home-hero-inner">
          <div className="home-hero-copy">
            <span className="eyebrow">The official BRAKMASRA store</span>
            <h1>Wear what follows you home.</h1>
            <p>Dark essentials shaped by night journeys, forgotten places, and the stories that refuse to leave.</p>
            <div className="button-row">
              <Link className="button button-primary" href="/shop">Explore the collection <ArrowUpRight /></Link>
              <Link className="button button-secondary" href="/about">Our story <ArrowRight /></Link>
            </div>
          </div>
        </div>
      </section>

      <aside className="preview-notice" aria-label="Collection launch status">
        <div className="page-shell"><span>First drop coming soon</span><p>Browse the upcoming collection now. Ordering opens after final availability and sizing are confirmed.</p></div>
      </aside>

      <section className="page-shell collection-section" id="collection">
        <Reveal>
          <div className="section-heading">
            <div><h2>The first signs have surfaced.</h2><p>Three dark essentials built around the mark of the unknown.</p></div>
            <Link className="text-link" href="/shop">View the collection <ArrowUpRight /></Link>
          </div>
        </Reveal>
        <div className="collection-grid">
          {products.map((product, index) => (
            <Reveal key={product.id} delay={index === 1 ? 1 : index === 2 ? 2 : undefined} className={index === 0 ? "collection-feature" : ""}>
              <ProductCard product={product} commerceEnabled={commerceEnabled} priority={index === 0} />
            </Reveal>
          ))}
        </div>
      </section>

      <section className="manifesto-section">
        <div className="page-shell manifesto-grid">
          <Reveal className="manifesto-art">
            <Image src="/images/brakmasra-logo-reference.png" alt="BRAKMASRA haunting artwork supplied as the brand reference" fill sizes="(max-width: 900px) 100vw, 42vw" />
          </Reveal>
          <Reveal className="manifesto-copy" delay={1}>
            <span className="eyebrow">Born after dark</span>
            <h2>Not souvenirs. Evidence.</h2>
            <p>Each piece carries the atmosphere of the places we enter: stark, weathered, and made to stay with you.</p>
            <Link className="text-link" href="/about">Read the story <ArrowRight /></Link>
          </Reveal>
        </div>
      </section>

      <section className="page-shell principles-section">
        <Reveal><h2>Built for the road after midnight.</h2></Reveal>
        <div className="principles-grid">
          <Reveal><article><Sparkles /><h3>Original artwork</h3><p>Visuals rooted in BRAKMASRA explorations, never generic horror graphics.</p></article></Reveal>
          <Reveal delay={1}><article><PackageCheck /><h3>A connected collection</h3><p>Apparel and headwear share one palette, one mark, and the same weathered finish.</p></article></Reveal>
        </div>
      </section>

      <section className="newsletter-section" id="drop-alerts">
        <div className="page-shell newsletter-grid">
          <Reveal><div><h2>Know when the signal returns.</h2><p>Drop news, restocks, and release dates. Nothing else.</p></div></Reveal>
          <Reveal delay={1}><NewsletterForm /></Reveal>
        </div>
      </section>
    </>
  );
}
