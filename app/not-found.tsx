import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ShoppingBag } from "lucide-react";

export default function NotFound() {
  return (
    <section className="not-found" aria-labelledby="not-found-title">
      <div className="not-found-media" aria-hidden="true">
        <Image
          src="/images/404-haunted-path.png"
          alt=""
          fill
          sizes="100vw"
        />
      </div>
      <div className="not-found-scrim" aria-hidden="true" />

      <Link className="not-found-brand" href="/" aria-label="BRAKMASRA home">
        <span className="not-found-brand-mark">
          <Image
            src="/images/brakmasra-logo-reference.png"
            alt=""
            width={48}
            height={48}
          />
        </span>
        <span>BRAKMASRA</span>
      </Link>

      <div className="not-found-shell">
        <div className="not-found-copy">
          <span className="eyebrow">Page not found</span>
          <span className="not-found-code" aria-hidden="true">404</span>
          <h1 id="not-found-title">This trail goes nowhere.</h1>
          <p>The page has disappeared into the dark. Head back home or find something worth carrying out.</p>
          <div className="button-row">
            <Link className="button button-primary" href="/">
              <ArrowLeft aria-hidden="true" />
              Return home
            </Link>
            <Link className="button button-secondary" href="/shop">
              Explore shop
              <ShoppingBag aria-hidden="true" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
