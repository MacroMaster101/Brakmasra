"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeft, LayoutDashboard, RotateCcw } from "lucide-react";

import { useLanguage } from "@/components/language-provider";
import { MissingScene } from "@/components/missing-scene";

export default function ErrorPage({ reset }: { reset: () => void }) {
  const { t } = useLanguage();
  const pathname = usePathname() ?? "";
  // Only signed-in staff can reach a Control Room page far enough to hit an error there.
  const admin = pathname === "/admin" || pathname.startsWith("/admin/");

  return (
    <MissingScene code="500" title={t.errorTitle} desc={admin ? t.errorAdminDesc : t.errorDesc}>
      <button className="button button-primary" type="button" onClick={reset}>
        <RotateCcw aria-hidden="true" />
        {t.errorRetry}
      </button>
      {admin ? (
        <Link className="button button-secondary" href="/admin">
          {t.notFoundAdminBack}
          <LayoutDashboard aria-hidden="true" />
        </Link>
      ) : (
        <Link className="button button-secondary" href="/">
          <ArrowLeft aria-hidden="true" />
          {t.notFoundHome}
        </Link>
      )}
    </MissingScene>
  );
}
