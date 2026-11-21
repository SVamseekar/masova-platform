import MaSoVaMark from '../../../components/common/MaSoVaMark'

/** The MaSoVa logo tile, shared with the product apps. */
export function BrandMark({ size = 28 }: { size?: number }) {
  return <MaSoVaMark size={size} />
}

export default function Brand() {
  return (
    <span className="ms-brand">
      <BrandMark />
      <span>MaSoVa</span>
    </span>
  )
}
