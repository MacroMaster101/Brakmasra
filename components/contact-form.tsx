"use client";

import { useState, type FormEvent } from "react";

export function ContactForm() {
  const [status, setStatus] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setStatus("Sending…");
    const data = new FormData(event.currentTarget);
    const response = await fetch("/api/contact", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(Object.fromEntries(data)) });
    const result = await response.json(); setStatus(result.message);
    if (response.ok) event.currentTarget.reset();
  }
  return (
    <form className="contact-form panel" onSubmit={submit}>
      <div className="form-row"><label>Name<input name="name" required minLength={2} maxLength={80} autoComplete="name" /></label><label>Email<input name="email" type="email" required maxLength={254} autoComplete="email" /></label></div>
      <label>Topic<select name="topic" required defaultValue=""><option value="" disabled>Select an inquiry</option><option>General inquiry</option><option>Business inquiry</option><option>Merch support</option><option>Sponsorship</option></select></label>
      <label>Message<textarea name="message" required minLength={10} maxLength={2000} rows={7} /></label>
      <input className="honeypot" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" />
      <label className="consent"><input type="checkbox" name="consent" value="true" required /> I consent to BRAKMASRA using this information to reply to my inquiry.</label>
      <button className="button button-primary" type="submit">Send message</button>
      <p className="form-status" aria-live="polite">{status}</p>
    </form>
  );
}
