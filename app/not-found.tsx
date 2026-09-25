"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ShoppingBag } from "lucide-react";

import { useLanguage } from "@/components/language-provider";

export default function NotFound() {
  const { t } = useLanguage();

  return (
    <section className="not-found" aria-labelledby="not-found-title">
      <div className="not-found-media" aria-hidden="true">
        <Image
          src="/images/404-haunted-path.png"
          alt=""
          fill
          sizes="100vw"
        />
      </div>
      <div className="not-found-scrim" aria-hidden="true" />

      <Link className="not-found-brand" href="/" aria-label={t.brandHomeLabel}>
        <span className="not-found-brand-mark">
          <Image
            src="/images/brakmasra-logo-reference.png"
            alt=""
            width={48}
            height={48}
          />
        </span>
        <span>BRAKMASRA</span>
      </Link>

      <div className="not-found-shell">
        <div className="not-found-copy">
          <span className="eyebrow">{t.notFoundEyebrow}</span>
          <span className="not-found-code" aria-hidden="true">404</span>
          <h1 id="not-found-title">{t.notFoundTitle}</h1>
          <p>{t.notFoundDesc}</p>
          <div className="button-row">
            <Link className="button button-primary" href="/">
              <ArrowLeft aria-hidden="true" />
              {t.notFoundHome}
            </Link>
            <Link className="button button-secondary" href="/shop">
              {t.notFoundShop}
              <ShoppingBag aria-hidden="true" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
