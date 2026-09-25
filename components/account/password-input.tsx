"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

import { useLanguage } from "@/components/language-provider";

type PasswordInputProps = {
  autoComplete: "current-password" | "new-password";
  hint?: string;
  label: string;
  name: string;
  /** New passwords must meet the length rule; the current one is checked by Supabase. */
  minLength?: number;
};

/** Same markup as the sign-in forms' password field, with a show/hide toggle. */
export function PasswordInput({ autoComplete, hint, label, name, minLength = 8 }: PasswordInputProps) {
  const { t } = useLanguage();
  const [visible, setVisible] = useState(false);

  return (
    <label className="auth-field">
      <span>{label}</span>
      <span className="password-control">
        <input
          name={name}
          type={visible ? "text" : "password"}
          required
          minLength={minLength}
          maxLength={72}
          autoComplete={autoComplete}
        />
        <button
          type="button"
          onClick={() => setVisible((value) => !value)}
          aria-label={visible ? t.authHidePassword : t.authShowPassword}
          aria-pressed={visible}
        >
          {visible ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
        </button>
      </span>
      {hint && <small className="auth-field-hint">{hint}</small>}
    </label>
  );
}
