# MaSoVa Product Website Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a world-class B2B SaaS product website for MaSoVa targeting EU restaurant owners — Linear/Stripe/Vercel quality, inside the existing React 19 + Vite frontend at `/` route.

**Architecture:** New `frontend/src/apps/ProductSite/` folder with self-contained components. Current `HomePage` (customer food ordering) moves to `/order`. Product site takes over `/`. Tailwind CSS for styling, Framer Motion for animations, Lucide React for icons (already installed).

**Tech Stack:** React 19, TypeScript, Tailwind CSS 3, Framer Motion 11, Lucide React 0.555, React Router 7

---

## Task 1: Install dependencies + Tailwind setup

**Files:**
- Modify: `frontend/package.json`
- Create: `frontend/tailwind.config.ts`
- Create: `frontend/postcss.config.js`
- Modify: `frontend/src/index.css`

**Step 1: Install Tailwind + Framer Motion**

```bash
cd frontend
npm install tailwindcss@3 postcss autoprefixer framer-motion@11
npx tailwindcss init -p --ts
```

**Step 2: Configure `tailwind.config.ts`**

```ts
import type { Config } from 'tailwindcss'

export default {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        masova: {
          red: '#E53E3E',
          redDark: '#C0392B',
          black: '#080808',
          surface: '#111111',
          surface2: '#1A1A1A',
          border: 'rgba(255,255,255,0.08)',
          muted: '#6B7280',
          subtle: '#9CA3AF',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      animation: {
        'marquee': 'marquee 30s linear infinite',
        'count-up': 'count-up 2s ease-out forwards',
      },
      keyframes: {
        marquee: {
          '0%': { transform: 'translateX(0%)' },
          '100%': { transform: 'translateX(-50%)' },
        },
      },
    },
  },
  plugins: [],
} satisfies Config
```

**Step 3: Add Tailwind directives to `frontend/src/index.css` (prepend at top)**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');
```

**Step 4: Verify Tailwind works**

```bash
npm run dev
```
Expected: No build errors, app starts on :3000

**Step 5: Commit**

```bash
git add frontend/package.json frontend/tailwind.config.ts frontend/postcss.config.js frontend/src/index.css frontend/package-lock.json
git commit -m "feat: add Tailwind CSS + Framer Motion for product site"
```

---

## Task 2: Route setup — move customer homepage, add product site

**Files:**
- Modify: `frontend/src/App.tsx`
- Create: `frontend/src/apps/ProductSite/index.tsx` (barrel)

**Step 1: Create ProductSite barrel `frontend/src/apps/ProductSite/index.tsx`**

```tsx
export { default } from './ProductSitePage'
```

**Step 2: Modify `frontend/src/App.tsx` — update routes**

Find the existing route:
```tsx
<Route path="/" element={<HomePage />} />
```

Replace with:
```tsx
<Route path="/" element={<ProductSitePage />} />
<Route path="/order" element={<HomePage />} />
```

Add lazy import at top:
```tsx
const ProductSitePage = React.lazy(() => import('./apps/ProductSite/ProductSitePage'))
```

**Step 3: Commit**

```bash
git add frontend/src/App.tsx frontend/src/apps/ProductSite/index.tsx
git commit -m "feat: add product site route at /, move customer homepage to /order"
```

---

## Task 3: Design tokens + constants

**Files:**
- Create: `frontend/src/apps/ProductSite/constants.ts`

**Step 1: Create `constants.ts`**

```ts
import {
  ShoppingCart, ChefHat, Truck, BarChart3, Bot, Store,
  Shield, Globe, Zap, Users, Package, Leaf, Star,
  CheckCircle2, Clock, MapPin, Bell, CreditCard,
  TrendingUp, AlertCircle, Cpu, MessageSquare, Receipt,
  Building2, Layers, Lock, HeartHandshake, Phone,
  LayoutDashboard, Utensils, Navigation, PieChart, Sparkles,
} from 'lucide-react'

