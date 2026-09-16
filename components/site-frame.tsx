"use client";

import { usePathname } from "next/navigation";

import { BackToTop } from "@/components/back-to-top";
import { CartProvider } from "@/components/cart-provider";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { LanguageProvider } from "@/components/language-provider";
import { ScrollRestoration } from "@/components/scroll-restoration";

const focusedAuthRoutes = new Set([
  "/forgot-password",
  "/login",
  "/reset-password",
  "/signup",
]);

export function SiteFrame({ children, launchMode }: Readonly<{ children: React.ReactNode; launchMode: boolean }>) {
  const pathname = usePathname();
  const isFocusedAuthPage = focusedAuthRoutes.has(pathname);

  return (
    <LanguageProvider>
      <CartProvider>
        <ScrollRestoration />
        {!isFocusedAuthPage && <Header commerceEnabled={!launchMode} />}
        <main id="content">{children}</main>
        {!isFocusedAuthPage && <Footer />}
        {!isFocusedAuthPage && <BackToTop />}
      </CartProvider>
    </LanguageProvider>
  );
}
