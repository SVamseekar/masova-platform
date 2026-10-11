import { useEffect, useState } from 'react';
import {
  ArrowRight, BarChart3, Box, ChartNoAxesColumnIncreasing, ChefHat, ChevronRight, ChevronUp, CircleCheck, CreditCard, MessageSquareMore, PackageCheck, FileText, Gift, HelpCircle, MapPin, MessageSquare,
  MessageSquareText, Monitor, Package, Send, Settings, ShieldCheck, ShoppingCart, Truck, User, UserCheck, Users, Wrench,
} from 'lucide-react';
import MaSoVaBrand from '../../../components/common/MaSoVaBrand';
import { OPEN_CONTACT_EVENT, openContactForm } from '../constants';
import { moveTabFocus } from '../../../hooks/useFocusTrap';
import { ChannelMark, ProviderMark } from './ChannelMarks';
import DemoRequestForm from './DemoRequestForm';
import { FitPreview, SIGN_IN_PATH } from './SiteChrome';
import { Chip, ROLE_PHONES } from './SitePreviews';

// All figures in these sections are illustrative samples, labelled as such on the page.
const ASSISTANTS = [
  { id: 'support', icon: MessageSquareMore, name: 'Customer support', text: 'Answer guest questions about orders and the menu.', timing: 'Always on, inside your ordering site and app',
    chat: ['Where is my order #2041?', 'Your order is preparing. Open Orders to track its progress.'],
    task: { title: 'Refund request', subject: 'Order #2038 · cold delivery', rows: [['Requested:', '€12.00'], ['Order total:', '€24.50']] } },
  { id: 'forecast', icon: ChartNoAxesColumnIncreasing, name: 'Demand forecast', text: 'Predict busy periods and help you prepare.', timing: 'Runs every night',
    chat: ['What should we expect on Saturday evening?', 'Sample forecast: Butter Chicken demand is higher than a usual Saturday between 18:00 and 21:00.'],
    task: { title: 'Suggested prep plan', subject: 'Saturday dinner service', rows: [['Usual batch:', '40 portions'], ['Proposed:', '52 portions']] } },
  { id: 'inventory', icon: Box, name: 'Inventory reorder', text: 'Suggest items to order and quantities.', timing: 'Checks stock through the day',
    chat: ['Which items are running low?', 'Mozzarella and basil are below their reorder level. A draft purchase order is ready for review.'],
    task: { title: 'Draft purchase order', subject: '4 items · Berlin Mitte', rows: [['Items:', '4'], ['Estimated cost:', '€61.50']] } },
  { id: 'churn', icon: User, name: 'Churn prevention', text: 'Identify at-risk customers and win them back.', timing: 'Runs every morning',
    chat: ['Which regulars have stopped ordering?', 'Twelve regular customers ordered less this month. A draft offer is ready for review.'],
    task: { title: 'Draft win-back offer', subject: '12 regular customers', rows: [['Channel:', 'Email'], ['Offer:', 'Free dessert']] } },
  { id: 'reviews', icon: MessageSquareText, name: 'Review response', text: 'Draft on-brand replies to customer reviews.', timing: 'Runs when a review arrives',
    chat: ['Draft a reply to the 2-star review about cold food.', 'A reply with an apology and a contact option is drafted. It is not posted until a manager approves it.'],
    task: { title: 'Draft review reply', subject: '2-star review · delivery', rows: [['Rating:', '2 of 5'], ['Tone:', 'Apology']] } },
  { id: 'shifts', icon: Users, name: 'Shift optimisation', text: 'Suggest fair and efficient staffing plans.', timing: 'Runs weekly',
    chat: ['Do we need more staff on Friday evening?', 'Sample plan: one extra kitchen shift on Friday 17:00 to 22:00 covers the forecast.'],
    task: { title: 'Suggested shift plan', subject: 'Week 17 · kitchen team', rows: [['Current:', '6 shifts'], ['Proposed:', '7 shifts']] } },
  { id: 'kitchen', icon: ChefHat, name: 'Kitchen coach', text: 'Highlight kitchen performance and coaching tips.', timing: 'Runs at the end of each day',
    chat: ['What slowed the kitchen tonight?', 'Sample summary: oven queue was the longest stage between 19:00 and 20:00.'],
    task: { title: 'Kitchen summary', subject: 'Evening service', rows: [['Average prep:', '14 min'], ['Longest stage:', 'Oven']] } },
  { id: 'pricing', icon: ChartNoAxesColumnIncreasing, name: 'Dynamic pricing', text: 'Suggest menu price changes based on demand.', timing: 'Runs during service',
    chat: ['Should any prices change this weekend?', 'One price change is suggested. Nothing changes until a manager approves it.'],
    task: { title: 'Suggested menu price change', subject: 'Margherita Pizza', rows: [['Current:', '€12.00'], ['Proposed:', '€12.50']] } },
];

