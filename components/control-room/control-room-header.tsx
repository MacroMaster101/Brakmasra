"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { Inbox, LayoutDashboard, Mail, Package, ServerCog, UserRound, Users, type LucideIcon } from "lucide-react";

import { useLanguage } from "@/components/language-provider";
import { RoleBadge } from "@/components/role-badge";
import { CONTROL_ROOM_SECTIONS, type ControlRoomSection } from "@/lib/control-room-validation";
import type { TextKey } from "@/lib/i18n";
import type { MemberRole } from "@/lib/roles";

const tabs: Record<ControlRoomSection, { label: TextKey; icon: LucideIcon }> = {
  overview: { label: "crTabOverview", icon: LayoutDashboard },
  messages: { label: "crTabMessages", icon: Inbox },
  orders: { label: "crTabOrders", icon: Package },
  subscribers: { label: "crTabSubscribers", icon: Mail },
  team: { label: "crTabTeam", icon: Users },
  site: { label: "crTabSite", icon: ServerCog },
};

type ControlRoomHeaderProps = {
  name: string;
  role: MemberRole;
  /** Worked out on the server from the viewer's role; only these tabs render. */
  sections: ControlRoomSection[];
};

export function ControlRoomHeader({ name, role, sections }: ControlRoomHeaderProps) {
  const { t } = useLanguage();
  const pathname = usePathname();
  const navRef = useRef<HTMLElement>(null);
  const visible = CONTROL_ROOM_SECTIONS.filter((section) => sections.includes(section.key));

  // On narrow screens the tab bar scrolls; keep the current tab in view.
  useEffect(() => {
    const nav = navRef.current;
    const active = nav?.querySelector<HTMLElement>('[aria-current="page"]');
    if (!nav || !active) return;
    const offset = active.getBoundingClientRect().left - nav.getBoundingClientRect().left;
    nav.scrollLeft += offset - (nav.clientWidth - active.offsetWidth) / 2;
  }, [pathname]);

  return (
    <>
      <header className="cr-hero">
        <div className="cr-hero-copy">
          <span className="eyebrow">{t.crEyebrow}</span>
          <h1>{t.crTitle}</h1>
          <p className="cr-hero-viewer">
            <span>{t.crSignedInAs}</span>
            <strong>{name}</strong>
            <RoleBadge role={role} size="md" />
          </p>
        </div>
        <Link className="button button-secondary" href="/account">
          <UserRound aria-hidden="true" />
          {t.crMyAccount}
        </Link>
      </header>
      <nav className="cr-tabs" aria-label={t.crTabsLabel} ref={navRef}>
        {visible.map(({ key, href }) => {
          const { label, icon: Icon } = tabs[key];
          const current = href === "/admin" ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link key={key} href={href} aria-current={current ? "page" : undefined} scroll={false}>
              <Icon aria-hidden="true" />
              {t[label]}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
