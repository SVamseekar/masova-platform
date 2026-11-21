import MaSoVaMark from './MaSoVaMark'

/** The MaSoVa logo, with the wordmark beside it unless `wordmark` is false. */
export default function MaSoVaBrand({ size, wordmark = true }: { size?: number; wordmark?: boolean } = {}) {
  const dim = size ?? 40;
  const style = size
    ? { display: 'inline-flex', alignItems: 'center', fontSize: Math.round(size * 0.55), gap: Math.round(size * 0.3), letterSpacing: '-0.5px' }
    : undefined;
  return <span className="masova-brand" style={style} aria-label={wordmark ? undefined : 'MaSoVa'}>
    <MaSoVaMark size={dim} />{wordmark && <span>MaSoVa</span>}
  </span>;
}
