"use client";

import { useState, type FormEvent } from "react";
import { useCart } from "@/components/cart-provider";
import { CheckoutLoadingState } from "@/components/loading-states";
import { readResponseMessage } from "@/lib/client-response";

export function CheckoutForm() {
  const { hydrated, lines } = useCart();
  const [status, setStatus] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!lines.length || submitting) return;

    setSubmitting(true);
    setStatus("Creating secure checkout...");

    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          lines: lines.map(({ productId, size, color, quantity }) => ({
            productId,
            size,
            color,
            quantity,
          })),
        }),
      });
      setStatus(await readResponseMessage(response, "Checkout could not be started. Please try again."));
    } catch {
      setStatus("Checkout is unavailable right now. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (!hydrated) return <CheckoutLoadingState embedded />;

  return (
    <form className="checkout-form panel" onSubmit={submit}>
      <h2>Secure checkout</h2>
      <p>Payment details are handled entirely by our payment provider. BRAKMASRA never stores your card details.</p>
      <button className="button button-primary full" disabled={!lines.length || submitting} type="submit">
        {submitting ? "Starting checkout..." : "Continue to payment"}
      </button>
      <p className="form-status" aria-live="polite">{status}</p>
    </form>
  );
}
