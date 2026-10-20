"use client";

import { Moon, Sun } from "lucide-react";
import { useSyncExternalStore } from "react";
import { useLanguage } from "@/components/language-provider";

function subscribe(callback: () => void) {
  const media = window.matchMedia("(prefers-color-scheme: dark)");
  const update = () => {
    try {
      const saved = localStorage.getItem("brakmasra_theme");
      document.documentElement.dataset.theme =
        saved === "light" || saved === "dark"
          ? saved
          : media.matches
            ? "dark"
            : "light";
    } catch {
      /* System preference still works through CSS. */
    }
    callback();
  };
  media.addEventListener("change", update);
  window.addEventListener("storage", update);
  window.addEventListener("brakmasra-theme", callback);
  return () => {
    media.removeEventListener("change", update);
    window.removeEventListener("storage", update);
    window.removeEventListener("brakmasra-theme", callback);
  };
}
function snapshot() {
  return (
    document.documentElement.dataset.theme === "dark" ||
    (!document.documentElement.dataset.theme &&
      window.matchMedia("(prefers-color-scheme: dark)").matches)
  );
}
export function ThemeToggle() {
  const dark = useSyncExternalStore(subscribe, snapshot, () => false);
  const { t } = useLanguage();
  const label = dark ? t.storeLightTheme : t.storeDarkTheme;
  return (
    <button
      className="icon-button theme-toggle"
      aria-label={label}
      title={label}
      type="button"
      onClick={() => {
        const next = dark ? "light" : "dark";
        const root = document.documentElement;
        // Colour transitions would fade old-theme fills under new-theme text, so switch in one frame.
        root.classList.add("theme-switching");
        root.dataset.theme = next;
        requestAnimationFrame(() => requestAnimationFrame(() => root.classList.remove("theme-switching")));
        try {
          localStorage.setItem("brakmasra_theme", next);
        } catch {
          /* Use the current session. */
        }
        window.dispatchEvent(new Event("brakmasra-theme"));
      }}
    >
      {dark ? <Sun /> : <Moon />}
    </button>
  );
}
