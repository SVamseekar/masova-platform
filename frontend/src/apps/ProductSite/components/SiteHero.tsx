import { ArrowRight, ChartColumnIncreasing, Check, ChefHat, ChevronRight, CircleCheck, Plus, Printer, Search, ShoppingBasket, Store, Truck } from 'lucide-react';
import { useState } from 'react';
import { openContactForm } from '../constants';
import { moveTabFocus } from '../../../hooks/useFocusTrap';
import { FitPreview } from './SiteChrome';
import { Chip, DashboardPreview, DeliveryPhone, statusTone } from './SitePreviews';

const CAPABILITIES = [
  { icon: ShoppingBasket, title: 'Ordering', text: 'Direct, Wolt, Deliveroo, Just Eat, Uber Eats' },
  { icon: Printer, title: 'POS', text: 'In-store orders and payments' },
  { icon: ChefHat, title: 'Kitchen', text: 'Real-time preparation and kitchen display' },
  { icon: Truck, title: 'Delivery', text: 'In-house and marketplace delivery, with live tracking' },
  { icon: ChartColumnIncreasing, title: 'Insights', text: 'Sales, operations and customers' },
];

/** Board 00 hero, with the board 03 compact layout below 720px. */
export function SiteHero() {
  return <section className="msite-hero" aria-labelledby="site-hero-title">
    <div className="msite-hero-stage">
    <img className="msite-hero-food" src="/images/brand/hero-food-v1.jpg" alt="" />
    <div className="msite-wrap msite-hero-grid">
      <div className="msite-hero-copy">
        <p className="msite-eyebrow">The restaurant operating system</p>
        <h1 id="site-hero-title">Every location.<br />One clear view.</h1>
        <p className="msite-hero-sub">Orders, kitchen, delivery, and customer care. Connected.</p>
        <div className="msite-hero-actions">
          <button type="button" className="msite-btn msite-btn-primary" onClick={() => openContactForm()}>Book a walkthrough<ArrowRight size={20} aria-hidden="true" /></button>
          <a className="msite-btn" href="/#product">Explore the platform</a>
        </div>
        <p className="msite-hero-note">See MaSoVa in action for your restaurant group, in a personalised tour.</p>
        <ul className="msite-hero-checks">
          <li><CircleCheck size={18} aria-hidden="true" />Orders from your website, Wolt, Deliveroo, Just Eat and Uber Eats</li>
          <li><CircleCheck size={18} aria-hidden="true" />AI assistants for daily operations</li>
          <li><CircleCheck size={18} aria-hidden="true" />Built for multi-location restaurants</li>
        </ul>
        <div className="msite-hero-compact"><CompactOverview /></div>
      </div>
      <div className="msite-hero-art">
        <FitPreview width={940} height={690} label="Illustrative manager overview for Berlin Mitte: sales, active orders, order status, live orders and inventory proposals awaiting manager review"><DashboardPreview /></FitPreview>
        <div className="msite-hero-phone"><FitPreview width={260} height={500} label="Illustrative driver delivery screen with a live map"><DeliveryPhone /></FitPreview></div>
      </div>
    </div>
    </div>
    <div className="msite-strip">
      <div className="msite-wrap">
        <ul>{CAPABILITIES.map(({ icon: Icon, title, text }) => <li key={title}><Icon size={36} strokeWidth={1.9} aria-hidden="true" /><div><h3>{title}</h3><p>{text}</p></div></li>)}</ul>
        <p className="msite-sample msite-strip-note">Design concept · illustrative data</p>
      </div>
    </div>
  </section>;
}

