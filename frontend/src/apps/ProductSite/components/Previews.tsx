/**
 * Coded previews of the MaSoVa apps for the marketing site. Each one sits on the
 * hardware it runs on (laptop, counter tablet, kitchen screen, kiosk or phone), uses
 * sample data, and moves the way the product moves: tickets arrive, checks tick,
 * numbers count, replies are typed. Motion runs only while a preview is on screen;
 * with reduced motion each shows its finished state. They are decorative
 * (aria-hidden); each caller supplies a text description. App text stays in English
 * because the staff apps are English today.
 */
import type { CSSProperties, ReactNode } from 'react'
import { AppBar, KioskFrame, KitchenScreen, LaptopFrame, PhoneFrame, TabletFrame, usePreviewClock } from './Devices'
import type { ProductArea } from '../locales'
import { KitchenEquipmentScene, KitchenQualityScene, KitchenTicketsScene } from './Scenes'

type FrameRef = (node: HTMLElement | null) => void

const DISHES = [
  { img: '/site/dish-margherita-pizza.webp', name: 'Margherita', note: 'San Marzano, fior di latte', price: '€12.00', value: 12, tags: ['Gluten', 'Milk'] },
  { img: '/site/dish-mushroom-risotto.webp', name: 'Mushroom risotto', note: 'Porcini, parmesan', price: '€14.50', value: 14.5, tags: ['Milk', 'Celery'] },
  { img: '/site/dish-chicken-tikka-masala.webp', name: 'Chicken tikka masala', note: 'With basmati rice', price: '€15.00', value: 15, tags: ['Milk', 'Nuts'] },
  { img: '/site/dish-greek-salad.webp', name: 'Greek salad', note: 'Feta, olives, oregano', price: '€9.50', value: 9.5, tags: ['Milk'] },
]

/* ---------- Helpers ---------- */

function clock(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60)
  const s = totalSeconds % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

function eur(value: number, decimals = 2): string {
  return `€${value.toLocaleString('en-GB', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}`
}

function whole(value: number): string {
  return Math.round(value).toLocaleString('en-GB')
}

/** How far through a count-up the preview is: 0 to 1 over `steps` ticks of each `length`-tick cycle. */
function progress(tick: number, still: boolean, length: number, steps: number): number {
  return still ? 1 : Math.min(1, (tick % length) / steps)
}

/** The part of `text` typed so far; holds the full text for `hold` ticks, then starts again. */
function typed(text: string, tick: number, still: boolean, hold = 28): string {
  return still ? text : text.slice(0, tick % (text.length + hold))
}

type Device = 'laptop' | 'tablet' | 'kitchen'

/** A MaSoVa staff screen on its hardware: app bar on top, the screen's content below. */
function Screen({ device = 'laptop', title, store, user, live, frameRef, children }: { device?: Device; title: string; store?: string; user?: string; live?: boolean; frameRef?: FrameRef; children: ReactNode }) {
  const body = (
    <>
      <AppBar title={title} store={store} user={user} live={live} dark={device === 'kitchen'} />
      <div className="pv-screen">{children}</div>
    </>
  )
  if (device === 'tablet') return <TabletFrame stand className="pv" frameRef={frameRef}>{body}</TabletFrame>
  if (device === 'kitchen') return <KitchenScreen className="pv" frameRef={frameRef}>{body}</KitchenScreen>
  return <LaptopFrame className="pv" frameRef={frameRef}>{body}</LaptopFrame>
}

function Phone({ children, frameRef }: { children: ReactNode; frameRef?: FrameRef }) {
  return <PhoneFrame fit className="pv" frameRef={frameRef}>{children}</PhoneFrame>
}

function Pair({ children }: { children: ReactNode }) {
  return <div className="pv-pair">{children}</div>
}

function Meter({ value, tone }: { value: number; tone?: 'warn' | 'ok' | 'accent' }) {
  return <span className="pv-meter" data-tone={tone}><i style={{ width: `${value}%` }} /></span>
}

function Badge({ children, tone }: { children: ReactNode; tone?: 'ok' | 'info' | 'mute' }) {
  return <span className={tone ? `pv-badge pv-badge--${tone}` : 'pv-badge'}>{children}</span>
}

function Caret({ on }: { on: boolean }) {
  return on ? <span className="pv-caret" /> : null
}

/** A question and an answer; until `answered`, the answer shows typing dots. */
function ChatBubbles({ question, answer, answered = true, asked = true }: { question: string; answer: string; answered?: boolean; asked?: boolean }) {
  if (!asked) return null
  return (
    <div className="pv-chat">
      <p className="pv-chat-q">{question}</p>
      <p className="pv-chat-a" data-typing={!answered}>
        {answered ? answer : <span className="pv-dots-typing"><i /><i /><i /></span>}
      </p>
    </div>
  )
}

/* ---------- Manager ---------- */

const PROPOSALS = [
  { title: 'Stock reorder', text: 'Mozzarella will run short on Friday.', amount: '€246', sub: 'Draft purchase order · 30 kg' },
  { title: 'Shift planner', text: 'Friday dinner looks 25% busier.', amount: '+1 driver', sub: 'Friday 18:00–22:00' },
]

export function DashboardPreview() {
  const { tick, ref, still } = usePreviewClock()
  const t = tick % 12
  const index = Math.floor(tick / 12) % PROPOSALS.length
  const approved = !still && t >= 9
  const proposal = PROPOSALS[index]
  const orders = 86 + Math.floor(tick / 3)
  return (
    <Screen title="Overview" store="All stores" user="Sara Rossi" live frameRef={ref}>
      <div className="pv-dash">
        <div className="pv-rail">
          {['Overview', 'Orders', 'Kitchen', 'Delivery', 'Inventory', 'People', 'Reviews', 'AI assistants'].map((item, i) => (
            <span key={item} data-on={i === 0}>{item}</span>
          ))}
        </div>
        <div className="pv-main">
          <div className="pv-hello">
            Good evening, Sara
            <small>{approved ? 2 : 3} proposals waiting for your review</small>
          </div>
          <div className="pv-tiles">
            <div className="pv-tile"><small>Orders</small><b key={orders} className="pv-pop">{orders}</b></div>
            <div className="pv-tile"><small>In kitchen</small><b>{7 + (Math.floor(tick / 5) % 3)}</b></div>
            <div className="pv-tile"><small>Drivers out</small><b>4</b></div>
            <div className="pv-tile"><small>On shift</small><b>11</b></div>
          </div>
          <div className="pv-split">
            <div className="pv-card pv-card--glow pv-swap" key={index}>
              <h4>{proposal.title} {approved ? <Badge tone="ok">Approved</Badge> : <Badge>Needs approval</Badge>}</h4>
              <p>{proposal.text}</p>
              <div className="pv-amount">{proposal.amount}</div>
              <p>{proposal.sub}</p>
              <div className="pv-btn"><span data-pressed={approved}>{approved ? 'Approved' : 'Review'}</span><span>Later</span></div>
            </div>
            <div className="pv-card">
              <h4>Sales today</h4>
              <svg className="pv-spark" viewBox="0 0 160 46" preserveAspectRatio="none">
                <path d="M0 40 L18 36 L34 38 L52 28 L70 30 L88 18 L104 22 L122 10 L140 14 L160 6 L160 46 L0 46 Z" fill="#203d32" opacity="0.08" />
                <path className="pv-draw" pathLength={1} d="M0 40 L18 36 L34 38 L52 28 L70 30 L88 18 L104 22 L122 10 L140 14 L160 6" fill="none" stroke="#203d32" strokeWidth="2" />
              </svg>
              <ul className="pv-list">
                <li><span>Website</span><b>62%</b></li>
                <li><span>Counter</span><b>27%</b></li>
                <li><span>Marketplace</span><b>11%</b></li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </Screen>
  )
}

