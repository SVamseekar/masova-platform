import { Truck, Phone } from 'lucide-react'
import { realApp } from '../realAppTheme'

type ScaleProps = { t1: string; t2: string; t3: string; t4: string; gap: string; pad: number; sidebar: string; mapH: string; frameH: number }

// Mirrors real TrackingPage.tsx's Delivery-type step list (8 steps), hero status
// bar, driver card w/ Call action, live map + "Delivering to" strip, two separate
// right-column cards (Reference, Items — not merged), and action buttons.
const TRACKING_STEPS = [
  { label: 'Order Placed', desc: 'Restaurant received your order' },
  { label: 'Preparing', desc: 'Kitchen is getting started' },
  { label: 'In the Oven', desc: 'Your food is cooking' },
  { label: 'Baked', desc: 'Fresh out of the oven' },
  { label: 'Ready', desc: 'Packed and ready to go' },
  { label: 'Dispatched', desc: 'Driver is heading to the restaurant' },
  { label: 'Out for Delivery', desc: 'Driver is on the way to you' },
  { label: 'Delivered', desc: 'Enjoy your meal!' },
]
const ACTIVE_INDEX = 6

const ITEMS = [
  { name: 'Wiener Schnitzel', qty: 1, price: 14.9 },
  { name: 'Grilled Sea Bass', qty: 2, price: 18.5 },
]
const TOTAL = 65.21

