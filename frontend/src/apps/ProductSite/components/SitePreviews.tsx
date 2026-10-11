import type { ReactNode } from 'react';
import {
  AlertTriangle, ArrowLeft, ArrowRight, BarChart3, Bell, Bot, Calendar, ChevronDown, CircleHelp, ClipboardList, FileText,
  Home, Info, MapPin, MessageSquare, MoreHorizontal, Package, Phone, Plus, Search, Settings, ShoppingBag, Truck, User, Users, UtensilsCrossed,
} from 'lucide-react';
import MaSoVaBrand from '../../../components/common/MaSoVaBrand';

// Illustrative sample data only. These previews never read live restaurant data.
type Tone = 'warning' | 'success' | 'info' | 'neutral' | 'error';
export function Chip({ tone, children, plain }: { tone: Tone; children: ReactNode; plain?: boolean }) {
  return <span className={'msite-chip msite-chip-' + tone + (plain ? ' msite-chip-plain' : '')}>{children}</span>;
}

const STATUS_TONE: Record<string, Tone> = {
  Preparing: 'warning', 'In oven': 'warning', Baked: 'success', Ready: 'success', Received: 'info',
  'Out for delivery': 'info', Delivered: 'success', Completed: 'neutral', Dispatched: 'info',
};
export const statusTone = (status: string): Tone => STATUS_TONE[status] ?? 'neutral';

const RAIL = [
  { label: 'Overview', icon: BarChart3, on: true }, { label: 'Orders', icon: FileText, count: 24 }, { label: 'Kitchen', icon: UtensilsCrossed },
  { label: 'Delivery', icon: Truck }, { label: 'Menu', icon: ClipboardList }, { label: 'Inventory', icon: Package },
  { label: 'Customers', icon: Users }, { label: 'Reports', icon: BarChart3 }, { label: 'AI assistants', icon: Bot },
];
const LIVE_ORDERS = [
  ['#1042', '12:24', 'A. Müller', '2 items', 'Wolt', 'Preparing', '18 min'],
  ['#1041', '12:20', 'S. Rossi', '3 items', 'Uber Eats', 'In oven', '12 min'],
  ['#1040', '12:18', 'K. Sharma', '1 item', 'Direct', 'Ready', '5 min'],
  ['#1039', '12:14', 'L. Dubois', '4 items', 'Just Eat', 'Out for delivery', '8 min'],
  ['#1038', '12:11', 'M. Becker', '2 items', 'Deliveroo', 'Preparing', '20 min'],
];
const ORDER_STATUS = [
  ['Received', 5, '#2E8B57'], ['Preparing', 7, '#7FA650'], ['In oven', 4, '#D9A520'],
  ['Baked', 3, '#E0672B'], ['Ready', 3, '#1F6F4A'], ['Out for delivery', 2, '#2F6FB7'],
] as const;
const SALES_POINTS = [0, 6, 4, 10, 14, 11, 22, 18, 30, 26, 44, 38, 52, 47, 66, 60, 78, 70, 92, 80, 62, 40, 30, 28];

function SalesChart() {
  const w = 400, h = 104;
  const path = SALES_POINTS.map((v, i) => `${i === 0 ? 'M' : 'L'}${(i / (SALES_POINTS.length - 1)) * w},${h - (v / 100) * h}`).join(' ');
  return <svg viewBox={`0 -6 ${w} ${h + 26}`} width="100%" height="128" preserveAspectRatio="none">
    {[0, 0.25, 0.5, 0.75, 1].map(t => <line key={t} x1="0" x2={w} y1={h * t} y2={h * t} stroke="#E6E8E2" strokeWidth="1" />)}
    <path d={`${path} L${w},${h} L0,${h} Z`} fill="#1F7A4D" opacity="0.12" />
    <path d={path} fill="none" stroke="#1F7A4D" strokeWidth="2" strokeLinejoin="round" />
    {['09:00', '12:00', '15:00', '18:00', '21:00'].map((label, i) => <text key={label} x={i * (w / 4.4) + 8} y={h + 16} fontSize="10" fill="#55635A">{label}</text>)}
  </svg>;
}

