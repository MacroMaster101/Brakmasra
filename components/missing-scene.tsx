"use client";

import Link from "next/link";
import { useRef, type PointerEvent, type ReactNode } from "react";

import Image from "@/components/store-image";
import { LanguageSwitcher } from "@/components/language-switcher";
import { useLanguage } from "@/components/language-provider";
import { ThemeToggle } from "@/components/theme-toggle";

// Fixed glyph paths keep identical proportions before and after hydration and font loading.
const FOUR = "M206 20h111v326h53v96h-53v138H212V442H12V350Zm6 164L105 346h107Z";
const ZERO = "M600 20C470 20 400 100 400 300S470 580 600 580 800 500 800 300 730 20 600 20Zm0 110c60 0 90 50 90 170s-30 170-90 170-90-50-90-170 30-170 90-170Z";
const FIVE = "M60 20H360V120H170V225C200 210 235 205 265 205C340 205 390 265 390 385C390 510 315 580 215 580C130 580 70 535 50 460L150 425C165 465 185 485 215 485C255 485 280 450 280 390C280 330 255 300 215 300C185 300 165 315 150 335L60 320Z";

function Numerals({ code }: { code: "404" | "500" }) {
  return (
    // Decorative: the heading below says the same thing in words.
    <svg className="missing-code" viewBox="0 0 1200 600" preserveAspectRatio="none" aria-hidden="true" focusable="false">
      {code === "404" ? (
        <>
          <path fillRule="evenodd" d={FOUR} />
          <path fillRule="evenodd" d={ZERO} />
          <path fillRule="evenodd" transform="translate(818)" d={FOUR} />
        </>
      ) : (
        <>
          <path d={FIVE} />
          <path fillRule="evenodd" d={ZERO} />
          <path fillRule="evenodd" transform="translate(400)" d={ZERO} />
        </>
      )}
    </svg>
  );
}

/**
 * The full-screen ghost scene shared by the 404 and error pages: brand bar with
 * language and theme, numerals, drifting clouds, and a character that leans
 * toward the pointer. Colours follow the light or dark theme.
 */
export function MissingScene({ code, title, desc, children }: {
  code: "404" | "500";
  title: string;
  desc: string;
  /** The action buttons. */
  children: ReactNode;
}) {
  const { t } = useLanguage();
  const character = useRef<HTMLDivElement>(null);

  const resetCharacter = () => character.current?.removeAttribute("style");
  const followPointer = (event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType !== "mouse" || !window.matchMedia("(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)").matches) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    const x = Math.max(-1, Math.min(1, (event.clientX - bounds.left) / bounds.width * 2 - 1));
    const y = Math.max(-1, Math.min(1, (event.clientY - bounds.top) / bounds.height * 2 - 1));
    const style = character.current?.style;
    style?.setProperty("--character-x", `${x * 12}px`);
    style?.setProperty("--character-y", `${y * 8}px`);
    style?.setProperty("--character-rotate-x", `${-y * 4}deg`);
    style?.setProperty("--character-rotate-y", `${x * 6}deg`);
  };

  return (
    <section className="storefront-not-found" aria-labelledby="missing-page-title">
      <header className="missing-header">
        <Link className="missing-brand" href="/" aria-label={t.brandHomeLabel}>BRAKMASRA</Link>
        <div className="missing-preferences">
          <LanguageSwitcher />
          <ThemeToggle />
        </div>
      </header>

      <div className="missing-stage" onPointerMove={followPointer} onPointerLeave={resetCharacter} onPointerCancel={resetCharacter}>
        <div className="missing-backdrop">
          <Numerals code={code} />
        </div>
        <div className="missing-clouds" aria-hidden="true">
          <div className="missing-cloud missing-cloud-left"><Image src="/images/system/404-cloud-cluster-v1.webp" alt="" fill sizes="(max-width: 767px) 78vw, 38vw" /></div>
          <div className="missing-cloud missing-cloud-right"><Image src="/images/system/404-cloud-cluster-v1.webp" alt="" fill sizes="(max-width: 767px) 75vw, 32vw" /></div>
          <div className="missing-cloud missing-cloud-low"><Image src="/images/system/404-cloud-cluster-v1.webp" alt="" fill sizes="28vw" /></div>
        </div>
        <div className="missing-illustration" aria-hidden="true">
          <div ref={character} className="missing-interactive">
            {/* One 4K master; Next serves each screen a resized WebP or AVIF. The float is CSS, so it stops for reduced motion. */}
            <div className="missing-spirit">
              <Image src="/images/system/404-streetwear-hq-4k.webp" alt="" fill sizes="(max-width: 767px) 120vw, (max-width: 1200px) 90vw, 920px" priority />
            </div>
          </div>
          <div className="missing-shadow" />
        </div>
      </div>

      <div className="missing-copy">
        <h1 id="missing-page-title">{title}</h1>
        <p className="missing-description">{desc}</p>
        <div className="missing-actions">{children}</div>
      </div>
    </section>
  );
}
