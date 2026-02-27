# Product Site Overhaul Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Transform the MaSoVa product website from a basic dark SaaS template into a world-class, infotainment-driven B2B site that shows real app screenshots, expands AI agents from 3→5, redesigns key sections as living data visualizations, and wires up every dead link.

**Architecture:** All changes are isolated to `frontend/src/apps/ProductSite/` — components, constants, and two new sections. No backend changes. Screenshots are captured from the live running app at `localhost:3000/order` and embedded as static assets in `frontend/public/screenshots/`. The support chat widget gets a completely new component replacing the existing `ChatWidget`.

**Tech Stack:** React 19, TypeScript, Tailwind CSS 3 (scoped to `#product-site`), Framer Motion 11, Lucide React, existing dev server at `localhost:3000`.

---

## Key Files Reference

```
frontend/src/apps/ProductSite/
  constants.ts                          ← data/copy — most changes go here
  ProductSitePage.tsx                   ← section assembly
  components/
    Navbar.tsx                          ← logo redesign + About link
    HeroSection.tsx                     ← real screenshot in browser mock
    ProblemSection.tsx                  ← infotainment before/after
    AIAgentsSection.tsx                 ← expand to 5 agents
    FeaturesGrid.tsx                    ← real screenshots + new features
    Footer.tsx                          ← resolve all dead links
    SupportChat.tsx                     ← NEW glassmorphism widget
    OrderFlowSection.tsx                ← NEW animated order-flow timeline
    DeveloperSection.tsx                ← NEW API + apps + support section

frontend/public/screenshots/            ← static app screenshots go here
  customer-home.png                     ← already captured
```

---

## Task 1: Capture real app screenshots and place in public/

**Files:**
- Create: `frontend/public/screenshots/customer-home.png`
- Create: `frontend/public/screenshots/customer-menu.png`
- Create: `frontend/public/screenshots/customer-ordering.png`

**Step 1: Copy the already-captured screenshot**

```bash
cp frontend/screenshot-customer-home.png frontend/public/screenshots/customer-home.png
```

**Step 2: Capture customer menu page screenshot**

Navigate to `http://localhost:3000/order` in the Playwright browser. Scroll down to the menu section. Take screenshot:

```bash
# Use Playwright MCP browser tool to navigate and screenshot:
# 1. browser_navigate to http://localhost:3000/order
# 2. Wait 3 seconds for images to load
# 3. Scroll to menu grid (y=600)
# 4. browser_take_screenshot → frontend/public/screenshots/customer-menu.png
```

**Step 3: Capture the full customer homepage**

```bash
# browser_navigate http://localhost:3000/order
# browser_take_screenshot fullPage: false → frontend/public/screenshots/customer-ordering.png
```

**Step 4: Verify files exist**

```bash
ls -la frontend/public/screenshots/
```
Expected: 3 PNG files, each > 50KB.

**Step 5: Commit**

```bash
git add frontend/public/screenshots/
git commit -m "feat: add real app screenshots for product site"
```

---

## Task 2: Update logo in Navbar to match customer app gold wordmark

**Files:**
- Modify: `frontend/src/apps/ProductSite/components/Navbar.tsx:27-32`
- Modify: `frontend/src/apps/ProductSite/components/Footer.tsx:46-51`

**Context:** The customer app (`/order`) uses a gold serif "MaSoVa" wordmark (Playfair Display font, `#D4A843`). The product site should match this exactly — same identity, same brand recognition.

**Step 1: Update Navbar logo block**

Replace lines 27–32 in `Navbar.tsx`:

```tsx
// BEFORE:
<a href="/" className="flex items-center gap-2 group">
  <div className="w-8 h-8 bg-[#E53E3E] rounded-lg flex items-center justify-center">
    <span className="text-white font-bold text-sm">M</span>
  </div>
  <span className="text-white font-semibold text-lg tracking-tight">MaSoVa</span>
</a>

// AFTER:
<a href="/" className="flex items-center gap-2 group">
  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
    style={{ background: 'linear-gradient(135deg, #C62A09 0%, #E53E3E 100%)' }}>
    <span style={{ color: '#fff', fontFamily: "'Playfair Display', Georgia, serif", fontWeight: 700, fontSize: '13px', letterSpacing: '-0.5px' }}>M</span>
  </div>
  <span style={{ fontFamily: "'Playfair Display', Georgia, serif", fontWeight: 700, fontSize: '1.2rem', letterSpacing: '-0.3px', color: '#FDFCF8' }}>
    MaSoVa
  </span>
</a>
```

**Step 2: Add About to NAV_LINKS in constants.ts**

```ts
// In constants.ts, update NAV_LINKS:
export const NAV_LINKS = [
  { label: 'About', href: '#about' },
  { label: 'Features', href: '#features' },
  { label: 'AI Agents', href: '#ai-agents' },
  { label: 'Pricing', href: '#pricing' },
  { label: 'FAQ', href: '#faq' },
]
```

**Step 3: Update Footer logo to match**

Replace the brand block in `Footer.tsx` (lines 46–55):

```tsx
<div className="flex items-center gap-2 mb-4">
  <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
    style={{ background: 'linear-gradient(135deg, #C62A09 0%, #E53E3E 100%)' }}>
    <span style={{ color: '#fff', fontFamily: "'Playfair Display', Georgia, serif", fontWeight: 700, fontSize: '11px' }}>M</span>
  </div>
  <span style={{ fontFamily: "'Playfair Display', Georgia, serif", fontWeight: 700, fontSize: '1rem', color: '#FDFCF8' }}>MaSoVa</span>
</div>
```

**Step 4: Verify in browser**

Navigate to `http://localhost:3000` — logo should read MaSoVa in serif gold-white, red gradient icon square.

**Step 5: Commit**

