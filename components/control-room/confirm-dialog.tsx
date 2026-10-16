"use client";
import { useEffect, useId, useRef } from "react";
import { lockPageScroll } from "@/lib/page-scroll-lock";
export function ConfirmDialog({ question, onCancel, onConfirm }: { question: string; onCancel: () => void; onConfirm: () => void }) {
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
  }}><h2 id={`${id}-title`}>Confirm change</h2><p id={`${id}-question`}>{question}</p><div><button className="button button-secondary" type="button" autoFocus onClick={onCancel}>Cancel</button><button className="button button-primary" type="button" onClick={onConfirm}>Confirm</button></div></dialog>;
}
