/** Product-page scenes for ordering, counter and delivery. */
import { Bike, Check, ChefHat, MapPin, Star } from 'lucide-react'
import { BrandMark } from '../Brand'
import { Avatar, Photo, Scene, cyc, eur, prog, useScene } from './kit'

/* ---------- Ordering ---------- */

const MENU = [
  { img: '/site/dish-margherita-pizza.webp', name: 'Margherita', price: '€12.00', tags: ['Gluten', 'Milk'], nuts: false, veg: true },
  { img: '/site/dish-chicken-tikka-masala.webp', name: 'Chicken tikka masala', price: '€15.00', tags: ['Milk', 'Nuts'], nuts: true, veg: false },
  { img: '/site/dish-mushroom-risotto.webp', name: 'Mushroom risotto', price: '€14.50', tags: ['Milk', 'Celery'], nuts: false, veg: true },
  { img: '/site/dish-greek-salad.webp', name: 'Greek salad', price: '€9.50', tags: ['Milk'], nuts: false, veg: true },
]

/** The guest switches on "No nuts", then "Vegetarian"; dishes that don't fit step aside. */
export function OrderingMenuScene() {
  const { tick, ref, still } = useScene(1200)
  const t = still ? 4 : cyc(tick, 10)
  const noNuts = t >= 2
  const veg = t >= 5
  return (
    <Scene kind="canvas" name="o-menu" sceneRef={ref}>
      <div className="sc-window">
        <div className="sc-window-bar"><b>Riverside Kitchen</b><span className="sc-store">Delivery · 25–35 min</span></div>
        <div className="sc-filters"><span data-on={noNuts}>No nuts</span><span data-on={veg}>Vegetarian</span><span>No gluten</span></div>
        <ul className="sc-menu">
          {MENU.map((d) => {
            const hidden = (noNuts && d.nuts) || (veg && !d.veg)
            return (
              <li key={d.name} data-hidden={hidden}>
                <img src={d.img} alt="" loading="lazy" decoding="async" />
                <div><b>{d.name}</b><span className="sc-tags">{d.tags.map((tag) => <i key={tag} data-warn={tag === 'Nuts'}>{tag}</i>)}</span></div>
                <em>{d.price}</em>
              </li>
            )
          })}
        </ul>
      </div>
      <div className="sc-card sc-toast" data-shown={noNuts}><span className="sc-toast-icon"><Check size={14} strokeWidth={3} /></span><div><b>1 dish hidden</b><small>Contains nuts</small></div></div>
    </Scene>
  )
}

const BANNERS = [
  { title: 'Payment received', body: '€26.00 · card · order #1042', time: '19:02' },
  { title: 'Your order is being prepared', body: 'Margherita and Greek salad', time: '19:05' },
  { title: 'Raj is on the way', body: 'Arriving in about 12 minutes', time: '19:21' },
]

/** The guest's lock screen as the order moves: paid, cooking, on the way. */
export function OrderingCheckoutScene() {
  const { tick, ref, still } = useScene(1300)
  const shown = still ? BANNERS.length : Math.min(BANNERS.length, cyc(tick, 8))
  const latest = BANNERS[Math.max(0, shown - 1)]
  return (
    <Scene kind="photo" name="o-lock" sceneRef={ref}>
      <Photo src="/site/restaurant-table.webp" />
      <div className="sc-lock">
        <strong className="ms-num">{latest.time}</strong>
        <small>Friday 21 November</small>
        <ul>
          {BANNERS.slice(0, shown).reverse().map((b) => (
            <li key={b.title}>
              <span className="sc-lock-app"><BrandMark size={20} /></span>
              <div><header><b>Riverside Kitchen</b><time>{b.time}</time></header><p><b>{b.title}</b> {b.body}</p></div>
            </li>
          ))}
        </ul>
      </div>
    </Scene>
  )
}

const CHANNELS = [
  { name: 'Your website', fee: 0.7, label: 'card fee' },
  { name: 'Kiosk', fee: 0.7, label: 'card fee' },
  { name: 'Counter', fee: 0, label: 'cash' },
  { name: 'Marketplace', fee: 7.2, label: '30% commission' },
]

/** The same €24 order through four channels, and what you keep from each. */
export function OrderingChannelsScene() {
  const { tick, ref, still } = useScene(800)
  const p = prog(tick, still, 14, 6)
  return (
    <Scene kind="bars" name="o-channels" sceneRef={ref}>
      <header className="sc-bars-head"><small>One €24.00 order</small><strong>What you keep</strong></header>
      {CHANNELS.map((c) => {
        const keep = 24 - c.fee * p
        return (
          <div key={c.name} className="sc-keep">
            <span>{c.name}</span>
            <div className="sc-keep-bar"><i style={{ width: `${(keep / 24) * 100}%` }} /><b style={{ width: `${((c.fee * p) / 24) * 100}%` }} /></div>
            <em className="ms-num">{eur(keep)}</em>
            <small>{c.fee ? `−${eur(c.fee * p)} ${c.label}` : c.label}</small>
          </div>
        )
      })}
    </Scene>
  )
}

