"use client";

import Link from "next/link";
import { Mail, UserRound } from "lucide-react";
import { startTransition, useActionState, useId, useState, type FormEvent } from "react";

import type { AuthActionState } from "@/app/auth/actions";
import { useLanguage } from "@/components/language-provider";
import { PasswordInput, PasswordRules } from "@/components/password-input";
import { PhoneField } from "@/components/phone-field";
import { localizeServerMessage, type TextKey } from "@/lib/i18n";

type AuthAction = (state: AuthActionState, formData: FormData) => Promise<AuthActionState>;
type AuthMode = "login" | "reset" | "signup";

type AuthFormProps = {
  action: AuthAction;
  mode: AuthMode;
  next?: string;
};

const initialAuthState: AuthActionState = { message: "", status: "idle" };

const labels: Record<AuthMode, { idle: TextKey; pending: TextKey }> = {
  login: { idle: "authLoginIdle", pending: "authLoginPending" },
  reset: { idle: "authResetIdle", pending: "authResetPending" },
  signup: { idle: "authSignupIdle", pending: "authSignupPending" },
};

export function AuthForm({ action, mode, next }: AuthFormProps) {
  const { t, lang } = useLanguage();
  const [state, formAction, pending] = useActionState(action, initialAuthState);
  const [password, setPassword] = useState("");
  // Submitting through a transition skips React's automatic form reset, so a
  // failed sign-up keeps what was typed. `action` still posts without JavaScript.
  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(() => formAction(formData));
  };
  const rulesId = useId();
  const needsEmail = mode === "login" || mode === "signup";
  const isSignup = mode === "signup";
  const isNewPassword = mode === "reset" || isSignup;
  // Signup pairs short fields side by side on wide compact layouts, so the
  // password checklist sits under both password fields instead of inside the first.
  const half = isSignup ? "auth-field-half" : undefined;

  return (
    <form className="auth-form" action={formAction} onSubmit={onSubmit} onReset={() => setPassword("")}>
      {next && <input type="hidden" name="next" value={next} />}

      {isSignup && (
        <label className="auth-field auth-field-half">
          <span>{t.authName}</span>
          <span className="field-control">
            <UserRound className="field-icon" aria-hidden="true" />
            <input
              name="displayName"
              type="text"
              required
              minLength={2}
              maxLength={80}
              autoComplete="name"
              placeholder={t.authNamePlaceholder}
            />
          </span>
        </label>
      )}

      {needsEmail && (
        <label className={half ? `auth-field ${half}` : "auth-field"}>
          <span>{t.authEmail}</span>
          <span className="field-control">
            <Mail className="field-icon" aria-hidden="true" />
            <input
              name="email"
              type="email"
              required
              maxLength={254}
              autoComplete="email"
              inputMode="email"
              placeholder={t.authEmailPlaceholder}
            />
          </span>
        </label>
      )}

      {isSignup && <PhoneField optional hint={t.authPhoneHint} />}

      <PasswordInput
        name="password"
        label={mode === "reset" ? t.authNewPassword : t.authPassword}
        autoComplete={isNewPassword ? "new-password" : "current-password"}
        placeholder={isNewPassword ? t.authNewPasswordPlaceholder : t.authPasswordPlaceholder}
        className={half}
        describedBy={isNewPassword ? rulesId : undefined}
        onValueChange={isNewPassword ? setPassword : undefined}
      />

      {isNewPassword && (
        <PasswordInput
          name="confirmPassword"
          label={t.authConfirmPassword}
          autoComplete="new-password"
          placeholder={t.authConfirmPasswordPlaceholder}
          className={half}
        />
      )}

      {isNewPassword && <PasswordRules id={rulesId} password={password} />}

      {mode === "login" && (
        <Link className="auth-help-link" href="/forgot-password">{t.authForgotLink}</Link>
      )}

      <button className="button button-primary auth-submit" type="submit" disabled={pending}>
        {t[pending ? labels[mode].pending : labels[mode].idle]}
      </button>

      <p
        className={`auth-status${state.status !== "idle" ? ` is-${state.status}` : ""}`}
        role={state.status === "error" ? "alert" : "status"}
        aria-live="polite"
      >
        {localizeServerMessage(state.message, lang)}
      </p>
    </form>
  );
}
