import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChefHat, Bike, ShoppingCart, LayoutDashboard } from 'lucide-react'
import { realCrewApp as app } from './realCrewAppTheme'

type Role = 'kitchen' | 'driver' | 'cashier' | 'manager'

const ROLES: { id: Role; label: string; icon: typeof ChefHat }[] = [
  { id: 'kitchen', label: 'Kitchen', icon: ChefHat },
  { id: 'driver', label: 'Driver', icon: Bike },
  { id: 'cashier', label: 'Cashier', icon: ShoppingCart },
  { id: 'manager', label: 'Manager', icon: LayoutDashboard },
]

// realCrewAppTheme's roles map uses 'kiosk' for the cashier/POS role — map here
// rather than renaming the theme key (Hard Rule: role accent hex values, not the
// key name, are what's frozen; 'kiosk' matches the real app's naming).
const ROLE_ACCENT_KEY: Record<Role, keyof typeof app.roles> = {
  kitchen: 'kitchen',
  driver: 'driver',
  cashier: 'kiosk',
  manager: 'manager',
}

type Size = 'compact' | 'default' | 'large'

const SCALE: Record<Size, { t1: string; t2: string; t3: string; pad: number; frameH: number; phoneW: number }> = {
  compact: { t1: '7px', t2: '8px', t3: '9px', pad: 8, frameH: 260, phoneW: 150 },
  default: { t1: '8px', t2: '9px', t3: '10px', pad: 10, frameH: 320, phoneW: 180 },
  large: { t1: '11px', t2: '13px', t3: '15px', pad: 16, frameH: 460, phoneW: 240 },
}

// EU sample data over real KitchenQueueScreen.tsx card structure.
const KITCHEN_TICKETS = [
  { orderNumber: '2041', urgency: '4m ago', urgencyColor: app.warning, items: ['1× Wiener Schnitzel'], allergen: 'Gluten' },
  { orderNumber: '2040', urgency: '2m ago', urgencyColor: app.success, items: ['2× Margherita Pizza'], allergen: 'Dairy' },
  { orderNumber: '2038', urgency: '11m ago', urgencyColor: app.error, items: ['1× Ratatouille'], allergen: null },
]

function KitchenMock({ s }: { s: typeof SCALE[Size] }) {
  const ACCENT = app.roles.kitchen
  return (
    <div className="flex flex-col h-full gap-1.5 overflow-hidden">
      {KITCHEN_TICKETS.map((t) => (
        <div key={t.orderNumber} className="rounded-md" style={{ background: app.surface, borderLeft: `4px solid ${t.urgencyColor}`, boxShadow: '0 1px 3px rgba(0,0,0,0.06)', padding: s.pad * 0.5 }}>
          <div className="flex items-center justify-between">
            <span className="font-bold" style={{ color: app.text1, fontSize: s.t2 }}>#{t.orderNumber}</span>
            <span style={{ color: app.text3, fontSize: s.t1 }}>{t.urgency}</span>
          </div>
          <span className="uppercase font-semibold block mt-0.5" style={{ color: ACCENT, fontSize: s.t1 }}>Preparing</span>
          {t.items.map((it) => <p key={it} style={{ color: app.text1, fontSize: s.t1 }}>{it}</p>)}
          {t.allergen && (
            <span className="inline-block mt-1 rounded px-1 py-0.5" style={{ background: '#fff3e0', border: '1px solid #ff9800', color: '#e65100', fontSize: s.t1, fontWeight: 700 }}>
              {t.allergen}
            </span>
          )}
        </div>
      ))}
      <div className="mt-auto rounded-md text-center font-bold" style={{ background: ACCENT, color: '#fff', padding: s.pad * 0.4, fontSize: s.t1 }}>
        ▶ Advance Status
      </div>
    </div>
  )
}

function DriverMock({ s }: { s: typeof SCALE[Size] }) {
  const ACCENT = app.roles.driver
  return (
    <div className="flex flex-col h-full gap-2">
      <div className="flex items-center justify-between rounded-md" style={{ background: app.surface, padding: s.pad * 0.5 }}>
        <span className="font-semibold" style={{ color: app.text1, fontSize: s.t2 }}>You're online</span>
        <span className="rounded-full" style={{ width: 26, height: 14, background: ACCENT, position: 'relative' }}>
          <span className="rounded-full absolute" style={{ width: 10, height: 10, top: 2, right: 2, background: '#fff' }} />
        </span>
      </div>
      <div className="grid grid-cols-2 gap-1.5">
        {[['Deliveries', '14'], ['Earnings', '€96.40'], ['Distance', '38 km'], ['Avg time', '22 min']].map(([label, val]) => (
          <div key={label} className="rounded-md" style={{ background: app.surface, padding: s.pad * 0.5, borderTop: `3px solid ${ACCENT}` }}>
            <p style={{ color: app.text2, fontSize: s.t1 }}>{label}</p>
            <p className="font-bold" style={{ color: ACCENT, fontSize: s.t2 }}>{val}</p>
          </div>
        ))}
      </div>
      <div className="mt-auto rounded-md text-center font-bold" style={{ background: ACCENT, color: '#fff', padding: s.pad * 0.5, fontSize: s.t2 }}>
        Order #2041 · Navigate
      </div>
    </div>
  )
}

