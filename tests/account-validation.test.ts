import { describe, expect, it } from "vitest";

import {
  PHONE_INVALID_MESSAGE,
  changeEmailSchema,
  firstIssue,
  formText,
  isInvalidNonce,
  needsReauthentication,
  parseProfile,
  passwordUpdateSchema,
  sameEmail,
} from "@/lib/account-validation";

const strong = "Str0ng!pass";

function passwordInput(overrides: Partial<Record<"password" | "confirmPassword" | "currentPassword" | "nonce", string>> = {}) {
  return { password: strong, confirmPassword: strong, currentPassword: "", nonce: "", ...overrides };
}

describe("parseProfile", () => {
  it("trims the name and stores a Sri Lankan number in E.164", () => {
    expect(parseProfile({ displayName: "  Nimal Perera ", phoneCountry: "LK", phone: "077 123 4567" })).toEqual({
      ok: true,
      data: { displayName: "Nimal Perera", phone: "+94771234567", phoneCountry: "LK" },
    });
  });

  it("clears the phone when the number is blank or missing", () => {
    expect(parseProfile({ displayName: "Nimal", phoneCountry: "LK", phone: "   " })).toEqual({
      ok: true,
      data: { displayName: "Nimal", phone: null, phoneCountry: null },
    });
    expect(parseProfile({ displayName: "Nimal", phoneCountry: null, phone: null })).toMatchObject({ ok: true });
  });

  it("rejects short or overlong names", () => {
    expect(parseProfile({ displayName: "N", phoneCountry: "LK", phone: "" })).toEqual({ ok: false, message: "Enter your name." });
    expect(parseProfile({ displayName: "x".repeat(81), phoneCountry: "LK", phone: "" })).toEqual({
      ok: false,
      message: "Use 80 characters or fewer for your name.",
    });
  });

  it("rejects numbers that do not fit the country, and unknown countries", () => {
    expect(parseProfile({ displayName: "Nimal", phoneCountry: "LK", phone: "12345" })).toEqual({ ok: false, message: PHONE_INVALID_MESSAGE });
    expect(parseProfile({ displayName: "Nimal", phoneCountry: "ZZ", phone: "0771234567" })).toEqual({ ok: false, message: PHONE_INVALID_MESSAGE });
  });
});

describe("changeEmailSchema", () => {
  it("normalises case and whitespace", () => {
    expect(changeEmailSchema.parse({ email: "  New@Example.COM " })).toEqual({ email: "new@example.com" });
  });

  it("rejects invalid addresses", () => {
    const result = changeEmailSchema.safeParse({ email: "not-an-email" });
    expect(result.success).toBe(false);
    if (!result.success) expect(firstIssue(result)).toBe("Enter a valid email address.");
  });

  it("compares emails without case or spacing", () => {
    expect(sameEmail("Me@Example.com ", "me@example.com")).toBe(true);
    expect(sameEmail("me@example.com", "you@example.com")).toBe(false);
  });
});

describe("passwordUpdateSchema", () => {
  it("accepts a strong matching password with or without a 6-digit code", () => {
    expect(passwordUpdateSchema.safeParse(passwordInput()).success).toBe(true);
    expect(passwordUpdateSchema.safeParse(passwordInput({ nonce: "123456" })).success).toBe(true);
  });

  it("enforces the sign-up password rules", () => {
    for (const password of ["short1!", "alllowercase1!", "ALLUPPERCASE1!", "NoDigits!!", "NoSymbols123"]) {
      const result = passwordUpdateSchema.safeParse(passwordInput({ password, confirmPassword: password }));
      expect(result.success, password).toBe(false);
    }
  });

  it("requires the confirmation to match", () => {
    const result = passwordUpdateSchema.safeParse(passwordInput({ confirmPassword: "Different1!" }));
    expect(result.success).toBe(false);
    if (!result.success) expect(firstIssue(result)).toBe("Passwords do not match.");
  });

  it("rejects malformed codes", () => {
    for (const nonce of ["12345", "1234567", "abcdef"]) {
      const result = passwordUpdateSchema.safeParse(passwordInput({ nonce }));
      expect(result.success, nonce).toBe(false);
      if (!result.success) expect(firstIssue(result)).toBe("Enter the 6-digit code from the email.");
    }
  });
});

describe("reauthentication errors", () => {
  it("detects when Supabase needs a fresh sign-in", () => {
    expect(needsReauthentication({ code: "reauthentication_needed", message: "Password update requires reauthentication" })).toBe(true);
    expect(needsReauthentication({ message: "Password update requires reauthentication" })).toBe(true);
    expect(needsReauthentication({ code: "reauthentication_not_valid", message: "Requires reauthentication" })).toBe(false);
    expect(needsReauthentication({ code: "same_password", message: "New password should be different" })).toBe(false);
    expect(needsReauthentication(null)).toBe(false);
  });

  it("detects a wrong or expired code", () => {
    expect(isInvalidNonce({ code: "reauthentication_not_valid", message: "Requires reauthentication" })).toBe(true);
    expect(isInvalidNonce({ message: "Invalid nonce" })).toBe(true);
    expect(isInvalidNonce({ code: "weak_password", message: "Password is too weak" })).toBe(false);
    expect(isInvalidNonce(undefined)).toBe(false);
  });
});

describe("formText", () => {
  it("turns missing fields into empty strings", () => {
    expect(formText(null)).toBe("");
    expect(formText("value")).toBe("value");
  });
});