function StatusRing() {
  const total = ORDER_STATUS.reduce((sum, [, count]) => sum + count, 0);
  const r = 36, c = 2 * Math.PI * r;
  const arcs = ORDER_STATUS.map(([label, count, color], index) => ({
    label, color, length: (count / total) * c,
    offset: (ORDER_STATUS.slice(0, index).reduce((sum, [, earlier]) => sum + earlier, 0) / total) * c,
  }));
  return <svg viewBox="0 0 96 96" width="96" height="96">
    {arcs.map(({ label, color, length, offset }) => <circle key={label} cx="48" cy="48" r={r} fill="none" stroke={color} strokeWidth="11" strokeDasharray={`${length} ${c - length}`} strokeDashoffset={-offset} transform="rotate(-90 48 48)" />)}
    <text x="48" y="48" textAnchor="middle" fontSize="18" fontWeight="600" fill="#121614">{total}</text>
    <text x="48" y="61" textAnchor="middle" fontSize="9" fill="#55635A">active</text>
  </svg>;
}

/** Board 00 manager overview. */
export function DashboardPreview() {
  return <div className="msite-shot dash">
    <div className="dash-rail">
      <MaSoVaBrand />
      {RAIL.map(({ label, icon: Icon, on, count }) => <span key={label} className="dash-item" data-on={!!on}><Icon size={16} />{label}{count && <span className="dash-count">{count}</span>}</span>)}
      <span className="dash-item dash-foot"><Settings size={16} />Settings</span>
      <span className="dash-item"><CircleHelp size={16} />Help</span>
    </div>
    <div className="dash-main">
      <div className="dash-top">
        <span className="dash-pick"><MapPin size={15} />Berlin Mitte<ChevronDown size={14} /></span>
        <span className="dash-pick"><Calendar size={15} />Today <small>Wed, 16 Apr 2025</small><ChevronDown size={14} /></span>
        <span className="dash-top-end"><Search size={17} /><Bell size={17} /><span className="dash-avatar">JS</span></span>
      </div>
      <div className="dash-kpis">
        <div className="dash-card dash-kpi"><span className="dash-kpi-icon"><ShoppingBag size={18} /></span><div><strong>€4,280<em>▲ +12%</em></strong><small>Sales</small></div></div>
        <div className="dash-card dash-kpi"><span className="dash-kpi-icon" data-tone="alert"><ClipboardList size={18} /></span><div><strong>24</strong><small>Active orders</small></div></div>
        <div className="dash-card dash-kpi"><span className="dash-kpi-icon"><Users size={18} /></span><div><strong>8</strong><small>On shift</small></div></div>
        <div className="dash-card dash-kpi"><span className="dash-kpi-icon" data-tone="alert"><AlertTriangle size={18} /></span><div><strong>3</strong><small>Needs attention</small></div></div>
      </div>
      <div className="dash-row">
        <div className="dash-card">
          <div className="dash-card-head"><h4>Sales overview</h4><span className="dash-pick" style={{ padding: '4px 10px' }}>Sales<ChevronDown size={13} /></span></div>
          <div className="dash-big">€4,280<em>▲ +12%</em><small>vs. previous Wednesday</small></div>
          <SalesChart />
        </div>
        <div className="dash-card">
          <div className="dash-card-head"><h4>Order status</h4></div>
          <div className="dash-status"><StatusRing /><ul>{ORDER_STATUS.map(([label, count, color]) => <li key={label}><i style={{ background: color }} />{label}<b>{count}</b></li>)}</ul></div>
        </div>
      </div>
      <div className="dash-row">
        <div className="dash-card" style={{ padding: '14px 4px 4px' }}>
          <div className="dash-card-head" style={{ padding: '0 10px' }}><h4>Live orders</h4><span style={{ color: 'var(--masova-primary)', fontSize: 11 }}>View all orders →</span></div>
          <table className="msite-tbl">
            <thead><tr>{['#', 'Time', 'Customer', 'Items', 'Source', 'Status', 'ETA'].map(head => <th key={head}>{head}</th>)}</tr></thead>
            <tbody>{LIVE_ORDERS.map(([id, time, customer, items, source, status, eta]) => <tr key={id}><td><b>{id}</b></td><td>{time}</td><td>{customer}</td><td>{items}</td><td><span className="src-chip">{source}</span></td><td><Chip tone={statusTone(status)}>{status}</Chip></td><td>{eta}</td></tr>)}</tbody>
          </table>
        </div>
        <div className="dash-card">
          <div className="dash-card-head" style={{ marginBottom: 0 }}><h4>Inventory proposals<span className="dash-badge">1</span></h4><ArrowRight size={15} /></div>
          <div className="dash-prop">
            <div className="dash-prop-head"><Info size={13} />Awaiting manager review</div>
            <table><tbody>
              {[['Mozzarella (1 kg)', '+3', '€27.00'], ['Tomatoes (5 kg)', '+1', '€12.50'], ['Basil (500 g)', '+2', '€8.00'], ['Olive oil (1 L)', '+1', '€14.00']].map(([item, qty, cost]) => <tr key={item}><td>{item}</td><td>{qty}</td><td>{cost}</td></tr>)}
            </tbody></table>
          </div>
          <div className="dash-cta">Review 4 items<ArrowRight size={15} /></div>
        </div>
      </div>
    </div>
  </div>;
}

