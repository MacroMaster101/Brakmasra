"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, PackageCheck, Sparkles } from "lucide-react";
import { ProductCard } from "@/components/product-card";
import { NewsletterForm } from "@/components/newsletter-form";
import { Reveal } from "@/components/reveal";
import { useLanguage } from "@/components/language-provider";
import type { Product } from "@/data/products";

export function HomeView({
  products,
  commerceEnabled,
}: {
  products: Product[];
  commerceEnabled: boolean;
}) {
  const { t } = useLanguage();

  return (
    <>
      <section className="home-hero">
        <Image
          className="home-hero-image"
          src="/images/brakmasra-hero.png"
          alt="Moonlit manor deep in a misty tropical forest"
          fill
          loading="eager"
          sizes="100vw"
        />
        <div className="home-hero-scrim" />
        <div className="page-shell home-hero-inner">
          <div className="home-hero-copy">
            <span className="eyebrow">{t.homeHeroEyebrow}</span>
            <h1>{t.homeHeroTitle}</h1>
            <p>{t.homeHeroDesc}</p>
            <div className="button-row">
              <Link className="button button-primary" href="/shop">
                {t.homeExploreBtn} <ArrowUpRight />
              </Link>
              <Link className="button button-secondary" href="/about">
                {t.homeOurStoryBtn} <ArrowRight />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <aside className="preview-notice" aria-label="Collection launch status">
        <div className="page-shell">
          <span>{t.homeNoticeTitle}</span>
          <p>{t.homeNoticeDesc}</p>
        </div>
      </aside>

      <section className="page-shell collection-section" id="collection">
        <Reveal>
          <div className="section-heading">
            <div>
              <h2>{t.homeSignsTitle}</h2>
              <p>{t.homeSignsDesc}</p>
            </div>
            <Link className="text-link" href="/shop">
              {t.homeViewCollection} <ArrowUpRight />
            </Link>
          </div>
        </Reveal>
        <div className="collection-grid">
          {products.map((product, index) => (
            <Reveal
              key={product.id}
              delay={index === 1 ? 1 : index === 2 ? 2 : undefined}
              className={index === 0 ? "collection-feature" : ""}
            >
              <ProductCard
                product={product}
                commerceEnabled={commerceEnabled}
                priority={index === 0}
              />
            </Reveal>
          ))}
        </div>
      </section>

      <section className="manifesto-section">
        <div className="page-shell manifesto-grid">
          <Reveal className="manifesto-art">
            <Image
              src="/images/brakmasra-logo-reference.png"
              alt="BRAKMASRA haunting artwork supplied as the brand reference"
              fill
              sizes="(max-width: 900px) 100vw, 42vw"
            />
          </Reveal>
          <Reveal className="manifesto-copy" delay={1}>
            <span className="eyebrow">{t.homeManifestoEyebrow}</span>
            <h2>{t.homeManifestoTitle}</h2>
            <p>{t.homeManifestoDesc}</p>
            <Link className="text-link" href="/about">
              {t.homeReadStory} <ArrowRight />
            </Link>
          </Reveal>
        </div>
      </section>

      <section className="page-shell principles-section">
        <Reveal>
          <h2>{t.homePrinciplesTitle}</h2>
        </Reveal>
        <div className="principles-grid">
          <Reveal>
            <article>
              <Sparkles />
              <h3>{t.homePrinciple1Title}</h3>
              <p>{t.homePrinciple1Desc}</p>
            </article>
          </Reveal>
          <Reveal delay={1}>
            <article>
              <PackageCheck />
              <h3>{t.homePrinciple2Title}</h3>
              <p>{t.homePrinciple2Desc}</p>
            </article>
          </Reveal>
        </div>
      </section>

      <section className="newsletter-section" id="drop-alerts">
        <div className="page-shell newsletter-grid">
          <Reveal>
            <div>
              <h2>{t.homeNewsletterTitle}</h2>
              <p>{t.homeNewsletterDesc}</p>
            </div>
          </Reveal>
          <Reveal delay={1}>
            <NewsletterForm />
          </Reveal>
        </div>
      </section>
    </>
  );
}