/* ---------- Counter ---------- */

const TILES = [
  { img: '/site/dish-margherita-pizza.webp', name: 'Margherita', price: 12 },
  { img: '/site/dish-greek-salad.webp', name: 'Greek salad', price: 9.5 },
  { img: '/site/dish-mushroom-risotto.webp', name: 'Risotto', price: 14.5 },
  { img: '/site/dish-chicken-tikka-masala.webp', name: 'Tikka masala', price: 15 },
]
const TAPS = [0, 1, 0, 2]

/** Taps on big dish tiles build the order on the right. */
export function CounterTapScene() {
  const { tick, ref, still } = useScene(1100)
  const n = still ? 3 : Math.min(TAPS.length, cyc(tick, 7) + 1)
  const lines = TAPS.slice(0, n)
  const counts = new Map<number, number>()
  lines.forEach((i) => counts.set(i, (counts.get(i) ?? 0) + 1))
  const total = lines.reduce((sum, i) => sum + TILES[i].price, 0)
  const tapped = still ? -1 : TAPS[n - 1]
  return (
    <Scene kind="tiles" name="c-tap" sceneRef={ref}>
      <div className="sc-tile-grid">
        {TILES.map((d, i) => (
          <div key={d.name} className="sc-tile" data-tap={i === tapped}>
            <img src={d.img} alt="" loading="lazy" decoding="async" />
            <b>{d.name}</b><small>{eur(d.price)}</small>
            {i === tapped && <span className="sc-ripple" key={n} />}
          </div>
        ))}
      </div>
      <div className="sc-card sc-rail">
        <header><b>Table 6</b><small>Dine-in · Maria A.</small></header>
        <ul>{[...counts].map(([i, c]) => <li key={i}><span>{c} × {TILES[i].name}</span><b>{eur(TILES[i].price * c)}</b></li>)}</ul>
        <footer><span>Total</span><b className="ms-num" key={total}>{eur(total)}</b></footer>
      </div>
    </Scene>
  )
}

/** Four digits, then a big hello. */
export function CounterPinScene() {
  const { tick, ref, still } = useScene(600)
  const t = still ? 6 : cyc(tick, 11)
  const filled = Math.min(4, t)
  const hello = t >= 5
  return (
    <Scene kind="type" name="c-pin" sceneRef={ref}>
      {hello ? (
        <div className="sc-hello" key="hello">
          <Avatar name="Maria Alves" i={0} size={72} />
          <strong>Hi Maria</strong>
          <small>Clocked in at 16:58 · Counter · Old Town</small>
        </div>
      ) : (
        <div className="sc-pin" key="pin">
          <small>Enter your PIN</small>
          <div>{[0, 1, 2, 3].map((i) => <i key={i} data-on={i < filled} />)}</div>
        </div>
      )}
    </Scene>
  )
}

/** A cashier asks for a refund; the manager approves it on their phone. */
export function CounterRefundScene() {
  const { tick, ref, still } = useScene(1100)
  const t = still ? 9 : cyc(tick, 10)
  const sent = t >= 1
  const approved = t >= 5
  return (
    <Scene kind="handoff" name="c-refund" sceneRef={ref}>
      <div className="sc-card sc-request">
        <header><Avatar name="Maria Alves" i={0} /><div><b>Refund request</b><small>Order #1038 · counter</small></div></header>
        <strong className="ms-num">€14.50</strong>
        <p>Wrong item delivered</p>
        <span className="sc-pill-state" data-on={sent}>{approved ? 'Approved' : sent ? 'Sent to manager' : 'Draft'}</span>
      </div>
      <div className="sc-handoff-line" data-on={sent}><i /></div>
      <div className="sc-card sc-approve" data-on={sent}>
        <header><Avatar name="Sara Rossi" i={3} /><div><b>Sara R.</b><small>Manager · on her phone</small></div></header>
        <p>Approve a €14.50 refund for #1038?</p>
        <div className="sc-approve-btns"><span data-pressed={approved}>{approved ? <><Check size={14} strokeWidth={3} /> Approved</> : 'Approve'}</span><span>Decline</span></div>
        <small className="sc-audit" data-on={approved}>Recorded · Sara R. · 19:44</small>
      </div>
    </Scene>
  )
}

