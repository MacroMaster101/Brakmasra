"use client";

import { Mail } from "lucide-react";
import { ContactForm } from "@/components/contact-form";
import { useLanguage } from "@/components/language-provider";
import { site } from "@/data/site";

export function ContactView() {
  const { t } = useLanguage();

  return (
    <div className="page-shell page-top">
      <header className="page-hero">
        <span className="eyebrow">{t.contactEyebrow}</span>
        <h1>{t.contactTitle}</h1>
        <p>{t.contactDesc}</p>
      </header>
      <div className="contact-layout">
        <div className="contact-intro">
          <h2>{t.contactHelpTitle}</h2>
          <p>{t.contactHelpDesc}</p>
          <div className="support-options">
            <article>
              <h3>{t.contactOptOrdersTitle}</h3>
              <p>{t.contactOptOrdersDesc}</p>
            </article>
            <article>
              <h3>{t.contactOptBizTitle}</h3>
              <p>{t.contactOptBizDesc}</p>
            </article>
          </div>
          <a className="contact-email" href={`mailto:${site.supportEmail}`}>
            <Mail aria-hidden="true" />
            <span>
              <strong>{t.contactEmailTitle}</strong>
              <small>{t.contactEmailDesc}</small>
              <span>{site.supportEmail}</span>
            </span>
          </a>
          <p className="muted">{t.contactSafetyNote}</p>
        </div>
        <ContactForm />
      </div>
    </div>
  );
}
