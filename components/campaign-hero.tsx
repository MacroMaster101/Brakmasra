"use client";

import Image from "@/components/store-image";
import Link from "next/link";
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Pause,
  Play,
} from "lucide-react";
import { useReducedMotion } from "motion/react";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useLanguage } from "@/components/language-provider";

const SLIDE_INTERVAL = 5000;

function subscribeVisibility(callback: () => void) {
  document.addEventListener("visibilitychange", callback);
  return () => document.removeEventListener("visibilitychange", callback);
}

type Slide = {
  image: string;
  title: string;
  description: string;
  alt: string;
  href: string;
};

function CampaignSlide({
  slide,
  index,
  active,
}: {
  slide: Slide;
  index: number;
  active: boolean;
}) {
  const { t } = useLanguage();
  return (
    <div
      className="campaign-stage"
      data-slide={index}
      aria-hidden={!active}
      inert={!active}
    >
      <div className="campaign-photograph">
        <Image
          src={slide.image}
          alt={slide.alt}
          fill
          priority={index === 0}
          fetchPriority={index === 0 ? "high" : "auto"}
          sizes="(max-width: 991px) 180vh, 100vw"
          quality={95}
        />
      </div>
      <div className="campaign-overlay" />
      <div className="campaign-inner">
        <div className="campaign-copy">
          <h1>{slide.title}</h1>
          <p>{slide.description}</p>
          <Link
            className="button button-primary campaign-cta"
            href={slide.href}
            tabIndex={active ? 0 : -1}
          >
            {t.homeExploreBtn}
            <ArrowRight aria-hidden="true" />
          </Link>
        </div>
      </div>
    </div>
  );
}

export function CampaignHero() {
  const { t } = useLanguage();
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [keyboardPaused, setKeyboardPaused] = useState(false);
  const [inView, setInView] = useState(true);
  const hero = useRef<HTMLElement>(null);
  const reducedMotion = useReducedMotion();
  const pageVisible = useSyncExternalStore(
    subscribeVisibility,
    () => document.visibilityState === "visible",
    () => true,
  );
  const autoplay =
    !paused && !keyboardPaused && !reducedMotion && inView && pageVisible;
  const slides: Slide[] = [
    {
      image: "/images/campaign/wide-cutout.webp",
      title: t.storeCampaignTitle,
      description: t.storeCampaignDesc,
      alt: t.storeCampaignAlt,
      href: "/shop",
    },
    {
      image: "/images/campaign/black-cutout.webp",
      title: t.storeSecondTitle,
      description: t.storeSecondDesc,
      alt: t.productPhotoAlt("Intoxicated Medusa Tee"),
      href: "/shop?color=black",
    },
    {
      image: "/images/campaign/white-cutout.webp",
      title: t.storeWhiteDesc,
      description: t.storeEditorialDesc,
      alt: t.productPhotoAlt("Vigorous Archangel Tee"),
      href: "/shop?color=white",
    },
  ];
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { threshold: 0.15 },
    );
    if (hero.current) observer.observe(hero.current);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    if (!autoplay) return;
    const timeout = window.setTimeout(
      () => setIndex((current) => (current + 1) % slides.length),
      SLIDE_INTERVAL,
    );
    return () => window.clearTimeout(timeout);
  }, [autoplay, index, slides.length]);
  const move = (direction: number) =>
    setIndex(
      (current) => (current + direction + slides.length) % slides.length,
    );
  return (
    <section
      ref={hero}
      className="campaign-hero"
      aria-label={t.storeCollection}
      aria-roledescription="carousel"
      data-active-slide={index}
      data-autoplay={autoplay}
      onFocusCapture={(event) => {
        if ((event.target as HTMLElement).matches(":focus-visible"))
          setKeyboardPaused(true);
      }}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget))
          setKeyboardPaused(false);
      }}
    >
      <Image
        className="campaign-preload"
        src={slides[(index + 1) % slides.length].image}
        alt=""
        aria-hidden="true"
        fill
        sizes="(max-width: 991px) 180vh, 100vw"
        quality={95}
        loading="eager"
        style={{ opacity: 0, pointerEvents: "none" }}
      />
      {slides.map((slide, item) => (
        <CampaignSlide
          key={slide.image}
          slide={slide}
          index={item}
          active={index === item}
        />
      ))}
      <button
        className="campaign-side-arrow campaign-prev"
        type="button"
        aria-label={t.storePrevSlide}
        onClick={() => move(-1)}
      >
        <ChevronLeft />
      </button>
      <button
        className="campaign-side-arrow campaign-next"
        type="button"
        aria-label={t.storeNextSlide}
        onClick={() => move(1)}
      >
        <ChevronRight />
      </button>
      <div className="campaign-controls">
        <div className="campaign-pagination">
          {slides.map((slide, item) => (
            <button
              key={slide.image}
              type="button"
              aria-label={`${t.storeCollection} ${item + 1}`}
              aria-pressed={index === item}
              onClick={() => setIndex(item)}
            />
          ))}
        </div>
      </div>
      <button
        className="campaign-play icon-button"
        type="button"
        aria-label={paused ? t.storePlaySlides : t.storePauseSlides}
        onClick={() => {
          setPaused(!paused);
          setKeyboardPaused(false);
        }}
      >
        {paused ? <Play /> : <Pause />}
      </button>
    </section>
  );
}