function CompactOverview() {
  const orders = [['#1042', 'Preparing', '12 min'], ['#1041', 'In oven', '8 min'], ['#1040', 'Ready', '2 min']];
  return <div className="msite-panel" role="img" aria-label="Illustrative overview: 128 orders today, €2,346 sales, 96% on time, three active orders" style={{ padding: 16 }}>
    <div aria-hidden="true" style={{ display: 'grid', gap: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, border: '1px solid var(--masova-borderSubtle)', borderRadius: 8, padding: 12 }}><Store size={18} /><div><b style={{ fontWeight: 600 }}>All locations</b><div className="msite-sample">3 locations</div></div><ChevronRight size={18} style={{ marginLeft: 'auto' }} /></div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
        {[["Today's orders", '128'], ['Sales', '€2,346'], ['On time', '96%']].map(([label, value]) => <div key={label}><div className="msite-sample">{label}</div><b className="msite-num" style={{ fontSize: 20, fontWeight: 600 }}>{value}</b></div>)}
      </div>
      <b style={{ fontWeight: 600 }}>Active orders</b>
      {orders.map(([id, status, eta]) => <div key={id} style={{ display: 'flex', alignItems: 'center', gap: 12 }}><b style={{ fontWeight: 600 }}>{id}</b><Chip tone={statusTone(status)}>{status}</Chip><span className="msite-sample" style={{ marginLeft: 'auto' }}>{eta}</span></div>)}
    </div>
  </div>;
}

type TourRow = string[];
interface TourTab {
  id: string; label: string; title: string; action?: string; outcomes: string[];
  stats: [string, string, string?][]; columns: string[]; rows: TourRow[]; statusColumn?: number;
}

