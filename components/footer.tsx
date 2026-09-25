"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Mail, ShoppingBag } from "lucide-react";
import { footerColumns } from "@/data/navigation";
import { site } from "@/data/site";
import { useLanguage } from "@/components/language-provider";

export function Footer() {
  const pathname = usePathname();
  const { t } = useLanguage();
  const year = new Date().getFullYear();
  // The CTA banner is ONLY shown on the home page, never on other pages
  const isHomePage = pathname === "/";

  return (
    <footer className="site-footer">
      <span className="footer-watermark" aria-hidden="true">
        BRAKMASRA
      </span>

      <div className="footer-shell">
        {isHomePage && (
          <section className="footer-cta">
            <div>
              <span className="footer-cta-eyebrow">{t.footerCtaEyebrow}</span>
              <h2>{t.brandSlogan}</h2>
            </div>
            <Link className="button button-primary" href="/shop">
              <ShoppingBag />{t.footerCtaButton}
            </Link>
          </section>
        )}

        <div className="footer-grid">
          <div className="footer-intro">
            <Link href="/" className="footer-brand">
              <span className="brand-image">
                <Image src="/images/brakmasra-logo-reference.png" alt={t.footerEmblemAlt} width={44} height={44} />
              </span>
              <span>BRAKMASRA</span>
            </Link>
            <p>{t.brandSummary}</p>
            <a className="footer-email" href={`mailto:${site.supportEmail}`} aria-label={`${t.footerEmailLabel}: ${site.supportEmail}`}>
              <Mail aria-hidden="true" />
              <span>{site.supportEmail}</span>
            </a>
            <div className="footer-social">
              <a
                href="https://www.youtube.com/@Brakmasra"
                target="_blank"
                rel="noopener noreferrer"
                className="footer-social-btn footer-social-red"
                title={t.footerChannelTitle}
                aria-label="YouTube"
              >
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    fill="currentColor"
                    d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814z"
                  />
                  <polygon className="social-play-icon" points="9.545 15.568 9.545 8.432 15.818 12" />
                </svg>
                <span>YouTube</span>
              </a>
              <a
                href="https://www.tiktok.com/@Brakmasraofficial"
                target="_blank"
                rel="noopener noreferrer"
                className="footer-social-btn footer-social-tt"
                title={t.footerTikTokTitle}
                aria-label="TikTok"
              >
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    fill="currentColor"
                    d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 0 0-.79-.05A6.34 6.34 0 0 0 3 15.28 6.34 6.34 0 0 0 9.34 21.6a6.34 6.34 0 0 0 6.34-6.34V8.52a8.16 8.16 0 0 0 4.91 1.64V6.69z"
                  />
                </svg>
                <span>TikTok</span>
              </a>
            </div>
          </div>

          {footerColumns.map((column) => (
            <nav key={column.title} className="footer-col" aria-label={t[column.titleKey]}>
              <h2>{t[column.titleKey]}</h2>
              {column.links.map((link) => (
                <Link key={link.label} href={link.href}>
                  {t[link.labelKey]}
                </Link>
              ))}
            </nav>
          ))}
        </div>

        <div className="footer-bottom">
          <span>© {year} {t.footerCopyright}</span>
          <nav className="footer-legal" aria-label={`${t.legalPrivacy}, ${t.legalTerms}`}>
            <Link href="/privacy">{t.legalPrivacy}</Link>
            <Link href="/terms">{t.legalTerms}</Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}
