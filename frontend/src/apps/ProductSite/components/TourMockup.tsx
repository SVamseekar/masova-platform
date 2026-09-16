import { motion } from 'framer-motion'
import { Clock, MapPin, Truck, Bot, Store, BarChart3, Scale, CheckCircle2 } from 'lucide-react'
import { realApp } from './realAppTheme'
import { AGGREGATOR_CHANNELS } from '../constants'

/** Shared browser/app chrome wrapper — every tour mockup renders inside this frame. */
function Frame({ label, accentColor, children }: { label: string; accentColor: string; children: React.ReactNode }) {
  return (
    <motion.div
      className="rounded-2xl overflow-hidden aspect-[4/3] relative flex flex-col"
      style={{ border: `1px solid ${realApp.border}`, boxShadow: '0 24px 64px rgba(0,0,0,0.45)', background: realApp.surface }}
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.35 }}
    >
      <div
        className="flex items-center gap-2 px-3 h-8 flex-shrink-0"
        style={{ background: '#111', borderBottom: `1px solid ${realApp.border}` }}
      >
        <span className="w-2 h-2 rounded-full" style={{ background: accentColor }} />
        <span className="text-[10px]" style={{ color: realApp.text3 }}>{label}</span>
      </div>
      <div className="flex-1 p-5 overflow-hidden">{children}</div>
    </motion.div>
  )
}

function Bar({ w, color, height = 6 }: { w: string; color: string; height?: number }) {
  return <div style={{ width: w, height, borderRadius: 999, background: color }} />
}

function KitchenMockup() {
  const tickets = [
    { id: '#2041', item: 'Chicken Biryani', time: '4:12', allergen: 'Nuts' },
    { id: '#2040', item: 'Margherita Pizza x2', time: '3:30', allergen: 'Dairy' },
    { id: '#2038', item: 'Dal Tadka', time: '2:05', allergen: null },
    { id: '#2035', item: 'Grilled Sea Bass', time: '0:48', allergen: 'Fish' },
  ]
  return (
    <div className="h-full flex flex-col gap-1.5">
      <div className="flex items-center justify-between mb-0.5">
        <span className="text-xs font-semibold" style={{ color: realApp.text1 }}>Kitchen display</span>
        <span className="text-[9px] px-2 py-0.5 rounded-full" style={{ background: 'rgba(198,42,9,0.15)', color: realApp.redLight }}>4 in queue</span>
      </div>
      {tickets.map(t => (
        <div key={t.id} className="rounded-lg px-3 py-1.5" style={{ background: realApp.bg, border: `1px solid ${realApp.border}` }}>
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-medium" style={{ color: realApp.text1 }}>{t.id} · {t.item}</p>
            <span className="flex items-center gap-1 text-[9px]" style={{ color: realApp.warning }}>
              <Clock size={9} /> {t.time}
            </span>
          </div>
          {t.allergen && (
            <span className="inline-block mt-0.5 text-[8px] px-1.5 py-0.5 rounded" style={{ background: 'rgba(239,68,68,0.15)', color: '#EF4444' }}>
              ⚠ {t.allergen}
            </span>
          )}
        </div>
      ))}
      <div className="mt-auto rounded-lg px-3 py-1.5 flex items-center gap-2" style={{ background: 'rgba(230,81,0,0.1)', border: `1px solid ${realApp.warning}` }}>
        <Bot size={11} style={{ color: realApp.warning }} />
        <span className="text-[9px]" style={{ color: realApp.text2 }}>Predictive alert: biryani prep trending +18% tonight</span>
      </div>
    </div>
  )
}

