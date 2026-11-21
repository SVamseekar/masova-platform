import type { CSSProperties, ReactNode } from 'react'
import { Sparkles } from 'lucide-react'

/**
 * Colour sets for the backdrop, all from the site palette: forest, ember, sand and sage.
 * Dark tones sit behind light text; soft tones are pale card surfaces like a lit room.
 */
const AURORA_TONES = {
  forest: ['#2f6650', '#c63f19', '#1d3a2f', '#7d6a43'],
  ember: ['#c63f19', '#2f6650', '#8a4a2a', '#1d3a2f'],
  sand: ['#ecc3a6', '#d3ddd2', '#f3dfca', '#c9d2c6'],
  clay: ['#e8ab8c', '#f0d9c6', '#dccbb7', '#cfd8cd'],
  sage: ['#bfd1c3', '#ead6c1', '#d6e0d4', '#d9c3a8'],
} as const

export type AuroraTone = keyof typeof AURORA_TONES

/**
 * A slow, grainy gradient field drawn in CSS: the site's backdrop instead of stock photography.
 */
export function Aurora({ tone = 'forest', className }: { tone?: AuroraTone; className?: string }) {
  const [a, b, c, d] = AURORA_TONES[tone]
  const style = { '--au-1': a, '--au-2': b, '--au-3': c, '--au-4': d } as CSSProperties
  return (
    <div className={className ? `ms-aurora ${className}` : 'ms-aurora'} data-variant={tone === 'forest' || tone === 'ember' ? 'dark' : 'soft'} style={style} aria-hidden="true">
      <i /><i /><i /><i />
      <span className="ms-aurora-grain" />
    </div>
  )
}

/**
 * Two rows of drifting chips, each with an AI spark. The moving rows are decoration only;
 * with a `label`, screen readers get the items once as a plain list.
 */
export function SparkRibbon({ items, label }: { items: readonly string[]; label?: string }) {
  if (items.length === 0) return null
  // Both rows carry every item (the second starts half way through), repeated so a track is always wider than the screen.
  const half = Math.ceil(items.length / 2)
  const shifted = [...items.slice(half), ...items.slice(0, half)]
  const rows = [[...items, ...items], [...shifted, ...shifted]]
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
