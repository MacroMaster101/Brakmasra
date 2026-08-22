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

export function cartCount(lines: CartLine[]) {
  return lines.reduce((total, line) => total + line.quantity, 0);
}

export function cartSubtotal(lines: CartLine[]) {
  return lines.reduce((total, line) => total + line.quantity * line.unitPrice, 0);
}

export function formatMoney(amount: number, currency = "LKR") {
  return new Intl.NumberFormat("en-LK", { style: "currency", currency }).format(amount / 100);
}
