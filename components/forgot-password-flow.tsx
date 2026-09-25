"use client";

import { startTransition, useActionState, useEffect, useState, type FormEvent } from "react";

import type { AuthActionState } from "@/app/auth/actions";
import { CodeInput } from "@/components/code-input";
import { useLanguage } from "@/components/language-provider";
import { localizeServerMessage } from "@/lib/i18n";
import { RESEND_COOLDOWN_SECONDS } from "@/lib/reset-code";

type AuthAction = (state: AuthActionState, formData: FormData) => Promise<AuthActionState>;

const initialState: AuthActionState = { message: "", status: "idle" };

/** Counts down from the cooldown; remount it (new key) after every successful send. */
function ResendButton({ pending }: { pending: boolean }) {
  const { t } = useLanguage();
  const [secondsLeft, setSecondsLeft] = useState(RESEND_COOLDOWN_SECONDS);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const timer = setTimeout(() => setSecondsLeft((seconds) => seconds - 1), 1000);
    return () => clearTimeout(timer);
  }, [secondsLeft]);

  const clock = `${Math.floor(secondsLeft / 60)}:${String(secondsLeft % 60).padStart(2, "0")}`;
  // Split around the time so it can stand out in either language's word order.
  const [before, after] = t.resetResendIn(clock).split(clock);

  return (
    <button className="auth-resend-button" type="submit" disabled={pending || secondsLeft > 0}>
      {pending ? t.resetResending : secondsLeft > 0 ? (
        <>{before}<span className="auth-resend-clock">{clock}</span>{after}</>
      ) : t.resetResend}
    </button>
  );
}

export function ForgotPasswordFlow({ requestAction, verifyAction }: { requestAction: AuthAction; verifyAction: AuthAction }) {
  const { t, lang } = useLanguage();
  const [requestState, requestFormAction, requesting] = useActionState(requestAction, initialState);
  const [resendState, resendFormAction, resending] = useActionState(requestAction, initialState);
  const [verifyState, verifyFormAction, verifying] = useActionState(verifyAction, initialState);
  // Set to the send being replaced; a newer send closes the email step again.
  const [editingSince, setEditingSince] = useState<number | null>(null);
  const [lastAction, setLastAction] = useState<"request" | "resend" | "verify">("request");

  const email = requestState.status === "success" ? requestState.email : undefined;
  const editing = editingSince !== null && editingSince === requestState.sentAt;
  const lastSentAt = Math.max(requestState.sentAt ?? 0, resendState.sentAt ?? 0);

  // A transition skips React's form reset, so the email stays after an error.
  const submitRequest = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLastAction("request");
    const formData = new FormData(event.currentTarget);
    startTransition(() => requestFormAction(formData));
  };

  if (!email || editing) {
    return (
      <>
        <header className="auth-heading">
          <h1>{t.forgotTitle}</h1>
          <p>{t.forgotDesc}</p>
        </header>
        <form className="auth-form" action={requestFormAction} onSubmit={submitRequest}>
          <label className="auth-field">
            <span>{t.authEmail}</span>
            <input name="email" type="email" required maxLength={254} autoComplete="email" inputMode="email" defaultValue={email} />
          </label>
          <button className="button button-primary auth-submit" type="submit" disabled={requesting}>
            {requesting ? t.authForgotPending : t.authForgotIdle}
          </button>
          <p
            className={`auth-status${requestState.status !== "idle" ? ` is-${requestState.status}` : ""}`}
            role={requestState.status === "error" ? "alert" : "status"}
            aria-live="polite"
          >
            {!editing && localizeServerMessage(requestState.message, lang)}
          </p>
        </form>
      </>
    );
  }

  const status = lastAction === "verify" ? verifyState : lastAction === "resend" ? resendState : requestState;

  return (
    <div className="reset-code-step">
      <header className="auth-heading">
        <h1>{t.resetCodeTitle}</h1>
        <p>
          {t.resetCodeSentLead}
          <strong className="reset-code-email">{email}</strong>
          {t.resetCodeSentNote}
        </p>
      </header>

      <form className="auth-form" action={verifyFormAction} onSubmit={() => setLastAction("verify")}>
        <input type="hidden" name="email" value={email} />
        <CodeInput name="token" disabled={verifying} />
        <button className="button button-primary auth-submit" type="submit" disabled={verifying}>
          {verifying ? t.resetVerifying : t.resetVerify}
        </button>
      </form>

      <p
        className={`auth-status${status.status === "error" ? " is-error" : ""}`}
        role={status.status === "error" ? "alert" : "status"}
        aria-live="polite"
      >
        {lastAction === "request" ? t.resetCheckSpam : localizeServerMessage(status.message, lang)}
      </p>

      <div className="reset-code-actions">
        <form action={resendFormAction} onSubmit={() => setLastAction("resend")}>
          <input type="hidden" name="email" value={email} />
          <ResendButton key={lastSentAt} pending={resending} />
        </form>
        <button className="auth-text-button" type="button" onClick={() => setEditingSince(requestState.sentAt ?? 0)}>
          {t.resetDifferentEmail}
        </button>
      </div>
    </div>
  );
}
