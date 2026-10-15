"use client";

import { Globe } from "lucide-react";
import { useLanguage } from "@/components/language-provider";
import { PreferenceMenu } from "@/components/preference-menu";
import { parseLanguage } from "@/lib/i18n";

export function LanguageSwitcher({
  className = "",
  showLabels = false,
  placement = "down",
}: {
  className?: string;
  showLabels?: boolean;
  placement?: "down" | "up";
}) {
  const { lang, setLang, t } = useLanguage();
  return (
    <PreferenceMenu
      className={`language-select ${className}`}
      label={t.languageSelection}
      value={lang}
      options={[
        { value: "en", label: "English" },
        { value: "si", label: "සිංහල" },
      ]}
      onChange={(value) => setLang(parseLanguage(value))}
      icon={showLabels ? <Globe aria-hidden="true" /> : undefined}
      placement={placement}
    />
  );
}