/* ---------- Delivery ---------- */

/** The live map: zones, drivers moving, an order assigned on its own. */
export function DeliveryDispatchScene() {
  const { tick, ref, still } = useScene(1200)
  const assigned = still || cyc(tick, 9) >= 4
  return (
    <Scene kind="map" name="d-map" sceneRef={ref}>
      <svg className="sc-map-svg" viewBox="0 0 600 470" preserveAspectRatio="xMidYMid slice">
        <rect width="600" height="470" className="sc-map-land" />
        <path d="M-20 120 L620 180 M-20 330 L620 290 M140 -20 L200 490 M420 -20 L380 490 M-20 40 L300 470" className="sc-map-road" />
        <path d="M60 470 C 140 380, 260 360, 300 250 S 480 120, 620 110" className="sc-map-river" />
        <circle cx="300" cy="235" r="210" className="sc-zone" /><circle cx="300" cy="235" r="135" className="sc-zone" /><circle cx="300" cy="235" r="70" className="sc-zone sc-zone--a" />
      </svg>
      <span className="sc-map-store" style={{ left: '50%', top: '50%' }}><ChefHat size={15} /></span>
      <span className="sc-map-driver sc-map-driver--1"><Bike size={13} /></span>
      <span className="sc-map-driver sc-map-driver--2"><Bike size={13} /></span>
      <span className="sc-map-driver sc-map-driver--3"><Bike size={13} /></span>
      <span className="sc-map-label" style={{ left: '56%', top: '40%' }}>Zone A · €2.50</span>
      <span className="sc-map-label" style={{ left: '66%', top: '24%' }}>Zone B · €3.50</span>
      <div className="sc-card sc-toast" data-shown={assigned}>
        <Avatar name="Carla Mendes" i={4} />
        <div><b>#1049 assigned to Carla</b><small>Nearest free driver · 1.4 km</small></div>
      </div>
    </Scene>
  )
}

const JOBS = [
  { id: '#1049', where: 'Canal Street 14', km: '2.1 km', pay: '€4.20' },
  { id: '#1051', where: 'Station Road 2', km: '3.4 km', pay: '€5.10' },
  { id: '#1052', where: 'Mill Lane 9', km: '1.2 km', pay: '€3.60' },
]

/** New jobs arrive as cards; the driver accepts one and the next slides up. */
export function DeliveryDeckScene() {
  const { tick, ref, still } = useScene(1000)
  const t = cyc(tick, 5)
  const round = still ? 0 : Math.floor(tick / 5)
  const leaving = !still && t >= 3
  const deck = [0, 1, 2].map((k) => JOBS[(round + k) % JOBS.length])
  return (
    <Scene kind="deck" name="d-deck" sceneRef={ref}>
      <span className="sc-earn"><b className="ms-num">{eur(96.4 + round * 4.2)}</b> today</span>
      <div className="sc-deck-stack">
        {deck.map((j, k) => (
          <div key={`${round}-${k}`} className="sc-card sc-job" data-pos={k} data-leaving={k === 0 && leaving}>
            <header><b>New delivery {j.id}</b><span>{j.pay}</span></header>
            <p><MapPin size={14} /> {j.where} · {j.km}</p>
            <div className="sc-job-btns"><span data-pressed={k === 0 && t === 2}>Accept</span><span>Pass</span></div>
          </div>
        ))}
      </div>
    </Scene>
  )
}

/** The guest rates the delivery; the week's on-time rate sits beside it. */
export function DeliveryRatingScene() {
  const { tick, ref, still } = useScene(450)
  const t = still ? 99 : cyc(tick, 18)
  const stars = Math.min(5, Math.max(0, t - 1))
  const r = 52
  const len = 2 * Math.PI * r
  const p = prog(tick, still, 18, 8)
  return (
    <Scene kind="type" name="d-rate" sceneRef={ref}>
      <small className="sc-eta-label">How was your delivery?</small>
      <div className="sc-big-stars">{[0, 1, 2, 3, 4].map((i) => <Star key={i} size={46} data-on={i < stars} />)}</div>
      <div className="sc-card sc-ontime">
        <span className="sc-mini-ring">
          <svg viewBox="0 0 120 120"><circle cx="60" cy="60" r={r} className="sc-ring-track" /><circle cx="60" cy="60" r={r} className="sc-ring-fill" strokeDasharray={len} strokeDashoffset={len * (1 - 0.96 * p)} /></svg>
          <b className="ms-num">{Math.round(96 * p)}%</b>
        </span>
        <div><b>On time this week</b><small>Average delivery 24 min · Riverside</small></div>
      </div>
    </Scene>
  )
}