```bash
git add frontend/src/apps/ProductSite/components/Navbar.tsx \
        frontend/src/apps/ProductSite/components/Footer.tsx \
        frontend/src/apps/ProductSite/constants.ts
git commit -m "feat: product site logo matches customer app serif wordmark"
```

---

## Task 3: Hero — replace placeholder with real customer app screenshot

**Files:**
- Modify: `frontend/src/apps/ProductSite/components/HeroSection.tsx:97-121`

**Context:** The hero dashboard mockup currently shows `[ Manager Dashboard Screenshot ]`. We replace the `aspect-[16/9]` div with the real customer app screenshot. We also use the customer homepage screenshot since the manager dashboard requires auth.

**Step 1: Replace the placeholder div (lines 116-119)**

```tsx
// BEFORE:
<div className="bg-[#0D0D0D] aspect-[16/9] flex items-center justify-center">
  <p className="text-gray-600 text-sm">[ Manager Dashboard Screenshot ]</p>
</div>

// AFTER:
<div className="bg-[#0D0D0D] relative overflow-hidden" style={{ aspectRatio: '16/9' }}>
  <img
    src="/screenshots/customer-home.png"
    alt="MaSoVa Customer App"
    className="w-full h-full object-cover object-top"
    style={{ filter: 'brightness(0.92)' }}
  />
  {/* Gradient fade at bottom */}
  <div className="absolute bottom-0 left-0 right-0 h-24 pointer-events-none"
    style={{ background: 'linear-gradient(to bottom, transparent, #080808)' }} />
</div>
```

**Step 2: Update browser address bar text**

Change line 113:
```tsx
// BEFORE:
<span className="text-xs text-gray-500">app.masova.eu/manager/dashboard</span>
// AFTER:
<span className="text-xs text-gray-500">app.masova.eu — Customer Ordering</span>
```

**Step 3: Verify visually**

`http://localhost:3000` — hero should show the gold/dark customer homepage screenshot inside the browser chrome.

**Step 4: Commit**

```bash
git add frontend/src/apps/ProductSite/components/HeroSection.tsx
git commit -m "feat: hero shows real customer app screenshot"
```

---

## Task 4: Problem Section — infotainment before/after redesign

**Files:**
- Modify: `frontend/src/apps/ProductSite/components/ProblemSection.tsx` (full rewrite)

**Context:** Replace 3 icon cards with a split-screen "before/after" showing the chaos (left: animated terminal ticker of lost orders) vs. MaSoVa clarity (right: animated order status board).

**Step 1: Rewrite ProblemSection.tsx**

```tsx
import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const CHAOS_FEED = [
  { id: 1, text: '📱 WhatsApp order — no one saw it', type: 'error' },
  { id: 2, text: '📞 Customer calling: "Where is my food?"', type: 'warning' },
  { id: 3, text: '🗒️  Paper ticket — handwriting unreadable', type: 'error' },
  { id: 4, text: '⏱️  Order #219 — 55 min, no update', type: 'error' },
  { id: 5, text: '📊 Last week's revenue? Check the spreadsheet', type: 'warning' },
  { id: 6, text: '🚗 Driver waiting — kitchen not ready', type: 'warning' },
  { id: 7, text: '📱 Another WhatsApp. Different number.', type: 'error' },
  { id: 8, text: '❌ Order double-entered — refund needed', type: 'error' },
]

const MASOVA_FEED = [
  { id: 1, stage: 'Placed', time: '18:42:01', item: '#4521 · Chicken Biryani', status: 'confirmed' },
  { id: 2, stage: 'In Kitchen', time: '18:42:08', item: '#4521 · Prep started', status: 'active' },
  { id: 3, stage: 'Driver Assigned', time: '18:54:11', item: 'Ravi K · 0.8 km away', status: 'active' },
  { id: 4, stage: 'Delivered', time: '19:09:44', item: '#4521 · Proof captured', status: 'done' },
]

function ChaosFeed() {
  const [items, setItems] = useState(CHAOS_FEED.slice(0, 3))
  useEffect(() => {
    let i = 3
    const t = setInterval(() => {
      setItems(prev => {
        const next = [...prev, CHAOS_FEED[i % CHAOS_FEED.length]]
        return next.slice(-5)
      })
      i++
    }, 1800)
    return () => clearInterval(t)
  }, [])
  return (
    <div className="space-y-2 min-h-[200px]">
      <AnimatePresence mode="popLayout">
        {items.map(item => (
          <motion.div
            key={item.id + item.text}
            layout
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 16, height: 0 }}
            transition={{ duration: 0.3 }}
            className="flex items-start gap-3 px-4 py-2.5 rounded-xl text-sm font-mono"
            style={{
              background: item.type === 'error' ? 'rgba(239,68,68,0.07)' : 'rgba(251,191,36,0.07)',
              border: `1px solid ${item.type === 'error' ? 'rgba(239,68,68,0.15)' : 'rgba(251,191,36,0.12)'}`,
              color: item.type === 'error' ? '#FCA5A5' : '#FDE68A',
            }}
          >
            <span className="text-xs leading-5">{item.text}</span>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}

function MaSoVaBoard() {
  const [visible, setVisible] = useState(1)
  useEffect(() => {
    const t = setInterval(() => setVisible(v => Math.min(v + 1, MASOVA_FEED.length)), 1400)
    return () => clearInterval(t)
  }, [])
  return (
    <div className="space-y-2 min-h-[200px]">
      {MASOVA_FEED.slice(0, visible).map((row, i) => (
        <motion.div
          key={row.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-4 px-4 py-2.5 rounded-xl text-sm"
          style={{
            background: row.status === 'done'
              ? 'rgba(52,211,153,0.07)'
              : row.status === 'active'
              ? 'rgba(96,165,250,0.07)'
              : 'rgba(255,255,255,0.04)',
            border: `1px solid ${row.status === 'done' ? 'rgba(52,211,153,0.2)' : row.status === 'active' ? 'rgba(96,165,250,0.2)' : 'rgba(255,255,255,0.08)'}`,
          }}
        >
          <span className="text-xs font-mono text-gray-500 w-16 flex-shrink-0">{row.time}</span>
          <span
            className="text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0"
            style={{
              background: row.status === 'done' ? 'rgba(52,211,153,0.15)' : row.status === 'active' ? 'rgba(96,165,250,0.15)' : 'rgba(255,255,255,0.05)',
              color: row.status === 'done' ? '#34D399' : row.status === 'active' ? '#60A5FA' : '#9CA3AF',
            }}
          >
            {row.stage}
          </span>
          <span className="text-xs text-gray-400 truncate">{row.item}</span>
        </motion.div>
      ))}
    </div>
  )
}

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
          <p className="text-sm font-medium mb-4 tracking-wide uppercase" style={{ color: '#C0392B' }}>The problem</p>
          <h2 className="text-4xl md:text-5xl font-bold text-white leading-tight">
            Most restaurant platforms give you a POS.
            <span className="text-gray-500"> MaSoVa gives you the whole operation.</span>
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Before */}
          <motion.div
            className="rounded-2xl p-6"
            style={{ background: '#0D0D0D', border: '1px solid rgba(239,68,68,0.12)' }}
            initial={{ opacity: 0, x: -24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-2 h-2 rounded-full bg-red-500" />
              <span className="text-sm font-semibold text-gray-400 uppercase tracking-widest">Without MaSoVa</span>
            </div>
            <ChaosFeed />
          </motion.div>

          {/* After */}
          <motion.div
            className="rounded-2xl p-6"
            style={{ background: '#0D0D0D', border: '1px solid rgba(52,211,153,0.12)' }}
            initial={{ opacity: 0, x: 24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-2 h-2 rounded-full bg-emerald-400" />
              <span className="text-sm font-semibold text-gray-400 uppercase tracking-widest">With MaSoVa</span>
            </div>
            <div className="mb-3 flex items-center justify-between">
              <span className="text-xs text-gray-600">Live order pipeline</span>
              <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(52,211,153,0.1)', color: '#34D399' }}>● Live</span>
            </div>
            <MaSoVaBoard />
          </motion.div>
        </div>
      </div>
    </section>
  )
}
```

