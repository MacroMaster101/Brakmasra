import type { SVGProps } from "react";

export function BrandMark(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 72 72" aria-hidden="true" {...props}>
      <path d="M36 4 44 20 62 14 52 31 68 36 52 41 62 58 44 52 36 68 28 52 10 58 20 41 4 36 20 31 10 14 28 20Z" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <path d="M36 17 41 31 55 36 41 41 36 55 31 41 17 36 31 31Z" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="36" cy="36" r="3" fill="currentColor" />
    </svg>
  );
}

export function Ornament({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 640 28" role="presentation">
      <path d="M0 14h240l16-10 16 10 18-7 16 7h28l16-7 18 7 16-10 16 10h240" fill="none" stroke="currentColor" strokeWidth="1" />
      <circle cx="320" cy="14" r="4" fill="none" stroke="currentColor" />
    </svg>
  );
}