function PhoneFrame({ children }: { children: ReactNode }) {
  return <div className="phone">{children}</div>;
}
function PhoneNav({ items }: { items: [string, typeof Home][] }) {
  return <div className="phone-nav">{items.map(([label, Icon], index) => <span key={label} data-on={index === 0}><Icon size={15} />{label}</span>)}</div>;
}
function RouteMap() {
  return <div className="phone-map"><svg viewBox="0 0 240 200" preserveAspectRatio="xMidYMid slice">
    <rect width="240" height="200" fill="#E9ECE4" />
    {[30, 80, 130, 175].map(y => <path key={y} d={`M-10 ${y} L250 ${y + 22}`} stroke="#fff" strokeWidth="7" />)}
    {[40, 105, 170].map(x => <path key={x} d={`M${x} -10 L${x + 26} 210`} stroke="#fff" strokeWidth="7" />)}
    <rect x="128" y="20" width="52" height="38" rx="6" fill="#D5E3CF" />
    <path d="M52 120 C70 150 80 168 92 186" stroke="#2F6FB7" strokeWidth="3" fill="none" strokeLinecap="round" />
    <path d="M92 186 C130 170 160 150 196 122" stroke="#E08A1E" strokeWidth="3" fill="none" strokeLinecap="round" />
    <circle cx="52" cy="118" r="9" fill="#DE4212" /><circle cx="196" cy="122" r="9" fill="#E08A1E" /><circle cx="150" cy="40" r="9" fill="#1F6F4A" /><circle cx="94" cy="188" r="9" fill="#1F6F4A" />
    <text x="110" y="100" fontSize="11" fontWeight="600" fill="#121614">Berlin Mitte</text>
  </svg></div>;
}

export function DeliveryPhone() {
  return <PhoneFrame>
    <div className="phone-bar"><ArrowLeft size={15} />Delivery<Info size={14} /></div>
    <div className="phone-body">
      <div className="phone-tabs"><span data-on="true" style={{ flex: 1, textAlign: 'center', borderRadius: 6 }}>Live</span><span style={{ flex: 1, textAlign: 'center', borderRadius: 6 }}>Map</span></div>
      <RouteMap />
      <div className="phone-row"><b>#1039</b><Chip tone="info">Out for delivery</Chip></div>
      <div className="phone-row"><span>L. Dubois<br /><span style={{ color: 'var(--masova-successText)', fontWeight: 600 }}>8 min away</span></span><span style={{ display: 'flex', gap: 10 }}><Phone size={15} /><MessageSquare size={15} /></span></div>
      <small style={{ color: 'var(--masova-textSecondary)', fontSize: 10.5 }}>Torstraße 72, 10119 Berlin</small>
      <span className="phone-ghost" style={{ textAlign: 'center', padding: 9, marginBottom: 12 }}>View order</span>
    </div>
  </PhoneFrame>;
}

