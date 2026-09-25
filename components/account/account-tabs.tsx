"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Package, Settings, UserRound, type LucideIcon } from "lucide-react";

import { useLanguage } from "@/components/language-provider";
import type { TextKey } from "@/lib/i18n";

const tabs: { href: string; label: TextKey; icon: LucideIcon }[] = [
  { href: "/account", label: "accountTabProfile", icon: UserRound },
  { href: "/account/orders", label: "accountTabOrders", icon: Package },
  { href: "/account/settings", label: "accountTabSettings", icon: Settings },
];

export function AccountTabs() {
  const { t } = useLanguage();
  const pathname = usePathname();

  return (
    <nav className="account-tabs" aria-label={t.accountTabsLabel}>
      {tabs.map(({ href, label, icon: Icon }) => {
        const current = href === "/account" ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link key={href} href={href} aria-current={current ? "page" : undefined} scroll={false}>
            <Icon aria-hidden="true" />
            {t[label]}
          </Link>
        );
      })}
    </nav>
  );
}