**Step 2: Verify animation works**

Open `http://localhost:3000` — scroll to the problem section. Left side should show red chaos items animating in/out every ~1.8s. Right side shows green order pipeline steps appearing sequentially.

**Step 3: Commit**

```bash
git add frontend/src/apps/ProductSite/components/ProblemSection.tsx
git commit -m "feat: problem section redesigned as live infotainment before/after"
```

---

## Task 5: AI Agents — expand to 5 agents + mission control layout

**Files:**
- Modify: `frontend/src/apps/ProductSite/constants.ts` (AI_AGENTS array)
- Modify: `frontend/src/apps/ProductSite/components/AIAgentsSection.tsx` (full rewrite)

**Context:** Add Driver Agent and Store Selection Agent. New layout: section title "5 AI agents. Zero blind spots." with a 2+3 grid arrangement. Each card is taller, more immersive. Icons from Lucide only (no emoji in structural elements).

**Step 1: Update AI_AGENTS in constants.ts — add Driver + Store agents**

Append to the AI_AGENTS array after the Manager agent:

```ts
import {
  // add these to existing imports:
  Car, MapPin,
} from 'lucide-react'

// Add to AI_AGENTS array:
  {
    icon: Car,
    name: 'Driver Agent',
    tagline: 'Dispatched before you blink.',
    desc: 'Monitors all active drivers, auto-assigns the closest available driver to each ready order, optimises multi-order batching, and re-routes on traffic changes.',
    messages: undefined,
    alerts: [
      { type: 'success', text: '🚗 #4521 assigned to Ravi K — 0.8 km, ETA 6 min' },
      { type: 'info', text: '📦 Batching #4522 + #4523 — same zone, 1 driver' },
      { type: 'warning', text: '⚠️ Ravi delayed — re-routing to Arjun S' },
    ],
    queries: undefined,
  },
  {
    icon: MapPin,
    name: 'Store Selection',
    tagline: 'Right store. Right price. Instantly.',
    desc: 'Detects the customer\'s address, resolves the nearest serving store using Haversine distance, calculates the delivery zone fee, and confirms coverage — before the menu even loads.',
    messages: [
      { role: 'user', text: 'Delivering to Leidseplein 12, Amsterdam' },
      { role: 'agent', text: '✓ MaSoVa Amsterdam-West · 2.1 km · Zone A · €2.50 · ~14 min' },
      { role: 'user', text: 'What if I move to Amstelveen?' },
      { role: 'agent', text: '⚠️ Outside delivery radius. Nearest store: 4.8 km. Pickup available.' },
    ],
    alerts: undefined,
    queries: undefined,
  },
```

**Step 2: Update section title + layout in AIAgentsSection.tsx**

Full rewrite of AIAgentsSection.tsx:

