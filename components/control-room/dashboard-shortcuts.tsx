"use client";
import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { Grid2X2, Maximize, Minimize, ArrowUpRight, X } from "lucide-react";
import { dashboardDestinations } from "@/lib/dashboard-navigation";
import type { MemberRole } from "@/lib/roles";
import { useLanguage } from "@/components/language-provider";

export function DashboardShortcuts({ role }: { role: MemberRole | null }) {
  const { t } = useLanguage();
  const id = useId();
  const popup = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  return <><button className="dashboard-icon dashboard-shortcut-toggle" popoverTarget={id} aria-label={t.crQuickTitle} aria-expanded={open}><Grid2X2 size={19} /></button><div id={id} ref={popup} popover="auto" className="dashboard-shortcut-panel" onToggle={event => setOpen(event.newState === "open")}><header><strong>{t.crQuickTitle}</strong><button type="button" className="dashboard-icon" aria-label={t.crClosePanel} onClick={() => popup.current?.hidePopover()}><X size={18} /></button></header><nav>{dashboardDestinations(role).filter(item => item.group === "crQuickTitle" || ["/admin/orders", "/admin/messages", "/admin/content"].includes(item.href)).map(item => <Link href={item.href} key={item.href} onClick={() => popup.current?.hidePopover()}>{t[item.label]}<ArrowUpRight size={16} /></Link>)}<Link href="/" target="_blank" rel="noopener" onClick={() => popup.current?.hidePopover()}>{t.crViewStore}<ArrowUpRight size={16} /></Link></nav></div></>;
}

export function DashboardFullscreen() {
  const { t } = useLanguage();
  const [active, setActive] = useState(false);
  useEffect(() => { const change = () => setActive(Boolean(document.fullscreenElement)); document.addEventListener("fullscreenchange", change); return () => document.removeEventListener("fullscreenchange", change); }, []);
  return <button className="dashboard-icon dashboard-fullscreen" type="button" aria-label={active ? t.crExitFullscreen : t.crFullscreen} onClick={async () => { try { if (document.fullscreenElement) await document.exitFullscreen(); else await document.documentElement.requestFullscreen(); } catch { /* Browsers may disallow fullscreen; the normal workspace remains usable. */ } }}>{active ? <Minimize size={19} /> : <Maximize size={19} />}</button>;
}
