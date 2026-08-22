import type { Metadata } from "next";
import { CartView } from "@/components/cart-view";
export const metadata: Metadata = { title: "Cart", robots: { index: false, follow: false } };
export default function CartPage() { return <div className="page-shell page-top"><header className="page-hero compact"><span className="eyebrow">Your selection</span><h1>Cart</h1></header><CartView /></div>; }
