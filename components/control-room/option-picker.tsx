"use client";
import { RoundedSelect } from "@/components/control-room/rounded-select";
import { useId, useState } from "react";
import { editorChanged } from "@/components/control-room/editor-dialog";
import { X, Plus } from "lucide-react";
import { parseList } from "@/lib/store-admin-validation";
import { useLanguage } from "@/components/language-provider";

/** Preset dropdown plus custom entry; the submitted value stays server-validated. */
export function OptionPicker({ id, name, value, options, maxLength, onChange, "aria-describedby": describedBy }: {
  id?: string; "aria-describedby"?: string; name: string; value: string; options: string[]; maxLength: number; onChange: (value: string) => void;
}) {
  const { t } = useLanguage();
  const customId = useId();
  const [custom, setCustom] = useState("");
  const selected = parseList(value);
  const available = options.filter(option => !selected.some(item => item.toLowerCase() === option.toLowerCase()));
  const add = (text: string) => { const next = parseList([...selected, text].join(", ")); if (next.length <= 12) { onChange(next.join(", ")); setCustom(""); } };
  return <div className="crs-option-picker" onClickCapture={event => { if ((event.target as HTMLElement).closest("button")) editorChanged(event.currentTarget); }}>
    <input type="hidden" name={name} value={value} />
    <RoundedSelect id={id} aria-describedby={describedBy} value="" disabled={selected.length >= 12} onValueChange={value => add(value)}>
      <option value="">{t.crChooseOption}</option>{available.map(option => <option key={option}>{option}</option>)}
    </RoundedSelect>
    <div className="crs-custom-option"><input id={customId} aria-label={`${t.crCustomOption}: ${name}`} placeholder={t.crCustomOption} maxLength={maxLength} value={custom} disabled={selected.length >= 12} onChange={event => setCustom(event.target.value.replace(/[,|]/g, ""))} onKeyDown={event => { if (event.key === "Enter") { event.preventDefault(); if (custom.trim()) add(custom); } }} />
      <button type="button" className="button button-secondary" disabled={!custom.trim() || selected.length >= 12} aria-label={`${t.crAddOption}: ${name}`} onClick={() => add(custom)}><Plus size={16} /></button>
    </div>
    {selected.length > 0 && <ul className="crs-option-tags">{selected.map(item => <li key={item}>{item}<button type="button" aria-label={`${t.crRemoveOption} ${item}`} onClick={() => onChange(selected.filter(value => value !== item).join(", "))}><X size={14} /></button></li>)}</ul>}
    <small className="crs-hint">{selected.length}/12</small>
  </div>;
}
