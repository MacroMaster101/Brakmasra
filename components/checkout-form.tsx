"use client";

import { useEffect, useState, type FormEvent } from "react";
import { RoundedSelect } from "@/components/control-room/rounded-select";
import { useCurrency } from "@/components/currency-provider";
import { parseCurrency } from "@/lib/currency";
import { formatMoney } from "@/lib/cart";
import type { CheckoutQuote } from "@/lib/checkout-quote";
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
      <div>
        <span className="eyebrow checkout-eyebrow"><LockKeyhole aria-hidden="true" />{t.checkoutEyebrow}</span>
        <h1>{t.checkoutTitle}</h1>
      </div>
    </header>
  );
}

export function CheckoutForm() {
  const { hydrated, lines } = useCart();
  const { t, lang } = useLanguage();
  const { currency, setCurrency } = useCurrency();
  const requestBody = JSON.stringify({ currency, lines: lines.map(({ productId, size, color, quantity }) => ({ productId, size, color, quantity })) });
  const [quoteState, setQuoteState] = useState<{ key: string; quote?: CheckoutQuote; error?: string }>({ key: "" });
  const quote = quoteState.key === requestBody ? quoteState.quote : undefined;
  const quoteError = quoteState.key === requestBody ? quoteState.error : undefined;
  const checking = hydrated && lines.length > 0 && quoteState.key !== requestBody;
  useEffect(() => {
    if (!hydrated || !lines.length) return;
    const controller = new AbortController();
    fetch("/api/checkout/quote", { method: "POST", headers: { "content-type": "application/json" }, body: requestBody, signal: controller.signal }).then(async response => {
      const data = await response.json();
      if (controller.signal.aborted) return;
      if (response.ok && data.quote?.currency === currency && Number.isSafeInteger(data.quote.subtotalMinor)) setQuoteState({ key: requestBody, quote: data.quote });
      else setQuoteState({ key: requestBody, error: typeof data.message === "string" ? data.message : t.checkoutFailed });
    }).catch(() => { if (!controller.signal.aborted) setQuoteState({ key: requestBody, error: t.checkoutUnavailable }); });
    return () => controller.abort();
  }, [currency, hydrated, lines.length, requestBody, t.checkoutFailed, t.checkoutUnavailable]);
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
        body: requestBody,
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
      <label className="checkout-currency"><span>{t.checkoutCurrency}</span><RoundedSelect value={currency} onValueChange={value => { setCurrency(parseCurrency(value)); setStatus(""); }}><option value="LKR">LKR — {t.storeLkrName}</option><option value="USD">USD — {t.storeUsdName}</option></RoundedSelect></label>
      {checking && <p role="status">{t.checkoutQuoteLoading}</p>}
      {quoteError && <p role="alert" className="form-status">{localizeServerMessage(quoteError, lang)}</p>}
      {quote && <div className="checkout-quote"><span>{t.checkoutQuoteTotal}</span><strong>{formatMoney(quote.subtotalMinor, quote.currency)}</strong></div>}
      <p className="checkout-quote-note">{t.checkoutQuoteNote}</p>
      <button className="button button-primary full" disabled={!lines.length || !quote || submitting} type="submit">
        {submitting ? t.checkoutStarting : t.checkoutContinue}
      </button>
      <p className="form-status" aria-live="polite">{status}</p>
    </form>
  );
}
