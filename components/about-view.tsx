"use client";

import Image, { getImageProps } from "@/components/store-image";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, ChevronDown, CirclePlay, Compass, Fingerprint, Shirt } from "lucide-react";
import { usePageCopy, useContentImage } from "@/components/content-provider";
import { Reveal } from "@/components/reveal";
import { useLanguage } from "@/components/language-provider";
import { aboutCopy } from "@/data/about";

const gallery = [
  { slug: "caged-freedom-tee", name: "Caged Freedom Tee", image: "caged-freedom" },
  { slug: "paradise-lost-tee", name: "Paradise Lost Tee", image: "paradise-lost" },
  { slug: "intoxicated-medusa-tee", name: "Intoxicated Medusa Tee", image: "intoxicated-medusa" },
];
const principleIcons = [Fingerprint, Shirt, Compass];

export function AboutView({ channelUrl }: { channelUrl: string }) {
  const { t, lang } = useLanguage();
  const copy = usePageCopy("about", lang, aboutCopy[lang]);
  const desktopSrc = useContentImage("/images/campaign/wide-cutout.webp");
  const mobileSrc = desktopSrc;
  const { props: desktopImage } = getImageProps({
    src: desktopSrc, alt: copy.heroAlt,
    fill: true, sizes: "100vw", quality: 95,
  });
  const { props: mobileImage } = getImageProps({
    src: mobileSrc, alt: copy.heroAlt,
    fill: true, sizes: "100vw", quality: 95,
  });
  const channelTopics = [
    { tag: t.aboutPillar1Tag, title: t.aboutPillar1Title, description: t.aboutPillar1Desc },
    { tag: t.aboutPillar2Tag, title: t.aboutPillar2Title, description: t.aboutPillar2Desc },
    { tag: t.aboutPillar3Tag, title: t.aboutPillar3Title, description: t.aboutPillar3Desc },
  ];

  return (
    <div className="about-editorial">
      <section className="about-campaign" aria-labelledby="about-title">
        <picture className="about-campaign-picture">
          <source media="(min-width: 768px)" srcSet={desktopImage.srcSet ?? desktopImage.src} sizes={desktopImage.sizes} />
          <img {...mobileImage} loading="eager" fetchPriority="high" alt={copy.heroAlt} />
        </picture>
        <div className="about-campaign-shade" />
        <div className="page-shell about-campaign-inner">
          <div className="about-campaign-copy">
            <h1 id="about-title">{copy.heroTitle}</h1>
            <p>{copy.heroDescription}</p>
            <Link href="/shop" className="button button-primary">
              {t.aboutBrowseShopBtn} <ArrowRight aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>

      <section className="page-shell about-origin" aria-labelledby="about-story-title">
        <Reveal>
          <p className="about-wordmark" aria-hidden="true">BRAKMASRA</p>
          <div className="about-introduction">
            <h2 id="about-story-title">{copy.storyTitle}</h2>
            <p>{copy.storyDescription}</p>
            <details className="about-origin-details">
              <summary>{copy.originDetails}<ChevronDown aria-hidden="true" /></summary>
              <div className="about-origin-content">
                <p>{t.aboutStoryP1}</p><p>{t.aboutStoryP2}</p><p>{t.aboutStoryP3}</p>
                <dl>
                  <div><dt>{t.aboutPillTerrainTitle}</dt><dd>{t.aboutPillTerrainDesc}</dd></div>
                  <div><dt>{t.aboutPillProtocolTitle}</dt><dd>{t.aboutPillProtocolDesc}</dd></div>
                  <div><dt>{t.aboutPillStandardTitle}</dt><dd>{t.aboutPillStandardDesc}</dd></div>
                </dl>
              </div>
            </details>
          </div>
        </Reveal>
      </section>

      <section className="page-shell about-photo-story" aria-labelledby="about-artwork-title">
        <Reveal className="about-portrait">
          <Image src="/images/about/paradise-courtyard.webp" alt={copy.portraitAlt} width={1086} height={1448}
            sizes="(max-width: 767px) calc(100vw - 32px), 46vw" quality={95} />
        </Reveal>
        <div className="about-photo-story-side">
          <Reveal className="about-editorial-copy">
            <h2 id="about-artwork-title">{copy.editorialTitle}</h2>
            <p>{copy.editorialDescription}</p>
            <Link className="text-link" href="/shop/paradise-lost-tee">Paradise Lost Tee <ArrowUpRight aria-hidden="true" /></Link>
          </Reveal>
          <Reveal delay={1} className="about-detail-photo">
            <Image src="/images/about/graphic-still-life.webp" alt={copy.detailAlt} width={1448} height={1086}
              sizes="(max-width: 767px) calc(100vw - 32px), 46vw" quality={95} />
          </Reveal>
        </div>
      </section>

      <section className="page-shell about-principles" aria-labelledby="about-principles-title">
        <Reveal><h2 id="about-principles-title">{copy.principlesTitle}</h2></Reveal>
        <div className="about-principle-grid">
          {copy.principles.map((principle, index) => {
            const Icon = principleIcons[index];
            return <Reveal key={principle.title} className="about-principle">
              <Icon aria-hidden="true" strokeWidth={1.5} />
              <h3>{principle.title}</h3><p>{principle.description}</p>
            </Reveal>;
          })}
        </div>
      </section>

      <section className="about-broadcast" aria-labelledby="about-channel-title">
        <div className="page-shell about-broadcast-grid">
          <Reveal className="about-broadcast-intro">
            <a className="about-channel-identity" href={channelUrl} target="_blank" rel="noopener noreferrer">
              <span className="about-channel-avatar"><Image src="/images/logo.png" alt="" width={64} height={64} /></span>
              <span><span className="about-channel-label">{t.aboutChannelHeading}</span><strong>@Brakmasra</strong></span>
              <ArrowUpRight aria-hidden="true" />
            </a>
            <h2 id="about-channel-title">{copy.channelTitle}</h2>
            <p>{t.aboutChannelQuote}</p>
            <a href={channelUrl} target="_blank" rel="noopener noreferrer" className="button button-primary about-channel-cta">
              <CirclePlay aria-hidden="true" /> {t.aboutWatchChannelBtn} <ArrowUpRight aria-hidden="true" />
            </a>
            <p className="about-channel-location">{t.aboutChannelFooter}</p>
          </Reveal>
          <Reveal delay={1} className="about-channel-topics">
            {channelTopics.map((topic) => <article key={topic.title}>
              <p className="about-topic-tag">{topic.tag}</p>
              <h3>{topic.title}</h3>
              <p>{topic.description}</p>
            </article>)}
          </Reveal>
        </div>
      </section>

      <section className="page-shell about-edit" aria-labelledby="about-edit-title">
        <Reveal className="about-edit-heading">
          <h2 id="about-edit-title">{copy.galleryTitle}</h2><p>{copy.galleryDescription}</p>
        </Reveal>
        <div className="about-edit-grid">
          {gallery.map((piece) => <Reveal key={piece.slug}>
            <Link href={`/shop/${piece.slug}`} className="about-edit-link">
              <div className="about-edit-photo">
                <Image src={`/images/models/${piece.image}.webp`} alt={piece.name} width={900} height={1200}
                  sizes="(max-width: 767px) 76vw, 30vw" quality={90} />
              </div>
              <div className="about-edit-caption"><h3>{piece.name}</h3><ArrowUpRight aria-hidden="true" /></div>
              <span className="sr-only">{copy.viewPiece}</span>
            </Link>
          </Reveal>)}
        </div>
        <Reveal className="about-closing"><p>{t.aboutBeliefQuote}</p></Reveal>
      </section>
    </div>
  );
}