/** Board 01 panel 2. */
export function AssistantsSection() {
  const [selected, setSelected] = useState(ASSISTANTS[0].id);
  const assistant = ASSISTANTS.find(item => item.id === selected) ?? ASSISTANTS[0];
  const Icon = assistant.icon;
  return <section id="assistants" className="msite-section" aria-labelledby="site-ai-title">
    <div className="msite-wrap">
      <div className="msite-ai">
        <div>
          <h2 id="site-ai-title" className="msite-h2">AI assistants for every part of your restaurant</h2>
          <p className="msite-lead">Get a dedicated team of AI assistants that work together to save time, reduce costs and improve guest experiences.</p>
          <p className="msite-lead" style={{ fontSize: 14 }}>Assistants read, compute and propose. A manager reviews every proposal before anything changes.</p>
        </div>
        <div>
          <div className="msite-ai-cards" role="group" aria-label="Choose an assistant">
            {ASSISTANTS.map(item => <button key={item.id} type="button" className="msite-ai-card" aria-pressed={item.id === selected} onClick={() => setSelected(item.id)}><item.icon size={28} strokeWidth={1.9} aria-hidden="true" /><b>{item.name}</b><span>{item.text}</span></button>)}
          </div>
        </div>
      </div>
      <div className="msite-ai-detail" aria-live="polite">
        <div className="msite-panel">
          <div className="msite-panel-head"><Icon size={24} strokeWidth={1.9} aria-hidden="true" /><h3>{assistant.name} <small>(chat demo)</small></h3><Chip tone="warning">Demo</Chip></div>
          <p className="msite-timing">{assistant.timing}</p>
          <div className="msite-chat">
            <div className="msite-chat-line" data-from="guest"><p>{assistant.chat[0]}</p><User size={22} aria-hidden="true" /></div>
            <div className="msite-chat-line" data-from="assistant"><MaSoVaBrand /><p>{assistant.chat[1]}</p></div>
          </div>
          <div className="msite-chat-input" aria-hidden="true"><span>Type a message…</span><Send size={18} /></div>
        </div>
        <div className="msite-panel">
          <div className="msite-panel-head"><h3>Tasks for your review</h3><Chip tone="warning">1 pending</Chip></div>
          <div className="msite-task">
            <div className="msite-task-title"><FileText size={24} strokeWidth={1.9} aria-hidden="true" /><div><b>{assistant.task.title}</b><div className="msite-sample">{assistant.task.subject}</div></div></div>
            <dl>{assistant.task.rows.map(([term, value]) => <div key={term} style={{ display: 'contents' }}><dt>{term}</dt><dd>{value}</dd></div>)}</dl>
            <span className="msite-task-status">Awaiting manager review</span>
            <p className="msite-task-note">Illustrative example. Approval happens in the manager console.</p>
          </div>
        </div>
      </div>
      <p className="msite-sample" style={{ textAlign: 'right', marginTop: 12 }}>Concept · sample data</p>
    </div>
  </section>;
}