```tsx
import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { AI_AGENTS } from '../constants'

function CustomerAgentDemo({ messages }: { messages: { role: string; text: string }[] }) {
  const [visible, setVisible] = useState(0)
  useEffect(() => {
    if (visible >= messages.length) return
    const t = setTimeout(() => setVisible(v => v + 1), 1400)
    return () => clearTimeout(t)
  }, [visible, messages.length])
  return (
    <div className="mt-4 space-y-2">
      {messages.slice(0, visible).map((m, i) => (
        <motion.div key={i} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
          className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
          <span className="text-xs px-3 py-2 rounded-xl max-w-[85%] leading-relaxed"
            style={m.role === 'user'
              ? { background: '#C0392B', color: '#fff' }
              : { background: 'rgba(255,255,255,0.06)', color: '#D1D5DB', border: '1px solid rgba(255,255,255,0.06)' }}>
            {m.text}
          </span>
        </motion.div>
      ))}
    </div>
  )
}

function AlertDemo({ alerts }: { alerts: { type: string; text: string }[] }) {
  const [visible, setVisible] = useState(0)
  useEffect(() => {
    if (visible >= alerts.length) return
    const t = setTimeout(() => setVisible(v => v + 1), 1600)
    return () => clearTimeout(t)
  }, [visible, alerts.length])
  const colors: Record<string, React.CSSProperties> = {
    warning: { color: '#FBBF24', background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.15)' },
    info: { color: '#60A5FA', background: 'rgba(96,165,250,0.08)', border: '1px solid rgba(96,165,250,0.12)' },
    success: { color: '#34D399', background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.12)' },
  }
  return (
    <div className="mt-4 space-y-2">
      {alerts.slice(0, visible).map((a, i) => (
        <motion.div key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
          className="text-xs px-3 py-2.5 rounded-xl leading-relaxed"
          style={colors[a.type] ?? {}}>
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
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="text-xs mb-1.5 font-medium"
              style={{ color: '#9CA3AF' }}>
              ❓ {q.q}
            </motion.p>
          )}
          {visible > i * 2 + 1 && (
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="text-xs px-3 py-2.5 rounded-xl leading-relaxed"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', color: '#D1D5DB' }}>
              {q.a}
            </motion.p>
          )}
        </div>
      ))}
    </div>
  )
}

function AgentCard({ agent, i }: { agent: typeof AI_AGENTS[0]; i: number }) {
  const { icon: Icon, name, tagline, desc, messages, alerts, queries } = agent
  return (
    <motion.div
      className="p-6 rounded-2xl flex flex-col h-full"
      style={{ background: '#0D0D0D', border: '1px solid rgba(255,255,255,0.07)' }}
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: i * 0.08 }}
      whileHover={{ borderColor: 'rgba(192,57,43,0.25)' } as any}
    >
      <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-4 flex-shrink-0"
        style={{ background: 'rgba(192,57,43,0.12)' }}>
        <Icon size={17} style={{ color: '#C0392B' }} />
      </div>
      <h3 className="text-white font-semibold text-sm mb-0.5">{name}</h3>
      <p className="text-xs mb-3 font-medium" style={{ color: '#C0392B' }}>{tagline}</p>
      <p className="text-gray-500 text-xs leading-relaxed mb-2">{desc}</p>
      <div className="flex-1">
        {messages && <CustomerAgentDemo messages={messages} />}
        {alerts && <AlertDemo alerts={alerts} />}
        {queries && <ManagerAgentDemo queries={queries} />}
      </div>
    </motion.div>
  )
}

export default function AIAgentsSection() {
  const topRow = AI_AGENTS.slice(0, 2)   // Customer + Kitchen
  const bottomRow = AI_AGENTS.slice(2)   // Manager + Driver + Store

  return (
    <section id="ai-agents" className="bg-[#080808] py-32 px-6">
      <div className="max-w-7xl mx-auto">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <p className="text-xs font-semibold mb-4 tracking-widest uppercase" style={{ color: '#C0392B' }}>AI Agents</p>
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            5 AI agents. Zero blind spots.
          </h2>
          <p className="text-gray-500 max-w-xl mx-auto text-sm leading-relaxed">
            Every role in your restaurant — customer, kitchen, driver, manager, and store ops — has a dedicated AI agent running 24/7.
          </p>
        </motion.div>

        {/* Top row: 2 agents */}
        <div className="grid md:grid-cols-2 gap-4 mb-4">
          {topRow.map((agent, i) => (
            <AgentCard key={agent.name} agent={agent} i={i} />
          ))}
        </div>

        {/* Bottom row: 3 agents */}
        <div className="grid md:grid-cols-3 gap-4">
          {bottomRow.map((agent, i) => (
            <AgentCard key={agent.name} agent={agent} i={i + 2} />
          ))}
        </div>
      </div>
    </section>
  )
}
```

**Step 3: Verify**

`http://localhost:3000` → scroll to AI Agents. Should show 5 cards in 2+3 layout, all with animated demos.

**Step 4: Commit**

```bash
git add frontend/src/apps/ProductSite/constants.ts \
        frontend/src/apps/ProductSite/components/AIAgentsSection.tsx
git commit -m "feat: expand AI agents to 5 — Driver + Store Selection added"
```

---

## Task 6: Order Flow Timeline section (replaces "runs itself" heading)

**Files:**
- Create: `frontend/src/apps/ProductSite/components/OrderFlowSection.tsx`
- Modify: `frontend/src/apps/ProductSite/ProductSitePage.tsx` (add section between ProblemSection and ProductTour)

**Context:** Animated timeline showing a single order flowing through every system. Each node pulses when it activates. This replaces the vague "runs itself" copy as the section demonstrating operational continuity.

**Step 1: Create OrderFlowSection.tsx**

