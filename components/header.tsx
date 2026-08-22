"use client";

import Link from "next/link";
import { Menu, Search, ShoppingBag, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { BrandMark } from "@/components/icons";
import { useCart } from "@/components/cart-provider";

const nav = [
  ["Home", "/"], ["Videos", "/videos"], ["Shorts", "/shorts"], ["Playlists", "/playlists"],
  ["About", "/about"], ["Shop", "/shop"], ["Contact", "/contact"],
];

export function Header() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const { count } = useCart();

  return (
    <header className="site-header">
      <a className="skip-link" href="#content">Skip to content</a>
      <div className="nav-shell">
        <Link className="brand" href="/" aria-label="BRAKMASRA home">
          <BrandMark />
          <span>BRAKMASRA</span>
        </Link>
        <nav className={`nav-links ${open ? "is-open" : ""}`} aria-label="Primary">
          <button className="mobile-close" onClick={() => setOpen(false)} aria-label="Close menu"><X /></button>
          {nav.map(([label, href]) => (
            <Link key={href} href={href} onClick={() => setOpen(false)} aria-current={pathname === href ? "page" : undefined}>{label}</Link>
          ))}
          <a className="button button-primary mobile-subscribe" href="https://www.youtube.com/@Brakmasra?sub_confirmation=1" target="_blank" rel="noreferrer">Subscribe</a>
        </nav>
        <div className="nav-actions">
          <Link className="icon-button" href="/videos#search" aria-label="Search videos"><Search /></Link>
          <a className="button button-primary desktop-subscribe" href="https://www.youtube.com/@Brakmasra?sub_confirmation=1" target="_blank" rel="noreferrer">Subscribe</a>
          <Link className="icon-button cart-link" href="/cart" aria-label={`Cart with ${count} items`}><ShoppingBag />{count > 0 && <span>{count}</span>}</Link>
          <button className="icon-button mobile-menu" onClick={() => setOpen(true)} aria-label="Open menu"><Menu /></button>
        </div>
      </div>
      {open && <button className="nav-scrim" onClick={() => setOpen(false)} aria-label="Close menu overlay" />}
    </header>
  );
}
