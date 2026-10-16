"use client";
import { useSyncExternalStore } from "react";

const key = "brakmasra_search_history";
export function parseSearchHistory(raw: string): string[] {
  try {
    const values: unknown = JSON.parse(raw);
    if (!Array.isArray(values)) return [];
    const seen = new Set<string>();
    return values.filter((value): value is string => typeof value === "string").map(value => value.trim().slice(0, 100)).filter(value => {
      if (!value || seen.has(value.toLowerCase())) return false;
      seen.add(value.toLowerCase());
      return true;
    }).slice(0, 5);
  } catch { return []; }
}
function read() { try { return localStorage.getItem(key) ?? "[]"; } catch { return "[]"; } }
function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener("brakmasra-search", callback);
  return () => { window.removeEventListener("storage", callback); window.removeEventListener("brakmasra-search", callback); };
}
export function useSearchHistory() {
  const raw = useSyncExternalStore(subscribe, read, () => "[]");
  const write = (values: string[]) => {
    try { localStorage.setItem(key, JSON.stringify(values)); window.dispatchEvent(new Event("brakmasra-search")); } catch { /* Search still works without browser storage. */ }
  };
  return {
    entries: parseSearchHistory(raw),
    remember: (query: string) => write(parseSearchHistory(JSON.stringify([query, ...parseSearchHistory(read())]))),
    clear: () => write([]),
  };
}
