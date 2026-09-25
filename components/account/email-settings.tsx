"use client";

import { useEffect, useRef } from "react";

import { changeEmailAction } from "@/app/account/actions";
import { FormStatus } from "@/components/account/form-status";
import { useAccountForm } from "@/components/account/use-account-form";
import { useLanguage } from "@/components/language-provider";

export function EmailSettings({ email }: { email: string }) {
  const { t } = useLanguage();
  const { state, formAction, pending, onSubmit } = useAccountForm(changeEmailAction);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.status === "success") formRef.current?.reset();
  }, [state]);

  return (
    <section className="panel account-panel" aria-labelledby="account-email-title">
      <header className="account-panel-heading">
        <h2 id="account-email-title">{t.accountEmailTitle}</h2>
        <p>{t.accountEmailDesc}</p>
      </header>

      <form ref={formRef} className="account-form" action={formAction} onSubmit={onSubmit}>
        <div className="auth-field account-readonly">
          <span>{t.accountCurrentEmail}</span>
          <div className="account-readonly-value"><strong>{email}</strong></div>
        </div>
        <label className="auth-field">
          <span>{t.accountNewEmail}</span>
          <input
            name="email"
            type="email"
            required
            maxLength={254}
            autoComplete="email"
            inputMode="email"
            placeholder={t.authEmailPlaceholder}
          />
        </label>
        <div className="account-form-actions">
          <button className="button button-primary" type="submit" disabled={pending}>
            {pending ? t.accountEmailPending : t.accountEmailIdle}
          </button>
          <FormStatus state={state} />
        </div>
      </form>
    </section>
  );
}
