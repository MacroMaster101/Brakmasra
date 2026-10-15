"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowUp, Mail, CirclePlay } from "lucide-react";
import { site, whatsappLink, withWhatsAppMessage } from "@/data/site";
import { useLanguage } from "@/components/language-provider";
import { WhatsAppIcon } from "@/components/whatsapp-icon";
import { LanguageSwitcher } from "@/components/language-switcher";
import { NewsletterForm } from "@/components/newsletter-form";
import {
  CurrencySwitcher,
  CurrencyConversionNote,
} from "@/components/currency-switcher";

function scrollToTop() {
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  window.scrollTo({ top: 0, behavior: reduced ? "auto" : "smooth" });
}

export function Footer() {
  const { t } = useLanguage();
  const columns = [
    {
      title: t.storeInformation,
      links: [
        { label: t.navAbout, href: "/about" },
        { label: t.navContact, href: "/contact" },
        { label: t.navMyProfile, href: "/account" },
        { label: t.legalTerms, href: "/terms" },
      ],
    },
    {
      title: t.storeQuickShop,
      links: [
        { label: t.storeAllTees, href: "/shop" },
        { label: t.storeBlackTees, href: "/shop?color=black" },
        { label: t.storeWhiteTees, href: "/shop?color=white" },
        { label: t.storeSaved, href: "/shop?saved=1" },
      ],
    },
    {
      title: t.storeCustomerServices,
      links: [
        { label: t.footerOrderSupport, href: "/contact" },
        { label: t.storeDelivery, href: "/terms" },
        { label: t.legalPrivacy, href: "/privacy" },
        { label: t.storeReturns, href: "/terms" },
      ],
    },
  ];
  return (
    <footer className="site-footer fashion-footer">
      <div className="footer-shell">
        <div className="footer-grid">
          <div className="footer-intro">
            <Link href="/" className="footer-brand">
              <span className="brand-image">
                <Image
                  src="/images/logo.png"
                  alt={t.footerEmblemAlt}
                  width={40}
                  height={40}
                />
              </span>
              <span>BRAKMASRA</span>
            </Link>
            <p>{t.brandSummary}</p>
            <a className="footer-email" href={`mailto:${site.supportEmail}`}>
              <Mail aria-hidden="true" />
              <span>{site.supportEmail}</span>
            </a>
            <Link className="footer-contact-link" href="/contact">
              {t.navContact}
            </Link>
          </div>
          {columns.map((column) => (
            <nav
              key={column.title}
              className="footer-col"
              aria-label={column.title}
            >
              <h2>{column.title}</h2>
              {column.links.map((link) => (
                <Link key={link.label} href={link.href}>
                  {link.label}
                </Link>
              ))}
            </nav>
          ))}
          <div className="footer-newsletter">
            <h2>{t.storeFooterNewsletter}</h2>
            <p>{t.homeNewsletterDesc}</p>
            <NewsletterForm compact />
            <div className="footer-social">
              <a
                href="https://www.youtube.com/@Brakmasra"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="YouTube"
                title={t.footerChannelTitle}
              >
                <CirclePlay />
                <span className="sr-only">YouTube</span>
              </a>
              <a
                href="https://www.tiktok.com/@Brakmasraofficial"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="TikTok"
                title={t.footerTikTokTitle}
                className="footer-tiktok"
              >
                TikTok
              </a>
              {whatsappLink && (
                <a
                  href={withWhatsAppMessage(whatsappLink, t.whatsappMessage)}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={t.whatsappLabel}
                >
                  <WhatsAppIcon />
                </a>
              )}
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <span>
            © {new Date().getFullYear()} {t.footerCopyright}
          </span>
          <div className="footer-preferences">
            <LanguageSwitcher placement="up" />
            <CurrencySwitcher placement="up" />
          </div>
          <span className="footer-payment-note">{t.storePaymentLaunch}</span>
          <button
            type="button"
            className="icon-button footer-up"
            onClick={scrollToTop}
            aria-label={t.backToTop}
          >
            <ArrowUp />
          </button>
        </div>
        <CurrencyConversionNote attribution />
      </div>
    </footer>
  );
}
