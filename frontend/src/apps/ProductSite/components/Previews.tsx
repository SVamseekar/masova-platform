/**
 * Coded previews of the MaSoVa apps for the marketing site. They reproduce the
 * product layouts with sample data and move the way the product moves (tickets
 * arrive, timers count, drivers travel). They are decorative (aria-hidden); each
 * caller supplies a text description. App text stays in English because the
 * staff apps are English today.
 */
import { useEffect, useState, type ReactNode } from 'react'
import { BrandMark } from './Brand'
import type { ProductArea } from '../locales'

const DISHES = [
  { img: '/site/dish-margherita-pizza.webp', name: 'Margherita', note: 'San Marzano, fior di latte', price: '€12.00', tags: ['Gluten', 'Milk'] },
  { img: '/site/dish-mushroom-risotto.webp', name: 'Mushroom risotto', note: 'Porcini, parmesan', price: '€14.50', tags: ['Milk', 'Celery'] },
  { img: '/site/dish-chicken-tikka-masala.webp', name: 'Chicken tikka masala', note: 'With basmati rice', price: '€15.00', tags: ['Milk', 'Nuts'] },
  { img: '/site/dish-greek-salad.webp', name: 'Greek salad', note: 'Feta, olives, oregano', price: '€9.50', tags: ['Milk'] },
]

/** Seconds since the preview mounted; stays at 0 when the visitor prefers reduced motion. */
function useSeconds(): number {
  const [seconds, setSeconds] = useState(0)
  useEffect(() => {
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return
    const id = window.setInterval(() => setSeconds((s) => s + 1), 1000)
    return () => window.clearInterval(id)
  }, [])
  return seconds
}

function clock(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60)
  const s = totalSeconds % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

function Window({ title, right, children, live }: { title: string; right?: string; children: ReactNode; live?: boolean }) {
  return (
    <div className="pv pv-window" aria-hidden="true">
      <div className="pv-bar">
        <span className="pv-dots"><i /><i /><i /></span>
        <b>{title}</b>
        {right && <span className={live ? 'pv-live' : undefined}>{right}</span>}
      </div>
      {children}
    </div>
  )
}

