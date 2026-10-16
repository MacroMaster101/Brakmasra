"use client";
import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { X, Check } from "lucide-react";
import type { ControlRoomActionState } from "@/app/admin/actions";
import { useLanguage } from "@/components/language-provider";
import { localizeServerMessage } from "@/lib/i18n";

const NotificationsContext = createContext<(state: ControlRoomActionState) => void>(() => {});
export function DashboardNotifications({ children }: { children: React.ReactNode }) {
  const { lang } = useLanguage();
  const [notice, setNotice] = useState<{ message: string; at: number } | null>(null);
  const notify = useCallback((state: ControlRoomActionState) => {
    if (state.status === "success" && state.message) setNotice({ message: state.message, at: Date.now() });
  }, []);
  useEffect(() => {
    if (!notice) return;
    const timeout = setTimeout(() => setNotice(null), 7000);
    return () => clearTimeout(timeout);
  }, [notice]);
  return <NotificationsContext.Provider value={notify}>{children}{notice && <div className="dashboard-toast" role="status" aria-live="polite"><Check aria-hidden="true" size={20} /><span>{localizeServerMessage(notice.message, lang)}</span><button type="button" aria-label={lang === "si" ? "පණිවිඩය වසන්න" : "Dismiss notification"} onClick={() => setNotice(null)}><X size={18} aria-hidden="true" /></button></div>}</NotificationsContext.Provider>;
}
export const useDashboardNotify = () => useContext(NotificationsContext);
