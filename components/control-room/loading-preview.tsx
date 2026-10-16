"use client";
import { useState } from "react";
import Link from "next/link";
import { AuthLoadingState, CartLoadingState, DashboardLoadingState, PageLoadingState, ProductLoadingState, ShopLoadingState } from "@/components/loading-states";
const previews = { "Page navigation": PageLoadingState, "Shop grid": ShopLoadingState, "Product details": ProductLoadingState, "Cart": CartLoadingState, "Sign in": AuthLoadingState, "Dashboard data": DashboardLoadingState };
export function LoadingPreview() {
  const [selected, setSelected] = useState<keyof typeof previews>("Page navigation");
  const Preview = previews[selected];
  return <section className="panel cms-manager"><header className="cms-heading"><div><Link href="/admin/site" className="cms-link">← Site setup</Link><h2>Loading states</h2><p>Navigation uses a small progress indicator. Skeletons are limited to product and management data. These previews do not delay the live website.</p></div></header><label className="cms-field"><span>Preview</span><select value={selected} onChange={(event) => setSelected(event.target.value as keyof typeof previews)}>{Object.keys(previews).map((name) => <option key={name}>{name}</option>)}</select></label><div className="loading-preview"><Preview /></div></section>;
}
