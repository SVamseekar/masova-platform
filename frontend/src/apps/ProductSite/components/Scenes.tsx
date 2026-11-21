/**
 * Product scenes: one moment of the product at real reading size, not a whole app shrunk
 * into a frame. Three kinds, mixed across the site:
 *  - fragments: two or three floating cards with depth, one of them moving
 *  - photo: a real restaurant photograph with a live card on top
 *  - canvas: a large, cropped screen that runs off the edge, with a callout
 * Motion runs only on screen; with reduced motion each scene shows its finished state.
 * Decorative (aria-hidden); the caller describes the scene in text.
 */
import { Check, Thermometer } from 'lucide-react'
import { BrandMark } from './Brand'
import { usePreviewClock } from './Devices'

function clock(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60)
  const s = totalSeconds % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

/* ---------- Kitchen ---------- */

/** A ticket is cooked and bumped to Ready; the column counts follow. */
export function KitchenTicketsScene() {
  const { tick, ref, still } = usePreviewClock()
  const t = tick % 9
  const ready = still || t >= 6
  return (
    <div ref={ref} className="sc sc-fragments" aria-hidden="true">
      <div className="sc-pillbar">
        <span><i data-tone="new" />Received <b>2</b></span>
        <span><i data-tone="cook" />Preparing <b>{ready ? 1 : 2}</b></span>
        <span><i data-tone="ready" />Ready <b>{ready ? 2 : 1}</b></span>
      </div>

      <div className="sc-card sc-ticket sc-ticket--back">
        <header><b>#1047</b><span>Kiosk</span></header>
        <p>1 × Greek salad</p>
        <small>Received · {clock(45 + tick)}</small>
      </div>

      <div className="sc-card sc-ticket sc-ticket--main" data-ready={ready}>
        <header><b>#1046</b><span>Website · Delivery</span></header>
        <p>2 × Margherita</p>
        <ul><li>Extra basil</li><li>One without olives</li></ul>
        <div className="sc-tags"><span className="sc-allergen">Gluten</span><span className="sc-allergen">Milk</span></div>
        <footer>
          <span className="sc-timer">{ready ? 'Ready' : clock(130 + tick)}</span>
          <span className="sc-bump" data-pressed={!still && t === 5}>{ready ? <><Check size={15} strokeWidth={3} /> Bumped</> : 'Bump to ready'}</span>
        </footer>
      </div>

      <div className="sc-card sc-ticket sc-ticket--done">
        <header><b>#1042</b><span>Website</span></header>
        <p>1 × Tikka masala</p>
        <small><Check size={13} strokeWidth={3} /> Ready · driver Raj is 2 min out</small>
      </div>
    </div>
  )
}

const QUALITY_CHECKS = ['Portion weighed', 'Allergen: nuts confirmed', 'Above 75 °C', 'Packaging sealed']

/** A chef at the pass; the quality checklist ticks itself off over the photo. */
export function KitchenQualityScene() {
  const { tick, ref, still } = usePreviewClock(1000)
  const t = tick % 9
  const done = still ? QUALITY_CHECKS.length : Math.min(QUALITY_CHECKS.length, t)
  const temp = still ? 78 : Math.min(78, 61 + t * 5)
  return (
    <div ref={ref} className="sc sc-photo" aria-hidden="true">
      <img src="/site/kitchen-chef.webp" alt="" loading="lazy" decoding="async" />
      <div className="sc-card sc-float sc-float--bl">
        <header className="sc-head"><BrandMark size={18} /><b>Quality check · #1043</b><span className="sc-count">{done}/{QUALITY_CHECKS.length}</span></header>
        <ul className="sc-checks">
          {QUALITY_CHECKS.map((c, i) => (
            <li key={c} data-on={i < done}><span>{i < done && <Check size={12} strokeWidth={3.5} />}</span>{c}</li>
          ))}
        </ul>
      </div>
      <div className="sc-card sc-chip sc-float--tr" data-ok={temp >= 75}>
        <Thermometer size={16} />
        <b>{temp} °C</b>
        <small>{temp >= 75 ? 'Safe to serve' : 'Heating'}</small>
      </div>
    </div>
  )
}

/** A big equipment screen running off the edge; a toast says the fryer is back. */
export function KitchenEquipmentScene() {
  const { tick, ref, still } = usePreviewClock(1000)
  const t = tick % 10
  const back = still || t >= 5
  const oven = 312 + (still ? 0 : Math.round(Math.sin(tick / 2) * 4))
  const fridge = (3.4 + (still ? 0 : Math.sin(tick / 3) * 0.3)).toFixed(1)
  const rows: [string, string, string, 'ok' | 'info' | 'warn'][] = [
    ['Pizza oven', `${oven} °C`, 'In use', 'ok'],
    ['Walk-in fridge', `${fridge} °C`, 'In use', 'ok'],
    ['Fryer 2', back ? '175 °C' : '—', back ? 'In use' : 'Cleaning', back ? 'ok' : 'info'],
    ['Dishwasher', 'Service Tue', 'Maintenance', 'warn'],
    ['Blast chiller', '-18.2 °C', 'In use', 'ok'],
  ]
  return (
    <div ref={ref} className="sc sc-canvas" aria-hidden="true">
      <div className="sc-window">
        <div className="sc-window-bar"><BrandMark size={18} /><b>Equipment</b><span className="sc-store">Old Town</span><span className="sc-live">Live</span></div>
        <table className="sc-table">
          <thead><tr><th>Machine</th><th>Reading</th><th>Status</th></tr></thead>
          <tbody>
            {rows.map(([name, reading, status, tone]) => (
              <tr key={name} data-flash={!still && name === 'Fryer 2' && t === 5}>
                <td>{name}</td><td className="sc-num">{reading}</td><td><span className="sc-status" data-tone={tone}>{status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="sc-card sc-toast" data-shown={back}>
        <span className="sc-toast-icon"><Check size={14} strokeWidth={3} /></span>
        <div><b>Fryer 2 is back in service</b><small>Cleaned by Jonas K. · 19:42</small></div>
      </div>
    </div>
  )
}
