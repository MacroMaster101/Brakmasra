"use client";

import { useState, type FormEvent } from "react";

export function NewsletterForm() {
  const [status, setStatus] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setStatus("Sending…");
    const data = new FormData(event.currentTarget);
    const response = await fetch("/api/newsletter", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(Object.fromEntries(data)) });
    const result = await response.json(); setStatus(result.message);
    if (response.ok) event.currentTarget.reset();
  }
  return (
    <form className="newsletter-form" onSubmit={submit}>
      <input type="email" name="email" required maxLength={254} autoComplete="email" placeholder="Your email address" aria-label="Email address" />
      <input className="honeypot" name="company" tabIndex={-1} autoComplete="off" aria-hidden="true" />
      <label className="consent"><input type="checkbox" name="consent" value="true" required /> I agree to receive BRAKMASRA updates and can unsubscribe anytime.</label>
      <button className="button button-primary" type="submit">Join the darkness</button>
      <p className="form-status" aria-live="polite">{status}</p>
    </form>
  );
}
