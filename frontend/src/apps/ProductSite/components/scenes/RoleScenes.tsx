/** "A day with MaSoVa": one scene per role, drawn for the dark role panel. */
import { Check, MapPin } from 'lucide-react'
import { Avatar, Photo, Scene, cyc, eur, prog, useScene, whole } from './kit'

/* Manager: three stores race through the evening. */
const STORES = [
  { name: 'Old Town', city: 'Berlin', curve: [0.2, 0.42, 0.58, 0.8, 1] , total: 4416 },
  { name: 'Riverside', city: 'Amsterdam', curve: [0.3, 0.55, 0.7, 0.86, 1], total: 3870 },
  { name: 'Station', city: 'London', curve: [0.35, 0.6, 0.66, 0.78, 1], total: 3205 },
]

function RoleManagerScene() {
  const { tick, ref, still } = useScene(1200)
  const step = still ? 4 : cyc(tick, 7) > 4 ? 4 : cyc(tick, 7)
  const values = STORES.map((s) => s.total * s.curve[step])
  const max = Math.max(...values, 1)
  const order = values.map((v, i) => [v, i] as const).sort((a, b) => b[0] - a[0]).map(([, i]) => i)
  return (
    <Scene kind="race" name="r-manager" sceneRef={ref}>
      <header><small>Sales tonight · 3 stores</small><strong className="ms-num">{eur(values.reduce((a, b) => a + b, 0), 0)}</strong></header>
      <div className="sc-race-track">
        {STORES.map((s, i) => (
          <div key={s.name} className="sc-race-row" style={{ transform: `translateY(${order.indexOf(i) * 100}%)` }}>
            <span><b>{s.name}</b><small>{s.city}</small></span>
            <div className="sc-race-bar"><i style={{ width: `${(values[i] / max) * 100}%` }} /></div>
            <em className="ms-num">{eur(values[i], 0)}</em>
          </div>
        ))}
      </div>
    </Scene>
  )
}

/* AI assistants: each reads, then has a proposal ready. */
const AGENTS = [
  ['Stock', 'Reading 214 orders', 'Reorder 30 kg mozzarella'],
  ['Shifts', 'Reading Friday forecast', 'Add one driver, 18–22'],
  ['Pricing', 'Reading dish margins', 'Raise risotto by €0.50'],
  ['Reviews', 'Reading 12 new reviews', 'Two replies drafted'],
]

function RoleAgentsScene() {
  const { tick, ref, still } = useScene(900)
  const t = still ? 99 : cyc(tick, 10)
  return (
    <Scene kind="roster" name="r-agents" sceneRef={ref}>
      {AGENTS.map(([name, reading, ready], i) => {
        const done = t >= 2 + i * 1.5
        return (
          <div key={name} className="sc-agent" data-done={done}>
            <span className="sc-agent-mark">{name[0]}</span>
            <div><b>{name} assistant</b><small>{done ? ready : `${reading}…`}</small></div>
            <span className="sc-agent-state">{done ? <><Check size={13} strokeWidth={3} /> Ready</> : <i className="sc-shimmer" />}</span>
          </div>
        )
      })}
    </Scene>
  )
}

/* Counter: the bill splits between two guests. */
function RoleCounterScene() {
  const { tick, ref, still } = useScene(1000)
  const split = still || cyc(tick, 8) >= 3
  return (
    <Scene kind="split" name="r-counter" sceneRef={ref}>
      <div className="sc-card sc-bill" data-split={split}>
        <header><b>Table 6</b><small>4 items · Maria A.</small></header>
        <ul>
          <li><span>2 × Margherita</span><b>€24.00</b></li>
          <li><span>1 × Greek salad</span><b>€9.50</b></li>
          <li><span>Extra basil</span><b>€0.50</b></li>
        </ul>
        <footer><span>Total</span><b>€34.00</b></footer>
      </div>
      <div className="sc-halves" data-split={split}>
        <div className="sc-card"><small>Guest 1 · card</small><b className="ms-num">€17.00</b></div>
        <div className="sc-card"><small>Guest 2 · cash</small><b className="ms-num">€17.00</b></div>
      </div>
    </Scene>
  )
}

/* Kitchen: load by station through the rush. */
const STATIONS = [['Grill', [2, 3, 4, 3, 2]], ['Pizza', [3, 5, 6, 5, 4]], ['Cold', [1, 2, 2, 3, 1]]] as const

function RoleKitchenScene() {
  const { tick, ref, still } = useScene(1300)
  const step = still ? 2 : cyc(tick, 5)
  return (
    <Scene kind="stations" name="r-kitchen" sceneRef={ref}>
      {STATIONS.map(([name, load]) => {
        const n = load[step]
        return (
          <div key={name} className="sc-station" data-busy={n >= 5}>
            <div className="sc-station-stack">{Array.from({ length: 6 }, (_, i) => <i key={i} data-on={i < n} />)}</div>
            <b>{name}</b>
            <small>{n} tickets{n >= 5 ? ' · busy' : ''}</small>
          </div>
        )
      })}
    </Scene>
  )
}

/* Driver: the day's earnings add up. */
function RoleDriverScene() {
  const { tick, ref, still } = useScene(700)
  const p = prog(tick, still, 14, 7)
  const r = 46
  const len = 2 * Math.PI * r
  return (
    <Scene kind="type" name="r-driver" sceneRef={ref}>
      <small className="sc-eta-label">Raj · today</small>
      <strong className="sc-odo ms-num">{eur(96.4 * p)}</strong>
      <div className="sc-driver-stats">
        <span><b className="ms-num">{Math.round(14 * p)}</b> deliveries</span>
        <span><b className="ms-num">{Math.round(38 * p)}</b> km</span>
        <span className="sc-mini-ring">
          <svg viewBox="0 0 110 110"><circle cx="55" cy="55" r={r} className="sc-ring-track" /><circle cx="55" cy="55" r={r} className="sc-ring-fill" strokeDasharray={len} strokeDashoffset={len * (1 - 0.98 * p)} /></svg>
          <b className="ms-num">{Math.round(98 * p)}%</b><small>on time</small>
        </span>
      </div>
    </Scene>
  )
}

/* Guest: order ahead for a pickup time. */
const SLOTS = ['19:30', '19:45', '20:00', '20:15']

function RoleGuestScene() {
  const { tick, ref, still } = useScene(1200)
  const slot = still ? 1 : cyc(tick, SLOTS.length)
  return (
    <Scene kind="photo" name="r-guest" sceneRef={ref}>
      <Photo src="/site/menu/quattro-formaggi.webp" />
      <div className="sc-card sc-ahead">
        <header><Avatar name="Ana Silva" i={2} /><div><b>Pickup at Riverside</b><small><MapPin size={12} /> Canal Street 3</small></div></header>
        <div className="sc-slots">{SLOTS.map((s, i) => <span key={s} data-on={i === slot}>{s}</span>)}</div>
        <p>Ready at <b className="ms-num">{SLOTS[slot]}</b> · 2 items · {whole(1240)} points</p>
      </div>
    </Scene>
  )
}

export function RoleScene({ index }: { index: number }) {
  switch (index) {
    case 0: return <RoleManagerScene />
    case 1: return <RoleAgentsScene />
    case 2: return <RoleCounterScene />
    case 3: return <RoleKitchenScene />
    case 4: return <RoleDriverScene />
    case 5: return <RoleGuestScene />
    default:
      if (import.meta.env.DEV) throw new Error(`RoleScene: no scene for role ${index}`)
      return null
  }
}