export const NAV_LINKS = [
  { label: 'Features', href: '#features' },
  { label: 'AI Agents', href: '#ai-agents' },
  { label: 'Pricing', href: '#pricing' },
  { label: 'FAQ', href: '#faq' },
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
  },
  {
    icon: ChefHat,
    name: 'Kitchen Agent',
    tagline: 'Sees the bottleneck before you do.',
    desc: 'Monitors order queue in real time, predicts prep time overruns, and alerts kitchen staff before delays cascade.',
    alerts: [
      { type: 'warning', text: '⚠️ 14 active orders — wait time rising to 38 min' },
      { type: 'info', text: '📦 Margherita Pizza is your slowest item today (+12 min avg)' },
      { type: 'success', text: '✅ Queue cleared — kitchen back to normal pace' },
    ],
  },
  {
    icon: PieChart,
    name: 'Manager Agent',
    tagline: 'Ask anything. Get answers instantly.',
    desc: 'Natural language analytics — ask any question about your business and get a precise answer with context.',
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
    badge: 'Most Popular',
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
    price: null,
    period: null,
    tagline: 'For chains and franchises across Europe',
    highlight: false,
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
    name: 'Liam O\'Brien',
    role: 'Founder',
    restaurant: 'The Dublin Kitchen',
    avatar: 'L',
  },
]
```

**Step 2: Commit**

```bash
git add frontend/src/apps/ProductSite/constants.ts
git commit -m "feat: add product site constants, pricing tiers, feature data"
```

---

## Task 4: Navbar component

**Files:**
- Create: `frontend/src/apps/ProductSite/components/Navbar.tsx`

**Step 1: Create `Navbar.tsx`**

```tsx
import React, { useEffect, useState } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import { Menu, X } from 'lucide-react'
import { NAV_LINKS } from '../constants'

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <motion.nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-[#080808]/80 backdrop-blur-xl border-b border-white/5' : 'bg-transparent'
      }`}
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <a href="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 bg-masova-red rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">M</span>
          </div>
          <span className="text-white font-semibold text-lg tracking-tight">MaSoVa</span>
        </a>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-8">
          {NAV_LINKS.map(link => (
            <a
              key={link.label}
              href={link.href}
              className="text-sm text-gray-400 hover:text-white transition-colors duration-200"
            >
              {link.label}
            </a>
          ))}
        </div>

        {/* CTAs */}
        <div className="hidden md:flex items-center gap-3">
          <a
            href="/customer-login"
            className="text-sm text-gray-400 hover:text-white transition-colors px-4 py-2"
          >
            Sign in
          </a>
          <a
            href="#pricing"
            className="text-sm bg-masova-red hover:bg-masova-redDark text-white px-4 py-2 rounded-lg transition-colors duration-200 font-medium"
          >
            Book a Demo
          </a>
        </div>

        {/* Mobile toggle */}
        <button
          className="md:hidden text-gray-400 hover:text-white"
          onClick={() => setMobileOpen(v => !v)}
        >
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <motion.div
          className="md:hidden bg-[#111111] border-t border-white/5 px-6 py-4 flex flex-col gap-4"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {NAV_LINKS.map(link => (
            <a
              key={link.label}
              href={link.href}
              className="text-sm text-gray-400 hover:text-white transition-colors"
              onClick={() => setMobileOpen(false)}
            >
              {link.label}
            </a>
          ))}
          <a
            href="#pricing"
            className="text-sm bg-masova-red text-white px-4 py-2 rounded-lg text-center font-medium"
            onClick={() => setMobileOpen(false)}
          >
            Book a Demo
          </a>
        </motion.div>
      )}
    </motion.nav>
  )
}
```

**Step 2: Commit**

```bash
git add frontend/src/apps/ProductSite/components/Navbar.tsx
git commit -m "feat: product site Navbar with scroll blur + mobile menu"
```

---

## Task 5: Hero section

**Files:**
- Create: `frontend/src/apps/ProductSite/components/HeroSection.tsx`

**Step 1: Create `HeroSection.tsx`**

