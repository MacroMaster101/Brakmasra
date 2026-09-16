"use client";

import { useState, type FormEvent } from "react";
import { contactTopics } from "@/lib/contact-topics";

export function ContactForm() {
  const [status, setStatus] = useState("");
  const [pending, setPending] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    const form = event.currentTarget;
    setPending(true); setStatus("Sending...");
    try {
      const data = new FormData(form);
      const response = await fetch("/api/contact", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(Object.fromEntries(data)) });
      const result = await response.json(); setStatus(result.message);
      if (response.ok) form.reset();
    } catch {
      setStatus("Unable to send right now. Please try again.");
    } finally {
      setPending(false);
    }
  }
  return (
    <form className="contact-form panel" onSubmit={submit}>
      <div className="form-row"><label>Name<input name="name" required minLength={2} maxLength={80} autoComplete="name" /></label><label>Email<input name="email" type="email" required maxLength={254} autoComplete="email" /></label></div>
      <label>Topic<select name="topic" required defaultValue=""><option value="" disabled>Select an inquiry</option>{contactTopics.map((topic) => <option key={topic}>{topic}</option>)}</select></label>
      <label>Message<textarea name="message" required minLength={10} maxLength={2000} rows={7} /></label>
      <input className="honeypot" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" />
      <label className="consent"><input type="checkbox" name="consent" value="true" required /> I consent to BRAKMASRA using this information to reply to my inquiry.</label>
      <button className="button button-primary" type="submit" disabled={pending}>{pending ? "Sending..." : "Send message"}</button>
      <p className="form-status" aria-live="polite">{status}</p>
    </form>
  );
}
