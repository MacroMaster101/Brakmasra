"use client";

import Link from "next/link";
import { startTransition, useActionState, type FormEvent, type ReactNode } from "react";
import { ArrowLeft, Trash2 } from "lucide-react";

import type { ControlRoomActionState } from "@/app/admin/actions";
import { ActionStatus } from "@/components/control-room/shared";
import { useLanguage } from "@/components/language-provider";
import type { TextKey } from "@/lib/i18n";

export type CrAction = (state: ControlRoomActionState, formData: FormData) => Promise<ControlRoomActionState>;

export const idleState: ControlRoomActionState = { status: "idle", message: "" };

/**
 * Runs a Control Room action without React's automatic form reset, so typed
 * values stay after an error. With `confirmText`, the browser asks first.
 */
export function useCrForm(action: CrAction, confirmText?: string) {
  const [state, formAction, pending] = useActionState(action, idleState);

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (confirmText && !window.confirm(confirmText)) return;
    const submitter = (event.nativeEvent as SubmitEvent).submitter;
    const formData = new FormData(event.currentTarget, submitter);
    startTransition(() => formAction(formData));
  };

  return { state, formAction, pending, onSubmit };
}

export function BackLink({ href, label }: { href: string; label: TextKey }) {
  const { t } = useLanguage();
  return (
    <Link className="crs-back" href={href}>
      <ArrowLeft aria-hidden="true" />
      {t[label]}
    </Link>
  );
}

type FieldProps = {
  label: TextKey;
  hint?: TextKey;
  wide?: boolean;
  children: ReactNode;
};

export function Field({ label, hint, wide, children }: FieldProps) {
  const { t } = useLanguage();
  return (
    <label className={`crs-field${wide ? " is-wide" : ""}`}>
      <span className="crs-label">{t[label]}</span>
      {children}
      {hint && <small className="crs-hint">{t[hint]}</small>}
    </label>
  );
}

export function Toggle({ name, label, hint, defaultChecked, disabled }: {
  name: string;
  label: TextKey;
  hint?: TextKey;
  defaultChecked: boolean;
  disabled?: boolean;
}) {
  const { t } = useLanguage();
  return (
    <label className="crs-toggle">
      <input type="checkbox" name={name} defaultChecked={defaultChecked} disabled={disabled} />
      <span>
        <strong>{t[label]}</strong>
        {hint && <small>{t[hint]}</small>}
      </span>
    </label>
  );
}

/** Save button with the action's reply beside it; hidden for view-only roles. */
export function SaveBar({ pending, state, canManage, label = "crSave" }: {
  pending: boolean;
  state: ControlRoomActionState;
  canManage: boolean;
  label?: TextKey;
}) {
  const { t } = useLanguage();
  if (!canManage) return <p className="crs-readonly">{t.crsViewOnly}</p>;
  return (
    <div className="crs-savebar">
      <button className="button button-primary" type="submit" disabled={pending}>
        {pending ? t.crSaving : t[label]}
      </button>
      <ActionStatus state={state} />
    </div>
  );
}

/** A delete button in its own form; the browser asks before anything is removed. */
export function DeleteForm({ action, id, confirm, label = "crsDelete", compact }: {
  action: CrAction;
  id: string;
  confirm: TextKey;
  label?: TextKey;
  compact?: boolean;
}) {
  const { t } = useLanguage();
  const { state, formAction, pending, onSubmit } = useCrForm(action, t[confirm]);
  return (
    <form className={compact ? "crs-delete is-compact" : "crs-delete"} action={formAction} onSubmit={onSubmit}>
      <input type="hidden" name="id" value={id} />
      <button className="crs-danger-button" type="submit" disabled={pending}>
        <Trash2 aria-hidden="true" />
        {pending ? t.crsDeleting : t[label]}
      </button>
      <ActionStatus state={state} />
    </form>
  );
}

/** Shows "saved" or "deleted" notices carried over a redirect. */
export function Notice({ text }: { text: TextKey | null }) {
  const { t } = useLanguage();
  if (!text) return null;
  return <p className="crs-notice" role="status">{t[text]}</p>;
}
