"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useContent } from "@/components/content-provider";
import { LANGUAGE_COOKIE, parseLanguage, translations, type Language, type TranslationDictionary } from "@/lib/i18n";

type LanguageContextType = {
  lang: Language;
  setLang: (lang: Language) => void;
  toggleLang: () => void;
  t: TranslationDictionary;
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// localStorage mirrors the cookie so other open tabs hear the change through
// the storage event. The cookie is what the server reads to render the
// correct language on the first paint.
const STORAGE_KEY = "brakmasra_lang";
const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

function persistLanguage(lang: Language) {
  const secure = window.location.protocol === "https:" ? "; secure" : "";
  document.cookie = `${LANGUAGE_COOKIE}=${lang}; path=/; max-age=${ONE_YEAR_SECONDS}; samesite=lax${secure}`;
  try {
    localStorage.setItem(STORAGE_KEY, lang);
  } catch {
    // The cookie alone is enough when storage is unavailable.
  }
}

function hasLanguageCookie() {
  return document.cookie.split("; ").some((entry) => entry.startsWith(`${LANGUAGE_COOKIE}=`));
}

export function LanguageProvider({
  children,
  initialLang,
}: {
  children: React.ReactNode;
  /** The language the server rendered, read from the cookie. */
  initialLang: Language;
}) {
  const router = useRouter();
  const content = useContent();
  const [chosenLang, setChosenLang] = useState<Language | null>(null);
  const lang = chosenLang ?? initialLang;

  const setLang = useCallback((newLang: Language) => {
    persistLanguage(newLang);
    document.documentElement.lang = newLang;
    setChosenLang(newLang);
  }, []);

  useEffect(() => {
    // Visitors who chose a language before it was stored in a cookie: save it
    // as a cookie and let the server render that language.
    if (!hasLanguageCookie()) {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved === "si" || saved === "en") {
          persistLanguage(saved);
          if (saved !== initialLang) router.refresh();
        }
      } catch {
        // Keep the server-rendered language.
      }
    }
  }, [initialLang, router]);

  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key !== STORAGE_KEY || !event.newValue) return;
      const next = parseLanguage(event.newValue);
      document.documentElement.lang = next;
      setChosenLang(next);
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const toggleLang = useCallback(() => {
    setLang(lang === "en" ? "si" : "en");
  }, [lang, setLang]);

  const value = useMemo(
    () => {
      const edits = Object.assign({}, ...Object.values(content.pages).map((page) => Object.fromEntries(Object.entries(page[lang]).filter(([key]) => key.startsWith("text.")).map(([key, value]) => [key.slice(5), value]))));
      return { lang, setLang, toggleLang, t: { ...translations[lang], ...edits } };
    },
    [lang, setLang, toggleLang, content.pages],
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider.");
  }
  return context;
}
