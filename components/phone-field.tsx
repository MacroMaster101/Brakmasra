"use client";

import { ChevronDown } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";

import { useLanguage } from "@/components/language-provider";
import { DEFAULT_PHONE_COUNTRY, PHONE_COUNTRIES, findPhoneCountry } from "@/lib/phone";

type PhoneFieldProps = {
  /** Form field name for the ISO country code. */
  countryName?: string;
  /** Form field name for the national number. */
  numberName?: string;
  /** ISO country code selected at first render. */
  defaultCountry?: string;
  /** National number to prefill. */
  defaultNumber?: string;
  /** Shows an "(optional)" marker; otherwise the number is required. */
  optional?: boolean;
  /** Overrides the visible label. */
  label?: string;
  /** Helper text shown under the control. */
  hint?: string;
};

export function PhoneField({
  countryName = "phoneCountry",
  numberName = "phone",
  defaultCountry = DEFAULT_PHONE_COUNTRY,
  defaultNumber = "",
  optional = false,
  label,
  hint,
}: PhoneFieldProps) {
  const { t } = useLanguage();
  const id = useId();
  const selectRef = useRef<HTMLSelectElement>(null);
  const initialCode = findPhoneCountry(defaultCountry)?.code ?? DEFAULT_PHONE_COUNTRY;
  const [code, setCode] = useState(initialCode);
  const country = findPhoneCountry(code) ?? PHONE_COUNTRIES[0];
  const numberId = `${id}-number`;
  const hintId = `${id}-hint`;

  // The select is uncontrolled so a form reset (React resets forms after an
  // action) restores it natively; keep the visible code in step with that.
  useEffect(() => {
    const form = selectRef.current?.form;
    if (!form) return;
    const onReset = () => setCode(initialCode);
    form.addEventListener("reset", onReset);
    return () => form.removeEventListener("reset", onReset);
  }, [initialCode]);

  return (
    <div className="auth-field phone-field">
      <label htmlFor={numberId}>
        {label ?? t.authPhone}
        {optional && <span className="phone-field-optional"> ({t.authPhoneOptional})</span>}
      </label>
      <span className="phone-control">
        <span className="phone-country">
          <span className="phone-country-value" aria-hidden="true">{country.code} {country.dial}</span>
          <ChevronDown aria-hidden="true" />
          <select
            ref={selectRef}
            name={countryName}
            defaultValue={initialCode}
            onChange={(event) => setCode(event.target.value)}
            aria-label={t.authCountryCode}
          >
            {PHONE_COUNTRIES.map((option) => (
              <option key={option.code} value={option.code}>{option.name} ({option.dial})</option>
            ))}
          </select>
        </span>
        <input
          id={numberId}
          name={numberName}
          type="tel"
          inputMode="tel"
          autoComplete="tel-national"
          maxLength={20}
          required={!optional}
          defaultValue={defaultNumber}
          placeholder={country.example}
          aria-describedby={hint ? hintId : undefined}
        />
      </span>
      {hint && <small id={hintId} className="auth-field-hint">{hint}</small>}
    </div>
  );
}
