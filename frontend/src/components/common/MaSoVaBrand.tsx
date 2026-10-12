/** Canonical geometric mark for the approved MaSoVa visual identity. */
export default function MaSoVaBrand({ size, wordmark = true }: { size?: number; wordmark?: boolean } = {}) {
  const dim = size ?? 40;
  const style = size
    ? { display: 'inline-flex', alignItems: 'center', fontSize: Math.round(size * 0.55), gap: Math.round(size * 0.3), letterSpacing: '-0.5px' }
    : undefined;
  return <span className="masova-brand" style={style} aria-label={wordmark ? undefined : 'MaSoVa'}>
    <svg width={dim} height={dim} viewBox="0 0 40 40" fill="none" aria-hidden="true">
      <path d="M4 4H12L20 14L28 4H36V36H28V18L20 28L12 18V36H4V4Z" fill="#DE4212" />
      <path d="M4 4H12L20 14V28L4 12V4Z" fill="#F26B3A" />
    </svg>{wordmark && <span>MaSoVa</span>}
  </span>;
}
