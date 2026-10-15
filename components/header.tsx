"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ChevronDown,
  Heart,
  Menu,
  Search,
  ShoppingBag,
  UserRound,
  X,
} from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { useMotionValueEvent, useScroll } from "motion/react";
import { useCart } from "@/components/cart-provider";
import { LanguageSwitcher } from "@/components/language-switcher";
import { useLanguage } from "@/components/language-provider";
import { MemberMenu, MobileAccountPanel } from "@/components/member-menu";
import { ThemeToggle } from "@/components/theme-toggle";
import { CurrencySwitcher } from "@/components/currency-switcher";
import { primaryNav } from "@/data/navigation";
import { useWishlist } from "@/lib/wishlist";
import type { MemberSummary } from "@/lib/member";

export function Header({
  commerceEnabled,
  member,
}: {
  commerceEnabled: boolean;
  member: MemberSummary | null;
}) {
  const [open, setOpen] = useState(false);
  const [dropdown, setDropdown] = useState<string | null>(null);
  const pathname = usePathname();
  const { count } = useCart();
  const { slugs } = useWishlist();
  const { t } = useLanguage();
  const search = useRef<HTMLDialogElement>(null);
  const drawer = useRef<HTMLElement>(null);
  const menuButton = useRef<HTMLButtonElement>(null);
  const header = useRef<HTMLElement>(null);
  const navId = useId();
  const searchId = useId();
  const lastScroll = useRef(0);
  const menuLeaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hoverMenu = (href: string) => {
    if (menuLeaveTimer.current) clearTimeout(menuLeaveTimer.current);
    if (window.matchMedia("(min-width: 1200px) and (hover: hover)").matches)
      setDropdown(href);
  };
  const leaveMenu = () => {
    menuLeaveTimer.current = setTimeout(() => setDropdown(null), 130);
  };
  const { scrollY } = useScroll();
  useEffect(() => {
    const element = header.current;
    const topbar = element?.querySelector<HTMLElement>(".store-topbar");
    if (!element || !topbar) return;
    const observer = new ResizeObserver(([entry]) => {
      const height =
        entry.borderBoxSize?.[0]?.blockSize ??
        topbar.getBoundingClientRect().height;
      element.style.setProperty("--announcement-height", `${height}px`);
      document.documentElement.style.setProperty(
        "--announcement-height",
        `${height}px`,
      );
    });
    observer.observe(topbar);
    return () => {
      observer.disconnect();
      document.documentElement.style.removeProperty("--announcement-height");
    };
  }, []);
  useMotionValueEvent(scrollY, "change", (y) => {
    const element = header.current;
    if (!element) return;
    element.dataset.scrolled = String(y > 36);
    const difference = y - lastScroll.current;
    if (y < 80 || open || dropdown || search.current?.open) {
      element.dataset.hidden = "false";
      lastScroll.current = y;
    } else if (Math.abs(difference) > 12) {
      element.dataset.hidden = String(difference > 0);
      lastScroll.current = y;
    }
  });
  const isActive = (href: string) =>
    pathname === href || (href !== "/" && pathname.startsWith(`${href}/`));
  const close = () => {
    setOpen(false);
    setDropdown(null);
  };
  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (!header.current?.contains(event.target as Node)) setDropdown(null);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        setDropdown(null);
        if (open) menuButton.current?.focus();
      }
      if (open && event.key === "Tab") {
        const elements =
          drawer.current?.querySelectorAll<HTMLElement>("a,button,select");
        if (!elements?.length) return;
        const first = elements[0],
          last = elements[elements.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("click", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("click", onClick);
      document.removeEventListener("keydown", onKey);
      if (menuLeaveTimer.current) clearTimeout(menuLeaveTimer.current);
    };
  }, [open]);
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    drawer.current?.querySelector<HTMLButtonElement>("button")?.focus();
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);
  const sublinks = (href: string) =>
    href === "/"
      ? [
          { label: t.storeNewArrivals, href: "/#collection" },
          { label: t.storeExploreTitle, href: "/#collections" },
          { label: t.storeLookbookTitle, href: "/#lookbook" },
        ]
      : [
          { label: t.storeAllTees, href: "/shop" },
          { label: t.storeBlackTees, href: "/shop?color=black" },
          { label: t.storeWhiteTees, href: "/shop?color=white" },
          { label: t.storeSaved, href: "/shop?saved=1" },
        ];
  const shopGroups = [
    { title: t.footerCollection, links: sublinks("/shop") },
    {
      title: t.storeInformation,
      links: [
        { label: t.footerOurStory, href: "/about" },
        { label: t.storeLookbookTitle, href: "/#lookbook" },
        { label: t.homeNewsletterBtn, href: "/#drop-alerts" },
        { label: t.navContact, href: "/contact" },
      ],
    },
    {
      title: t.storeCustomerServices,
      links: [
        { label: t.footerOrderSupport, href: "/contact" },
        { label: t.storeDelivery, href: "/terms" },
        { label: t.storeReturns, href: "/terms" },
        { label: t.legalPrivacy, href: "/privacy" },
      ],
    },
  ];
  return (
    <header
      ref={header}
      className={`site-header storefront-header${pathname === "/" ? " is-home" : ""}`}
    >
      <a className="skip-link" href="#content">
        {t.skipLink}
      </a>
      <div className="store-topbar">
        <div className="page-shell store-topbar-inner">
          <p>
            <span className="announcement-full">{t.storeAnnouncement}</span>
            <span className="announcement-short">{t.homeNoticeTitle}</span>{" "}
            <Link href="/#drop-alerts">{t.homeNewsletterBtn}</Link>
          </p>
          <div className="store-topbar-tools">
            <Link href="/contact">{t.navContact}</Link>
            <CurrencySwitcher />
            <LanguageSwitcher />
            <ThemeToggle />
          </div>
        </div>
      </div>
      <div className="nav-shell">
        <Link
          className="brand"
          href="/"
          aria-label={t.brandHomeLabel}
          onClick={close}
        >
          <span>BRAKMASRA</span>
        </Link>
        <nav
          ref={drawer}
          id={navId}
          className={`nav-links ${open ? "is-open" : ""}`}
          aria-label={t.navPrimaryLabel}
        >
          <button
            type="button"
            className="icon-button mobile-close"
            onClick={() => {
              close();
              menuButton.current?.focus();
            }}
            aria-label={t.navCloseMenu}
          >
            <X />
          </button>
          {primaryNav.map(({ labelKey, href }) => (
            <div
              key={href}
              className={`store-nav-item${href === "/shop" ? " shop-nav-item" : ""}`}
              onPointerEnter={(event) => {
                if (event.pointerType === "mouse" && href === "/shop")
                  hoverMenu(href);
              }}
              onPointerLeave={leaveMenu}
            >
              <div className="store-nav-row">
                <Link
                  href={href}
                  onClick={close}
                  aria-current={isActive(href) ? "page" : undefined}
                >
                  {t[labelKey]}
                </Link>
                {href === "/shop" && (
                  <button
                    type="button"
                    className="nav-chevron"
                    aria-label={`${t[labelKey]} ${t.navOpenMenu}`}
                    aria-expanded={dropdown === href}
                    aria-controls={`${navId}-${labelKey}`}
                    onClick={(event) => {
                      const pointerHover =
                        event.detail > 0 &&
                        window.matchMedia(
                          "(min-width: 1200px) and (hover: hover)",
                        ).matches;
                      setDropdown(
                        pointerHover ? href : dropdown === href ? null : href,
                      );
                    }}
                  >
                    <ChevronDown />
                  </button>
                )}
              </div>
              {href === "/shop" && (
                <div
                  id={`${navId}-${labelKey}`}
                  className="store-nav-dropdown shop-mega-menu"
                  data-open={dropdown === href}
                  inert={dropdown !== href}
                  aria-hidden={dropdown !== href}
                  onPointerEnter={() => {
                    if (menuLeaveTimer.current)
                      clearTimeout(menuLeaveTimer.current);
                  }}
                  onPointerLeave={leaveMenu}
                >
                  <div className="shop-mega-inner">
                    {shopGroups.map((group) => (
                      <div className="shop-mega-column" key={group.title}>
                        <h2>{group.title}</h2>
                        {group.links.map((item) => (
                          <Link
                            key={item.label}
                            href={item.href}
                            onClick={close}
                          >
                            {item.label}
                          </Link>
                        ))}
                      </div>
                    ))}
                    {[
                      {
                        label: t.storeBlackTees,
                        href: "/shop?color=black",
                        image: "/images/models/caged-freedom.webp",
                      },
                      {
                        label: t.storeWhiteTees,
                        href: "/shop?color=white",
                        image: "/images/models/paradise-lost.webp",
                      },
                    ].map((tile) => (
                      <Link
                        className="shop-mega-tile"
                        href={tile.href}
                        key={tile.href}
                        onClick={close}
                      >
                        <Image
                          src={tile.image}
                          alt=""
                          fill
                          sizes="(min-width: 1200px) 24vw, 160px"
                        />
                        <span>
                          {tile.label}
                          <span>
                            {t.navShop} <span aria-hidden="true">→</span>
                          </span>
                        </span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
          <MobileAccountPanel member={member} onNavigate={close} />
          <div className="mobile-lang-wrap">
            <LanguageSwitcher showLabels />
            <CurrencySwitcher />
            <ThemeToggle />
          </div>
        </nav>
        <div className="nav-actions">
          <div className="nav-auth">
            {member ? (
              <MemberMenu member={member} />
            ) : (
              <Link
                className="icon-button"
                href="/login"
                aria-label={t.navLogin}
              >
                <UserRound />
              </Link>
            )}
          </div>
          <button
            className="icon-button"
            type="button"
            aria-label={t.storeSearch}
            onClick={() => search.current?.showModal()}
          >
            <Search />
          </button>
          <Link
            className="icon-button saved-link"
            href="/shop?saved=1"
            aria-label={t.storeSaved}
          >
            <Heart />
            {slugs.length > 0 && (
              <span className="nav-count">{slugs.length}</span>
            )}
          </Link>
          <Link
            className="icon-button cart-link"
            href="/cart"
            aria-label={commerceEnabled ? t.navCartWithItems(count) : t.navCart}
          >
            <ShoppingBag />
            {commerceEnabled && count > 0 && <span>{count}</span>}
          </Link>
          <button
            ref={menuButton}
            type="button"
            className="icon-button mobile-menu"
            onClick={() => setOpen(true)}
            aria-label={t.navOpenMenu}
            aria-expanded={open}
            aria-controls={navId}
          >
            <Menu />
          </button>
        </div>
      </div>
      {open && (
        <button
          type="button"
          className="nav-scrim"
          onClick={close}
          aria-label={t.navCloseMenu}
        />
      )}
      <dialog
        ref={search}
        className="store-dialog search-dialog"
        aria-labelledby={searchId}
        onClick={(event) => {
          if (event.target === event.currentTarget) search.current?.close();
        }}
      >
        <div className="dialog-heading">
          <h2 id={searchId}>{t.storeSearch}</h2>
          <button
            className="icon-button"
            type="button"
            aria-label={t.storeClose}
            onClick={() => search.current?.close()}
          >
            <X />
          </button>
        </div>
        <form action="/shop" onSubmit={() => search.current?.close()}>
          <label className="search-field">
            <Search />
            <span className="sr-only">{t.shopSearchLabel}</span>
            <input
              autoFocus
              type="search"
              name="q"
              placeholder={t.shopSearchPlaceholder}
              required
            />
          </label>
          <button className="button button-primary" type="submit">
            {t.storeSearchButton}
          </button>
        </form>
        <div className="search-suggestions">
          {sublinks("/shop")
            .slice(0, 3)
            .map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => search.current?.close()}
              >
                {item.label}
              </Link>
            ))}
        </div>
      </dialog>
    </header>
  );
}
