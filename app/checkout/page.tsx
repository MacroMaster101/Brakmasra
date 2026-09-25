import type { Metadata } from "next";
import { StoreComingSoon } from "@/components/coming-soon";
import { CheckoutForm, CheckoutHeader } from "@/components/checkout-form";
import { commerceEnabled } from "@/lib/features";

export const metadata: Metadata = { title: "Checkout", robots: { index: false, follow: false } };

export default function CheckoutPage() {
  if (!commerceEnabled) return <StoreComingSoon area="checkout" />;
  return (
    <div className="checkout-page">
      <div className="checkout-shell">
        <CheckoutHeader />
        <CheckoutForm />
      </div>
    </div>
  );
}
