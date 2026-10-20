"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeft, ExternalLink, LayoutDashboard, ShoppingBag } from "lucide-react";

import { useLanguage } from "@/components/language-provider";
import { MissingScene } from "@/components/missing-scene";

/** Only the server's staff check can reveal Control Room recovery links. */
export function NotFoundScene({ staff }: { staff: boolean }) {
  const { t } = useLanguage();
  const pathname = usePathname() ?? "";
  const admin = staff && (pathname === "/admin" || pathname.startsWith("/admin/"));

  return (
    <MissingScene code="404" title={admin ? t.notFoundAdminTitle : t.notFoundTitle} desc={admin ? t.notFoundAdminDesc : t.notFoundDesc}>
      <Link className="button button-primary" href={admin ? "/admin" : "/"}>{admin ? <LayoutDashboard aria-hidden="true" /> : <ArrowLeft aria-hidden="true" />}{admin ? t.notFoundAdminBack : t.notFoundHome}</Link>
      <Link className="button button-secondary" href={admin ? "/" : "/shop"}>{admin ? t.notFoundAdminStore : t.notFoundShop}{admin ? <ExternalLink aria-hidden="true" /> : <ShoppingBag aria-hidden="true" />}</Link>
    </MissingScene>
  );
}
