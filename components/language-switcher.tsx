"use client";

import { Globe } from "lucide-react";
import { useLanguage } from "@/components/language-provider";
import { PreferenceMenu } from "@/components/preference-menu";
import { parseLanguage } from "@/lib/i18n";

export function LanguageSwitcher({
  className = "",
  showLabels = false,
  placement = "down",
  variant = "default",
}: {
  className?: string;
  showLabels?: boolean;
  placement?: "down" | "up";
  variant?: "default" | "dashboard";
}) {
  const { lang, setLang, t } = useLanguage();
  return (
    <PreferenceMenu
      className={`language-select${variant === "dashboard" ? " dashboard-language-picker" : ""} ${className}`}
      label={t.languageSelection}
      value={lang}
      options={[
        { value: "en", label: "English", ...(variant === "dashboard" ? { flag: "/images/flags/gb.svg" } : {}) },
        { value: "si", label: "සිංහල", ...(variant === "dashboard" ? { flag: "/images/flags/lk.svg" } : {}) },
      ]}
      onChange={(value) => setLang(parseLanguage(value))}
      icon={showLabels ? <Globe aria-hidden="true" /> : undefined}
      placement={placement}
      iconOnly={variant === "dashboard"}
    />
  );
}
