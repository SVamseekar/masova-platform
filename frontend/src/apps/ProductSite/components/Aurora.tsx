import type { CSSProperties, ReactNode } from 'react'
import { Sparkles } from 'lucide-react'
import { usePrefersReducedMotion } from './Effects'

/**
 * One palette colour per backdrop, never a blend of hues. Dark tones sit behind light
 * text; soft tones are pale card surfaces.
 */
const AURORA_TONES = {
  forest: '#1d3a2f',
  ember: '#24362f',
  pistachio: '#dde9c7',
  pistachioPale: '#e4eed2',
  sage: '#dfe6dc',
} as const

export type AuroraTone = keyof typeof AURORA_TONES

/** A flat card backdrop in one site colour with a faint grain, like printed card stock. */
export function Aurora({ tone = 'forest', className }: { tone?: AuroraTone; className?: string }) {
  const style = { '--au-bg': AURORA_TONES[tone] } as CSSProperties
  return (
    <div className={className ? `ms-aurora ${className}` : 'ms-aurora'} data-variant={tone === 'forest' || tone === 'ember' ? 'dark' : 'soft'} style={style} aria-hidden="true">
      <span className="ms-aurora-grain" />
    </div>
  )
}

/**
 * Two rows of drifting chips, each with an AI spark. The moving rows are decoration only;
 * with a `label`, screen readers get the items once as a plain list.
 */
export function SparkRibbon({ items, label }: { items: readonly string[]; label?: string }) {
  // With reduced motion nothing moves, so each item appears once
  const reduced = usePrefersReducedMotion()
  if (items.length === 0) return null
  // Both rows carry every item (the second starts half way through), repeated so a track is always wider than the screen.
  const half = Math.ceil(items.length / 2)
  const shifted = [...items.slice(half), ...items.slice(0, half)]
  const rows = reduced ? [[...items]] : [[...items, ...items], [...shifted, ...shifted]]
  return (
    <>
      {label && (
        <ul className="ms-sr" aria-label={label}>
          {items.map((item) => <li key={item}>{item}</li>)}
        </ul>
      )}
      <div className="ms-ribbon" aria-hidden="true">
        {rows.map((row, r) => (
          <div key={r} className="ms-ribbon-row" data-dir={r % 2 ? 'rev' : 'fwd'}>
            {/* Each row is drawn twice so the loop is seamless. */}
            {[0, 1].map((copy) => (
              <div key={copy} className="ms-ribbon-track">
                {row.map((item, i) => (
                  <span key={`${item}-${i}`} className="ms-spark-chip">
                    <Sparkles size={15} />
                    {item}
                  </span>
                ))}
              </div>
            ))}
          </div>
        ))}
      </div>
    </>
  )
}

/** A soft backdrop panel with content on top. */
export function AuroraPanel({ tone, children, className }: { tone?: AuroraTone; children?: ReactNode; className?: string }) {
  return (
    <div className={className ? `ms-aurora-panel ${className}` : 'ms-aurora-panel'}>
      <Aurora tone={tone} />
      <div className="ms-aurora-panel-body">{children}</div>
    </div>
  )
}
