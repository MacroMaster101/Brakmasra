"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { cartCount, cartKey, parseStoredCart, type CartLine } from "@/lib/cart";

type CartContextValue = {
  lines: CartLine[];
  count: number;
  hydrated: boolean;
  add: (line: CartLine) => void;
  update: (index: number, quantity: number) => void;
  remove: (index: number) => void;
  clear: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let active = true;
    let storedLines: CartLine[];
    try {
      storedLines = parseStoredCart(localStorage.getItem(cartKey));
    } catch {
      storedLines = [];
    }
    queueMicrotask(() => {
      if (!active) return;
      setLines(storedLines);
      setHydrated(true);
    });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(cartKey, JSON.stringify(lines));
    } catch {
      // Storage may be disabled or full; the in-memory cart remains usable.
    }
  }, [hydrated, lines]);

  const value = useMemo<CartContextValue>(() => ({
    lines,
    count: cartCount(lines),
    hydrated,
    add: (line) => setLines((current) => {
      const index = current.findIndex((item) => item.productId === line.productId && item.size === line.size && item.color === line.color);
      if (index < 0) return [...current, line];
      return current.map((item, itemIndex) => itemIndex === index ? { ...item, quantity: Math.min(10, item.quantity + line.quantity) } : item);
    }),
    update: (index, quantity) => setLines((current) => current.map((line, itemIndex) => itemIndex === index ? { ...line, quantity: Math.max(1, Math.min(10, quantity)) } : line)),
    remove: (index) => setLines((current) => current.filter((_, itemIndex) => itemIndex !== index)),
    clear: () => setLines([]),
  }), [hydrated, lines]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const value = useContext(CartContext);
  if (!value) throw new Error("useCart must be used inside CartProvider");
  return value;
}