export function ApprovalPreview() {
  const { tick, ref, still } = usePreviewClock(1400)
  const done = still ? 1 : tick % 5
  const items = [
    { agent: 'Stock reorder', text: 'Order 30 kg mozzarella for Friday', why: 'Sales up 18% · 2 days of stock left' },
    { agent: 'Shift planner', text: 'Add one driver, Friday 18:00–22:00', why: 'Forecast +25% orders Friday' },
    { agent: 'Review replies', text: 'Reply drafted for a 3-star review', why: 'Delivery was 14 min late' },
  ]
  return (
    <Screen title="AI assistants · Proposals" store="Old Town" user="Sara Rossi" frameRef={ref}>
      <div className="pv-main">
        {items.map((p, i) => (
          <div className="pv-card" key={p.agent} data-done={i < done}>
            <h4>{p.agent} {i < done ? <Badge tone="ok">Approved · SR</Badge> : <Badge>Needs approval</Badge>}</h4>
            <p>{p.text}</p>
            <small className="pv-why">{p.why}</small>
          </div>
        ))}
      </div>
    </Screen>
  )
}

/* ---------- Ordering ---------- */

export function OrderingPhone({ dishes = 3 }: { dishes?: number }) {
  const { tick, ref, still } = usePreviewClock(1200)
  const count = still ? 2 : 1 + (Math.floor(tick / 2) % 4)
  const adding = still ? -1 : Math.floor(tick / 2) % dishes
  return (
    <Phone frameRef={ref}>
      <div className="pv-phone-head">
        <b>Riverside Kitchen</b>
        <span>Delivery · 25–35 min</span>
      </div>
      <div className="pv-phone-body">
        {DISHES.slice(0, dishes).map((dish, i) => (
          <div className="pv-dish" key={dish.name} data-on={i === adding}>
            <img src={dish.img} alt="" width={52} height={52} loading="lazy" decoding="async" />
            <div>
              <b>{dish.name}</b>
              <small>{dish.note}</small>
              <div className="pv-tags">{dish.tags.map((tag) => <span key={tag}>{tag}</span>)}</div>
              <em>{dish.price}</em>
            </div>
            <span className="pv-add">+</span>
          </div>
        ))}
      </div>
      <div className="pv-cta">View basket · <b key={count} className="pv-pop">{count}</b> {count === 1 ? 'item' : 'items'}</div>
    </Phone>
  )
}

function CheckoutPhone() {
  const { tick, ref, still } = usePreviewClock(1300)
  const tips = [1, 2, 3]
  const tip = still ? 2 : tips[Math.floor(tick / 2) % tips.length]
  return (
    <Phone frameRef={ref}>
      <div className="pv-phone-head">
        <b>Checkout</b>
        <span>Delivery to Canal Street 14</span>
      </div>
      <div className="pv-phone-body">
        <div className="pv-card">
          <ul className="pv-list">
            <li><span>1 × Margherita</span><b>€12.00</b></li>
            <li><span>1 × Greek salad</span><b>€9.50</b></li>
            <li><span>Delivery</span><b>€2.50</b></li>
          </ul>
        </div>
        <div className="pv-card">
          <h4>Add a tip</h4>
          <div className="pv-chips">{tips.map((v) => <span key={v} data-on={v === tip}>€{v}</span>)}<span>Other</span></div>
        </div>
        <div className="pv-card">
          <h4>Pay with</h4>
          <div className="pv-chips"><span data-on="true">Card</span><span>Cash</span></div>
        </div>
      </div>
      <div className="pv-cta">Pay <b key={tip} className="pv-pop">{eur(24 + tip)}</b></div>
    </Phone>
  )
}

const TRACK_STEPS = [['Order confirmed', '19:02'], ['Preparing', '19:05'], ['Out for delivery', '19:21'], ['Delivered', '19:33']] as const
const TRACK_ETA = ['Arriving in about 30 min', 'Arriving in about 24 min', 'Arriving in about 12 min', 'Delivered · enjoy your meal']

export function TrackingPhone() {
  const { tick, ref, still } = usePreviewClock(1500)
  const now = still ? 2 : Math.floor(tick / 2) % 4
  return (
    <Phone frameRef={ref}>
      <div className="pv-phone-head">
        <b>Order #1042</b>
        <span>{TRACK_ETA[now]}</span>
      </div>
      <div className="pv-phone-body">
        <MiniMap />
        <ul className="pv-track">
          {TRACK_STEPS.map(([label, time], i) => (
            <li key={label} data-done={i < now || (i === 3 && now === 3)} data-now={i === now && now < 3}><i /><span>{label}</span><small>{i <= now ? time : '–'}</small></li>
          ))}
        </ul>
      </div>
    </Phone>
  )
}

function MiniMap({ tall = false }: { tall?: boolean }) {
  return (
    <div className={tall ? 'pv-map pv-map--tall' : 'pv-map'}>
      <svg viewBox="0 0 200 110" preserveAspectRatio="none" aria-hidden="true">
        <path d="M30 86 C 60 86, 60 40, 100 40 S 150 22, 172 24" fill="none" stroke="#203d32" strokeWidth="2.5" strokeDasharray="5 5" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
      </svg>
      <span className="pv-pin pv-pin--store" style={{ left: '15%', top: '78%' }} />
      <span className="pv-pin pv-pin--home" style={{ left: '86%', top: '22%' }} />
      <span className="pv-rider" />
    </div>
  )
}

const QUEUE = [
  ['#1049', 'Kiosk', '2 × Greek salad'],
  ['#1048', 'Counter', '1 × Risotto · Table 6'],
  ['#1047', 'Marketplace', '1 × Tikka masala'],
  ['#1046', 'Website', '2 × Margherita'],
  ['#1045', 'Website', '1 × Margherita, 1 × Greek salad'],
] as const

function ChannelsPreview() {
  const { tick, ref, still } = usePreviewClock(2200)
  const sources = ['Website', 'Counter', 'Kiosk', 'Marketplace']
  const shift = still ? 0 : tick % QUEUE.length
  const queue = [...QUEUE.slice(QUEUE.length - shift), ...QUEUE.slice(0, QUEUE.length - shift)].slice(0, 4)
  return (
    <Screen title="Orders · All channels" store="Old Town" user="Sara Rossi" live frameRef={ref}>
      <div className="pv-channels">
        <ul className="pv-sources">
          {sources.map((source, i) => (
            <li key={source} style={{ animationDelay: `${i * 0.9}s` }}>
              <span>{source}</span>
              <i style={{ animationDelay: `${i * 0.9}s` }} />
            </li>
          ))}
        </ul>
        <div className="pv-queue">
          <h5>Kitchen queue</h5>
          {queue.map(([id, source, items], i) => (
            <div className={i === 0 && !still ? 'pv-ticket pv-ticket--in' : 'pv-ticket'} key={id}>
              <header><span>{id}</span><small>{source}</small></header>
              <p>{items}</p>
            </div>
          ))}
        </div>
      </div>
    </Screen>
  )
}

/* ---------- Counter ---------- */

const COUNTER_LINES = [
  { label: '2 × Margherita', value: 24, dish: 0 },
  { label: '1 × Greek salad', value: 9.5, dish: 3 },
  { label: 'Extra basil', value: 0.5, dish: 0 },
  { label: '1 × Mushroom risotto', value: 14.5, dish: 1 },
]

