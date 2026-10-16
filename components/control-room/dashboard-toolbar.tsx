"use client";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { LanguageSwitcher } from "@/components/language-switcher";
import { ThemeToggle } from "@/components/theme-toggle";
export function DashboardToolbar() {
  return <header className="dashboard-topbar"><Link href="/">BRAKMASRA <small>Website management</small></Link><Link href="/" target="_blank" rel="noopener" className="cms-link">View store <ExternalLink size={16} /></Link><LanguageSwitcher /><ThemeToggle /></header>;
}
