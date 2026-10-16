"use client";

import Link from "next/link";
import { LoaderCircle } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useLanguage } from "@/components/language-provider";
import type { TextKey } from "@/lib/i18n";

function LoadingStatus({ label, children, className = "" }: { children: React.ReactNode; className?: string; label: TextKey }) {
  const { t } = useLanguage();
  return <section className={className} role="status" aria-busy="true" aria-live="polite"><span className="sr-only">{t[label]}</span><div aria-hidden="true">{children}</div></section>;
}
function Line({ size = "medium" }: { size?: "short" | "medium" | "long" | "full" }) {
  return <span className={`loading-block loading-line is-${size}`} />;
}

/** A quiet navigation fallback. There is no simulated percentage or artificial wait. */
export function PageLoadingState({ label = "loadingPage", compact = false }: { label?: TextKey; compact?: boolean }) {
  const { t } = useLanguage();
  return <section className={`route-pending${compact ? " is-compact" : ""}`} role="status" aria-busy="true" aria-live="polite"><div className="route-pending-indicator"><LoaderCircle aria-hidden="true" /><span>{t[label]}</span></div></section>;
}
export function HomeLoadingState() { return <PageLoadingState />; }

export function ProductGridSkeleton() {
  return <div className="loading-product-grid">{[0, 1, 2, 3].map((index) => <div className="loading-product" key={index}><div className="loading-block loading-product-image" /><div className="loading-product-copy"><div><Line size="long" /><Line size="short" /></div></div></div>)}</div>;
}
export function ShopLoadingState() {
  const params = useSearchParams();
  // A saved list may be empty, and upcoming categories are editorial screens.
  // Avoid showing a product grid that those destinations will not contain.
  if (params.get("saved") === "1" || (params.get("category") && params.get("category") !== "tees")) return <PageLoadingState label="loadingCollection" />;
  return <LoadingStatus className="page-shell page-top shop-page loading-page" label="loadingCollection"><div className="loading-shop-heading"><div className="loading-block loading-title is-compact" /><Line size="long" /></div><div className="loading-shop-tools"><div className="loading-block loading-search" /><div className="loading-block loading-filters" /></div><ProductGridSkeleton /></LoadingStatus>;
}
export function ProductLoadingState({ comingSoon = false }: { comingSoon?: boolean }) {
  return <LoadingStatus className="page-shell page-top product-page loading-page" label="loadingProduct"><Line size="short" /><div className="loading-product-detail"><div className="loading-block loading-product-portrait" /><div className="loading-product-panel"><div className="loading-block loading-product-title" /><Line size="short" /><div className="loading-copy-lines"><Line size="full" /><Line size="long" /></div><div className="loading-size-options">{[0,1,2,3].map((index) => <span className="loading-block" key={index} />)}</div><div className="loading-block loading-button" />{!comingSoon && <div className="loading-block loading-button is-wide" />}</div></div></LoadingStatus>;
}
export function CartLoadingState({ embedded = false }: { embedded?: boolean }) {
  return <LoadingStatus className={embedded ? "loading-data-section" : "page-shell page-top loading-page"} label="loadingCart"><div className="loading-cart-layout"><div className="loading-cart-lines">{[0,1].map((index) => <div className="loading-cart-line" key={index}><div className="loading-block loading-cart-image" /><div className="loading-cart-copy"><Line size="long" /><Line size="short" /><div className="loading-block loading-quantity" /></div></div>)}</div><div className="loading-cart-summary"><Line size="medium" /><div className="loading-summary-row"><Line size="short" /><Line size="short" /></div><div className="loading-block loading-button is-wide" /></div></div></LoadingStatus>;
}
export function CheckoutLoadingState({ embedded = false }: { embedded?: boolean }) { return <PageLoadingState label="loadingCheckoutDetails" compact={embedded} />; }
export function AuthLoadingState({ compact = false }: { compact?: boolean } = {}) {
  const { t } = useLanguage();
  return <div className="auth-route-pending"><Link href="/" aria-label={t.brandHomeLabel}>BRAKMASRA</Link><PageLoadingState label={compact ? "loadingMemberAccess" : "loadingAuth"} /></div>;
}
export function AuthComingSoonLoadingState({ compact = false }: { compact?: boolean } = {}) { return <AuthLoadingState compact={compact} />; }
export function LaunchLoadingState() { return <PageLoadingState />; }
export function DashboardLoadingState() {
  return <LoadingStatus className="dashboard-loading panel" label="loadingDashboard"><div className="loading-dashboard-heading"><Line size="medium" /><div className="loading-block loading-button" /></div><div className="loading-dashboard-table">{[0,1,2,3].map((index) => <div key={index}><span className="loading-block loading-dashboard-icon" /><Line size="long" /><Line size="short" /></div>)}</div></LoadingStatus>;
}
