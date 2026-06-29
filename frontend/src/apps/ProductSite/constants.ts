import type { ComponentType, CSSProperties } from 'react'
import { goldGradientText } from './tokens'
import {
  ShoppingCart, ChefHat, Truck, BarChart3, Bot, Store,
  Shield, Globe, Zap, Users, Package, Leaf, Star,
  CheckCircle2, Clock, MapPin, Bell, CreditCard,
  TrendingUp, AlertCircle, Cpu, Receipt,
  Building2, Layers, Lock, HeartHandshake, Phone,
  LayoutDashboard, Utensils, Navigation, PieChart, Sparkles,
  Smartphone,
} from 'lucide-react'

export { goldGradientText as GOLD_GRADIENT_TEXT }

interface Feature {
  icon: ComponentType<{ size?: number; style?: CSSProperties }>
  title: string
  desc: string
  size: 'large' | 'small'
  screenshot: string | null
}

export const SITE_URL = 'https://masova.souravamseekar.com'
export const GITHUB_URL = 'https://github.com/SVamseekar/masova-platform'

export const NAV_LINKS = [
  { label: 'How it works', href: '#agent-brain' },
  { label: 'See it live', href: '#demo' },
  { label: 'Capabilities', href: '#product-tour' },
  { label: 'Apps', href: '#mobile' },
  { label: 'Pricing', href: '#pricing' },
]

export const STATS = [
  { value: '8', label: 'Smart assistants', icon: Bot },
  { value: '1', label: 'Dashboard for all locations', icon: Layers },
  { value: '24/7', label: 'Customer chat', icon: Clock },
  { value: 'You', label: 'Approve every change', icon: Shield },
]

export const MARQUEE_ITEMS = [
  { label: '24/7 customer chat — your staff stay on the floor', icon: Bot },
  { label: 'Tomorrow\'s busy hours forecasted overnight', icon: TrendingUp },
  { label: 'Low-stock alerts before you run out', icon: Package },
  { label: 'Win back regulars before they drift away', icon: HeartHandshake },
  { label: 'Review replies drafted — you send them', icon: Star },
  { label: 'Next week\'s shifts suggested every Sunday', icon: Users },
  { label: 'Nothing goes live without manager approval', icon: Shield },
  { label: 'Wolt · Deliveroo · Uber Eats in one place', icon: Store },
  { label: 'Orders from app to kitchen in seconds', icon: Zap },
  { label: 'One view across every location', icon: Cpu },
]

export const AGGREGATOR_CHANNELS = [
  { id: 'MASOVA', label: 'Direct', color: '#D4AF37' },
  { id: 'WOLT', label: 'Wolt', color: '#00C2E8' },
  { id: 'DELIVEROO', label: 'Deliveroo', color: '#00CCBC' },
  { id: 'JUST_EAT', label: 'Just Eat', color: '#FF8000' },
  { id: 'UBER_EATS', label: 'Uber Eats', color: '#06C167' },
]

export const MOBILE_APPS = [
  {
    name: 'Customer app',
    tagline: 'Your customers order, track delivery, and get help — without calling the restaurant.',
    accentColor: '#D4AF37',
    highlights: ['Live map tracking', 'Card & wallet payments', 'In-app chat support', 'Guest checkout'],
  },
  {
    name: 'Staff app',
    tagline: 'Kitchen, drivers, cashiers, and managers — each sees exactly what they need.',
    accentColor: '#D4AF37',
    roles: [
      { label: 'Driver', color: '#00B14F' },
      { label: 'Kitchen', color: '#FF6B35' },
      { label: 'Cashier', color: '#2196F3' },
      { label: 'Manager', color: '#7B1FA2' },
    ],
    highlights: ['Kitchen display on tablet', 'Delivery proof codes', 'Works offline'],
  },
]

export const PAIN_POINTS = [
  {
    icon: AlertCircle,
    title: 'Orders lost between systems',
    desc: 'Paper tickets, WhatsApp messages, phone calls — orders fall through the cracks every shift.',
  },
  {
    icon: Clock,
    title: 'No live kitchen visibility',
    desc: 'Managers walk to the kitchen to check order status. Customers call to ask where their food is.',
  },
  {
    icon: BarChart3,
    title: 'Flying blind on analytics',
    desc: 'You know last week was good. But which items drove it? Which store underperformed? Nobody knows.',
  },
]

