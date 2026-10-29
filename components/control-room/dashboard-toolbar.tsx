"use client";
import Link from "next/link";
import { Bell, MessageSquare, Settings, Menu, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { LanguageSwitcher } from "@/components/language-switcher";
import { ThemeToggle } from "@/components/theme-toggle";
import { MemberMenu } from "@/components/member-menu";
import { useLanguage } from "@/components/language-provider";
import { usePathname } from "next/navigation";
import { useDashboardShell } from "@/components/control-room/dashboard-shell";
import { DashboardSearch } from "@/components/control-room/dashboard-search";
import { dashboardLabels } from "@/lib/dashboard-navigation";
import type { MemberSummary } from "@/lib/member";
import { can } from "@/lib/roles";
import { DashboardFullscreen, DashboardShortcuts } from "@/components/control-room/dashboard-shortcuts";
export function DashboardToolbar({ member, unread }: { member: MemberSummary; unread?: number | null }) {
  const { t } = useLanguage();
  const pathname = usePathname();
  const section = pathname.split("/")[2] ?? "overview";
  const { menuButton, ...shell } = useDashboardShell();
  const Collapse = shell.compact ? PanelLeftOpen : PanelLeftClose;
  return <header className="dashboard-topbar">
    <button className="dashboard-icon dashboard-collapse" type="button" onClick={shell.toggle} aria-label={shell.compact ? t.crExpandSidebar : t.crCollapseSidebar} aria-expanded={!shell.compact} aria-controls="dashboard-sidebar"><Collapse size={20} /></button>
    <button ref={menuButton} className="dashboard-icon dashboard-mobile-toggle" type="button" onClick={shell.openMobile} aria-label={t.crNavMenu} aria-haspopup="dialog" aria-expanded={shell.mobileOpen}><Menu size={22} /></button>
    <Link href="/admin" className="dashboard-mobile-brand">BRAKMASRA</Link>
    <h1 className="dashboard-context">{t[dashboardLabels[section] ?? "crTabOverview"]}</h1>
    <DashboardSearch role={member.role} />
    <div className="dashboard-tools">
      <span className="dashboard-language"><LanguageSwitcher variant="dashboard" /></span>
      <ThemeToggle />
      {can(member.role, "view_messages") && <Link className="dashboard-icon dashboard-inbox" href="/admin/messages?status=new" aria-label={unread == null ? t.crTabMessages : t.crUnreadMessages(unread)} title={t.crTabMessages}><Bell size={21} />{unread != null && unread > 0 && <span>{unread > 99 ? "99+" : unread}</span>}</Link>}
      {can(member.role, "view_messages") && <Link className="dashboard-icon dashboard-messages" href="/admin/messages" aria-label={t.crTabMessages} title={t.crTabMessages}><MessageSquare size={20} /></Link>}
      <DashboardFullscreen />
      <DashboardShortcuts role={member.role} />
      <MemberMenu key={pathname} member={member} variant="dashboard" />
      <Link className="dashboard-icon dashboard-settings" href={can(member.role, "manage_site") ? "/admin/site" : "/account/settings"} aria-label={t.navSettings} title={t.navSettings}><Settings size={21} /></Link>
    </div>
  </header>;
}