export default function TrackingScreen({ s }: { s: ScaleProps }) {
  return (
    <div className={`flex flex-col h-full ${s.gap} overflow-y-auto`}>
      {/* Hero status bar */}
      <div
        className="rounded-md flex items-center gap-2 flex-shrink-0"
        style={{ background: 'rgba(59,130,246,0.07)', border: '1px solid rgba(59,130,246,0.2)', padding: s.pad * 0.5 }}
      >
        <div
          className="rounded-full flex items-center justify-center flex-shrink-0"
          style={{ width: s.pad * 1.3, height: s.pad * 1.3, background: 'rgba(59,130,246,0.12)', border: '2px solid rgba(59,130,246,0.35)' }}
        >
          <Truck size={s.pad * 0.55} style={{ color: '#60a5fa' }} />
        </div>
        <div className="flex-1">
          <p className="uppercase tracking-wide" style={{ color: realApp.text3, fontSize: s.t1 }}>Current Status</p>
          <p className="font-bold" style={{ color: realApp.text1, fontFamily: realApp.fontDisplay, fontSize: s.t3 }}>Out for Delivery</p>
          <p style={{ color: realApp.text3, fontSize: s.t1 }}>Driver is on the way to you · 4m ago</p>
        </div>
        <div className="rounded-md text-center flex-shrink-0" style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.25)', padding: `${s.pad * 0.3}px ${s.pad * 0.5}px` }}>
          <p className="uppercase tracking-wide" style={{ color: realApp.text3, fontSize: s.t1 }}>Arrives in</p>
          <p className="font-bold" style={{ color: '#60a5fa', fontFamily: realApp.fontDisplay, fontSize: s.t3 }}>8 min</p>
        </div>
      </div>

      {/* Driver card */}
      <div className="rounded-md flex items-center gap-2 flex-shrink-0" style={{ background: realApp.surface, border: '1px solid rgba(59,130,246,0.2)', padding: s.pad * 0.4 }}>
        <div className="rounded-full flex items-center justify-center flex-shrink-0" style={{ width: s.pad * 1.1, height: s.pad * 1.1, background: 'rgba(59,130,246,0.1)', border: '2px solid rgba(59,130,246,0.3)' }}>
          <span style={{ color: '#60a5fa', fontSize: s.t2 }}>👤</span>
        </div>
        <div className="flex-1">
          <p className="uppercase tracking-wide" style={{ color: realApp.text3, fontSize: s.t1 }}>Your Driver</p>
          <p className="font-semibold" style={{ color: realApp.text1, fontSize: s.t2 }}>Marco</p>
          <p style={{ color: realApp.text3, fontSize: s.t1 }}>+49 176 ​55 12 34 · 1.2 km away</p>
        </div>
        <span className="inline-flex items-center gap-1 rounded-full px-1.5 py-0.5" style={{ background: 'rgba(34,197,94,0.12)', color: '#4ade80', fontSize: s.t1 }}>
          <Phone size={s.t1 === '7px' ? 8 : 10} /> Call
        </span>
      </div>

      {/* Map */}
      <div className={`rounded-md relative overflow-hidden flex-shrink-0 ${s.mapH}`} style={{ background: realApp.surface2, border: `1px solid ${realApp.border}` }}>
        <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
          <path d="M 10 45 Q 80 10 190 30" stroke="#60a5fa" strokeWidth="2" strokeDasharray="4 4" fill="none" opacity="0.7" />
        </svg>
        <span className="absolute w-2.5 h-2.5 rounded-full" style={{ left: '75%', top: '25%', background: realApp.red }} />
        <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded flex items-center gap-1" style={{ background: 'rgba(0,0,0,0.7)', fontSize: s.t1 }}>
          <span className="w-1 h-1 rounded-full inline-block" style={{ background: '#4ade80' }} />
          <span style={{ color: '#fff' }}>Live driver location</span>
        </span>
      </div>
      <div className="rounded-md flex items-start gap-1.5 flex-shrink-0" style={{ background: realApp.surface, border: `1px solid ${realApp.border}`, padding: s.pad * 0.4 }}>
        <span style={{ fontSize: s.t2 }}>📍</span>
        <div>
          <p className="uppercase tracking-wide" style={{ color: realApp.text3, fontSize: s.t1 }}>Delivering to</p>
          <p style={{ color: realApp.text1, fontSize: s.t1 }}>Torstraße 12, 10119 Berlin, Germany</p>
        </div>
      </div>

      {/* Timeline */}
      <div className="rounded-md flex-shrink-0" style={{ background: realApp.surface, border: `1px solid ${realApp.border}`, padding: s.pad * 0.5 }}>
        <p className="font-semibold mb-1.5" style={{ color: realApp.text1, fontFamily: realApp.fontDisplay, fontSize: s.t2 }}>Order Progress</p>
        {TRACKING_STEPS.map((step, i) => {
          const isCompleted = i < ACTIVE_INDEX
          const isActive = i === ACTIVE_INDEX
          return (
            <div key={step.label} className="flex gap-1.5">
              <div className="flex flex-col items-center flex-shrink-0">
                <div
                  className="rounded-full flex items-center justify-center flex-shrink-0"
                  style={{
                    width: s.pad * 0.65, height: s.pad * 0.65,
                    background: isCompleted ? 'rgba(34,197,94,0.15)' : isActive ? 'rgba(59,130,246,0.15)' : 'transparent',
                    border: `1.5px solid ${isCompleted ? '#22c55e' : isActive ? '#60a5fa' : realApp.border}`,
                    color: isCompleted ? '#22c55e' : isActive ? '#60a5fa' : realApp.text3,
                  }}
                >
                  <span style={{ fontSize: s.t1, fontWeight: 700 }}>{isCompleted ? '✓' : i + 1}</span>
                </div>
                {i < TRACKING_STEPS.length - 1 && (
                  <div style={{ width: 2, flex: 1, minHeight: s.pad * 0.35, background: isCompleted ? 'rgba(34,197,94,0.4)' : realApp.border }} />
                )}
              </div>
              <div style={{ paddingBottom: i < TRACKING_STEPS.length - 1 ? s.pad * 0.3 : 0 }}>
                <p style={{ color: isActive ? realApp.text1 : isCompleted ? realApp.text2 : realApp.text3, fontSize: s.t1, fontWeight: isActive ? 700 : 500 }}>
                  {step.label}
                </p>
              </div>
            </div>
          )
        })}
      </div>

      {/* Order Reference card */}
      <div className="rounded-md flex-shrink-0" style={{ background: realApp.surface, border: `1px solid ${realApp.border}`, padding: s.pad * 0.4 }}>
        <div className="flex items-center justify-between">
          <div>
            <p className="uppercase tracking-wide" style={{ color: realApp.text3, fontSize: s.t1 }}>Order Reference</p>
            <p className="font-bold" style={{ color: realApp.gold, fontFamily: realApp.fontDisplay, fontSize: s.t3 }}>#A3F9K2LM</p>
          </div>
          <span className="rounded-full px-1.5 py-0.5" style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.25)', color: '#60a5fa', fontSize: s.t1, fontWeight: 700 }}>En Route</span>
        </div>
      </div>

      {/* Items card */}
      <div className="rounded-md flex-shrink-0" style={{ background: realApp.surface, border: `1px solid ${realApp.border}`, padding: s.pad * 0.4 }}>
        <p className="uppercase tracking-wide mb-1" style={{ color: realApp.text3, fontSize: s.t1 }}>Items</p>
        {ITEMS.map((item) => (
          <div key={item.name} className="flex items-center justify-between" style={{ marginBottom: 2 }}>
            <span style={{ color: realApp.text2, fontSize: s.t1 }}>{item.qty}× {item.name}</span>
            <span style={{ color: realApp.text1, fontSize: s.t1, fontWeight: 600 }}>€{(item.qty * item.price).toFixed(2)}</span>
          </div>
        ))}
        <div className="flex items-center justify-between" style={{ marginTop: 4, paddingTop: 4, borderTop: `1px solid ${realApp.border}` }}>
          <span className="font-bold" style={{ color: realApp.text1, fontSize: s.t1 }}>Total</span>
          <span className="font-bold" style={{ color: realApp.gold, fontFamily: realApp.fontDisplay, fontSize: s.t2 }}>€{TOTAL.toFixed(2)}</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-1 flex-shrink-0">
        <div className="rounded-md text-center font-bold text-white" style={{ background: realApp.red, padding: s.pad * 0.4, fontSize: s.t1 }}>Order Again</div>
        <div className="rounded-md text-center" style={{ border: `1px solid ${realApp.border}`, padding: s.pad * 0.4, fontSize: s.t1, color: realApp.text2 }}>View Order History</div>
      </div>
    </div>
  )
}
