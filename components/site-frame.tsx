"use client";

import { usePathname } from "next/navigation";

import { CartProvider } from "@/components/cart-provider";
import { ContentScope } from "@/components/content-provider";
import { CurrencyProvider } from "@/components/currency-provider";
import { FloatingActions } from "@/components/floating-actions";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { LanguageProvider } from "@/components/language-provider";
import { ScrollRestoration } from "@/components/scroll-restoration";
import type { Language } from "@/lib/i18n";
import type { StoreCurrency } from "@/lib/currency";
import type { MemberSummary } from "@/lib/member";
import type { ShopMenu } from "@/data/shop-menu";

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
  shopMenu,
}: Readonly<{
  children: React.ReactNode;
  initialLang: Language;
  initialCurrency: StoreCurrency;
  usdRate: number | null;
  launchMode: boolean;
  member: MemberSummary | null;
  shopMenu: ShopMenu;
}>) {
  const pathname = usePathname();
  const isFocusedAuthPage = focusedAuthRoutes.has(pathname);
  const isDashboard = pathname === "/admin" || pathname.startsWith("/admin/");

  return (
    <ContentScope pathname={pathname}>
    <LanguageProvider initialLang={initialLang}>
      <CurrencyProvider
        initialCurrency={initialCurrency}
        usdRate={usdRate}
        commerceEnabled={!launchMode}
      >
        <CartProvider>
          <ScrollRestoration />
          {!isFocusedAuthPage && !isDashboard && (
            <Header commerceEnabled={!launchMode} member={member} shopMenu={shopMenu} />
          )}
          <main
            id="content"
            className={isFocusedAuthPage ? "auth-main" : isDashboard ? "dashboard-main" : undefined}
          >
            {children}
          </main>
          {!isFocusedAuthPage && !isDashboard && <Footer />}
          {/* Staff screens skip the customer chat button. */}
          {!isFocusedAuthPage && !isDashboard && (
            <FloatingActions showWhatsApp={!pathname.startsWith("/admin")} />
          )}
        </CartProvider>
      </CurrencyProvider>
    </LanguageProvider>
    </ContentScope>
  );
}
