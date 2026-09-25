import { describe, expect, it } from "vitest";
import { translations } from "@/lib/i18n";
import { PASSWORD_RULES } from "@/lib/password-rules";

const unmet = (password: string) => PASSWORD_RULES.filter((rule) => !rule.met(password)).map((rule) => rule.key);

describe("password rules checklist", () => {
  it("starts with every rule unmet", () => {
    expect(unmet("")).toEqual(["authRuleLength", "authRuleUpper", "authRuleLower", "authRuleNumber", "authRuleSymbol"]);
  });

  it("ticks each rule independently", () => {
    expect(unmet("abcdefgh")).toEqual(["authRuleUpper", "authRuleNumber", "authRuleSymbol"]);
    expect(unmet("Ab1!")).toEqual(["authRuleLength"]);
    expect(unmet("Night-Walk 7")).toEqual([]);
  });

  it("has a label for every rule in both languages", () => {
    for (const rule of PASSWORD_RULES) {
      expect(translations.en[rule.key]).toBeTruthy();
      expect(translations.si[rule.key]).toBeTruthy();
    }
  });
});
