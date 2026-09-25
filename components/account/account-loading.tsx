"use client";

import { useLanguage } from "@/components/language-provider";

/** Content-only skeleton; the account layout keeps its header and tabs on screen. */
export function AccountContentLoading() {
  const { t } = useLanguage();

  return (
    <div className="panel account-panel account-loading" role="status" aria-busy="true" aria-live="polite">
      <span className="sr-only">{t.loadingAccount}</span>
      <div aria-hidden="true">
        <span className="loading-block loading-line is-medium" />
        <span className="loading-block loading-line is-long" />
        <div className="loading-block loading-form-control" />
        <div className="loading-block loading-form-control" />
        <div className="loading-block loading-button" />
      </div>
    </div>
  );
}
