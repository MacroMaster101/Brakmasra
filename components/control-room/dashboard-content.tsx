"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { useLanguage } from "@/components/language-provider";

export function DashboardContent({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const section = usePathname().split("/")[2] ?? "overview";
  const { t } = useLanguage();
  useEffect(() => { ref.current?.scrollTo({ top: 0 }); }, [section]);
  return <div ref={ref} className="cr-content" tabIndex={0} aria-label={t.crWorkspaceLabel}>{children}</div>;
}
