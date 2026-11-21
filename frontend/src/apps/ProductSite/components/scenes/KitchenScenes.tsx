/**
 * Kitchen scenes: one moment of the product at real reading size, not a whole app shrunk
 * into a frame. Three kinds, mixed across the site:
 *  - fragments: two or three floating cards with depth, one of them moving
 *  - photo: a real restaurant photograph with a live card on top
 *  - canvas: a large, cropped screen that runs off the edge, with a callout
 * Motion runs only on screen; with reduced motion each scene shows its finished state.
 * Decorative (aria-hidden); the caller describes the scene in text.
 */
import { Check, Thermometer } from 'lucide-react'
import { BrandMark } from '../Brand'
import { clock, useScene as usePreviewClock } from './kit'

/* ---------- Kitchen ---------- */

/** A ticket is cooked and bumped to Ready; the column counts follow. */
export function KitchenTicketsScene() {
  const { tick, ref, still } = usePreviewClock()
  const t = tick % 9
  const ready = still || t >= 6
  return (
    <div ref={ref} className="sc sc-fragments sc-k-tickets" aria-hidden="true">
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

const QUALITY_CHECKS = ['Portion weighed', 'Allergen: nuts confirmed', 'Core temperature 78 °C recorded', 'Packaging sealed']

/** The cook works through the quality checklist at the pass; each check is signed by a person. */
export function KitchenQualityScene() {
  const { tick, ref, still } = usePreviewClock(1000)
  const t = tick % 9
  const done = still ? QUALITY_CHECKS.length : Math.min(QUALITY_CHECKS.length, t)
  return (
    <div ref={ref} className="sc sc-checklist sc-k-quality" aria-hidden="true">
      <div className="sc-card sc-float">
        <header className="sc-head"><BrandMark size={18} /><b>Quality check · #1043</b><span className="sc-count">{done}/{QUALITY_CHECKS.length}</span></header>
        <ul className="sc-checks">
          {QUALITY_CHECKS.map((c, i) => (
            <li key={c} data-on={i < done}><span>{i < done && <Check size={12} strokeWidth={3.5} />}</span>{c}</li>
          ))}
        </ul>
      </div>
      <div className="sc-card sc-chip sc-float--tr" data-ok={done === QUALITY_CHECKS.length}>
        <Thermometer size={16} />
        <b>{done === QUALITY_CHECKS.length ? 'Signed off' : 'Checking'}</b>
        <small>Jonas K. · 19:41</small>
      </div>
    </div>
  )
}

/** The equipment log running off the edge: readings staff recorded, and a toast when the fryer is back. */
export function KitchenEquipmentScene() {
  const { tick, ref, still } = usePreviewClock(1000)
  const t = tick % 10
  const back = still || t >= 5
  const rows: [string, string, string, 'ok' | 'info' | 'warn'][] = [
    ['Pizza oven', '312 °C · 19:30', 'In use', 'ok'],
    ['Walk-in fridge', '3.4 °C · 19:30', 'In use', 'ok'],
    ['Fryer 2', back ? '175 °C · 19:42' : '—', back ? 'In use' : 'Cleaning', back ? 'ok' : 'info'],
    ['Dishwasher', 'Service Tue', 'Maintenance', 'warn'],
    ['Blast chiller', '-18.2 °C · 19:30', 'In use', 'ok'],
  ]
  return (
    <div ref={ref} className="sc sc-canvas sc-k-equipment" aria-hidden="true">
      <div className="sc-window">
        <div className="sc-window-bar"><BrandMark size={18} /><b>Equipment</b><span className="sc-store">Old Town</span></div>
        <table className="sc-table">
          <thead><tr><th>Machine</th><th>Last reading</th><th>Status</th></tr></thead>
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
