import { realApp } from '../realAppTheme'

type ScaleProps = { t1: string; t2: string; t3: string; t4: string; gap: string; pad: number; sidebar: string; mapH: string; frameH: number }

// Mirrors real CheckoutPage.tsx: back-link + title + subtitle header, two-column
// layout (3 option cards w/ benefit bullets on the left, sticky Order Summary
// sidebar with itemized cart + breakdown on the right). EU sample data.
const OPTIONS = [
  { title: 'Sign In', accent: realApp.gold, benefits: ['Access saved addresses', 'View order history', 'Track orders live', 'Earn loyalty points'] },
  { title: 'Create Account', accent: realApp.red, benefits: ['Save delivery addresses', 'Faster future checkouts', 'Exclusive member deals', 'Order tracking & history'] },
  { title: 'Guest Checkout', accent: realApp.borderStrong, benefits: ['No registration required', 'Quick checkout process', 'Enter delivery details once', 'Track with order ID'] },
]

const CART_ITEMS = [
  { name: 'Wiener Schnitzel', qty: 1, price: 14.9 },
  { name: 'Grilled Sea Bass', qty: 2, price: 18.5 },
]
const SUBTOTAL = CART_ITEMS.reduce((sum, i) => sum + i.qty * i.price, 0)
const DELIVERY = 2.9
const TAX = (SUBTOTAL + DELIVERY) * 0.19
const TOTAL = SUBTOTAL + DELIVERY + TAX

export default function CheckoutScreen({ s }: { s: ScaleProps }) {
  return (
    <div className={`flex flex-col h-full ${s.gap} overflow-y-auto`}>
      <div className="flex-shrink-0">
        <p style={{ color: realApp.text3, fontSize: s.t1 }}>← Back to Menu</p>
        <p className="font-bold" style={{ color: realApp.text1, fontFamily: realApp.fontDisplay, fontSize: s.t4 }}>Checkout</p>
        <p style={{ color: realApp.text3, fontSize: s.t1 }}>Choose how you'd like to continue with your order</p>
      </div>

      <div className="flex gap-2 flex-1 overflow-hidden">
        {/* Left: option cards */}
        <div className={`flex-1 flex flex-col ${s.gap} overflow-y-auto`}>
          {OPTIONS.map((opt) => (
            <div
              key={opt.title}
              className="rounded-md"
              style={{ background: realApp.surface, border: `1px solid ${realApp.border}`, borderTop: `3px solid ${opt.accent}`, padding: s.pad * 0.5 }}
            >
              <span className="font-semibold block" style={{ color: opt.accent, fontSize: s.t2 }}>{opt.title}</span>
              <div className="flex flex-col gap-0.5 mt-1">
                {opt.benefits.map((b) => (
                  <span key={b} className="flex items-center gap-1" style={{ color: realApp.text2, fontSize: s.t1 }}>
                    <span className="rounded-full inline-block flex-shrink-0" style={{ width: 3, height: 3, background: opt.accent }} />
                    {b}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Right: sticky order summary */}
        <div className="flex-1 rounded-md flex flex-col" style={{ background: realApp.surface, border: `1px solid ${realApp.border}`, padding: s.pad * 0.5 }}>
          <p className="font-bold" style={{ color: realApp.text1, fontFamily: realApp.fontDisplay, fontSize: s.t3 }}>Order Summary</p>
          <div style={{ height: 1, background: realApp.border, margin: `${s.pad * 0.3}px 0` }} />
          <div className="flex flex-col gap-1 overflow-y-auto flex-1">
            {CART_ITEMS.map((item) => (
              <div key={item.name} className="flex items-center justify-between">
                <div>
                  <p style={{ color: realApp.text1, fontSize: s.t1, fontWeight: 600 }}>{item.name}</p>
                  <p style={{ color: realApp.text3, fontSize: s.t1 }}>Qty: {item.qty} × €{item.price.toFixed(2)}</p>
                </div>
                <span style={{ color: realApp.text1, fontSize: s.t1, fontWeight: 700 }}>€{(item.qty * item.price).toFixed(2)}</span>
              </div>
            ))}
          </div>
          <div style={{ height: 1, background: realApp.border, margin: `${s.pad * 0.3}px 0` }} />
          {[['Subtotal', `€${SUBTOTAL.toFixed(2)}`], ['Delivery fee', `€${DELIVERY.toFixed(2)}`], ['VAT (DE · 19%)', `€${TAX.toFixed(2)}`]].map(([k, v]) => (
            <div key={k} className="flex items-center justify-between">
              <span style={{ color: realApp.text3, fontSize: s.t1 }}>{k}</span>
              <span style={{ color: realApp.text2, fontSize: s.t1 }}>{v}</span>
            </div>
          ))}
          <div style={{ height: 1, background: realApp.border, margin: `${s.pad * 0.2}px 0` }} />
          <div className="flex items-center justify-between">
            <span className="font-bold" style={{ color: realApp.text1, fontFamily: realApp.fontDisplay, fontSize: s.t3 }}>Total</span>
            <span className="font-bold" style={{ color: realApp.gold, fontFamily: realApp.fontDisplay, fontSize: s.t4 }}>€{TOTAL.toFixed(2)}</span>
          </div>
          <div className="rounded-md text-center" style={{ background: realApp.surface2, border: `1px solid ${realApp.border}`, marginTop: s.pad * 0.3, padding: s.pad * 0.3 }}>
            <p style={{ color: realApp.text3, fontSize: s.t1 }}>Items are reserved for 10 minutes</p>
          </div>
        </div>
      </div>
    </div>
  )
}
