"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ArrowUpRight, Search, X } from "lucide-react";
import { useLanguage } from "@/components/language-provider";
import { dashboardDestinations } from "@/lib/dashboard-navigation";
import type { MemberRole } from "@/lib/roles";
export function DashboardSearch({ role }: { role: MemberRole | null }) {
  const { t } = useLanguage();
  const dialog = useRef<HTMLDialogElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const [query, setQuery] = useState("");
  const results = dashboardDestinations(role).filter(item => `${t[item.label]} ${item.href}`.toLowerCase().includes(query.trim().toLowerCase()));
  const open = () => { dialog.current?.showModal(); input.current?.focus(); };
  useEffect(() => { const key = (event: globalThis.KeyboardEvent) => { if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k" && !document.querySelector("dialog[open]")) { event.preventDefault(); dialog.current?.showModal(); input.current?.focus(); } }; document.addEventListener("keydown", key); return () => document.removeEventListener("keydown", key); }, []);
  return <>
    <button ref={trigger} type="button" className="dashboard-search-trigger" onClick={open} aria-label={t.crFindPage} aria-haspopup="dialog"><Search size={19} aria-hidden="true" /><span>{t.crFindPage}</span><kbd>Ctrl K</kbd></button>
    <dialog ref={dialog} className="dashboard-search-dialog" aria-label={t.crFindPage} onClose={() => { setQuery(""); trigger.current?.focus(); }} onClick={event => { if (event.target !== event.currentTarget) return; const b = event.currentTarget.getBoundingClientRect(); if (event.clientX < b.left || event.clientX > b.right || event.clientY < b.top || event.clientY > b.bottom) dialog.current?.close(); }}>
      <div className="dashboard-search-input"><Search size={20} aria-hidden="true" /><input ref={input} aria-label={t.crFindPage} placeholder={t.crFindPage} value={query} onChange={event => setQuery(event.target.value)} onKeyDown={event => { if (event.key === "ArrowDown") { event.preventDefault(); dialog.current?.querySelector<HTMLAnchorElement>(".dashboard-search-results a")?.focus(); } }} /><button type="button" aria-label={t.crSearchClose} onClick={() => dialog.current?.close()}><X size={20} /></button></div>
      <nav className="dashboard-search-results" aria-label={t.crDashboardPages} onKeyDown={event => { if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) return; const links = [...event.currentTarget.querySelectorAll<HTMLAnchorElement>("a")]; const index = links.indexOf(document.activeElement as HTMLAnchorElement); event.preventDefault(); const next = event.key === "Home" ? 0 : event.key === "End" ? links.length - 1 : (index + (event.key === "ArrowDown" ? 1 : -1) + links.length) % links.length; links[next]?.focus(); }}>
        {results.length ? results.map(item => <Link href={item.href} key={item.href} onClick={() => dialog.current?.close()}><span><strong>{t[item.label]}</strong><small>{t[item.group]}</small></span><ArrowUpRight size={17} aria-hidden="true" /></Link>) : <p>{t.crNoPagesFound}</p>}
      </nav>
      <footer>{t.crSearchKeyboard}</footer>
    </dialog>
  </>;
}