const CHANNELS = [['Direct', 12], ['Wolt', 8], ['Deliveroo', 6], ['Just Eat', 5], ['Uber Eats', 9]] as const;
const QUEUE_TABS = [['Kitchen queue', 40], ['Preparing', 8], ['In oven', 6], ['Baked', 4], ['Ready', 6], ['Dispatched', 5]] as const;
const QUEUE_ROWS = [
  ['1042', '12:28', 'Wolt', 'Aisha Khan', '1 × Chicken Tikka Masala, 1 × Naan', 'Preparing', '13 min', '€24.50'],
  ['1041', '12:27', 'Direct', 'Marco Rossi', '1 × Margherita Pizza, 1 × Coke', 'In oven', '10 min', '€18.00'],
  ['1040', '12:25', 'Uber Eats', 'Sophie Martin', '1 × Paneer Korma, 1 × Rice', 'Received', '18 min', '€22.90'],
  ['1039', '12:23', 'Just Eat', 'Lukas Weber', '2 × Pepperoni Pizza', 'Ready', '–', '€26.00'],
  ['1038', '12:20', 'Deliveroo', 'Priya Sharma', '1 × Tandoori Chicken, 1 × Naan', 'Baked', '–', '€23.50'],
  ['1036', '12:14', 'Direct', 'Jonas Keller', '1 × Butter Chicken, 1 × Rice', 'Dispatched', '–', '€19.90'],
];
const FLOW = [
  { icon: ShoppingCart, title: 'Customer orders', text: 'Direct / Wolt / Deliveroo / Just Eat / Uber Eats' },
  { icon: CreditCard, title: 'Payment / VAT', text: 'Card or cash. Stripe or Razorpay. VAT calculated.' },
  { icon: ChefHat, title: 'Kitchen', text: 'Received → Preparing → In oven → Baked → Ready' },
  { icon: PackageCheck, title: 'Driver pickup', text: 'Marked Dispatched (not delivered yet)' },
  { icon: Truck, title: 'Out for delivery', text: 'Live tracking. ETA to customer.' },
  { icon: CircleCheck, title: 'Delivery / OTP', text: 'Customer receives with OTP. Delivered → Completed.' },
];
const QUEUE_TONE: Record<string, string> = { Preparing: 'warning', 'In oven': 'amber', Received: 'info', Dispatched: 'info', Ready: 'success', Baked: 'success' };

/** Board 02 panel 1. */
export function ChannelsSection() {
  const [filter, setFilter] = useState<string>(QUEUE_TABS[0][0]);
  const rows = filter === QUEUE_TABS[0][0] ? QUEUE_ROWS : QUEUE_ROWS.filter(row => row[5] === filter);
  return <section id="channels" className="msite-section" aria-labelledby="site-channels-title">
    <div className="msite-wrap">
      <div className="msite-head">
        <div><h2 id="site-channels-title" className="msite-h2">All channels, one kitchen</h2><p className="msite-lead">Wolt, Deliveroo, Just Eat, Uber Eats and direct orders feed a single live queue.</p></div>
        <span className="msite-sample">Concept · sample data</span>
      </div>
      <ul className="msite-channels">
        {CHANNELS.map(([name, orders]) => <li key={name} className="msite-channel"><span className="msite-channel-mark"><ChannelMark channel={name} /></span><div><b>{name}</b><small>{orders} orders</small></div><i aria-hidden="true" /><span className="msite-hidden">Connected</span></li>)}
      </ul>
      <div className="msite-panel msite-queue">
        <div className="msite-queue-tabs" role="tablist" aria-label="Kitchen queue stage" onKeyDown={moveTabFocus}>
          {QUEUE_TABS.map(([label, count], index) => <button key={label} type="button" role="tab" id={'queue-tab-' + index} aria-controls="queue-panel" aria-selected={filter === label} tabIndex={filter === label ? 0 : -1} onClick={() => setFilter(label)}>{label}<span className="msite-num">{count}</span></button>)}
        </div>
        <div id="queue-panel" className="msite-queue-scroll" role="tabpanel" aria-label={filter + ' sample orders'}>
          {rows.length === 0 ? <p className="msite-empty">No sample orders in this stage.</p> : <table className="msite-tbl msite-num">
            <thead><tr>{['#', 'Time', 'Channel', 'Customer', 'Items', 'Status', 'ETA', 'Total'].map(head => <th key={head} scope="col">{head}</th>)}</tr></thead>
            <tbody>{rows.map(([id, time, channel, customer, items, status, eta, total]) => <tr key={id}><td>{id}</td><td>{time}</td><td><span className="msite-channel-cell"><ChannelMark channel={channel} size={16} />{channel}</span></td><td>{customer}</td><td>{items}</td><td><span className="msite-status" data-tone={QUEUE_TONE[status]}>{status}</span></td><td>{eta}</td><td>{total}</td></tr>)}</tbody>
          </table>}
        </div>
      </div>
      <h3 className="msite-h3">From order to delivery</h3>
      <ol className="msite-flow">{FLOW.map(({ icon: Icon, title, text }) => <li key={title}><Icon size={26} strokeWidth={1.9} aria-hidden="true" /><b>{title}</b><span>{text}</span></li>)}</ol>
    </div>
  </section>;
}

