"use client";

import { useState, type FormEvent } from "react";
import { useLanguage } from "@/components/language-provider";
import { readResponseMessage } from "@/lib/client-response";

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
      const message = await readResponseMessage(response, "Signup could not be completed. Please try again.");
      setStatus(
        lang === "si" && response.ok
          ? "ඔබ සාර්ථකව ලියාපදිංචි විය. ස්තූතියි!"
          : message,
      );
      if (response.ok) form.reset();
    } catch {
      setStatus(
        lang === "si"
          ? "දැනට ලියාපදිංචි විය නොහැක. කරුණාකර නැවත උත්සාහ කරන්න."
          : "Unable to send right now. Please try again.",
      );
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
        {lang === "si"
          ? "BRAKMASRA වෙතින් පණිවිඩ ලබා ගැනීමට එකඟ වන අතර ඕනෑම වේලාවක ඉවත් විය හැක."
          : "I agree to receive BRAKMASRA updates and can unsubscribe anytime."}
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
