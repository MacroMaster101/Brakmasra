"use client";

import { useState } from "react";
import { Check, Eye, EyeOff, LockKeyhole } from "lucide-react";

import { useLanguage } from "@/components/language-provider";
import { PASSWORD_RULES } from "@/lib/password-rules";

type PasswordInputProps = {
  autoComplete: "current-password" | "new-password";
  className?: string;
  /** Id of a hint or checklist rendered outside the field. */
  describedBy?: string;
  label: string;
  name: string;
  /** New passwords must meet the length rule; the current one is checked by Supabase. */
  minLength?: number;
  /** Reports each keystroke, for a checklist rendered elsewhere. */
  onValueChange?: (value: string) => void;
  placeholder?: string;
};

/** Password field with a lock icon and a show/hide toggle, shared by the sign-in and account forms. */
export function PasswordInput({ autoComplete, className, describedBy, label, name, minLength = 8, onValueChange, placeholder }: PasswordInputProps) {
  const { t } = useLanguage();
  const [visible, setVisible] = useState(false);

  return (
    <label className={className ? `auth-field ${className}` : "auth-field"}>
      <span>{label}</span>
      <span className="field-control password-control">
        <LockKeyhole className="field-icon" aria-hidden="true" />
        <input
          name={name}
          type={visible ? "text" : "password"}
          required
          minLength={minLength}
          maxLength={72}
          autoComplete={autoComplete}
          placeholder={placeholder}
          aria-describedby={describedBy}
          onChange={onValueChange ? (event) => onValueChange(event.target.value) : undefined}
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
    </label>
  );
}

/** Live checklist of the new-password rules; each item ticks as the password meets it. */
export function PasswordRules({ id, password }: { id?: string; password: string }) {
  const { t } = useLanguage();

  return (
    <ul id={id} className="password-rules" aria-label={t.authPasswordRules}>
      {PASSWORD_RULES.map((rule) => {
        const met = rule.met(password);
        return (
          <li key={rule.key} className={met ? "is-met" : undefined}>
            <span className="password-rule-mark" aria-hidden="true">{met && <Check />}</span>
            {t[rule.key]}
            <span className="sr-only">: {met ? t.authRuleMet : t.authRuleUnmet}</span>
          </li>
        );
      })}
    </ul>
  );
}
