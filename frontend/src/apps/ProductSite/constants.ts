import type { CSSProperties } from 'react'
import {
  ShoppingCart, ChefHat, Truck, BarChart3, Bot, Store,
  Shield, Globe, Zap, Users, Package, Leaf, Star,
  CheckCircle2, Clock, MapPin, Bell, CreditCard,
  TrendingUp, AlertCircle, Cpu, MessageSquare, Receipt,
  Building2, Layers, Lock, HeartHandshake, Phone,
  LayoutDashboard, Utensils, Navigation, PieChart, Sparkles,
} from 'lucide-react'

export const NAV_LINKS = [
  { label: 'About', href: '#about' },
  { label: 'Features', href: '#features' },
  { label: 'AI Agents', href: '#ai-agents' },
  { label: 'Pricing', href: '#pricing' },
  { label: 'FAQ', href: '#faq' },
  { label: 'API Reference', href: '/api-docs' },
]

export const STATS = [
  { value: '6', label: 'Integrated Apps', icon: Layers },
  { value: '9', label: 'Order Stages', icon: CheckCircle2 },
  { value: '< 8s', label: 'Dispatch Time', icon: Zap },
  { value: '100%', label: 'GDPR Compliant', icon: Shield },
]

export const MARQUEE_ITEMS = [
  { label: 'Multi-store operations', icon: Store },
  { label: 'Real-time kitchen display', icon: ChefHat },
  { label: 'AI-powered agents', icon: Bot },
  { label: 'Live delivery tracking', icon: Navigation },
  { label: 'GDPR compliant', icon: Shield },
  { label: 'EU-ready payments', icon: CreditCard },
  { label: 'Predictive analytics', icon: TrendingUp },
  { label: 'Waste analysis', icon: Leaf },
  { label: 'Driver auto-dispatch', icon: Truck },
  { label: 'Loyalty programs', icon: Star },
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

export const PRODUCT_TOUR_TABS = [
  {
    id: 'orders',
    label: 'Online Ordering',
    icon: ShoppingCart,
    headline: 'Orders flow in. Zero friction.',
    desc: 'Customers order from your branded web app or mobile app. Orders land instantly on the kitchen display — no calls, no paper, no chaos.',
    image: '/screenshots/customer-ordering.png',
    bullets: ['Branded customer app', 'Real-time order confirmation', 'SMS + push notifications', 'Guest checkout'],
  },
  {
    id: 'kitchen',
    label: 'Kitchen Display',
    icon: ChefHat,
    headline: 'Your kitchen, fully in control.',
    desc: 'Every order appears on the Kitchen Display System the moment it is placed. Colour-coded urgency, prep time tracking, quality checkpoints.',
    image: '/screenshots/kitchen-display.png',
    bullets: ['9-stage order pipeline', 'Prep time analytics', 'Quality checkpoints', 'Make-table workflow'],
  },
  {
    id: 'delivery',
    label: 'Delivery',
    icon: Truck,
    headline: 'Dispatched in under 8 seconds.',
    desc: 'MaSoVa auto-assigns the nearest available driver the moment an order is ready. Customers track their delivery live on a map.',
    image: '/screenshots/live-tracking.png',
    bullets: ['Auto-dispatch engine', 'Live GPS tracking', 'Driver app (iOS + Android)', 'Proof of delivery'],
  },
  {
    id: 'analytics',
    label: 'Analytics',
    icon: BarChart3,
    headline: 'Every number that matters.',
    desc: 'Sales trends, peak hour analysis, staff leaderboards, waste tracking, demand forecasting — all in one dashboard updated in real time.',
    image: '/screenshots/manager-dashboard.png',
    bullets: ['Sales forecasting', 'Staff performance', 'Waste analysis', 'Multi-store benchmarking'],
  },
  {
    id: 'ai',
    label: 'AI Agents',
    icon: Bot,
    headline: 'Your restaurant runs itself.',
    desc: 'Three AI agents work 24/7 — handling customer queries, monitoring the kitchen, and alerting managers before problems happen.',
    image: '/screenshots/ai-agent.png',
    bullets: ['Customer support agent', 'Kitchen monitor agent', 'Manager insights agent'],
  },
]

export const FEATURES = [
  {
    icon: LayoutDashboard,
    title: 'Unified Manager Dashboard',
    desc: '6 sections covering every aspect of your operation — orders, inventory, staff, analytics, marketing, and delivery — in one place.',
    size: 'large',
  },
  {
    icon: Utensils,
    title: 'POS + Kiosk',
    desc: 'Full POS system with PIN auth for staff. Self-service kiosk mode for walk-in customers.',
    size: 'small',
  },
  {
    icon: Package,
    title: 'Inventory & Suppliers',
    desc: 'Track stock levels, raise purchase orders, manage suppliers, and analyse waste — all automated.',
    size: 'small',
  },
  {
    icon: Users,
    title: 'Staff & Shift Management',
    desc: 'Schedule shifts, track working sessions, monitor performance, and build leaderboards.',
    size: 'large',
  },
  {
    icon: Star,
    title: 'Loyalty & Reviews',
    desc: 'Built-in loyalty tiers (Bronze → Platinum), review management, and sentiment analysis.',
    size: 'small',
  },
  {
    icon: Shield,
    title: 'GDPR Compliant',
    desc: 'Full GDPR toolkit — consent management, data export, right to erasure, breach logging.',
    size: 'small',
  },
]

export const AI_AGENTS = [
  {
    icon: MessageSquare,
    name: 'Customer Agent',
    tagline: 'Always on. Always helpful.',
    desc: 'Handles order status, menu questions, complaints, refunds, and cancellations via chat — 24/7, in any language.',
    messages: [
      { role: 'user', text: 'Where is my order #4521?' },
      { role: 'agent', text: 'Your order is being prepared in the kitchen. Estimated delivery: 18 minutes. 🍕' },
      { role: 'user', text: 'Can I cancel it?' },
      { role: 'agent', text: "I've cancelled order #4521 and initiated a full refund. You'll see it in 3–5 days." },
    ],
    alerts: undefined as undefined | { type: string; text: string }[],
    queries: undefined as undefined | { q: string; a: string }[],
  },
  {
    icon: ChefHat,
    name: 'Kitchen Agent',
    tagline: 'Sees the bottleneck before you do.',
    desc: 'Monitors order queue in real time, predicts prep time overruns, and alerts kitchen staff before delays cascade.',
    messages: undefined as undefined | { role: string; text: string }[],
    alerts: [
      { type: 'warning', text: '⚠️ 14 active orders — wait time rising to 38 min' },
      { type: 'info', text: '📦 Margherita Pizza is your slowest item today (+12 min avg)' },
      { type: 'success', text: '✅ Queue cleared — kitchen back to normal pace' },
    ],
    queries: undefined as undefined | { q: string; a: string }[],
  },
  {
    icon: PieChart,
    name: 'Manager Agent',
    tagline: 'Ask anything. Get answers instantly.',
    desc: 'Natural language analytics — ask any question about your business and get a precise answer with context.',
    messages: undefined as undefined | { role: string; text: string }[],
    alerts: undefined as undefined | { type: string; text: string }[],
    queries: [
      { q: 'What were my top 5 items last week?', a: 'Chicken Biryani (142), Margherita (98), Masala Dosa (87), Hakka Noodles (76), Lava Cake (61)' },
      { q: 'Which store had the highest waste this month?', a: 'Store Amsterdam-Noord — €340 waste, mainly from Bread (31%) and Salads (24%).' },
    ],
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
      { icon: Bot, text: 'AI agents', included: false },
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
      { icon: Bot, text: 'AI Customer Agent (chat ordering + support)', included: true },
      { icon: Sparkles, text: 'AI Manager Agent (natural language analytics)', included: true },
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
      { icon: Bot, text: 'AI Kitchen Agent (queue optimisation)', included: true },
      { icon: Truck, text: 'AI Delivery Agent (multi-order batching)', included: true },
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

export const GOLD_GRADIENT_TEXT: CSSProperties = {
  fontFamily: "'Playfair Display', serif",
  fontWeight: 700,
  background: 'linear-gradient(135deg, #D4AF37 0%, #F5E6A3 50%, #D4AF37 100%)',
  WebkitBackgroundClip: 'text' as const,
  WebkitTextFillColor: 'transparent',
  backgroundClip: 'text' as const,
}

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
    quote: "The AI customer agent handles 80% of support queries automatically. Refunds, order status, menu questions — all resolved without my staff touching them. It's remarkable.",
    name: "Liam O'Brien",
    role: 'Founder',
    restaurant: 'The Dublin Kitchen',
    avatar: 'L',
  },
]