const TOUR_TABS: TourTab[] = [
  {
    id: 'ordering', label: 'Ordering', title: 'Orders', action: 'Create order',
    outcomes: ['Website, app and marketplace orders in one list', 'Allergens and VAT shown on every order', 'Delivery fee priced by zone'],
    stats: [['12', 'Received'], ['8', 'Preparing', 'warning'], ['4', 'In oven', 'warning'], ['6', 'Ready', 'success'], ['3', 'Out for delivery', 'info'], ['2', 'Completed']],
    columns: ['#', 'Time', 'Customer', 'Channel', 'Items', 'Total', 'Status'], statusColumn: 6,
    rows: [
      ['#1042', '14:28', 'Priya Sharma', 'Direct', '2 items', '€24.50', 'Preparing'], ['#1041', '14:17', 'Luca Bianchi', 'Wolt', '3 items', '€32.00', 'In oven'],
      ['#1040', '14:12', 'Oliver Schmidt', 'Deliveroo', '1 item', '€14.90', 'Ready'], ['#1039', '13:58', 'Emma Wilson', 'Just Eat', '3 items', '€28.50', 'Out for delivery'],
      ['#1038', '13:41', 'Amit Patel', 'Uber Eats', '2 items', '€22.00', 'Delivered'], ['#1037', '13:25', 'Sofia Müller', 'Direct', '2 items', '€19.50', 'Completed'],
    ],
  },
  {
    id: 'kitchen', label: 'Kitchen', title: 'Kitchen display',
    outcomes: ['Every ticket moves through clear stages', 'Allergens visible on the ticket', 'Timers show what is running late'],
    stats: [], columns: [], rows: [],
  },
  {
    id: 'delivery', label: 'Delivery', title: 'Deliveries',
    outcomes: ['Drivers assigned when orders are ready', 'Live position and ETA for customers', 'One-time code confirms the handover'],
    stats: [['5', 'Waiting for driver'], ['7', 'On route'], ['31', 'Delivered today']],
    columns: ['#', 'Customer', 'Driver', 'Zone', 'ETA', 'Status'], statusColumn: 5,
    rows: [
      ['#1039', 'L. Dubois', 'Jonas K.', '0–3 km', '8 min', 'Out for delivery'], ['#1036', 'H. Novak', 'Mira S.', '3–6 km', '14 min', 'Out for delivery'],
      ['#1040', 'K. Sharma', 'Not assigned', '0–3 km', '–', 'Ready'], ['#1035', 'E. Laurent', 'Jonas K.', '6–10 km', '–', 'Delivered'], ['#1033', 'D. Kim', 'Tariq A.', '3–6 km', '–', 'Delivered'],
    ],
  },
  {
    id: 'payments', label: 'Payments', title: 'Payments',
    outcomes: ['Stripe and Razorpay in one ledger', 'VAT calculated per country and order type', 'Refunds need manager approval'],
    stats: [['€4,280', 'Collected today'], ['€412', 'VAT'], ['2', 'Refund requests']],
    columns: ['Order', 'Method', 'Gateway', 'VAT', 'Amount', 'Status'], statusColumn: 5,
    rows: [
      ['#1042', 'Card', 'Stripe', '€1.60', '€24.50', 'Paid'], ['#1041', 'Card', 'Stripe', '€2.09', '€32.00', 'Paid'], ['#1040', 'Cash', 'Counter', '€0.97', '€14.90', 'Paid'],
      ['#1038', 'Card', 'Stripe', '€1.44', '€22.00', 'Refund requested'], ['#1037', 'Card', 'Stripe', '€1.28', '€19.50', 'Paid'],
    ],
  },
  {
    id: 'aggregators', label: 'Aggregators', title: 'Channels',
    outcomes: ['Marketplace orders join the same kitchen queue', 'Commission tracked per channel', 'Margin visible next to revenue'],
    stats: [['40', 'Orders today'], ['5', 'Channels connected']],
    columns: ['Channel', 'Orders', 'Revenue', 'Commission', 'Net', 'Status'], statusColumn: 5,
    rows: [
      ['Direct', '12', '€312.40', '€0.00', '€312.40', 'Connected'], ['Wolt', '8', '€221.60', '€55.40', '€166.20', 'Connected'], ['Deliveroo', '6', '€158.90', '€44.49', '€114.41', 'Connected'],
      ['Just Eat', '5', '€131.00', '€34.06', '€96.94', 'Connected'], ['Uber Eats', '9', '€248.30', '€74.49', '€173.81', 'Connected'],
    ],
  },
  {
    id: 'analytics', label: 'Analytics', title: 'Sales by day',
    outcomes: ['Sales, prep time and delivery performance', 'Compare locations side by side', 'Top dishes and quiet hours'],
    stats: [['€27,460', 'This week'], ['1,032', 'Orders'], ['€26.61', 'Average order'], ['14 min', 'Average prep']],
    columns: [], rows: [],
  },
];
const PAYMENT_TONE: Record<string, 'success' | 'warning'> = { Paid: 'success', Connected: 'success', 'Refund requested': 'warning' };
const KITCHEN_LANES: [string, [string, string, string][]][] = [
  ['Received', [['#1045', '1 × Paneer Korma\n1 × Rice', '1 min'], ['#1044', '2 × Garlic Naan', '2 min']]],
  ['Preparing', [['#1042', '1 × Chicken Tikka Masala\n1 × Naan', '6 min'], ['#1043', '1 × Butter Chicken', '4 min']]],
  ['In oven', [['#1041', '1 × Margherita Pizza', '9 min']]],
  ['Ready', [['#1040', '2 × Pepperoni Pizza', '12 min']]],
];
const WEEK = [['Mon', 46], ['Tue', 52], ['Wed', 61], ['Thu', 58], ['Fri', 84], ['Sat', 100], ['Sun', 77]] as const;

