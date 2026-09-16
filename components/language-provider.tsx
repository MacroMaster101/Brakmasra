"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useSyncExternalStore } from "react";
import { translations, type Language, type TranslationDictionary } from "@/lib/i18n";

type LanguageContextType = {
  lang: Language;
  setLang: (lang: Language) => void;
  toggleLang: () => void;
  t: TranslationDictionary;
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const STORAGE_KEY = "brakmasra_lang";
const LANGUAGE_CHANGE_EVENT = "brakmasra:language-change";
let inMemoryLanguage: Language = "en";

function readStoredLanguage(): Language {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    inMemoryLanguage = saved === "si" ? "si" : "en";
    return inMemoryLanguage;
  } catch {
    return inMemoryLanguage;
  }
}

function subscribeToLanguage(listener: () => void) {
  window.addEventListener("storage", listener);
  window.addEventListener(LANGUAGE_CHANGE_EVENT, listener);
  return () => {
    window.removeEventListener("storage", listener);
    window.removeEventListener(LANGUAGE_CHANGE_EVENT, listener);
  };
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const lang = useSyncExternalStore<Language>(subscribeToLanguage, readStoredLanguage, () => "en");

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const setLang = useCallback((newLang: Language) => {
    inMemoryLanguage = newLang;
    try {
      localStorage.setItem(STORAGE_KEY, newLang);
    } catch {
      // The in-page event still updates consumers when storage is unavailable.
    }
    document.documentElement.lang = newLang;
    window.dispatchEvent(new Event(LANGUAGE_CHANGE_EVENT));
  }, []);

  const toggleLang = useCallback(() => {
    setLang(lang === "en" ? "si" : "en");
  }, [lang, setLang]);

  const currentDict = translations[lang];

  const value = useMemo(
    () => ({
      lang,
      setLang,
      toggleLang,
      t: currentDict,
    }),
    [lang, setLang, toggleLang, currentDict],
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