```tsx
import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { ShoppingCart, ChefHat, ClipboardCheck, Car, MapPin, CheckCircle } from 'lucide-react'

const FLOW_STEPS = [
  {
    icon: ShoppingCart,
    label: 'Customer Orders',
    sub: 'Web · Mobile · Kiosk',
    detail: '"Chicken Biryani × 2 — Leidseplein 12"',
    color: '#60A5FA',
  },
  {
    icon: ChefHat,
    label: 'Kitchen Receives',
    sub: 'KDS · Instant notification',
    detail: 'Ticket #4521 printed — prep clock starts',
    color: '#FBBF24',
  },
  {
    icon: ClipboardCheck,
    label: 'Order Ready',
    sub: '18 min avg prep time',
    detail: 'Quality checkpoint passed ✓',
    color: '#A78BFA',
  },
  {
    icon: Car,
    label: 'Driver Dispatched',
    sub: 'Auto-assigned in < 8s',
    detail: 'Ravi K · 0.8 km · ETA 6 min',
    color: '#34D399',
  },
  {
    icon: MapPin,
    label: 'En Route',
    sub: 'Live GPS tracking',
    detail: 'Customer watching on map',
    color: '#F97316',
  },
  {
    icon: CheckCircle,
    label: 'Delivered',
    sub: 'Photo proof captured',
    detail: 'Rating request sent · Analytics updated',
    color: '#34D399',
  },
]

export default function OrderFlowSection() {
  const [active, setActive] = useState(0)

  useEffect(() => {
    const t = setInterval(() => {
      setActive(v => (v + 1) % FLOW_STEPS.length)
    }, 1800)
    return () => clearInterval(t)
  }, [])

  return (
    <section className="bg-[#050505] py-32 px-6">
      <div className="max-w-7xl mx-auto">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <p className="text-xs font-semibold mb-4 tracking-widest uppercase" style={{ color: '#C0392B' }}>End-to-end</p>
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            One order. Six systems.<br />
            <span className="text-gray-500">Zero intervention.</span>
          </h2>
          <p className="text-gray-500 max-w-lg mx-auto text-sm">
            From tap to doorstep — every handoff automated, every status visible, every second tracked.
          </p>
        </motion.div>

        {/* Timeline */}
        <div className="relative">
          {/* Connector line */}
          <div className="hidden md:block absolute top-8 left-0 right-0 h-px"
            style={{ background: 'rgba(255,255,255,0.06)', marginLeft: '8.3%', marginRight: '8.3%' }} />

          <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
            {FLOW_STEPS.map((step, i) => {
              const Icon = step.icon
              const isActive = i === active
              const isPast = i < active
              return (
                <motion.div
                  key={step.label}
                  className="flex flex-col items-center text-center"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                >
                  {/* Node */}
                  <div className="relative mb-4">
                    <motion.div
                      className="w-16 h-16 rounded-2xl flex items-center justify-center"
                      animate={{
                        background: isActive
                          ? `${step.color}20`
                          : isPast ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.03)',
                        borderColor: isActive ? step.color : isPast ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.06)',
                        scale: isActive ? 1.08 : 1,
                      }}
                      style={{ border: '1px solid' }}
                      transition={{ duration: 0.4 }}
                    >
                      <Icon size={22} style={{ color: isActive ? step.color : isPast ? '#6B7280' : '#374151' }} />
                    </motion.div>
                    {isActive && (
                      <motion.div
                        className="absolute inset-0 rounded-2xl"
                        animate={{ opacity: [0.5, 0], scale: [1, 1.4] }}
                        transition={{ duration: 1, repeat: Infinity }}
                        style={{ background: step.color, opacity: 0.15 }}
                      />
                    )}
                  </div>

                  <p className="text-white text-xs font-semibold mb-1">{step.label}</p>
                  <p className="text-gray-600 text-xs mb-2">{step.sub}</p>

                  {isActive && (
                    <motion.div
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-xs px-2 py-1.5 rounded-lg w-full"
                      style={{
                        background: `${step.color}10`,
                        border: `1px solid ${step.color}25`,
                        color: step.color,
                        fontSize: '10px',
                        lineHeight: '1.4',
                      }}
                    >
                      {step.detail}
                    </motion.div>
                  )}
                </motion.div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
```

**Step 2: Add OrderFlowSection to ProductSitePage.tsx**

```tsx
// Add import at top:
import OrderFlowSection from './components/OrderFlowSection'

// Add after <ProblemSection /> in the JSX:
<ProblemSection />
<OrderFlowSection />
<ProductTour />
```

**Step 3: Verify**

Scroll down — animated 6-step timeline should pulse through each step every 1.8s.

**Step 4: Commit**

```bash
git add frontend/src/apps/ProductSite/components/OrderFlowSection.tsx \
        frontend/src/apps/ProductSite/ProductSitePage.tsx
git commit -m "feat: add animated order flow timeline section"
```

---

## Task 7: Features Grid — real screenshots + Store Selection + Android Apps

**Files:**
- Modify: `frontend/src/apps/ProductSite/constants.ts` (FEATURES array)
- Modify: `frontend/src/apps/ProductSite/components/FeaturesGrid.tsx`

**Context:** Each feature card gets a screenshot or a stylized data mockup (no placeholder text). Add Store Selection and Android Apps as explicit features. The grid uses a masonry-style layout with some cards showing the real customer app screenshot.

**Step 1: Update FEATURES array in constants.ts**