function CounterPreview() {
  const { tick, ref, still } = usePreviewClock(1200)
  const t = tick % 7
  const shown = still ? 3 : Math.min(COUNTER_LINES.length, t + 1)
  const sent = !still && t >= 5
  const lines = COUNTER_LINES.slice(0, shown)
  const total = lines.reduce((sum, line) => sum + line.value, 0)
  const picked = lines[lines.length - 1].dish
  return (
    <Screen device="tablet" title="Counter · New order" store="Old Town" user="Maria Alves" frameRef={ref}>
      <div className="pv-pos">
        <div>
          <div className="pv-chips pv-chips--tabs"><span data-on="true">Pizza</span><span>Pasta</span><span>Salads</span><span>Drinks</span></div>
          <div className="pv-pos-grid">
            {DISHES.map((dish, i) => (
              <div key={dish.name} data-on={i === picked}>
                <img src={dish.img} alt="" width={80} height={56} loading="lazy" decoding="async" />
                <b>{dish.name}</b>
                <small>{dish.price}</small>
              </div>
            ))}
          </div>
        </div>
        <div className="pv-pos-order">
          <div className="pv-chips"><span data-on="true">Dine-in</span><span>Takeaway</span><span>Delivery</span></div>
          <small>Table 6 · 2 guests</small>
          <ul className="pv-list">
            {lines.map((line) => <li key={line.label} className="pv-swap"><span>{line.label}</span><b>{eur(line.value)}</b></li>)}
          </ul>
          <div className="pv-total"><span>Total</span><b key={total} className="pv-pop">{eur(total)}</b></div>
          <div className="pv-cta" data-done={sent}>{sent ? 'Sent to kitchen ✓' : 'Send to kitchen'}</div>
        </div>
      </div>
    </Screen>
  )
}

