"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, Compass, Radio, Sparkles } from "lucide-react";
import { Reveal } from "@/components/reveal";
import { useLanguage } from "@/components/language-provider";

export function AboutView({ channelUrl }: { channelUrl: string }) {
  const { t } = useLanguage();

  return (
    <div className="page-shell page-top about-page">
      {/* 01. Hero Header */}
      <header className="page-hero about-hero">
        <span className="eyebrow">{t.aboutEyebrow}</span>
        <h1>{t.aboutTitle}</h1>
        <p>{t.aboutDesc}</p>
        <div className="about-hero-actions">
          <Link href="/shop" className="button button-primary">
            {t.aboutBrowseShopBtn} <ArrowUpRight />
          </Link>
          <a
            href={channelUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="about-hero-btn-channel"
            title={t.aboutChannelLinkTitle}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
            </svg>
            <span>{t.aboutWatchChannelBtn}</span>
            <ArrowUpRight />
          </a>
        </div>
      </header>

      {/* 02. Cinematic Centerpiece Visual */}
      <Reveal className="about-visual">
        <Image
          src="/images/brakmasra-about-cinematic.jpg"
          alt={t.aboutVisualAlt}
          fill
          priority
          sizes="(max-width: 1420px) 100vw, 1420px"
        />
      </Reveal>

      {/* 03. Origin Story & Investigation Protocol */}
      <section className="about-story">
        <Reveal className="about-story-aside">
          <span className="eyebrow">{t.aboutExpeditionsEyebrow}</span>
          <h2>{t.aboutCuriosityTitle}</h2>
          <div className="about-story-pills">
            <div className="about-story-pill">
              <span>{t.aboutPillTerrainTitle}</span>
              <strong>{t.aboutPillTerrainDesc}</strong>
            </div>
            <div className="about-story-pill">
              <span>{t.aboutPillProtocolTitle}</span>
              <strong>{t.aboutPillProtocolDesc}</strong>
            </div>
            <div className="about-story-pill">
              <span>{t.aboutPillStandardTitle}</span>
              <strong>{t.aboutPillStandardDesc}</strong>
            </div>
          </div>
        </Reveal>

        <Reveal delay={1} className="about-story-copy">
          <p>{t.aboutStoryP1}</p>
          <p>{t.aboutStoryP2}</p>
          <p>{t.aboutStoryP3}</p>
          <Link className="text-link" href="/shop">
            {t.aboutBrowseLink} <ArrowUpRight />
          </Link>
        </Reveal>
      </section>

      {/* 04. Dedicated Official Channel Spotlight */}
      <Reveal className="about-channel-spotlight">
        <div className="about-channel-header">
          <div className="about-channel-brand">
            <div className="about-channel-icon-wrap" aria-hidden="true">
              <svg viewBox="0 0 24 24">
                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
              </svg>
            </div>
            <div className="about-channel-title">
              <span>{t.aboutChannelHeading}</span>
              <h3>@Brakmasra</h3>
            </div>
          </div>
          <a
            href={channelUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="about-channel-btn"
          >
            <span>{t.aboutWatchChannelBtn}</span>
            <ArrowUpRight />
          </a>
        </div>

        <p className="about-channel-quote">&ldquo;{t.aboutChannelQuote}&rdquo;</p>

        <div className="about-channel-grid">
          <article className="about-channel-pillar">
            <Radio aria-hidden="true" />
            <span>{t.aboutPillar1Tag}</span>
            <h4>{t.aboutPillar1Title}</h4>
            <p>{t.aboutPillar1Desc}</p>
          </article>

          <article className="about-channel-pillar">
            <Compass aria-hidden="true" />
            <span>{t.aboutPillar2Tag}</span>
            <h4>{t.aboutPillar2Title}</h4>
            <p>{t.aboutPillar2Desc}</p>
          </article>

          <article className="about-channel-pillar">
            <Sparkles aria-hidden="true" />
            <span>{t.aboutPillar3Tag}</span>
            <h4>{t.aboutPillar3Title}</h4>
            <p>{t.aboutPillar3Desc}</p>
          </article>
        </div>

        <div className="about-channel-footer">
          <p>
            {t.aboutChannelFooter}
          </p>
          <a
            href={channelUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-link"
          >
            {t.aboutVisitChannel}
            <ArrowRight />
          </a>
        </div>
      </Reveal>

      {/* 05. The Brand Belief */}
      <Reveal className="about-belief">
        <div className="about-belief-inner">
          <span className="eyebrow">{t.aboutBeliefEyebrow}</span>
          <p>{t.aboutBeliefQuote}</p>
          <span>{t.aboutBeliefTag}</span>
        </div>
      </Reveal>
    </div>
  );
}