export interface ProductTourTab {
  id: string
  label: string
  icon: ComponentType<{ size?: number; style?: CSSProperties }>
  headline: string
  desc: string
  image: string
  screenshot: string | null
  accentColor: string
  featureDesc: string
  bullets: string[]
}

export const PRODUCT_TOUR_TABS: ProductTourTab[] = [
  {
    id: 'orders',
    label: 'Online Ordering',
    icon: ShoppingCart,
    headline: 'Orders flow in. Zero friction.',
    desc: 'Customers order from your branded web app or mobile app. Orders land instantly on the kitchen display — no calls, no paper, no chaos.',
    image: '/screenshots/customer-ordering.png',
    screenshot: '/screenshots/customer-ordering.png',
    accentColor: '#3B82F6',
    featureDesc: 'From browsing to checkout in under a minute. Orders land on the KDS the moment payment clears.',
    bullets: ['Branded customer app', 'Real-time order confirmation', 'SMS + push notifications', 'Guest checkout'],
  },
  {
    id: 'kitchen',
    label: 'Kitchen Display',
    icon: ChefHat,
    headline: 'Your kitchen, fully in control.',
    desc: 'Every order appears on the Kitchen Display System the moment it is placed. Colour-coded urgency, prep time tracking, quality checkpoints.',
    image: '/screenshots/kitchen-display.png',
    screenshot: null,
    accentColor: '#F59E0B',
    featureDesc: 'Live order queue on any screen. No printers, no paper, no missed tickets.',
    bullets: ['9-stage order pipeline', 'Prep time analytics', 'Quality checkpoints', 'Make-table workflow'],
  },
  {
    id: 'delivery',
    label: 'Delivery',
    icon: Truck,
    headline: 'Dispatched in under 8 seconds.',
    desc: 'MaSoVa auto-assigns the nearest available driver the moment an order is ready. Customers track their delivery live on a map.',
    image: '/screenshots/live-tracking.png',
    screenshot: null,
    accentColor: '#10B981',
    featureDesc: 'From dispatch to doorstep. Real-time tracking for operators and customers.',
    bullets: ['Auto-dispatch engine', 'Live GPS tracking', 'Driver app (iOS + Android)', 'Proof of delivery'],
  },
  {
    id: 'analytics',
    label: 'Analytics',
    icon: BarChart3,
    headline: 'Every number that matters.',
    desc: 'Sales trends, peak hour analysis, staff leaderboards, waste tracking, demand forecasting — all in one dashboard updated in real time.',
    image: '/screenshots/manager-dashboard.png',
    screenshot: null,
    accentColor: '#8B5CF6',
    featureDesc: 'Revenue, waste, staff performance — surfaced automatically, no dashboards to build.',
    bullets: ['Sales forecasting', 'Staff performance', 'Waste analysis', 'Multi-store benchmarking'],
  },
  {
    id: 'ai',
    label: 'Smart assistants',
    icon: Bot,
    headline: 'Help that never clocks off.',
    desc: 'Eight assistants handle customer questions, flag slow prep times, suggest reorders, and surface what matters — while you stay in control of every decision.',
    image: '/screenshots/ai-agent.png',
    screenshot: null,
    accentColor: '#D4AF37',
    featureDesc: 'Less firefighting. More time leading your team.',
    bullets: ['24/7 customer chat', 'Demand & prep insights', 'Stock alerts before shortages', 'Shift suggestions you approve'],
  },
]

