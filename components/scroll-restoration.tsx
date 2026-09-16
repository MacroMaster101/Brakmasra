"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

function readScrollPosition(key: string) {
  try {
    const value = sessionStorage.getItem(key);
    if (!value) return null;
    const position = Number.parseInt(value, 10);
    return Number.isNaN(position) ? null : position;
  } catch {
    return null;
  }
}

function writeScrollPosition(key: string, position: number) {
  try {
    sessionStorage.setItem(key, String(position));
  } catch {
    // Scroll restoration remains optional when storage is unavailable.
  }
}

/**
 * Handles scroll behavior:
 * 1. On page refresh (reload), restores the user's exact scroll position.
 * 2. On navigation (clicking nav links to a new page), scrolls to the top of the page.
 */
export function ScrollRestoration() {
  const pathname = usePathname();
  const previousPathnameRef = useRef<string | null>(null);
  const isInitialMountRef = useRef(true);

  // 1. Differentiate between browser refresh (reload) and route navigation
  useEffect(() => {
    if (typeof window === "undefined") return;

    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }

    const navEntry = performance.getEntriesByType("navigation")[0] as
      | PerformanceNavigationTiming
      | undefined;
    const isReload = navEntry?.type === "reload";

    const key = `brakmasra_scroll_${pathname}`;

    if (isInitialMountRef.current) {
      isInitialMountRef.current = false;
      previousPathnameRef.current = pathname;

      // Only restore scroll if this was a browser page refresh/reload
      if (isReload && !window.location.hash) {
        const targetY = readScrollPosition(key);
        if (targetY !== null && targetY > 0) {
          window.scrollTo({ top: targetY, behavior: "instant" });

          const t1 = setTimeout(() => {
            window.scrollTo({ top: targetY, behavior: "instant" });
          }, 50);

          const t2 = setTimeout(() => {
            window.scrollTo({ top: targetY, behavior: "instant" });
          }, 200);

          const t3 = setTimeout(() => {
            window.scrollTo({ top: targetY, behavior: "instant" });
          }, 500);

          return () => {
            clearTimeout(t1);
            clearTimeout(t2);
            clearTimeout(t3);
          };
        }
      } else if (!window.location.hash) {
        // Direct first load or non-reload: go to top
        window.scrollTo({ top: 0, behavior: "instant" });
      }
      return;
    }

    // 2. Client-side route change (clicking nav links): ALWAYS scroll to top of new page!
    if (previousPathnameRef.current !== pathname) {
      previousPathnameRef.current = pathname;
      if (!window.location.hash) {
        window.scrollTo({ top: 0, behavior: "instant" });
        writeScrollPosition(key, 0);
      }
    }
  }, [pathname]);

  // 3. Continuously record scroll position per page so we know where to restore on reload
  useEffect(() => {
    if (typeof window === "undefined") return;

    const key = `brakmasra_scroll_${pathname}`;
    let scrollTimeout: ReturnType<typeof setTimeout> | undefined;

    const handleScroll = () => {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        writeScrollPosition(key, window.scrollY);
      }, 50);
    };

    const handleBeforeUnload = () => {
      writeScrollPosition(key, window.scrollY);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("beforeunload", handleBeforeUnload);
    window.addEventListener("pagehide", handleBeforeUnload);

    return () => {
      clearTimeout(scrollTimeout);
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("beforeunload", handleBeforeUnload);
      window.removeEventListener("pagehide", handleBeforeUnload);
    };
  }, [pathname]);

  // 4. Handle clicks on links pointing to the current page so they smoothly scroll to top
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleDocumentClick = (event: MouseEvent) => {
      const anchor = (event.target as HTMLElement | null)?.closest("a");
      if (!anchor) return;

      const href = anchor.getAttribute("href");
      if (!href) return;

      // Ignore pure hash links like skip links (#content)
      if (href.startsWith("#")) return;

      try {
        const targetUrl = new URL(anchor.href, window.location.origin);
        if (
          targetUrl.origin === window.location.origin &&
          targetUrl.pathname === window.location.pathname &&
          !targetUrl.hash
        ) {
          window.scrollTo({ top: 0, behavior: "smooth" });
        }
      } catch {
        // Ignore malformed URLs
      }
    };

    document.addEventListener("click", handleDocumentClick, { capture: true });
    return () => {
      document.removeEventListener("click", handleDocumentClick, { capture: true });
    };
  }, []);

  return null;
}
