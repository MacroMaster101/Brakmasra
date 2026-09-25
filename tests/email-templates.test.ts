import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { RESET_CODE_LENGTH } from "@/lib/reset-code";

const root = process.cwd();
const config = readFileSync(join(root, "supabase/config.toml"), "utf8");

// Variables Supabase documents for each template (Authentication > Emails).
// {{ .ConfirmationURL }} is deliberately excluded: its PKCE link only works in
// the browser that started the flow, so every link uses token_hash instead.
const authVariables = ["Token", "TokenHash", "SiteURL", "RedirectTo", "Email", "Data"];
const allowed: Record<string, string[]> = {
  confirmation: authVariables,
  invite: authVariables,
  magic_link: authVariables,
  email_change: [...authVariables, "NewEmail"],
  recovery: authVariables,
  reauthentication: ["Token", "SiteURL", "Email", "Data"],
  password_changed: ["Email", "Data", "SiteURL"],
  email_changed: ["Email", "OldEmail", "Data", "SiteURL"],
  phone_changed: ["Email", "Phone", "OldPhone", "Data", "SiteURL"],
  identity_linked: ["Email", "Provider", "Data", "SiteURL"],
  identity_unlinked: ["Email", "Provider", "Data", "SiteURL"],
  mfa_factor_enrolled: ["Email", "FactorType", "Data", "SiteURL"],
  mfa_factor_unenrolled: ["Email", "FactorType", "Data", "SiteURL"],
};

// Types accepted by app/auth/confirm/route.ts.
const confirmTypes = ["email", "email_change", "invite", "magiclink", "recovery", "signup"];

const sections = [...config.matchAll(/\[auth\.email\.(?:template|notification)\.([a-z_]+)\][^[]*?content_path = "\.\/(supabase\/templates\/[a-z_]+\.html)"/g)]
  .map(([, name, path]) => ({ name, html: readFileSync(join(root, path), "utf8"), path }));

describe("email templates", () => {
  it("registers every Supabase email", () => {
    expect(sections.map((section) => section.name).sort()).toEqual(Object.keys(allowed).sort());
    for (const { path } of sections) expect(existsSync(join(root, path)), path).toBe(true);
  });

  it.each(sections.map((section) => [section.name, section] as const))("%s uses only its documented variables", (name, { html }) => {
    const used = [...html.matchAll(/\{\{\s*\.(\w+)\s*\}\}/g)].map(([, variable]) => variable);
    for (const variable of used) expect(allowed[name], `{{ .${variable} }}`).toContain(variable);
  });

  it.each(sections.map((section) => [section.name, section] as const))("%s links only to working confirm URLs", (_name, { html }) => {
    const links = [...html.matchAll(/href="([^"]*)"/g)].map(([, href]) => href);
    for (const link of links.filter((href) => href.includes("/auth/confirm") || href.includes(".RedirectTo"))) {
      expect(link).toContain("token_hash={{ .TokenHash }}");
      expect(confirmTypes).toContain(/type=([a-z_]+)/.exec(link)?.[1]);
    }
  });

  it("sends the password reset as a code matching the code form", () => {
    const recovery = sections.find((section) => section.name === "recovery")!.html;
    expect(recovery).toContain("{{ .Token }}");
    expect(recovery).not.toContain("/auth/confirm");
    expect(config).toMatch(new RegExp(`\\[auth\\.email\\][^[]*otp_length = ${RESET_CODE_LENGTH}\\b`));
  });
});
