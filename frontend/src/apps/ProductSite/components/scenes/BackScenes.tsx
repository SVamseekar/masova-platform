/** Product-page scenes for stock and team. */
import { AlertTriangle, Check, Copy, KeyRound } from 'lucide-react'
import { Avatar, Photo, Scene, clock, cyc, eur, prog, useScene } from './kit'

/* ---------- Stock ---------- */

const TANKS: [string, string, number][] = [['Tomatoes', 'kg', 70], ['Flour 00', 'kg', 86], ['Basil', 'kg', 44], ['Olive oil', 'L', 62]]

/** Five gauges; mozzarella drains through its reorder line and raises a warning. */
export function StockTanksScene() {
  const { tick, ref, still } = useScene(800)
  const t = still ? 99 : cyc(tick, 14)
  const mozz = Math.max(20, 64 - Math.min(t, 10) * 4.4)
  const low = mozz <= 32
  return (
    <Scene kind="gauges" name="s-tanks" sceneRef={ref}>
      <div className="sc-tanks">
        <div className="sc-tank" data-low={low}>
          <div className="sc-tank-body"><i style={{ height: `${mozz}%` }} /><span className="sc-tank-line" style={{ bottom: '32%' }} /></div>
          <b>Mozzarella</b><small className="ms-num">{Math.round(mozz * 0.6)} kg</small>
        </div>
        {TANKS.map(([name, unit, level]) => (
          <div key={name} className="sc-tank">
            <div className="sc-tank-body"><i style={{ height: `${level}%` }} /><span className="sc-tank-line" style={{ bottom: '25%' }} /></div>
            <b>{name}</b><small className="ms-num">{Math.round(level * 0.7)} {unit}</small>
          </div>
        ))}
      </div>
      <div className="sc-card sc-toast" data-shown={low}>
        <span className="sc-toast-icon sc-toast-icon--warn"><AlertTriangle size={14} strokeWidth={2.5} /></span>
        <div><b>Mozzarella below reorder point</b><small>Purchase order drafted · 30 kg</small></div>
      </div>
    </Scene>
  )
}

const DELIVERY: [string, number, number, string][] = [['Mozzarella', 30, 30, 'kg'], ['Parmesan', 6, 5, 'kg'], ['Tomatoes', 40, 40, 'kg'], ['Basil', 2, 2, 'kg']]

/** The morning delivery is checked off against the order; stock follows. */
export function StockReceiveScene() {
  const { tick, ref, still } = useScene(1000)
  const t = still ? 99 : cyc(tick, 10)
  const checked = Math.min(DELIVERY.length, t)
  return (
    <Scene kind="photo" name="s-receive" sceneRef={ref}>
      <Photo src="/site/stock-produce.webp" />
      <div className="sc-card sc-float--bl sc-receiving">
        <header className="sc-head"><b>Delivery · Caseificio Rossi</b><span className="sc-count">PO-0218</span></header>
        <ul>
          {DELIVERY.map(([item, ordered, got, unit], i) => {
            const on = i < checked
            const short = got < ordered
            return (
              <li key={item} data-on={on} data-short={on && short}>
                <span className="sc-box">{on && <Check size={12} strokeWidth={3.5} />}</span>
                <span>{item}</span>
                <em className="ms-num">{on ? `${got} / ${ordered} ${unit}` : `${ordered} ${unit}`}</em>
              </li>
            )
          })}
        </ul>
        <small className="sc-receiving-note" data-on={checked === DELIVERY.length}>Stock updated · 1 kg parmesan short, noted for the supplier</small>
      </div>
    </Scene>
  )
}

const PARTS: [string, number, string][] = [['Mozzarella', 1.84, '#203d32'], ['Dough', 0.62, '#c9a27a'], ['Tomato', 0.48, '#c63f19'], ['Basil and oil', 0.3, '#9fb4a6']]

/** A donut builds the cost of one Margherita, ingredient by ingredient. */
export function StockCostScene() {
  const { tick, ref, still } = useScene(900)
  const t = still ? 99 : cyc(tick, 9)
  const shown = Math.min(PARTS.length, t + 1)
  const total = PARTS.slice(0, shown).reduce((s, [, v]) => s + v, 0)
  const r = 80
  const len = 2 * Math.PI * r
  const offsets = PARTS.map((_, i) => PARTS.slice(0, i).reduce((sum, [, v]) => sum + (v / 3.24) * len, 0))
  return (
    <Scene kind="donut" name="s-cost" sceneRef={ref}>
      <div className="sc-donut-ring">
        <svg viewBox="0 0 200 200">
          <circle cx="100" cy="100" r={r} className="sc-donut-track" />
          {PARTS.slice(0, shown).map(([name, v, color], i) => (
            <circle key={name} cx="100" cy="100" r={r} stroke={color} className="sc-donut-seg" strokeDasharray={`${(v / 3.24) * len} ${len}`} strokeDashoffset={-offsets[i]} />
          ))}
        </svg>
        <div><strong className="ms-num">{eur(total)}</strong><small>cost of €12.00</small></div>
      </div>
      <ul className="sc-legend">
        {PARTS.map(([name, v, color], i) => <li key={name} data-on={i < shown}><i style={{ background: color }} />{name}<b className="ms-num">{eur(v)}</b></li>)}
        <li className="sc-legend-total" data-on={shown === PARTS.length}>Margin<b>73%</b></li>
      </ul>
    </Scene>
  )
}

/* ---------- Team ---------- */

