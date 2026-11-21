/**
 * The MaSoVa mark: a lowercase m on an ink tile with one ember dot above it, so the m also reads as a
 * host at the pass. The dot is the live signal: something is ready for you.
 * Same drawing as public/favicon.svg and public/images/brand/masova-mark.svg.
 */
export function BrandMark({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" aria-hidden="true" focusable="false">
      <rect width="64" height="64" rx="16" fill="#111815" />
      <path d="M14 48V31.5a9 9 0 0 1 18 0V48M32 48V31.5a9 9 0 0 1 18 0V48" stroke="#F5F2EB" strokeWidth="8" />
      <circle className="ms-brand-dot" cx="32" cy="14.5" r="4.75" fill="#E8562A" />
    </svg>
  )
}

export default function Brand() {
  return (
    <span className="ms-brand">
      <BrandMark />
      <span>MaSoVa</span>
    </span>
  )
}
