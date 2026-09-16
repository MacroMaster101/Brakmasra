"use client";

import { ContactForm } from "@/components/contact-form";
import { useLanguage } from "@/components/language-provider";

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
          <p className="muted">{t.contactSafetyNote}</p>
        </div>
        <ContactForm />
      </div>
    </div>
  );
}