function PinPreview() {
  const { tick, ref, still } = usePreviewClock(700)
  const t = tick % 9
  const filled = still ? 4 : Math.min(4, t)
  const clockedIn = still || t >= 5
  return (
    <Screen device="tablet" title="Staff sign-in" store="Old Town" frameRef={ref}>
      <div className="pv-split2">
        <div className="pv-pin-panel">
          <h4>Enter your PIN</h4>
          <div className="pv-pin-dots">{[0, 1, 2, 3].map((i) => <i key={i} data-on={i < filled} />)}</div>
          <div className="pv-pinpad">{['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '⌫'].map((k, i) => <span key={i} data-press={!still && k !== '' && i === [3, 7, 0, 6][t]}>{k}</span>)}</div>
        </div>
        <div className="pv-card">
          <h4>On this terminal</h4>
          <ul className="pv-people">
            <li data-on={clockedIn && !still && t < 8}><i>MA</i><span><b>Maria A.</b><small>Cashier · {clockedIn ? 'clocked in 16:58' : 'not signed in'}</small></span>{clockedIn ? <Badge tone="ok">On shift</Badge> : <Badge tone="mute">Signed out</Badge>}</li>
            <li><i>JK</i><span><b>Jonas K.</b><small>Kitchen · clocked in 15:30</small></span><Badge tone="ok">On shift</Badge></li>
            <li><i>SR</i><span><b>Sara R.</b><small>Manager</small></span><Badge tone="mute">Signed out</Badge></li>
          </ul>
          <div className="pv-btn"><span>Clock in</span><span>Clock out</span></div>
        </div>
      </div>
    </Screen>
  )
}

function PaymentsPreview() {
  const { tick, ref, still } = usePreviewClock(1400)
  const approved = !still && tick % 7 >= 4
  const extra = still ? 0 : Math.floor(tick / 2)
  return (
    <Screen device="tablet" title="Orders · Payments" store="Old Town" user="Sara Rossi" frameRef={ref}>
      <div className="pv-main">
        <div className="pv-card pv-card--glow">
          <h4>Refund request · #1038 {approved ? <Badge tone="ok">Approved</Badge> : <Badge>Needs approval</Badge>}</h4>
          <p>Wrong item delivered · requested by Maria A.</p>
          <div className="pv-amount">€14.50</div>
          <div className="pv-btn"><span data-pressed={approved}>{approved ? 'Refunded' : 'Approve'}</span><span>Reject</span></div>
        </div>
        <div className="pv-card">
          <h4>Daily report <small>Today</small></h4>
          <ul className="pv-list">
            <li><span>Card</span><Meter value={64} /><b>{eur(2184 + extra * 12, 0)}</b></li>
            <li><span>Online</span><Meter value={48} tone="accent" /><b>{eur(1620 + extra * 6, 0)}</b></li>
            <li><span>Cash</span><Meter value={18} tone="ok" /><b>€612</b></li>
          </ul>
          <div className="pv-total"><span>{142 + extra} orders</span><b key={extra} className="pv-pop">{eur(4416 + extra * 18, 0)}</b></div>
        </div>
      </div>
    </Screen>
  )
}

/* ---------- Kitchen ---------- */

type Ticket = { id: string; base: number; items: string; allergen?: string; source: string }

const T: Record<string, Ticket> = {
  a: { id: '#1046', base: 130, items: '2 × Margherita', allergen: 'Gluten · Milk', source: 'Website' },
  b: { id: '#1047', base: 45, items: '1 × Greek salad', source: 'Kiosk' },
  c: { id: '#1043', base: 500, items: '1 × Tikka masala, 2 × Naan', allergen: 'Nuts', source: 'Marketplace' },
  d: { id: '#1044', base: 365, items: '1 × Risotto', source: 'Counter' },
  e: { id: '#1042', base: 760, items: '1 × Tikka masala', source: 'Website' },
}

/** Ticket positions per phase: a ticket starts, then one moves to Preparing, then one is bumped to Ready. */
const KDS_PHASES: [string, Ticket[]][][] = [
  [['Received', [T.a, T.b]], ['Preparing', [T.c, T.d]], ['Ready', [T.e]]],
  [['Received', [T.a]], ['Preparing', [T.b, T.c, T.d]], ['Ready', [T.e]]],
  [['Received', [T.a]], ['Preparing', [T.b, T.c]], ['Ready', [T.d, T.e]]],
]

export function KdsPreview() {
  const { tick, ref, still } = usePreviewClock()
  const columns = KDS_PHASES[still ? 0 : Math.floor(tick / 5) % KDS_PHASES.length]
  return (
    <Screen device="kitchen" title="Kitchen display" store="Old Town" live frameRef={ref}>
      <div className="pv-kds">
        {columns.map(([column, tickets], c) => (
          <div className="pv-kds-col" key={column}>
            <h5><span>{column}</span><span>{tickets.length}</span></h5>
            {tickets.map((t, i) => (
              <div className={i === 0 && !still ? 'pv-ticket pv-ticket--in' : 'pv-ticket'} key={t.id} data-late={t.base + tick > 480 && c === 1}>
                <header><span>{t.id}</span><small>{c === 2 ? 'Ready' : clock(t.base + tick)}</small></header>
                <p>{t.items}</p>
                <footer>
                  {t.allergen && <span className="pv-allergen">{t.allergen}</span>}
                  <span className="pv-source">{t.source}</span>
                </footer>
              </div>
            ))}
          </div>
        ))}
      </div>
    </Screen>
  )
}

function RecipePreview() {
  const { tick, ref, still } = usePreviewClock(1100)
  const checks = ['Portion weighed', 'Allergen: nuts confirmed', 'Temperature above 75 °C', 'Packaging sealed']
  const done = still ? 3 : Math.min(checks.length, tick % 7)
  return (
    <Screen device="kitchen" title="Quality check · #1043" store="Old Town" frameRef={ref}>
      <div className="pv-split2 pv-split2--dark">
        <div className="pv-card">
          <h4>Before it leaves the pass <Badge tone={done === checks.length ? 'ok' : 'info'}>{done}/{checks.length}</Badge></h4>
          <ul className="pv-checks">
            {checks.map((c, i) => <li key={c} data-on={i < done}>{c}</li>)}
          </ul>
        </div>
        <div className="pv-card">
          <img className="pv-hero-img" src="/site/dish-mushroom-risotto.webp" alt="" width={220} height={110} loading="lazy" decoding="async" />
          <h4>Mushroom risotto <Badge tone="info">Recipe</Badge></h4>
          <ul className="pv-list">
            <li><span>Arborio rice</span><b>90 g</b></li>
            <li><span>Porcini</span><b>40 g</b></li>
            <li><span>Parmesan</span><b>25 g</b></li>
          </ul>
        </div>
      </div>
    </Screen>
  )
}

const HEAT = [1, 1, 2, 4, 3, 1, 2, 5, 6, 4, 1, 1, 2, 4, 3, 1, 3, 5, 6, 4, 1, 2, 2, 4, 4, 2, 3, 6, 7, 5, 1, 2, 3, 5, 4, 2, 4, 7, 8, 6, 2, 2, 4, 6, 5, 3, 5, 8, 9, 8, 2, 3, 5, 7, 6, 4, 6, 9, 9, 8, 1, 2, 4, 6, 5, 3, 4, 7, 7, 5]

function EquipmentPreview() {
  const { tick, ref, still } = usePreviewClock(1500)
  const oven = 312 + (still ? 0 : Math.round(Math.sin(tick / 2) * 4))
  const fridge = (3.4 + (still ? 0 : Math.sin(tick / 3) * 0.3)).toFixed(1)
  const fryerReady = !still && Math.floor(tick / 6) % 2 === 1
  return (
    <Screen device="kitchen" title="Equipment and pace" store="Old Town" live frameRef={ref}>
      <div className="pv-split2 pv-split2--dark">
        <div className="pv-card">
          <ul className="pv-list pv-list--status">
            <li><span>Pizza oven</span><small>{oven} °C</small><Badge tone="ok">In use</Badge></li>
            <li><span>Walk-in fridge</span><small>{fridge} °C</small><Badge tone="ok">In use</Badge></li>
            <li><span>Fryer 2</span><small>{fryerReady ? '175 °C' : '—'}</small>{fryerReady ? <Badge tone="ok">Ready</Badge> : <Badge tone="info">Cleaning</Badge>}</li>
            <li><span>Dishwasher</span><small>Service Tue</small><Badge>Maintenance</Badge></li>
          </ul>
        </div>
        <div className="pv-card">
          <h4>Busiest hours <small>Mon–Sun · 12–22h</small></h4>
          <div className="pv-heat">{HEAT.map((v, i) => <i key={i} data-now={i === 57} style={{ opacity: 0.08 + v * 0.1 }} />)}</div>
        </div>
      </div>
    </Screen>
  )
}

/* ---------- Delivery ---------- */

function DispatchPreview() {
  const { tick, ref, still } = usePreviewClock(1500)
  const t = still ? 0 : tick % 16
  const rajMin = Math.max(1, 12 - Math.floor(t / 1.5))
  const amitLeft = t >= 6
  return (
    <Screen title="Delivery · Live map" store="Old Town" user="Sara Rossi" live frameRef={ref}>
      <div className="pv-dispatch">
        <div className="pv-city">
          <span className="pv-zone pv-zone--c" /><span className="pv-zone pv-zone--b" /><span className="pv-zone pv-zone--a" />
          <span className="pv-pin pv-pin--store" style={{ left: '50%', top: '50%' }} />
          <span className="pv-driver pv-driver--1" /><span className="pv-driver pv-driver--2" /><span className="pv-driver pv-driver--3" />
          <em style={{ left: '56%', top: '42%' }}>Zone A</em><em style={{ left: '70%', top: '26%' }}>Zone B</em><em style={{ left: '84%', top: '10%' }}>Zone C</em>
        </div>
        <ul className="pv-people">
          <li><i>RK</i><span><b>Raj K.</b><small>#1042 · {rajMin} min away</small></span><Badge tone="ok">On the way</Badge></li>
          <li><i>AS</i><span><b>Amit S.</b><small>#1045 · {amitLeft ? 'left the store' : 'picking up'}</small></span>{amitLeft ? <Badge tone="ok">On the way</Badge> : <Badge tone="info">At store</Badge>}</li>
          <li><i>DC</i><span><b>David C.</b><small>#1039 · 2 stops</small></span><Badge tone="ok">On the way</Badge></li>
          <li><i>CM</i><span><b>Carla M.</b><small>Free</small></span><Badge tone="mute">Available</Badge></li>
        </ul>
      </div>
    </Screen>
  )
}

export function DriverPhone() {
  const { tick, ref, still } = usePreviewClock(900)
  const t = tick % 8
  const digits = still ? 4 : Math.min(4, t)
  const confirmed = !still && t >= 5
  const code = ['4', '8', '1', '7']
  return (
    <Phone frameRef={ref}>
      <div className="pv-phone-head">
        <b>Delivery #1042</b>
        <span>Canal Street 14 · 2.1 km</span>
      </div>
      <div className="pv-phone-body">
        <div className="pv-card">
          <h4>Hand over {confirmed ? <Badge tone="ok">Delivered</Badge> : <Badge tone="info">At the door</Badge>}</h4>
          <p>Ask the guest for their 4-digit code.</p>
          <div className="pv-otp">{code.map((d, i) => <span key={i} data-on={i < digits}>{i < digits ? d : ''}</span>)}</div>
        </div>
        <div className="pv-card">
          <h4>Next pickup</h4>
          <ul className="pv-list">
            <li><span>#1045</span><b>19:40</b></li>
            <li><span>#1047</span><b>19:52</b></li>
          </ul>
        </div>
        <div className="pv-card">
          <h4>Today</h4>
          <ul className="pv-list">
            <li><span>Deliveries</span><b>{confirmed ? 15 : 14}</b></li>
            <li><span>Earnings</span><b>{confirmed ? '€102.90' : '€96.40'}</b></li>
          </ul>
        </div>
      </div>
      <div className="pv-cta pv-cta--forest" data-done={confirmed}>{confirmed ? 'Delivered ✓' : 'Confirm delivery'}</div>
    </Phone>
  )
}

function RatingPhone() {
  const { tick, ref, still } = usePreviewClock(600)
  const t = tick % 14
  const food = still ? 4 : Math.min(4, t)
  const delivery = still ? 5 : Math.max(0, Math.min(5, t - 4))
  return (
    <Phone frameRef={ref}>
      <div className="pv-phone-head"><b>How was your order?</b><span>Order #1042 · Riverside Kitchen</span></div>
      <div className="pv-phone-body">
        <div className="pv-card">
          <h4>Food</h4>
          <div className="pv-stars">{[0, 1, 2, 3, 4].map((i) => <i key={i} data-off={i >= food} />)}</div>
        </div>
        <div className="pv-card">
          <h4>Delivery</h4>
          <div className="pv-stars">{[0, 1, 2, 3, 4].map((i) => <i key={i} data-off={i >= delivery} />)}</div>
        </div>
        <div className="pv-card">
          <ul className="pv-list">
            <li><span>On time this week</span><b>96%</b></li>
            <li><span>Average delivery</span><b>24 min</b></li>
          </ul>
        </div>
      </div>
      <div className="pv-cta" data-done={delivery === 5}>{delivery === 5 ? 'Thank you ✓' : 'Send rating'}</div>
    </Phone>
  )
}

function GuestDeliveryPreview() {
  return <Pair><TrackingPhone /><RatingPhone /></Pair>
}

/* ---------- Stock ---------- */

function StockPreview() {
  const { tick, ref, still } = usePreviewClock(1100)
  const t = tick % 12
  const mozz = still ? 22 : Math.max(18, 46 - t * 4)
  const low = mozz <= 30
  const drafted = still || t >= 8
  const rows: [string, string, number, 'warn' | 'ok' | undefined, string?][] = [
    ['Mozzarella', `${Math.round(mozz * 0.82)} kg`, mozz, low ? 'warn' : 'ok', low ? 'Low' : undefined],
    ['Tomatoes', '46 kg', 70, 'ok'],
    ['Flour 00', '120 kg', 86, 'ok'],
    ['Basil', '1.2 kg', 30, 'warn', 'Expires Thu'],
    ['Olive oil', '34 L', 62, 'ok'],
  ]
  return (
    <Screen title="Inventory · Stock" store="Old Town" user="Sara Rossi" frameRef={ref}>
      <div className="pv-main">
        <div className="pv-card">
          <ul className="pv-list pv-list--stock">
            {rows.map(([name, qty, value, tone, flag]) => (
              <li key={name}>
                <span>{name}</span>
                <Meter value={value} tone={tone} />
                <b>{qty}</b>
                {flag ? <Badge>{flag}</Badge> : <Badge tone="ok">OK</Badge>}
              </li>
            ))}
          </ul>
        </div>
        {drafted && (
          <div className="pv-card pv-card--glow pv-swap">
            <h4>Reorder drafted <Badge>Needs approval</Badge></h4>
            <p>30 kg mozzarella from Caseificio Rossi · arrives Thursday</p>
          </div>
        )}
      </div>
    </Screen>
  )
}

function PurchasePreview() {
  const { tick, ref, still } = usePreviewClock(1200)
  const t = tick % 8
  const lines = still ? 2 : Math.min(2, t)
  const sent = !still && t >= 5
  return (
    <Screen title="Inventory · Purchase orders" store="Old Town" user="Sara Rossi" frameRef={ref}>
      <div className="pv-main">
        <div className="pv-card pv-card--glow">
          <h4>PO-0218 · Caseificio Rossi {sent ? <Badge tone="ok">Sent</Badge> : <Badge>Draft</Badge>}</h4>
          <ul className="pv-list">
            {[['Mozzarella · 30 kg', '€246.00'], ['Parmesan · 6 kg', '€108.00']].slice(0, lines).map(([item, price]) => (
              <li key={item} className="pv-swap"><span>{item}</span><b>{price}</b></li>
            ))}
          </ul>
          <div className="pv-btn"><span data-pressed={sent}>{sent ? 'Sent ✓' : 'Send order'}</span><span>Edit</span></div>
        </div>
        <div className="pv-split">
          <div className="pv-card" data-best="true"><h4>Caseificio Rossi <Badge tone="ok">Best price</Badge></h4><ul className="pv-list"><li><span>Mozzarella / kg</span><b>€8.20</b></li><li><span>Lead time</span><b>1 day</b></li></ul></div>
          <div className="pv-card"><h4>Latteria Nord</h4><ul className="pv-list"><li><span>Mozzarella / kg</span><b>€8.60</b></li><li><span>Lead time</span><b>2 days</b></li></ul></div>
        </div>
      </div>
    </Screen>
  )
}

const DISH_COSTS = [
  { name: 'Margherita', share: 27, cost: '€3.24', margin: '€8.76' },
  { name: 'Mushroom risotto', share: 31, cost: '€4.50', margin: '€10.00' },
]

function WastePreview() {
  const { tick, ref, still } = usePreviewClock(1300)
  const round = still ? 0 : Math.floor(tick / 6)
  const dish = DISH_COSTS[round % DISH_COSTS.length]
  return (
    <Screen title="Inventory · Recipes and waste" store="Old Town" user="Sara Rossi" frameRef={ref}>
      <div className="pv-main">
        <div className="pv-card pv-swap" key={`d${round}`}>
          <h4>{dish.name} <small>cost per dish</small></h4>
          <div className="pv-stack"><i style={{ width: `${dish.share}%` }}>Cost {dish.cost}</i><i>Margin {dish.margin}</i></div>
        </div>
        <div className="pv-card" key={`w${round}`}>
          <h4>Waste by reason <small>€184 this week</small></h4>
          <ul className="pv-list">
            <li><span>Expired</span><Meter value={58} tone="warn" /><b>€82</b></li>
            <li><span>Over-prepared</span><Meter value={40} tone="accent" /><b>€57</b></li>
            <li><span>Dropped or spoiled</span><Meter value={22} /><b>€31</b></li>
            <li><span>Returned</span><Meter value={10} /><b>€14</b></li>
          </ul>
        </div>
      </div>
    </Screen>
  )
}

/* ---------- Team ---------- */

function RotaPreview() {
  const { tick, ref, still } = usePreviewClock(1200)
  const added = still || tick % 8 >= 3
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  const rows: [string, (string | null)[]][] = [
    ['Maria · Cashier', ['11–19', '11–19', null, '11–19', '15–23', '15–23', null]],
    ['Jonas · Kitchen', ['15–23', null, '15–23', '15–23', '15–23', '11–23', null]],
    ['Raj · Driver', [null, '17–22', '17–22', null, added ? '17–23' : null, '17–23', '12–20']],
    ['Sara · Manager', ['10–18', '10–18', '10–18', null, '14–23', '14–23', null]],
  ]
  return (
    <Screen title="People · Scheduling" store="Old Town" user="Sara Rossi" frameRef={ref}>
      <div className="pv-rota">
        <div className="pv-rota-row pv-rota-head"><span />{days.map((d) => <b key={d}>{d}</b>)}</div>
        {rows.map(([name, shifts]) => (
          <div className="pv-rota-row" key={name}>
            <span>{name}</span>
            {shifts.map((s, i) => <i key={i} data-on={Boolean(s)} data-new={name.startsWith('Raj') && i === 4 && added}>{s}</i>)}
          </div>
        ))}
        <div className="pv-rota-foot"><span>Copy last week</span><span>Add shifts</span><b>{added ? '27 shifts · 2 to confirm' : '26 shifts · 3 to confirm'}</b></div>
      </div>
    </Screen>
  )
}

function ClockPreview() {
  const { tick, ref, still } = usePreviewClock()
  const approved = !still && tick % 10 >= 6
  return (
    <Screen title="People · On shift now" store="Old Town" user="Sara Rossi" live frameRef={ref}>
      <div className="pv-main">
        <div className="pv-card">
          <ul className="pv-people">
            <li><i>MA</i><span><b>Maria A.</b><small>Cashier · since 16:58</small></span><b className="pv-mono">{clock(3720 + tick)}</b></li>
            <li><i>JK</i><span><b>Jonas K.</b><small>Kitchen · on break</small></span><Badge tone="info">Break</Badge></li>
            <li><i>RK</i><span><b>Raj K.</b><small>Driver · since 17:02</small></span><b className="pv-mono">{clock(3480 + tick)}</b></li>
          </ul>
        </div>
        <div className="pv-card pv-card--glow">
          <h4>Hours to approve {approved ? <Badge tone="ok">Approved</Badge> : <Badge>2 waiting</Badge>}</h4>
          <ul className="pv-list">
            <li><span>Ana P. · Tue 11:00–19:12</span><b>8 h 12</b></li>
            <li><span>Luca B. · Tue 15:00–23:05</span><b>8 h 05</b></li>
          </ul>
          <div className="pv-btn"><span data-pressed={approved}>{approved ? 'Approved ✓' : 'Approve all'}</span><span>Review</span></div>
        </div>
      </div>
    </Screen>
  )
}

function EarningsPreview() {
  const { tick, ref, still } = usePreviewClock(700)
  const p = progress(tick, still, 14, 6)
  const round = still ? 0 : Math.floor(tick / 14)
  const leader = still ? 0 : Math.floor(tick / 4) % 3
  return (
    <Pair>
      <Phone frameRef={ref}>
        <div className="pv-phone-head"><b>My earnings</b><span>This week · Maria A.</span></div>
        <div className="pv-phone-body">
          <div className="pv-card"><div className="pv-amount">{eur(486.2 * p)}</div><p>32.5 hours · €13.50 per hour</p></div>
          <div className="pv-bars" key={round}>{[40, 62, 0, 58, 86, 100, 0].map((h, i) => <i key={i} style={{ height: `${h}%`, animationDelay: `${i * 70}ms` }} />)}</div>
          <div className="pv-card"><ul className="pv-list"><li><span>Pay</span><b>{eur(438.75 * p)}</b></li><li><span>Tips</span><b>{eur(47.45 * p)}</b></li></ul></div>
        </div>
      </Phone>
      <Phone>
        <div className="pv-phone-head"><b>Leaderboard</b><span>Old Town · this month</span></div>
        <div className="pv-phone-body">
          <div className="pv-card">
            <ol className="pv-rank">
              {[['Jonas K.', 'Fastest prep'], ['Maria A.', 'Most orders'], ['Raj K.', 'On time 98%']].map(([name, what], i) => (
                <li key={name} data-on={i === leader}><b>{i + 1}</b><span>{name}</span><small>{what}</small></li>
              ))}
            </ol>
          </div>
        </div>
      </Phone>
    </Pair>
  )
}

function PeoplePreview() {
  const { tick, ref, still } = usePreviewClock(900)
  const t = tick % 9
  const created = still || t >= 3
  return (
    <Screen title="People · Staff" store="All stores" user="Sara Rossi" frameRef={ref}>
      <div className="pv-main">
        <div className="pv-card">
          <ul className="pv-people">
            <li><i>SR</i><span><b>Sara R.</b><small>Old Town</small></span><Badge tone="info">Manager</Badge></li>
            <li data-on={!still}><i>MA</i><span><b>Maria A.</b><small>Old Town</small></span><Badge tone="mute">Cashier</Badge></li>
            <li><i>JK</i><span><b>Jonas K.</b><small>Riverside</small></span><Badge tone="mute">Kitchen</Badge></li>
            <li><i>RK</i><span><b>Raj K.</b><small>Riverside</small></span><Badge tone="mute">Driver</Badge></li>
          </ul>
        </div>
        <div className="pv-card">
          <h4>New PIN for Maria A. {created ? <Badge tone="ok">Created</Badge> : <Badge tone="info">Creating…</Badge>}</h4>
          <div className="pv-otp pv-otp--sm">{['7', '3', '1', '9'].map((d, i) => <span key={i} data-on={created}>{created ? d : '•'}</span>)}</div>
          <p>Shown once. Maria signs in on any terminal at Old Town.</p>
        </div>
      </div>
    </Screen>
  )
}

/* ---------- Guests ---------- */

function GuestPreview() {
  const { tick, ref, still } = usePreviewClock(800)
  const p = progress(tick, still, 12, 5)
  const points = 3900 + 220 * p
  return (
    <Screen title="People · Guests" store="All stores" user="Sara Rossi" frameRef={ref}>
      <div className="pv-main">
        <div className="pv-card">
          <ul className="pv-people"><li><i>EL</i><span><b>Elena L.</b><small>23 orders · last order Sunday</small></span><Badge tone="ok">Gold</Badge></li></ul>
          <div className="pv-tier"><span>{whole(points)} points</span><Meter value={Math.round((points / 5000) * 100)} tone="accent" /><span>{whole(5000 - points)} to Platinum</span></div>
          <div className="pv-tags pv-tags--lg"><span>Office orders</span><span>Vegetarian</span><span>Margherita ×11</span></div>
        </div>
        <div className="pv-split">
          <div className="pv-card"><h4>Favourite</h4><p>Margherita, extra basil</p></div>
          <div className="pv-card"><h4>Addresses</h4><p>Canal Street 14 · Office</p></div>
        </div>
      </div>
    </Screen>
  )
}

function CampaignPreview() {
  const { tick, ref, still } = usePreviewClock(700)
  const p = progress(tick, still, 14, 7)
  return (
    <Screen title="People · Campaigns" store="All stores" user="Sara Rossi" frameRef={ref}>
      <div className="pv-main">
        <div className="pv-card pv-card--glow">
          <h4>We miss you: 10% off <Badge tone="info">Fri 17:00</Badge></h4>
          <p>To 42 guests who have not ordered for 30 days.</p>
          <div className="pv-chips"><span data-on="true">Email</span><span data-on="true">SMS</span><span>Push</span></div>
        </div>
        <div className="pv-card">
          <h4>Last campaign <small>Lunch deal</small></h4>
          <ul className="pv-list">
            <li><span>Sent</span><Meter value={100} /><b>640</b></li>
            <li><span>Opened</span><Meter value={Math.round(54 * p)} tone="accent" /><b>{whole(346 * p)}</b></li>
            <li><span>Ordered</span><Meter value={Math.round(12 * p)} tone="ok" /><b>{whole(77 * p)}</b></li>
          </ul>
        </div>
      </div>
    </Screen>
  )
}

const REVIEW_REPLY = 'Thank you, and sorry the delivery ran late. We have added a driver for Friday evenings.'

export function ReviewsPreview() {
  const { tick, ref, still } = usePreviewClock(80)
  const reply = typed(REVIEW_REPLY, tick, still)
  const typing = reply.length < REVIEW_REPLY.length
  return (
    <Screen title="Reviews · All sites" store="All stores" user="Sara Rossi" frameRef={ref}>
      <div className="pv-main">
        <div className="pv-card">
          <h4>
            <span className="pv-stars pv-stars--sm">{[0, 1, 2, 3, 4].map((i) => <i key={i} data-off={i >= 3} />)}<small>Old Town</small></span>
            {typing ? <Badge tone="info">Drafting…</Badge> : <Badge>Reply drafted</Badge>}
          </h4>
          <p>“Lovely pasta, but delivery took longer than promised.”</p>
          <p className="pv-reply">{reply}<Caret on={typing} /></p>
        </div>
        {[
          { stars: 5, site: 'Riverside', text: '“Best risotto in the area, and the driver was very kind.”', badge: 'Reply drafted', ok: false },
          { stars: 4, site: 'Old Town', text: '“Great food. Would love more vegan options.”', badge: 'Replied', ok: true },
        ].map((r) => (
          <div className="pv-card" key={r.text}>
            <h4>
              <span className="pv-stars pv-stars--sm">{[0, 1, 2, 3, 4].map((i) => <i key={i} data-off={i >= r.stars} />)}<small>{r.site}</small></span>
              <Badge tone={r.ok ? 'ok' : undefined}>{r.badge}</Badge>
            </h4>
            <p>{r.text}</p>
          </div>
        ))}
      </div>
    </Screen>
  )
}

function PrivacyPreview() {
  const { tick, ref, still } = usePreviewClock(1100)
  const t = tick % 9
  const sent = still || t >= 4
  const sms = !still && t >= 6
  return (
    <Screen title="Guests · Privacy requests" store="All stores" user="Sara Rossi" frameRef={ref}>
      <div className="pv-main">
        <div className="pv-card">
          <ul className="pv-list pv-list--status">
            <li><span>Data export · Elena L.</span><small>Today</small>{sent ? <Badge tone="ok">Sent</Badge> : <Badge>Preparing</Badge>}</li>
            <li><span>Erasure · Guest #2291</span><small>Yesterday</small><Badge tone="ok">Done</Badge></li>
            <li><span>Access · Marco T.</span><small>12 Nov</small><Badge tone="ok">Sent</Badge></li>
          </ul>
        </div>
        <div className="pv-card">
          <h4>Consent · Elena L.</h4>
          <ul className="pv-toggles"><li data-on="true">Order updates</li><li data-on="true">Offers by email</li><li data-on={sms}>Offers by SMS</li></ul>
        </div>
      </div>
    </Screen>
  )
}

/* ---------- Reports ---------- */

function MarginPreview() {
  const { tick, ref, still } = usePreviewClock(700)
  const p = progress(tick, still, 14, 6)
  const round = still ? 0 : Math.floor(tick / 14)
  return (
    <Screen title="Analytics · Costs and profit" store="All stores" user="Sara Rossi" frameRef={ref}>
      <div className="pv-main">
        <div className="pv-tiles pv-tiles--3">
          <div className="pv-tile"><small>Revenue</small><b>{eur(84200 * p, 0)}</b></div>
          <div className="pv-tile"><small>Gross margin</small><b>{Math.round(68 * p)}%</b></div>
          <div className="pv-tile"><small>Net profit</small><b>{eur(12630 * p, 0)}</b></div>
        </div>
        <div className="pv-card" key={round}>
          <h4>Profit per order by channel <small>after commission</small></h4>
          <ul className="pv-list">
            <li><span>Website</span><Meter value={88} tone="ok" /><b>€31.20</b></li>
            <li><span>Counter</span><Meter value={80} tone="ok" /><b>€28.40</b></li>
            <li><span>Uber Eats</span><Meter value={52} tone="warn" /><b>€18.60</b></li>
            <li><span>Deliveroo</span><Meter value={48} tone="warn" /><b>€17.10</b></li>
          </ul>
        </div>
      </div>
    </Screen>
  )
}

function StoresPreview() {
  const { tick, ref, still } = usePreviewClock(1300)
  const on = still ? -1 : Math.floor(tick / 2) % 3
  const copied = still || tick % 9 >= 5
  return (
    <Screen title="Stores · Compare" store="3 stores" user="Sara Rossi" frameRef={ref}>
      <div className="pv-main">
        <div className="pv-card">
          <div className="pv-table">
            <div className="pv-table-head"><span>Store</span><span>Sales</span><span>Prep</span><span>Rating</span></div>
            {[['Old Town', 'Berlin · EUR', '€4,416', '11 min', '4.7'], ['Riverside', 'Amsterdam · EUR', '€3,870', '13 min', '4.6'], ['Station', 'London · GBP', '£3,205', '10 min', '4.5']].map(([name, where, sales, prep, rating], i) => (
              <div key={name} data-on={i === on}><span><b>{name}</b><small>{where}</small></span><span>{sales}</span><span>{prep}</span><span>{rating}</span></div>
            ))}
          </div>
        </div>
        <div className="pv-card"><h4>Autumn menu {copied ? <Badge tone="ok">Copied</Badge> : <Badge tone="info">Copying…</Badge>}</h4><p>From Old Town to Riverside and Station.</p></div>
      </div>
    </Screen>
  )
}

function ForecastPreview() {
  const { tick, ref, still } = usePreviewClock(1100)
  const t = tick % 10
  const round = still ? 0 : Math.floor(tick / 10)
  return (
    <Screen title="Analytics · Forecast" store="All stores" user="Sara Rossi" frameRef={ref}>
      <div className="pv-main">
        <div className="pv-card">
          <h4>Expected orders <small>Friday +25%</small></h4>
          <div className="pv-bars pv-bars--wide" key={round}>{[52, 48, 55, 60, 100, 92, 70].map((h, i) => <i key={i} data-peak={i === 4} style={{ height: `${h}%`, animationDelay: `${i * 70}ms` }} />)}</div>
        </div>
        <ChatBubbles question="Which site had the most waste last week?" answer="Riverside: €212, mostly expired basil and mozzarella. Old Town was €184." asked={still || t >= 1} answered={still || t >= 3} />
      </div>
    </Screen>
  )
}

export function CopilotPreview() {
  const { tick, ref, still } = usePreviewClock(1100)
  const t = tick % 11
  const answered = still || t >= 2
  const proposal = still || t >= 4
  const approved = !still && t >= 7
  return (
    <Screen title="Manager Copilot" store="All stores" user="Sara Rossi" frameRef={ref}>
      <div className="pv-main">
        <ChatBubbles question="How are we doing tonight compared with last Friday?" answer="Orders are up 12% across three stores. Old Town kitchen is 3 minutes slower than usual. Two proposals are waiting for you." answered={answered} />
        {proposal && (
          <div className="pv-card pv-swap">
            <h4>Stock reorder {approved ? <Badge tone="ok">Approved</Badge> : <Badge>Needs approval</Badge>}</h4>
            <p>Order 30 kg mozzarella for Friday</p>
            <div className="pv-btn"><span data-pressed={approved}>{approved ? 'Approved ✓' : 'Approve'}</span><span>Dismiss</span></div>
          </div>
        )}
      </div>
    </Screen>
  )
}

export function SupportPhone() {
  const { tick, ref, still } = usePreviewClock(1100)
  const t = still ? 99 : tick % 11
  return (
    <Phone frameRef={ref}>
      <div className="pv-phone-head"><b>Riverside Kitchen</b><span>Support · AI assistant</span></div>
      <div className="pv-phone-body">
        <ChatBubbles question="Where is my order?" answer="Order #1042 left the kitchen at 19:21. Raj is about 12 minutes away." answered={t >= 2} />
        <ChatBubbles question="Is the risotto gluten free?" answer="Yes. It contains milk and celery." asked={t >= 4} answered={t >= 6} />
      </div>
      <div className="pv-input">Type a message</div>
    </Phone>
  )
}

/** One visual for each feature group on each product page, in the same order as the copy. */
export function AreaPreview({ area, group }: { area: ProductArea; group: number }) {
  const map: Record<ProductArea, (() => ReactNode)[]> = {
    ordering: [() => <Pair><OrderingPhone dishes={4} /><CheckoutPhone /></Pair>, () => <Pair><CheckoutPhone /><TrackingPhone /></Pair>, () => <ChannelsPreview />],
    counter: [() => <CounterPreview />, () => <PinPreview />, () => <PaymentsPreview />],
    kitchen: [() => <KitchenTicketsScene />, () => <KitchenQualityScene />, () => <KitchenEquipmentScene />],
    delivery: [() => <DispatchPreview />, () => <Pair><DriverPhone /><TrackingPhone /></Pair>, () => <GuestDeliveryPreview />],
    stock: [() => <StockPreview />, () => <PurchasePreview />, () => <WastePreview />],
    team: [() => <RotaPreview />, () => <ClockPreview />, () => <EarningsPreview />, () => <PeoplePreview />],
    guests: [() => <GuestPreview />, () => <CampaignPreview />, () => <ReviewsPreview />, () => <PrivacyPreview />],
    insights: [() => <DashboardPreview />, () => <MarginPreview />, () => <StoresPreview />, () => <ForecastPreview />],
  }
  const render = map[area][group] ?? map[area][0]
  return <>{render()}</>
}

/** Small visual for each area on the home page grid. */
export function AreaThumb({ area }: { area: ProductArea }) {
  switch (area) {
    case 'ordering': return <OrderingPhone dishes={3} />
    case 'counter': return <CounterPreview />
    case 'kitchen': return <KdsPreview />
    case 'delivery': return <DispatchPreview />
    case 'stock': return <StockPreview />
    case 'team': return <RotaPreview />
    case 'guests': return <ReviewsPreview />
    default: return <MarginPreview />
  }
}

/* ---------- App family ---------- */

function KioskPreview() {
  const { tick, ref, still } = usePreviewClock(1300)
  const picked = still ? 0 : tick % DISHES.length
  const count = still ? 2 : 1 + (tick % 4)
  const total = DISHES.slice(0, count).reduce((sum, d) => sum + d.value, 0)
  return (
    <KioskFrame className="pv" frameRef={ref}>
      <div className="pv-kiosk-head"><b>Order here</b><span>Eat in · Take away</span></div>
      <div className="pv-chips pv-chips--tabs pv-kiosk-tabs"><span data-on="true">Popular</span><span>Pizza</span><span>Bowls</span><span>Drinks</span></div>
      <div className="pv-kiosk-grid">
        {DISHES.map((dish, i) => (
          <div key={dish.name} data-on={i === picked}>
            <img src={dish.img} alt="" width={120} height={84} loading="lazy" decoding="async" />
            <b>{dish.name}</b>
            <small>{dish.price}</small>
            <div className="pv-tags">{dish.tags.map((tag) => <span key={tag}>{tag}</span>)}</div>
          </div>
        ))}
      </div>
      <div className="pv-cta">Your order · <b key={count} className="pv-pop">{count}</b> items · {eur(total)}</div>
    </KioskFrame>
  )
}

function CustomerAppPhone() {
  const { tick, ref, still } = usePreviewClock(800)
  const p = progress(tick, still, 12, 5)
  const points = 1180 + 60 * p
  const pick = still ? 0 : Math.floor(tick / 3) % 2
  return (
    <Phone frameRef={ref}>
      <div className="pv-phone-head"><b>Good evening, Ana</b><span>Riverside Kitchen</span></div>
      <div className="pv-phone-body">
        <div className="pv-card pv-card--glow">
          <h4>Loyalty <Badge tone="ok">Gold</Badge></h4>
          <p><b className="pv-big">{whole(points)}</b> points</p>
          <Meter value={Math.round((points / 2000) * 100)} tone="accent" />
          <small>{whole(2000 - points)} points to Platinum</small>
        </div>
        <div className="pv-card">
          <h4>Order again</h4>
          <ul className="pv-list pv-list--pick">
            <li data-on={pick === 0}><span>Margherita · Greek salad</span><b>€21.50</b></li>
            <li data-on={pick === 1}><span>Mushroom risotto</span><b>€14.50</b></li>
          </ul>
        </div>
        <div className="pv-card">
          <h4>Deliver to</h4>
          <ul className="pv-list">
            <li><span>Home · Canal Street 14</span><b>✓</b></li>
            <li><span>Office · Station Road 2</span><b /></li>
          </ul>
        </div>
      </div>
      <div className="pv-cta">Start an order</div>
    </Phone>
  )
}

const STAFF_VIEWS = ['Driver', 'Kitchen', 'Counter', 'Shifts']

function StaffAppPhone() {
  const { tick, ref } = usePreviewClock()
  const view = Math.floor(tick / 3) % STAFF_VIEWS.length
  return (
    <Phone frameRef={ref}>
      <div className="pv-phone-head"><b>MaSoVa Crew</b><span>Old Town · signed in as Raj</span></div>
      <div className="pv-phone-body">
        <div className="pv-chips pv-chips--tabs">{STAFF_VIEWS.map((name, i) => <span key={name} data-on={i === view}>{name}</span>)}</div>
        {view === 0 && (
          <div className="pv-card pv-swap">
            <h4>New delivery <Badge tone="info">2.1 km</Badge></h4>
            <p>#1042 · Canal Street 14</p>
            <div className="pv-btn"><span>Accept</span><span>Pass</span></div>
          </div>
        )}
        {view === 1 && (
          <div className="pv-card pv-swap">
            <h4>Kitchen queue <Badge>3 open</Badge></h4>
            <ul className="pv-list">
              <li><span>#1046 · 2 × Margherita</span><b>{clock(252 + (tick % 3))}</b></li>
              <li><span>#1047 · Tikka masala</span><b>{clock(160 + (tick % 3))}</b></li>
              <li><span>#1048 · Risotto</span><b>{clock(55 + (tick % 3))}</b></li>
            </ul>
          </div>
        )}
        {view === 2 && (
          <div className="pv-card pv-swap">
            <h4>Quick order <Badge tone="ok">Table 6</Badge></h4>
            <ul className="pv-list">
              <li><span>2 × Margherita</span><b>€24.00</b></li>
              <li><span>1 × Greek salad</span><b>€9.50</b></li>
            </ul>
            <div className="pv-btn"><span>Send to kitchen</span></div>
          </div>
        )}
        {view === 3 && (
          <div className="pv-card pv-swap">
            <h4>This week <Badge tone="ok">Confirmed</Badge></h4>
            <ul className="pv-list">
              <li><span>Fri 17:00–23:00</span><b>6 h</b></li>
              <li><span>Sat 12:00–20:00</span><b>8 h</b></li>
              <li><span>Earnings so far</span><b>€312.00</b></li>
            </ul>
          </div>
        )}
        <div className="pv-card">
          <h4>On shift</h4>
          <ul className="pv-list"><li><span>Clocked in 17:02</span><b className="pv-mono">{clock(3480 + tick)}</b></li></ul>
        </div>
      </div>
    </Phone>
  )
}

const VOICE_ANSWER = 'Margherita and Marinara have no nuts. Both contain gluten.'

function VoicePreview() {
  const { tick, ref, still } = usePreviewClock(80)
  const answer = typed(VOICE_ANSWER, tick, still, 30)
  return (
    <Phone frameRef={ref}>
      <div className="pv-phone-head"><b>Riverside Kitchen</b><span>Voice support</span></div>
      <div className="pv-phone-body pv-voice">
        <p className="pv-chat-q">“Which pizzas have no nuts?”</p>
        <div className="pv-wave">{Array.from({ length: 22 }, (_, i) => <i key={i} style={{ animationDelay: `${(i % 7) * 0.11}s` } as CSSProperties} />)}</div>
        <p className="pv-chat-a"><span className="pv-chat-text">{answer}<Caret on={answer.length < VOICE_ANSWER.length} /></span></p>
      </div>
      <div className="pv-input">Tap and speak</div>
    </Phone>
  )
}

/** The preview for one app in the family; `wide` says whether it is a screen or a phone. */
export const APP_PREVIEW_WIDE: Record<string, boolean> = {
  web: false, counter: true, kiosk: false, kds: true, driver: false, manager: true, agents: true,
  support: false, 'customer-app': false, 'staff-app': false, copilot: true, voice: false,
}

export function AppPreview({ app }: { app: string }) {
  switch (app) {
    case 'web': return <OrderingPhone dishes={4} />
    case 'counter': return <CounterPreview />
    case 'kiosk': return <KioskPreview />
    case 'kds': return <KdsPreview />
    case 'driver': return <DriverPhone />
    case 'manager': return <DashboardPreview />
    case 'agents': return <ApprovalPreview />
    case 'support': return <SupportPhone />
    case 'customer-app': return <CustomerAppPhone />
    case 'staff-app': return <StaffAppPhone />
    case 'copilot': return <CopilotPreview />
    default: return <VoicePreview />
  }
}

/** App shown for each role in "A day with MaSoVa" (same order as `apps.roles`). */
export const ROLE_APPS = ['manager', 'agents', 'counter', 'kds', 'driver', 'web']

export function RolePreview({ index }: { index: number }) {
  if (index === 0) return <StoresPreview />
  return <AppPreview app={ROLE_APPS[index] ?? 'manager'} />
}
