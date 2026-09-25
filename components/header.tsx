"use client";

import Image from "next/image";
import Link from "next/link";
import { LogIn, Menu, ShoppingBag, Sparkles, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useCart } from "@/components/cart-provider";
import { LanguageSwitcher } from "@/components/language-switcher";
import { useLanguage } from "@/components/language-provider";
import { MemberMenu, MobileAccountPanel } from "@/components/member-menu";
import { authNav, joinNav, primaryNav } from "@/data/navigation";
import type { MemberSummary } from "@/lib/member";

export function Header({ commerceEnabled, member }: { commerceEnabled: boolean; member: MemberSummary | null }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const { count } = useCart();
  const { t } = useLanguage();
  const isActive = (href: string) => pathname === href || (href !== "/" && pathname.startsWith(`${href}/`));

  return (
    <header className="site-header">
      <a className="skip-link" href="#content">{t.skipLink}</a>
      <div className="nav-shell">
        <Link
          className="brand"
          href="/"
          aria-label={t.brandHomeLabel}
          onClick={() => {
            if (pathname === "/") {
              window.scrollTo({ top: 0, behavior: "smooth" });
            }
          }}
        >
          <span className="brand-image"><Image src="/images/logo.png" alt="" width={42} height={42} loading="eager" /></span>
          <span>BRAKMASRA</span>
        </Link>
        <nav className={`nav-links ${open ? "is-open" : ""}`} aria-label={t.navPrimaryLabel}>
          <button type="button" className="mobile-close" onClick={() => setOpen(false)} aria-label={t.navCloseMenu}><X /></button>
          {primaryNav.map(({ labelKey, href }) => (
            <Link
              key={href}
              href={href}
              onClick={() => {
                setOpen(false);
                if (pathname === href) {
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }
              }}
              aria-current={isActive(href) ? "page" : undefined}
            >
              {t[labelKey]}
            </Link>
          ))}
          <MobileAccountPanel member={member} onNavigate={() => setOpen(false)} />
          <div className="mobile-lang-wrap">
            <LanguageSwitcher showLabels />
          </div>
        </nav>
        <div className="nav-actions">
          <Link
            className="icon-button cart-link"
            href="/cart"
            aria-label={commerceEnabled ? t.navCartWithItems(count) : t.navCart}
          >
            <ShoppingBag />
            {commerceEnabled && count > 0 && <span>{count}</span>}
          </Link>
          <LanguageSwitcher className="nav-lang-desktop" />
          <span className="nav-divider" aria-hidden="true" />
          <div className="nav-auth">
            {member ? (
              <MemberMenu member={member} />
            ) : (
              <>
                <Link className="nav-login" href={authNav.href} aria-current={isActive(authNav.href) ? "page" : undefined}>
                  <LogIn aria-hidden="true" />
                  <span>{t[authNav.labelKey]}</span>
                </Link>
                <Link className="nav-join" href={joinNav.href} aria-current={isActive(joinNav.href) ? "page" : undefined}>
                  <Sparkles aria-hidden="true" />
                  <span>{t[joinNav.labelKey]}</span>
                </Link>
              </>
            )}
          </div>
          <button type="button" className="icon-button mobile-menu" onClick={() => setOpen(true)} aria-label={t.navOpenMenu} aria-expanded={open}><Menu /></button>
        </div>
      </div>
      {open && <button type="button" className="nav-scrim" onClick={() => setOpen(false)} aria-label={t.navCloseMenu} />}
    </header>
  );
}
