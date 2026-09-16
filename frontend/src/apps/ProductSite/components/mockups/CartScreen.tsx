import { realApp } from '../realAppTheme'

type ScaleProps = { t1: string; t2: string; t3: string; t4: string; gap: string; pad: number; sidebar: string; mapH: string; frameH: number }

// Mirrors real CartDrawer.tsx's fixed right-side slide-over structure faithfully:
// header (icon+title+count, Clear All, close), per-item rows with plate thumbnail
// and interactive-looking −/qty/+ stepper (visual only), footer breakdown + CTA +
// reservation notice. EU sample data over the real component structure.
const CART_ITEMS = [
  { name: 'Wiener Schnitzel', unitPrice: 14.9, qty: 1 },
  { name: 'Grilled Sea Bass', unitPrice: 18.5, qty: 2 },
]
const SUBTOTAL = CART_ITEMS.reduce((sum, i) => sum + i.unitPrice * i.qty, 0)
const DELIVERY = 2.9
const TAX = (SUBTOTAL + DELIVERY) * 0.19
const TOTAL = SUBTOTAL + DELIVERY + TAX

export default function CartScreen({ s }: { s: ScaleProps }) {
  return (
    <div className="h-full relative">
      <div className="absolute inset-0 rounded-md" style={{ background: 'rgba(0,0,0,0.5)' }} />
      <div
        className="absolute right-0 top-0 bottom-0 flex flex-col"
        style={{ width: '72%', background: realApp.surface2, borderLeft: `1px solid ${realApp.border}`, boxShadow: '-8px 0 24px rgba(0,0,0,0.5)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between flex-shrink-0" style={{ padding: s.pad * 0.6, borderBottom: `1px solid ${realApp.border}` }}>
          <div>
            <p className="font-bold" style={{ color: realApp.text1, fontFamily: realApp.fontDisplay, fontSize: s.t4 }}>Your Order</p>
            <span style={{ color: realApp.text3, fontSize: s.t1 }}>{CART_ITEMS.length} items</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="rounded-full" style={{ background: 'rgba(198,42,9,0.08)', border: '1px solid rgba(198,42,9,0.25)', color: realApp.redLight, fontSize: s.t1, padding: '2px 8px', fontWeight: 600 }}>
              Clear All
            </span>
            <span className="rounded-full flex items-center justify-center" style={{ width: s.pad * 1.1, height: s.pad * 1.1, background: realApp.surface3, border: `1px solid ${realApp.border}`, color: realApp.text2, fontSize: s.t1 }}>×</span>
          </div>
        </div>

        {/* Items */}
        <div className={`flex flex-col ${s.gap} flex-1 overflow-y-auto`} style={{ padding: s.pad * 0.6 }}>
          {CART_ITEMS.map((item) => (
            <div key={item.name} className="flex items-start gap-1.5" style={{ paddingBottom: s.pad * 0.5, borderBottom: `1px solid ${realApp.border}` }}>
              <div
                className="rounded-full flex-shrink-0"
                style={{ width: s.pad * 1.3, height: s.pad * 1.3, background: 'radial-gradient(circle at 38% 32%, rgba(212,168,67,0.3) 0%, rgba(212,168,67,0.05) 50%, transparent 100%)', border: '1px solid rgba(212,168,67,0.2)' }}
              />
              <div className="flex-1 min-w-0">
                <p className="font-semibold truncate" style={{ color: realApp.text1, fontSize: s.t2 }}>{item.name}</p>
                <p style={{ color: realApp.text3, fontSize: s.t1 }}>€{item.unitPrice.toFixed(2)} each</p>
              </div>
              <div className="flex flex-col items-end gap-1 flex-shrink-0">
                <p className="font-bold" style={{ color: realApp.gold, fontSize: s.t2 }}>€{(item.unitPrice * item.qty).toFixed(2)}</p>
                <div className="flex items-center gap-1">
                  <span className="rounded-full flex items-center justify-center" style={{ width: s.pad * 0.7, height: s.pad * 0.7, background: realApp.surface3, border: `1px solid ${realApp.border}`, color: realApp.text1, fontSize: s.t1, fontWeight: 700 }}>−</span>
                  <span className="font-bold text-center" style={{ color: realApp.text1, fontSize: s.t1, minWidth: 10 }}>{item.qty}</span>
                  <span className="rounded-full flex items-center justify-center" style={{ width: s.pad * 0.7, height: s.pad * 0.7, background: realApp.red, color: '#fff', fontSize: s.t1, fontWeight: 700 }}>+</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="flex-shrink-0" style={{ padding: s.pad * 0.6, borderTop: `1px solid ${realApp.border}`, background: realApp.surface }}>
          {[['Subtotal', `€${SUBTOTAL.toFixed(2)}`], ['Delivery fee', `€${DELIVERY.toFixed(2)}`], ['VAT (DE · 19%)', `€${TAX.toFixed(2)}`]].map(([k, v]) => (
            <div key={k} className="flex items-center justify-between" style={{ paddingBottom: 2 }}>
              <span style={{ color: realApp.text3, fontSize: s.t1 }}>{k}</span>
              <span style={{ color: realApp.text2, fontSize: s.t1 }}>{v}</span>
            </div>
          ))}
          <div className="flex items-center justify-between" style={{ marginTop: 4, paddingTop: 4, borderTop: `1px solid ${realApp.border}` }}>
            <span className="font-bold" style={{ color: realApp.text1, fontFamily: realApp.fontDisplay, fontSize: s.t3 }}>Total</span>
            <span className="font-bold" style={{ color: realApp.gold, fontFamily: realApp.fontDisplay, fontSize: s.t4 }}>€{TOTAL.toFixed(2)}</span>
          </div>
          <div className="rounded-full text-center font-bold text-white" style={{ background: realApp.red, padding: `${s.pad * 0.5}px 0`, fontSize: s.t3, marginTop: s.pad * 0.4 }}>
            Checkout →
          </div>
          <p className="text-center" style={{ color: realApp.text3, fontSize: s.t1, marginTop: 4 }}>Items are reserved for 10 minutes</p>
        </div>
      </div>
    </div>
  )
}
