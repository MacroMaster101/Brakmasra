import Image from "next/image";

const productPlaceholders = ["first", "second", "third"];
const detailRows = ["first", "second", "third"];

function LoadingStatus({ label, children, className = "" }: {
  children: React.ReactNode;
  className?: string;
  label: string;
}) {
  return (
    <section className={className} role="status" aria-busy="true" aria-live="polite">
      <span className="sr-only">{label}</span>
      <div aria-hidden="true">{children}</div>
    </section>
  );
}

function Line({ size = "medium" }: { size?: "short" | "medium" | "long" | "full" }) {
  return <span className={`loading-block loading-line is-${size}`} />;
}

function ProductPlaceholder() {
  return (
    <div className="loading-product">
      <div className="loading-block loading-product-image" />
      <div className="loading-product-copy">
        <div><Line size="medium" /><Line size="short" /></div>
        <Line size="short" />
      </div>
    </div>
  );
}

export function HomeLoadingState() {
  return (
    <LoadingStatus className="loading-home" label="Loading the BRAKMASRA store">
      <Image className="loading-home-image" src="/images/brakmasra-hero.png" alt="" fill sizes="100vw" />
      <div className="loading-home-scrim" />
      <div className="page-shell loading-home-inner">
        <div className="loading-home-copy">
          <Line size="short" />
          <div className="loading-block loading-display-line" />
          <div className="loading-block loading-display-line is-shorter" />
          <div className="loading-copy-lines"><Line size="long" /><Line size="medium" /></div>
          <div className="loading-actions">
            <div className="loading-block loading-button" />
            <div className="loading-block loading-button is-secondary" />
          </div>
        </div>
      </div>
    </LoadingStatus>
  );
}

export function ShopLoadingState() {
  return (
    <LoadingStatus className="page-shell page-top shop-page loading-page" label="Loading the collection">
      <header className="loading-page-hero">
        <Line size="short" />
        <div className="loading-block loading-title" />
        <Line size="long" />
      </header>
      <div className="loading-block loading-notice" />
      <div className="loading-shop-tools">
        <div className="loading-block loading-search" />
        <div className="loading-block loading-filters" />
      </div>
      <Line size="short" />
      <div className="loading-product-grid">
        {productPlaceholders.map((item) => <ProductPlaceholder key={item} />)}
      </div>
    </LoadingStatus>
  );
}

export function ProductLoadingState({ comingSoon = false }: { comingSoon?: boolean }) {
  return (
    <LoadingStatus className="page-shell page-top product-page loading-page" label="Loading product details">
      <Line size="short" />
      <div className="loading-product-detail">
        <div className="loading-block loading-product-portrait" />
        <div className="loading-product-panel">
          <Line size="short" />
          <div className="loading-block loading-product-title" />
          <Line size="short" />
          <div className="loading-copy-lines is-spaced"><Line size="full" /><Line size="long" /><Line size="medium" /></div>
          <div className={`loading-block loading-product-note${comingSoon ? " is-launch" : ""}`} />
          {!comingSoon && <><div className="loading-block loading-form-control" /><div className="loading-block loading-form-control" /></>}
          <div className="loading-spec-grid">
            <div className="loading-block loading-spec" />
            <div className="loading-block loading-spec" />
          </div>
        </div>
      </div>
    </LoadingStatus>
  );
}

export function AccountLoadingState() {
  return (
    <LoadingStatus className="account-page loading-page" label="Loading your account">
      <div className="page-shell account-shell">
        <header className="loading-account-header">
          <div><Line size="short" /><div className="loading-block loading-account-title" /><Line size="medium" /></div>
          <div className="loading-block loading-button" />
        </header>
        <div className="loading-account-grid">
          <div className="loading-account-card">
            <div className="loading-block loading-icon" />
            <div className="loading-account-details">
              <Line size="medium" />
              {detailRows.map((item) => <div className="loading-detail-row" key={item}><Line size="short" /><Line size="medium" /></div>)}
            </div>
          </div>
          <div className="loading-account-card is-orders">
            <div className="loading-block loading-icon" />
            <div className="loading-block loading-account-order-title" />
            <Line size="long" />
            <div className="loading-block loading-button" />
          </div>
        </div>
      </div>
    </LoadingStatus>
  );
}

