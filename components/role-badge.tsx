"use client";

import { Code2, Crown, Heart, ShieldCheck, type LucideIcon } from "lucide-react";

import { useLanguage } from "@/components/language-provider";
import type { TextKey } from "@/lib/i18n";
import type { MemberRole } from "@/lib/roles";

const badges: Record<MemberRole, { icon: LucideIcon; label: TextKey; tone: string }> = {
  web_dev: { icon: Code2, label: "roleWebDev", tone: "web-dev" },
  owner: { icon: Crown, label: "roleOwner", tone: "owner" },
  staff: { icon: ShieldCheck, label: "roleStaff", tone: "staff" },
  supporter: { icon: Heart, label: "roleSupporter", tone: "supporter" },
};

/** A small role pill; renders nothing for regular members. */
export function RoleBadge({ role, size = "sm" }: { role: MemberRole | null; size?: "sm" | "md" }) {
  const { t } = useLanguage();
  if (!role) return null;

  const { icon: Icon, label, tone } = badges[role];
  return (
    <span className={`role-badge role-badge-${size} is-${tone}`}>
      <Icon aria-hidden="true" />
      {t[label]}
    </span>
  );
}

/** The translation key for a role's name, for places that need plain text. */
export function roleLabelKey(role: MemberRole): TextKey {
  return badges[role].label;
}
