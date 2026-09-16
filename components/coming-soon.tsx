import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BellRing, LockKeyhole, ShoppingBag } from "lucide-react";

import { AuthShell } from "@/components/auth-shell";

export function AuthComingSoon() {
  return (
    <AuthShell
      title="Members open soon."
      description="Sign-in, saved details, and order history will arrive with the first live drop."
    >
      <div className="auth-coming-soon">
        <div className="launch-status"><LockKeyhole aria-hidden="true" /><span>Access is currently closed</span></div>
        <p>No account is needed to browse the upcoming collection or join the drop list.</p>
        <div className="launch-actions">
          <Link className="button button-primary" href="/shop">Explore the collection <ArrowRight /></Link>
          <Link className="button button-secondary" href="/#drop-alerts">Get drop alerts <BellRing /></Link>
        </div>
      </div>
    </AuthShell>
  );
}

type StoreComingSoonProps = {
  area: "account" | "cart" | "checkout";
};

const storeCopy = {
  account: {
    eyebrow: "Member access",
    title: "Your account opens soon.",
    description: "Profiles, saved details, and order history will be ready when the first live drop opens.",
  },
  cart: {
    eyebrow: "First drop incoming",
    title: "The cart opens soon.",
    description: "Browse the launch collection now. You will be able to select sizes and reserve pieces when ordering goes live.",
  },
  checkout: {
    eyebrow: "Secure ordering",
    title: "Checkout opens soon.",
    description: "Payments are intentionally closed while the first drop is prepared and final availability is confirmed.",
  },
} as const;

export function StoreComingSoon({ area }: StoreComingSoonProps) {
  const copy = storeCopy[area];
  const Icon = area === "account" ? LockKeyhole : ShoppingBag;

  return (
    <section className="launch-page">
      <div className="page-shell launch-layout">
        <div className="launch-copy">
          <span className="eyebrow">{copy.eyebrow}</span>
          <h1>{copy.title}</h1>
          <p>{copy.description}</p>
          <div className="launch-actions">
            <Link className="button button-primary" href="/shop">Explore the collection <ArrowRight /></Link>
            <Link className="button button-secondary" href="/#drop-alerts">Get drop alerts <BellRing /></Link>
          </div>
          <p className="launch-footnote"><Icon aria-hidden="true" /> No payment or account information is being collected here yet.</p>
        </div>

        <div className="launch-visual" aria-hidden="true">
          <Image src="/images/brakmasra-hero.png" alt="" fill sizes="(max-width: 900px) 100vw, 48vw" />
          <div className="launch-visual-scrim" />
          <div className="launch-visual-mark">
            <Image src="/images/brakmasra-logo-reference.png" alt="" width={104} height={104} />
            <span>BRAKMASRA</span>
            <small>First drop coming soon</small>
          </div>
        </div>
      </div>
    </section>
  );
}

export function ProductComingSoon() {
  return (
    <div className="product-launch-state">
      <div>
        <span className="eyebrow">Coming soon</span>
        <h2>Ordering is not open yet.</h2>
        <p>This piece is planned for the first BRAKMASRA drop. Final price, sizing, and availability will be confirmed before release.</p>
      </div>
      <div className="launch-actions">
        <Link className="button button-primary" href="/#drop-alerts">Get drop alerts <BellRing /></Link>
        <Link className="button button-secondary" href="/shop">Back to collection</Link>
      </div>
    </div>
  );
}
