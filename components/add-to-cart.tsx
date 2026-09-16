"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { ShoppingBag } from "lucide-react";
import { useCart } from "@/components/cart-provider";
import type { Product } from "@/data/products";
import { MAX_LINE_QUANTITY, toCartLine } from "@/lib/catalog";

export function AddToCart({ product }: { product: Product }) {
  const { add } = useCart();
  const [result, setResult] = useState<{ text: string; added: boolean } | null>(null);
  const maxQuantity = Math.min(MAX_LINE_QUANTITY, product.stock);

  if (maxQuantity < 1) return <p className="mt-6 font-mono text-[.8rem] uppercase tracking-[.16em] text-smoke">Sold out</p>;

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const line = toCartLine(product, {
      size: String(data.get("size") ?? ""),
      color: String(data.get("color") ?? ""),
      quantity: Number(data.get("quantity")),
    });
    if (!line) {
      setResult({ text: "Choose an available size, color, and quantity.", added: false });
      return;
    }
    add(line);
    setResult({ text: `${line.name} added to your cart.`, added: true });
  }

  return (
    <form className="mt-6 grid gap-4" onSubmit={submit}>
      {product.sizes.length > 0 && (
        <label className="grid gap-2">Size
          <select name="size" required defaultValue="">
            <option value="" disabled>Select a size</option>
            {product.sizes.map((size) => <option key={size}>{size}</option>)}
          </select>
        </label>
      )}
      {product.colors.length > 0 && (
        <label className="grid gap-2">Color
          <select name="color" required defaultValue={product.colors.length === 1 ? product.colors[0] : ""}>
            {product.colors.length > 1 && <option value="" disabled>Select a color</option>}
            {product.colors.map((color) => <option key={color}>{color}</option>)}
          </select>
        </label>
      )}
      <label className="grid gap-2">Quantity
        <input name="quantity" type="number" min={1} max={maxQuantity} defaultValue={1} required />
      </label>
      <button className="button button-primary" type="submit"><ShoppingBag />Add to cart</button>
      <p className="form-status" aria-live="polite">
        {result?.text}
        {result?.added && <> <Link className="text-link" href="/cart">View cart</Link></>}
      </p>
    </form>
  );
}
