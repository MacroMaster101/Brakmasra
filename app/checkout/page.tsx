import type { Metadata } from "next";
import { LockKeyhole } from "lucide-react";
import { StoreComingSoon } from "@/components/coming-soon";
import { CheckoutForm } from "@/components/checkout-form";
import { commerceEnabled } from "@/lib/features";

export const metadata: Metadata = { title: "Checkout", robots: { index: false, follow: false } };

export default function CheckoutPage() {
  if (!commerceEnabled) return <StoreComingSoon area="checkout" />;
  return (
    <div className="checkout-page">
      <div className="checkout-shell">
        <header className="checkout-header">
          <LockKeyhole />
          <div>
            <span className="eyebrow">Protected handoff</span>
            <h1>Checkout</h1>
          </div>
        </header>
        <CheckoutForm />
      </div>
    </div>
  );
}
