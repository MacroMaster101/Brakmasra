"use client";
import { useCurrency } from "@/components/currency-provider";
import { useLanguage } from "@/components/language-provider";
import { PreferenceMenu } from "@/components/preference-menu";
import { parseCurrency } from "@/lib/currency";
export function CurrencySwitcher({
  placement = "down",
}: {
  placement?: "down" | "up";
}) {
  const { currency, setCurrency } = useCurrency();
  const { t } = useLanguage();
  return (
    <PreferenceMenu
      className="currency-switcher"
      label={t.storeCurrency}
      value={currency}
      options={[
        {
          value: "LKR",
          label: "LKR",
          flag: "/images/flags/lk.svg",
          description: t.storeLkrName,
        },
        {
          value: "USD",
          label: "USD",
          flag: "/images/flags/us.svg",
          description: t.storeUsdName,
        },
      ]}
      onChange={(value) => setCurrency(parseCurrency(value))}
      placement={placement}
    />
  );
}
export function CurrencyConversionNote({
  attribution = false,
}: {
  attribution?: boolean;
}) {
  const { currency, usdRate, commerceEnabled } = useCurrency();
  const { t } = useLanguage();
  if (currency !== "USD" || !commerceEnabled) return null;
  return (
    <p className="currency-conversion-note">
      {usdRate ? t.storeCurrencyEstimate : t.storeCurrencyUnavailable}
      {usdRate && attribution && (
        <>
          {" "}
          <a
            href="https://www.exchangerate-api.com"
            target="_blank"
            rel="noopener noreferrer"
          >
            {t.storeExchangeRates}
          </a>
        </>
      )}
    </p>
  );
}
