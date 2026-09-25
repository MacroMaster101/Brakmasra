"use client";

import Link from "next/link";
import { ChevronDown, LayoutDashboard, LogIn, LogOut, Package, Settings, Sparkles, UserRound, type LucideIcon } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";

import { logoutAction } from "@/app/auth/actions";
import { AvatarPhoto } from "@/components/avatar-photo";
import { useLanguage } from "@/components/language-provider";
import { RoleBadge } from "@/components/role-badge";
import { authNav, controlRoomNav, joinNav, memberNav } from "@/data/navigation";
import type { MemberSummary } from "@/lib/member";
import { can } from "@/lib/roles";

const memberNavIcons: Record<string, LucideIcon> = {
  "/account": UserRound,
  "/account/orders": Package,
  "/account/settings": Settings,
};

function inControlRoom(pathname: string) {
  return pathname === controlRoomNav.href || pathname.startsWith(`${controlRoomNav.href}/`);
}

function menuItems(menu: HTMLElement | null) {
  return Array.from(menu?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? []);
}

export function MemberAvatar({ member, size = "sm" }: { member: MemberSummary; size?: "sm" | "lg" }) {
  return <AvatarPhoto className={`member-avatar member-avatar-${size}`} src={member.avatarUrl} initials={member.initials} />;
}

/** Desktop avatar button and dropdown for a signed-in member. */
export function MemberMenu({ member }: { member: MemberSummary }) {
  const [open, setOpen] = useState(false);
  const { t } = useLanguage();
  const pathname = usePathname();
  const menuId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    menuItems(menuRef.current)[0]?.focus();

    function onPointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  function onMenuKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const list = menuItems(menuRef.current);
    const index = list.indexOf(document.activeElement as HTMLElement);
    const move: Record<string, number> = { ArrowDown: index + 1, ArrowUp: index - 1, Home: 0, End: list.length - 1 };

    if (event.key === "Escape") {
      event.preventDefault();
      setOpen(false);
      buttonRef.current?.focus();
    } else if (event.key in move && list.length) {
      event.preventDefault();
      list[(move[event.key] + list.length) % list.length].focus();
    }
  }

  return (
    <div
      className="member-menu"
      ref={rootRef}
      onBlur={(event) => {
        // Tabbing out of the menu closes it once focus has actually left.
        if (open && !event.currentTarget.contains(event.relatedTarget as Node | null)) setOpen(false);
      }}
    >
      <button
        ref={buttonRef}
        type="button"
        className="member-trigger"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        aria-label={`${t.navAccountMenu}: ${member.name}`}
        onClick={() => setOpen((value) => !value)}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown" && !open) {
            event.preventDefault();
            setOpen(true);
          }
        }}
      >
        <MemberAvatar member={member} />
        <ChevronDown className="member-trigger-chevron" aria-hidden="true" />
      </button>
      {open && (
        <div className="member-panel" tabIndex={-1} onKeyDown={onMenuKeyDown}>
          <div className="member-panel-head">
            <MemberAvatar member={member} size="lg" />
            <div className="member-identity">
              <strong>{member.name}</strong>
              <span>{member.email}</span>
              <RoleBadge role={member.role} />
            </div>
          </div>
          <div className="member-panel-menu" id={menuId} role="menu" aria-label={t.navAccountMenu} ref={menuRef}>
            {/* Only decides whether the link shows; /admin checks the role again on the server. */}
            {can(member.role, "control_room") && (
              <>
                <Link
                  href={controlRoomNav.href}
                  role="menuitem"
                  className="member-row member-row-control"
                  aria-current={inControlRoom(pathname) ? "page" : undefined}
                  onClick={() => setOpen(false)}
                >
                  <span className="member-row-icon"><LayoutDashboard aria-hidden="true" /></span>
                  <span>{t[controlRoomNav.labelKey]}</span>
                </Link>
                <div className="member-panel-divider" role="separator" />
              </>
            )}
            {memberNav.map(({ href, labelKey }) => {
              const Icon = memberNavIcons[href] ?? UserRound;
              return (
                <Link
                  key={href}
                  href={href}
                  role="menuitem"
                  className="member-row"
                  aria-current={pathname === href ? "page" : undefined}
                  onClick={() => setOpen(false)}
                >
                  <span className="member-row-icon"><Icon aria-hidden="true" /></span>
                  <span>{t[labelKey]}</span>
                </Link>
              );
            })}
            <div className="member-panel-divider" role="separator" />
            <form action={logoutAction}>
              <button type="submit" role="menuitem" className="member-row member-row-logout">
                <span className="member-row-icon"><LogOut aria-hidden="true" /></span>
                <span>{t.navLogOut}</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

/** Account block at the bottom of the mobile drawer. */
export function MobileAccountPanel({ member, onNavigate }: { member: MemberSummary | null; onNavigate: () => void }) {
  const { t } = useLanguage();
  const pathname = usePathname();
  const current = (href: string) => (pathname === href ? "page" : undefined);

  if (!member) {
    return (
      <div className="nav-account">
        <Link className="button button-secondary" href={authNav.href} onClick={onNavigate} aria-current={current(authNav.href)}>
          <LogIn aria-hidden="true" />
          {t[authNav.labelKey]}
        </Link>
        <Link className="button nav-join-button" href={joinNav.href} onClick={onNavigate} aria-current={current(joinNav.href)}>
          <Sparkles aria-hidden="true" />
          {t[joinNav.labelKey]}
        </Link>
      </div>
    );
  }

  const [profile, ...quickLinks] = memberNav;
  return (
    <div className="nav-account">
      <span className="eyebrow">{t.navAccount}</span>
      <Link className="nav-account-card" href={profile.href} onClick={onNavigate} aria-current={current(profile.href)}>
        <MemberAvatar member={member} size="lg" />
        <span className="member-identity">
          <strong>{member.name}</strong>
          <span>{member.email}</span>
          <RoleBadge role={member.role} />
        </span>
      </Link>
      {can(member.role, "control_room") && (
        <Link
          className="button nav-control-room-button"
          href={controlRoomNav.href}
          onClick={onNavigate}
          aria-current={inControlRoom(pathname) ? "page" : undefined}
        >
          <LayoutDashboard aria-hidden="true" />
          {t[controlRoomNav.labelKey]}
        </Link>
      )}
      <div className="nav-account-quick">
        {quickLinks.map(({ href, labelKey }) => {
          const Icon = memberNavIcons[href] ?? UserRound;
          return (
            <Link key={href} className="button button-secondary" href={href} onClick={onNavigate} aria-current={current(href)}>
              <Icon aria-hidden="true" />
              {t[labelKey]}
            </Link>
          );
        })}
      </div>
      <form action={logoutAction}>
        <button type="submit" className="button nav-logout-button">
          <LogOut aria-hidden="true" />
          {t.navLogOut}
        </button>
      </form>
    </div>
  );
}
