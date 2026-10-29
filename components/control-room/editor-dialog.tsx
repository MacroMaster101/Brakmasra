"use client";

import { createContext, useContext, useEffect, useId, useMemo, useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Expand, X } from "lucide-react";
import { ConfirmDialog } from "@/components/control-room/confirm-dialog";
import { useLanguage } from "@/components/language-provider";
import { lockPageScroll } from "@/lib/page-scroll-lock";
import type { TextKey } from "@/lib/i18n";

const EditorLifecycle = createContext<{ start: () => void; finish: (saved: boolean, form?: string) => void } | null>(null);
export const useEditorLifecycle = () => useContext(EditorLifecycle);

const identities = new WeakMap<HTMLFormElement, string>();
let nextIdentity = 0;
export function formIdentity(form: HTMLFormElement) {
  if (!identities.has(form)) identities.set(form, String(++nextIdentity));
  return identities.get(form)!;
}
export function editorChanged(node: HTMLElement) { node.dispatchEvent(new Event("cr-section-dirty", { bubbles: true })); }
export function editorReset(form: HTMLFormElement) { form.dispatchEvent(new Event("cr-section-reset", { bubbles: true })); }

/** Native focus trapping, independent form scrolling and a safe close for unsaved work. */
export function EditorDialog({ title, children, onClose, fullPageHref }: {
  title: string;
  children: ReactNode;
  onClose: () => void;
  fullPageHref?: string;
}) {
  const { t } = useLanguage();
  const ref = useRef<HTMLDialogElement>(null);
  const close = useRef<HTMLButtonElement>(null);
  const id = useId();
  const [dirtyForms, setDirtyForms] = useState<Set<string>>(new Set());
  const dirty = dirtyForms.size > 0;
  const [pendingCount, setPendingCount] = useState(0);
  const pending = pendingCount > 0;
  const [discard, setDiscard] = useState(false);
  const lifecycle = useMemo(() => ({
    start: () => setPendingCount(count => count + 1),
    finish: (saved: boolean, form?: string) => { setPendingCount(count => Math.max(0, count - 1)); if (saved) setDirtyForms(current => { const next = new Set(current); next.delete(form || "legacy"); return next; }); },
  }), []);
  useEffect(() => {
    const dialog = ref.current;
    const reset = (event: Event) => { if (event.target instanceof HTMLFormElement) { const key = formIdentity(event.target); setDirtyForms(current => { const next = new Set(current); next.delete(key); return next; }); } };
    dialog?.addEventListener("cr-section-reset", reset);
    const changed = (event: Event) => { const form = event.target instanceof HTMLElement ? event.target.closest("form") : null; if (form) setDirtyForms(current => new Set(current).add(formIdentity(form))); };
    dialog?.addEventListener("cr-section-dirty", changed);
    const previousFocus = document.activeElement;
    dialog?.showModal();
    close.current?.focus();
    const release = lockPageScroll();
    return () => {
      dialog?.removeEventListener("cr-section-reset", reset);
      dialog?.removeEventListener("cr-section-dirty", changed);
      dialog?.close();
      release();
      requestAnimationFrame(() => {
        if (previousFocus instanceof HTMLElement && previousFocus.isConnected && !document.querySelector("dialog[open]")) previousFocus.focus({ preventScroll: true });
      });
    };
  }, []);
  const requestClose = () => {
    if (pending) return;
    if (dirty) setDiscard(true);
    else onClose();
  };
  return <EditorLifecycle.Provider value={lifecycle}>
    <dialog ref={ref} className="cr-editor-dialog" aria-labelledby={id} onCancel={event => { event.preventDefault(); requestClose(); }} onClick={event => {
      if (event.target !== event.currentTarget) return;
      const box = event.currentTarget.getBoundingClientRect();
      if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) requestClose();
    }}>
      <header className="cr-editor-heading"><div><small>{t.crTitle}</small><h2 id={id}>{title}</h2></div><div className="cr-editor-tools">
        {fullPageHref && !dirty && !pending && <a href={fullPageHref} className="cr-editor-icon" aria-label={t.crEditorFull} title={t.crEditorFull}><Expand aria-hidden="true" /></a>}
        <button ref={close} className="cr-editor-icon" type="button" disabled={pending} onClick={requestClose} aria-label={t.crEditorClose}><X aria-hidden="true" /></button>
      </div></header>
      <div className="cr-editor-body" onResetCapture={event => { if (event.target instanceof HTMLFormElement) editorReset(event.target); }} onChangeCapture={event => { const target = event.target as HTMLElement;
        const form = target.closest("form");
        if (form && !(target instanceof HTMLInputElement && target.type === "search")) setDirtyForms(current => new Set(current).add(formIdentity(form))); }}>{children}</div>
    </dialog>
    {discard && <ConfirmDialog title={t.crDiscardTitle} question={t.crDiscardQuestion} confirmLabel={t.crDiscardConfirm} onCancel={() => setDiscard(false)} onConfirm={() => { setDiscard(false); onClose(); }} />}
  </EditorLifecycle.Provider>;
}

export function RouteEditorDialog({ title, fullPageHref, children }: { title: TextKey; fullPageHref: string; children: ReactNode }) {
  const router = useRouter();
  const { t } = useLanguage();
  return <EditorDialog title={t[title]} fullPageHref={fullPageHref} onClose={() => router.back()}>{children}</EditorDialog>;
}