function DeliveryMockup() {
  const steps = [
    { label: 'Placed', done: true },
    { label: 'Preparing', done: true },
    { label: 'Dispatched', done: true },
    { label: 'Out for delivery', done: true, active: true },
    { label: 'Delivered', done: false },
  ]
  const activeIdx = steps.findIndex((s) => s.active)
  return (
    <div className="h-full flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold" style={{ color: realApp.text1 }}>Order #2041 · Out for delivery</span>
        <span className="flex items-center gap-1 text-[9px]" style={{ color: realApp.success }}>
          <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: realApp.success }} />
          Live
        </span>
      </div>
      <div className="flex items-center">
        {steps.map((step, i) => (
          <div key={step.label} className="flex items-center flex-1 last:flex-none">
            <div
              className="rounded-full flex items-center justify-center flex-shrink-0"
              style={{ width: 14, height: 14, background: step.done ? (i === activeIdx ? realApp.warning : realApp.success) : realApp.surface2, border: `1px solid ${step.done ? 'transparent' : realApp.border}` }}
            >
              {step.done && <span style={{ color: '#fff', fontSize: 8 }}>✓</span>}
            </div>
            {i < steps.length - 1 && <div className="flex-1 h-px" style={{ background: i < activeIdx ? realApp.success : realApp.border }} />}
          </div>
        ))}
      </div>
      <div className="flex-1 rounded-lg relative overflow-hidden" style={{ background: realApp.bg, border: `1px solid ${realApp.border}` }}>
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle, rgba(212,168,67,0.4) 1px, transparent 1px)', backgroundSize: '14px 14px' }} />
        <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
          <path d="M 20 90 Q 90 20 180 60" stroke={realApp.gold} strokeWidth="2" strokeDasharray="4 4" fill="none" opacity="0.7" />
        </svg>
        <Truck size={16} style={{ color: realApp.warning, position: 'absolute', left: '65%', top: '35%' }} />
        <MapPin size={16} style={{ color: realApp.red, position: 'absolute', left: '85%', top: '20%' }} />
      </div>
      <div className="rounded-lg px-2 py-1.5 flex items-center justify-between" style={{ background: realApp.bg, border: `1px solid ${realApp.border}` }}>
        <span className="text-[9px]" style={{ color: realApp.text2 }}>Marco · driver</span>
        <span className="text-[9px] font-semibold" style={{ color: realApp.gold }}>Arrives in 8 min</span>
      </div>
    </div>
  )
}

function PaymentsMockup() {
  const rows = [
    { label: 'Subtotal', value: '€24.50' },
    { label: 'VAT (DE · 19%)', value: '€4.66' },
    { label: 'Delivery fee', value: '€2.90' },
  ]
  const recent = [
    { id: '#2041', status: 'Signed' },
    { id: '#2040', status: 'Signed' },
    { id: '#2038', status: 'Pending' },
  ]
  return (
    <div className="h-full flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <Scale size={13} style={{ color: realApp.gold }} />
        <span className="text-xs font-semibold" style={{ color: realApp.text1 }}>EU VAT & fiscal signing</span>
      </div>
      <div className="rounded-lg p-2.5" style={{ background: realApp.bg, border: `1px solid ${realApp.border}` }}>
        {rows.map(r => (
          <div key={r.label} className="flex items-center justify-between py-0.5">
            <span className="text-[9px]" style={{ color: realApp.text3 }}>{r.label}</span>
            <span className="text-[9px]" style={{ color: realApp.text2 }}>{r.value}</span>
          </div>
        ))}
        <div className="mt-1 pt-1 flex items-center justify-between" style={{ borderTop: `1px solid ${realApp.border}` }}>
          <span className="text-[9px] font-semibold" style={{ color: realApp.text1 }}>Total</span>
          <span className="text-[12px] font-bold" style={{ color: realApp.gold }}>€32.06</span>
        </div>
      </div>
      {recent.map(r => (
        <div key={r.id} className="flex items-center justify-between px-1">
          <span className="text-[9px]" style={{ color: realApp.text3 }}>Order {r.id}</span>
          <span className="text-[9px] font-medium" style={{ color: r.status === 'Signed' ? realApp.success : realApp.warning }}>{r.status}</span>
        </div>
      ))}
    </div>
  )
}

function AggregatorsMockup() {
  return (
    <div className="h-full flex flex-col gap-1.5">
      <div className="flex items-center justify-between mb-0.5">
        <span className="text-xs font-semibold" style={{ color: realApp.text1 }}>Unified channel queue</span>
        <span className="text-[9px] px-2 py-0.5 rounded-full" style={{ background: 'rgba(212,168,67,0.12)', color: realApp.gold }}>27 orders today</span>
      </div>
      {AGGREGATOR_CHANNELS.map(ch => (
        <div key={ch.id} className="rounded-lg px-3 py-1.5 flex items-center justify-between" style={{ background: realApp.bg, border: `1px solid ${realApp.border}` }}>
          <div className="flex items-center gap-2">
            <Store size={11} style={{ color: ch.color }} />
            <span className="text-[10px] font-medium" style={{ color: realApp.text1 }}>{ch.label}</span>
          </div>
          <Bar w="40px" color={ch.color} height={4} />
        </div>
      ))}
      <div className="mt-auto rounded-lg px-3 py-1.5 flex items-center justify-between" style={{ background: 'rgba(212,168,67,0.1)', border: `1px solid ${realApp.border}` }}>
        <span className="text-[9px]" style={{ color: realApp.text2 }}>Platform commission tracked</span>
        <span className="text-[10px] font-semibold" style={{ color: realApp.gold }}>−8.2%</span>
      </div>
    </div>
  )
}

