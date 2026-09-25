"use client";

import { useState, type FormEvent } from "react";
import { useLanguage } from "@/components/language-provider";
import { readResponseMessage } from "@/lib/client-response";
import { localizeServerMessage } from "@/lib/i18n";

export function NewsletterForm() {
  const { t, lang } = useLanguage();
  const [status, setStatus] = useState("");
  const [pending, setPending] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    const form = event.currentTarget;
    setPending(true);
    setStatus(t.contactBtnSending);
    try {
      const data = new FormData(form);
      const response = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(Object.fromEntries(data)),
      });
      setStatus(localizeServerMessage(await readResponseMessage(response, t.newsletterFailed), lang));
      if (response.ok) form.reset();
    } catch {
      setStatus(t.contactSendError);
    } finally {
      setPending(false);
    }
  }

  return (
    <form className="newsletter-form" onSubmit={submit}>
      <label>
        {t.contactFieldEmail}
        <input
          type="email"
          name="email"
          required
          maxLength={254}
          autoComplete="email"
          placeholder={t.homeNewsletterPlaceholder}
        />
      </label>
      <input className="honeypot" name="company" tabIndex={-1} autoComplete="off" aria-hidden="true" />
      <label className="consent">
        <input type="checkbox" name="consent" value="true" required />{" "}
        <span>{t.newsletterConsent}</span>
      </label>
      <button className="button button-primary" type="submit" disabled={pending}>
        {pending ? t.contactBtnSending : t.homeNewsletterBtn}
      </button>
      <p className="form-status" aria-live="polite">
        {status}
      </p>
    </form>
  );
}
