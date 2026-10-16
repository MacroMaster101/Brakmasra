"use client";

import Image from "@/components/store-image";
import Link from "next/link";
import {
  ArrowUpRight,
  Headphones,
  PackageOpen,
  BadgeCheck,
  Truck,
} from "lucide-react";
import { useState } from "react";
import { ProductCard } from "@/components/product-card";
import { NewsletterForm } from "@/components/newsletter-form";
import { Reveal } from "@/components/reveal";
import { useLanguage } from "@/components/language-provider";
import type { Product } from "@/data/products";
import { Testimonials } from "@/components/testimonials";
import { CampaignHero } from "@/components/campaign-hero";

export function HomeView({
  products,
  commerceEnabled,
}: {
  products: Product[];
  commerceEnabled: boolean;
}) {
  const { t } = useLanguage();
  const [filter, setFilter] = useState("all");
  const visible = products.filter(
    (product) =>
      filter === "all" ||
      product.colors.some((color) => color.toLowerCase().includes(filter)),
  );
  const collections = [
    {
      title: t.storeBlackTees,
      description: t.storeBlackDesc,
      image: "/images/models/caged-freedom.webp",
      href: "/shop?color=black",
    },
    {
      title: t.storeWhiteTees,
      description: t.storeWhiteDesc,
      image: "/images/models/paradise-lost.webp",
      href: "/shop?color=white",
    },
    {
      title: t.storeAllTees,
      description: t.storeAllDesc,
      image: "/images/models/intoxicated-medusa.webp",
      href: "/shop",
    },
  ];
  return (
    <div className="storefront-home">
      <CampaignHero />
      {!commerceEnabled && (
        <aside className="store-launch-note">
          <div className="page-shell">
            <strong>{t.homeNoticeTitle}</strong>
            <span>{t.homeNoticeDesc}</span>
          </div>
        </aside>
      )}
      <section className="page-shell arrivals-section" id="collection">
        <Reveal>
          <div className="store-section-heading">
            <h2>{t.storeNewArrivals}</h2>
            <p>{t.homeSignsDesc}</p>
          </div>
        </Reveal>
        <div
          className="collection-tabs"
          role="group"
          aria-label={t.shopFilterLabel}
        >
          {[
            ["all", t.storeAllTees],
            ["black", t.storeBlackTees],
            ["white", t.storeWhiteTees],
          ].map(([value, label]) => (
            <button
              type="button"
              key={value}
              aria-pressed={filter === value}
              onClick={() => setFilter(value)}
            >
              {label}
            </button>
          ))}
        </div>
        {visible.length ? (
          <div className="product-grid">
            {visible.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                commerceEnabled={commerceEnabled}
              />
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <p>{t.shopNoResultsDesc}</p>
          </div>
        )}
        <div className="section-view-all">
          <Link className="button button-secondary" href="/shop">
            {t.homeViewCollection}
            <ArrowUpRight />
          </Link>
        </div>
      </section>
      <section className="page-shell explore-section" id="collections">
        <Reveal>
          <div className="store-section-heading">
            <h2>{t.storeExploreTitle}</h2>
          </div>
        </Reveal>
        <div className="collection-tiles">
          {collections.map((collection, index) => (
            <Reveal key={collection.href} delay={(index + 1) as 1 | 2 | 3}>
              <Link className="collection-tile" href={collection.href}>
                <div className="collection-tile-image">
                  <Image
                    src={collection.image}
                    alt={collection.title}
                    fill
                    sizes="(max-width: 767px) 100vw, 33vw"
                  />
                </div>
                <div className="collection-tile-copy">
                  <div>
                    <h3>{collection.title}</h3>
                    <p>{collection.description}</p>
                  </div>
                  <ArrowUpRight />
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>
      <section className="page-shell editorial-section">
        <Reveal className="editorial-grid">
          <div className="editorial-image">
            <Image
              src="/images/models/silent-faith.webp"
              alt={t.productPhotoAlt("Silent Faith Tee")}
              fill
              sizes="(max-width: 767px) 100vw, 50vw"
            />
          </div>
          <div className="editorial-copy">
            <h2>{t.storeEditorialTitle}</h2>
            <p>{t.storeEditorialDesc}</p>
            <Link className="button button-primary" href="/about">
              {t.homeOurStoryBtn}
              <ArrowUpRight />
            </Link>
          </div>
        </Reveal>
      </section>
      <section
        className="page-shell store-services"
        aria-label={t.storeServices}
      >
        <Link href="/contact">
          <Headphones />
          <h3>{t.storeCustomerService}</h3>
          <p>{t.storeCustomerServiceDesc}</p>
        </Link>
        <Link href="/terms">
          <PackageOpen />
          <h3>{t.storeReturns}</h3>
          <p>{t.storeReturnsDesc}</p>
        </Link>
        <Link href="/about">
          <BadgeCheck />
          <h3>{t.storeOriginalDesign}</h3>
          <p>{t.storeOriginalDesignDesc}</p>
        </Link>
        <Link href="/terms">
          <Truck />
          <h3>{t.storeDelivery}</h3>
          <p>{t.storeDeliveryDesc}</p>
        </Link>
      </section>
      <Testimonials />
      <section className="page-shell lookbook-section" id="lookbook">
        <Reveal>
          <div className="store-section-heading">
            <h2>{t.storeLookbookTitle}</h2>
            <p>{t.storeLookbookDesc}</p>
          </div>
        </Reveal>
        <div className="lookbook-grid">
          {products.slice(0, 4).map((product) => (
            <Link
              key={product.id}
              href={`/shop/${product.slug}`}
              aria-label={product.name}
            >
              <Image
                src={product.images[0]}
                alt={t.productPhotoAlt(product.name)}
                fill
                sizes="(max-width: 767px) 50vw, 25vw"
              />
              <span>
                <ArrowUpRight />
              </span>
            </Link>
          ))}
        </div>
      </section>
      <section className="newsletter-section" id="drop-alerts">
        <div className="page-shell newsletter-grid">
          <Reveal>
            <h2>{t.homeNewsletterTitle}</h2>
            <p>{t.homeNewsletterDesc}</p>
          </Reveal>
          <Reveal delay={1}>
            <NewsletterForm />
          </Reveal>
        </div>
      </section>
    </div>
  );
}
