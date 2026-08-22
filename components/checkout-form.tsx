"use client";

import { useState, type FormEvent } from "react";
import { useCart } from "@/components/cart-provider";

export function CheckoutForm() {
  const { lines } = useCart();
  const [status, setStatus] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setStatus("Creating secure checkout…");
    const response = await fetch("/api/checkout", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ lines: lines.map(({ productId, size, color, quantity }) => ({ productId, size, color, quantity })) }) });
    const result = await response.json(); setStatus(result.message);
  }
  return <form className="checkout-form panel" onSubmit={submit}><h2>Secure checkout</h2><p>Payment details will be collected only by the configured payment provider. BRAKMASRA never stores raw card data.</p><button className="button button-primary full" disabled={!lines.length} type="submit">Continue to payment</button><p className="form-status" aria-live="polite">{status}</p></form>;
}
