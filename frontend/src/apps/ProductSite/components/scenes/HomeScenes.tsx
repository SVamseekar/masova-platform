/** Scenes for the home page hero and the "From order to outcome" journey. */
import { Bike, Check, ChefHat, ShoppingBag, Sparkles, Star, Store, Home, Users } from 'lucide-react'
import type { ReactNode } from 'react'
import { BrandMark } from '../Brand'
import { Photo, Scene, clock, cyc, prog, useScene, whole } from './kit'

/* ---------- Hero: tonight, as it happens ---------- */

const EVENTS: { icon: ReactNode; title: string; sub: string; meta?: string; action?: string }[] = [
  { icon: <ShoppingBag size={16} />, title: 'New order #1049', sub: 'Kiosk · 2 × Greek salad', meta: '€19.00' },
  { icon: <ChefHat size={16} />, title: 'Ticket #1046 is ready', sub: 'Kitchen · cooked in 11 min' },
  { icon: <Sparkles size={16} />, title: 'Reorder mozzarella?', sub: '30 kg for Friday · €246', action: 'Review' },
  { icon: <Bike size={16} />, title: 'Raj delivered #1042', sub: 'Code confirmed at the door', meta: '2 min early' },
  { icon: <Star size={16} />, title: 'New 5-star review', sub: 'Riverside · “Best risotto in town”' },
  { icon: <Users size={16} />, title: 'Ana clocked in', sub: 'Counter · Old Town', meta: '17:00' },
]

export function HeroTonightScene() {
  const { tick, ref, still } = useScene(2000)
  const newest = still ? 3 : tick + 3
  const shown = [0, 1, 2, 3].map((k) => newest - k)
  return (
    <Scene kind="fragments" name="hero" sceneRef={ref}>
      <div className="sc-card sc-hero-stat">
        <header><BrandMark size={18} /><b>Tonight</b><span>3 sites</span><i className="sc-live-dot" /></header>
        <strong className="ms-num">{whole(214 + tick)}</strong>
        <small>orders · €{whole(6920 + tick * 24)} · up 12% on last Friday</small>
        <div className="sc-hero-bars">{[38, 52, 46, 70, 88, 64, 92, 80].map((h, i) => <i key={i} style={{ height: `${h}%` }} />)}</div>
      </div>
      <ul className="sc-hero-feed">
        {shown.map((abs, k) => {
          const e = EVENTS[((abs % EVENTS.length) + EVENTS.length) % EVENTS.length]
          return (
            <li key={abs} className="sc-card" data-new={k === 0 && !still} data-depth={k}>
              <span className="sc-hero-icon">{e.icon}</span>
              <div><b>{e.title}</b><small>{e.sub}</small></div>
              {e.action ? <span className="sc-hero-action">{e.action}</span> : e.meta && <em>{e.meta}</em>}
            </li>
          )
        })}
      </ul>
    </Scene>
  )
}

/* ---------- Journey 1: the guest orders ---------- */

const RECEIPT: [string, string][] = [
  ['1 × Margherita', '€12.00'],
  ['1 × Greek salad', '€9.50'],
  ['Delivery · 2.1 km', '€2.50'],
  ['Tip for the team', '€2.00'],
]

export function JourneyOrderScene() {
  const { tick, ref, still } = useScene(800)
  const t = cyc(tick, 12)
  const lines = still ? RECEIPT.length : Math.min(RECEIPT.length, t)
  const paid = still || t >= 6
  return (
    <Scene kind="photo" name="j-order" sceneRef={ref}>
      <Photo src="/site/guest-meal.webp" />
      <div className="sc-receipt">
        <header><b>Riverside Kitchen</b><small>Order #1042 · delivery</small></header>
        <ul>
          {RECEIPT.slice(0, lines).map(([item, price]) => <li key={item}><span>{item}</span><b>{price}</b></li>)}
        </ul>
        <p className="sc-receipt-allergens">Contains: gluten, milk</p>
        <footer><span>Total</span><b>€26.00</b></footer>
        <span className="sc-receipt-paid" data-on={paid}><Check size={14} strokeWidth={3} /> Paid online</span>
      </div>
    </Scene>
  )
}

/* ---------- Journey 2: the kitchen cooks ---------- */

export function JourneyKitchenScene() {
  const { tick, ref, still } = useScene(1000)
  const target = 12
  const t = still ? target : cyc(tick, target + 4)
  const p = Math.min(1, t / target)
  const ready = p >= 1
  const r = 64
  const len = 2 * Math.PI * r
  return (
    <Scene kind="photo" name="j-kitchen" sceneRef={ref}>
      <Photo src="/site/kitchen-oven.webp" />
      <div className="sc-card sc-ring-card" data-ready={ready}>
        <svg viewBox="0 0 160 160" className="sc-ring">
          <circle cx="80" cy="80" r={r} className="sc-ring-track" />
          <circle cx="80" cy="80" r={r} className="sc-ring-fill" strokeDasharray={len} strokeDashoffset={len * (1 - p)} />
        </svg>
        <div className="sc-ring-text">
          <strong className="ms-num">{ready ? 'Ready' : clock(60 + t * 15)}</strong>
          <small>#1042 · Tikka masala</small>
        </div>
        <span className="sc-ring-chip">{ready ? 'Bumped to ready' : t > 3 ? 'Preparing' : 'Received'}</span>
      </div>
    </Scene>
  )
}

/* ---------- Journey 3: a driver delivers ---------- */

