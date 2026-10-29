"use client";
import { useEffect, useId, useRef } from "react";
import { lockPageScroll } from "@/lib/page-scroll-lock";
import { useLanguage } from "@/components/language-provider";
export function ConfirmDialog({ title, question, confirmLabel, onCancel, onConfirm }: { title?: string; question: string; confirmLabel?: string; onCancel: () => void; onConfirm: () => void }) {
  const { t } = useLanguage();
  const ref = useRef<HTMLDialogElement>(null);
  const id = useId();
  useEffect(() => {
    const dialog = ref.current;
    dialog?.showModal();
    const release = lockPageScroll();
    return () => { dialog?.close(); release(); };
  }, []);
  return <dialog className="cms-confirm" ref={ref} aria-labelledby={`${id}-title`} aria-describedby={`${id}-question`} onCancel={(event) => { event.preventDefault(); onCancel(); }} onClick={(event) => {
    if (event.target !== event.currentTarget) return;
    const box = event.currentTarget.getBoundingClientRect();
    if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) onCancel();
  }}><h2 id={`${id}-title`}>{title ?? t.crConfirmTitle}</h2><p id={`${id}-question`}>{question}</p><div><button className="button button-secondary" type="button" autoFocus onClick={onCancel}>{t.crCancel}</button><button className="button button-primary" type="button" onClick={onConfirm}>{confirmLabel ?? t.crConfirm}</button></div></dialog>;
}
