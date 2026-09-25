import type { TextKey } from "@/lib/i18n";

export type PasswordRule = { key: TextKey; met: (password: string) => boolean };

// Mirrors the server's new-password schema (app/auth/actions.ts and
// lib/account-validation.ts), which stays the source of truth on submit.
export const PASSWORD_RULES: PasswordRule[] = [
  { key: "authRuleLength", met: (password) => password.length >= 8 },
  { key: "authRuleUpper", met: (password) => /[A-Z]/.test(password) },
  { key: "authRuleLower", met: (password) => /[a-z]/.test(password) },
  { key: "authRuleNumber", met: (password) => /[0-9]/.test(password) },
  { key: "authRuleSymbol", met: (password) => /[^A-Za-z0-9]/.test(password) },
];
