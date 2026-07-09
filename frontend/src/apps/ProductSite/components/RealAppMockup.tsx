import { useState, useEffect, useRef, useCallback } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Truck } from 'lucide-react'
import { realApp } from './realAppTheme'
import MenuScreen from './mockups/MenuScreen'
import CartScreen from './mockups/CartScreen'
import CheckoutScreen from './mockups/CheckoutScreen'
import SignInScreen from './mockups/SignInScreen'
import PaymentScreen from './mockups/PaymentScreen'
import TrackingScreen from './mockups/TrackingScreen'
import ProfileScreen from './mockups/ProfileScreen'

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
  compact: { t1: '7px', t2: '8px', t3: '9px', t4: '10px', gap: 'gap-1', pad: 8, sidebar: 'w-[74px]', mapH: 'h-12', frameH: 240 },
  default: { t1: '7px', t2: '8px', t3: '9px', t4: '10px', gap: 'gap-1.5', pad: 10, sidebar: 'w-[74px]', mapH: 'h-14', frameH: 280 },
  large: { t1: '11px', t2: '13px', t3: '15px', t4: '17px', gap: 'gap-3', pad: 20, sidebar: 'w-[130px]', mapH: 'h-24', frameH: 460 },
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
