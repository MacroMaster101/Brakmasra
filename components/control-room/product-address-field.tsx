"use client";

import { useId, useState } from "react";
import { RefreshCw } from "lucide-react";
import { editorChanged } from "@/components/control-room/editor-dialog";
import { useLanguage } from "@/components/language-provider";
import { automaticProductSlug } from "@/lib/product-address";

/** Developer-only address controls. The server separately checks the viewer's role. */
export function ProductAddressField({ name, savedSlug }: { name: string; savedSlug?: string }) {
  const { t } = useLanguage();
  const id = useId();
  const [mode, setMode] = useState<"auto" | "custom">("auto");
  const [custom, setCustom] = useState(savedSlug ?? "");
  const [regenerate, setRegenerate] = useState(false);
  const generated = name.trim() ? automaticProductSlug(name) : "";
  const slug = mode === "custom" ? custom : savedSlug && !regenerate ? savedSlug : generated;
  return <div className="cr-product-address" role="group" aria-label={t.crsSlug}>
    <div className="cr-address-header">
      <span className="crs-label">{t.crsSlug}</span>
      <div className="cr-address-modes" role="radiogroup" aria-label={t.crAddressMode}>
        {(["auto", "custom"] as const).map(value => <label key={value}><input type="radio" name="slugMode" value={value} checked={mode === value} onChange={() => { if (value === "custom") setCustom(slug); else setRegenerate(false); setMode(value); }} /><span>{value === "auto" ? t.crAddressAutomatic : t.crAddressCustom}</span></label>)}
      </div>
    </div>
    {mode === "auto" ? <>
      <input type="hidden" name="slug" value={slug} />
      <input type="hidden" name="regenerateSlug" value={regenerate ? "on" : ""} />
      <div className="cr-address-preview"><code>/shop/{slug || "your-product"}</code>{savedSlug && <button type="button" className="cr-address-regenerate" disabled={!generated || generated === savedSlug || regenerate} onClick={event => { setRegenerate(true); editorChanged(event.currentTarget); }}><RefreshCw size={14} aria-hidden="true" />{t.crAddressRegenerate}</button>}</div>
    </> : <div className="cr-address-custom"><label className="sr-only" htmlFor={id}>{t.crsSlug}</label><span aria-hidden="true">/shop/</span><input id={id} name="slug" aria-describedby={`${id}-hint`} required maxLength={80} pattern="[a-z0-9]+(-[a-z0-9]+)*" autoCapitalize="none" spellCheck={false} value={custom} onChange={event => setCustom(event.target.value.toLowerCase())} /></div>}
    <small className="crs-hint" id={`${id}-hint`}>{mode === "custom" ? t.crAddressCustomHint : regenerate ? t.crAddressChanged : savedSlug ? t.crAddressStable : t.crAddressAutoHint}</small>
  </div>;
}
