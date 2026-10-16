"use client";

import { useEffect } from "react";
import { parseScrollPosition, scrollStorageKey } from "@/lib/scroll-position";

/** Restore reloads after streamed content is ready; leave route and history scrolling to Next/browser. */
export function ScrollRestoration() {
  useEffect(() => {
    const previous = window.history.scrollRestoration;
    window.history.scrollRestoration = "auto";
    const key = () => scrollStorageKey(location.pathname, location.search);
    let target: number | null = null;
    const navigation = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
    if (navigation?.type === "reload") {
      try { target = parseScrollPosition(sessionStorage.getItem(key())); } catch { /* Native restoration still works. */ }
    }

    let restoring = target !== null;
    let saveFrame = 0;
    let restoreFrame = 0;
    let resizeObserver: ResizeObserver | undefined;
    let mutationObserver: MutationObserver | undefined;
    let deadline: ReturnType<typeof setTimeout> | undefined;
    const persist = () => {
      if (restoring) return;
      try { sessionStorage.setItem(key(), String(window.scrollY)); } catch { /* Storage is optional. */ }
    };
    const stopRestoring = () => {
      restoring = false;
      resizeObserver?.disconnect();
      mutationObserver?.disconnect();
      cancelAnimationFrame(restoreFrame);
      clearTimeout(deadline);
      window.removeEventListener("load", scheduleRestore);
      window.removeEventListener("wheel", stopRestoring);
      window.removeEventListener("touchstart", stopRestoring);
      window.removeEventListener("pointerdown", stopRestoring);
      window.removeEventListener("keydown", stopRestoring);
    };
    const restore = () => {
      if (!restoring || target === null) return;
      if (document.querySelector('main [aria-busy="true"]')) return;
      if (document.documentElement.scrollHeight - innerHeight < target) return;
      window.scrollTo({ top: target, behavior: "instant" });
      if (document.readyState === "complete") stopRestoring();
    };
    function scheduleRestore() {
      cancelAnimationFrame(restoreFrame);
      restoreFrame = requestAnimationFrame(restore);
    }
    if (restoring) {
      resizeObserver = new ResizeObserver(scheduleRestore);
      resizeObserver.observe(document.body);
      mutationObserver = new MutationObserver(scheduleRestore);
      mutationObserver.observe(document.querySelector("main") ?? document.body, { childList: true, subtree: true });
      window.addEventListener("load", scheduleRestore);
      window.addEventListener("wheel", stopRestoring, { passive: true });
      window.addEventListener("touchstart", stopRestoring, { passive: true });
      window.addEventListener("pointerdown", stopRestoring, { passive: true });
      window.addEventListener("keydown", stopRestoring);
      deadline = setTimeout(() => {
        if (restoring && target !== null) window.scrollTo({ top: target, behavior: "instant" });
        stopRestoring();
      }, 5000);
      scheduleRestore();
    }
    const onScroll = () => {
      cancelAnimationFrame(saveFrame);
      saveFrame = requestAnimationFrame(persist);
    };
    const onVisibility = () => { if (document.visibilityState === "hidden") persist(); };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("pagehide", persist);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      persist();
      stopRestoring();
      cancelAnimationFrame(saveFrame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("pagehide", persist);
      document.removeEventListener("visibilitychange", onVisibility);
      window.history.scrollRestoration = previous;
    };
  }, []);
  return null;
}
