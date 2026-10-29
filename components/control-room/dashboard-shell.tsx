"use client";

import { createContext, useContext, useRef, useState, useSyncExternalStore, type ReactNode, type RefObject } from "react";
const preference = "brakmasra_admin_sidebar";
function subscribe(change: () => void) { window.addEventListener("storage", change); window.addEventListener(preference, change); return () => { window.removeEventListener("storage", change); window.removeEventListener(preference, change); }; }
function snapshot() { try { return localStorage.getItem(preference) === "compact"; } catch { return false; } }
type ShellState = { compact: boolean; toggle: () => void; mobileOpen: boolean; openMobile: () => void; closeMobile: () => void; menuButton: RefObject<HTMLButtonElement | null> };
const ShellContext = createContext<ShellState | null>(null);
export function DashboardShell({ children }: { children: ReactNode }) {
  const storedCompact = useSyncExternalStore(subscribe, snapshot, () => false);
  const [memoryCompact, setMemoryCompact] = useState<boolean | null>(null);
  const compact = memoryCompact ?? storedCompact;
  const [mobileOpen, setMobileOpen] = useState(false);
  const menuButton = useRef<HTMLButtonElement>(null);
  const toggle = () => { try { localStorage.setItem(preference, compact ? "expanded" : "compact"); setMemoryCompact(null); } catch { setMemoryCompact(!compact); } window.dispatchEvent(new Event(preference)); };
  return <ShellContext.Provider value={{ compact, toggle, mobileOpen, openMobile: () => setMobileOpen(true), closeMobile: () => setMobileOpen(false), menuButton }}><section className="cr-page" data-sidebar={compact ? "compact" : "expanded"}>{children}</section></ShellContext.Provider>;
}
export function useDashboardShell() { const shell = useContext(ShellContext); if (!shell) throw new Error("Dashboard controls need DashboardShell."); return shell; }
