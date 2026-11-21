import MaSoVaMark from '../../../components/common/MaSoVaMark'

/** The MaSoVa logo tile, shared with the product apps. */
export function BrandMark({ size = 28 }: { size?: number }) {
  return <MaSoVaMark size={size} />
}

export default function Brand() {
  return (
    <span className="ms-brand">
      <BrandMark />
      {/* Each syllable takes a colour from the mark: cream tile, teal bands, orange stem. Navy is left out because the wordmark always sits on dark. */}
      <span className="ms-brand-word"><span className="ms-brand-ma">Ma</span><span className="ms-brand-so">So</span><span className="ms-brand-va">Va</span></span>
    </span>
  )
}
