import { formatMoney } from "@/lib/cart";

export type StoreCurrency = "LKR" | "USD";
export const CURRENCY_COOKIE = "brakmasra_currency";

export function parseCurrency(value: string | null | undefined): StoreCurrency {
  return value === "USD" ? "USD" : "LKR";
}

/** Catalog amounts are integer minor units. Never mutate the charge amount. */
export function convertCurrencyMinor(
  amount: number,
  source: string,
  target: StoreCurrency,
  usdPerLkr: number | null,
): number | null {
  if (!Number.isSafeInteger(amount) || amount < 0) return null;
  if (source === target) return amount;
  if (!usdPerLkr || !Number.isFinite(usdPerLkr) || usdPerLkr <= 0) return null;
  const converted =
    source === "LKR" && target === "USD"
      ? Math.round(amount * usdPerLkr)
      : source === "USD" && target === "LKR"
        ? Math.round(amount / usdPerLkr)
        : null;
  return converted !== null && Number.isSafeInteger(converted)
    ? converted
    : null;
}

export function formatDisplayMoney(
  amount: number,
  source: string,
  target: StoreCurrency,
  usdPerLkr: number | null,
) {
  const converted = convertCurrencyMinor(amount, source, target, usdPerLkr);
  // A missing rate keeps the actual currency label; never relabel an LKR amount USD.
  if (converted === null) return formatMoney(amount, source);
  const formatted = new Intl.NumberFormat(
    target === "USD" ? "en-US" : "en-LK",
    { style: "currency", currency: target },
  ).format(converted / 100);
  return source === target ? formatted : `≈ ${formatted}`;
}

export function parseUsdRate(
  payload: unknown,
  now = Date.now(),
): number | null {
  if (!payload || typeof payload !== "object") return null;
  const value = payload as {
    result?: unknown;
    base_code?: unknown;
    time_last_update_unix?: unknown;
    rates?: { USD?: unknown };
  };
  const rate = value.rates?.USD;
  const updated = value.time_last_update_unix;
  if (
    value.result !== "success" ||
    value.base_code !== "LKR" ||
    typeof rate !== "number" ||
    !Number.isFinite(rate) ||
    rate <= 0 ||
    rate >= 1 ||
    typeof updated !== "number" ||
    !Number.isFinite(updated)
  )
    return null;
  const age = now - updated * 1000;
  return age >= -300_000 && age < 3 * 86_400_000 ? rate : null;
}
