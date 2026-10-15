"use client";

import Image from "next/image";
import Link from "next/link";
import { X } from "lucide-react";

import { useLanguage } from "@/components/language-provider";
import { LanguageSwitcher } from "@/components/language-switcher";
import { ThemeToggle } from "@/components/theme-toggle";
import type { TextKey } from "@/lib/i18n";

type AuthShellProps = {
  children: React.ReactNode;
  compact?: boolean;
  /** Leave both keys out when the content renders its own heading per step. */
  descriptionKey?: TextKey;
  titleKey?: TextKey;
};

export function AuthShell({
  children,
  compact = false,
  descriptionKey,
  titleKey,
}: AuthShellProps) {
  const { t } = useLanguage();

  return (
    <section className={`auth-page${compact ? " is-register" : ""}`}>
      <header className="auth-topbar">
        <Link className="auth-home-link" href="/" aria-label={t.brandHomeLabel}>
          <span>BRAKMASRA</span>
        </Link>
        <div className="auth-preferences">
          <LanguageSwitcher />
          <ThemeToggle />
          <Link className="auth-close" href="/" aria-label={t.authCloseLabel}>
            <X aria-hidden="true" />
          </Link>
        </div>
      </header>

      <div className={`auth-shell${compact ? " is-compact" : ""}`}>
        <div className="auth-art" aria-hidden="true">
          <div className="auth-art-image">
            <Image
              src={
                compact
                  ? "/images/auth/members-medusa-cutout.webp"
                  : "/images/auth/members-paradise-cutout.webp"
              }
              alt=""
              fill
              preload
              quality={95}
              sizes="(max-width: 767px) 76vw, 50vw"
            />
          </div>
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
