"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  CURRENCY_COOKIE,
  formatDisplayMoney,
  parseCurrency,
  type StoreCurrency,
} from "@/lib/currency";

type CurrencyContextValue = {
  currency: StoreCurrency;
  setCurrency: (value: StoreCurrency) => void;
  formatPrice: (amount: number, source?: string) => string;
  usdRate: number | null;
  commerceEnabled: boolean;
};
const CurrencyContext = createContext<CurrencyContextValue | null>(null);

function saveCurrency(currency: StoreCurrency) {
  document.cookie = `${CURRENCY_COOKIE}=${currency}; path=/; max-age=31536000; samesite=lax${location.protocol === "https:" ? "; secure" : ""}`;
  try {
    localStorage.setItem(CURRENCY_COOKIE, currency);
  } catch {
    /* Cookie still persists the preference. */
  }
}

export function CurrencyProvider({
  children,
  initialCurrency,
  usdRate,
  commerceEnabled,
}: {
  children: ReactNode;
  initialCurrency: StoreCurrency;
  usdRate: number | null;
  commerceEnabled: boolean;
}) {
  const [currency, setChosenCurrency] = useState(initialCurrency);
  const setCurrency = useCallback((next: StoreCurrency) => {
    saveCurrency(next);
    setChosenCurrency(next);
  }, []);
  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key !== CURRENCY_COOKIE) return;
      const next = parseCurrency(event.newValue);
      saveCurrency(next);
      setChosenCurrency(next);
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);
  const value = useMemo(
    () => ({
      currency,
      setCurrency,
      usdRate,
      commerceEnabled,
      formatPrice: (amount: number, source = "LKR") =>
        formatDisplayMoney(amount, source, currency, usdRate),
    }),
    [currency, setCurrency, usdRate, commerceEnabled],
  );
  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (!context)
    throw new Error("useCurrency must be used inside CurrencyProvider");
  return context;
}