const DISH = (name: string) => `/images/menu/${name}.jpg`;

function CustomerPhone() {
  return <PhoneFrame>
    <div className="phone-bar"><MaSoVaBrand /><Bell size={15} /></div>
    <div className="phone-body">
      <small style={{ color: 'var(--masova-textSecondary)', fontSize: 10.5 }}>Deliver to<br /><b style={{ color: 'var(--masova-text)', fontSize: 12 }}>12 High Street, Berlin</b></small>
      <div className="phone-search"><Search size={13} />Search for dishes…</div>
      <div className="phone-tabs"><span data-on="true">All</span><span>Indian</span><span>Pizza</span><span>Sides</span></div>
      {[['Chicken Tikka Masala', 'A rich and creamy classic.', '€14.50', 'chicken-tikka-masala'], ['Margherita Pizza', 'San Marzano tomato, mozzarella, basil.', '€12.00', 'margherita-pizza'], ['Palak Paneer', 'Mild, creamy and aromatic.', '€13.50', 'palak-paneer']].map(([name, desc, price, image]) => <div key={name} className="phone-card"><img src={DISH(image)} alt="" loading="lazy" /><div className="phone-card-main"><b>{name}</b><small>{desc}</small><b style={{ marginTop: 4 }}>{price}</b></div><span className="phone-add"><Plus size={14} /></span></div>)}
    </div>
    <PhoneNav items={[['Home', Home], ['Search', Search], ['Orders', FileText], ['Account', User]]} />
  </PhoneFrame>;
}

function KitchenPhone() {
  const tickets: [string, string, string, string, string, string][] = [
    ['#1042', '12:28', 'Aisha Khan · Wolt', '1 × Chicken Tikka Masala\n1 × Naan', 'Preparing', '13 min'],
    ['#1041', '12:27', 'Marco Rossi · Direct', '1 × Margherita Pizza\n1 × Coke', 'In oven', '10 min'],
    ['#1040', '12:25', 'Sophie Martin · Uber Eats', '1 × Paneer Korma\n1 × Rice', 'Received', '18 min'],
  ];
  return <PhoneFrame>
    <div className="phone-bar"><ArrowLeft size={15} />Kitchen<Settings size={14} /></div>
    <div className="phone-body">
      <div className="phone-tabs"><span data-on="true">New 6</span><span>Preparing</span><span>In oven</span><span>Ready</span></div>
      {tickets.map(([id, time, who, items, status, eta]) => <div key={id} className="phone-card" style={{ display: 'block' }}><div className="phone-row"><b>{id} <span style={{ fontWeight: 400, color: 'var(--masova-textSecondary)' }}>{time}</span></b><small>{eta}</small></div><small>{who}</small><div className="phone-row" style={{ alignItems: 'flex-end' }}><span style={{ whiteSpace: 'pre-line', fontSize: 11 }}>{items}</span><Chip tone={statusTone(status)}>{status}</Chip></div></div>)}
      <div className="phone-action">Mark as ready</div>
    </div>
    <div style={{ height: 12 }} />
  </PhoneFrame>;
}

