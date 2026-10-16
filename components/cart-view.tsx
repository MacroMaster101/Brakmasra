"use client";

import Image from "@/components/store-image";
import Link from "next/link";
import { ArrowRight, Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { useCart } from "@/components/cart-provider";
import { useLanguage } from "@/components/language-provider";
import { CartLoadingState } from "@/components/loading-states";
import { cartCount, cartSubtotal } from "@/lib/cart";
import { MAX_LINE_QUANTITY } from "@/lib/catalog";
import { useCurrency } from "@/components/currency-provider";
import { CurrencyConversionNote } from "@/components/currency-switcher";

export function CartView() {
  const { hydrated, lines, update, remove } = useCart();
  const { t } = useLanguage();

  return (
    <section className="store-cart" aria-labelledby="cart-title">
      <header className="cart-heading">
        <div><h1 id="cart-title">{t.cartTitle}</h1>{hydrated && lines.length > 0 && <p role="status">{t.cartItemCount(cartCount(lines))}</p>}</div>
        {hydrated && lines.length > 0 && <Link href="/shop">{t.wishlistContinue}<ArrowRight aria-hidden="true" /></Link>}
      </header>
      {!hydrated ? (
        <CartLoadingState embedded />
      ) : lines.length ? (
        <CartLines lines={lines} update={update} remove={remove} />
      ) : (
        <div className="cart-empty">
          <span className="cart-empty-icon"><ShoppingBag aria-hidden="true" /></span>
          <h2>{t.cartEmptyTitle}</h2>
          <p>{t.cartEmptyDesc}</p>
          <Link className="button button-primary" href="/shop">{t.cartVisitShop}<ArrowRight aria-hidden="true" /></Link>
        </div>
      )}
    </section>
  );
}

type CartState = ReturnType<typeof useCart>;

function CartLines({ lines, update, remove }: Pick<CartState, "lines" | "update" | "remove">) {
  const { t } = useLanguage();
  const { formatPrice } = useCurrency();

  return (
    <div className="cart-layout store-cart-layout">
      <div className="store-cart-items">
        <div className="cart-column-headings" aria-hidden="true"><span>{t.cartProduct}</span><span>{t.cartUnitPrice}</span><span>{t.cartQuantity}</span><span>{t.cartLineTotal}</span><span /></div>
        {lines.map((line, index) => (
          <article className="store-cart-row" key={`${line.productId}-${line.size}-${line.color}`} aria-label={line.name}>
            <div className="cart-item-main">
              <Link className="cart-item-photo" href={`/shop/${encodeURIComponent(line.slug)}`} aria-label={line.name}><Image src={line.image} alt="" fill sizes="(max-width: 767px) 88px, 104px" /></Link>
              <div className="cart-item-copy">
                <Link href={`/shop/${encodeURIComponent(line.slug)}`}><h2>{line.name}</h2></Link>
                <p>{[line.size, line.color].filter(Boolean).join(" / ")}</p>
                <span className="cart-unit-mobile">{formatPrice(line.unitPrice, line.currency)}</span>
              </div>
            </div>
            <div className="cart-unit-price"><span className="sr-only">{t.cartUnitPrice}: </span>{formatPrice(line.unitPrice, line.currency)}</div>
            <div className="cart-quantity-cell">
              <span className="cart-cell-label">{t.cartQuantity}</span>
              <div className="quantity" role="group" aria-label={t.cartQuantityFor(line.name)}>
                <button type="button" disabled={line.quantity <= 1} onClick={() => update(index, line.quantity - 1)} aria-label={`${t.cartDecrease}: ${line.name}`}>
                  <Minus aria-hidden="true" />
                </button>
                <output aria-live="polite">{line.quantity}</output>
                <button type="button" disabled={line.quantity >= MAX_LINE_QUANTITY} onClick={() => update(index, line.quantity + 1)} aria-label={`${t.cartIncrease}: ${line.name}`}>
                  <Plus aria-hidden="true" />
                </button>
              </div>
            </div>
            <div className="cart-line-total">
              <span className="cart-cell-label">{t.cartLineTotal}</span>
              <strong>{formatPrice(line.unitPrice * line.quantity, line.currency)}</strong>
            </div>
            <button className="cart-remove" type="button" onClick={() => remove(index)} aria-label={t.cartRemove(line.name)}><Trash2 aria-hidden="true" /></button>
          </article>
        ))}
      </div>
      <aside className="cart-summary" aria-label={t.cartSummaryTitle}>
        <h2>{t.cartSummaryTitle}</h2>
        <div className="cart-summary-line">
          <span>{t.cartSubtotal}</span>
          <strong>{formatPrice(cartSubtotal(lines), lines[0].currency)}</strong>
        </div>
        <div className="cart-summary-line"><span>{t.cartDeliveryLabel}</span><span>{t.cartAtCheckout}</span></div>
        <div className="cart-summary-total"><span>{t.cartEstimatedTotal}</span><strong>{formatPrice(cartSubtotal(lines), lines[0].currency)}</strong></div>
        <p>{t.cartShippingNote}</p>
        <CurrencyConversionNote />
        <Link className="button button-primary full" href="/checkout">{t.cartContinueCheckout}<ArrowRight aria-hidden="true" /></Link>
      </aside>
    </div>
  );
}