```tsx
import React from 'react'
import { motion } from 'framer-motion'
import { ArrowRight, Play } from 'lucide-react'
import { STATS } from '../constants'

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1 } },
}
const item = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } },
}

export default function HeroSection() {
  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center px-6 pt-24 pb-16 overflow-hidden bg-[#080808]">
      {/* Radial glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-masova-red/8 rounded-full blur-[120px]" />
      </div>

      {/* Badge */}
      <motion.div
        className="mb-6 inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-masova-red/30 bg-masova-red/10 text-masova-red text-xs font-medium"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-masova-red animate-pulse" />
        Now available in Europe
      </motion.div>

      {/* Headline */}
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="text-center max-w-5xl"
      >
        <motion.h1
          variants={item}
          className="text-5xl md:text-7xl lg:text-8xl font-bold text-white leading-[1.05] tracking-tight mb-6"
        >
          The Restaurant OS
          <br />
          <span className="text-masova-red">Built for Growth.</span>
        </motion.h1>

        <motion.p
          variants={item}
          className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed"
        >
          MaSoVa gives multi-location restaurants in Europe a complete operating system —
          from the first order to the last delivery report. One platform. Zero gaps.
        </motion.p>

        <motion.div variants={item} className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <a
            href="#pricing"
            className="group flex items-center gap-2 bg-masova-red hover:bg-masova-redDark text-white px-6 py-3.5 rounded-xl font-semibold text-sm transition-all duration-200 hover:gap-3"
          >
            Start free trial
            <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
          </a>
          <a
            href="#features"
            className="flex items-center gap-2 text-gray-400 hover:text-white px-6 py-3.5 rounded-xl border border-white/10 hover:border-white/20 text-sm font-medium transition-all duration-200"
          >
            <Play size={14} fill="currentColor" />
            See how it works
          </a>
        </motion.div>
      </motion.div>

      {/* Stats bar */}
      <motion.div
        className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-px bg-white/5 border border-white/5 rounded-2xl overflow-hidden max-w-3xl w-full"
        initial={{ opacity: 0, y: 32 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.6 }}
      >
        {STATS.map(({ value, label, icon: Icon }) => (
          <div key={label} className="bg-[#080808] px-6 py-5 flex flex-col items-center gap-1">
            <Icon size={18} className="text-masova-red mb-1" />
            <span className="text-2xl font-bold text-white">{value}</span>
            <span className="text-xs text-gray-500 text-center">{label}</span>
          </div>
        ))}
      </motion.div>

      {/* Dashboard preview */}
      <motion.div
        className="mt-16 w-full max-w-6xl mx-auto rounded-2xl overflow-hidden border border-white/8 shadow-2xl shadow-black/50"
        initial={{ opacity: 0, y: 48, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ delay: 0.7, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      >
        {/* Fake browser chrome */}
        <div className="bg-[#111111] border-b border-white/5 px-4 py-3 flex items-center gap-2">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500/50" />
            <div className="w-3 h-3 rounded-full bg-yellow-500/50" />
            <div className="w-3 h-3 rounded-full bg-green-500/50" />
          </div>
          <div className="flex-1 mx-4 bg-white/5 rounded-md h-6 flex items-center px-3">
            <span className="text-xs text-gray-500">app.masova.eu/manager/dashboard</span>
          </div>
        </div>
        {/* Dashboard image */}
        <div className="bg-[#0D0D0D] aspect-[16/9] flex items-center justify-center">
          <p className="text-gray-600 text-sm">[ Manager Dashboard Screenshot ]</p>
        </div>
      </motion.div>
    </section>
  )
}
```

**Step 2: Commit**

```bash
git add frontend/src/apps/ProductSite/components/HeroSection.tsx
git commit -m "feat: product site HeroSection with glow, stats, dashboard preview"
```

---

## Task 6: Marquee strip

**Files:**
- Create: `frontend/src/apps/ProductSite/components/MarqueeStrip.tsx`

**Step 1: Create `MarqueeStrip.tsx`**

```tsx
import React from 'react'
import { MARQUEE_ITEMS } from '../constants'

export default function MarqueeStrip() {
  const doubled = [...MARQUEE_ITEMS, ...MARQUEE_ITEMS]
  return (
    <div className="border-y border-white/5 bg-[#0D0D0D] py-4 overflow-hidden">
      <div className="flex animate-marquee whitespace-nowrap">
        {doubled.map(({ label, icon: Icon }, i) => (
          <span key={i} className="inline-flex items-center gap-2 mx-8 text-sm text-gray-500">
            <Icon size={14} className="text-masova-red flex-shrink-0" />
            {label}
          </span>
        ))}
      </div>
    </div>
  )
}
```

**Step 2: Commit**

```bash
git add frontend/src/apps/ProductSite/components/MarqueeStrip.tsx
git commit -m "feat: product site MarqueeStrip"
```