function DriverPhone() {
  const stops = [['#1039', 'Just Eat', 'Lukas Weber', '2 × Pepperoni Pizza', '12:32', 'pepperoni-pizza'], ['#1043', 'Deliveroo', 'Emma Laurent', '1 × Butter Chicken', '12:35', 'butter-chicken'], ['#1044', 'Direct', 'Daniel Kim', '1 × Margherita Pizza', '12:40', 'margherita-pizza']];
  return <PhoneFrame>
    <div className="phone-bar"><ArrowLeft size={15} />Driver<Settings size={14} /></div>
    <div className="phone-body">
      <div className="phone-tabs"><span data-on="forest">To collect 3</span><span>On route 2</span></div>
      {stops.map(([id, source, who, items, at, image]) => <div key={id} className="phone-card"><img src={DISH(image)} alt="" loading="lazy" /><div className="phone-card-main"><b>{id} <span style={{ fontWeight: 400, color: 'var(--masova-textSecondary)', fontSize: 10.5 }}>{source}</span></b><small>{who}</small><small>{items}</small><div className="phone-row" style={{ marginTop: 6 }}><small>Collect at {at}</small><span className="phone-ghost">Directions</span></div></div></div>)}
    </div>
    <div style={{ height: 12 }} />
  </PhoneFrame>;
}

function CashierPhone() {
  const lines = [['2 × Margherita Pizza', '€24.00'], ['1 × Garlic Naan', '€5.50'], ['2 × Cola', '€6.00']];
  return <PhoneFrame>
    <div className="phone-bar"><ArrowLeft size={15} />Cashier<Settings size={14} /></div>
    <div className="phone-body">
      <div className="phone-tabs"><span data-on="forest">Dine in</span><span>Takeaway</span><span>Delivery</span></div>
      <div className="phone-search"><Search size={13} />Search menu…</div>
      <div className="phone-card" style={{ display: 'block' }}><b>Table 4 · Order #1045</b>{lines.map(([name, price]) => <div key={name} className="phone-row" style={{ marginTop: 8 }}><span>{name}</span><span>{price}</span></div>)}</div>
      <div className="phone-card" style={{ display: 'block' }}><div className="phone-row"><small>Subtotal</small><span>€35.50</span></div><div className="phone-row"><small>VAT included</small><span>€5.67</span></div><div className="phone-row" style={{ marginTop: 6 }}><b>Total</b><b>€35.50</b></div></div>
      <div className="phone-row" style={{ gap: 8 }}><span className="phone-ghost" style={{ flex: 1, textAlign: 'center', padding: 9 }}>Cash</span><span className="phone-ghost" style={{ flex: 1, textAlign: 'center', padding: 9 }}>Card</span></div>
      <div className="phone-action">Take payment</div>
    </div>
    <div style={{ height: 12 }} />
  </PhoneFrame>;
}

function ManagerPhone() {
  return <PhoneFrame>
    <div className="phone-bar"><ArrowLeft size={15} />Manager<span className="phone-ghost">Today</span></div>
    <div className="phone-body">
      <div className="phone-kpis">
        <div><small>Orders</small><b>86</b></div><div><small>Revenue</small><b>€1,249</b></div>
        <div><small>On time delivery</small><b>94%</b></div><div><small>Avg. prep time</small><b>14 min</b></div>
      </div>
      <b style={{ fontWeight: 600 }}>Live orders by status</b>
      <ul className="phone-list">{[['Received', 8, '#2F6FB7'], ['Preparing', 10, '#E0672B'], ['In oven', 6, '#D9A520'], ['Baked', 4, '#7FA650'], ['Ready', 6, '#1F6F4A'], ['Out for delivery', 8, '#2F6FB7']].map(([label, count, color]) => <li key={label}><i style={{ background: color as string }} />{label}<b>{count}</b></li>)}</ul>
    </div>
    <PhoneNav items={[['Home', Home], ['Orders', FileText], ['Insights', BarChart3], ['More', MoreHorizontal]]} />
  </PhoneFrame>;
}

export const ROLE_PHONES = {
  customer: CustomerPhone, kitchen: KitchenPhone, driver: DriverPhone, cashier: CashierPhone, manager: ManagerPhone,
};
