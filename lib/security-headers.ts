import { avatarImageSources } from "@/lib/avatar";

const DEVELOPMENT = "development";

export function createContentSecurityPolicy(
  nonce: string,
  nodeEnv = process.env.NODE_ENV,
  supabaseUrl = process.env.SUPABASE_URL,
) {
  const isDevelopment = nodeEnv === DEVELOPMENT;
  const scriptSources = ["'self'", `'nonce-${nonce}'`, "'strict-dynamic'"];
  // Next/Image and React apply responsive layout through style attributes. CSP
  // nonces cannot be attached to style attributes, so keep styles compatible
  // while scripts remain protected by a per-request nonce and strict-dynamic.
  const styleSources = ["'self'", "'unsafe-inline'"];

  if (isDevelopment) scriptSources.push("'unsafe-eval'");

  return [
    "default-src 'self'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "object-src 'none'",
    `script-src ${scriptSources.join(" ")}`,
    `style-src ${styleSources.join(" ")}`,
    // blob: previews a chosen photo before upload; the rest serve profile photos.
    ["img-src 'self' data: blob:", ...avatarImageSources(supabaseUrl)].join(" "),
    "font-src 'self' data:",
    `connect-src 'self'${isDevelopment ? " ws: wss:" : ""}`,
    "frame-src 'none'",
    "media-src 'self'",
    ...(!isDevelopment ? ["upgrade-insecure-requests"] : []),
  ].join("; ");
}
