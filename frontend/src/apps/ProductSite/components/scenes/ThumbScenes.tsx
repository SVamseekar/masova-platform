/** One small, distinct moment for each product area on the home grid. Drawn at 470 px and scaled down. */
import { Bike, Check, CreditCard, Star } from 'lucide-react'
import type { ProductArea } from '../../locales'
import { Avatar, Scene, clock, cyc, eur, prog, useScene, whole } from './kit'

function OrderingThumb() {
  const { tick, ref, still } = useScene(1100)
  const count = still ? 2 : 1 + cyc(tick, 4)
  return (
    <Scene kind="thumb" name="t-ordering" sceneRef={ref}>
      <div className="sc-card sc-t-dish">
        <img src="/site/dish-margherita-pizza.webp" alt="" loading="lazy" decoding="async" />
        <div><b>Margherita</b><small>San Marzano, fior di latte</small><em>€12.00</em></div>
        <span className="sc-t-add" key={count}>+</span>
      </div>
      <span className="sc-t-basket" key={`b${count}`}>Basket · {count}</span>
    </Scene>
  )
}

function CounterThumb() {
  const { tick, ref, still } = useScene(1000)
  const approved = still || cyc(tick, 6) >= 3
  return (
    <Scene kind="thumb" name="t-counter" sceneRef={ref}>
      <strong className="ms-num">€34.00</strong>
      <span className="sc-t-tap" data-on={!approved}><CreditCard size={22} /><i /><i /><i /></span>
      <span className="sc-t-ok" data-on={approved}><Check size={16} strokeWidth={3} /> Card approved</span>
    </Scene>
  )
}

function KitchenThumb() {
  const { tick, ref } = useScene()
  const rows: [string, number, number, string][] = [['#1046', 130, 600, 'amber'], ['#1043', 500, 600, 'red'], ['#1047', 45, 600, 'green']]
  return (
    <Scene kind="thumb" name="t-kitchen" sceneRef={ref}>
      {rows.map(([id, base, max, tone]) => (
        <div key={id} className="sc-t-stripe" data-tone={tone}>
          <b>{id}</b><div><i style={{ width: `${Math.min(100, ((base + tick) / max) * 100)}%` }} /></div><em className="ms-num">{clock(base + tick)}</em>
        </div>
      ))}
    </Scene>
  )
}

function DeliveryThumb() {
  const { tick, ref, still } = useScene(900)
  const p = still ? 0.6 : cyc(tick, 10) / 9
  return (
    <Scene kind="thumb" name="t-delivery" sceneRef={ref}>
      <svg viewBox="0 0 350 200" className="sc-t-route"><path d="M20 150 C 100 150, 100 60, 190 66 S 290 40, 330 40" pathLength={1} /></svg>
      <span className="sc-t-rider" style={{ offsetDistance: `${p * 100}%` }}><Bike size={16} /></span>
      <span className="sc-t-eta">Raj · {Math.max(1, Math.round(12 * (1 - p)))} min</span>
    </Scene>
  )
}

function StockThumb() {
  const { tick, ref, still } = useScene(900)
  const level = still ? 22 : Math.max(18, 60 - cyc(tick, 12) * 5)
  return (
    <Scene kind="thumb" name="t-stock" sceneRef={ref}>
      <header><b>Mozzarella</b><span className="sc-t-low" data-on={level <= 30}>Low</span></header>
      <strong className="ms-num">{Math.round(level * 0.82)} kg</strong>
      <div className="sc-t-meter"><i style={{ width: `${level}%` }} data-low={level <= 30} /><span style={{ left: '30%' }} /></div>
    </Scene>
  )
}

function TeamThumb() {
  const { tick, ref, still } = useScene(1400)
  const n = still ? 5 : 3 + cyc(tick, 3)
  const people = ['Maria Alves', 'Jonas Klein', 'Raj Kumar', 'Sara Rossi', 'Ana Silva']
  return (
    <Scene kind="thumb" name="t-team" sceneRef={ref}>
      <div className="sc-t-stack">{people.slice(0, n).map((p, i) => <Avatar key={p} name={p} i={i} size={64} />)}</div>
      <p><b className="ms-num">{6 + n}</b> on shift now</p>
    </Scene>
  )
}

function GuestsThumb() {
  const { tick, ref, still } = useScene(500)
  const p = prog(tick, still, 14, 6)
  return (
    <Scene kind="thumb" name="t-guests" sceneRef={ref}>
      <strong className="ms-num">{(4.7 * p).toFixed(1)}</strong>
      <div className="sc-t-stars">{[0, 1, 2, 3, 4].map((i) => <Star key={i} size={26} data-on={p * 5 > i + 0.3} />)}</div>
      <small>{whole(128 * p)} reviews this month</small>
    </Scene>
  )
}

function InsightsThumb() {
  const { tick, ref, still } = useScene(500)
  const p = prog(tick, still, 14, 6)
  return (
    <Scene kind="thumb" name="t-insights" sceneRef={ref}>
      <small>Sales today</small>
      <strong className="ms-num">{eur(4416 * p, 0)}</strong>
      <svg viewBox="0 0 400 90" preserveAspectRatio="none"><path d="M0 80 L50 72 L100 76 L150 58 L200 60 L250 38 L300 44 L350 18 L400 10" pathLength={1} style={{ strokeDashoffset: 1 - p }} /></svg>
    </Scene>
  )
}

export function AreaThumbScene({ area }: { area: ProductArea }) {
  switch (area) {
    case 'ordering': return <OrderingThumb />
    case 'counter': return <CounterThumb />
    case 'kitchen': return <KitchenThumb />
    case 'delivery': return <DeliveryThumb />
    case 'stock': return <StockThumb />
    case 'team': return <TeamThumb />
    case 'guests': return <GuestsThumb />
    default: return <InsightsThumb />
  }
}
