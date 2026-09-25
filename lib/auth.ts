import { isStaff, parseRole } from "@/lib/roles";

export function getSiteUrl() {
  const value = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  return new URL(value.startsWith("http") ? value : `https://${value}`).origin;
}

export function safeRedirectPath(value: FormDataEntryValue | string | null | undefined, fallback = "/account") {
  if (typeof value !== "string" || !value.startsWith("/")) {
    return fallback;
  }

  // Browsers treat backslashes as path separators in special URLs, so a value
  // such as `/\\evil.example` can otherwise resolve to another origin.
  if (/[\\\u0000-\u001f\u007f]/.test(value)) return fallback;

  try {
    const base = new URL("https://redirect.invalid");
    const destination = new URL(value, base);
    if (destination.origin !== base.origin) return fallback;

    let decoded = value;
    for (let pass = 0; pass < 2; pass += 1) {
      decoded = decodeURIComponent(decoded);
      if (decoded.startsWith("//") || /[\\\u0000-\u001f\u007f]/.test(decoded)) return fallback;
    }

    return `${destination.pathname}${destination.search}${destination.hash}`;
  } catch {
    return fallback;
  }
}

export function getAuthCallbackUrl(next: FormDataEntryValue | string | null | undefined) {
  const callbackUrl = new URL("/auth/confirm", getSiteUrl());
  callbackUrl.searchParams.set("next", safeRedirectPath(next));
  return callbackUrl.toString();
}

export function getAuthEnvironment() {
  const url = process.env.SUPABASE_URL;
  const publishableKey = process.env.SUPABASE_PUBLISHABLE_KEY;

  if (!url || !publishableKey) {
    throw new Error("Supabase Auth is not configured.");
  }

  return { publishableKey, url };
}

/** True for Web Dev, Owner, and Staff (and the legacy "admin" name). Supporters are not staff. */
export function isStaffRole(value: unknown) {
  return isStaff(parseRole(value));
}
