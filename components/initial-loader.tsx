"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

const minimumDisplayTime = 850;
const exitDuration = 520;

export function InitialLoader() {
  const [phase, setPhase] = useState<"visible" | "exiting" | "hidden">("visible");

  useEffect(() => {
    const startedAt = performance.now();
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let exitTimer: ReturnType<typeof setTimeout> | undefined;
    let removeTimer: ReturnType<typeof setTimeout> | undefined;
    let hasStartedExit = false;

    const beginExit = () => {
      if (hasStartedExit) return;
      hasStartedExit = true;
      const minimum = reduceMotion ? 120 : minimumDisplayTime;
      const remaining = Math.max(0, minimum - (performance.now() - startedAt));

      exitTimer = setTimeout(() => {
        setPhase("exiting");
        removeTimer = setTimeout(() => {
          setPhase("hidden");
        }, reduceMotion ? 20 : exitDuration);
      }, remaining);
    };

    if (document.readyState === "complete") beginExit();
    else window.addEventListener("load", beginExit, { once: true });

    const safetyTimer = setTimeout(beginExit, 3500);

    return () => {
      window.removeEventListener("load", beginExit);
      clearTimeout(safetyTimer);
      if (exitTimer) clearTimeout(exitTimer);
      if (removeTimer) clearTimeout(removeTimer);
    };
  }, []);

  if (phase === "hidden") return null;

  return (
    <div
      className={`initial-loader${phase === "exiting" ? " is-exiting" : ""}`}
      role="status"
      aria-busy="true"
      aria-live="polite"
      aria-label="Loading BRAKMASRA"
    >
      <div className="initial-loader-atmosphere" aria-hidden="true" />
      <div className="initial-loader-content" aria-hidden="true">
        <div className="initial-loader-mark">
          <Image
            src="/images/brakmasra-logo-reference.png"
            alt=""
            width={148}
            height={148}
          />
        </div>
        <div className="initial-loader-wordmark">BRAKMASRA</div>
        <p>Official store</p>
        <div className="initial-loader-progress">
          <span />
        </div>
      </div>
    </div>
  );
}
