import { useState, useEffect, useRef, useCallback } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Star, Clock, Bike, MessageCircle } from 'lucide-react'
import { realCustomerApp as app } from './realCustomerAppTheme'

interface Step {
  id: string
  label: string
}

const STEPS: Step[] = [
  { id: 'home', label: 'Home' },
  { id: 'menu', label: 'Menu' },
  { id: 'cart', label: 'Cart' },
  { id: 'tracking', label: 'Tracking' },
  { id: 'chat', label: 'Support Chat' },
]

const STEP_DURATION_MS = 3400

// EU sample data standing in for masova-mobile's real (India/₹) HomeScreen.tsx mock data —
// same component structure (hero carousel, category row, store cards), fake EU content.
const STORE_CARDS = [
  { name: 'MaSoVa Prenzlauer Berg', rating: 4.7, etaMin: 25, deliveryFee: 2.9, trending: true },
  { name: 'MaSoVa Kreuzberg', rating: 4.5, etaMin: 35, deliveryFee: 3.9, trending: false },
  { name: 'MaSoVa Mitte', rating: 4.6, etaMin: 20, deliveryFee: 1.9, trending: false },
]

const CATEGORIES = ['Schnitzel', 'Pizza', 'Pasta', 'Salads', 'Vegan', 'Drinks']

const MENU_ITEMS = [
  { name: 'Wiener Schnitzel', price: '€14.90' },
  { name: 'Margherita Pizza', price: '€10.90' },
  { name: 'Grilled Sea Bass', price: '€18.50' },
]

const CART_ITEMS = [
  { name: 'Wiener Schnitzel', qty: 1, price: '€14.90' },
  { name: 'Grilled Sea Bass', qty: 2, price: '€37.00' },
]

const CHAT_MESSAGES = [
  { role: 'agent' as const, text: "Hi! I'm MaSoVa's support assistant. I can help with order status, menu questions, complaints, and refunds. How can I help you today?" },
  { role: 'user' as const, text: 'Where is my order?' },
  { role: 'agent' as const, text: 'Your order is out for delivery — ETA 8 minutes. Want the live map?' },
]

type Size = 'compact' | 'default' | 'large'

const SCALE: Record<Size, { t1: string; t2: string; t3: string; t4: string; pad: number; frameH: number; phoneW: number }> = {
  compact: { t1: '7px', t2: '8px', t3: '9px', t4: '10px', pad: 8, frameH: 260, phoneW: 150 },
  default: { t1: '8px', t2: '9px', t3: '10px', t4: '12px', pad: 10, frameH: 320, phoneW: 180 },
  large: { t1: '11px', t2: '13px', t3: '15px', t4: '17px', pad: 16, frameH: 460, phoneW: 240 },
}