---

## Task 7: Problem section

**Files:**
- Create: `frontend/src/apps/ProductSite/components/ProblemSection.tsx`

**Step 1: Create `ProblemSection.tsx`**

```tsx
import React from 'react'
import { motion } from 'framer-motion'
import { PAIN_POINTS } from '../constants'

export default function ProblemSection() {
  return (
    <section className="bg-[#080808] py-32 px-6">
      <div className="max-w-7xl mx-auto">
        <motion.div
          className="mb-16 max-w-3xl"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <p className="text-masova-red text-sm font-medium mb-4 tracking-wide uppercase">The problem</p>
          <h2 className="text-4xl md:text-5xl font-bold text-white leading-tight">
            Most restaurant platforms give you a POS.
            <span className="text-gray-500"> MaSoVa gives you the whole operation.</span>
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6">
          {PAIN_POINTS.map(({ icon: Icon, title, desc }, i) => (
            <motion.div
              key={title}
              className="p-6 rounded-2xl border border-white/8 bg-[#111111] hover:border-masova-red/30 transition-colors duration-300"
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
            >
              <div className="w-10 h-10 rounded-xl bg-masova-red/10 flex items-center justify-center mb-4">
                <Icon size={20} className="text-masova-red" />
              </div>
              <h3 className="text-white font-semibold mb-2">{title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
```

**Step 2: Commit**

```bash
git add frontend/src/apps/ProductSite/components/ProblemSection.tsx
git commit -m "feat: product site ProblemSection"
```

---

## Task 8: Product Tour section

**Files:**
- Create: `frontend/src/apps/ProductSite/components/ProductTour.tsx`

**Step 1: Create `ProductTour.tsx`**

```tsx
import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle2 } from 'lucide-react'
import { PRODUCT_TOUR_TABS } from '../constants'

export default function ProductTour() {
  const [active, setActive] = useState(0)
  const tab = PRODUCT_TOUR_TABS[active]

  return (
    <section id="features" className="bg-[#080808] py-32 px-6">
      <div className="max-w-7xl mx-auto">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <p className="text-masova-red text-sm font-medium mb-4 tracking-wide uppercase">Product tour</p>
          <h2 className="text-4xl md:text-5xl font-bold text-white">Everything your restaurant needs</h2>
        </motion.div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Tab list */}
          <div className="lg:w-64 flex lg:flex-col gap-2 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0">
            {PRODUCT_TOUR_TABS.map(({ id, label, icon: Icon }, i) => (
              <button
                key={id}
                onClick={() => setActive(i)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium whitespace-nowrap transition-all duration-200 text-left ${
                  active === i
                    ? 'bg-masova-red text-white'
                    : 'text-gray-500 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon size={16} />
                {label}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="flex-1 grid md:grid-cols-2 gap-8 items-center">
            <AnimatePresence mode="wait">
              <motion.div
                key={tab.id}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 16 }}
                transition={{ duration: 0.3 }}
              >
                <h3 className="text-2xl md:text-3xl font-bold text-white mb-4">{tab.headline}</h3>
                <p className="text-gray-400 leading-relaxed mb-6">{tab.desc}</p>
                <ul className="space-y-3">
                  {tab.bullets.map(b => (
                    <li key={b} className="flex items-center gap-2 text-sm text-gray-300">
                      <CheckCircle2 size={16} className="text-masova-red flex-shrink-0" />
                      {b}
                    </li>
                  ))}
                </ul>
              </motion.div>
            </AnimatePresence>

            {/* Screenshot */}
            <AnimatePresence mode="wait">
              <motion.div
                key={tab.id + '-img'}
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.97 }}
                transition={{ duration: 0.35 }}
                className="rounded-2xl border border-white/8 bg-[#111111] aspect-[4/3] flex items-center justify-center overflow-hidden"
              >
                <p className="text-gray-600 text-sm">[ {tab.label} Screenshot ]</p>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  )
}
```

**Step 2: Commit**

```bash
git add frontend/src/apps/ProductSite/components/ProductTour.tsx
git commit -m "feat: product site ProductTour with animated tab switching"
```

---

## Task 9: Features Grid section

**Files:**
- Create: `frontend/src/apps/ProductSite/components/FeaturesGrid.tsx`

