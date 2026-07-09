import { useState, useEffect, useRef, useCallback } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Truck } from 'lucide-react'
import { realApp } from './realAppTheme'

interface Step {
  id: string
  label: string
}

const STEPS: Step[] = [
  { id: 'menu', label: 'Menu' },
  { id: 'cart', label: 'Cart' },
  { id: 'checkout', label: 'Checkout' },
  { id: 'signin', label: 'Sign In' },
  { id: 'payment', label: 'Payment' },
  { id: 'tracking', label: 'Tracking' },
  { id: 'profile', label: 'Profile' },
]

// Mirrors real ProfilePage.tsx TIER_CONFIG — EU customer, EU loyalty program
const PROFILE_NAV = ['Overview', 'Personal Info', 'Addresses', 'Food Preferences', 'Notifications']

const STEP_DURATION_MS = 3400

const MENU_ITEMS = [
  { name: 'Wiener Schnitzel', price: '€14.90', dietary: 'Non-Veg', qty: 1 },
  { name: 'Margherita Pizza', price: '€10.90', dietary: 'Vegetarian', qty: 0 },
  { name: 'Grilled Sea Bass', price: '€18.50', dietary: 'Non-Veg', qty: 2 },
  { name: 'Ratatouille', price: '€9.20', dietary: 'Vegan', qty: 0 },
]

const CART_ITEMS = MENU_ITEMS.filter((i) => i.qty > 0)
const SUBTOTAL = CART_ITEMS.reduce((sum, i) => sum + parseFloat(i.price.replace('€', '')) * i.qty, 0)
const DELIVERY = 2.9
const TAX = (SUBTOTAL + DELIVERY) * 0.19
const TOTAL = SUBTOTAL + DELIVERY + TAX

// Mirrors real TrackingPage.tsx's DELIVERY_STEPS + vertical numbered timeline
const TRACKING_STEPS = [
  { label: 'Order Placed', desc: 'Restaurant received your order' },
  { label: 'Preparing', desc: 'Kitchen is getting started' },
  { label: 'Ready', desc: 'Packed and ready to go' },
  { label: 'Out for Delivery', desc: 'Driver is on the way to you' },
  { label: 'Delivered', desc: 'Enjoy your meal!' },
]
const TRACKING_ACTIVE_INDEX = 3

function dietaryColor(d: string) {
  if (d === 'Vegan') return realApp.success
  if (d === 'Vegetarian') return '#2e7d32'
  return realApp.red
}

type Size = 'compact' | 'default' | 'large'

const SCALE: Record<Size, { t1: string; t2: string; t3: string; t4: string; gap: string; pad: number; sidebar: string; mapH: string; frameH: number }> = {
  compact: { t1: '7px', t2: '8px', t3: '9px', t4: '10px', gap: 'gap-1', pad: 8, sidebar: 'w-[74px]', mapH: 'h-12', frameH: 175 },
  default: { t1: '7px', t2: '8px', t3: '9px', t4: '10px', gap: 'gap-1.5', pad: 10, sidebar: 'w-[74px]', mapH: 'h-14', frameH: 200 },
  large: { t1: '11px', t2: '13px', t3: '15px', t4: '17px', gap: 'gap-3', pad: 20, sidebar: 'w-[130px]', mapH: 'h-24', frameH: 360 },
}

