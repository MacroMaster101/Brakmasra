"use client";

import Image from "next/image";
import Link from "next/link";
import { X } from "lucide-react";

import { useLanguage } from "@/components/language-provider";
import type { TextKey } from "@/lib/i18n";

type AuthShellProps = {
  children: React.ReactNode;
  compact?: boolean;
  /** Leave both keys out when the content renders its own heading per step. */
  descriptionKey?: TextKey;
  titleKey?: TextKey;
};

export function AuthShell({ children, compact = false, descriptionKey, titleKey }: AuthShellProps) {
  const { t } = useLanguage();

  return (
    <section className="auth-page">
      <div className={`auth-shell${compact ? " is-compact" : ""}`}>
        <Link className="auth-home-link" href="/" aria-label={t.brandHomeLabel}>
          <Image src="/images/brakmasra-logo-reference.png" alt="" width={34} height={34} />
          <span>BRAKMASRA</span>
        </Link>
        <Link className="auth-close" href="/" aria-label={t.authCloseLabel}>
          <X aria-hidden="true" />
        </Link>

        <div className="auth-art" aria-hidden="true">
          <Image
            src="/images/auth-manor.png"
            alt=""
            fill
            sizes="(max-width: 767px) 100vw, 48vw"
          />
          <div className="auth-art-scrim" />
          <div className="auth-art-copy">
            <span>{t.authArtEyebrow}</span>
            <h2>{t.authArtTitle}</h2>
            <p>{t.authArtDesc}</p>
          </div>
        </div>

        <div className="auth-panel">
          <div className="auth-panel-inner">
            {titleKey && (
              <header className="auth-heading">
                <h1>{t[titleKey]}</h1>
                {descriptionKey && <p>{t[descriptionKey]}</p>}
              </header>
            )}
            {children}
          </div>
        </div>
      </div>
    </section>
  );
}
