"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import {
  ChevronDown,
  ExternalLink,
  ArrowUpRight,
  FilePenLine,
  Inbox,
  LayoutDashboard,
  Layers,
  Mail,
  Package,
  ServerCog,
  Shirt,
  TicketPercent,
  UserRound,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";

import { useDashboardShell } from "@/components/control-room/dashboard-shell";
import { dashboardCreateLabels } from "@/lib/dashboard-navigation";
import { can } from "@/lib/roles";
import { useLanguage } from "@/components/language-provider";
import { RoleBadge } from "@/components/role-badge";
import { CONTROL_ROOM_SECTIONS, type ControlRoomSection } from "@/lib/control-room-validation";
import type { TextKey } from "@/lib/i18n";
import type { MemberRole } from "@/lib/roles";
import { lockPageScroll } from "@/lib/page-scroll-lock";

const tabs: Record<ControlRoomSection, { label: TextKey; icon: LucideIcon }> = {
  overview: { label: "crTabOverview", icon: LayoutDashboard },
  products: { label: "crTabProducts", icon: Shirt },
  collections: { label: "crTabCollections", icon: Layers },
  discounts: { label: "crTabDiscounts", icon: TicketPercent },
  orders: { label: "crTabOrders", icon: Package },
  messages: { label: "crTabMessages", icon: Inbox },
  subscribers: { label: "crTabSubscribers", icon: Mail },
  team: { label: "crTabTeam", icon: Users },
  content: { label: "crTabContent", icon: FilePenLine },
  site: { label: "crTabSite", icon: ServerCog },
};

/** Sidebar groups, in order; a group only shows when the viewer can open one of its sections. */
const groups: { label: TextKey | null; sections: ControlRoomSection[] }[] = [
  { label: null, sections: ["overview"] },
  { label: "crNavShop", sections: ["products", "collections", "discounts", "orders"] },
  { label: "crNavPeople", sections: ["messages", "subscribers", "team"] },
  { label: "crNavSystem", sections: ["content", "site"] },
];

type ControlRoomHeaderProps = {
  name: string;
  role: MemberRole;
  /** Worked out on the server from the viewer's role; only these sections render. */
  sections: ControlRoomSection[];
};

function isCurrent(href: string, pathname: string) {
  return href === "/admin" ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
}

function SectionLinks({ sections, pathname, role, compact = false, onNavigate }: {
  role: MemberRole;
  compact?: boolean;
  sections: ControlRoomSection[];
  pathname: string;
  onNavigate?: () => void;
}) {
  const { t } = useLanguage();
  const allowed = new Set(sections);

  return (
    <>
      {groups.map((group) => {
        const items = CONTROL_ROOM_SECTIONS.filter((section) => group.sections.includes(section.key) && allowed.has(section.key));
        if (items.length === 0) return null;
        return (
          <div className="cr-nav-group" key={group.label ?? "main"}>
            {group.label && <p className="cr-nav-heading">{t[group.label]}</p>}
            <ul>
              {items.map(({ key, href }) => {
                const { label, icon: Icon } = tabs[key];
                const create = can(role, "manage_catalog") ? dashboardCreateLabels[key] : undefined;
                const active = isCurrent(href, pathname);
                return <li key={key}>{create && !compact ? <details className="dashboard-nav-section" open={active}>
                  <summary data-active={active || undefined}><Icon aria-hidden="true" /><span>{t[label]}</span><ChevronDown className="dashboard-nav-chevron" size={15} aria-hidden="true" /></summary>
                  <ul className="dashboard-subnav"><li><Link href={href} aria-current={active && !pathname.endsWith("/new") ? "page" : undefined} onClick={onNavigate}>{t.crViewAll}</Link></li><li><Link href={`${href}/new`} aria-current={pathname === `${href}/new` ? "page" : undefined} onClick={onNavigate}>{t[create]}</Link></li></ul>
                </details> : <Link href={href} title={compact ? t[label] : undefined} aria-label={compact ? t[label] : undefined} aria-current={active ? "page" : undefined} onClick={onNavigate}><Icon aria-hidden="true" /><span>{t[label]}</span></Link>}</li>;
              })}
            </ul>
          </div>
        );
      })}
    </>
  );
}