function Phone({ children }: { children: ReactNode }) {
  return (
    <div className="pv pv-phone" aria-hidden="true">
      <div className="pv-phone-screen">
        <div className="pv-phone-status"><span>9:41</span><span className="pv-phone-notch" /></div>
        {children}
      </div>
    </div>
  )
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

/* ---------- Manager ---------- */

export function DashboardPreview() {
  const seconds = useSeconds()
  const orders = 86 + Math.floor(seconds / 4)
  return (
    <Window title="Manager · Overview" right="Live" live>
      <div className="pv-dash">
        <div className="pv-rail">
          <span className="ms-brand"><BrandMark size={16} /><span>MaSoVa</span></span>
          {['Overview', 'Orders', 'Kitchen', 'Delivery', 'Inventory', 'People', 'Reviews', 'AI assistants'].map((item, i) => (
            <span key={item} data-on={i === 0}>{item}</span>
          ))}
        </div>
        <div className="pv-main">
          <div className="pv-hello">
            Good evening
            <small>3 proposals waiting for your review</small>
          </div>
          <div className="pv-tiles">
            <div className="pv-tile"><small>Orders</small><b key={orders} className="pv-pop">{orders}</b></div>
            <div className="pv-tile"><small>In kitchen</small><b>{7 + (Math.floor(seconds / 6) % 3)}</b></div>
            <div className="pv-tile"><small>Drivers out</small><b>4</b></div>
            <div className="pv-tile"><small>On shift</small><b>11</b></div>
          </div>
          <div className="pv-split">
            <div className="pv-card pv-card--glow">
              <h4>Stock reorder <Badge>Needs approval</Badge></h4>
              <p>Mozzarella will run short on Friday.</p>
              <div className="pv-amount">€246</div>
              <p>Draft purchase order · 30 kg</p>
              <div className="pv-btn"><span>Review</span><span>Later</span></div>
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
    </Window>
  )
}

export function ApprovalPreview() {
  return (
    <Window title="AI assistants · Proposals" right="3 waiting">
      <div className="pv-main">
        {[
          { agent: 'Stock reorder', text: 'Order 30 kg mozzarella for Friday', badge: 'Needs approval' },
          { agent: 'Shift planner', text: 'Add one driver, Friday 18:00–22:00', badge: 'Needs approval' },
          { agent: 'Review replies', text: 'Reply drafted for a 3-star review', badge: 'Approved', ok: true },
        ].map((p) => (
          <div className="pv-card" key={p.agent}>
            <h4>{p.agent} <Badge tone={p.ok ? 'ok' : undefined}>{p.badge}</Badge></h4>
            <p>{p.text}</p>
          </div>
        ))}
      </div>
    </Window>
  )
}

/* ---------- Ordering ---------- */

export function OrderingPhone({ dishes = 3 }: { dishes?: number }) {
  return (
    <Phone>
      <div className="pv-phone-head">
        <b>Riverside Kitchen</b>
        <span>Delivery · 25–35 min</span>
      </div>
      <div className="pv-phone-body">
        {DISHES.slice(0, dishes).map((dish) => (
          <div className="pv-dish" key={dish.name}>
            <img src={dish.img} alt="" width={52} height={52} loading="lazy" decoding="async" />
            <div>
              <b>{dish.name}</b>
              <small>{dish.note}</small>
              <div className="pv-tags">{dish.tags.map((tag) => <span key={tag}>{tag}</span>)}</div>
              <em>{dish.price}</em>
            </div>
          </div>
        ))}
      </div>
      <div className="pv-cta">View basket · 2 items</div>
    </Phone>
  )
}

function CheckoutPhone() {
  return (
    <Phone>
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
          <div className="pv-chips"><span>€1</span><span data-on="true">€2</span><span>€3</span><span>Other</span></div>
        </div>
        <div className="pv-card">
          <h4>Pay with</h4>
          <div className="pv-chips"><span data-on="true">Card</span><span>Cash</span></div>
        </div>
      </div>
      <div className="pv-cta">Pay €26.00</div>
    </Phone>
  )
}

export function TrackingPhone() {
  return (
    <Phone>
      <div className="pv-phone-head">
        <b>Order #1042</b>
        <span>Arriving in about 12 min</span>
      </div>
      <div className="pv-phone-body">
        <MiniMap />
        <ul className="pv-track">
          <li data-done="true"><i /><span>Order confirmed</span><small>19:02</small></li>
          <li data-done="true"><i /><span>Preparing</span><small>19:05</small></li>
          <li data-now="true"><i /><span>Out for delivery</span><small>19:21</small></li>
          <li><i /><span>Delivered</span><small>–</small></li>
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

function ChannelsPreview() {
  const sources = ['Website', 'Counter', 'Kiosk', 'Marketplace']
  return (
    <Window title="Orders · All channels" right="Live" live>
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
          {[
            ['#1046', 'Website', '2 × Margherita'],
            ['#1047', 'Uber Eats', '1 × Tikka masala'],
            ['#1048', 'Counter', '1 × Risotto · Table 6'],
            ['#1049', 'Kiosk', '2 × Greek salad'],
          ].map(([id, source, items]) => (
            <div className="pv-ticket" key={id}>
              <header><span>{id}</span><small>{source}</small></header>
              <p>{items}</p>
            </div>
          ))}
        </div>
      </div>
    </Window>
  )
}

/* ---------- Counter ---------- */

function CounterPreview() {
  return (
    <Window title="Counter · New order" right="Maria · Cashier">
      <div className="pv-pos">
        <div>
          <div className="pv-chips pv-chips--tabs"><span data-on="true">Pizza</span><span>Pasta</span><span>Salads</span><span>Drinks</span></div>
          <div className="pv-pos-grid">
            {DISHES.map((dish, i) => (
              <div key={dish.name} data-on={i === 0}>
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
            <li><span>2 × Margherita</span><b>€24.00</b></li>
            <li><span>1 × Greek salad</span><b>€9.50</b></li>
            <li><span>Extra basil</span><b>€0.50</b></li>
          </ul>
          <div className="pv-total"><span>Total</span><b>€34.00</b></div>
          <div className="pv-cta">Send to kitchen</div>
        </div>
      </div>
    </Window>
  )
}

function PinPreview() {
  const seconds = useSeconds()
  const filled = (seconds % 6) > 4 ? 4 : Math.min(4, seconds % 6)
  return (
    <Pair>
      <div className="pv pv-panel" aria-hidden="true">
        <h4>Enter your PIN</h4>
        <div className="pv-pin-dots">{[0, 1, 2, 3].map((i) => <i key={i} data-on={i < filled} />)}</div>
        <div className="pv-pinpad">{['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '⌫'].map((k, i) => <span key={i}>{k}</span>)}</div>
      </div>
      <div className="pv pv-panel" aria-hidden="true">
        <h4>On this terminal</h4>
        <ul className="pv-people">
          <li><i>MA</i><span><b>Maria A.</b><small>Cashier · clocked in 16:58</small></span><Badge tone="ok">On shift</Badge></li>
          <li><i>JK</i><span><b>Jonas K.</b><small>Kitchen · clocked in 15:30</small></span><Badge tone="ok">On shift</Badge></li>
          <li><i>SR</i><span><b>Sara R.</b><small>Manager</small></span><Badge tone="mute">Signed out</Badge></li>
        </ul>
        <div className="pv-btn"><span>Clock in</span><span>Clock out</span></div>
      </div>
    </Pair>
  )
}

function PaymentsPreview() {
  return (
    <Window title="Orders · Payments" right="Today">
      <div className="pv-main">
        <div className="pv-card pv-card--glow">
          <h4>Refund request · #1038 <Badge>Needs approval</Badge></h4>
          <p>Wrong item delivered · requested by Maria A.</p>
          <div className="pv-amount">€14.50</div>
          <div className="pv-btn"><span>Approve</span><span>Reject</span></div>
        </div>
        <div className="pv-card">
          <h4>Daily report</h4>
          <ul className="pv-list">
            <li><span>Card</span><Meter value={64} /><b>€2,184</b></li>
            <li><span>Online</span><Meter value={48} tone="accent" /><b>€1,620</b></li>
            <li><span>Cash</span><Meter value={18} tone="ok" /><b>€612</b></li>
          </ul>
          <div className="pv-total"><span>142 orders</span><b>€4,416</b></div>
        </div>
      </div>
    </Window>
  )
}

/* ---------- Kitchen ---------- */

export function KdsPreview() {
  const seconds = useSeconds()
  const columns: [string, { id: string; base: number; items: string; allergen?: string; source: string }[]][] = [
    ['Received', [
      { id: '#1046', base: 130, items: '2 × Margherita', allergen: 'Gluten · Milk', source: 'Website' },
      { id: '#1047', base: 45, items: '1 × Greek salad', source: 'Kiosk' },
    ]],
    ['Preparing', [
      { id: '#1043', base: 500, items: '1 × Tikka masala, 2 × Naan', allergen: 'Nuts', source: 'Uber Eats' },
      { id: '#1044', base: 365, items: '1 × Risotto', source: 'Counter' },
    ]],
    ['Ready', [{ id: '#1042', base: 760, items: '1 × Tikka masala', source: 'Website' }]],
  ]
  return (
    <Window title="Kitchen display" right="Live" live>
      <div className="pv-kds">
        {columns.map(([column, tickets], c) => (
          <div className="pv-kds-col" key={column}>
            <h5><span>{column}</span><span>{tickets.length}</span></h5>
            {tickets.map((t, i) => (
              <div className={c === 0 && i === 0 ? 'pv-ticket pv-ticket--new' : 'pv-ticket'} key={t.id} data-late={t.base > 480 && c === 1}>
                <header><span>{t.id}</span><small>{c === 2 ? clock(t.base) : clock(t.base + seconds)}</small></header>
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
    </Window>
  )
}

function RecipePreview() {
  return (
    <Pair>
      <div className="pv pv-panel" aria-hidden="true">
        <h4>Quality check · #1043</h4>
        <ul className="pv-checks">
          <li data-on="true">Portion weighed</li>
          <li data-on="true">Allergen: nuts confirmed</li>
          <li data-on="true" className="pv-check-anim">Temperature above 75 °C</li>
          <li>Packaging sealed</li>
        </ul>
      </div>
      <div className="pv pv-panel" aria-hidden="true">
        <img className="pv-hero-img" src="/site/dish-mushroom-risotto.webp" alt="" width={220} height={110} loading="lazy" decoding="async" />
        <h4>Mushroom risotto <Badge tone="info">Recipe</Badge></h4>
        <ul className="pv-list">
          <li><span>Arborio rice</span><b>90 g</b></li>
          <li><span>Porcini</span><b>40 g</b></li>
          <li><span>Parmesan</span><b>25 g</b></li>
          <li><span>Stock</span><b>300 ml</b></li>
        </ul>
      </div>
    </Pair>
  )
}

const HEAT = [1, 1, 2, 4, 3, 1, 2, 5, 6, 4, 1, 1, 2, 4, 3, 1, 3, 5, 6, 4, 1, 2, 2, 4, 4, 2, 3, 6, 7, 5, 1, 2, 3, 5, 4, 2, 4, 7, 8, 6, 2, 2, 4, 6, 5, 3, 5, 8, 9, 8, 2, 3, 5, 7, 6, 4, 6, 9, 9, 8, 1, 2, 4, 6, 5, 3, 4, 7, 7, 5]

function EquipmentPreview() {
  return (
    <Window title="Kitchen · Equipment and pace" right="Old Town">
      <div className="pv-main">
        <div className="pv-card">
          <ul className="pv-list pv-list--status">
            <li><span>Pizza oven</span><small>312 °C</small><Badge tone="ok">In use</Badge></li>
            <li><span>Walk-in fridge</span><small>3.4 °C</small><Badge tone="ok">In use</Badge></li>
            <li><span>Fryer 2</span><small>—</small><Badge tone="info">Cleaning</Badge></li>
            <li><span>Dishwasher</span><small>Service Tue</small><Badge>Maintenance</Badge></li>
          </ul>
        </div>
        <div className="pv-card">
          <h4>Busiest hours <small>Mon–Sun · 12:00–22:00</small></h4>
          <div className="pv-heat">{HEAT.map((v, i) => <i key={i} style={{ opacity: 0.08 + v * 0.1 }} />)}</div>
        </div>
      </div>
    </Window>
  )
}

/* ---------- Delivery ---------- */

function DispatchPreview() {
  return (
    <Window title="Delivery · Live map" right="4 drivers out" live>
      <div className="pv-dispatch">
        <div className="pv-city">
          <span className="pv-zone pv-zone--c" /><span className="pv-zone pv-zone--b" /><span className="pv-zone pv-zone--a" />
          <span className="pv-pin pv-pin--store" style={{ left: '50%', top: '50%' }} />
          <span className="pv-driver pv-driver--1" /><span className="pv-driver pv-driver--2" /><span className="pv-driver pv-driver--3" />
          <em style={{ left: '56%', top: '42%' }}>Zone A</em><em style={{ left: '70%', top: '26%' }}>Zone B</em><em style={{ left: '84%', top: '10%' }}>Zone C</em>
        </div>
        <ul className="pv-people">
          <li><i>RK</i><span><b>Raj K.</b><small>#1042 · 12 min away</small></span><Badge tone="ok">On the way</Badge></li>
          <li><i>AS</i><span><b>Amit S.</b><small>#1045 · picking up</small></span><Badge tone="info">At store</Badge></li>
          <li><i>DC</i><span><b>David C.</b><small>#1039 · 2 stops</small></span><Badge tone="ok">On the way</Badge></li>
          <li><i>CM</i><span><b>Carla M.</b><small>Free</small></span><Badge tone="mute">Available</Badge></li>
        </ul>
      </div>
    </Window>
  )
}

export function DriverPhone() {
  const seconds = useSeconds()
  const digits = Math.min(4, Math.floor((seconds % 8) / 1.5))
  const code = ['4', '8', '1', '7']
  return (
    <Phone>
      <div className="pv-phone-head">
        <b>Delivery #1042</b>
        <span>Canal Street 14 · 2.1 km</span>
      </div>
      <div className="pv-phone-body">
        <div className="pv-card">
          <h4>Hand over <Badge tone="info">At the door</Badge></h4>
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
            <li><span>Deliveries</span><b>14</b></li>
            <li><span>Earnings</span><b>€96.40</b></li>
          </ul>
        </div>
      </div>
      <div className="pv-cta pv-cta--forest">Confirm delivery</div>
    </Phone>
  )
}

function GuestDeliveryPreview() {
  return (
    <Pair>
      <TrackingPhone />
      <div className="pv pv-panel" aria-hidden="true">
        <h4>How was your order?</h4>
        <div className="pv-stars"><i /><i /><i /><i /><i data-off="true" /></div>
        <p>Food</p>
        <div className="pv-stars"><i /><i /><i /><i /><i /></div>
        <p>Delivery</p>
        <ul className="pv-list" style={{ marginTop: 10 }}>
          <li><span>On time this week</span><b>96%</b></li>
          <li><span>Average delivery</span><b>24 min</b></li>
        </ul>
      </div>
    </Pair>
  )
}

/* ---------- Stock ---------- */

function StockPreview() {
  const rows: [string, string, number, 'warn' | 'ok' | undefined, string?][] = [
    ['Mozzarella', '18 kg', 22, 'warn', 'Low'],
    ['Tomatoes', '46 kg', 70, 'ok'],
    ['Flour 00', '120 kg', 86, 'ok'],
    ['Basil', '1.2 kg', 30, 'warn', 'Expires Thu'],
    ['Olive oil', '34 L', 62, 'ok'],
  ]
  return (
    <Window title="Inventory · Stock" right="Value €8,420">
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
      </div>
    </Window>
  )
}

function PurchasePreview() {
  return (
    <Window title="Inventory · Purchase orders" right="1 draft">
      <div className="pv-main">
        <div className="pv-card pv-card--glow">
          <h4>PO-0218 · Caseificio Rossi <Badge>Draft</Badge></h4>
          <ul className="pv-list">
            <li><span>Mozzarella · 30 kg</span><b>€246.00</b></li>
            <li><span>Parmesan · 6 kg</span><b>€108.00</b></li>
          </ul>
          <div className="pv-btn"><span>Send order</span><span>Edit</span></div>
        </div>
        <div className="pv-split">
          <div className="pv-card"><h4>Caseificio Rossi</h4><ul className="pv-list"><li><span>Mozzarella / kg</span><b>€8.20</b></li><li><span>Lead time</span><b>1 day</b></li></ul></div>
          <div className="pv-card"><h4>Latteria Nord</h4><ul className="pv-list"><li><span>Mozzarella / kg</span><b>€8.60</b></li><li><span>Lead time</span><b>2 days</b></li></ul></div>
        </div>
      </div>
    </Window>
  )
}

function WastePreview() {
  return (
    <Window title="Inventory · Recipes and waste" right="This week">
      <div className="pv-main">
        <div className="pv-card">
          <h4>Margherita <small>cost per dish</small></h4>
          <div className="pv-stack"><i style={{ width: '27%' }}>Cost €3.24</i><i>Margin €8.76</i></div>
        </div>
        <div className="pv-card">
          <h4>Waste by reason <small>€184</small></h4>
          <ul className="pv-list">
            <li><span>Expired</span><Meter value={58} tone="warn" /><b>€82</b></li>
            <li><span>Over-prepared</span><Meter value={40} tone="accent" /><b>€57</b></li>
            <li><span>Dropped or spoiled</span><Meter value={22} /><b>€31</b></li>
            <li><span>Returned</span><Meter value={10} /><b>€14</b></li>
          </ul>
        </div>
      </div>
    </Window>
  )
}

/* ---------- Team ---------- */

function RotaPreview() {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  const rows: [string, (string | null)[]][] = [
    ['Maria · Cashier', ['11–19', '11–19', null, '11–19', '15–23', '15–23', null]],
    ['Jonas · Kitchen', ['15–23', null, '15–23', '15–23', '15–23', '11–23', null]],
    ['Raj · Driver', [null, '17–22', '17–22', null, '17–23', '17–23', '12–20']],
    ['Sara · Manager', ['10–18', '10–18', '10–18', null, '14–23', '14–23', null]],
  ]
  return (
    <Window title="People · Scheduling" right="Week 47">
      <div className="pv-rota">
        <div className="pv-rota-row pv-rota-head"><span />{days.map((d) => <b key={d}>{d}</b>)}</div>
        {rows.map(([name, shifts]) => (
          <div className="pv-rota-row" key={name}>
            <span>{name}</span>
            {shifts.map((s, i) => <i key={i} data-on={Boolean(s)} data-new={name.startsWith('Raj') && i === 4}>{s}</i>)}
          </div>
        ))}
        <div className="pv-rota-foot"><span>Copy last week</span><span>Add shifts</span><b>26 shifts · 3 to confirm</b></div>
      </div>
    </Window>
  )
}

function ClockPreview() {
  const seconds = useSeconds()
  return (
    <Window title="People · On shift now" right="Old Town" live>
      <div className="pv-main">
        <div className="pv-card">
          <ul className="pv-people">
            <li><i>MA</i><span><b>Maria A.</b><small>Cashier · since 16:58</small></span><b className="pv-mono">{clock(3720 + seconds)}</b></li>
            <li><i>JK</i><span><b>Jonas K.</b><small>Kitchen · on break</small></span><Badge tone="info">Break</Badge></li>
            <li><i>RK</i><span><b>Raj K.</b><small>Driver · since 17:02</small></span><b className="pv-mono">{clock(3480 + seconds)}</b></li>
          </ul>
        </div>
        <div className="pv-card pv-card--glow">
          <h4>Hours to approve <Badge>2 waiting</Badge></h4>
          <ul className="pv-list">
            <li><span>Ana P. · Tue 11:00–19:12</span><b>8 h 12</b></li>
            <li><span>Luca B. · Tue 15:00–23:05</span><b>8 h 05</b></li>
          </ul>
          <div className="pv-btn"><span>Approve all</span><span>Review</span></div>
        </div>
      </div>
    </Window>
  )
}

function EarningsPreview() {
  return (
    <Pair>
      <Phone>
        <div className="pv-phone-head"><b>My earnings</b><span>This week</span></div>
        <div className="pv-phone-body">
          <div className="pv-card"><div className="pv-amount">€486.20</div><p>32.5 hours · €13.50 per hour</p></div>
          <div className="pv-bars">{[40, 62, 0, 58, 86, 100, 0].map((h, i) => <i key={i} style={{ height: `${h}%` }} />)}</div>
          <div className="pv-card"><ul className="pv-list"><li><span>Pay</span><b>€438.75</b></li><li><span>Tips</span><b>€47.45</b></li></ul></div>
        </div>
      </Phone>
      <div className="pv pv-panel" aria-hidden="true">
        <h4>Leaderboard <small>This month</small></h4>
        <ol className="pv-rank">
          <li><b>1</b><span>Jonas K.</span><small>Fastest prep</small></li>
          <li><b>2</b><span>Maria A.</span><small>Most orders</small></li>
          <li><b>3</b><span>Raj K.</span><small>On time 98%</small></li>
        </ol>
      </div>
    </Pair>
  )
}

function PeoplePreview() {
  return (
    <Window title="People · Staff" right="14 people">
      <div className="pv-main">
        <div className="pv-card">
          <ul className="pv-people">
            <li><i>SR</i><span><b>Sara R.</b><small>Old Town</small></span><Badge tone="info">Manager</Badge></li>
            <li><i>MA</i><span><b>Maria A.</b><small>Old Town</small></span><Badge tone="mute">Cashier</Badge></li>
            <li><i>JK</i><span><b>Jonas K.</b><small>Riverside</small></span><Badge tone="mute">Kitchen</Badge></li>
            <li><i>RK</i><span><b>Raj K.</b><small>Riverside</small></span><Badge tone="mute">Driver</Badge></li>
          </ul>
        </div>
        <div className="pv-card"><h4>New PIN for Maria A. <Badge tone="ok">Created</Badge></h4><p>Shown once. Maria signs in on any terminal at Old Town.</p></div>
      </div>
    </Window>
  )
}

/* ---------- Guests ---------- */

function GuestPreview() {
  return (
    <Window title="People · Guests" right="2,318 guests">
      <div className="pv-main">
        <div className="pv-card">
          <ul className="pv-people"><li><i>EL</i><span><b>Elena L.</b><small>23 orders · last order Sunday</small></span><Badge tone="ok">Gold</Badge></li></ul>
          <div className="pv-tier"><span>4,120 points</span><Meter value={82} tone="accent" /><span>880 to Platinum</span></div>
          <div className="pv-tags pv-tags--lg"><span>Office orders</span><span>Vegetarian</span><span>Margherita ×11</span></div>
        </div>
        <div className="pv-split">
          <div className="pv-card"><h4>Favourite</h4><p>Margherita, extra basil</p></div>
          <div className="pv-card"><h4>Addresses</h4><p>Canal Street 14 · Office</p></div>
        </div>
      </div>
    </Window>
  )
}

function CampaignPreview() {
  return (
    <Window title="People · Campaigns" right="Scheduled">
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
            <li><span>Opened</span><Meter value={54} tone="accent" /><b>346</b></li>
            <li><span>Ordered</span><Meter value={12} tone="ok" /><b>77</b></li>
          </ul>
        </div>
      </div>
    </Window>
  )
}

export function ReviewsPreview() {
  return (
    <Window title="Reviews · All sites" right="4.6 average">
      <div className="pv-main">
        {[
          { stars: 3, site: 'Old Town', text: '“Lovely pasta, but delivery took longer than promised.”', badge: 'Reply drafted', ok: false },
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
    </Window>
  )
}

function PrivacyPreview() {
  return (
    <Window title="Guests · Privacy requests" right="All handled">
      <div className="pv-main">
        <div className="pv-card">
          <ul className="pv-list pv-list--status">
            <li><span>Data export · Elena L.</span><small>Today</small><Badge tone="ok">Sent</Badge></li>
            <li><span>Erasure · Guest #2291</span><small>Yesterday</small><Badge tone="ok">Done</Badge></li>
            <li><span>Access · Marco T.</span><small>12 Nov</small><Badge tone="ok">Sent</Badge></li>
          </ul>
        </div>
        <div className="pv-card">
          <h4>Consent · Elena L.</h4>
          <ul className="pv-toggles"><li data-on="true">Order updates</li><li data-on="true">Offers by email</li><li>Offers by SMS</li></ul>
        </div>
      </div>
    </Window>
  )
}

/* ---------- Reports ---------- */

function MarginPreview() {
  return (
    <Window title="Analytics · Costs and profit" right="This month">
      <div className="pv-main">
        <div className="pv-tiles pv-tiles--3">
          <div className="pv-tile"><small>Revenue</small><b>€84,200</b></div>
          <div className="pv-tile"><small>Gross margin</small><b>68%</b></div>
          <div className="pv-tile"><small>Net profit</small><b>€12,630</b></div>
        </div>
        <div className="pv-card">
          <h4>Profit by channel <small>after commission</small></h4>
          <ul className="pv-list">
            <li><span>Website</span><Meter value={88} tone="ok" /><b>€31.20</b></li>
            <li><span>Counter</span><Meter value={80} tone="ok" /><b>€28.40</b></li>
            <li><span>Uber Eats</span><Meter value={52} tone="warn" /><b>€18.60</b></li>
            <li><span>Deliveroo</span><Meter value={48} tone="warn" /><b>€17.10</b></li>
          </ul>
        </div>
      </div>
    </Window>
  )
}

function StoresPreview() {
  return (
    <Window title="Stores · Compare" right="3 stores">
      <div className="pv-main">
        <div className="pv-card">
          <div className="pv-table">
            <div className="pv-table-head"><span>Store</span><span>Sales</span><span>Prep</span><span>Rating</span></div>
            <div><span><b>Old Town</b><small>Berlin · EUR</small></span><span>€4,416</span><span>11 min</span><span>4.7</span></div>
            <div><span><b>Riverside</b><small>Amsterdam · EUR</small></span><span>€3,870</span><span>13 min</span><span>4.6</span></div>
            <div><span><b>Station</b><small>London · GBP</small></span><span>£3,205</span><span>10 min</span><span>4.5</span></div>
          </div>
        </div>
        <div className="pv-card"><h4>Menu copied <Badge tone="ok">Done</Badge></h4><p>Autumn menu sent from Old Town to Riverside and Station.</p></div>
      </div>
    </Window>
  )
}

function ForecastPreview() {
  return (
    <Window title="Analytics · Forecast" right="Next 7 days">
      <div className="pv-main">
        <div className="pv-card">
          <h4>Expected orders <small>Friday +25%</small></h4>
          <div className="pv-bars pv-bars--wide">{[52, 48, 55, 60, 100, 92, 70].map((h, i) => <i key={i} data-peak={i === 4} style={{ height: `${h}%` }} />)}</div>
        </div>
        <ChatBubbles question="Which site had the most waste last week?" answer="Riverside: €212, mostly expired basil and mozzarella. Old Town was €184." />
      </div>
    </Window>
  )
}

function ChatBubbles({ question, answer }: { question: string; answer: string }) {
  return (
    <div className="pv-chat">
      <p className="pv-chat-q">{question}</p>
      <p className="pv-chat-a"><span className="pv-typing"><i /><i /><i /></span><span className="pv-chat-text">{answer}</span></p>
    </div>
  )
}

export function CopilotPreview() {
  return (
    <Window title="Manager Copilot" right="All stores">
      <div className="pv-main">
        <ChatBubbles question="How are we doing tonight compared with last Friday?" answer="Orders are up 12% across three stores. Old Town kitchen is 3 minutes slower than usual. Two proposals are waiting for you." />
        <div className="pv-card"><h4>Stock reorder <Badge>Needs approval</Badge></h4><p>Order 30 kg mozzarella for Friday</p><div className="pv-btn"><span>Approve</span><span>Dismiss</span></div></div>
      </div>
    </Window>
  )
}

export function SupportPhone() {
  return (
    <Phone>
      <div className="pv-phone-head"><b>Riverside Kitchen</b><span>Support · AI assistant</span></div>
      <div className="pv-phone-body">
        <ChatBubbles question="Where is my order?" answer="Order #1042 left the kitchen at 19:21. Raj is about 12 minutes away." />
        <ChatBubbles question="Is the risotto gluten free?" answer="Yes. It contains milk and celery." />
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
    kitchen: [() => <KdsPreview />, () => <RecipePreview />, () => <EquipmentPreview />],
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
  const seconds = useSeconds()
  const picked = seconds % 4
  return (
    <div className="pv pv-tablet" aria-hidden="true">
      <div className="pv-tablet-screen">
        <div className="pv-kiosk-head"><BrandMark size={18} /><b>Order here</b><span>Eat in · Take away</span></div>
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
        <div className="pv-cta">Your order · 2 items · €21.50</div>
      </div>
    </div>
  )
}

function CustomerAppPhone() {
  return (
    <Phone>
      <div className="pv-phone-head"><b>Good evening, Ana</b><span>Riverside Kitchen</span></div>
      <div className="pv-phone-body">
        <div className="pv-card pv-card--glow">
          <h4>Loyalty <Badge tone="ok">Gold</Badge></h4>
          <p><b className="pv-big">1,240</b> points</p>
          <Meter value={62} tone="accent" />
          <small>760 points to Platinum</small>
        </div>
        <div className="pv-card">
          <h4>Order again</h4>
          <ul className="pv-list">
            <li><span>Margherita · Greek salad</span><b>€21.50</b></li>
            <li><span>Mushroom risotto</span><b>€14.50</b></li>
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
  const seconds = useSeconds()
  const view = Math.floor(seconds / 3) % STAFF_VIEWS.length
  return (
    <Phone>
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
              <li><span>#1046 · 2 × Margherita</span><b>04:12</b></li>
              <li><span>#1047 · Tikka masala</span><b>02:40</b></li>
              <li><span>#1048 · Risotto</span><b>00:55</b></li>
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
          <ul className="pv-list"><li><span>Clocked in 17:02</span><b className="pv-mono">{clock(3480 + seconds)}</b></li></ul>
        </div>
      </div>
    </Phone>
  )
}

function VoicePreview() {
  return (
    <Phone>
      <div className="pv-phone-head"><b>Riverside Kitchen</b><span>Voice support</span></div>
      <div className="pv-phone-body pv-voice">
        <p className="pv-chat-q">“Which pizzas have no nuts?”</p>
        <div className="pv-wave">{Array.from({ length: 22 }, (_, i) => <i key={i} style={{ animationDelay: `${(i % 7) * 0.11}s` }} />)}</div>
        <p className="pv-chat-a"><span className="pv-chat-text">Margherita and Marinara have no nuts. Both contain gluten.</span></p>
      </div>
      <div className="pv-input">Tap and speak</div>
    </Phone>
  )
}

/** The preview for one app in the family; `wide` says whether it is a screen or a phone. */
export const APP_PREVIEW_WIDE: Record<string, boolean> = {
  web: false, counter: true, kiosk: true, kds: true, driver: false, manager: true, agents: true,
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
