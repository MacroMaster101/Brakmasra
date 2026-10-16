import type { Language } from "@/lib/i18n";

export const contactCopy: Record<Language, { formTitle: string; formDescription: string; imageAlt: string }> = {
  en: {
    formTitle: "Send us a message.",
    formDescription: "A question, an idea, or something we can help with. Start here.",
    imageAlt: "White and washed black BRAKMASRA graphic tees arranged on a grey concrete plinth",
  },
  si: {
    formTitle: "අපට පණිවිඩයක් එවන්න.",
    formDescription: "ප්‍රශ්නයක්, අදහසක් හෝ අපෙන් උදව්වක් අවශ්‍යද? මෙතැනින් අරඹන්න.",
    imageAlt: "අළු කොන්ක්‍රීට් පීඨයක් මත තබා ඇති සුදු සහ කළු BRAKMASRA රූ රටා ටී ෂර්ට්",
  },
};
