"use client";

import { useState, type FormEvent } from "react";
import { LockKeyhole } from "lucide-react";
import { useCart } from "@/components/cart-provider";
import { useLanguage } from "@/components/language-provider";
import { CheckoutLoadingState } from "@/components/loading-states";
import { readResponseMessage } from "@/lib/client-response";
import { localizeServerMessage } from "@/lib/i18n";

export function CheckoutHeader() {
  const { t } = useLanguage();

  return (
    <header className="checkout-header">
      <LockKeyhole />
      <div>
        <span className="eyebrow">{t.checkoutEyebrow}</span>
        <h1>{t.checkoutTitle}</h1>
      </div>
    </header>
  );
}

export function CheckoutForm() {
  const { hydrated, lines } = useCart();
  const { t, lang } = useLanguage();
  const [status, setStatus] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!lines.length || submitting) return;

    setSubmitting(true);
    setStatus(t.checkoutCreating);

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
      setStatus(localizeServerMessage(await readResponseMessage(response, t.checkoutFailed), lang));
    } catch {
      setStatus(t.checkoutUnavailable);
    } finally {
      setSubmitting(false);
    }
  }

  if (!hydrated) return <CheckoutLoadingState embedded />;

  return (
    <form className="checkout-form panel" onSubmit={submit}>
      <h2>{t.checkoutFormTitle}</h2>
      <p>{t.checkoutFormDesc}</p>
      <button className="button button-primary full" disabled={!lines.length || submitting} type="submit">
        {submitting ? t.checkoutStarting : t.checkoutContinue}
      </button>
      <p className="form-status" aria-live="polite">{status}</p>
    </form>
  );
}