function HomeScreenMock({ s }: { s: typeof SCALE[Size] }) {
  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div
        className="rounded-md relative flex-shrink-0 flex flex-col justify-end"
        style={{ height: s.frameH * 0.28, background: 'linear-gradient(180deg, transparent 40%, rgba(0,0,0,0.75) 100%), linear-gradient(135deg, #3a2a00, #1a1200)' }}
      >
        <div style={{ padding: s.pad * 0.6 }}>
          <p className="font-bold text-white" style={{ fontSize: s.t3 }}>Fresh European, delivered</p>
          <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: s.t1 }}>Hot food at your door</p>
        </div>
      </div>
      <p className="font-semibold mt-2 mb-1" style={{ color: app.text1, fontSize: s.t2 }}>What are you craving?</p>
      <div className="flex gap-1.5 overflow-hidden mb-2">
        {CATEGORIES.map((c) => (
          <div key={c} className="rounded-full flex-shrink-0 flex items-center justify-center" style={{ background: app.surface2, padding: `${s.pad * 0.35}px ${s.pad * 0.6}px` }}>
            <span style={{ color: app.text1, fontSize: s.t1 }}>{c}</span>
          </div>
        ))}
      </div>
      <p className="font-semibold mb-1" style={{ color: app.text1, fontSize: s.t2 }}>Popular Near You</p>
      <div className="flex flex-col gap-1.5 flex-1 overflow-hidden">
        {STORE_CARDS.map((store) => (
          <div key={store.name} className="rounded-md" style={{ background: app.surface1, border: `1px solid ${app.border}`, padding: s.pad * 0.5 }}>
            <div className="flex items-center justify-between">
              <span className="font-semibold" style={{ color: app.text1, fontSize: s.t2 }}>{store.name}</span>
              {store.trending && (
                <span className="rounded-full px-1.5 py-0.5" style={{ background: app.accent, color: app.onAccent, fontSize: s.t1, fontWeight: 700 }}>Trending</span>
              )}
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span className="flex items-center gap-0.5" style={{ color: app.text2, fontSize: s.t1 }}><Star size={10} color="#F59E0B" />{store.rating}</span>
              <span className="flex items-center gap-0.5" style={{ color: app.text2, fontSize: s.t1 }}><Clock size={10} color={app.text3} />{store.etaMin} min</span>
              <span className="flex items-center gap-0.5" style={{ color: app.text2, fontSize: s.t1 }}><Bike size={10} color={app.text3} />€{store.deliveryFee.toFixed(2)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function MenuScreenMock({ s }: { s: typeof SCALE[Size] }) {
  return (
    <div className="flex flex-col h-full gap-1.5">
      <p className="font-semibold" style={{ color: app.text1, fontSize: s.t3 }}>Menu</p>
      {MENU_ITEMS.map((item) => (
        <div key={item.name} className="rounded-md flex items-center justify-between" style={{ background: app.surface1, border: `1px solid ${app.border}`, padding: s.pad * 0.5 }}>
          <span style={{ color: app.text1, fontSize: s.t2 }}>{item.name}</span>
          <span className="font-semibold" style={{ color: app.accent, fontSize: s.t2 }}>{item.price}</span>
        </div>
      ))}
    </div>
  )
}

function CartScreenMock({ s }: { s: typeof SCALE[Size] }) {
  const total = CART_ITEMS.reduce((sum, i) => sum + i.qty * parseFloat(i.price.replace('€', '')), 0)
  return (
    <div className="flex flex-col h-full gap-1.5">
      <p className="font-semibold" style={{ color: app.text1, fontSize: s.t3 }}>Your Cart</p>
      {CART_ITEMS.map((item) => (
        <div key={item.name} className="rounded-md flex items-center justify-between" style={{ background: app.surface1, border: `1px solid ${app.border}`, padding: s.pad * 0.5 }}>
          <span style={{ color: app.text1, fontSize: s.t2 }}>{item.qty}× {item.name}</span>
          <span style={{ color: app.text2, fontSize: s.t2 }}>{item.price}</span>
        </div>
      ))}
      <div className="mt-auto rounded-md flex items-center justify-between" style={{ background: app.accent, padding: s.pad * 0.5 }}>
        <span className="font-bold" style={{ color: app.onAccent, fontSize: s.t2 }}>Checkout</span>
        <span className="font-bold" style={{ color: app.onAccent, fontSize: s.t3 }}>€{total.toFixed(2)}</span>
      </div>
    </div>
  )
}

function TrackingScreenMock({ s }: { s: typeof SCALE[Size] }) {
  return (
    <div className="flex flex-col h-full gap-2">
      <p className="font-semibold" style={{ color: app.text1, fontSize: s.t3 }}>Order #A3F9K2 — Out for delivery</p>
      <div className="flex-1 rounded-md relative overflow-hidden" style={{ background: app.surface1, border: `1px solid ${app.border}` }}>
        <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
          <path d="M 10 60 Q 80 15 190 40" stroke={app.accent} strokeWidth="2" strokeDasharray="4 4" fill="none" opacity="0.8" />
        </svg>
        <span className="absolute px-1.5 py-0.5 rounded flex items-center gap-1" style={{ left: 6, top: 6, background: 'rgba(0,0,0,0.6)', fontSize: s.t1 }}>
          <span className="w-1 h-1 rounded-full inline-block" style={{ background: app.success }} />
          <span style={{ color: '#fff' }}>Live</span>
        </span>
      </div>
      <div className="rounded-md flex items-center justify-between" style={{ background: app.surface1, border: `1px solid ${app.border}`, padding: s.pad * 0.5 }}>
        <span style={{ color: app.text2, fontSize: s.t1 }}>Driver: Marco</span>
        <span className="font-semibold" style={{ color: app.accent, fontSize: s.t2 }}>8 min</span>
      </div>
    </div>
  )
}

function ChatScreenMock({ s }: { s: typeof SCALE[Size] }) {
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 rounded-md mb-1.5" style={{ background: app.accent, padding: s.pad * 0.5 }}>
        <div className="rounded-full flex items-center justify-center" style={{ width: s.pad * 1.4, height: s.pad * 1.4, background: 'rgba(0,0,0,0.15)' }}>
          <span style={{ color: app.onAccent, fontSize: s.t2, fontWeight: 700 }}>M</span>
        </div>
        <div>
          <p className="font-bold" style={{ color: app.onAccent, fontSize: s.t2 }}>MaSoVa Support</p>
          <p style={{ color: 'rgba(0,0,0,0.6)', fontSize: s.t1 }}>AI assistant · usually instant</p>
        </div>
      </div>
      <div className="flex-1 flex flex-col gap-1.5 overflow-hidden">
        {CHAT_MESSAGES.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start gap-1.5'}`}>
            {msg.role === 'agent' && (
              <div className="rounded-full flex items-center justify-center flex-shrink-0" style={{ width: s.pad * 1.1, height: s.pad * 1.1, background: app.accent }}>
                <span style={{ color: app.onAccent, fontSize: s.t1, fontWeight: 700 }}>M</span>
              </div>
            )}
            <div
              className="rounded-2xl max-w-[75%]"
              style={{
                padding: `${s.pad * 0.4}px ${s.pad * 0.6}px`,
                background: msg.role === 'user' ? app.accent : app.surface2,
                color: msg.role === 'user' ? app.onAccent : app.text1,
                fontSize: s.t1,
              }}
            >
              {msg.text}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

const SCREENS: Record<string, (props: { s: typeof SCALE[Size] }) => React.JSX.Element> = {
  home: HomeScreenMock,
  menu: MenuScreenMock,
  cart: CartScreenMock,
  tracking: TrackingScreenMock,
  chat: ChatScreenMock,
}

export default function CustomerAppMockup({ size = 'default' }: { size?: Size }) {
  const [active, setActive] = useState(0)
  const [paused, setPaused] = useState(false)
  const sectionRef = useRef<HTMLDivElement>(null)
  const intervalRef = useRef<number | null>(null)

  const clearTimer = useCallback(() => {
    if (intervalRef.current) {
      window.clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [])

  useEffect(() => {
    const el = sectionRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !paused) {
          clearTimer()
          intervalRef.current = window.setInterval(() => {
            setActive((prev) => (prev + 1) % STEPS.length)
          }, STEP_DURATION_MS)
        } else {
          clearTimer()
        }
      },
      { threshold: 0.4 },
    )
    observer.observe(el)
    return () => {
      observer.disconnect()
      clearTimer()
    }
  }, [paused, clearTimer])

  const handleStepClick = (i: number) => {
    setPaused(true)
    clearTimer()
    setActive(i)
  }

  const Screen = SCREENS[STEPS[active].id]
  const s = SCALE[size]

  return (
    <div ref={sectionRef} className="flex flex-col items-center gap-3">
      <div
        className="rounded-[2rem] overflow-hidden flex-shrink-0"
        style={{ width: s.phoneW, border: '1px solid rgba(255,255,255,0.12)', boxShadow: '0 24px 64px rgba(0,0,0,0.5)' }}
      >
        <div className="relative" style={{ height: 18, background: '#000' }}>
          <div className="absolute rounded-full" style={{ left: '50%', top: 4, transform: 'translateX(-50%)', width: s.phoneW * 0.3, height: 8, background: '#000', border: '1px solid #222' }} />
        </div>
        <div style={{ padding: s.pad, background: app.bg, height: s.frameH }}>
          <AnimatePresence mode="wait">
            <motion.div
              key={STEPS[active].id}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.25 }}
              style={{ height: '100%' }}
            >
              <Screen s={s} />
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      <div className="flex items-center justify-center gap-1.5 flex-wrap">
        {STEPS.map((step, i) => (
          <button key={step.id} type="button" onClick={() => handleStepClick(i)} className="flex items-center gap-1 group">
            <span
              className="rounded-full transition-all duration-200"
              style={{ width: active === i ? 16 : 6, height: 6, background: active === i ? app.accent : app.surface3 }}
            />
            <span className="whitespace-nowrap transition-colors" style={{ color: active === i ? app.accent : app.text3, fontSize: 9 }}>
              {step.id === 'chat' ? <MessageCircle size={9} className="inline mr-0.5" /> : null}
              {step.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}
