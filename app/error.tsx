"use client";

import { useLanguage } from "@/components/language-provider";

export default function ErrorPage({ reset }: { reset: () => void }) {
  const { t } = useLanguage();

  return (
    <div className="not-found">
      <span className="eyebrow">{t.errorEyebrow}</span>
      <h1>{t.errorTitle}</h1>
      <p>{t.errorDesc}</p>
      <button className="button button-primary" type="button" onClick={reset}>{t.errorRetry}</button>
    </div>
  );
}