function CashierMock({ s }: { s: typeof SCALE[Size] }) {
  const ACCENT = app.roles.kiosk
  const cart = [
    { name: 'Currywurst', qty: 2, price: 8.4 },
    { name: 'Pommes', qty: 1, price: 3.5 },
  ]
  const total = cart.reduce((sum, i) => sum + i.qty * i.price, 0)
  return (
    <div className="flex flex-col h-full gap-1.5">
      <div className="grid grid-cols-2 gap-1.5">
        {['Takeaway', 'Dine In'].map((t, i) => (
          <div key={t} className="rounded-md text-center" style={{ background: i === 0 ? `${ACCENT}22` : app.surface, border: `1px solid ${i === 0 ? ACCENT : app.border}`, padding: s.pad * 0.4 }}>
            <span style={{ color: i === 0 ? ACCENT : app.text2, fontSize: s.t1, fontWeight: 600 }}>{t}</span>
          </div>
        ))}
      </div>
      <div className="flex-1 flex flex-col gap-1">
        {cart.map((item) => (
          <div key={item.name} className="rounded-md flex items-center justify-between" style={{ background: app.surface, padding: s.pad * 0.4 }}>
            <span style={{ color: app.text1, fontSize: s.t2 }}>{item.qty}× {item.name}</span>
            <span style={{ color: app.text2, fontSize: s.t1 }}>€{(item.qty * item.price).toFixed(2)}</span>
          </div>
        ))}
      </div>
      <div className="mt-auto rounded-md flex items-center justify-between font-bold" style={{ background: ACCENT, color: '#fff', padding: s.pad * 0.5, fontSize: s.t2 }}>
        <span>Place order</span>
        <span>€{total.toFixed(2)}</span>
      </div>
    </div>
  )
}

function ManagerMock({ s }: { s: typeof SCALE[Size] }) {
  const ACCENT = app.roles.manager
  const orders = [
    { number: '2041', meta: 'Delivery · L. Müller', total: '€38.20', status: 'PREPARING' },
    { number: '2040', meta: 'Dine-in · Table 4', total: '€27.60', status: 'READY' },
  ]
  return (
    <div className="flex flex-col h-full gap-1.5 overflow-hidden">
      <p className="font-bold" style={{ color: app.text1, fontSize: s.t2 }}>Today's Overview</p>
      <div className="grid grid-cols-2 gap-1.5">
        {[['Revenue', '€2,140'], ['Active orders', '12'], ['Avg prep', '9m'], ['Staff on duty', '18']].map(([label, val]) => (
          <div key={label} className="rounded-md" style={{ background: app.surface, borderTop: `3px solid ${ACCENT}`, padding: s.pad * 0.4 }}>
            <p style={{ color: app.text2, fontSize: s.t1 }}>{label}</p>
            <p className="font-bold" style={{ color: ACCENT, fontSize: s.t2 }}>{val}</p>
          </div>
        ))}
      </div>
      <p className="uppercase font-semibold" style={{ color: app.text3, fontSize: s.t1 }}>Recent orders</p>
      {orders.map((o) => (
        <div key={o.number} className="rounded-md flex items-center justify-between" style={{ background: app.surface, padding: s.pad * 0.4 }}>
          <div>
            <p style={{ color: app.text1, fontSize: s.t2, fontWeight: 600 }}>#{o.number}</p>
            <p style={{ color: app.text2, fontSize: s.t1 }}>{o.meta}</p>
          </div>
          <div className="text-right">
            <p style={{ color: app.text1, fontSize: s.t2, fontWeight: 700 }}>{o.total}</p>
            <p className="uppercase" style={{ color: ACCENT, fontSize: s.t1 }}>{o.status}</p>
          </div>
        </div>
      ))}
    </div>
  )
}

const ROLE_SCREENS: Record<Role, (props: { s: typeof SCALE[Size] }) => React.JSX.Element> = {
  kitchen: KitchenMock,
  driver: DriverMock,
  cashier: CashierMock,
  manager: ManagerMock,
}

export default function CrewAppMockup({ size = 'default' }: { size?: Size }) {
  const [active, setActive] = useState<Role>('kitchen')
  const s = SCALE[size]
  const Screen = ROLE_SCREENS[active]
  const activeRole = ROLES.find((r) => r.id === active)!
  const ACCENT = app.roles[ROLE_ACCENT_KEY[active]]

  return (
    <div className="flex flex-col items-center gap-3">
      <div
        className="rounded-[2rem] overflow-hidden flex-shrink-0"
        style={{ width: s.phoneW, border: '1px solid rgba(255,255,255,0.12)', boxShadow: '0 24px 64px rgba(0,0,0,0.5)' }}
      >
        <div className="relative" style={{ height: 18, background: '#000' }}>
          <div className="absolute rounded-full" style={{ left: '50%', top: 4, transform: 'translateX(-50%)', width: s.phoneW * 0.3, height: 8, background: '#000', border: '1px solid #222' }} />
        </div>
        <div className="flex items-center justify-between" style={{ padding: `${s.pad * 0.4}px ${s.pad}px`, background: ACCENT }}>
          <span className="font-bold" style={{ color: '#fff', fontSize: s.t2 }}>{activeRole.label}</span>
          <activeRole.icon size={12} color="#fff" />
        </div>
        <div style={{ padding: s.pad, background: app.bgAlt, height: s.frameH }}>
          <AnimatePresence mode="wait">
            <motion.div
              key={active}
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
        {ROLES.map((role) => (
          <button
            key={role.id}
            type="button"
            onClick={() => setActive(role.id)}
            className="flex items-center gap-1 rounded-full transition-all duration-200"
            style={{
              padding: '3px 8px',
              background: active === role.id ? `${app.roles[ROLE_ACCENT_KEY[role.id]]}18` : 'transparent',
              border: `1px solid ${active === role.id ? app.roles[ROLE_ACCENT_KEY[role.id]] : app.border}`,
            }}
          >
            <role.icon size={9} color={active === role.id ? app.roles[ROLE_ACCENT_KEY[role.id]] : app.text3} />
            <span style={{ color: active === role.id ? app.roles[ROLE_ACCENT_KEY[role.id]] : app.text3, fontSize: 9, fontWeight: 600 }}>
              {role.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}
