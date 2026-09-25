"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BellRing, LockKeyhole, ShoppingBag } from "lucide-react";

import { AuthShell } from "@/components/auth-shell";
import { useLanguage } from "@/components/language-provider";
import type { TextKey } from "@/lib/i18n";

export function AuthComingSoon() {
  const { t } = useLanguage();

  return (
    <AuthShell titleKey="authSoonTitle" descriptionKey="authSoonDesc">
      <div className="auth-coming-soon">
        <div className="launch-status"><LockKeyhole aria-hidden="true" /><span>{t.comingSoonClosedStatus}</span></div>
        <p>{t.comingSoonNoAccountNeeded}</p>
        <div className="launch-actions">
          <Link className="button button-primary" href="/shop">{t.homeExploreBtn} <ArrowRight /></Link>
          <Link className="button button-secondary" href="/#drop-alerts">{t.homeNewsletterBtn} <BellRing /></Link>
        </div>
      </div>
    </AuthShell>
  );
}

type StoreComingSoonProps = {
  area: "account" | "cart" | "checkout";
};

const storeCopy: Record<StoreComingSoonProps["area"], { eyebrow: TextKey; title: TextKey; description: TextKey }> = {
  account: {
    eyebrow: "comingSoonAccountEyebrow",
    title: "comingSoonAccountTitle",
    description: "comingSoonAccountDesc",
  },
  cart: {
    eyebrow: "comingSoonCartEyebrow",
    title: "comingSoonCartTitle",
    description: "comingSoonCartDesc",
  },
  checkout: {
    eyebrow: "comingSoonCheckoutEyebrow",
    title: "comingSoonCheckoutTitle",
    description: "comingSoonCheckoutDesc",
  },
};

export function StoreComingSoon({ area }: StoreComingSoonProps) {
  const { t } = useLanguage();
  const copy = storeCopy[area];
  const Icon = area === "account" ? LockKeyhole : ShoppingBag;

  return (
    <section className="launch-page">
      <div className="page-shell launch-layout">
        <div className="launch-copy">
          <span className="eyebrow">{t[copy.eyebrow]}</span>
          <h1>{t[copy.title]}</h1>
          <p>{t[copy.description]}</p>
          <div className="launch-actions">
            <Link className="button button-primary" href="/shop">{t.homeExploreBtn} <ArrowRight /></Link>
            <Link className="button button-secondary" href="/#drop-alerts">{t.homeNewsletterBtn} <BellRing /></Link>
          </div>
          <p className="launch-footnote"><Icon aria-hidden="true" /> {t.comingSoonFootnote}</p>
        </div>

        <div className="launch-visual" aria-hidden="true">
          <Image src="/images/brakmasra-hero.png" alt="" fill sizes="(max-width: 900px) 100vw, 48vw" />
          <div className="launch-visual-scrim" />
          <div className="launch-visual-mark">
            <Image src="/images/brakmasra-logo-reference.png" alt="" width={104} height={104} />
            <span>BRAKMASRA</span>
            <small>{t.homeNoticeTitle}</small>
          </div>
        </div>
      </div>
    </section>
  );
}

export function ProductComingSoon() {
  const { t } = useLanguage();

  return (
    <div className="product-launch-state">
      <div>
        <span className="eyebrow">{t.shopComingSoon}</span>
        <h2>{t.productNotOpenTitle}</h2>
        <p>{t.productNotOpenDesc}</p>
      </div>
      <div className="launch-actions">
        <Link className="button button-primary" href="/#drop-alerts">{t.homeNewsletterBtn} <BellRing /></Link>
        <Link className="button button-secondary" href="/shop">{t.productBackToCollection}</Link>
      </div>
    </div>
  );
}
