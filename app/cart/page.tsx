import type { Metadata } from "next";
import { CartView } from "@/components/cart-view";
import { StoreComingSoon } from "@/components/coming-soon";
import { commerceEnabled } from "@/lib/features";

export const metadata: Metadata = { title: "Cart", robots: { index: false, follow: false } };

export default function CartPage() {
  if (!commerceEnabled) return <StoreComingSoon area="cart" />;
  return (
    <div className="page-shell page-top">
      <CartView />
    </div>
  );
}
