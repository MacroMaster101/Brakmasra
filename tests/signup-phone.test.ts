import { describe, expect, it } from "vitest";
import { parsePhoneInput } from "@/lib/phone-input";

describe("optional phone input", () => {
  it("stores nothing when the number is blank or missing", () => {
    expect(parsePhoneInput("LK", "")).toEqual({ ok: true, value: null });
    expect(parsePhoneInput("LK", "   ")).toEqual({ ok: true, value: null });
    expect(parsePhoneInput("LK", null)).toEqual({ ok: true, value: null });
    // The country does not matter when no number was typed.
    expect(parsePhoneInput("ZZ", "")).toEqual({ ok: true, value: null });
    expect(parsePhoneInput(null, undefined)).toEqual({ ok: true, value: null });
  });

  it("normalizes a valid number to E.164 with its country", () => {
    expect(parsePhoneInput("LK", "077 123 4567")).toEqual({
      ok: true,
      value: { phone: "+94771234567", phone_country: "LK" },
    });
    expect(parsePhoneInput("GB", "07400 123456")).toEqual({
      ok: true,
      value: { phone: "+447400123456", phone_country: "GB" },
    });
  });

  it("rejects numbers that do not fit the selected country", () => {
    expect(parsePhoneInput("LK", "07712345")).toEqual({ ok: false });
    expect(parsePhoneInput("LK", "+91 98765 43210")).toEqual({ ok: false });
    expect(parsePhoneInput("LK", "not a number")).toEqual({ ok: false });
  });

  it("rejects unknown countries and unexpected values", () => {
    expect(parsePhoneInput("ZZ", "0771234567")).toEqual({ ok: false });
    expect(parsePhoneInput(null, "0771234567")).toEqual({ ok: false });
    expect(parsePhoneInput("lk", "0771234567")).toEqual({ ok: false });
    expect(parsePhoneInput("LK", 771234567)).toEqual({ ok: false });
    expect(parsePhoneInput("LK", `077${"1".repeat(40)}`)).toEqual({ ok: false });
  });
});
