"use client";

import type { AccountActionState } from "@/app/account/actions";
import { useLanguage } from "@/components/language-provider";
import { localizeServerMessage } from "@/lib/i18n";

export function FormStatus({ state, hidden = false }: { state: AccountActionState; hidden?: boolean }) {
  const { lang } = useLanguage();
  const tone = state.status === "error" ? " is-error" : state.status === "idle" || hidden ? "" : " is-success";

  return (
    <p
      className={`auth-status account-form-status${tone}`}
      role={state.status === "error" && !hidden ? "alert" : "status"}
      aria-live="polite"
    >
      {hidden ? "" : localizeServerMessage(state.message, lang)}
    </p>
  );
}
