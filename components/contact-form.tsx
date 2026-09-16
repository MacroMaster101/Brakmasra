"use client";

import { useState, type FormEvent } from "react";
import { contactTopics } from "@/lib/contact-topics";
import { useLanguage } from "@/components/language-provider";
import { readResponseMessage } from "@/lib/client-response";

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
      const message = await readResponseMessage(response, t.contactSuccessTitle);
      setStatus(
        lang === "si" && response.ok
          ? t.contactSuccessDesc
          : message,
      );
      if (response.ok) form.reset();
    } catch {
      setStatus(
        lang === "si"
          ? "දැනට පණිවිඩය යැවීමට නොහැක. කරුණාකර සුළු මොහොතකින් නැවත උත්සාහ කරන්න."
          : "Unable to send right now. Please try again.",
      );
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
              {topic}
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
        {lang === "si"
          ? "මගේ විමසීමට පිළිතුරු දීමට මෙම තොරතුරු භාවිතා කිරීමට මම එකඟ වෙමි."
          : "I consent to BRAKMASRA using this information to reply to my inquiry."}
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