```ts
// Replace FEATURES array entirely:
export const FEATURES = [
  {
    icon: LayoutDashboard,
    title: 'Unified Manager Dashboard',
    desc: '6 sections — orders, inventory, staff, analytics, marketing, delivery — all in one place. Real-time data. No tab-switching.',
    size: 'large',
    screenshot: '/screenshots/customer-home.png',  // best available screenshot
    screenshotAlt: 'MaSoVa Manager Dashboard',
  },
  {
    icon: ShoppingCart,
    title: 'Customer Ordering App',
    desc: 'Branded web + Android app. Menu browsing, cart, Stripe checkout, live order tracking with GPS map.',
    size: 'small',
    screenshot: '/screenshots/customer-ordering.png',
    screenshotAlt: 'MaSoVa Customer App',
  },
  {
    icon: Utensils,
    title: 'POS + Self-Service Kiosk',
    desc: 'Full POS with PIN-auth staff switching. Kiosk mode for walk-in orders. Works on any tablet.',
    size: 'small',
    screenshot: null,
    screenshotAlt: null,
  },
  {
    icon: Package,
    title: 'Inventory & Waste Tracking',
    desc: 'Live stock levels, purchase orders, supplier management, and automated waste analysis — AI flags anomalies before they cost you.',
    size: 'small',
    screenshot: null,
    screenshotAlt: null,
  },
  {
    icon: Users,
    title: 'Staff & Shift Management',
    desc: 'Schedule shifts, track clock-in/out, monitor performance metrics, and build weekly leaderboards.',
    size: 'small',
    screenshot: null,
    screenshotAlt: null,
  },
  {
    icon: MapPin,
    title: 'Domino\'s-style Store Selection',
    desc: 'Address-gate before menu load. Google Places autocomplete resolves nearest store, delivery zone, fee, and ETA in < 200ms.',
    size: 'large',
    screenshot: '/screenshots/customer-home.png',
    screenshotAlt: 'Store Selection Flow',
  },
  {
    icon: Truck,
    title: 'Driver App — Android',
    desc: 'Native Android app for drivers. Order queue, Google Maps navigation, OTP delivery confirmation, proof-of-delivery photo capture.',
    size: 'small',
    screenshot: null,
    screenshotAlt: null,
  },
  {
    icon: Star,
    title: 'Loyalty & Reviews',
    desc: 'Bronze → Platinum loyalty tiers. Automated review collection. Sentiment analysis. Campaign management.',
    size: 'small',
    screenshot: null,
    screenshotAlt: null,
  },
  {
    icon: Shield,
    title: 'GDPR Compliance Toolkit',
    desc: 'Consent management, Article 15 data export, Article 17 erasure, breach logging, EU data residency. Fully audit-ready.',
    size: 'small',
    screenshot: null,
    screenshotAlt: null,
  },
]
```

**Step 2: Update FeaturesGrid.tsx to show screenshots in large cards**

```tsx
import React from 'react'
import { motion } from 'framer-motion'
import { FEATURES } from '../constants'

export default function FeaturesGrid() {
  return (
    <section id="features" className="bg-[#080808] py-32 px-6">
      <div className="max-w-7xl mx-auto">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <p className="text-xs font-semibold mb-4 tracking-widest uppercase" style={{ color: '#C0392B' }}>Capabilities</p>
          <h2 className="text-4xl md:text-5xl font-bold text-white">Built for the full operation</h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {FEATURES.map(({ icon: Icon, title, desc, size, screenshot, screenshotAlt }, i) => (
            <motion.div
              key={title}
              className={`rounded-2xl overflow-hidden group ${size === 'large' ? 'md:col-span-2' : ''}`}
              style={{ background: '#0D0D0D', border: '1px solid rgba(255,255,255,0.07)' }}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.06 }}
              whileHover={{ borderColor: 'rgba(192,57,43,0.2)' } as any}
            >
              {/* Screenshot strip for large cards */}
              {screenshot && size === 'large' && (
                <div className="w-full overflow-hidden" style={{ height: '180px' }}>
                  <img
                    src={screenshot}
                    alt={screenshotAlt ?? ''}
                    className="w-full h-full object-cover object-top transition-transform duration-700 group-hover:scale-105"
                    style={{ filter: 'brightness(0.7)' }}
                  />
                </div>
              )}

              {/* Screenshot strip for small cards with screenshot */}
              {screenshot && size !== 'large' && (
                <div className="w-full overflow-hidden" style={{ height: '120px' }}>
                  <img
                    src={screenshot}
                    alt={screenshotAlt ?? ''}
                    className="w-full h-full object-cover object-top transition-transform duration-700 group-hover:scale-105"
                    style={{ filter: 'brightness(0.65)' }}
                  />
                </div>
              )}

              <div className="p-6">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-4"
                  style={{ background: 'rgba(192,57,43,0.1)' }}>
                  <Icon size={17} style={{ color: '#C0392B' }} />
                </div>
                <h3 className="text-white font-semibold mb-2 text-sm">{title}</h3>
                <p className="text-gray-500 text-xs leading-relaxed">{desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
```

**Step 3: Verify**

Scroll to Features — large cards should show real screenshots with hover zoom. Small cards are text-only clean cards.

**Step 4: Commit**

```bash
git add frontend/src/apps/ProductSite/constants.ts \
        frontend/src/apps/ProductSite/components/FeaturesGrid.tsx
git commit -m "feat: features grid shows real screenshots + store selection + driver app"
```

---

## Task 8: Developer Section — API, Android apps, support channels

**Files:**
- Create: `frontend/src/apps/ProductSite/components/DeveloperSection.tsx`
- Modify: `frontend/src/apps/ProductSite/ProductSitePage.tsx` (add before Footer)

**Context:** New section titled "Built by engineers, supported by engineers." Three columns: API docs (Swagger), Android apps (Customer + Driver), 24/7 support channels.

**Step 1: Create DeveloperSection.tsx**