// Mirrors real MenuPage.tsx: left sidebar (Cuisine filter, Category filter, Dietary filter),
// sticky search bar, item cards with circular plate icon, dietary badge, prep time, qty controls.
function MenuScreen({ s }: { s: typeof SCALE[Size] }) {
  return (
    <div className="flex h-full">
      <div className={`${s.sidebar} flex-shrink-0 flex flex-col gap-2 pr-3 overflow-hidden`} style={{ borderRight: `1px solid ${realApp.border}` }}>
        <div>
          <p className="uppercase tracking-wide mb-1" style={{ color: realApp.text3, fontSize: s.t1 }}>Cuisine</p>
          {['Continental', 'Italian'].map((c, i) => (
            <span
              key={c}
              className="block px-2 py-1 rounded-md mb-1"
              style={i === 0 ? { background: 'rgba(212,168,67,0.12)', color: realApp.gold, border: `1px solid ${realApp.gold}`, fontSize: s.t1 } : { color: realApp.text2, border: `1px solid ${realApp.border}`, fontSize: s.t1 }}
            >
              {c}
            </span>
          ))}
        </div>
        <div>
          <p className="uppercase tracking-wide mb-1" style={{ color: realApp.text3, fontSize: s.t1 }}>Dietary</p>
          {['All', 'Vegetarian', 'Vegan'].map((d, i) => (
            <span
              key={d}
              className="block px-2 py-1 rounded-md mb-1"
              style={i === 0 ? { background: 'rgba(212,168,67,0.12)', color: realApp.gold, border: `1px solid ${realApp.gold}`, fontSize: s.t1 } : { color: realApp.text2, border: `1px solid ${realApp.border}`, fontSize: s.t1 }}
            >
              {d}
            </span>
          ))}
        </div>
      </div>
      <div className={`flex-1 pl-3 flex flex-col ${s.gap} overflow-hidden`}>
        <div className="rounded-full" style={{ background: realApp.surface2, border: `1px solid ${realApp.border}`, padding: `${s.pad * 0.35}px ${s.pad * 0.6}px` }}>
          <span style={{ color: realApp.text3, fontSize: s.t1 }}>Search for dishes…</span>
        </div>
        <p className="font-semibold" style={{ color: realApp.text1, fontFamily: realApp.fontDisplay, fontSize: s.t3 }}>Continental</p>
        {/* Real MenuPage.tsx uses a card grid (auto-fill, minmax 280px), not a vertical list */}
        <div className="grid grid-cols-2 gap-2 flex-1 overflow-hidden">
          {MENU_ITEMS.map((item) => (
            <div key={item.name} className="rounded-md flex flex-col overflow-hidden" style={{ background: realApp.surface, border: `1px solid ${realApp.border}` }}>
              <div
                className="flex items-center justify-center"
                style={{ height: s.pad * 2.2, background: realApp.surface2 }}
              >
                <div
                  className="rounded-full"
                  style={{ width: s.pad * 1.3, height: s.pad * 1.3, background: 'radial-gradient(circle at 38% 32%, rgba(212,168,67,0.25) 0%, rgba(212,168,67,0.05) 50%, transparent 100%)', border: '1px solid rgba(212,168,67,0.18)' }}
                />
              </div>
              <div style={{ padding: s.pad * 0.5 }}>
                <span className="font-semibold block" style={{ color: realApp.text1, fontSize: s.t2 }}>{item.name}</span>
                <div className="flex items-center gap-1 mt-1 flex-wrap">
                  <span className="px-1.5 py-0.5 rounded-full text-white" style={{ background: dietaryColor(item.dietary), fontSize: s.t1 }}>
                    {item.dietary}
                  </span>
                  {item.qty > 0 && (
                    <span className="px-1.5 py-0.5 rounded-full" style={{ background: realApp.red, color: '#fff', fontSize: s.t1 }}>
                      {item.qty} in cart
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between mt-1.5 pt-1.5" style={{ borderTop: `1px solid ${realApp.border}` }}>
                  <span className="font-bold" style={{ color: realApp.gold, fontSize: s.t2 }}>{item.price}</span>
                  <span className="rounded-full px-2 py-0.5 font-semibold text-white" style={{ background: item.qty > 0 ? realApp.success : realApp.red, fontSize: s.t1 }}>
                    {item.qty > 0 ? '✓ Added' : 'Add'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// Real CartDrawer.tsx is a fixed right-side slide-over, not a centered page — mirrored here
// as an overlay + drawer within the frame to stay faithful to the actual component.
function CartScreen({ s }: { s: typeof SCALE[Size] }) {
  return (
    <div className="h-full relative">
      <div className="absolute inset-0 rounded-md" style={{ background: 'rgba(0,0,0,0.5)' }} />
      <div
        className={`absolute right-0 top-0 bottom-0 flex flex-col ${s.gap}`}
        style={{ width: '62%', background: realApp.surface2, borderLeft: `1px solid ${realApp.border}`, padding: s.pad, boxShadow: '-8px 0 24px rgba(0,0,0,0.5)' }}
      >
        <div className="flex items-center justify-between pb-2" style={{ borderBottom: `1px solid ${realApp.border}` }}>
          <p className="font-bold" style={{ color: realApp.text1, fontFamily: realApp.fontDisplay, fontSize: s.t4 }}>Your Order</p>
          <span style={{ color: realApp.text3, fontSize: s.t1 }}>{CART_ITEMS.length} items</span>
        </div>
        <div className={`flex flex-col ${s.gap}`}>
          {CART_ITEMS.map((it) => (
            <div key={it.name} className="rounded-md px-3 py-2 flex items-center justify-between" style={{ background: realApp.surface, border: `1px solid ${realApp.border}` }}>
              <span style={{ color: realApp.text1, fontSize: s.t3 }}>{it.qty}× {it.name}</span>
              <span className="font-semibold" style={{ color: realApp.gold, fontSize: s.t3 }}>{it.price}</span>
            </div>
          ))}
        </div>
        <div className="mt-auto rounded-md" style={{ background: realApp.surface, border: `1px solid ${realApp.border}`, padding: s.pad }}>
          {[['Subtotal', `€${SUBTOTAL.toFixed(2)}`], ['Delivery fee', `€${DELIVERY.toFixed(2)}`], ['VAT (DE · 19%)', `€${TAX.toFixed(2)}`]].map(([k, v]) => (
            <div key={k} className="flex items-center justify-between py-1">
              <span style={{ color: realApp.text3, fontSize: s.t2 }}>{k}</span>
              <span style={{ color: realApp.text2, fontSize: s.t2 }}>{v}</span>
            </div>
          ))}
          <div className="flex items-center justify-between mt-1 pt-1" style={{ borderTop: `1px solid ${realApp.border}` }}>
            <span className="font-bold" style={{ color: realApp.text1, fontFamily: realApp.fontDisplay, fontSize: s.t3 }}>Total</span>
            <span className="font-bold" style={{ color: realApp.gold, fontFamily: realApp.fontDisplay, fontSize: s.t4 }}>€{TOTAL.toFixed(2)}</span>
          </div>
        </div>
        <div className="rounded-full text-center font-bold text-white" style={{ background: realApp.red, padding: `${s.pad * 0.6}px 0`, fontSize: s.t3 }}>
          Proceed to Checkout →
        </div>
      </div>
    </div>
  )
}

// Mirrors real CheckoutPage.tsx: 3 option cards (Sign In / Create Account / Guest Checkout)
function CheckoutScreen({ s }: { s: typeof SCALE[Size] }) {
  const options = [
    { title: 'Sign In', sub: 'Access saved addresses & order history', accent: realApp.gold },
    { title: 'Create Account', sub: 'Faster future checkouts', accent: realApp.red },
    { title: 'Guest Checkout', sub: 'No registration required', accent: realApp.borderStrong },
  ]
  return (
    <div className={`flex flex-col h-full ${s.gap}`}>
      <p className="font-bold" style={{ color: realApp.text1, fontFamily: realApp.fontDisplay, fontSize: s.t4 }}>Checkout</p>
      <p style={{ color: realApp.text3, fontSize: s.t1 }}>Choose how you'd like to continue with your order</p>
      <div className={`flex flex-col ${s.gap} flex-1`}>
        {options.map((opt) => (
          <div
            key={opt.title}
            className="rounded-md"
            style={{ background: realApp.surface, border: `1px solid ${realApp.border}`, borderTop: `3px solid ${opt.accent}`, padding: s.pad * 0.6 }}
          >
            <span className="font-semibold block" style={{ color: realApp.text1, fontSize: s.t3 }}>{opt.title}</span>
            <span className="block mt-0.5" style={{ color: realApp.text3, fontSize: s.t1 }}>{opt.sub}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// Mirrors real CustomerLoginPage.tsx: centered card, gold top border, MaSoVa wordmark,
// email/password fields, Remember me, red submit, divider, Google button, Create Account link.
function SignInScreen({ s }: { s: typeof SCALE[Size] }) {
  return (
    <div className="h-full flex items-center justify-center">
      <div
        className="rounded-md w-full"
        style={{ background: realApp.surface, border: `1px solid ${realApp.border}`, borderTop: `3px solid ${realApp.gold}`, padding: s.pad, maxWidth: 280 }}
      >
        <div className="text-center mb-2">
          <p className="font-bold" style={{ color: realApp.gold, fontFamily: realApp.fontDisplay, fontSize: s.t3 }}>MaSoVa</p>
          <p className="font-bold" style={{ color: realApp.text1, fontFamily: realApp.fontDisplay, fontSize: s.t3 }}>Welcome back</p>
          <p style={{ color: realApp.text3, fontSize: s.t1 }}>Sign in to continue with your order</p>
        </div>

        <div className={`flex flex-col ${s.gap}`}>
          <div>
            <p className="uppercase tracking-wide mb-1" style={{ color: realApp.text3, fontSize: s.t1 }}>Email Address</p>
            <div className="rounded" style={{ background: realApp.surface2, border: `1px solid ${realApp.border}`, height: s.pad * 0.9 }} />
          </div>
          <div>
            <p className="uppercase tracking-wide mb-1" style={{ color: realApp.text3, fontSize: s.t1 }}>Password</p>
            <div className="rounded" style={{ background: realApp.surface2, border: `1px solid ${realApp.border}`, height: s.pad * 0.9 }} />
          </div>
          <div className="flex items-center gap-1.5">
            <div className="rounded-sm" style={{ width: s.pad * 0.35, height: s.pad * 0.35, border: `1px solid ${realApp.gold}` }} />
            <span style={{ color: realApp.text2, fontSize: s.t1 }}>Remember me</span>
          </div>
          <div className="rounded-full text-center font-bold text-white" style={{ background: realApp.red, padding: `${s.pad * 0.5}px 0`, fontSize: s.t2 }}>
            Login & Continue →
          </div>
        </div>

        <div className="flex items-center gap-2 my-2">
          <div className="flex-1 h-px" style={{ background: realApp.border }} />
          <span style={{ color: realApp.text3, fontSize: s.t1 }}>or continue with</span>
          <div className="flex-1 h-px" style={{ background: realApp.border }} />
        </div>
        <div className="rounded flex items-center justify-center gap-1.5" style={{ background: '#1a1a1a', border: `1px solid ${realApp.border}`, padding: `${s.pad * 0.4}px 0` }}>
          <span style={{ color: realApp.text2, fontSize: s.t1 }}>G  Sign in with Google</span>
        </div>

        <p className="text-center mt-2" style={{ color: realApp.text3, fontSize: s.t1 }}>
          Don't have an account? <span style={{ color: realApp.gold }}>Create Account</span>
        </p>
      </div>
    </div>
  )
}

// Mirrors real PaymentPage.tsx: Order Type (Delivery/Takeaway/Dine-in) then Payment Method list
function PaymentScreen({ s }: { s: typeof SCALE[Size] }) {
  const orderTypes = [
    { label: 'Delivery', sub: `+€${DELIVERY.toFixed(2)}`, active: true },
    { label: 'Takeaway', sub: 'No fee', active: false },
    { label: 'Dine In', sub: 'At restaurant', active: false },
  ]
  return (
    <div className={`flex flex-col h-full ${s.gap}`}>
      <p className="font-bold" style={{ color: realApp.text1, fontFamily: realApp.fontDisplay, fontSize: s.t4 }}>Complete Your Order</p>

      <div>
        <p className="uppercase tracking-wide mb-1.5" style={{ color: realApp.text3, fontSize: s.t1 }}>Order Type</p>
        <div className="grid grid-cols-3 gap-1.5">
          {orderTypes.map((t) => (
            <div
              key={t.label}
              className="rounded-md text-center"
              style={{ background: t.active ? 'rgba(212,168,67,0.08)' : realApp.surface, border: `1px solid ${t.active ? realApp.gold : realApp.border}`, padding: s.pad * 0.5 }}
            >
              <p className="font-semibold" style={{ color: t.active ? realApp.gold : realApp.text2, fontSize: s.t2 }}>{t.label}</p>
              <p style={{ color: realApp.text3, fontSize: s.t1 }}>{t.sub}</p>
            </div>
          ))}
        </div>
      </div>

      <div>
        <p className="uppercase tracking-wide mb-1.5" style={{ color: realApp.text3, fontSize: s.t1 }}>Payment Method</p>
        <div className="rounded-md flex items-center justify-between" style={{ background: 'rgba(212,168,67,0.08)', border: `1.5px solid ${realApp.gold}`, padding: s.pad * 0.6 }}>
          <span className="font-semibold" style={{ color: realApp.text1, fontSize: s.t3 }}>Credit / Debit Card</span>
          <span className="rounded px-1.5 py-0.5 font-bold" style={{ background: '#635BFF22', color: '#8b85ff', fontSize: s.t1 }}>stripe</span>
        </div>
      </div>

      <div className="mt-auto flex items-center justify-between">
        <span style={{ color: realApp.text3, fontSize: s.t2 }}>Total due</span>
        <span className="font-bold" style={{ color: realApp.gold, fontFamily: realApp.fontDisplay, fontSize: s.t4 }}>€{TOTAL.toFixed(2)}</span>
      </div>
      <div className="rounded-full text-center font-bold text-white" style={{ background: realApp.red, padding: `${s.pad * 0.6}px 0`, fontSize: s.t3 }}>
        Place Order · Pay €{TOTAL.toFixed(2)}
      </div>
    </div>
  )
}

// Mirrors real TrackingPage.tsx: hero status bar, driver card, vertical numbered
// timeline (left) + sticky order reference card (right) — two-column layout.
function TrackingScreen({ s }: { s: typeof SCALE[Size] }) {
  return (
    <div className={`flex flex-col h-full ${s.gap}`}>
      <div
        className="rounded-md flex items-center gap-2"
        style={{ background: 'rgba(59,130,246,0.07)', border: '1px solid rgba(59,130,246,0.2)', padding: s.pad * 0.6 }}
      >
        <div
          className="rounded-full flex items-center justify-center flex-shrink-0"
          style={{ width: s.pad * 1.4, height: s.pad * 1.4, background: 'rgba(59,130,246,0.12)', border: '2px solid rgba(59,130,246,0.35)' }}
        >
          <Truck size={s.pad * 0.6} style={{ color: '#60a5fa' }} />
        </div>
        <div className="flex-1">
          <p className="uppercase tracking-wide" style={{ color: realApp.text3, fontSize: s.t1 }}>Current Status</p>
          <p className="font-bold" style={{ color: realApp.text1, fontFamily: realApp.fontDisplay, fontSize: s.t4 }}>Out for Delivery</p>
        </div>
        <div className="rounded-md text-center flex-shrink-0" style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.25)', padding: `${s.pad * 0.4}px ${s.pad * 0.6}px` }}>
          <p className="uppercase tracking-wide" style={{ color: realApp.text3, fontSize: s.t1 }}>Arrives in</p>
          <p className="font-bold" style={{ color: '#60a5fa', fontFamily: realApp.fontDisplay, fontSize: s.t4 }}>8 min</p>
        </div>
      </div>

      <div className="flex gap-2 flex-1 overflow-hidden">
        {/* Left: vertical timeline */}
        <div className="flex-1 rounded-md" style={{ background: realApp.surface, border: `1px solid ${realApp.border}`, padding: s.pad * 0.7 }}>
          <p className="font-semibold mb-1.5" style={{ color: realApp.text1, fontFamily: realApp.fontDisplay, fontSize: s.t2 }}>Order Progress</p>
          {TRACKING_STEPS.map((step, i) => {
            const isCompleted = i < TRACKING_ACTIVE_INDEX
            const isActive = i === TRACKING_ACTIVE_INDEX
            return (
              <div key={step.label} className="flex gap-1.5">
                <div className="flex flex-col items-center flex-shrink-0">
                  <div
                    className="rounded-full flex items-center justify-center flex-shrink-0"
                    style={{
                      width: s.pad * 0.7,
                      height: s.pad * 0.7,
                      background: isCompleted ? 'rgba(34,197,94,0.15)' : isActive ? 'rgba(59,130,246,0.15)' : 'transparent',
                      border: `1.5px solid ${isCompleted ? '#22c55e' : isActive ? '#60a5fa' : realApp.border}`,
                      color: isCompleted ? '#22c55e' : isActive ? '#60a5fa' : realApp.text3,
                    }}
                  >
                    <span style={{ fontSize: s.t1, fontWeight: 700 }}>{isCompleted ? '✓' : i + 1}</span>
                  </div>
                  {i < TRACKING_STEPS.length - 1 && (
                    <div style={{ width: 2, flex: 1, minHeight: s.pad * 0.6, background: isCompleted ? 'rgba(34,197,94,0.4)' : realApp.border }} />
                  )}
                </div>
                <div style={{ paddingBottom: i < TRACKING_STEPS.length - 1 ? s.pad * 0.5 : 0 }}>
                  <p style={{ color: isActive ? realApp.text1 : isCompleted ? realApp.text2 : realApp.text3, fontSize: s.t1, fontWeight: isActive ? 700 : 500 }}>
                    {step.label}
                  </p>
                </div>
              </div>
            )
          })}
        </div>

        {/* Right: order reference + driver */}
        <div className="flex-1 flex flex-col gap-1.5">
          <div className="rounded-md" style={{ background: realApp.surface, border: `1px solid ${realApp.border}`, padding: s.pad * 0.6 }}>
            <p className="uppercase tracking-wide" style={{ color: realApp.text3, fontSize: s.t1 }}>Order Reference</p>
            <p className="font-bold" style={{ color: realApp.gold, fontFamily: realApp.fontDisplay, fontSize: s.t3 }}>#A3F9K2LM</p>
          </div>
          <div className="rounded-md flex-1" style={{ background: realApp.surface, border: `1px solid ${realApp.border}`, padding: s.pad * 0.6 }}>
            <p className="uppercase tracking-wide" style={{ color: realApp.text3, fontSize: s.t1 }}>Your Driver</p>
            <p className="font-semibold" style={{ color: realApp.text1, fontSize: s.t2 }}>Marco</p>
            <span className="inline-flex items-center gap-1 mt-1 px-1.5 py-0.5 rounded-full" style={{ background: 'rgba(34,197,94,0.12)', color: '#4ade80', fontSize: s.t1 }}>
              <Truck size={s.t1 === '7px' ? 8 : 10} /> Call Driver
            </span>
          </div>
        </div>
      </div>

      <div className={`rounded-md relative overflow-hidden ${s.mapH}`} style={{ background: realApp.surface2, border: `1px solid ${realApp.border}` }}>
        <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
          <path d="M 10 45 Q 80 10 190 30" stroke="#60a5fa" strokeWidth="2" strokeDasharray="4 4" fill="none" opacity="0.7" />
        </svg>
        <span className="absolute w-2.5 h-2.5 rounded-full" style={{ left: '75%', top: '25%', background: realApp.red }} />
        <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded flex items-center gap-1" style={{ background: 'rgba(0,0,0,0.7)', fontSize: s.t1 }}>
          <span className="w-1 h-1 rounded-full inline-block" style={{ background: '#4ade80' }} />
          <span style={{ color: '#fff' }}>Live driver location</span>
        </span>
      </div>
    </div>
  )
}

// Mirrors real ProfilePage.tsx: left nav (Overview/Personal Info/Addresses/Food
// Preferences/Notifications), Gold-tier gradient loyalty card with points progress bar.
function ProfileScreen({ s }: { s: typeof SCALE[Size] }) {
  const points = 6200
  const threshold = 10000
  const progress = Math.min((points / threshold) * 100, 100)
  return (
    <div className="flex h-full">
      <div className={`${s.sidebar} flex-shrink-0 flex flex-col gap-1 pr-3`} style={{ borderRight: `1px solid ${realApp.border}` }}>
        {PROFILE_NAV.map((label, i) => (
          <span
            key={label}
            className="px-2 py-1 rounded-md"
            style={i === 0 ? { background: 'rgba(212,168,67,0.12)', color: realApp.gold, border: `1px solid ${realApp.gold}`, fontSize: s.t1 } : { color: realApp.text2, border: '1px solid transparent', fontSize: s.t1 }}
          >
            {label}
          </span>
        ))}
      </div>
      <div className={`flex-1 pl-3 flex flex-col ${s.gap}`}>
        <p className="font-semibold" style={{ color: realApp.text1, fontFamily: realApp.fontDisplay, fontSize: s.t3 }}>Overview</p>
        <div
          className="rounded-md"
          style={{ background: 'linear-gradient(135deg, #1C1600 0%, #2E2200 50%, #100D00 100%)', border: `1px solid ${realApp.gold}44`, padding: s.pad }}
        >
          <div className="flex items-center justify-between">
            <span className="uppercase tracking-wide" style={{ color: realApp.goldLight, fontSize: s.t1 }}>Gold Member</span>
            <span className="font-bold" style={{ color: realApp.goldLight, fontSize: s.t2 }}>{points.toLocaleString()} pts</span>
          </div>
          <div className="rounded-full mt-2 overflow-hidden" style={{ background: 'rgba(255,255,255,0.1)', height: 5 }}>
            <div className="h-full rounded-full" style={{ width: `${progress}%`, background: realApp.gold }} />
          </div>
          <p className="mt-1.5" style={{ color: realApp.text3, fontSize: s.t1 }}>{(threshold - points).toLocaleString()} pts to Platinum</p>
        </div>
        <div className="rounded-md" style={{ background: realApp.surface, border: `1px solid ${realApp.border}`, padding: s.pad * 0.6 }}>
          <p className="uppercase tracking-wide mb-1" style={{ color: realApp.text3, fontSize: s.t1 }}>Delivery Address</p>
          <p style={{ color: realApp.text1, fontSize: s.t2 }}>Torstraße 12, 10119 Berlin, Germany</p>
        </div>
        <div className="rounded-md flex-1" style={{ background: realApp.surface, border: `1px solid ${realApp.border}`, padding: s.pad * 0.6 }}>
          <p className="uppercase tracking-wide mb-1" style={{ color: realApp.text3, fontSize: s.t1 }}>Food Preferences</p>
          <div className="flex flex-wrap gap-1">
            {['Vegetarian', 'Gluten-Free'].map((p) => (
              <span key={p} className="px-1.5 py-0.5 rounded-full" style={{ background: 'rgba(212,168,67,0.12)', color: realApp.gold, border: `1px solid ${realApp.gold}44`, fontSize: s.t1 }}>{p}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

const SCREENS: Record<string, (props: { s: typeof SCALE[Size] }) => React.JSX.Element> = {
  menu: MenuScreen,
  cart: CartScreen,
  checkout: CheckoutScreen,
  signin: SignInScreen,
  payment: PaymentScreen,
  tracking: TrackingScreen,
  profile: ProfileScreen,
}

export default function RealAppMockup({ size = 'default' }: { size?: Size }) {
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
  const isLarge = size === 'large'

  return (
    <div ref={sectionRef} className="flex flex-col items-center gap-4">
      {/* Laptop frame */}
      <div style={{ width: '100%' }}>
        <div
          className="rounded-t-xl overflow-hidden"
          style={{ border: `1px solid ${realApp.borderStrong}`, borderBottom: 'none', boxShadow: '0 24px 64px rgba(0,0,0,0.5)' }}
        >
          <div
            className="flex items-center gap-2 px-3 h-8 flex-shrink-0"
            style={{ background: '#111', borderBottom: `1px solid ${realApp.border}` }}
          >
            <div className="flex gap-1.5">
              <span className="w-2 h-2 rounded-full inline-block" style={{ background: 'rgba(198,42,9,0.5)' }} />
              <span className="w-2 h-2 rounded-full inline-block" style={{ background: 'rgba(212,168,67,0.5)' }} />
              <span className="w-2 h-2 rounded-full inline-block" style={{ background: 'rgba(46,125,50,0.5)' }} />
            </div>
            <span className="flex-1 text-center" style={{ color: realApp.text3, fontSize: isLarge ? 12 : 9 }}>
              order.masova.app
            </span>
          </div>
          <div style={{ padding: s.pad, background: realApp.bg, minHeight: s.frameH }}>
            <AnimatePresence mode="wait">
              <motion.div
                key={STEPS[active].id}
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
                transition={{ duration: 0.25 }}
                style={{ height: s.frameH }}
              >
                <Screen s={s} />
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
        {/* Laptop base / bezel */}
        <div
          style={{
            height: isLarge ? 16 : 8,
            background: 'linear-gradient(180deg, #1a1a1a 0%, #0a0a0a 100%)',
            borderRadius: '0 0 8px 8px',
            border: `1px solid ${realApp.border}`,
            borderTop: 'none',
            position: 'relative',
          }}
        >
          <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: isLarge ? 80 : 40, height: 4, background: '#000', borderRadius: '0 0 6px 6px' }} />
        </div>
      </div>

      <div className="flex items-center justify-center gap-2 flex-wrap">
        {STEPS.map((step, i) => (
          <button key={step.id} type="button" onClick={() => handleStepClick(i)} className="flex items-center gap-1.5 group">
            <span
              className="rounded-full transition-all duration-200"
              style={{ width: active === i ? 18 : 6, height: 6, background: active === i ? realApp.gold : realApp.border }}
            />
            <span className="whitespace-nowrap transition-colors" style={{ color: active === i ? realApp.gold : realApp.text3, fontSize: isLarge ? 12 : 9 }}>
              {step.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}
