"use client";

import Link from "next/link";
import { useId, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Heart, Minus, Plus, ShoppingBag } from "lucide-react";
import { useCart } from "@/components/cart-provider";
import { useLanguage } from "@/components/language-provider";
import type { Product } from "@/data/products";
import { MAX_LINE_QUANTITY, toCartLine } from "@/lib/catalog";
import { useWishlist } from "@/lib/wishlist";

export function AddToCart({ product }: { product: Product }) {
  const { add } = useCart();
  const { t } = useLanguage();
  const router = useRouter();
  const quantityId = useId();
  const { slugs, toggle } = useWishlist();
  const [result, setResult] = useState<"added" | "invalid" | null>(null);
  const [size, setSize] = useState("");
  const [color, setColor] = useState(product.colors.length === 1 ? product.colors[0] : "");
  const [quantity, setQuantity] = useState("1");
  const maxQuantity = Math.min(MAX_LINE_QUANTITY, product.stock);

  if (maxQuantity < 1)
    return <p className="product-stock-status">{t.shopSoldOut}</p>;

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const line = toCartLine(product, {
      size: String(data.get("size") ?? ""),
      color: String(data.get("color") ?? ""),
      quantity: Number(data.get("quantity")),
    });
    if (!line) {
      setResult("invalid");
      return;
    }
    add(line);
    setResult("added");
    const submitter = (event.nativeEvent as SubmitEvent).submitter;
    if (submitter instanceof HTMLButtonElement && submitter.value === "checkout") router.push("/checkout");
  }

  return (
    <form className="pdp-buy-form" onSubmit={submit}>
      {product.sizes.length > 0 && (
        <fieldset className="pdp-options">
          <legend>{t.cartSize}{size && <> <strong>{size}</strong></>}</legend>
          <div>
            {product.sizes.map((size) => (
              <label className="pdp-size" key={size}><input type="radio" name="size" value={size} required onChange={() => { setSize(size); setResult(null); }} /><span>{size}</span></label>
            ))}
          </div>
        </fieldset>
      )}
      {product.colors.length > 0 && (
        <fieldset className="pdp-options">
          <legend>{t.cartColor}{color && <> <strong>{color}</strong></>}</legend>
          <div>
            {product.colors.map((color) => (
              <label className="pdp-color" key={color}><input type="radio" name="color" value={color} defaultChecked={product.colors.length === 1} required onChange={() => { setColor(color); setResult(null); }} /><span><i className={color.toLowerCase().includes("white") ? "is-white" : color.toLowerCase().includes("black") ? "is-black" : "is-neutral"} aria-hidden="true" />{color}</span></label>
            ))}
          </div>
        </fieldset>
      )}
      <div className="pdp-purchase-row">
        <div className="pdp-quantity-field"><label htmlFor={quantityId}>{t.cartQuantity}</label><div className="pdp-quantity">
          <button type="button" disabled={!quantity || Number(quantity) <= 1} aria-label={t.cartDecrease} onClick={() => setQuantity(String(Math.max(1, Number(quantity) - 1)))}><Minus aria-hidden="true" /></button>
          <input id={quantityId} name="quantity" type="number" min={1} max={maxQuantity} value={quantity} onChange={event => { setQuantity(event.target.value); setResult(null); }} required />
          <button type="button" disabled={Number(quantity) >= maxQuantity} aria-label={t.cartIncrease} onClick={() => setQuantity(String(Math.min(maxQuantity, (Number(quantity) || 1) + 1)))}><Plus aria-hidden="true" /></button>
        </div></div>
        <button className="button button-primary pdp-add" type="submit" name="intent" value="cart"><ShoppingBag aria-hidden="true" />{t.cartAddBtn}</button>
        <button className={`pdp-save${slugs.includes(product.slug) ? " is-saved" : ""}`} type="button" aria-label={slugs.includes(product.slug) ? t.storeUnsave : t.storeSave} aria-pressed={slugs.includes(product.slug)} onClick={() => toggle(product.slug)}><Heart aria-hidden="true" /></button>
      </div>
      <button className="button pdp-buy-now" type="submit" name="intent" value="checkout">{t.productBuyNow}</button>
      <p className={`form-status${result === "invalid" ? " is-error" : ""}`} aria-live="polite">
        {result === "invalid" ? t.cartAddInvalid : result === "added" ? t.cartAdded(product.name) : null}
        {result === "added" && (
          <>
            {" "}
            <Link className="text-link" href="/cart">
              {t.cartViewCart}
            </Link>
          </>
        )}
      </p>
    </form>
  );
}
