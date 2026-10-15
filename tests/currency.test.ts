import { describe, expect, it } from "vitest";
import {
  convertCurrencyMinor,
  formatDisplayMoney,
  parseCurrency,
  parseUsdRate,
} from "@/lib/currency";

describe("browsing currencies", () => {
  it("keeps LKR as the default and rejects unsupported preferences", () => {
    expect(parseCurrency("USD")).toBe("USD");
    expect(parseCurrency("EUR")).toBe("LKR");
    expect(parseCurrency(null)).toBe("LKR");
  });
  it("converts minor units and rounds once without changing the source amount", () => {
    expect(convertCurrencyMinor(690000, "LKR", "USD", 0.003)).toBe(2070);
    expect(convertCurrencyMinor(2070, "USD", "LKR", 0.003)).toBe(690000);
    expect(convertCurrencyMinor(105, "LKR", "USD", 0.015)).toBe(2);
    expect(convertCurrencyMinor(0, "LKR", "USD", 0.003)).toBe(0);
  });
  it("never relabels an unconverted price when the rate is unavailable", () => {
    expect(convertCurrencyMinor(690000, "LKR", "USD", null)).toBeNull();
    expect(convertCurrencyMinor(690000, "LKR", "USD", Number.NaN)).toBeNull();
    expect(formatDisplayMoney(690000, "LKR", "USD", null)).toContain("LKR");
    expect(formatDisplayMoney(690000, "LKR", "USD", 0.003)).toBe("≈ $20.70");
    expect(convertCurrencyMinor(-100, "LKR", "USD", 0.003)).toBeNull();
  });
  it("accepts recent validated feed data and rejects stale or incorrect currencies", () => {
    const now = Date.UTC(2026, 9, 14);
    const payload = {
      result: "success",
      base_code: "LKR",
      time_last_update_unix: now / 1000,
      rates: { USD: 0.003 },
    };
    expect(parseUsdRate(payload, now)).toBe(0.003);
    expect(parseUsdRate({ ...payload, base_code: "USD" }, now)).toBeNull();
    expect(
      parseUsdRate(
        { ...payload, time_last_update_unix: now / 1000 - 4 * 86400 },
        now,
      ),
    ).toBeNull();
    expect(parseUsdRate({ ...payload, rates: { USD: -2 } }, now)).toBeNull();
  });
});
