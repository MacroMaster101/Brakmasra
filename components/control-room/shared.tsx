"use client";

import type { ReactNode } from "react";
import { CircleAlert, Eye, PlugZap, type LucideIcon } from "lucide-react";

import type { ControlRoomActionState } from "@/app/admin/actions";
import { useLanguage } from "@/components/language-provider";
import type { SectionData } from "@/lib/control-room-validation";
import { localizeServerMessage, type TextKey } from "@/lib/i18n";

export function SectionPanel({ id, title, desc, actions, children }: {
  id: string;
  title: TextKey;
  desc: TextKey;
  actions?: ReactNode;
  children: ReactNode;
}) {
  const { t } = useLanguage();
  return (
    <section className="panel cr-panel" aria-labelledby={id}>
      <header className="cr-panel-heading">
        <div>
          <h2 id={id}>{t[title]}</h2>
          <p>{t[desc]}</p>
        </div>
        {actions}
      </header>
      {children}
    </section>
  );
}

export function EmptyState({ icon: Icon, title, desc }: { icon: LucideIcon; title: TextKey; desc: TextKey }) {
  const { t } = useLanguage();
  return (
    <div className="cr-empty">
      <Icon aria-hidden="true" />
      <h3>{t[title]}</h3>
      <p>{t[desc]}</p>
    </div>
  );
}

const unavailable: Record<Exclude<SectionData<unknown>["kind"], "ready">, { icon: LucideIcon; title: TextKey; desc: TextKey }> = {
  preview: { icon: Eye, title: "crPreviewTitle", desc: "crPreviewDesc" },
  "not-configured": { icon: PlugZap, title: "crNotConfiguredTitle", desc: "crNotConfiguredDesc" },
  error: { icon: CircleAlert, title: "crLoadErrorTitle", desc: "crLoadErrorDesc" },
};

/** Renders the data when it loaded, otherwise the preview, setup, or error state. */
export function SectionGate<T>({ data, children }: { data: SectionData<T>; children: (value: T) => ReactNode }) {
  if (data.kind === "ready") return children(data.data);
  return <EmptyState {...unavailable[data.kind]} />;
}

export function ActionStatus({ state }: { state: ControlRoomActionState }) {
  const { lang } = useLanguage();
  const tone = state.status === "error" ? " is-error" : state.status === "success" ? " is-success" : "";
  return (
    <p className={`cr-action-status${tone}`} role={state.status === "error" ? "alert" : "status"} aria-live="polite">
      {state.message ? localizeServerMessage(state.message, lang) : ""}
    </p>
  );
}

/** A status pill; `tone` picks the colour, the label is already translated. */
export function StatusPill({ tone, children }: { tone: string; children: ReactNode }) {
  return <em className={`cr-status is-${tone}`}>{children}</em>;
}
