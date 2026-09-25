"use client";

import { useLanguage } from "@/components/language-provider";

export function LanguageSwitcher({
  className = "",
  showLabels = false,
}: {
  className?: string;
  showLabels?: boolean;
}) {
  const { lang, setLang, t } = useLanguage();

  return (
    <div
      className={`lang-switcher ${className}`}
      role="group"
      aria-label={t.languageSelection}
    >
      <button
        type="button"
        className={`lang-btn ${lang === "en" ? "is-active" : ""}`}
        onClick={() => setLang("en")}
        aria-pressed={lang === "en"}
        lang="en"
        title="Switch to English"
      >
        <span>{showLabels ? "English" : "EN"}</span>
      </button>
      <span className="lang-divider" aria-hidden="true">
        /
      </span>
      <button
        type="button"
        className={`lang-btn ${lang === "si" ? "is-active" : ""}`}
        onClick={() => setLang("si")}
        aria-pressed={lang === "si"}
        lang="si"
        title="සිංහල භාෂාවට මාරු වන්න"
      >
        <span>{showLabels ? "සිංහල" : "සිං"}</span>
      </button>
    </div>
  );
}