export function JourneyDriverScene() {
  const { tick, ref, still } = useScene(900)
  const t = still ? 10 : cyc(tick, 14)
  const p = Math.min(1, t / 8)
  const arrived = p >= 1
  const digits = arrived ? Math.min(4, t - 8) : 0
  const delivered = still || t >= 12
  return (
    <Scene kind="type" name="j-driver" sceneRef={ref}>
      <p className="sc-eta-label">{delivered ? 'Delivered' : arrived ? 'At the door' : 'Raj is on the way'}</p>
      <strong className="sc-eta ms-num">{delivered ? '19:33' : arrived ? 'Now' : `${Math.max(1, Math.round(12 * (1 - p)))} min`}</strong>
      <div className="sc-route">
        <span className="sc-route-end"><Store size={16} /></span>
        <div className="sc-route-line"><i style={{ width: `${p * 100}%` }} /><span className="sc-route-rider" style={{ left: `${p * 100}%` }}><Bike size={15} /></span></div>
        <span className="sc-route-end sc-route-end--home"><Home size={16} /></span>
      </div>
      <div className="sc-card sc-code" data-on={arrived}>
        <small>Handover code from the guest</small>
        <div>{['4', '8', '1', '7'].map((d, i) => <span key={i} data-on={still || i < digits}>{still || i < digits ? d : ''}</span>)}</div>
        <em data-on={delivered}><Check size={14} strokeWidth={3} /> Delivery confirmed</em>
      </div>
    </Scene>
  )
}

/* ---------- Journey 4: the manager sees it ---------- */

const TONIGHT = [6, 9, 14, 22, 31, 44, 58, 64, 61, 52, 40]
const LAST_FRIDAY = [5, 8, 12, 19, 27, 38, 50, 57, 55, 47, 36]
const HOURS = ['16', '17', '18', '19', '20', '21', '22']

function pathOf(values: number[]): string {
  return values.map((v, i) => `${i === 0 ? 'M' : 'L'}${(i / (values.length - 1)) * 400} ${150 - (v / 70) * 140}`).join(' ')
}

export function JourneyManagerScene() {
  const { tick, ref, still } = useScene(900)
  const at = still ? 7 : 3 + cyc(tick, 8)
  const p = prog(tick, still, 16, 4)
  const x = (at / (TONIGHT.length - 1)) * 400
  const y = 150 - (TONIGHT[at] / 70) * 140
  return (
    <Scene kind="chart" name="j-manager" sceneRef={ref}>
      <header className="sc-chart-head">
        <div><small>Orders per hour · Old Town</small><strong className="ms-num">+12%</strong><span>against last Friday</span></div>
        <ul><li><i data-k="now" />Tonight</li><li><i data-k="then" />Last Friday</li></ul>
      </header>
      <div className="sc-chart-plot">
        <svg viewBox="0 0 400 160" preserveAspectRatio="none">
          {[30, 70, 110, 150].map((gy) => <line key={gy} x1="0" x2="400" y1={gy} y2={gy} className="sc-grid" />)}
          <path d={pathOf(LAST_FRIDAY)} className="sc-line-then" />
          <path d={`${pathOf(TONIGHT)} L400 160 L0 160 Z`} className="sc-area" style={{ opacity: p * 0.9 }} />
          <path d={pathOf(TONIGHT)} className="sc-line-now" pathLength={1} style={{ strokeDashoffset: 1 - p }} />
        </svg>
        <span className="sc-chart-dot" style={{ left: `${(x / 400) * 100}%`, top: `${(y / 160) * 100}%` }} />
        <span className="sc-card sc-chart-tip" style={{ left: `${(x / 400) * 100}%`, top: `${(y / 160) * 100}%` }}>
          <b>{16 + Math.floor(at / 1.6)}:{at % 2 ? '30' : '00'}</b> · {TONIGHT[at]} orders
        </span>
      </div>
      <div className="sc-chart-axis">{HOURS.map((h) => <span key={h}>{h}:00</span>)}</div>
    </Scene>
  )
}

/* ---------- Journey 5: AI prepares ---------- */

const SIGNALS = ['214 orders tonight · +12%', 'Mozzarella 18 kg · 2 days left', 'Friday forecast · +25% orders', '3-star review · late delivery']
const DRAFTS = ['Reorder 30 kg mozzarella', 'Add a driver, Friday 18–22', 'Reply to the 3-star review']

export function JourneyAiScene() {
  const { tick, ref, still } = useScene(1100)
  const t = still ? 99 : cyc(tick, 11)
  const read = Math.min(SIGNALS.length, t + 1)
  const drafted = still ? DRAFTS.length : Math.max(0, Math.min(DRAFTS.length, t - 3))
  return (
    <Scene kind="flow" name="j-ai" sceneRef={ref}>
      <div className="sc-flow-col">
        <small className="sc-flow-label">What the assistants read</small>
        {SIGNALS.map((s, i) => <div key={s} className="sc-signal" data-on={i < read}>{s}</div>)}
      </div>
      <div className="sc-flow-arrow"><Sparkles size={18} /></div>
      <div className="sc-flow-col">
        <small className="sc-flow-label">What they prepare</small>
        {DRAFTS.map((d, i) => (
          <div key={d} className="sc-card sc-draft" data-on={i < drafted}>
            <b>{d}</b><span>Ready for your yes or no</span>
          </div>
        ))}
      </div>
    </Scene>
  )
}
