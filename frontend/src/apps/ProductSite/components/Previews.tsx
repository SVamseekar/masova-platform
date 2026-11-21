/**
 * The app family on the Apps page: each MaSoVa app on the hardware it runs on (laptop,
 * counter tablet, kitchen screen, kiosk or phone), with sample data, moving the way the
 * product moves. Everywhere else the site uses product scenes (./scenes), so each app
 * preview appears once. Motion runs only while a preview is on screen;
 * with reduced motion each shows its finished state. They are decorative
 * (aria-hidden); each caller supplies a text description. App text stays in English
 * because the staff apps are English today.
 */
import type { CSSProperties, ReactNode } from 'react'
import { AppBar, KioskFrame, KitchenScreen, LaptopFrame, PhoneFrame, TabletFrame, usePreviewClock } from './Devices'

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

/* ---------- Delivery ---------- */

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

/* ---------- Manager Copilot and support ---------- */

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
