"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import {
  ChevronDown,
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

import { useLanguage } from "@/components/language-provider";
import { RoleBadge } from "@/components/role-badge";
import { CONTROL_ROOM_SECTIONS, type ControlRoomSection } from "@/lib/control-room-validation";
import type { TextKey } from "@/lib/i18n";
import type { MemberRole } from "@/lib/roles";

const tabs: Record<ControlRoomSection, { label: TextKey; icon: LucideIcon }> = {
  overview: { label: "crTabOverview", icon: LayoutDashboard },
  products: { label: "crTabProducts", icon: Shirt },
  collections: { label: "crTabCollections", icon: Layers },
  discounts: { label: "crTabDiscounts", icon: TicketPercent },
  orders: { label: "crTabOrders", icon: Package },
  messages: { label: "crTabMessages", icon: Inbox },
  subscribers: { label: "crTabSubscribers", icon: Mail },
  team: { label: "crTabTeam", icon: Users },
  site: { label: "crTabSite", icon: ServerCog },
};

/** Sidebar groups, in order; a group only shows when the viewer can open one of its sections. */
const groups: { label: TextKey | null; sections: ControlRoomSection[] }[] = [
  { label: null, sections: ["overview"] },
  { label: "crNavShop", sections: ["products", "collections", "discounts", "orders"] },
  { label: "crNavPeople", sections: ["messages", "subscribers", "team"] },
  { label: "crNavSystem", sections: ["site"] },
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

function SectionLinks({ sections, pathname, onNavigate }: {
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
                return (
                  <li key={key}>
                    <Link href={href} aria-current={isCurrent(href, pathname) ? "page" : undefined} onClick={onNavigate}>
                      <Icon aria-hidden="true" />
                      <span>{t[label]}</span>
                    </Link>
                  </li>
                );
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

export function ControlRoomHeader({ name, role, sections }: ControlRoomHeaderProps) {
  const { t } = useLanguage();
  const pathname = usePathname();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const current = CONTROL_ROOM_SECTIONS.find((section) => sections.includes(section.key) && isCurrent(section.href, pathname));
  const currentTab = current ? tabs[current.key] : tabs.overview;
  const CurrentIcon = currentTab.icon;

  const closeMenu = () => dialogRef.current?.close();

  // A route change (including back/forward) always closes the phone menu.
  useEffect(() => {
    dialogRef.current?.close();
  }, [pathname]);

  return (
    <>
      <aside className="cr-sidebar" aria-label={t.crTabsLabel}>
        <div className="cr-sidebar-top">
          <span className="eyebrow">{t.crEyebrow}</span>
          <h1 className="cr-sidebar-title">{t.crTitle}</h1>
          <Identity name={name} role={role} />
        </div>
        <nav className="cr-nav" aria-label={t.crTabsLabel}>
          <SectionLinks sections={sections} pathname={pathname} />
        </nav>
        <Link className="cr-nav-account" href="/account">
          <UserRound aria-hidden="true" />
          {t.crMyAccount}
        </Link>
      </aside>

      <div className="cr-mobilebar">
        <div className="cr-mobilebar-title">
          <span className="eyebrow">{t.crEyebrow}</span>
          <h1>{t.crTitle}</h1>
        </div>
        <button
          className="cr-mobilebar-button"
          type="button"
          onClick={() => dialogRef.current?.showModal()}
          aria-haspopup="dialog"
          aria-label={`${t.crNavMenu}: ${t[currentTab.label]}`}
        >
          <CurrentIcon aria-hidden="true" />
          <span>{t[currentTab.label]}</span>
          <ChevronDown aria-hidden="true" />
        </button>
      </div>

      <dialog
        ref={dialogRef}
        className="cr-sheet"
        aria-label={t.crTabsLabel}
        onClick={(event) => {
          // A click on the backdrop lands on the dialog itself.
          if (event.target === event.currentTarget) closeMenu();
        }}
      >
        <div className="cr-sheet-inner">
          <div className="cr-sheet-head">
            <Identity name={name} role={role} />
            <button className="cr-sheet-close" type="button" onClick={closeMenu} aria-label={t.crNavClose}>
              <X aria-hidden="true" />
            </button>
          </div>
          <nav className="cr-nav" aria-label={t.crTabsLabel}>
            <SectionLinks sections={sections} pathname={pathname} onNavigate={closeMenu} />
          </nav>
          <Link className="cr-nav-account" href="/account" onClick={closeMenu}>
            <UserRound aria-hidden="true" />
            {t.crMyAccount}
          </Link>
        </div>
      </dialog>
    </>
  );
}
