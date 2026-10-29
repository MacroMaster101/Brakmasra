"use client";
import { Children, isValidElement, useEffect, useId, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Check, ChevronDown } from "lucide-react";
import { editorChanged } from "@/components/control-room/editor-dialog";

type OptionProps = { value?: string | number; disabled?: boolean; children?: ReactNode };
type Choice = { value: string; label: string; disabled: boolean };
function optionsFrom(children: ReactNode): Choice[] {
  return Children.toArray(children).flatMap(child => {
    if (!isValidElement<OptionProps>(child)) return [];
    if (child.type !== "option") return optionsFrom(child.props.children);
    const label = Children.toArray(child.props.children).join("");
    return [{ value: String(child.props.value ?? label), label, disabled: Boolean(child.props.disabled) }];
  });
}
/** A form-compatible select with a rounded, themed menu in the browser's top layer. */
export function RoundedSelect({ id, name, value, defaultValue, disabled, children, onValueChange, "aria-label": label, "aria-describedby": describedBy }: {
  id?: string; name?: string; value?: string; defaultValue?: string; disabled?: boolean; children: ReactNode;
  onValueChange?: (value: string) => void; "aria-label"?: string; "aria-describedby"?: string;
}) {
  const generatedId = useId();
  const controlId = id ?? generatedId;
  const choices = useMemo(() => optionsFrom(children), [children]);
  const [internal, setInternal] = useState(defaultValue ?? choices[0]?.value ?? "");
  const selected = value ?? internal;
  const [open, setOpen] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  const popup = useRef<HTMLDivElement>(null);
  const optionRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const search = useRef({ text: "", time: 0 });
  const current = choices.find(choice => choice.value === selected);
  const close = (focus = true) => { if (popup.current?.matches(":popover-open")) popup.current.hidePopover(); setOpen(false); if (focus) trigger.current?.focus({ preventScroll: true }); };
  useEffect(() => {
    const form = trigger.current?.form;
    const reset = () => { setInternal(defaultValue ?? choices[0]?.value ?? ""); setOpen(false); };
    form?.addEventListener("reset", reset);
    return () => form?.removeEventListener("reset", reset);
  }, [defaultValue, choices]);
  useLayoutEffect(() => {
    const menu = popup.current;
    if (!open || !menu || !trigger.current) return;
    menu.showPopover();
    const position = () => {
      const anchor = trigger.current!.getBoundingClientRect();
      const edge = 12;
      const below = innerHeight - anchor.bottom - edge - 6;
      const above = anchor.top - edge - 6;
      const down = below >= Math.min(280, menu.scrollHeight) || below >= above;
      const height = Math.min(280, Math.max(100, down ? below : above));
      menu.style.width = `${Math.min(anchor.width, innerWidth - edge * 2)}px`;
      menu.style.maxHeight = `${height}px`;
      menu.style.left = `${Math.max(edge, Math.min(anchor.left, innerWidth - menu.offsetWidth - edge))}px`;
      menu.style.top = `${down ? anchor.bottom + 6 : Math.max(edge, anchor.top - Math.min(menu.scrollHeight, height) - 6)}px`;
    };
    position();
    const index = choices.findIndex(choice => choice.value === selected && !choice.disabled);
    const focusedOption = optionRefs.current[index >= 0 ? index : choices.findIndex(choice => !choice.disabled)];
    focusedOption?.focus({ preventScroll: true });
    if (focusedOption) {
      if (focusedOption.offsetTop < menu.scrollTop) menu.scrollTop = focusedOption.offsetTop;
      else if (focusedOption.offsetTop + focusedOption.offsetHeight > menu.scrollTop + menu.clientHeight) menu.scrollTop = focusedOption.offsetTop + focusedOption.offsetHeight - menu.clientHeight;
    }
    window.addEventListener("resize", position);
    document.addEventListener("scroll", position, true);
    return () => { window.removeEventListener("resize", position); document.removeEventListener("scroll", position, true); if (menu.matches(":popover-open")) menu.hidePopover(); };
  }, [open, choices, selected]);
  return <div className="cr-select">
    <button ref={trigger} id={controlId} type="button" className="cr-select-trigger" role="combobox" aria-label={label} aria-describedby={describedBy} aria-expanded={open} aria-haspopup="listbox" aria-controls={`${controlId}-options`} disabled={disabled} onClick={() => open ? close() : setOpen(true)} onKeyDown={event => {
      if (["ArrowDown", "ArrowUp", "Enter", " "].includes(event.key)) { event.preventDefault(); setOpen(true); }
      if (event.key === "Escape" && open) { event.preventDefault(); event.stopPropagation(); close(); }
    }}><span>{current?.label ?? selected}</span><ChevronDown size={18} aria-hidden="true" /></button>
    {name && <input type="hidden" name={name} value={selected} disabled={disabled} />}
    <div ref={popup} id={`${controlId}-options`} className="cr-select-menu" popover="auto" role="listbox" aria-label={label} aria-labelledby={label ? undefined : controlId} onToggle={event => setOpen(event.currentTarget.matches(":popover-open"))} onKeyDown={event => {
      const enabled = optionRefs.current.filter((item): item is HTMLButtonElement => Boolean(item && !item.disabled));
      const index = enabled.indexOf(document.activeElement as HTMLButtonElement);
      if (["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) {
        event.preventDefault(); const next = event.key === "Home" ? 0 : event.key === "End" ? enabled.length - 1 : (index + (event.key === "ArrowDown" ? 1 : -1) + enabled.length) % enabled.length;
        enabled[next]?.focus();
      } else if (event.key === "Escape") { event.preventDefault(); event.stopPropagation(); close(); }
      else if (event.key === "Tab") close();
      else if (event.key.length === 1 && event.key !== " ") {
        const now = Date.now(); search.current = { text: (now - search.current.time < 600 ? search.current.text : "") + event.key.toLowerCase(), time: now };
        enabled.find(option => option.textContent?.trim().toLowerCase().startsWith(search.current.text))?.focus();
      }
    }}>{choices.map((choice, index) => <button key={choice.value} ref={node => { optionRefs.current[index] = node; }} type="button" role="option" aria-selected={selected === choice.value} disabled={choice.disabled || disabled} onClick={() => {
      if (value === undefined) setInternal(choice.value);
      onValueChange?.(choice.value);
      if (trigger.current && choice.value !== selected) editorChanged(trigger.current);
      close();
    }}><span>{choice.label}</span>{selected === choice.value && <Check size={17} aria-hidden="true" />}</button>)}</div>
  </div>;
}