const WEEK = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const SHIFTS: [string, number, number, number][] = [
  ['Maria', 0, 11, 8], ['Maria', 1, 11, 8], ['Maria', 4, 15, 8], ['Maria', 5, 15, 8],
  ['Jonas', 0, 15, 8], ['Jonas', 2, 15, 8], ['Jonas', 4, 15, 8], ['Jonas', 5, 11, 12],
  ['Raj', 1, 17, 5], ['Raj', 2, 17, 5], ['Raj', 4, 17, 6], ['Raj', 6, 12, 8],
]
const STAFF = ['Maria', 'Jonas', 'Raj']

/** "Copy last week" fills the schedule, shift by shift. */
export function TeamCalendarScene() {
  const { tick, ref, still } = useScene(250)
  const t = still ? 99 : cyc(tick, 30)
  const shown = Math.max(0, Math.min(SHIFTS.length, t - 3))
  return (
    <Scene kind="canvas" name="t-cal" sceneRef={ref}>
      <div className="sc-window">
        <div className="sc-window-bar"><b>Schedule · week 47</b><span className="sc-store">Old Town</span><span className="sc-copy-btn" data-pressed={!still && t >= 2 && t <= 4}><Copy size={13} /> Copy last week</span></div>
        <div className="sc-cal">
          <span />{WEEK.map((d) => <b key={d}>{d}</b>)}
          {STAFF.map((name, row) => (
            <div key={name} className="sc-cal-row" style={{ gridRow: row + 2 }}>
              <span className="sc-cal-name"><Avatar name={name} i={row} />{name}</span>
              {WEEK.map((d, col) => {
                const idx = SHIFTS.findIndex(([n, c]) => n === name && c === col)
                const s = SHIFTS[idx]
                return <i key={d}>{s && idx < shown && <em className="sc-shift">{s[2]}–{s[2] + s[3]}</em>}</i>
              })}
            </div>
          ))}
        </div>
      </div>
      <span className="sc-card sc-chip sc-cal-count"><b className="ms-num">{shown}</b> shifts · {Math.max(0, 3 - Math.floor(shown / 5))} to confirm</span>
    </Scene>
  )
}

function hms(total: number): string {
  const h = Math.floor(total / 3600)
  return `${h}:${clock(total % 3600)}`
}

const ON_NOW: [string, number, string?][] = [['Maria Alves', 3720], ['Jonas Klein', 5040, 'Break'], ['Raj Kumar', 3480], ['Sara Rossi', 7200]]

/** Who is working right now, with live timers; someone clocks in. */
export function TeamPresenceScene() {
  const { tick, ref, still } = useScene()
  const joined = still || cyc(tick, 10) >= 4
  return (
    <Scene kind="presence" name="t-on" sceneRef={ref}>
      <header><small>On now · Old Town</small><strong className="ms-num">{joined ? 5 : 4} people</strong></header>
      <div className="sc-people">
        {ON_NOW.map(([name, base, badge], i) => (
          <div key={name} className="sc-person">
            <Avatar name={name} i={i} size={64} />
            <b>{name.split(' ')[0]}</b>
            {badge ? <span className="sc-person-badge">{badge}</span> : <em className="ms-num">{hms(base + tick)}</em>}
          </div>
        ))}
        <div className="sc-person" data-new={joined}>
          <Avatar name="Ana Silva" i={4} size={64} />
          <b>Ana</b>
          <em>{joined ? 'Just clocked in' : ''}</em>
        </div>
      </div>
    </Scene>
  )
}

const TIP_SPLIT: [string, number][] = [['Maria', 0.34], ['Jonas', 0.28], ['Raj', 0.22], ['Ana', 0.16]]

/** Tonight's tips, shared by hours worked. */
export function TeamTipsScene() {
  const { tick, ref, still } = useScene(600)
  const p = prog(tick, still, 14, 6)
  return (
    <Scene kind="type" name="t-tips" sceneRef={ref}>
      <small className="sc-eta-label">Tips tonight</small>
      <strong className="sc-odo ms-num">{eur(184 * p, 0)}</strong>
      <div className="sc-tips">
        {TIP_SPLIT.map(([name, share], i) => (
          <div key={name}>
            <Avatar name={name} i={i} />
            <div className="sc-tip-bar"><i style={{ width: `${share * 100 * p * 2.6}%` }} /></div>
            <b className="ms-num">{eur(184 * share * p)}</b>
          </div>
        ))}
      </div>
    </Scene>
  )
}

const ROLES = ['Cashier', 'Cook', 'Driver', 'Manager']
const AREAS = ['Orders', 'Kitchen', 'Refunds', 'Stock', 'Reports']
const ACCESS = [[1, 0, 0, 0, 0], [0, 1, 0, 1, 0], [1, 0, 0, 0, 0], [1, 1, 1, 1, 1]]

/** Roles and what each may open; a refund permission is switched on. */
export function TeamAccessScene() {
  const { tick, ref, still } = useScene(1000)
  const t = still ? 99 : cyc(tick, 10)
  const flipped = t >= 3
  const pin = t >= 6
  return (
    <Scene kind="matrix" name="t-access" sceneRef={ref}>
      <div className="sc-card sc-matrix-card">
        <span />{AREAS.map((a) => <b key={a}>{a}</b>)}
        {ROLES.map((role, r) => (
          <div key={role} className="sc-matrix-row" style={{ gridRow: r + 2 }}>
            <span>{role}</span>
            {AREAS.map((a, c) => {
              const on = ACCESS[r][c] === 1 || (r === 0 && c === 2 && flipped)
              return <i key={a} data-on={on} data-flash={r === 0 && c === 2 && !still && t === 3} />
            })}
          </div>
        ))}
      </div>
      <div className="sc-card sc-toast" data-shown={pin}>
        <span className="sc-toast-icon"><KeyRound size={14} /></span>
        <div><b>New PIN for Maria A.</b><small>Shown once · works on any Old Town terminal</small></div>
      </div>
    </Scene>
  )
}
