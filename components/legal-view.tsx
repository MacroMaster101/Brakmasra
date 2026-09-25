"use client";

import Link from "next/link";
import { Fragment } from "react";

import { useLanguage } from "@/components/language-provider";
import { LEGAL_UPDATED, legalDocuments, type LegalBlock, type LegalDocumentId } from "@/data/legal";
import { formatDate } from "@/lib/i18n";

const INLINE_LINK = /\[([^\]]+)\]\(((?:\/|mailto:)[^)\s]*)\)/g;

/** Renders text with [label](/path) links to site pages and [label](mailto:…) links. */
function RichText({ text }: { text: string }) {
  const parts: React.ReactNode[] = [];
  let cursor = 0;
  for (const match of text.matchAll(INLINE_LINK)) {
    const [whole, label, href] = match;
    parts.push(text.slice(cursor, match.index));
    parts.push(href.startsWith("mailto:")
      ? <a key={match.index} href={href}>{label}</a>
      : <Link key={match.index} href={href}>{label}</Link>);
    cursor = match.index + whole.length;
  }
  parts.push(text.slice(cursor));
  return parts.map((part, index) => <Fragment key={index}>{part}</Fragment>);
}

function Block({ block }: { block: LegalBlock }) {
  if (block.type === "list") {
    return (
      <ul>
        {block.items.map((item) => <li key={item}><RichText text={item} /></li>)}
      </ul>
    );
  }
  return <p><RichText text={block.text} /></p>;
}

export function LegalView({ document: documentId }: { document: LegalDocumentId }) {
  const { t, lang } = useLanguage();
  const doc = legalDocuments[documentId][lang];
  const updated = formatDate(LEGAL_UPDATED, lang);

  return (
    <div className="page-shell page-top legal-page">
      <header className="page-hero">
        <span className="eyebrow">{t.legalLastUpdated(updated)}</span>
        <h1>{doc.title}</h1>
        <p>{doc.lead}</p>
      </header>

      <div className="legal-layout">
        <nav className="legal-toc" aria-label={t.legalContents}>
          <span>{t.legalContents}</span>
          <ol>
            {doc.sections.map((section) => (
              <li key={section.id}><a href={`#${section.id}`}>{section.title}</a></li>
            ))}
          </ol>
        </nav>

        <div className="legal-sections">
          {doc.sections.map((section, index) => (
            <section key={section.id} id={section.id} className="legal-section" aria-labelledby={`${section.id}-title`}>
              <header>
                <span aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
                <h2 id={`${section.id}-title`}>{section.title}</h2>
              </header>
              {section.blocks.map((block, blockIndex) => <Block key={blockIndex} block={block} />)}
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
