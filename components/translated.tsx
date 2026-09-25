"use client";

import { useLanguage } from "@/components/language-provider";
import type { TextKey } from "@/lib/i18n";

/** Renders one dictionary entry, so server components can show translated copy. */
export function Translated({ k }: { k: TextKey }) {
  const { t } = useLanguage();
  return t[k];
}
