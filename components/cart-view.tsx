"use client";

import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, Trash2 } from "lucide-react";
import { useCart } from "@/components/cart-provider";
import { CartLoadingState } from "@/components/loading-states";
import { cartSubtotal, formatMoney } from "@/lib/cart";

export function CartView() {
  const { hydrated, lines, update, remove } = useCart();
  if (!hydrated) return <CartLoadingState embedded />;
  if (!lines.length) return <div className="empty-state"><h2>Your cart is empty</h2><p>Choose a piece from the preview collection to test the storefront.</p><Link className="button button-primary" href="/shop">Visit the shop</Link></div>;
  return (
    <div className="cart-layout">
      <div className="cart-lines">{lines.map((line, index) => <article className="cart-line" key={`${line.productId}-${line.size}-${line.color}`}>
        <Image src={line.image} alt="" width={140} height={140} />
        <div><h2>{line.name}</h2><p>{[line.size, line.color].filter(Boolean).join(" / ")}</p><div className="quantity"><button onClick={() => update(index, line.quantity - 1)} aria-label="Decrease quantity"><Minus /></button><span>{line.quantity}</span><button onClick={() => update(index, line.quantity + 1)} aria-label="Increase quantity"><Plus /></button></div></div>
        <div className="line-price"><strong>{formatMoney(line.unitPrice * line.quantity, line.currency)}</strong><button onClick={() => remove(index)} aria-label={`Remove ${line.name}`}><Trash2 /></button></div>
      </article>)}</div>
      <aside className="order-summary panel"><h2>Order summary</h2><div><span>Subtotal</span><strong>{formatMoney(cartSubtotal(lines), lines[0].currency)}</strong></div><p>Shipping and taxes are calculated by the verified checkout service.</p><Link className="button button-primary full" href="/checkout">Continue to checkout</Link></aside>
    </div>
  );
}