**Step 1: Create `FeaturesGrid.tsx`**

```tsx
import React from 'react'
import { motion } from 'framer-motion'
import { FEATURES } from '../constants'

export default function FeaturesGrid() {
  return (
    <section className="bg-[#080808] py-32 px-6">
      <div className="max-w-7xl mx-auto">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <p className="text-masova-red text-sm font-medium mb-4 tracking-wide uppercase">Capabilities</p>
          <h2 className="text-4xl md:text-5xl font-bold text-white">Built for the full operation</h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {FEATURES.map(({ icon: Icon, title, desc, size }, i) => (
            <motion.div
              key={title}
              className={`p-6 rounded-2xl border border-white/8 bg-[#111111] hover:border-white/15 transition-all duration-300 group ${
                size === 'large' ? 'md:col-span-2' : ''
              }`}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.07 }}
              whileHover={{ y: -2 }}
            >
              <div className="w-10 h-10 rounded-xl bg-masova-red/10 flex items-center justify-center mb-4 group-hover:bg-masova-red/20 transition-colors">
                <Icon size={20} className="text-masova-red" />
              </div>
              <h3 className="text-white font-semibold mb-2">{title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
```

**Step 2: Commit**

```bash
git add frontend/src/apps/ProductSite/components/FeaturesGrid.tsx
git commit -m "feat: product site FeaturesGrid"
```

---

## Task 10: AI Agents section

**Files:**
- Create: `frontend/src/apps/ProductSite/components/AIAgentsSection.tsx`

**Step 1: Create `AIAgentsSection.tsx`**

```tsx
import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { AI_AGENTS } from '../constants'

function CustomerAgentDemo({ messages }: { messages: { role: string; text: string }[] }) {
  const [visible, setVisible] = useState(0)
  useEffect(() => {
    if (visible >= messages.length) return
    const t = setTimeout(() => setVisible(v => v + 1), 1200)
    return () => clearTimeout(t)
  }, [visible, messages.length])

  return (
    <div className="mt-4 space-y-2">
      {messages.slice(0, visible).map((m, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
        >
          <span className={`text-xs px-3 py-2 rounded-xl max-w-[80%] ${
            m.role === 'user'
              ? 'bg-masova-red text-white'
              : 'bg-white/8 text-gray-300'
          }`}>
            {m.text}
          </span>
        </motion.div>
      ))}
    </div>
  )
}

function KitchenAgentDemo({ alerts }: { alerts: { type: string; text: string }[] }) {
  const [visible, setVisible] = useState(0)
  useEffect(() => {
    if (visible >= alerts.length) return
    const t = setTimeout(() => setVisible(v => v + 1), 1400)
    return () => clearTimeout(t)
  }, [visible, alerts.length])

  const colors = { warning: 'text-yellow-400 bg-yellow-400/10', info: 'text-blue-400 bg-blue-400/10', success: 'text-green-400 bg-green-400/10' }

  return (
    <div className="mt-4 space-y-2">
      {alerts.slice(0, visible).map((a, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          className={`text-xs px-3 py-2 rounded-xl ${colors[a.type as keyof typeof colors]}`}
        >
          {a.text}
        </motion.div>
      ))}
    </div>
  )
}

function ManagerAgentDemo({ queries }: { queries: { q: string; a: string }[] }) {
  const [visible, setVisible] = useState(0)
  useEffect(() => {
    if (visible >= queries.length * 2) return
    const t = setTimeout(() => setVisible(v => v + 1), 1000)
    return () => clearTimeout(t)
  }, [visible, queries.length])

  return (
    <div className="mt-4 space-y-3">
      {queries.map((q, i) => (
        <div key={i}>
          {visible > i * 2 && (
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xs text-gray-500 mb-1">
              ❓ {q.q}
            </motion.p>
          )}
          {visible > i * 2 + 1 && (
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xs text-gray-300 bg-white/5 px-3 py-2 rounded-xl">
              {q.a}
            </motion.p>
          )}
        </div>
      ))}
    </div>
  )
}

export default function AIAgentsSection() {
  return (
    <section id="ai-agents" className="bg-[#0A0A0A] py-32 px-6">
      <div className="max-w-7xl mx-auto">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <p className="text-masova-red text-sm font-medium mb-4 tracking-wide uppercase">AI Agents</p>
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Your restaurant runs itself.
          </h2>
          <p className="text-gray-400 max-w-xl mx-auto">
            Three AI agents work 24/7 — handling customers, watching the kitchen, and surfacing insights for managers.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6">
          {AI_AGENTS.map(({ icon: Icon, name, tagline, desc, messages, alerts, queries }, i) => (
            <motion.div
              key={name}
              className="p-6 rounded-2xl border border-white/8 bg-[#111111] flex flex-col"
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
            >
              <div className="w-10 h-10 rounded-xl bg-masova-red/10 flex items-center justify-center mb-4">
                <Icon size={20} className="text-masova-red" />
              </div>
              <h3 className="text-white font-semibold">{name}</h3>
              <p className="text-masova-red text-xs mb-2">{tagline}</p>
              <p className="text-gray-500 text-sm leading-relaxed mb-4">{desc}</p>
              <div className="flex-1 min-h-[140px]">
                {messages && <CustomerAgentDemo messages={messages} />}
                {alerts && <KitchenAgentDemo alerts={alerts} />}
                {queries && <ManagerAgentDemo queries={queries} />}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
```

