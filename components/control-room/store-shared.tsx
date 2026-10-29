"use client";

import Link from "next/link";
import { cloneElement, isValidElement, startTransition, useActionState, useId, useState, type FormEvent, type ReactNode } from "react";
import { ArrowLeft, Trash2 } from "lucide-react";

import type { ControlRoomActionState } from "@/app/admin/actions";
import { ActionStatus } from "@/components/control-room/shared";
import { useDashboardNotify } from "@/components/control-room/notifications";
import { ConfirmDialog } from "@/components/control-room/confirm-dialog";
import { editorReset, formIdentity, useEditorLifecycle } from "@/components/control-room/editor-dialog";
import { useLanguage } from "@/components/language-provider";
import type { TextKey } from "@/lib/i18n";

export type CrAction = (state: ControlRoomActionState, formData: FormData) => Promise<ControlRoomActionState>;

export const idleState: ControlRoomActionState = { status: "idle", message: "" };

/**
 * Runs a Control Room action without React's automatic form reset, so typed
 * values stay after an error.
 */
export function useCrForm(action: CrAction) {
  const notify = useDashboardNotify();
  const editor = useEditorLifecycle();
  const [state, formAction, pending] = useActionState(async (previous: ControlRoomActionState, data: FormData) => {
    editor?.start();
    let saved = false;
    try {
    const reply = await action(previous, data);
    // The layout keeps successful feedback visible across route refreshes.
    notify(reply);
    saved = reply.status === "success";
    return reply;
    } finally { editor?.finish(saved && data.get("__keepDirty") !== "1", String(data.get("__editorForm") ?? "")); }
  }, idleState);

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const submitter = (event.nativeEvent as SubmitEvent).submitter;
    const formData = new FormData(event.currentTarget, submitter);
    formData.set("__editorForm", formIdentity(event.currentTarget));
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
  const id = useId();
  return (
    <div className={`crs-field${wide ? " is-wide" : ""}`}>
      <label htmlFor={id} className="crs-label">{t[label]}</label>
      {isValidElement<{ id?: string }>(children) ? cloneElement(children, { id, ...(hint ? { "aria-describedby": `${id}-hint` } : {}) }) : children}
      {hint && <small id={`${id}-hint`} className="crs-hint">{t[hint]}</small>}
    </div>
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
export function SaveBar({ pending, state, canManage, label = "crSave", onReset }: {
  pending: boolean;
  state: ControlRoomActionState;
  canManage: boolean;
  label?: TextKey;
  onReset?: () => void;
}) {
  const { t } = useLanguage();
  if (!canManage) return <p className="crs-readonly">{t.crsViewOnly}</p>;
  return (
    <div className="crs-savebar">
      <button className="button button-primary" type="submit" disabled={pending}>
        {pending ? t.crSaving : t[label]}
      </button>
      {onReset && <button className="button button-secondary" type="reset" disabled={pending} onClick={event => { const form = event.currentTarget.form; if (form) editorReset(form); onReset(); }}>{t.crResetSection}</button>}
      <ActionStatus state={state} />
    </div>
  );
}

/** A delete button in its own form, protected by a themed confirmation dialog. */
export function DeleteForm({ action, id, confirm, label = "crsDelete", compact }: {
  action: CrAction;
  id: string;
  confirm: TextKey;
  label?: TextKey;
  compact?: boolean;
}) {
  const { t } = useLanguage();
  const { state, formAction, pending } = useCrForm(action);
  const [confirmation, setConfirmation] = useState<FormData | null>(null);
  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setConfirmation(new FormData(event.currentTarget, (event.nativeEvent as SubmitEvent).submitter));
  };
  return (
    <>
    <form className={compact ? "crs-delete is-compact" : "crs-delete"} action={formAction} onSubmit={onSubmit}>
      <input type="hidden" name="id" value={id} />
      <button className="crs-danger-button" type="submit" disabled={pending}>
        <Trash2 aria-hidden="true" />
        {pending ? t.crsDeleting : t[label]}
      </button>
      <ActionStatus state={state} />
    </form>
    {confirmation && <ConfirmDialog question={t[confirm]} onCancel={() => setConfirmation(null)} onConfirm={() => { const data = confirmation; setConfirmation(null); startTransition(() => formAction(data)); }} />}
    </>
  );
}

/** Shows "saved" or "deleted" notices carried over a redirect. */
export function Notice({ text }: { text: TextKey | null }) {
  const { t } = useLanguage();
  if (!text) return null;
  return <p className="crs-notice" role="status">{t[text]}</p>;
}
