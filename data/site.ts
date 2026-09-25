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