```tsx
import React from 'react'
import { motion } from 'framer-motion'
import { Code2, Smartphone, HeadphonesIcon } from 'lucide-react'

const PILLARS = [
  {
    icon: Code2,
    title: 'API-first architecture',
    desc: 'Every MaSoVa feature is accessible via REST API with full OpenAPI 3.0 documentation. Build integrations, pull analytics, or connect your ERP — all documented.',
    links: [
      { label: 'Swagger API Docs', href: 'http://localhost:8080/swagger-ui.html', external: true },
      { label: 'OpenAPI spec (JSON)', href: 'http://localhost:8080/v3/api-docs', external: true },
    ],
    badge: 'OpenAPI 3.0',
  },
  {
    icon: Smartphone,
    title: 'Native Android apps',
    desc: 'Two production Android apps — the MaSoVa Customer App for ordering and the MaSoVa Driver App for deliveries. Both available on Google Play.',
    links: [
      { label: 'Customer App — Google Play', href: '#apps', external: false },
      { label: 'Driver App — Google Play', href: '#apps', external: false },
    ],
    badge: 'Android',
  },
  {
    icon: HeadphonesIcon,
    title: 'Human + AI support',
    desc: 'Starter gets chat support with 24h SLA. Growth gets 12h SLA priority. Enterprise gets a dedicated account manager, phone support, and onboarding specialist.',
    links: [
      { label: 'Chat with support', href: '#', external: false },
      { label: 'Book onboarding call', href: '#pricing', external: false },
    ],
    badge: '24/7',
  },
]

export default function DeveloperSection() {
  return (
    <section id="about" className="bg-[#050505] py-32 px-6">
      <div className="max-w-7xl mx-auto">
        <motion.div
          className="mb-16 max-w-2xl"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <p className="text-xs font-semibold mb-4 tracking-widest uppercase" style={{ color: '#C0392B' }}>Under the hood</p>
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Built by engineers,<br />supported by engineers.
          </h2>
          <p className="text-gray-500 text-sm leading-relaxed">
            MaSoVa is a production-grade microservices platform — 5 Spring Boot services, MongoDB, RabbitMQ, Redis, and a Python AI layer. When you need help, you talk to people who built it.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6">
          {PILLARS.map(({ icon: Icon, title, desc, links, badge }, i) => (
            <motion.div
              key={title}
              className="p-6 rounded-2xl flex flex-col"
              style={{ background: '#0D0D0D', border: '1px solid rgba(255,255,255,0.07)' }}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
            >
              <div className="flex items-start justify-between mb-6">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ background: 'rgba(192,57,43,0.1)' }}>
                  <Icon size={18} style={{ color: '#C0392B' }} />
                </div>
                <span className="text-xs px-2 py-1 rounded-full font-mono"
                  style={{ background: 'rgba(255,255,255,0.05)', color: '#6B7280', border: '1px solid rgba(255,255,255,0.06)' }}>
                  {badge}
                </span>
              </div>
              <h3 className="text-white font-semibold mb-3 text-sm">{title}</h3>
              <p className="text-gray-500 text-xs leading-relaxed mb-6 flex-1">{desc}</p>
              <div className="space-y-2">
                {links.map(link => (
                  <a
                    key={link.label}
                    href={link.href}
                    target={link.external ? '_blank' : undefined}
                    rel={link.external ? 'noopener noreferrer' : undefined}
                    className="flex items-center gap-2 text-xs transition-colors duration-200"
                    style={{ color: '#C0392B' }}
                    onMouseEnter={e => (e.currentTarget.style.color = '#E53E3E')}
                    onMouseLeave={e => (e.currentTarget.style.color = '#C0392B')}
                  >
                    <span>→</span>
                    <span>{link.label}</span>
                    {link.external && <span className="text-gray-600">↗</span>}
                  </a>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
```

**Step 2: Add DeveloperSection to ProductSitePage.tsx**

```tsx
import DeveloperSection from './components/DeveloperSection'

// Add before <Footer /> in JSX:
<DeveloperSection />
<Footer />
```

**Step 3: Commit**

```bash
git add frontend/src/apps/ProductSite/components/DeveloperSection.tsx \
        frontend/src/apps/ProductSite/ProductSitePage.tsx
git commit -m "feat: developer section — API docs, Android apps, support"
```

---

## Task 9: Support chat widget — glassmorphism redesign

**Files:**
- Modify: `frontend/src/apps/ProductSite/ProductSitePage.tsx` — add a custom support widget scoped to the product site

**Context:** The existing `ChatWidget` uses a plain red circle with a speech bubble icon. For the product site we overlay a custom floating button that matches the OS aesthetic — dark glass, subtle glow, spark icon. When clicked it opens the existing chat (or scrolls to pricing for now).

**Step 1: Add the inline SupportFAB component to ProductSitePage.tsx**

At the top of `ProductSitePage.tsx`, add this component before the `export default`:

```tsx
import { Sparkles } from 'lucide-react'
import { motion } from 'framer-motion'

function SupportFAB() {
  const [hovered, setHovered] = React.useState(false)
  return (
    <motion.div
      className="fixed bottom-6 right-6 z-50 flex items-center gap-3"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 2, duration: 0.5 }}
    >
      {/* Label — shown on hover */}
      <motion.span
        className="text-xs font-medium px-3 py-2 rounded-xl whitespace-nowrap"
        style={{
          background: 'rgba(10,10,10,0.9)',
          border: '1px solid rgba(255,255,255,0.08)',
          backdropFilter: 'blur(12px)',
          color: '#D1D5DB',
        }}
        initial={{ opacity: 0, x: 8 }}
        animate={{ opacity: hovered ? 1 : 0, x: hovered ? 0 : 8 }}
        transition={{ duration: 0.2 }}
      >
        Chat with MaSoVa AI
      </motion.span>

      {/* FAB button */}
      <motion.button
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onClick={() => {
          // Open existing chat widget or scroll to contact
          const existing = document.querySelector('[aria-label="Open support chat"]') as HTMLButtonElement | null
          if (existing) existing.click()
        }}
        className="relative w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
        style={{
          background: 'rgba(12,12,12,0.9)',
          border: '1px solid rgba(192,57,43,0.3)',
          backdropFilter: 'blur(16px)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.05)',
        }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        aria-label="Open MaSoVa AI support"
      >
        {/* Breathing glow ring */}
        <motion.div
          className="absolute inset-0 rounded-2xl pointer-events-none"
          animate={{ opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
          style={{ boxShadow: '0 0 0 1px rgba(192,57,43,0.4), 0 0 20px rgba(192,57,43,0.12)' }}
        />
        <Sparkles size={20} style={{ color: '#C0392B', position: 'relative', zIndex: 1 }} />
      </motion.button>
    </motion.div>
  )
}
```

