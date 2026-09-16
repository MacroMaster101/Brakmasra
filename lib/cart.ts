export type CartLine = {
  productId: string;
  slug: string;
  name: string;
  image: string;
  size: string;
  color: string;
  quantity: number;
  unitPrice: number;
  currency: string;
};

export const cartKey = "brakmasra-cart-v1";
const MAX_STORED_LINES = 100;

function isCartLine(value: unknown): value is CartLine {
  if (!value || typeof value !== "object") return false;
  const line = value as Partial<CartLine>;
  return typeof line.productId === "string"
    && typeof line.slug === "string"
    && typeof line.name === "string"
    && typeof line.image === "string"
    && line.image.startsWith("/images/")
    && typeof line.size === "string"
    && typeof line.color === "string"
    && Number.isInteger(line.quantity)
    && Number(line.quantity) >= 1
    && Number(line.quantity) <= 10
    && Number.isSafeInteger(line.unitPrice)
    && Number(line.unitPrice) >= 0
    && typeof line.currency === "string"
    && /^[A-Z]{3}$/.test(line.currency);
}

export function parseStoredCart(value: string | null): CartLine[] {
  if (!value) return [];
  try {
    const parsed: unknown = JSON.parse(value);
    if (!Array.isArray(parsed) || parsed.length > MAX_STORED_LINES || !parsed.every(isCartLine)) {
      return [];
    }
    return parsed;
  } catch {
    return [];
  }
}

export function cartCount(lines: CartLine[]) {
  return lines.reduce((total, line) => total + line.quantity, 0);
}

export function cartSubtotal(lines: CartLine[]) {
  return lines.reduce((total, line) => total + line.quantity * line.unitPrice, 0);
}

export function formatMoney(amount: number, currency = "LKR") {
  return new Intl.NumberFormat("en-LK", { style: "currency", currency }).format(amount / 100);
}