type Role = keyof typeof ROLE_PHONES;
const ROLES: { id: Role; label: string; title: string; text: string }[] = [
  { id: 'customer', label: 'Customer app', title: 'Customer app', text: 'Browse menu, order and track delivery with OTP.' },
  { id: 'kitchen', label: 'Kitchen', title: 'Kitchen app', text: 'Live order queue and simple controls for the team.' },
  { id: 'driver', label: 'Driver', title: 'Driver app', text: 'See pickups, navigate and update delivery status.' },
  { id: 'cashier', label: 'Cashier', title: 'Cashier app', text: 'Take counter orders and record cash or card payments.' },
  { id: 'manager', label: 'Manager', title: 'Manager app', text: 'Real-time overview of orders, performance and alerts.' },
];

/** Board 02 panel 2. */
export function MobileAppsSection() {
  const [role, setRole] = useState<Role>('customer');
  // Four phones fit the row; the cashier preview takes the manager slot when selected.
  const visible = ROLES.filter(item => item.id !== (role === 'cashier' ? 'manager' : 'cashier'));
  return <section id="mobile" className="msite-section msite-section-alt" aria-labelledby="site-mobile-title">
    <div className="msite-wrap">
      <div className="msite-head">
        <div><h2 id="site-mobile-title" className="msite-h2">One platform, every role</h2><p className="msite-lead">Customers order with ease. Your team gets the right tools for every job.</p></div>
        <div className="msite-roles" role="group" aria-label="Choose a role">
          {ROLES.map(item => <button key={item.id} type="button" aria-pressed={item.id === role} onClick={() => setRole(item.id)}>{item.label}</button>)}
        </div>
      </div>
      <div className="msite-phones">
        {visible.map(item => {
          const Phone = ROLE_PHONES[item.id];
          return <figure key={item.id} data-dim={item.id !== role} aria-current={item.id === role || undefined}>
            <FitPreview width={260} height={500} label={`Illustrative ${item.title} screen with sample data`}><Phone /></FitPreview>
            <figcaption><b>{item.title}</b><span>{item.text}</span></figcaption>
          </figure>;
        })}
      </div>
      <p className="msite-sample" style={{ textAlign: 'right', marginTop: 16 }}>Concept · sample data</p>
    </div>
  </section>;
}

const OPERATIONS = [
  { icon: Box, title: 'Inventory', text: 'Track stock, get low stock alerts and draft purchase orders.', link: 'Open inventory', href: '/manager/inventory', photo: '/images/menu/caprese-salad.jpg' },
  { icon: Users, title: 'Staff', text: 'Build shifts, track hours and review suggested staffing plans.', link: 'Open staff', href: '/manager/staff', art: ['Shift plan', 'Mon to Sun'] },
  { icon: Gift, title: 'Loyalty', text: 'Bring customers back with simple loyalty tools.', link: 'Open loyalty', href: '/manager/customers', photo: '/images/menu/north-indian-thali.jpg' },
  { icon: CreditCard, title: 'Payments', text: 'Accept card and cash with Stripe or Razorpay.', link: 'Open payments', href: '/manager/payments', art: ['Stripe', 'Razorpay'] },
  { icon: ShieldCheck, title: 'GDPR', text: 'Manage customer data and privacy preferences.', link: 'Open GDPR', href: '/manager/customers', art: ['Consent', 'Export · Erasure'] },
  { icon: MapPin, title: 'Delivery zones', text: 'Set server-priced zones and delivery fees.', link: 'Open delivery zones', href: '/manager/deliveries', art: ['Zone 2', '3–6 km'] },
  { icon: Wrench, title: 'Equipment', text: 'Track equipment, set reminders and log maintenance.', link: 'Open equipment', href: '/manager/equipment-monitoring', art: ['Oven 1', 'Maintenance log'] },
];
const OPS_ASSISTANTS: [string, typeof Box][] = [['Manager Copilot', UserCheck], ['Demand forecast', BarChart3], ['Inventory reorder', Package], ['Churn prevention', User], ['Review response', MessageSquare], ['Shift optimisation', Users], ['Kitchen coach', ChefHat], ['Dynamic pricing', BarChart3], ['Support chat', MessageSquareText]];

