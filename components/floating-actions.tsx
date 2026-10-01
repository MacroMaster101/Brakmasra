"use client";

import { useEffect, useRef, useState } from "react";
import { useLanguage } from "@/components/language-provider";
import { WhatsAppIcon } from "@/components/whatsapp-icon";
import { whatsappLink, withWhatsAppMessage } from "@/data/site";

// Space kept between the button and the footer's legal row when it rides above it.
const LEGAL_ROW_GAP = 16;

/** Floating bottom-right WhatsApp chat button; renders only when a WhatsApp contact is configured. */
export function FloatingActions({ showWhatsApp = true }: { showWhatsApp?: boolean }) {
  const { t } = useLanguage();
  // True while the footer is on screen. Narrow screens hide the button then,
  // because the footer carries its own WhatsApp link.
  const [docked, setDocked] = useState(false);
  const stackRef = useRef<HTMLDivElement>(null);
  const chatLink = showWhatsApp && whatsappLink ? withWhatsAppMessage(whatsappLink, t.whatsappMessage) : null;
  const enabled = chatLink !== null;

  useEffect(() => {
    const footer = document.querySelector(".site-footer");
    if (!enabled || !footer || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(([entry]) => setDocked(entry.isIntersecting));
    observer.observe(footer);
    return () => observer.disconnect();
  }, [enabled]);

  // Wide screens: once the footer's legal row scrolls into view, lift the button so it
  // sits just above that row instead of covering the Privacy and Terms links.
  useEffect(() => {
    const stack = stackRef.current;
    const legalRow = document.querySelector<HTMLElement>(".footer-bottom");
    if (!stack || !legalRow || typeof IntersectionObserver === "undefined") return;

    let frame = 0;
    const update = () => {
      frame = 0;
      const resting = parseFloat(getComputedStyle(stack).bottom) || 0;
      const needed = window.innerHeight - legalRow.getBoundingClientRect().top + LEGAL_ROW_GAP;
      stack.style.setProperty("--lift", `${Math.max(0, Math.round(needed - resting))}px`);
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        window.addEventListener("scroll", schedule, { passive: true });
        window.addEventListener("resize", schedule);
        schedule();
      } else {
        window.removeEventListener("scroll", schedule);
        window.removeEventListener("resize", schedule);
        stack.style.removeProperty("--lift");
      }
    }, { rootMargin: "0px 0px 120px" });
    observer.observe(legalRow);

    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      cancelAnimationFrame(frame);
    };
  }, [enabled]);

  if (!chatLink) return null;

  return (
    <div ref={stackRef} className={`floating-actions${docked ? " is-docked" : ""}`}>
      <a
        className="whatsapp-button"
        href={chatLink}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={t.whatsappLabel}
        title={t.whatsappLabel}
      >
        <span className="whatsapp-ripple" aria-hidden="true" />
        <span className="whatsapp-ripple" aria-hidden="true" />
        <WhatsAppIcon />
      </a>
    </div>
  );
}
