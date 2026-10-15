"use client";

import { ChevronLeft, ChevronRight, Star } from "lucide-react";
import { useState } from "react";
import { useLanguage } from "@/components/language-provider";

/** Explicitly labelled design samples, never presented as verified buyers. */
export function Testimonials() {
  const { t } = useLanguage();
  const [index, setIndex] = useState(0);
  const reviews = [
    {
      name: "Nethmi P.",
      title: t.storeReviewStyleTitle,
      text: t.storeReviewStyleText,
    },
    {
      name: "Dinuka R.",
      title: t.storeReviewFitTitle,
      text: t.storeReviewFitText,
    },
    {
      name: "Hiruni S.",
      title: t.storeReviewArtTitle,
      text: t.storeReviewArtText,
    },
    {
      name: "Sachini M.",
      title: t.storeReviewWhiteTitle,
      text: t.storeReviewWhiteText,
    },
    {
      name: "Kasun D.",
      title: t.storeReviewStoryTitle,
      text: t.storeReviewStoryText,
    },
  ];
  return (
    <section className="testimonials-section" aria-label={t.storeTestimonials}>
      <div className="page-shell">
        <div className="store-section-heading">
          <h2>{t.storeTestimonials}</h2>
          <p className="sample-review-notice">{t.storeSampleNotice}</p>
        </div>
        <div className="review-grid" aria-live="polite">
          {[0, 1, 2].map((offset) => {
            const review = reviews[(index + offset) % reviews.length];
            return (
              <article className="review-card" key={review.name}>
                <div className="review-stars" aria-hidden="true">
                  {[0, 1, 2, 3, 4].map((star) => (
                    <Star key={star} />
                  ))}
                </div>
                <h3>{review.title}</h3>
                <blockquote>{review.text}</blockquote>
                <div className="review-author">
                  <strong>{review.name}</strong>
                  <span>{t.storeSampleReview}</span>
                </div>
              </article>
            );
          })}
        </div>
        <div className="review-controls">
          <button
            type="button"
            className="icon-button"
            aria-label={t.storePrevSlide}
            onClick={() =>
              setIndex((index + reviews.length - 1) % reviews.length)
            }
          >
            <ChevronLeft />
          </button>
          <div className="campaign-pagination">
            {reviews.map((review, item) => (
              <button
                key={review.name}
                type="button"
                aria-label={`${t.storeReviewSlide} ${item + 1}`}
                aria-pressed={index === item}
                onClick={() => setIndex(item)}
              />
            ))}
          </div>
          <button
            type="button"
            className="icon-button"
            aria-label={t.storeNextSlide}
            onClick={() => setIndex((index + 1) % reviews.length)}
          >
            <ChevronRight />
          </button>
        </div>
      </div>
    </section>
  );
}