function AnalyticsMockup() {
  const bars = [40, 65, 52, 80, 70, 95, 60]
  return (
    <div className="h-full flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <BarChart3 size={13} style={{ color: realApp.gold }} />
        <span className="text-xs font-semibold" style={{ color: realApp.text1 }}>7-day sales forecast</span>
      </div>
      <div className="flex-1 flex items-end gap-2 px-1">
        {bars.map((h, i) => (
          <div key={i} className="flex-1 rounded-t" style={{ height: `${h}%`, background: i === 5 ? realApp.gold : 'rgba(212,168,67,0.3)' }} />
        ))}
      </div>
      <div className="grid grid-cols-3 gap-1.5">
        <div className="rounded-lg px-2 py-1.5" style={{ background: realApp.bg, border: `1px solid ${realApp.border}` }}>
          <p className="text-[8px]" style={{ color: realApp.text3 }}>Peak hour</p>
          <p className="text-[10px] font-semibold" style={{ color: realApp.text1 }}>7–9 PM</p>
        </div>
        <div className="rounded-lg px-2 py-1.5" style={{ background: realApp.bg, border: `1px solid ${realApp.border}` }}>
          <p className="text-[8px]" style={{ color: realApp.text3 }}>Top item</p>
          <p className="text-[10px] font-semibold" style={{ color: realApp.text1 }}>Biryani</p>
        </div>
        <div className="rounded-lg px-2 py-1.5" style={{ background: realApp.bg, border: `1px solid ${realApp.border}` }}>
          <p className="text-[8px]" style={{ color: realApp.text3 }}>Today</p>
          <p className="text-[10px] font-semibold" style={{ color: realApp.gold }}>€2,140</p>
        </div>
      </div>
    </div>
  )
}

function AIAgentsMockup() {
  const agents = [
    { name: 'Support', status: 'Active · 6 chats', color: realApp.success },
    { name: 'Demand Forecasting', status: 'Nightly 2AM', color: realApp.gold },
    { name: 'Reorder', status: 'Draft ready', color: realApp.warning },
    { name: 'Review Response', status: 'Active', color: realApp.success },
  ]
  return (
    <div className="h-full flex flex-col gap-1.5">
      <div className="flex items-center gap-2 mb-0.5">
        <Bot size={13} style={{ color: realApp.gold }} />
        <span className="text-xs font-semibold" style={{ color: realApp.text1 }}>8 assistants · you approve</span>
      </div>
      {agents.map(a => (
        <div key={a.name} className="rounded-lg px-3 py-1.5 flex items-center justify-between" style={{ background: realApp.bg, border: `1px solid ${realApp.border}` }}>
          <span className="text-[10px] font-medium" style={{ color: realApp.text1 }}>{a.name}</span>
          <span className="text-[9px]" style={{ color: a.color }}>{a.status}</span>
        </div>
      ))}
      <div className="mt-auto rounded-lg px-3 py-1.5 flex items-center gap-2" style={{ background: 'rgba(212,168,67,0.1)', border: `1px solid ${realApp.border}` }}>
        <CheckCircle2 size={11} style={{ color: realApp.gold }} />
        <span className="text-[9px]" style={{ color: realApp.text2 }}>Nothing goes live without your approval</span>
      </div>
    </div>
  )
}

const MOCKUPS: Record<string, ComponentTypeMap> = {
  kitchen: KitchenMockup,
  delivery: DeliveryMockup,
  payments: PaymentsMockup,
  aggregators: AggregatorsMockup,
  analytics: AnalyticsMockup,
  ai: AIAgentsMockup,
}

type ComponentTypeMap = () => React.JSX.Element

export default function TourMockup({ tabId, label, accentColor }: { tabId: string; label: string; accentColor: string }) {
  const Mockup = MOCKUPS[tabId] ?? KitchenMockup
  return (
    <Frame label={label} accentColor={accentColor}>
      <Mockup />
    </Frame>
  )
}