**Step 2: Commit**

```bash
git add frontend/src/apps/ProductSite/components/AIAgentsSection.tsx
git commit -m "feat: product site AIAgentsSection with live animated demos"
```

---

## Task 11: Pricing section

**Files:**
- Create: `frontend/src/apps/ProductSite/components/PricingSection.tsx`

**Step 1: Create `PricingSection.tsx`**

```tsx
import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { CheckCircle2, XCircle, ArrowRight } from 'lucide-react'
import { PRICING_TIERS } from '../constants'

export default function PricingSection() {
  const [annual, setAnnual] = useState(false)

  return (
    <section id="pricing" className="bg-[#080808] py-32 px-6">
      <div className="max-w-7xl mx-auto">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <p className="text-masova-red text-sm font-medium mb-4 tracking-wide uppercase">Pricing</p>
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">Simple, transparent pricing</h2>

          {/* Annual toggle */}
          <div className="inline-flex items-center gap-3 bg-white/5 rounded-full p-1">
            <button
              onClick={() => setAnnual(false)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                !annual ? 'bg-white text-black' : 'text-gray-400'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setAnnual(true)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                annual ? 'bg-white text-black' : 'text-gray-400'
              }`}
            >
              Annual
              <span className="ml-2 text-xs text-masova-red font-semibold">−17%</span>
            </button>
          </div>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6">
          {PRICING_TIERS.map(({ name, price, tagline, highlight, badge, features, cta }, i) => {
            const displayPrice = price ? (annual ? Math.round(price * 0.83) : price) : null
            return (
              <motion.div
                key={name}
                className={`relative p-6 rounded-2xl border flex flex-col ${
                  highlight
                    ? 'border-masova-red bg-masova-red/5'
                    : 'border-white/8 bg-[#111111]'
                }`}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                whileHover={{ y: -4 }}
              >
                {badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-masova-red text-white text-xs font-semibold px-3 py-1 rounded-full">
                    {badge}
                  </div>
                )}

                <div className="mb-6">
                  <h3 className="text-white font-bold text-lg mb-1">{name}</h3>
                  <p className="text-gray-500 text-sm mb-4">{tagline}</p>
                  {displayPrice ? (
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-bold text-white">€{displayPrice}</span>
                      <span className="text-gray-500 text-sm">/month</span>
                    </div>
                  ) : (
                    <div className="text-3xl font-bold text-white">Custom</div>
                  )}
                  {annual && price && (
                    <p className="text-xs text-gray-500 mt-1">Billed annually · 2 months free</p>
                  )}
                </div>

                <ul className="space-y-2.5 flex-1 mb-6">
                  {features.map(({ icon: Icon, text, included }) => (
                    <li key={text} className="flex items-start gap-2.5">
                      {included
                        ? <CheckCircle2 size={15} className="text-masova-red flex-shrink-0 mt-0.5" />
                        : <XCircle size={15} className="text-gray-700 flex-shrink-0 mt-0.5" />
                      }
                      <span className={`text-sm ${included ? 'text-gray-300' : 'text-gray-600'} flex items-center gap-1.5`}>
                        <Icon size={13} className={included ? 'text-gray-500' : 'text-gray-700'} />
                        {text}
                      </span>
                    </li>
                  ))}
                </ul>

                <a
                  href="#"
                  className={`group flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
                    highlight
                      ? 'bg-masova-red hover:bg-masova-redDark text-white'
                      : 'bg-white/8 hover:bg-white/15 text-white'
                  }`}
                >
                  {cta}
                  <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" />
                </a>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
```

**Step 2: Commit**

```bash
git add frontend/src/apps/ProductSite/components/PricingSection.tsx
git commit -m "feat: product site PricingSection with annual toggle"
```

---

## Task 12: Testimonials section

**Files:**
- Create: `frontend/src/apps/ProductSite/components/TestimonialsSection.tsx`

**Step 1: Create `TestimonialsSection.tsx`**

```tsx
import React from 'react'
import { motion } from 'framer-motion'
import { Quote } from 'lucide-react'
import { TESTIMONIALS } from '../constants'

export default function TestimonialsSection() {
  return (
    <section className="bg-[#080808] py-32 px-6">
      <div className="max-w-7xl mx-auto">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <p className="text-masova-red text-sm font-medium mb-4 tracking-wide uppercase">Testimonials</p>
          <h2 className="text-4xl md:text-5xl font-bold text-white">Loved by restaurant owners</h2>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6">
          {TESTIMONIALS.map(({ quote, name, role, restaurant, avatar }, i) => (
            <motion.div
              key={name}
              className="p-6 rounded-2xl border border-white/8 bg-[#111111] flex flex-col"
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
            >
              <Quote size={24} className="text-masova-red mb-4 opacity-60" />
              <p className="text-gray-300 text-sm leading-relaxed flex-1 mb-6">"{quote}"</p>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-masova-red flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                  {avatar}
                </div>
                <div>
                  <p className="text-white text-sm font-semibold">{name}</p>
                  <p className="text-gray-500 text-xs">{role} · {restaurant}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
```

**Step 2: Commit**

```bash
git add frontend/src/apps/ProductSite/components/TestimonialsSection.tsx
git commit -m "feat: product site TestimonialsSection"
```

---

## Task 13: FAQ section

**Files:**
- Create: `frontend/src/apps/ProductSite/components/FAQSection.tsx`

**Step 1: Create `FAQSection.tsx`**

```tsx
import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Minus } from 'lucide-react'
import { FAQS } from '../constants'

export default function FAQSection() {
  const [open, setOpen] = useState<number | null>(null)

  return (
    <section id="faq" className="bg-[#080808] py-32 px-6">
      <div className="max-w-3xl mx-auto">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <p className="text-masova-red text-sm font-medium mb-4 tracking-wide uppercase">FAQ</p>
          <h2 className="text-4xl md:text-5xl font-bold text-white">Common questions</h2>
        </motion.div>

        <div className="space-y-2">
          {FAQS.map(({ q, a }, i) => (
            <motion.div
              key={i}
              className="border border-white/8 rounded-xl overflow-hidden bg-[#111111]"
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
            >
              <button
                className="w-full flex items-center justify-between px-5 py-4 text-left"
                onClick={() => setOpen(open === i ? null : i)}
              >
                <span className="text-white text-sm font-medium">{q}</span>
                {open === i
                  ? <Minus size={16} className="text-masova-red flex-shrink-0" />
                  : <Plus size={16} className="text-gray-500 flex-shrink-0" />
                }
              </button>
              <AnimatePresence>
                {open === i && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className="overflow-hidden"
                  >
                    <p className="px-5 pb-4 text-gray-500 text-sm leading-relaxed">{a}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
```

**Step 2: Commit**

```bash
git add frontend/src/apps/ProductSite/components/FAQSection.tsx
git commit -m "feat: product site FAQSection with animated accordion"
```

---

## Task 14: Footer CTA + Footer

**Files:**
- Create: `frontend/src/apps/ProductSite/components/Footer.tsx`

**Step 1: Create `Footer.tsx`**

```tsx
import React from 'react'
import { motion } from 'framer-motion'
import { ArrowRight, Shield, Globe } from 'lucide-react'

const FOOTER_LINKS = {
  Product: ['Features', 'AI Agents', 'Pricing', 'Changelog'],
  Company: ['About', 'Blog', 'Careers', 'Press'],
  Legal: ['Privacy Policy', 'Terms of Service', 'GDPR', 'Cookie Policy'],
  Support: ['Documentation', 'API Reference', 'Status', 'Contact'],
}

export default function Footer() {
  return (
    <>
      {/* CTA Banner */}
      <section className="bg-masova-red py-24 px-6">
        <motion.div
          className="max-w-4xl mx-auto text-center"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Ready to transform your restaurant?
          </h2>
          <p className="text-red-100 mb-8 text-lg">
            Join hundreds of restaurants across Europe running on MaSoVa.
          </p>
          <a
            href="#"
            className="group inline-flex items-center gap-2 bg-white text-masova-red px-8 py-4 rounded-xl font-bold text-sm hover:gap-3 transition-all duration-200"
          >
            Start your free trial
            <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
          </a>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="bg-[#080808] border-t border-white/5 px-6 py-16">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
            {/* Brand */}
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-7 h-7 bg-masova-red rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-xs">M</span>
                </div>
                <span className="text-white font-semibold">MaSoVa</span>
              </div>
              <p className="text-gray-600 text-xs leading-relaxed">
                The complete restaurant operating system built for European multi-location restaurants.
              </p>
            </div>

            {/* Links */}
            {Object.entries(FOOTER_LINKS).map(([section, links]) => (
              <div key={section}>
                <p className="text-white text-xs font-semibold mb-3 uppercase tracking-wide">{section}</p>
                <ul className="space-y-2">
                  {links.map(link => (
                    <li key={link}>
                      <a href="#" className="text-gray-600 text-xs hover:text-gray-400 transition-colors">
                        {link}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="border-t border-white/5 pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-gray-600 text-xs">© 2026 MaSoVa. All rights reserved.</p>
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5 text-xs text-gray-600">
                <Shield size={12} className="text-masova-red" />
                GDPR Compliant
              </span>
              <span className="flex items-center gap-1.5 text-xs text-gray-600">
                <Globe size={12} className="text-masova-red" />
                Built for Europe
              </span>
            </div>
          </div>
        </div>
      </footer>
    </>
  )
}
```

**Step 2: Commit**

```bash
git add frontend/src/apps/ProductSite/components/Footer.tsx
git commit -m "feat: product site Footer with CTA banner"
```

---

## Task 15: Assemble ProductSitePage

**Files:**
- Create: `frontend/src/apps/ProductSite/ProductSitePage.tsx`

**Step 1: Create `ProductSitePage.tsx`**

```tsx
import React from 'react'
import Navbar from './components/Navbar'
import HeroSection from './components/HeroSection'
import MarqueeStrip from './components/MarqueeStrip'
import ProblemSection from './components/ProblemSection'
import ProductTour from './components/ProductTour'
import FeaturesGrid from './components/FeaturesGrid'
import AIAgentsSection from './components/AIAgentsSection'
import PricingSection from './components/PricingSection'
import TestimonialsSection from './components/TestimonialsSection'
import FAQSection from './components/FAQSection'
import Footer from './components/Footer'

export default function ProductSitePage() {
  return (
    <div className="bg-[#080808] min-h-screen">
      <Navbar />
      <HeroSection />
      <MarqueeStrip />
      <ProblemSection />
      <ProductTour />
      <FeaturesGrid />
      <AIAgentsSection />
      <PricingSection />
      <TestimonialsSection />
      <FAQSection />
      <Footer />
    </div>
  )
}
```

**Step 2: Commit**

```bash
git add frontend/src/apps/ProductSite/ProductSitePage.tsx frontend/src/apps/ProductSite/index.tsx
git commit -m "feat: assemble ProductSitePage — all sections wired"
```

---

## Task 16: Final verification

**Step 1: Run dev server**

```bash
cd frontend && npm run dev
```

**Step 2: Check these pages**
- `http://localhost:3000` → Product site loads, dark background, MaSoVa branding
- `http://localhost:3000/order` → Customer food ordering page (unchanged)
- All 11 sections visible on scroll
- Navbar blurs on scroll
- Product tour tabs switch with animation
- Pricing annual toggle works
- FAQ accordion opens/closes
- All Lucide icons render

**Step 3: Push to GitHub**

```bash
git push
```
