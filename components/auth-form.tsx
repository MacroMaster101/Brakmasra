"use client";

import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import { startTransition, useActionState, useId, useState, type FormEvent } from "react";

import type { AuthActionState } from "@/app/auth/actions";
import { useLanguage } from "@/components/language-provider";
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

type PasswordFieldProps = {
  autoComplete: string;
  className?: string;
  /** Id of a hint rendered outside the field. */
  describedBy?: string;
  hint?: string;
  label: string;
  name: string;
};

function PasswordField({ autoComplete, className, describedBy, hint, label, name }: PasswordFieldProps) {
  const { t } = useLanguage();
  const [visible, setVisible] = useState(false);

  return (
    <label className={className ? `auth-field ${className}` : "auth-field"}>
      <span>{label}</span>
      <span className="password-control">
        <input
          name={name}
          type={visible ? "text" : "password"}
          required
          minLength={8}
          maxLength={72}
          autoComplete={autoComplete}
          aria-describedby={describedBy}
        />
        <button
          type="button"
          onClick={() => setVisible((value) => !value)}
          aria-label={visible ? t.authHidePassword : t.authShowPassword}
          aria-pressed={visible}
        >
          {visible ? <EyeOff /> : <Eye />}
        </button>
      </span>
      {hint && <small className="auth-field-hint">{hint}</small>}
    </label>
  );
}

const labels: Record<AuthMode, { idle: TextKey; pending: TextKey }> = {
  login: { idle: "authLoginIdle", pending: "authLoginPending" },
  reset: { idle: "authResetIdle", pending: "authResetPending" },
  signup: { idle: "authSignupIdle", pending: "authSignupPending" },
};

export function AuthForm({ action, mode, next }: AuthFormProps) {
  const { t, lang } = useLanguage();
  const [state, formAction, pending] = useActionState(action, initialAuthState);
  // Submitting through a transition skips React's automatic form reset, so a
  // failed sign-up keeps what was typed. `action` still posts without JavaScript.
  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(() => formAction(formData));
  };
  const passwordHintId = useId();
  const needsEmail = mode === "login" || mode === "signup";
  const needsPassword = mode === "login" || mode === "reset" || mode === "signup";
  const isSignup = mode === "signup";
  // Signup pairs short fields side by side on wide compact layouts, so the
  // password hint sits under both password fields instead of inside the first.
  const half = isSignup ? "auth-field-half" : undefined;

  return (
    <form className="auth-form" action={formAction} onSubmit={onSubmit}>
      {next && <input type="hidden" name="next" value={next} />}

      {isSignup && (
        <label className="auth-field auth-field-half">
          <span>{t.authName}</span>
          <input
            name="displayName"
            type="text"
            required
            minLength={2}
            maxLength={80}
            autoComplete="name"
            placeholder={t.authNamePlaceholder}
          />
        </label>
      )}

      {needsEmail && (
        <label className={half ? `auth-field ${half}` : "auth-field"}>
          <span>{t.authEmail}</span>
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
      )}

      {isSignup && <PhoneField optional hint={t.authPhoneHint} />}

      {needsPassword && (
        <PasswordField
          name="password"
          label={mode === "reset" ? t.authNewPassword : t.authPassword}
          autoComplete={mode === "login" ? "current-password" : "new-password"}
          className={half}
          describedBy={isSignup ? passwordHintId : undefined}
          hint={mode === "reset" ? t.authPasswordHint : undefined}
        />
      )}

      {(mode === "reset" || isSignup) && (
        <PasswordField name="confirmPassword" label={t.authConfirmPassword} autoComplete="new-password" className={half} />
      )}

      {isSignup && <small id={passwordHintId} className="auth-field-hint auth-password-hint">{t.authPasswordHint}</small>}

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
