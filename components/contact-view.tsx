"use client";

import Image from "@/components/store-image";
import { ArrowUpRight, Mail, Shirt, MessageCircle } from "lucide-react";
import { ContactForm } from "@/components/contact-form";
import { useLanguage } from "@/components/language-provider";
import { site } from "@/data/site";
import { contactCopy } from "@/data/contact";
import { usePageCopy } from "@/components/content-provider";
import { Reveal } from "@/components/reveal";

export function ContactView() {
  const { t, lang } = useLanguage();
  const copy = usePageCopy("contact", lang, contactCopy[lang]);

  return (
    <div className="page-shell contact-editorial">
      <header className="editorial-page-heading">
        <h1>{t.contactTitle}</h1>
        <p>{t.contactDesc}</p>
      </header>
      <div className="contact-editorial-grid">
        <section className="contact-message" aria-labelledby="contact-form-title">
          <h2 id="contact-form-title">{copy.formTitle}</h2>
          <p>{copy.formDescription}</p>
          <ContactForm />
          <p id="contact-safety" className="contact-safety">{t.contactSafetyNote}</p>
        </section>
        <aside className="contact-support">
          <h2>{t.contactHelpTitle}</h2>
          <p>{t.contactHelpDesc}</p>
          <a className="contact-direct" href={`mailto:${site.supportEmail}`}>
            <Mail aria-hidden="true" />
            <span><strong>{t.contactEmailTitle}</strong><span>{site.supportEmail}</span></span>
            <ArrowUpRight aria-hidden="true" />
          </a>
          <p className="contact-email-explanation">{t.contactEmailDesc}</p>
          <div className="contact-support-topics">
            <article>
              <Shirt aria-hidden="true" strokeWidth={1.5} />
              <div><h3>{t.contactOptOrdersTitle}</h3><p>{t.contactOptOrdersDesc}</p></div>
            </article>
            <article>
              <MessageCircle aria-hidden="true" strokeWidth={1.5} />
              <div><h3>{t.contactOptBizTitle}</h3><p>{t.contactOptBizDesc}</p></div>
            </article>
          </div>
          <Reveal className="contact-campaign-photo">
            <Image src="/images/about/graphic-still-life.webp" alt={copy.imageAlt} width={1448} height={1086}
              sizes="(max-width: 767px) calc(100vw - 32px), 40vw" quality={90} />
          </Reveal>
        </aside>
      </div>
    </div>
  );
}
