"use client";

import Image from "@/components/store-image";
import Link from "next/link";
import {
  ChevronDown,
  ArrowRight,
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
import { shopCategories, type ShopMenu } from "@/data/shop-menu";
import { lockPageScroll } from "@/lib/page-scroll-lock";
import { SearchPanel } from "@/components/search-panel";

export function Header({
  commerceEnabled,
  member,
  shopMenu,
}: {
  commerceEnabled: boolean;
  member: MemberSummary | null;
  shopMenu: ShopMenu;
}) {
  const [open, setOpen] = useState(false);
  const [dropdown, setDropdown] = useState<string | null>(null);
  const pathname = usePathname();
  const { count } = useCart();
  const { slugs } = useWishlist();
  const { t } = useLanguage();
  const search = useRef<HTMLDialogElement>(null);
  const releaseSearchLock = useRef<(() => void) | null>(null);
  const drawer = useRef<HTMLElement>(null);
  const menuButton = useRef<HTMLButtonElement>(null);
  const shopButton = useRef<HTMLButtonElement>(null);
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
    if (!window.matchMedia("(min-width: 1200px) and (hover: hover)").matches) return;
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
  const openSearch = () => {
    close();
    requestAnimationFrame(() => {
      if (!search.current || search.current.open) return;
      releaseSearchLock.current = lockPageScroll();
      search.current.showModal();
      search.current.querySelector<HTMLInputElement>('input[type="search"]')?.focus({ preventScroll: true });
    });
  };
  useEffect(() => () => releaseSearchLock.current?.(), []);
  useEffect(() => {
    if (!header.current) return;
    header.current.dataset.scrolled = String(window.scrollY > 36);
    header.current.dataset.hidden = "false";
    lastScroll.current = window.scrollY;
  }, []);
  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (!header.current?.contains(event.target as Node)) setDropdown(null);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        setDropdown(null);
        if (open) menuButton.current?.focus({ preventScroll: true });
        else if (dropdown) shopButton.current?.focus({ preventScroll: true });
      }
      if (open && event.key === "Tab") {
        const elements =
          drawer.current?.querySelectorAll<HTMLElement>("a,button,select");
        if (!elements?.length) return;
        const first = elements[0],
          last = elements[elements.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
            last.focus({ preventScroll: true });
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
            first.focus({ preventScroll: true });
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
  }, [open, dropdown]);
  useEffect(() => {
    if (!open) return;
    const unlock = lockPageScroll();
    drawer.current?.querySelector<HTMLButtonElement>("button")?.focus({ preventScroll: true });
    const desktop = window.matchMedia("(min-width: 1200px)");
    const onResize = () => { if (desktop.matches) { setOpen(false); setDropdown(null); } };
    desktop.addEventListener("change", onResize);
    return () => {
      unlock();
      desktop.removeEventListener("change", onResize);
    };
  }, [open]);
  const shopGroups = [
    { id: "clothing", title: t.storeClothing },
    { id: "accessories", title: t.storeAccessories },
  ].map((group) => ({
    ...group,
    links: shopCategories.filter((category) => category.group === group.id).map((category) => ({
      label: t[category.labelKey],
      href: `/shop?category=${category.id}`,
      available: shopMenu.categories.some((item) => item.id === category.id && item.available),
    })),
  }));
  return (
    <header
      ref={header}
      className={`site-header storefront-header${pathname === "/" ? " is-home" : ""}${pathname === "/about" ? " is-about" : ""}`}
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
              menuButton.current?.focus({ preventScroll: true });
            }}
            aria-label={t.navCloseMenu}
          >
            <X />
          </button>
          <div className="mobile-drawer-heading">
            <Link href="/" onClick={close} aria-label={t.brandHomeLabel}>BRAKMASRA</Link>
            <Link className="mobile-drawer-login" href={member ? "/account" : "/login"} onClick={close}>{member ? t.navAccount : t.navLogin}<UserRound aria-hidden="true" /></Link>
          </div>
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
                    ref={shopButton}
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
                  role="group"
                  aria-label={t.storeShopMenu}
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
                    <div className="shop-mega-column">
                      <h2>{t.footerCollection}</h2>
                      <div className="shop-mega-links">
                        <Link href="/shop" onClick={close}>{t.storeBrowseAll}</Link>
                        <Link href="/shop?saved=1" onClick={close}>{t.storeSaved}</Link>
                      </div>
                    </div>
                    {shopGroups.map((group) => (
                      <div className="shop-mega-column" key={group.title}>
                        <h2>{group.title}</h2>
                        <div className="shop-mega-links">{group.links.map((item) => (
                          <Link
                            key={item.label}
                            href={item.href}
                            onClick={close}
                            className={!item.available ? "shop-category-upcoming" : undefined}
                          >
                            <span>{item.label}</span>{!item.available && <small>{t.shopComingSoon}</small>}
                          </Link>
                        ))}</div>
                      </div>
                    ))}
                    {shopMenu.cards.map((tile) => {
                      const label = tile.color === "black" ? t.storeBlackTees : t.storeWhiteTees;
                      const content = <>
                        <Image
                          src={tile.image}
                          alt=""
                          fill
                          sizes="(min-width: 1200px) 24vw, 160px"
                        />
                        <span className="shop-mega-caption"><strong>{label}</strong><span className="shop-mega-cta">{tile.href ? <><span>{t.navShop}</span><ArrowRight aria-hidden="true" /></> : t.shopComingSoon}</span></span>
                      </>;
                      return tile.href ? <Link className="shop-mega-tile" href={tile.href} key={tile.color} onClick={close}>{content}</Link>
                        : <div className="shop-mega-tile" key={tile.color} aria-disabled="true">{content}</div>;
                    })}
                  </div>
                </div>
              )}
            </div>
          ))}
          <div className="mobile-drawer-quick">
            <Link href="/shop?saved=1" onClick={close}>{t.storeWishlist}<Heart aria-hidden="true" /></Link>
            <button type="button" onClick={openSearch}>{t.storeSearchButton}<Search aria-hidden="true" /></button>
          </div>
          {member && <MobileAccountPanel member={member} onNavigate={close} />}
          <div className="mobile-lang-wrap">
            <LanguageSwitcher showLabels placement="up" />
            <CurrencySwitcher placement="up" />
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
            onClick={openSearch}
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
      <SearchPanel dialogRef={search} titleId={searchId} menu={shopMenu} onClose={() => {
        releaseSearchLock.current?.();
        releaseSearchLock.current = null;
      }} />
    </header>
  );
}