export const FEATURES: Feature[] = [
  {
    icon: LayoutDashboard,
    title: 'Unified Manager Dashboard',
    desc: '6 sections covering every aspect of your operation — orders, inventory, staff, analytics, marketing, and delivery — in one place.',
    size: 'large',
    screenshot: '/screenshots/customer-home.png',
  },
  {
    icon: Utensils,
    title: 'POS + Kiosk',
    desc: 'Full POS system with PIN auth for staff. Self-service kiosk mode for walk-in customers.',
    size: 'small',
    screenshot: null,
  },
  {
    icon: Package,
    title: 'Inventory & Suppliers',
    desc: 'Track stock levels, raise purchase orders, manage suppliers, and analyse waste — all automated.',
    size: 'small',
    screenshot: null,
  },
  {
    icon: Users,
    title: 'Staff & Shift Management',
    desc: 'Schedule shifts, track working sessions, monitor performance, and build leaderboards.',
    size: 'large',
    screenshot: '/screenshots/customer-ordering.png',
  },
  {
    icon: Star,
    title: 'Loyalty & Reviews',
    desc: 'Built-in loyalty tiers (Bronze → Platinum), review management, and sentiment analysis.',
    size: 'small',
    screenshot: null,
  },
  {
    icon: Shield,
    title: 'GDPR Compliant',
    desc: 'Full GDPR toolkit — consent management, data export, right to erasure, breach logging.',
    size: 'small',
    screenshot: null,
  },
  {
    icon: MapPin,
    title: 'Store Selection Engine',
    desc: 'Distance-aware store routing assigns every order to the nearest location with capacity — no manual zones.',
    size: 'small',
    screenshot: null,
  },
  {
    icon: Smartphone,
    title: 'Android Driver App',
    desc: 'Native Android app for delivery drivers. Turn-by-turn navigation, live order updates, earnings dashboard.',
    size: 'small',
    screenshot: '/screenshots/customer-menu.png',
  },
]

export type AgentIconKey =
  | 'MessageCircle'
  | 'TrendingUp'
  | 'Sparkles'
  | 'Package'
  | 'ChefHat'
  | 'HeartHandshake'
  | 'Star'
  | 'Users'

export const AI_AGENTS = [
  {
    lucideIcon: 'MessageCircle' as const,
    name: 'Customer chat',
    role: 'Always on',
    description: 'Answers order status, menu questions, and refund requests in your app — so your team isn\'t glued to the phone.',
    color: '#3B82F6',
  },
  {
    lucideIcon: 'TrendingUp' as const,
    name: 'Demand planner',
    role: 'Every night',
    description: 'Spots which dishes and hours will be busy tomorrow, so prep and staffing aren\'t guesswork.',
    color: '#8B5CF6',
  },
  {
    lucideIcon: 'Sparkles' as const,
    name: 'Peak-hour pricing',
    role: 'During service',
    description: 'Suggests small menu price tweaks when demand spikes. You approve before anything goes live.',
    color: '#D4AF37',
  },
  {
    lucideIcon: 'Package' as const,
    name: 'Stock watch',
    role: 'Throughout the day',
    description: 'Warns you before ingredients run out and drafts reorder lists for your sign-off.',
    color: '#10B981',
  },
  {
    lucideIcon: 'ChefHat' as const,
    name: 'Kitchen insights',
    role: 'End of day',
    description: 'Summarises what slowed the line today and what to fix before the next rush.',
    color: '#F59E0B',
  },
  {
    lucideIcon: 'HeartHandshake' as const,
    name: 'Loyalty keeper',
    role: 'Every morning',
    description: 'Notices regulars who haven\'t ordered lately and drafts a personal offer — you choose whether to send it.',
    color: '#EC4899',
  },
  {
    lucideIcon: 'Star' as const,
    name: 'Review helper',
    role: 'When reviews arrive',
    description: 'Drafts thoughtful replies to low ratings. Nothing is posted until a manager approves it.',
    color: '#F97316',
  },
  {
    lucideIcon: 'Users' as const,
    name: 'Shift planner',
    role: 'Weekly',
    description: 'Proposes next week\'s rota based on forecasted footfall. Adjust and publish when you\'re happy.',
    color: '#2196F3',
  },
]

export const AGENT_LIVE_FEED: string[][] = [
  ['Customer asked where order #2041 is — on the way, 8 min ETA', 'Tracking link sent automatically', 'Your manager was notified — no action needed'],
  ['Amsterdam Central: butter chicken likely +34% this Saturday 6–9pm', 'Prep suggestion ready for head chef', 'Waiting for your approval'],
  ['Friday dinner rush building — small price tweak suggested on bestsellers', 'You can approve or ignore in one tap', 'Nothing changes until you say so'],
  ['Mozzarella may run out in 2 days at Milano Central', 'Draft order prepared for Milano Dairy · 12kg', 'Review and send when ready'],
  ['Tikka masala prep ran 18% slower than usual tonight', 'Oven bottleneck flagged for tomorrow\'s brief', 'Morning summary queued for kitchen lead'],
  ['12 valued regulars ordered less this month', 'Personal 15% offers drafted', '3 waiting for your go-ahead'],
  ['2-star review: "cold delivery"', 'Apology and refund option drafted', 'Manager notified — reply not sent yet'],
  ['Busier Thu–Sun expected — +2 kitchen staff suggested Friday eve', 'Draft schedule ready for next week', 'Shift plan awaiting approval'],
]