function TourPreview({ tab }: { tab: TourTab }) {
  const detail = tab.id === 'ordering';
  return <div className="msite-shot tour">
    <div className="tour-head"><h4>{tab.title}</h4>{tab.action && <span className="tour-create"><Plus size={15} />{tab.action}</span>}</div>
    {tab.stats.length > 0 && <div className="tour-stats">{tab.stats.map(([value, label, tone]) => <div key={label} data-tone={tone}><b>{value}</b><small>{label}</small></div>)}</div>}
    {detail && <div className="tour-filters"><span><Search size={13} />Search by order, customer or channel…</span><span>All channels</span><span>All statuses</span><span>Newest first</span></div>}
    {tab.id === 'kitchen' && <div className="tour-lanes">{KITCHEN_LANES.map(([lane, tickets]) => <div key={lane} className="tour-lane"><b>{lane}<span>{tickets.length}</span></b>{tickets.map(([id, items, age]) => <div key={id} className="tour-ticket"><b>{id}<span style={{ fontWeight: 400, fontSize: 12 }}>{age}</span></b><p style={{ whiteSpace: 'pre-line' }}>{items}</p></div>)}</div>)}</div>}
    {tab.id === 'analytics' && <div><div className="tour-bars">{WEEK.map(([day, value]) => <div key={day} style={{ height: value + '%' }} />)}</div><div className="tour-bar-labels">{WEEK.map(([day]) => <span key={day}>{day}</span>)}</div></div>}
    {tab.rows.length > 0 && <div className="tour-body" data-wide={!detail}>
      <table className="msite-tbl" style={{ alignSelf: 'start' }}>
        <thead><tr>{tab.columns.map(column => <th key={column}>{column}</th>)}</tr></thead>
        <tbody>{tab.rows.map((row, index) => <tr key={row[0]} data-selected={detail && index === 0}>{row.map((cell, column) => <td key={column}>{column === tab.statusColumn ? <Chip tone={PAYMENT_TONE[cell] ?? statusTone(cell)}>{cell}</Chip> : column === 0 ? <b>{cell}</b> : cell}</td>)}</tr>)}</tbody>
      </table>
      {detail && <div className="tour-detail">
        <div className="tour-head"><b>Order #1042</b><Chip tone="warning">Preparing</Chip></div>
        <small>14:28 · Direct order</small>
        <div className="tour-detail-item"><img src="/images/menu/chicken-tikka-masala.jpg" alt="" loading="lazy" /><div><b>Chicken Tikka Masala</b><small>1 × €14.00</small><small>Allergens: Milk</small></div></div>
        <div className="tour-detail-item"><img src="/images/menu/garlic-naan.jpg" alt="" loading="lazy" /><div><b>Garlic Naan</b><small>1 × €5.50</small><small>Allergens: Gluten</small></div></div>
        <div className="tour-totals"><div><span>Subtotal</span><span>€19.50</span></div><div><span>Delivery fee</span><span>€3.00</span></div><div><span>VAT (7%)</span><span>€2.00</span></div><div><span>Total</span><span>€24.50</span></div></div>
      </div>}
    </div>}
  </div>;
}

/** Board 01 panel 1. */
export function PlatformTour() {
  const [active, setActive] = useState(TOUR_TABS[0].id);
  const tab = TOUR_TABS.find(item => item.id === active) ?? TOUR_TABS[0];
  return <section id="product" className="msite-section msite-section-alt" aria-labelledby="site-tour-title">
    <div className="msite-wrap msite-tour">
      <div>
        <h2 id="site-tour-title" className="msite-h2">One platform for modern restaurant operations</h2>
        <p className="msite-lead">Manage orders, streamline kitchen and delivery, process payments and grow across all your channels.</p>
        <div className="msite-tour-tabs" role="tablist" aria-label="Platform areas" onKeyDown={moveTabFocus}>
          {TOUR_TABS.map(item => <button key={item.id} type="button" role="tab" id={'tour-tab-' + item.id} aria-selected={item.id === active} tabIndex={item.id === active ? 0 : -1} aria-controls="tour-panel" onClick={() => setActive(item.id)}>{item.label}</button>)}
        </div>
        <ul className="msite-tour-outcomes">{tab.outcomes.map(outcome => <li key={outcome}><Check size={18} aria-hidden="true" />{outcome}</li>)}</ul>
      </div>
      <div id="tour-panel" role="tabpanel" aria-labelledby={'tour-tab-' + tab.id}>
        <FitPreview width={680} height={500} label={`Illustrative ${tab.label.toLowerCase()} screen with sample data`}><TourPreview tab={tab} /></FitPreview>
        <p className="msite-sample" style={{ textAlign: 'right', marginTop: 12 }}>Concept · sample data</p>
      </div>
    </div>
  </section>;
}