Then add `<SupportFAB />` inside the `#product-site` wrapper div (before the last closing tag).

**Step 2: Hide the original ChatWidget on the product site**

In ProductSitePage.tsx, add a `useEffect` that hides the existing chat button when on the product site:

```tsx
React.useEffect(() => {
  // Hide default chat widget on product site — we use SupportFAB instead
  const btn = document.querySelector('[aria-label="Open support chat"]') as HTMLElement | null
  if (btn) btn.style.display = 'none'
  return () => { if (btn) btn.style.display = '' }
}, [])
```

**Step 3: Verify visually**

Bottom right should show dark glass button with Sparkles icon. Hover shows "Chat with MaSoVa AI" label sliding in from right. Breathing glow ring pulses.

**Step 4: Commit**

```bash
git add frontend/src/apps/ProductSite/ProductSitePage.tsx
git commit -m "feat: product site support FAB — glassmorphism spark icon"
```

---

## Task 10: Footer — resolve all dead links + reduce red

**Files:**
- Modify: `frontend/src/apps/ProductSite/components/Footer.tsx`
- Modify: `frontend/src/apps/ProductSite/constants.ts` (reduce red accent usage globally)

**Step 1: Update FOOTER_LINKS with real hrefs in Footer.tsx**

Replace the `FOOTER_LINKS` object and link rendering:

```tsx
const FOOTER_LINKS = {
  Product: [
    { label: 'Features', href: '#features' },
    { label: 'AI Agents', href: '#ai-agents' },
    { label: 'Pricing', href: '#pricing' },
    { label: 'Changelog', href: '#' },
  ],
  Company: [
    { label: 'About', href: '#about' },
    { label: 'Blog', href: '#' },
    { label: 'Careers', href: '#' },
    { label: 'Android Apps', href: '#about' },
  ],
  Legal: [
    { label: 'Privacy Policy', href: '/privacy-policy' },
    { label: 'Terms of Service', href: '#' },
    { label: 'GDPR', href: '#' },
    { label: 'Cookie Policy', href: '#' },
  ],
  Support: [
    { label: 'Documentation', href: '#about' },
    { label: 'API Reference', href: 'http://localhost:8080/swagger-ui.html' },
    { label: 'Status', href: '#' },
    { label: 'Contact', href: '#' },
  ],
}
```

Update the link rendering to use real hrefs:
```tsx
{links.map(link => (
  <li key={link.label}>
    <a
      href={link.href}
      target={link.href.startsWith('http') ? '_blank' : undefined}
      rel={link.href.startsWith('http') ? 'noopener noreferrer' : undefined}
      className="text-gray-600 text-xs hover:text-gray-300 transition-colors"
    >
      {link.label}
    </a>
  </li>
))}
```

**Step 2: Tone down CTA banner — swap full red to dark with red accent**

Replace the CTA banner section background:
```tsx
// BEFORE:
<section className="py-24 px-6" style={{ background: '#E53E3E' }}>

// AFTER:
<section className="py-24 px-6" style={{ background: '#0D0D0D', borderTop: '1px solid rgba(192,57,43,0.15)' }}>

// And update text colors inside:
// h2: text-white (keep)
// p: text-gray-400 (was text-red-100)
// button: background #C0392B, color white (was white bg with red text)
```

**Step 3: Globally reduce red saturation in constants.ts**

In `STATS`, `PAIN_POINTS` (now replaced), `MARQUEE_ITEMS` — these use inline styles in their respective components. The primary change is in components: any `#E53E3E` used as a decorative icon color should become `#C0392B`. CTAs and active states keep `#C0392B`. Only primary action buttons stay bold red.

This is a find-and-replace across all ProductSite components:
```bash
# In frontend/src/apps/ProductSite/components/ change:
# rgba(229,62,62,...)  →  rgba(192,57,43,...)
# #E53E3E (decorative) → #C0392B
# Keep #E53E3E only for primary CTA buttons (hover states)
```

**Step 4: Commit**

```bash
git add frontend/src/apps/ProductSite/components/Footer.tsx \
        frontend/src/apps/ProductSite/components/
git commit -m "feat: footer real links, tone down red, CTA banner dark redesign"
```

---

## Task 11: TypeScript check + final build verification

**Step 1: Run TypeScript check**

```bash
cd frontend && npx tsc --noEmit 2>&1 | head -40
```
Expected: 0 errors (or only pre-existing unrelated errors outside ProductSite/).

**Step 2: Build**

```bash
npm run build 2>&1 | tail -20
```
Expected: Build succeeds, `dist/` generated, no ProductSite-related errors.

**Step 3: Full-page visual check with Playwright**

Use Playwright MCP browser:
1. Navigate to `http://localhost:3000`
2. Take full-page screenshot
3. Verify: Serif MaSoVa logo, hero has real screenshot, problem section has animated before/after, order flow timeline visible, 5 AI agent cards, features with screenshots, developer section, glass FAB bottom right, footer with real links

**Step 4: Final commit**

```bash
git add -A
git commit -m "feat: product site overhaul complete — real screenshots, 5 AI agents, infotainment sections, glass FAB, developer section"
git push
```

---

## Summary of Changes

| Section | What Changes |
|---|---|
| Logo | Playfair Display serif, matches customer app |
| Navbar | + About link |
| Hero | Real customer app screenshot in browser mock |
| Problem | Animated before/after live feeds (no icon cards) |
| Order Flow | NEW: 6-node animated timeline |
| AI Agents | 3 → 5 agents (+ Driver + Store Selection) in 2+3 grid |
| Features | Real screenshots + Store Selection + Driver App added |
| Developer | NEW: API docs + Android apps + support |
| Support FAB | Glass morphism spark icon, hides default widget |
| Footer | All dead links resolved, red toned down |
