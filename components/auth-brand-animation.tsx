/** Decorative storefront artwork; motion is disabled when reduced motion is requested. */
export function AuthBrandAnimation() {
  return <div className="auth-brand-animation" aria-hidden="true">
    <svg viewBox="0 0 400 440" fill="none">
      <ellipse className="auth-brand-shadow" cx="200" cy="403" rx="105" ry="10" />
      <g className="auth-brand-shirt">
        <path className="auth-brand-shirt-shape" d="M143 64 84 85 34 164 91 200 116 160 116 365Q200 389 284 365L284 160 309 200 366 164 316 85 257 64Q248 102 200 102 152 102 143 64Z" />
        <path className="auth-brand-seam" d="M143 64Q153 117 200 117 247 117 257 64M116 346Q200 370 284 346M48 142 99 175M301 175 352 142" />
        <image href="/images/logo.png" x="153" y="157" width="94" height="94" />
        <path className="auth-brand-signal" d="M151 277H249M175 288H225" />
      </g>
      <path className="auth-brand-spark" d="M324 39V63M312 51H336M66 284V300M58 292H74" />
    </svg>
  </div>;
}
