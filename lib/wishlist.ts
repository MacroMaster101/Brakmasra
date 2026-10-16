"use client";

import { useSyncExternalStore } from "react";

const KEY = "brakmasra_wishlist";
function read() {
  try {
    return localStorage.getItem(KEY) ?? "[]";
  } catch {
    return "[]";
  }
}
export function parseWishlist(value: string): string[] {
  try {
    const parsed: unknown = JSON.parse(value);
    return Array.isArray(parsed)
      ? [
          ...new Set(
            parsed.filter((slug): slug is string => typeof slug === "string"),
          ),
        ]
      : [];
  } catch {
    return [];
  }
}
function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener("brakmasra-wishlist", callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener("brakmasra-wishlist", callback);
  };
}
export function useWishlist() {
  const raw = useSyncExternalStore(subscribe, read, () => null);
  const slugs = parseWishlist(raw ?? "[]");
  return {
    slugs,
    ready: raw !== null,
    toggle(slug: string) {
      const current = parseWishlist(read());
      try {
        localStorage.setItem(
          KEY,
          JSON.stringify(
            current.includes(slug)
              ? current.filter((item) => item !== slug)
              : [...current, slug],
          ),
        );
        window.dispatchEvent(new Event("brakmasra-wishlist"));
      } catch {
        /* Storage may be disabled by the browser. */
      }
    },
  };
}
