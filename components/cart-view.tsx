"use client";

import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, Trash2 } from "lucide-react";
import { useCart } from "@/components/cart-provider";
import { useLanguage } from "@/components/language-provider";
import { CartLoadingState } from "@/components/loading-states";
import { cartSubtotal, formatMoney } from "@/lib/cart";

export function CartView() {
  const { hydrated, lines, update, remove } = useCart();
  const { t } = useLanguage();

  return (
    <>
      <header className="page-hero compact">
        <span className="eyebrow">{t.cartEyebrow}</span>
        <h1>{t.cartTitle}</h1>
        <p>{t.cartDesc}</p>
      </header>
      {!hydrated ? (
        <CartLoadingState embedded />
      ) : lines.length ? (
        <CartLines lines={lines} update={update} remove={remove} />
      ) : (
        <div className="empty-state">
          <h2>{t.cartEmptyTitle}</h2>
          <p>{t.cartEmptyDesc}</p>
          <Link className="button button-primary" href="/shop">{t.cartVisitShop}</Link>
        </div>
      )}
    </>
  );
}

type CartState = ReturnType<typeof useCart>;

function CartLines({ lines, update, remove }: Pick<CartState, "lines" | "update" | "remove">) {
  const { t } = useLanguage();

  return (
    <div className="cart-layout">
      <div className="cart-lines">
        {lines.map((line, index) => (
          <article className="cart-line" key={`${line.productId}-${line.size}-${line.color}`}>
            <Image src={line.image} alt="" width={140} height={140} />
            <div>
              <h2>{line.name}</h2>
              <p>{[line.size, line.color].filter(Boolean).join(" / ")}</p>
              <div className="quantity">
                <button type="button" onClick={() => update(index, line.quantity - 1)} aria-label={t.cartDecrease}>
                  <Minus />
                </button>
                <span>{line.quantity}</span>
                <button type="button" onClick={() => update(index, line.quantity + 1)} aria-label={t.cartIncrease}>
                  <Plus />
                </button>
              </div>
            </div>
            <div className="line-price">
              <strong>{formatMoney(line.unitPrice * line.quantity, line.currency)}</strong>
              <button type="button" onClick={() => remove(index)} aria-label={t.cartRemove(line.name)}>
                <Trash2 />
              </button>
            </div>
          </article>
        ))}
      </div>
      <aside className="order-summary panel">
        <h2>{t.cartSummaryTitle}</h2>
        <div>
          <span>{t.cartSubtotal}</span>
          <strong>{formatMoney(cartSubtotal(lines), lines[0].currency)}</strong>
        </div>
        <p>{t.cartShippingNote}</p>
        <Link className="button button-primary full" href="/checkout">{t.cartContinueCheckout}</Link>
      </aside>
    </div>
  );
}
