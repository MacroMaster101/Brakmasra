"use client";

import { useContent, usePageCopy } from "@/components/content-provider";
import Image from "@/components/store-image";
import Link from "next/link";
import { ArrowLeft, ArrowRight, ArrowUpRight } from "lucide-react";
import { useState } from "react";
import { useLanguage } from "@/components/language-provider";
import { Reveal } from "@/components/reveal";
import { journalCopy, type JournalCategory, type JournalPost } from "@/data/journal";
import type { Language } from "@/lib/i18n";

function readingMinutes(post: JournalPost) {
  const words = [post.copy.en.lead, ...post.copy.en.sections.flatMap((section) => section.paragraphs)].join(" ").split(/\s+/).length;
  return Math.max(1, Math.ceil(words / 180));
}

function readingLabel(post: JournalPost, lang: Language) {
  const label = journalCopy[lang].minutes;
  return lang === "si" ? `${label} ${readingMinutes(post)}` : `${readingMinutes(post)} ${label}`;
}

function JournalCard({ post }: { post: JournalPost }) {
  const { lang } = useLanguage();
  const copy = usePageCopy("journal", lang, journalCopy[lang]);
  const article = post.copy[lang];
  return (
    <article className="journal-card">
      <Link className="journal-card-link" href={`/blog/${post.slug}`}>
        <div className="journal-card-photo">
          <Image src={post.image} alt={article.imageAlt} width={post.width} height={post.height}
            sizes="(max-width: 767px) calc(100vw - 32px), (max-width: 1023px) 45vw, 30vw" quality={90} />
        </div>
        <p className="journal-meta"><span>{copy[post.category]}</span><span>{readingLabel(post, lang)}</span></p>
        <h3>{article.title}</h3>
        <p className="journal-card-excerpt">{article.excerpt}</p>
        <span className="journal-read">{copy.read}<ArrowUpRight aria-hidden="true" /></span>
      </Link>
    </article>
  );
}

export function JournalView() {
  const { lang } = useLanguage();
  const copy = usePageCopy("journal", lang, journalCopy[lang]);
  const [category, setCategory] = useState<JournalCategory | "all">("all");
  const { posts: journalPosts } = useContent();
  const featured = journalPosts[0];
  const featureCopy = featured?.copy[lang];
  const stories = category === "all" ? journalPosts.slice(1) : journalPosts.filter((post) => post.category === category);
  return (
    <div className="page-shell journal-page">
      <header className="editorial-page-heading"><h1>{copy.title}</h1><p>{copy.description}</p></header>
      <div className="journal-filters" role="group" aria-label={copy.filterLabel}>
        {(["all", "style", "artwork", "care"] as const).map((value) => (
          <button key={value} type="button" aria-pressed={category === value}
            onClick={() => setCategory(value)} aria-controls="journal-stories">{copy[value]}</button>
        ))}
      </div>
      <div id="journal-stories">
        {category === "all" && featured && featureCopy && (
          <article className="journal-feature">
            <Link className="journal-feature-photo" href={`/blog/${featured.slug}`} aria-label={featureCopy.title}>
              <Image src={featured.image} alt={featureCopy.imageAlt} width={featured.width} height={featured.height}
                sizes="(max-width: 767px) calc(100vw - 32px), 58vw" quality={90} loading="eager" />
            </Link>
            <div className="journal-feature-copy">
              <p className="journal-meta"><span>{copy[featured.category]}</span><span>{readingLabel(featured, lang)}</span></p>
              <h2><Link href={`/blog/${featured.slug}`}>{featureCopy.title}</Link></h2>
              <p>{featureCopy.excerpt}</p>
              <Link href={`/blog/${featured.slug}`} className="button button-primary">{copy.read}<ArrowRight aria-hidden="true" /></Link>
            </div>
          </article>
        )}
        <section className="journal-stories-section" aria-labelledby="journal-stories-heading">
          <h2 id="journal-stories-heading" aria-live="polite">{category === "all" ? copy.latest : copy[category]}</h2>
          {stories.length ? <div className="journal-card-grid">{stories.map((post) => <JournalCard key={post.slug} post={post} />)}</div> : <p className="journal-empty">{copy.empty}</p>}
        </section>
      </div>
      <Reveal className="journal-shop-note">
        <h2>{copy.collection}</h2><p>{copy.collectionDescription}</p>
        <Link href="/shop" className="text-link">{copy.shop}<ArrowRight aria-hidden="true" /></Link>
      </Reveal>
    </div>
  );
}

export function JournalArticle({ post }: { post: JournalPost }) {
  const { lang } = useLanguage();
  const copy = usePageCopy("journal", lang, journalCopy[lang]);
  const article = post.copy[lang];
  const { posts: journalPosts } = useContent();
  const related = journalPosts.filter((item) => item.slug !== post.slug).slice(0, 2);
  return (
    <div className="page-shell journal-article-page">
      <Link href="/blog" className="journal-back"><ArrowLeft aria-hidden="true" />{copy.back}</Link>
      <article>
        <header className="journal-article-heading">
          <p className="journal-meta"><span>{copy[post.category]}</span><span>{readingLabel(post, lang)}</span></p>
          <h1>{article.title}</h1>
          <p className="journal-article-lead">{article.lead}</p>
          <p className="journal-byline">{copy.byline}</p>
        </header>
        <div className={`journal-article-photo${post.height > post.width ? " is-portrait" : ""}`}>
          <Image src={post.image} alt={article.imageAlt} width={post.width} height={post.height}
            sizes="(max-width: 767px) calc(100vw - 32px), min(92vw, 1440px)" quality={90} loading="eager" />
        </div>
        <div className="journal-reading-layout">
          <nav className="journal-contents" aria-label={copy.contents}>
            <h2>{copy.contents}</h2>
            {article.sections.map((section, index) => <a key={section.heading} href={`#section-${index + 1}`}>{section.heading}</a>)}
          </nav>
          <div className="journal-article-body">
            {article.sections.map((section, index) => <section key={section.heading} aria-labelledby={`section-${index + 1}`}>
              <h2 id={`section-${index + 1}`}>{section.heading}</h2>
              {section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
            </section>)}
            {post.productSlug && <Link href={`/shop/${post.productSlug}`} className="text-link">{copy.piece}<ArrowUpRight aria-hidden="true" /></Link>}
          </div>
        </div>
      </article>
      <section className="journal-related" aria-labelledby="journal-related-title">
        <h2 id="journal-related-title">{copy.related}</h2>
        <div className="journal-card-grid">{related.map((item) => <JournalCard key={item.slug} post={item} />)}</div>
      </section>
    </div>
  );
}
