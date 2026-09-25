import { describe, expect, it } from "vitest";
import { DEFAULT_PHONE_COUNTRY, PHONE_COUNTRIES, findPhoneCountry, nationalNumber, normalizePhone } from "@/lib/phone";

describe("phone numbers", () => {
  it("defaults to Sri Lanka and lists it first", () => {
    expect(DEFAULT_PHONE_COUNTRY).toBe("LK");
    expect(PHONE_COUNTRIES[0].code).toBe("LK");
    expect(new Set(PHONE_COUNTRIES.map((country) => country.code)).size).toBe(PHONE_COUNTRIES.length);
  });

  it("accepts the ways people write a Sri Lankan mobile number", () => {
    for (const typed of ["771234567", "0771234567", "077 123 4567", "077-123-4567", "+94 77 123 4567", "0094771234567"]) {
      expect(normalizePhone("LK", typed), typed).toBe("+94771234567");
    }
  });

  it("rejects numbers of the wrong length or country", () => {
    expect(normalizePhone("LK", "07712345")).toBeNull();
    expect(normalizePhone("LK", "07712345678")).toBeNull();
    expect(normalizePhone("LK", "+91 98765 43210")).toBeNull();
    expect(normalizePhone("XX", "771234567")).toBeNull();
    expect(normalizePhone("LK", "")).toBeNull();
  });

  it("handles other countries' lengths", () => {
    expect(normalizePhone("IN", "98765 43210")).toBe("+919876543210");
    expect(normalizePhone("GB", "07400 123456")).toBe("+447400123456");
    expect(normalizePhone("MV", "771 2345")).toBe("+9607712345");
  });

  it("splits a stored number back out for the form", () => {
    expect(nationalNumber("+94771234567", "LK")).toBe("771234567");
    expect(nationalNumber("+94771234567", "IN")).toBe("");
    expect(nationalNumber(null, "LK")).toBe("");
    expect(findPhoneCountry("LK")?.dial).toBe("+94");
  });
});
