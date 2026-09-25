"use client";

import { useState, type FormEvent } from "react";
import { contactTopics, type ContactTopic } from "@/lib/contact-topics";
import { useLanguage } from "@/components/language-provider";
import { readResponseMessage } from "@/lib/client-response";
import { localizeServerMessage, type TextKey } from "@/lib/i18n";

// The submitted value stays the English topic the API validates; only the
// visible label follows the page language.
const topicLabels: Record<ContactTopic, TextKey> = {
  "General inquiry": "contactTopicGeneral",
  "Order support": "contactTopicOrders",
  "Business inquiry": "contactTopicBiz",
};

export function ContactForm() {
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
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(Object.fromEntries(data)),
      });
      const fallback = response.ok ? t.contactSuccessTitle : t.contactSendError;
      setStatus(localizeServerMessage(await readResponseMessage(response, fallback), lang));
      if (response.ok) form.reset();
    } catch {
      setStatus(t.contactSendError);
    } finally {
      setPending(false);
    }
  }

  return (
    <form className="contact-form panel" onSubmit={submit}>
      <div className="form-row">
        <label>
          {t.contactFieldName}
          <input name="name" required minLength={2} maxLength={80} autoComplete="name" />
        </label>
        <label>
          {t.contactFieldEmail}
          <input name="email" type="email" required maxLength={254} autoComplete="email" />
        </label>
      </div>
      <label>
        {t.contactFieldTopic}
        <select name="topic" required defaultValue="">
          <option value="" disabled>
            {t.contactTopicPlaceholder}
          </option>
          {contactTopics.map((topic) => (
            <option key={topic} value={topic}>
              {t[topicLabels[topic]]}
            </option>
          ))}
        </select>
      </label>
      <label>
        {t.contactFieldMessage}
        <textarea name="message" required minLength={10} maxLength={2000} rows={7} />
      </label>
      <input className="honeypot" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" />
      <label className="consent">
        <input type="checkbox" name="consent" value="true" required />{" "}
        <span>{t.contactConsent}</span>
      </label>
      <button className="button button-primary" type="submit" disabled={pending}>
        {pending ? t.contactBtnSending : t.contactBtnSend}
      </button>
      <p className="form-status" aria-live="polite">
        {status}
      </p>
    </form>
  );
}
