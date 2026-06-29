import { MARQUEE_ITEMS } from '../constants'
import { colors } from '../tokens'

export default function MarqueeStrip() {
  const doubled = [...MARQUEE_ITEMS, ...MARQUEE_ITEMS]
  return (
    <div
      className="py-4 overflow-hidden"
      style={{ borderTop: `1px solid ${colors.border}`, borderBottom: `1px solid ${colors.border}`, background: '#0a0a0a' }}
    >
      <div className="flex animate-marquee whitespace-nowrap">
        {doubled.map(({ label, icon: Icon }, i) => (
          <span key={i} className="inline-flex items-center gap-2 mx-8 text-sm text-gray-500">
            <Icon size={14} style={{ color: colors.gold }} className="flex-shrink-0" />
            {label}
          </span>
        ))}
      </div>
    </div>
  )
}