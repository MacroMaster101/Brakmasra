"use client";

import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import { useActionState, useState } from "react";

import type { AuthActionState } from "@/app/auth/actions";

type AuthAction = (state: AuthActionState, formData: FormData) => Promise<AuthActionState>;
type AuthMode = "forgot" | "login" | "reset" | "signup";

type AuthFormProps = {
  action: AuthAction;
  mode: AuthMode;
  next?: string;
};

const initialAuthState: AuthActionState = { message: "", status: "idle" };

function PasswordField({ autoComplete, label, name }: { autoComplete: string; label: string; name: string }) {
  const [visible, setVisible] = useState(false);

  return (
    <label className="auth-field">
      <span>{label}</span>
      <span className="password-control">
        <input
          name={name}
          type={visible ? "text" : "password"}
          required
          minLength={8}
          maxLength={72}
          autoComplete={autoComplete}
        />
        <button
          type="button"
          onClick={() => setVisible((value) => !value)}
          aria-label={visible ? "Hide password" : "Show password"}
          aria-pressed={visible}
        >
          {visible ? <EyeOff /> : <Eye />}
        </button>
      </span>
    </label>
  );
}

const labels: Record<AuthMode, { idle: string; pending: string }> = {
  forgot: { idle: "Send reset link", pending: "Sending link" },
  login: { idle: "Sign in", pending: "Signing in" },
  reset: { idle: "Set new password", pending: "Updating password" },
  signup: { idle: "Create account", pending: "Creating account" },
};

export function AuthForm({ action, mode, next }: AuthFormProps) {
  const [state, formAction, pending] = useActionState(action, initialAuthState);
  const needsEmail = mode === "forgot" || mode === "login" || mode === "signup";
  const needsPassword = mode === "login" || mode === "reset" || mode === "signup";

  return (
    <form className="auth-form" action={formAction}>
      {next && <input type="hidden" name="next" value={next} />}

      {mode === "signup" && (
        <label className="auth-field">
          <span>Name</span>
          <input name="displayName" type="text" required minLength={2} maxLength={80} autoComplete="name" />
        </label>
      )}

      {needsEmail && (
        <label className="auth-field">
          <span>Email address</span>
          <input name="email" type="email" required maxLength={254} autoComplete="email" inputMode="email" />
        </label>
      )}

      {needsPassword && (
        <PasswordField
          name="password"
          label={mode === "reset" ? "New password" : "Password"}
          autoComplete={mode === "login" ? "current-password" : "new-password"}
        />
      )}

      {(mode === "reset" || mode === "signup") && (
        <PasswordField name="confirmPassword" label="Confirm password" autoComplete="new-password" />
      )}

      {mode === "login" && (
        <Link className="auth-help-link" href="/forgot-password">Forgot password?</Link>
      )}

      <button className="button button-primary auth-submit" type="submit" disabled={pending}>
        {pending ? labels[mode].pending : labels[mode].idle}
      </button>

      <p
        className={`auth-status${state.status !== "idle" ? ` is-${state.status}` : ""}`}
        role={state.status === "error" ? "alert" : "status"}
        aria-live="polite"
      >
        {state.message}
      </p>
    </form>
  );
}
