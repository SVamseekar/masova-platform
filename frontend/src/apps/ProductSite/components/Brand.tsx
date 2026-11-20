/** Canonical geometric MaSoVa mark (same paths as the family brand asset). */
export function BrandMark({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" aria-hidden="true" focusable="false">
      <path d="M4 4H12L20 14L28 4H36V36H28V18L20 28L12 18V36H4V4Z" fill="#DE4212" />
      <path d="M4 4H12L20 14V28L4 12V4Z" fill="#F26B3A" />
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