function Identity({ name, role }: { name: string; role: MemberRole }) {
  const { t } = useLanguage();
  return (
    <div className="cr-identity">
      <span className="cr-identity-label">{t.crSignedInAs}</span>
      <strong>{name}</strong>
      <RoleBadge role={role} size="md" />
    </div>
  );
}

function SidebarBrand({ compact = false, onNavigate }: { compact?: boolean; onNavigate?: () => void }) {
  const { t } = useLanguage();
  return <Link className="dashboard-sidebar-brand" href="/admin" onClick={onNavigate} aria-label={`BRAKMASRA ${t.crTitle}`}>{compact ? <span className="dashboard-brand-monogram">B.</span> : <span>BRAKMASRA<small>{t.crTitle}</small></span>}</Link>;
}

export function ControlRoomHeader({ name, role, sections }: ControlRoomHeaderProps) {
  const { t } = useLanguage();
  const pathname = usePathname();
  const shell = useDashboardShell();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const closeMenu = () => dialogRef.current?.close();
  useEffect(() => { dialogRef.current?.close(); }, [pathname]);
  useEffect(() => {
    const desktop = window.matchMedia("(min-width: 1024px)");
    const closeOnDesktop = () => { if (desktop.matches) dialogRef.current?.close(); };
    desktop.addEventListener("change", closeOnDesktop);
    return () => desktop.removeEventListener("change", closeOnDesktop);
  }, []);
  useEffect(() => {
    if (shell.mobileOpen) { dialogRef.current?.showModal(); closeRef.current?.focus(); }
    else dialogRef.current?.close();
  }, [shell.mobileOpen]);
  useEffect(() => shell.mobileOpen ? lockPageScroll() : undefined, [shell.mobileOpen]);
  return <>
    <aside id="dashboard-sidebar" className="cr-sidebar" aria-label={t.crTabsLabel}>
      <SidebarBrand compact={shell.compact} />
      <nav key={pathname.split("/")[2] ?? "overview"} className="cr-nav" aria-label={t.crTabsLabel}><SectionLinks sections={sections} pathname={pathname} role={role} compact={shell.compact} /></nav>
      <div className="cr-sidebar-footer"><Link className="dashboard-store-card" href="/" target="_blank" rel="noopener" title={t.crViewStore}><ExternalLink size={19} aria-hidden="true" /><span><strong>{t.crViewStore}</strong><small>brakmasra</small></span><ArrowUpRight size={16} aria-hidden="true" /></Link></div>
    </aside>
    <dialog ref={dialogRef} className="cr-sheet" aria-label={t.crTabsLabel} onClose={() => { shell.closeMobile(); shell.menuButton.current?.focus(); }} onClick={event => { if (event.target !== event.currentTarget) return; const b = event.currentTarget.getBoundingClientRect(); if (event.clientX < b.left || event.clientX > b.right || event.clientY < b.top || event.clientY > b.bottom) closeMenu(); }}>
      <div className="cr-sheet-inner">
        <div className="cr-sheet-head"><SidebarBrand onNavigate={closeMenu} /><button ref={closeRef} className="cr-sheet-close" type="button" onClick={closeMenu} aria-label={t.crNavClose}><X size={20} /></button></div>
        <div className="dashboard-drawer-identity"><Identity name={name} role={role} /></div>
        <nav className="cr-nav" aria-label={t.crTabsLabel}><SectionLinks sections={sections} pathname={pathname} role={role} onNavigate={closeMenu} /></nav>
        <Link className="dashboard-drawer-account" href="/account" onClick={closeMenu}><UserRound size={18} aria-hidden="true" />{t.crMyAccount}<ArrowUpRight size={16} aria-hidden="true" /></Link>
      </div>
    </dialog>
  </>;
}
