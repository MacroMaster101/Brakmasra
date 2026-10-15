"use client";

import { usePathname } from "next/navigation";

import { CartProvider } from "@/components/cart-provider";
import { CurrencyProvider } from "@/components/currency-provider";
import { FloatingActions } from "@/components/floating-actions";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { LanguageProvider } from "@/components/language-provider";
import { ScrollRestoration } from "@/components/scroll-restoration";
import type { Language } from "@/lib/i18n";
import type { StoreCurrency } from "@/lib/currency";
import type { MemberSummary } from "@/lib/member";

const focusedAuthRoutes = new Set([
  "/forgot-password",
  "/login",
  "/reset-password",
  "/signup",
]);

export function SiteFrame({
  children,
  initialLang,
  initialCurrency,
  usdRate,
  launchMode,
  member,
}: Readonly<{
  children: React.ReactNode;
  initialLang: Language;
  initialCurrency: StoreCurrency;
  usdRate: number | null;
  launchMode: boolean;
  member: MemberSummary | null;
}>) {
  const pathname = usePathname();
  const isFocusedAuthPage = focusedAuthRoutes.has(pathname);

  return (
    <LanguageProvider initialLang={initialLang}>
      <CurrencyProvider
        initialCurrency={initialCurrency}
        usdRate={usdRate}
        commerceEnabled={!launchMode}
      >
        <CartProvider>
          <ScrollRestoration />
          {!isFocusedAuthPage && (
            <Header commerceEnabled={!launchMode} member={member} />
          )}
          <main
            id="content"
            className={isFocusedAuthPage ? "auth-main" : undefined}
          >
            {children}
          </main>
          {!isFocusedAuthPage && <Footer />}
          {/* Staff screens skip the customer chat button. */}
          {!isFocusedAuthPage && (
            <FloatingActions showWhatsApp={!pathname.startsWith("/admin")} />
          )}
        </CartProvider>
      </CurrencyProvider>
    </LanguageProvider>
  );
}