/** Board 02 panel 3. */
export function OperationsSection() {
  return <section id="operations" className="msite-section" aria-labelledby="site-ops-title">
    <div className="msite-wrap">
      <div className="msite-head">
        <div><h2 id="site-ops-title" className="msite-h2">Everything you need to run your restaurant</h2><p className="msite-lead">Integrated tools for daily operations, supported by AI assistants.</p></div>
        <span className="msite-sample">Manager sign-in required to open a tool</span>
      </div>
      <div className="msite-ops">
        {OPERATIONS.map(({ icon: Icon, title, text, link, href, photo, art }) => <article key={title} className="msite-op">
          <Icon size={30} strokeWidth={1.9} aria-hidden="true" />
          <div><h3>{title}</h3><p>{text}</p><a className="msite-link" href={href}>{link}<ArrowRight size={16} aria-hidden="true" /></a></div>
          <div className="msite-op-art" data-photo={!!photo} aria-hidden="true">{photo ? <img src={photo} alt="" loading="lazy" /> : title === 'Payments' ? <div className="msite-op-providers"><span><ProviderMark provider="stripe" />Stripe</span><span><ProviderMark provider="razorpay" />Razorpay</span></div> : <div><b>{art?.[0]}</b>{art?.[1]}</div>}</div>
        </article>)}
        <article className="msite-op msite-op-ai">
          <h3>AI assistants for operations</h3>
          <p>Specialised assistants read your data, compute options and propose actions for manager approval.</p>
          <ul>{OPS_ASSISTANTS.map(([name, Icon]) => <li key={name}><Icon size={20} strokeWidth={1.9} aria-hidden="true" />{name}</li>)}</ul>
        </article>
      </div>
    </div>
  </section>;
}

const STEPS = [
  ['Create your account', 'Tell us about your restaurant and location.'],
  ['Set up your menu', 'Add dishes, prices, VAT and allergens (14 EU allergens).'],
  ['Connect channels', 'Link Wolt, Deliveroo, Just Eat, Uber Eats and direct ordering.'],
  ['Configure delivery', 'Set your zones and fees. Enable Stripe or Razorpay.'],
  ['Go live', 'Test orders, train your team and start taking orders.'],
];
const SITE_FAQS = [
  { topic: 'Assistants', q: 'What does manager approval mean?', a: 'AI assistants can read your data, compute options and propose draft changes, for example prices, refunds, purchase orders, campaigns or staffing updates. A manager must review and approve each proposal before it is executed. Approval is separate from final execution, and does not mean a supplier or campaign has been sent.' },
  { topic: 'Channels', q: 'Which delivery platforms are supported?', a: 'Orders from Wolt, Deliveroo, Just Eat and Uber Eats join the same kitchen queue as your direct website and app orders.' },
  { topic: 'Payments', q: 'Which payment gateways do you use?', a: 'Stripe handles card payments for European stores and Razorpay handles payments for Indian stores. Cash can be recorded at the counter.' },
  { topic: 'Locations', q: 'Can I run multiple locations?', a: 'Yes. Each location has its own menu, currency, delivery zones and staff, and managers can switch between locations in one console.' },
  { topic: 'Payments', q: 'How is VAT handled?', a: 'VAT is calculated per country, order type and item category when the order is created, and shown to the customer and on the order record.' },
  { topic: 'Data', q: 'Is my customer data secure?', a: 'MaSoVa includes consent records, data export and erasure requests. See the Privacy Policy for how data is processed.' },
];
const TOPICS = ['All topics', ...Array.from(new Set(SITE_FAQS.map(item => item.topic)))];

