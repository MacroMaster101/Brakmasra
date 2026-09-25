"use client";

import { usePathname } from "next/navigation";

import { BackToTop } from "@/components/back-to-top";
import { CartProvider } from "@/components/cart-provider";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { LanguageProvider } from "@/components/language-provider";
import { ScrollRestoration } from "@/components/scroll-restoration";
import type { Language } from "@/lib/i18n";
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
  launchMode,
  member,
}: Readonly<{ children: React.ReactNode; initialLang: Language; launchMode: boolean; member: MemberSummary | null }>) {
  const pathname = usePathname();
  const isFocusedAuthPage = focusedAuthRoutes.has(pathname);

  return (
    <LanguageProvider initialLang={initialLang}>
      <CartProvider>
        <ScrollRestoration />
        {!isFocusedAuthPage && <Header commerceEnabled={!launchMode} member={member} />}
        <main id="content">{children}</main>
        {!isFocusedAuthPage && <Footer />}
        {!isFocusedAuthPage && <BackToTop />}
      </CartProvider>
    </LanguageProvider>
  );
}
