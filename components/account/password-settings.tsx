"use client";

import { useEffect, useId, useRef, useState } from "react";

import { updatePasswordAction, type AccountActionState } from "@/app/account/actions";
import { FormStatus } from "@/components/account/form-status";
import { useAccountForm } from "@/components/account/use-account-form";
import { CodeInput } from "@/components/code-input";
import { useLanguage } from "@/components/language-provider";
import { PasswordInput, PasswordRules } from "@/components/password-input";

/**
 * Change password (members who have one) or set a first password (Google-only
 * accounts). The server decides which from the session; `hasPassword` only
 * picks the copy and whether to ask for the current password.
 */
export function PasswordSettings({ email, hasPassword }: { email: string; hasPassword: boolean }) {
  const { t } = useLanguage();
  const { state, formAction, pending, onSubmit } = useAccountForm(updatePasswordAction);
  const formRef = useRef<HTMLFormElement>(null);
  // Cancelling the code step sets aside the state that opened it until the next submit.
  const [dismissed, setDismissed] = useState<AccountActionState | null>(null);
  const [password, setPassword] = useState("");
  const rulesId = useId();
  const active = state !== dismissed;
  const awaitingCode = active && (state.status === "reauth" || Boolean(state.codeRequired));

  useEffect(() => {
    if (state.status === "success") formRef.current?.reset();
  }, [state]);

  const title = hasPassword ? t.accountPasswordChangeTitle : t.accountPasswordSetTitle;
  const description = hasPassword ? t.accountPasswordChangeDesc : t.accountPasswordSetDesc;
  const [before, after] = t.accountReauthDesc(email).split(email);

  return (
    <section className="panel account-panel" aria-labelledby="account-password-title">
      <header className="account-panel-heading">
        <h2 id="account-password-title">{title}</h2>
        <p>{description}</p>
      </header>

      <form ref={formRef} className="account-form" action={formAction} onSubmit={onSubmit} onReset={() => setPassword("")}>
        {/* Stays in the form during the code step, so the retry sends the same passwords. */}
        <div className="account-form-fields" hidden={awaitingCode}>
          {hasPassword && (
            <PasswordInput name="currentPassword" label={t.accountCurrentPassword} autoComplete="current-password" minLength={1} />
          )}
          <PasswordInput
            name="password"
            label={t.authNewPassword}
            autoComplete="new-password"
            placeholder={t.authNewPasswordPlaceholder}
            describedBy={rulesId}
            onValueChange={setPassword}
          />
          <PasswordInput name="confirmPassword" label={t.authConfirmPassword} autoComplete="new-password" placeholder={t.authConfirmPasswordPlaceholder} />
          <PasswordRules id={rulesId} password={password} />
        </div>

        {awaitingCode ? (
          <div className="account-code-step">
            <h3>{t.accountReauthTitle}</h3>
            <p>{before}<strong>{email}</strong>{after}</p>
            <CodeInput name="nonce" disabled={pending} />
            <div className="account-form-actions">
              <button className="button button-primary" type="submit" disabled={pending}>
                {pending ? t.accountReauthPending : t.accountReauthConfirm}
              </button>
              <button className="auth-text-button" type="submit" name="resend" value="1" formNoValidate disabled={pending}>
                {t.accountReauthResend}
              </button>
              <button className="auth-text-button account-cancel" type="button" disabled={pending} onClick={() => setDismissed(state)}>
                {t.accountReauthCancel}
              </button>
            </div>
          </div>
        ) : (
          <div className="account-form-actions">
            <button className="button button-primary" type="submit" disabled={pending}>
              {pending ? t.accountPasswordPending : hasPassword ? t.accountPasswordChangeIdle : t.accountPasswordSetIdle}
            </button>
          </div>
        )}
        <FormStatus state={state} hidden={!active} />
      </form>
    </section>
  );
}