/** Board 02 panel 4. */
export function GettingStartedSection() {
  const [topic, setTopic] = useState(TOPICS[0]);
  const [open, setOpen] = useState(SITE_FAQS[0].q);
  const list = topic === TOPICS[0] ? SITE_FAQS : SITE_FAQS.filter(item => item.topic === topic);
  const current = list.find(item => item.q === open) ?? list[0];
  return <section id="getting-started" className="msite-section msite-section-alt" aria-labelledby="site-start-title">
    <div className="msite-wrap">
      <h2 id="site-start-title" className="msite-h2">Get started with MaSoVa</h2>
      <p className="msite-lead" style={{ marginBottom: 32 }}>A simple path from sign up to your first orders.</p>
      <ol className="msite-steps">{STEPS.map(([title, text]) => <li key={title}><b>{title}</b><span>{text}</span></li>)}</ol>
      <div className="msite-steps-actions">
        <button type="button" className="msite-btn msite-btn-primary" onClick={() => openContactForm()}>Book a walkthrough<ArrowRight size={18} aria-hidden="true" /></button>
        <a className="msite-link" href={SIGN_IN_PATH} style={{ textDecoration: 'underline' }}>Sign in to your account<ArrowRight size={16} aria-hidden="true" /></a>
      </div>
      <div id="faq" className="msite-faq-head" style={{ scrollMarginTop: 96 }}>
        <h3>Frequently asked questions</h3>
        <select className="msite-select" aria-label="Filter questions by topic" value={topic} onChange={event => setTopic(event.target.value)}>{TOPICS.map(item => <option key={item}>{item}</option>)}</select>
      </div>
      <div className="msite-faq">
        <div className="msite-panel msite-faq-open" aria-live="polite">
          <h4><HelpCircle size={20} strokeWidth={1.9} aria-hidden="true" />{current.q}<ChevronUp size={18} aria-hidden="true" style={{ marginLeft: 'auto' }} /></h4>
          <p>{current.a}</p>
        </div>
        <ul className="msite-panel msite-faq-list">
          {list.filter(item => item.q !== current.q).map(item => <li key={item.q}><button type="button" onClick={() => setOpen(item.q)}><ChevronRight size={16} aria-hidden="true" />{item.q}</button></li>)}
        </ul>
      </div>
    </div>
  </section>;
}

const WALK_POINTS = [
  { icon: Monitor, title: 'Personalised demo', text: 'See MaSoVa configured for your restaurant type.' },
  { icon: Settings, title: 'Real use cases', text: 'We show ordering, kitchen, delivery, payments and AI assistants in action.' },
  { icon: Users, title: 'No obligation', text: 'Just a friendly product walkthrough.' },
];

/** Board 01 panel 4. */
export function WalkthroughSection() {
  useEffect(() => {
    const onOpen = () => {
      const section = document.getElementById('contact');
      const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
      section?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
      window.setTimeout(() => document.getElementById('fullName')?.focus({ preventScroll: true }), reduce ? 0 : 400);
    };
    window.addEventListener(OPEN_CONTACT_EVENT, onOpen);
    return () => window.removeEventListener(OPEN_CONTACT_EVENT, onOpen);
  }, []);

  return <section id="contact" className="msite-section" aria-labelledby="site-walk-title">
    <div className="msite-wrap msite-walk">
      <div>
        <h2 id="site-walk-title" className="msite-h2">Book a walkthrough and see MaSoVa in action</h2>
        <p className="msite-lead">Get a personalised demo of MaSoVa and see how it can work for your restaurant.</p>
        <ul className="msite-walk-points">{WALK_POINTS.map(({ icon: Icon, title, text }) => <li key={title}><Icon size={30} strokeWidth={1.9} aria-hidden="true" /><div><b>{title}</b><span>{text}</span></div></li>)}</ul>
      </div>
      <div className="msite-panel" style={{ padding: 28 }}><DemoRequestForm /></div>
    </div>
  </section>;
}
