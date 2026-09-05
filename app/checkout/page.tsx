import type { Metadata } from "next";
import { LockKeyhole } from "lucide-react";
import { CheckoutForm } from "@/components/checkout-form";
export const metadata: Metadata = { title: "Checkout", robots: { index: false, follow: false } };
export default function CheckoutPage() { return <div className="checkout-page"><div className="checkout-shell"><header className="checkout-header"><LockKeyhole /><div><span className="eyebrow">Protected handoff</span><h1>Checkout</h1></div></header><CheckoutForm /><p className="checkout-note">Checkout is not open yet. It goes live with the first merch drop.</p></div></div>; }
