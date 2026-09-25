"use client";

import Link from "next/link";
import { LayoutDashboard } from "lucide-react";

import { useLanguage } from "@/components/language-provider";
import { controlRoomNav } from "@/data/navigation";

/** Account header button; the account layout renders it only for roles with Control Room access. */
export function ControlRoomLink() {
  const { t } = useLanguage();
  return (
    <Link className="button button-secondary cr-link-button" href={controlRoomNav.href}>
      <LayoutDashboard aria-hidden="true" />
      {t[controlRoomNav.labelKey]}
    </Link>
  );
}