export const AGENT_STORY_STEPS = [
  {
    time: '2:00 AM',
    agent: 'Demand planner',
    iconKey: 'TrendingUp' as AgentIconKey,
    color: '#8B5CF6',
    headline: 'While you sleep, tomorrow gets planned',
    body: 'Every location gets a forecast — which dishes spike on Friday, which hours need extra hands in the kitchen.',
    action: 'Prep notes ready for your morning',
  },
  {
    time: '10:00 AM',
    agent: 'Loyalty keeper',
    iconKey: 'HeartHandshake' as AgentIconKey,
    color: '#EC4899',
    headline: 'Regulars who drift away get noticed early',
    body: 'A dozen loyal customers ordered less this month. Personal offers are drafted — never blasted without your OK.',
    action: '3 offers waiting for your tap',
  },
  {
    time: '2:30 PM',
    agent: 'Customer chat',
    iconKey: 'MessageCircle' as AgentIconKey,
    color: '#3B82F6',
    headline: 'Customers get answers. Your team stays on the floor.',
    body: 'Order tracking, allergens, refunds — handled in the app so servers aren\'t running to the phone.',
    action: '847 helpful chats this week',
  },
  {
    time: '6:00 PM',
    agent: 'Peak-hour pricing',
    iconKey: 'Sparkles' as AgentIconKey,
    color: '#D4AF37',
    headline: 'Busy hour? You get a heads-up, not a surprise.',
    body: 'When demand jumps, MaSoVa suggests a small menu tweak. You approve or dismiss in one click.',
    action: 'You stay in control',
  },
  {
    time: '11:00 PM',
    agent: 'Kitchen insights',
    iconKey: 'ChefHat' as AgentIconKey,
    color: '#F59E0B',
    headline: 'The kitchen gets a clear morning brief',
    body: 'Prep times, bottlenecks, and equipment flags from tonight — turned into notes your team can act on.',
    action: 'Delivered before the lunch rush',
  },
]


export const PRICING_TIERS = [
  {
    name: 'Starter',
    price: 149,
    period: 'month',
    tagline: 'Perfect for single-location restaurants',
    highlight: false,
    badge: undefined as string | undefined,
    features: [
      { icon: ShoppingCart, text: 'Online ordering (web + mobile)', included: true },
      { icon: Cpu, text: 'POS system with PIN auth', included: true },
      { icon: ChefHat, text: 'Kitchen Display System (KDS)', included: true },
      { icon: Utensils, text: 'Menu management', included: true },
      { icon: BarChart3, text: 'Basic order analytics', included: true },
      { icon: Star, text: 'Customer loyalty points', included: true },
      { icon: Bell, text: 'Email + SMS notifications', included: true },
      { icon: Truck, text: 'Delivery management (1 zone)', included: true },
      { icon: Shield, text: 'GDPR compliance tools', included: true },
      { icon: Building2, text: '1 location', included: true },
      { icon: Users, text: 'Up to 10 staff accounts', included: true },
      { icon: Bot, text: 'Smart assistants', included: false },
      { icon: TrendingUp, text: 'Advanced analytics + BI', included: false },
      { icon: Globe, text: 'Custom branding', included: false },
    ],
    cta: 'Start free trial',
  },
  {
    name: 'Growth',
    price: 349,
    period: 'month',
    tagline: 'For restaurants scaling across locations',
    highlight: true,
    badge: 'Most Popular' as string | undefined,
    features: [
      { icon: ShoppingCart, text: 'Everything in Starter', included: true },
      { icon: Bot, text: '24/7 customer chat assistant', included: true },
      { icon: Sparkles, text: 'Manager insights — ask in plain English', included: true },
      { icon: TrendingUp, text: 'Advanced analytics + BI dashboard', included: true },
      { icon: PieChart, text: 'Sales forecasting + demand prediction', included: true },
      { icon: Store, text: 'Multi-store management (up to 3)', included: true },
      { icon: Truck, text: 'Driver app + auto-dispatch', included: true },
      { icon: Navigation, text: 'Live GPS delivery tracking', included: true },
      { icon: Package, text: 'Inventory + purchase orders', included: true },
      { icon: Leaf, text: 'Waste tracking + analysis', included: true },
      { icon: HeartHandshake, text: 'Supplier management', included: true },
      { icon: Users, text: 'Up to 50 staff accounts', included: true },
      { icon: Globe, text: 'Custom branding (logo + colours)', included: true },
      { icon: Phone, text: 'Priority support (chat, 12h SLA)', included: true },
    ],
    cta: 'Start free trial',
  },
  {
    name: 'Enterprise',
    price: null as number | null,
    period: null as string | null,
    tagline: 'For chains and franchises across Europe',
    highlight: false,
    badge: undefined as string | undefined,
    features: [
      { icon: Sparkles, text: 'Everything in Growth', included: true },
      { icon: Bot, text: 'Kitchen & delivery assistants', included: true },
      { icon: Truck, text: 'Smarter dispatch across busy runs', included: true },
      { icon: Building2, text: 'Unlimited locations', included: true },
      { icon: Users, text: 'Unlimited staff accounts', included: true },
      { icon: Lock, text: 'White-label (your brand)', included: true },
      { icon: CreditCard, text: 'Multi-currency (EUR, GBP, SEK, DKK)', included: true },
      { icon: Globe, text: 'Multi-language (EN, DE, NL, FR)', included: true },
      { icon: Receipt, text: 'Custom integrations (ERP, accounting)', included: true },
      { icon: Shield, text: 'EU data residency choice', included: true },
      { icon: Zap, text: '99.9% uptime SLA', included: true },
      { icon: Phone, text: '24/7 phone support', included: true },
      { icon: HeartHandshake, text: 'Dedicated account manager', included: true },
      { icon: Star, text: 'Onboarding + staff training', included: true },
    ],
    cta: 'Contact sales',
  },
]

