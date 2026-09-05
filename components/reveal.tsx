"use client";

import { useEffect, useRef, type ReactNode } from "react";

type RevealProps = {
  children: ReactNode;
  className?: string;
  /** Stagger step (0-3) applied as a small transition-delay via CSS. */
  delay?: 1 | 2 | 3;
};

/**
 * Reveals its children on first scroll into view.
 *
 * Progressive enhancement: the hidden state lives behind `.reveal-ready` on
 * <html>, which is only added once this component mounts. Without JS the
 * content simply renders visible, and it can never get stuck invisible.
 */
export function Reveal({ children, className, delay }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const root = document.documentElement;
    root.classList.add("reveal-ready");

    // Reveal immediately if IntersectionObserver is unavailable.
    if (typeof IntersectionObserver === "undefined") {
      el.classList.add("is-in");
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            el.classList.add("is-in");
            observer.unobserve(el);
          }
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -6% 0px" },
    );
    observer.observe(el);

    // Safety net: never leave content hidden if the observer never fires.
    const failsafe = window.setTimeout(() => el.classList.add("is-in"), 2500);

    return () => {
      observer.disconnect();
      window.clearTimeout(failsafe);
    };
  }, []);

  return (
    <div ref={ref} data-reveal data-reveal-delay={delay} className={className}>
      {children}
    </div>
  );
}
