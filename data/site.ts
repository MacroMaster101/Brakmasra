export const site = {
  name: "BRAKMASRA",
  tagline: "Official Store",
  slogan: "Wear the mark of the unknown.",
  description:
    "Official BRAKMASRA merchandise: dark apparel and accessories inspired by mysterious journeys and haunted places, released in limited drops.",
  summary: "Dark apparel and accessories from BRAKMASRA, released in limited, verified drops.",
  /** Public customer-support inbox (Spacemail). */
  supportEmail: "support@brakmasra.com",
};

export type SocialLink = { label: string; handle: string; href: string };

export function buildSocialLinks(env: Record<string, string | undefined>): SocialLink[] {
  return [
    { label: "TikTok", handle: "@Brakmasraofficial", href: env.NEXT_PUBLIC_TIKTOK_URL },
    { label: "Facebook", handle: "@Brakmasra", href: env.NEXT_PUBLIC_FACEBOOK_URL },
    { label: "X", handle: "@Brakmasra", href: env.NEXT_PUBLIC_X_URL },
  ].filter((item): item is SocialLink => Boolean(item.href));
}

// Literal process.env reads so Next.js can inline the public values.
export const socialLinks = buildSocialLinks({
  NEXT_PUBLIC_TIKTOK_URL: process.env.NEXT_PUBLIC_TIKTOK_URL,
  NEXT_PUBLIC_FACEBOOK_URL: process.env.NEXT_PUBLIC_FACEBOOK_URL,
  NEXT_PUBLIC_X_URL: process.env.NEXT_PUBLIC_X_URL,
});

const WHATSAPP_HOSTS = new Set(["wa.me", "api.whatsapp.com"]);

/**
 * Normalizes the configured WhatsApp contact (a wa.me link or a bare number in
 * international form) to a wa.me chat link, or null when it is missing or not a
 * WhatsApp address. The chat buttons only render when this returns a link.
 */
export function buildWhatsAppLink(value: string | undefined): string | null {
  const raw = value?.trim();
  if (!raw) return null;
  if (/^\+?[\d\s()-]+$/.test(raw)) {
    const digits = raw.replace(/\D/g, "");
    return digits.length >= 8 && digits.length <= 15 ? `https://wa.me/${digits}` : null;
  }
  try {
    const url = new URL(raw);
    return url.protocol === "https:" && WHATSAPP_HOSTS.has(url.hostname) ? url.toString() : null;
  } catch {
    return null;
  }
}

/** Adds a prefilled message to a WhatsApp chat link. */
export function withWhatsAppMessage(link: string, message: string) {
  const url = new URL(link);
  url.searchParams.set("text", message);
  return url.toString();
}

export const whatsappLink = buildWhatsAppLink(process.env.NEXT_PUBLIC_WHATSAPP_URL);
