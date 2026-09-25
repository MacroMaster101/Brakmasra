import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { formatDate, localizeServerMessage, parseLanguage, translations } from "@/lib/i18n";

const root = process.cwd();
const messageSources = [
  "app/account/actions.ts",
  "app/account/avatar-actions.ts",
  "app/admin/actions.ts",
  "app/admin/store-actions.ts",
  "app/api/checkout/route.ts",
  "app/api/contact/route.ts",
  "app/api/newsletter/route.ts",
  "app/auth/actions.ts",
  "lib/account-validation.ts",
  "lib/control-room-validation.ts",
  "lib/store-admin-validation.ts",
];

/** Every string literal a route or action can hand back to a form as feedback. */
function serverMessages() {
  const patterns = [/message:\s*"([^"]+)"/g, /\.(?:email|min|max|regex)\([^"]*"([^"]+)"\)/g, /\|\|\s*"([^"]+)"/g];
  return messageSources.flatMap((file) => {
    const source = readFileSync(join(root, file), "utf8");
    return patterns
      .flatMap((pattern) => [...source.matchAll(pattern)].map((match) => match[1]))
      // Feedback is always a full sentence; this skips other literals such as "true".
      .filter((text) => text.includes(" ") && text.endsWith("."));
  });
}

describe("translations", () => {
  it("fills every Sinhala entry", () => {
    for (const [key, value] of Object.entries(translations.si)) {
      if (typeof value === "string") expect(value.trim(), key).not.toBe("");
    }
  });

  it("treats anything other than si as English", () => {
    expect(parseLanguage("si")).toBe("si");
    expect(parseLanguage("en")).toBe("en");
    expect(parseLanguage("fr")).toBe("en");
    expect(parseLanguage(undefined)).toBe("en");
  });

  it("has a Sinhala version of every server feedback message", () => {
    const messages = serverMessages();
    expect(messages.length).toBeGreaterThan(20);
    for (const message of messages) {
      expect(localizeServerMessage(message, "si"), message).not.toBe(message);
    }
  });

  it("leaves English and unknown messages unchanged", () => {
    expect(localizeServerMessage("Request too large.", "en")).toBe("Request too large.");
    expect(localizeServerMessage("Something new", "si")).toBe("Something new");
  });

  it("formats dates the same way on server and browser", () => {
    expect(formatDate("2026-09-24", "en")).toBe("September 24, 2026");
    expect(formatDate("2026-09-24", "si")).toBe("2026 සැප්තැම්බර් 24");
    expect(formatDate("2026-01-05T23:30:00Z", "en", { day: false })).toBe("January 2026");
    expect(formatDate("2026-01-05T23:30:00Z", "si", { day: false })).toBe("2026 ජනවාරි");
  });
});
