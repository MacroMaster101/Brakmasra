"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { updateProfileAction } from "@/app/account/actions";
import { FormStatus } from "@/components/account/form-status";
import { useAccountForm } from "@/components/account/use-account-form";
import { useLanguage } from "@/components/language-provider";
import { PhoneField } from "@/components/phone-field";

type ProfileFormProps = {
  email: string;
  name: string;
  phoneCountry: string;
  phoneNumber: string;
};

export function ProfileForm({ email, name, phoneCountry, phoneNumber }: ProfileFormProps) {
  const { t } = useLanguage();
  const { state, formAction, pending, onSubmit } = useAccountForm(updateProfileAction);

  return (
    <section className="panel account-panel" aria-labelledby="account-profile-title">
      <header className="account-panel-heading">
        <h2 id="account-profile-title">{t.accountProfileTitle}</h2>
        <p>{t.accountProfileDesc}</p>
      </header>

      <form className="account-form" action={formAction} onSubmit={onSubmit}>
        <label className="auth-field">
          <span>{t.authName}</span>
          <input
            name="displayName"
            type="text"
            required
            minLength={2}
            maxLength={80}
            autoComplete="name"
            defaultValue={name}
            placeholder={t.authNamePlaceholder}
          />
        </label>

        <div className="auth-field account-readonly">
          <span>{t.accountEmail}</span>
          <div className="account-readonly-value">
            <strong>{email}</strong>
            <Link className="account-inline-link" href="/account/settings">
              {t.accountChangeEmailLink}
              <ArrowRight aria-hidden="true" />
            </Link>
          </div>
          <small className="auth-field-hint">{t.accountEmailSignIn}</small>
        </div>

        <PhoneField optional defaultCountry={phoneCountry} defaultNumber={phoneNumber} hint={t.authPhoneHint} />

        <div className="account-form-actions">
          <button className="button button-primary" type="submit" disabled={pending}>
            {pending ? t.accountSavePending : t.accountSaveIdle}
          </button>
          <FormStatus state={state} />
        </div>
      </form>
    </section>
  );
}