export const FAQS = [
  {
    q: 'How long does setup take?',
    a: 'Most restaurants are live within 48 hours. We handle onboarding, menu import, and staff training. Enterprise customers get a dedicated onboarding specialist.',
  },
  {
    q: 'Do I need new hardware?',
    a: 'MaSoVa runs on any modern tablet or screen. No proprietary hardware required. The KDS runs on any wall-mounted screen, and drivers use their own smartphones.',
  },
  {
    q: 'Is MaSoVa GDPR compliant?',
    a: 'Yes — fully. MaSoVa includes consent management, data export (Article 15), right to erasure (Article 17), breach logging, and data residency options for EU customers.',
  },
  {
    q: 'Which payment methods does MaSoVa support?',
    a: 'MaSoVa supports card payments, iDEAL (Netherlands), Bancontact (Belgium), SEPA Direct Debit, Apple Pay, and Google Pay — all via Stripe.',
  },
  {
    q: 'Can I use MaSoVa if I already have a POS system?',
    a: 'Enterprise plans support custom integrations. For Starter and Growth, MaSoVa replaces your existing POS, KDS, and delivery management in one unified system.',
  },
  {
    q: 'What happens if I need more than 3 locations on Growth?',
    a: 'You can add extra locations at €99/location/month on Growth, or upgrade to Enterprise for unlimited locations with a custom price.',
  },
]


export const TESTIMONIALS = [
  {
    quote: 'Before MaSoVa, we were managing orders on WhatsApp. Now every order flows from app to kitchen to driver without us touching it. Our delivery time dropped by 40%.',
    name: 'Marco de Vries',
    role: 'Owner',
    restaurant: 'Spice Garden Amsterdam',
    avatar: 'M',
  },
  {
    quote: 'The manager dashboard alone is worth the subscription. I check sales, waste, and staff performance from my phone every morning. I used to need a full hour with spreadsheets.',
    name: 'Sophie Müller',
    role: 'Operations Manager',
    restaurant: 'Bella Cucina Berlin (3 locations)',
    avatar: 'S',
  },
  {
    quote: "The chat assistant handles most customer questions on its own. Refunds, order status, menu questions — my team barely touches the phone anymore. It's remarkable.",
    name: "Liam O'Brien",
    role: 'Founder',
    restaurant: 'The Dublin Kitchen',
    avatar: 'L',
  },
]
