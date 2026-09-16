"use client";

import { useState, type FormEvent } from "react";

export function NewsletterForm() {
  const [status, setStatus] = useState("");
  const [pending, setPending] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    const form = event.currentTarget;
    setPending(true); setStatus("Sending...");
    try {
      const data = new FormData(form);
      const response = await fetch("/api/newsletter", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(Object.fromEntries(data)) });
      const result = await response.json(); setStatus(result.message);
      if (response.ok) form.reset();
    } catch {
      setStatus("Unable to send right now. Please try again.");
    } finally {
      setPending(false);
    }
  }
  return (
    <form className="newsletter-form" onSubmit={submit}>
      <label>Email address<input type="email" name="email" required maxLength={254} autoComplete="email" placeholder="you@example.com" /></label>
      <input className="honeypot" name="company" tabIndex={-1} autoComplete="off" aria-hidden="true" />
      <label className="consent"><input type="checkbox" name="consent" value="true" required /> I agree to receive BRAKMASRA updates and can unsubscribe anytime.</label>
      <button className="button button-primary" type="submit" disabled={pending}>{pending ? "Sending..." : "Get drop alerts"}</button>
      <p className="form-status" aria-live="polite">{status}</p>
    </form>
  );
}