export function CartLoadingState({ embedded = false }: { embedded?: boolean }) {
  const content = (
    <div className="loading-cart-layout">
      <div className="loading-cart-lines">
        {["first", "second"].map((item) => (
          <div className="loading-cart-line" key={item}>
            <div className="loading-block loading-cart-image" />
            <div className="loading-cart-copy"><Line size="medium" /><Line size="short" /><div className="loading-block loading-quantity" /></div>
            <Line size="short" />
          </div>
        ))}
      </div>
      <div className="loading-cart-summary">
        <Line size="medium" />
        <div className="loading-summary-row"><Line size="short" /><Line size="short" /></div>
        <Line size="long" />
        <div className="loading-block loading-form-control" />
      </div>
    </div>
  );

  if (embedded) {
    return <LoadingStatus className="loading-data-section" label="Loading your cart">{content}</LoadingStatus>;
  }

  return (
    <LoadingStatus className="page-shell page-top loading-page" label="Loading your cart">
      <header className="loading-page-hero is-compact"><Line size="short" /><div className="loading-block loading-title is-compact" /><Line size="long" /></header>
      {content}
    </LoadingStatus>
  );
}

export function CheckoutLoadingState({ embedded = false }: { embedded?: boolean }) {
  const form = (
    <div className="loading-checkout-form">
      <Line size="medium" />
      <div className="loading-copy-lines"><Line size="full" /><Line size="long" /></div>
      <div className="loading-block loading-form-control" />
      <Line size="medium" />
    </div>
  );

  if (embedded) {
    return <LoadingStatus className="loading-data-section" label="Loading checkout details">{form}</LoadingStatus>;
  }

  return (
    <LoadingStatus className="checkout-page loading-page" label="Loading checkout">
      <div className="checkout-shell">
        <header className="loading-checkout-header">
          <div className="loading-block loading-icon" />
          <div>
            <Line size="short" />
            <div className="loading-block loading-checkout-title" />
          </div>
        </header>
        {form}
      </div>
    </LoadingStatus>
  );
}

export function AuthLoadingState() {
  return (
    <LoadingStatus className="auth-page loading-auth" label="Loading secure account access">
      <div className="auth-shell">
        <div className="auth-art">
          <Image src="/images/auth-manor.png" alt="" fill sizes="(max-width: 767px) 100vw, 48vw" />
          <div className="auth-art-scrim" />
          <div className="auth-art-copy loading-auth-art-copy"><Line size="short" /><div className="loading-block loading-auth-art-title" /><Line size="long" /></div>
        </div>
        <div className="auth-panel">
          <div className="auth-panel-inner loading-auth-panel">
            <div className="loading-block loading-auth-title" />
            <div className="loading-copy-lines"><Line size="full" /><Line size="medium" /></div>
            <div className="loading-block loading-form-control" />
            <div className="loading-auth-divider"><span /><span /></div>
            <div className="loading-block loading-field" />
            <div className="loading-block loading-field" />
            <div className="loading-block loading-form-control" />
          </div>
        </div>
      </div>
    </LoadingStatus>
  );
}

export function AuthComingSoonLoadingState() {
  return (
    <LoadingStatus className="auth-page loading-auth" label="Loading member access details">
      <div className="auth-shell">
        <div className="auth-art">
          <Image src="/images/auth-manor.png" alt="" fill sizes="(max-width: 767px) 100vw, 48vw" />
          <div className="auth-art-scrim" />
          <div className="auth-art-copy loading-auth-art-copy"><Line size="short" /><div className="loading-block loading-auth-art-title" /><Line size="long" /></div>
        </div>
        <div className="auth-panel">
          <div className="auth-panel-inner loading-auth-panel">
            <div className="loading-block loading-auth-title" />
            <div className="loading-copy-lines"><Line size="full" /><Line size="medium" /></div>
            <div className="loading-block loading-product-note" />
            <div className="loading-block loading-form-control" />
            <div className="loading-block loading-form-control" />
          </div>
        </div>
      </div>
    </LoadingStatus>
  );
}

export function LaunchLoadingState() {
  return (
    <LoadingStatus className="launch-page loading-page" label="Loading launch details">
      <div className="page-shell launch-layout">
        <div className="launch-copy loading-launch-copy">
          <Line size="short" />
          <div className="loading-block loading-launch-title" />
          <div className="loading-copy-lines"><Line size="full" /><Line size="long" /></div>
          <div className="loading-actions"><div className="loading-block loading-button" /><div className="loading-block loading-button is-secondary" /></div>
        </div>
        <div className="loading-block loading-launch-visual" />
      </div>
    </LoadingStatus>
  );
}
