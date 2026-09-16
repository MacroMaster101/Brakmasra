import type { Metadata } from "next";
import { CartView } from "@/components/cart-view";
import { StoreComingSoon } from "@/components/coming-soon";
import { commerceEnabled } from "@/lib/features";

export const metadata: Metadata = { title: "Cart", robots: { index: false, follow: false } };

export default function CartPage() {
  if (!commerceEnabled) return <StoreComingSoon area="cart" />;
  return (
    <div className="page-shell page-top">
      <header className="page-hero compact">
        <span className="eyebrow">Your selection</span>
        <h1>Cart</h1>
        <p>Review the pieces you are carrying forward.</p>
      </header>
      <CartView />
    </div>
  );
}
