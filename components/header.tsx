"use client";

import Image from "next/image";
import Link from "next/link";
import { Menu, ShoppingBag, UserRound, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useCart } from "@/components/cart-provider";
import { authNav, primaryNav } from "@/data/navigation";

export function Header({ commerceEnabled }: { commerceEnabled: boolean }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const { count } = useCart();
  const isActive = (href: string) => pathname === href || (href !== "/" && pathname.startsWith(`${href}/`));

  return (
    <header className="site-header">
      <a className="skip-link" href="#content">Skip to content</a>
      <div className="nav-shell">
        <Link className="brand" href="/" aria-label="BRAKMASRA home">
          <span className="brand-image"><Image src="/images/brakmasra-logo-reference.png" alt="" width={42} height={42} loading="eager" /></span>
          <span>BRAKMASRA</span>
        </Link>
        <nav className={`nav-links ${open ? "is-open" : ""}`} aria-label="Primary">
          <button className="mobile-close" onClick={() => setOpen(false)} aria-label="Close menu"><X /></button>
          {primaryNav.map(({ label, href }) => (
            <Link key={href} href={href} onClick={() => setOpen(false)} aria-current={isActive(href) ? "page" : undefined}>{label}</Link>
          ))}
          <Link
            className="mobile-auth-link"
            href={authNav.href}
            onClick={() => setOpen(false)}
            aria-current={isActive(authNav.href) ? "page" : undefined}
          >
            <UserRound />
            {authNav.label}
          </Link>
        </nav>
        <div className="nav-actions">
          <Link
            className="nav-login-link"
            href={authNav.href}
            aria-current={isActive(authNav.href) ? "page" : undefined}
          >
            <UserRound />
            <span>{authNav.label}</span>
          </Link>
          <Link className="icon-button cart-link" href="/cart" aria-label={commerceEnabled ? `Cart with ${count} items` : "Ordering coming soon"}><ShoppingBag />{commerceEnabled && count > 0 && <span>{count}</span>}</Link>
          <button className="icon-button mobile-menu" onClick={() => setOpen(true)} aria-label="Open menu" aria-expanded={open}><Menu /></button>
        </div>
      </div>
      {open && <button className="nav-scrim" onClick={() => setOpen(false)} aria-label="Close menu overlay" />}
    </header>
  );
}
