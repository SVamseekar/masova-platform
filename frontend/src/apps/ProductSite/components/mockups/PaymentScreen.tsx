import { realApp } from '../realAppTheme'

type ScaleProps = { t1: string; t2: string; t3: string; t4: string; gap: string; pad: number; sidebar: string; mapH: string; frameH: number }

// Mirrors real PaymentPage.tsx's two-column layout: left = delivery-address card,
// Order Type row, Payment Method list; right = sticky Order Summary card. EU-adapted:
// real page's UPI option becomes iDEAL/Bancontact, Razorpay branding becomes Stripe.
const CART_ITEMS = [
  { name: 'Wiener Schnitzel', qty: 1, price: 14.9 },
  { name: 'Grilled Sea Bass', qty: 2, price: 18.5 },
]
const SUBTOTAL = CART_ITEMS.reduce((sum, i) => sum + i.qty * i.price, 0)
const DELIVERY = 2.9
const TAX = (SUBTOTAL + DELIVERY) * 0.19
const TOTAL = SUBTOTAL + DELIVERY + TAX

export default function PaymentScreen({ s }: { s: ScaleProps }) {
  const orderTypes = [
    { label: 'Delivery', sub: `+€${DELIVERY.toFixed(2)}`, active: true },
    { label: 'Takeaway', sub: 'No fee', active: false },
    { label: 'Dine In', sub: 'At restaurant', active: false },
  ]
  const paymentMethods = [
    { label: 'Cash on Pickup', desc: 'Pay with cash when you collect', active: false },
    { label: 'Credit / Debit Card', desc: 'Pay securely via Stripe', active: true, badge: 'stripe' },
    { label: 'iDEAL / Bancontact', desc: 'Netherlands & Belgium bank payment', active: false },
  ]

  return (
    <div className="flex gap-2 h-full overflow-hidden">
      {/* Left column */}
      <div className={`flex-1 flex flex-col ${s.gap} overflow-y-auto`}>
        <p className="font-bold flex-shrink-0" style={{ color: realApp.text1, fontFamily: realApp.fontDisplay, fontSize: s.t4 }}>Complete Your Order</p>

        <div className="rounded-md flex-shrink-0" style={{ background: realApp.surface, border: `1px solid ${realApp.border}`, padding: s.pad * 0.5 }}>
          <p className="uppercase tracking-wide mb-1" style={{ color: realApp.text3, fontSize: s.t1 }}>Delivery Address</p>
          <div className="rounded-md flex items-center gap-1" style={{ background: 'rgba(212,168,67,0.07)', border: `1.5px solid ${realApp.gold}`, padding: s.pad * 0.35 }}>
            <div className="rounded-full flex-shrink-0" style={{ width: s.pad * 0.35, height: s.pad * 0.35, border: `4px solid ${realApp.gold}` }} />
            <div>
              <span style={{ color: realApp.text1, fontSize: s.t1, fontWeight: 600 }}>Home</span>
              <span className="ml-1 rounded-full px-1" style={{ color: realApp.gold, border: `1px solid ${realApp.gold}`, fontSize: s.t1 }}>Default</span>
              <p style={{ color: realApp.text2, fontSize: s.t1 }}>Torstraße 12, 10119 Berlin, Germany</p>
            </div>
          </div>
        </div>

        <div className="flex-shrink-0">
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

        <div className="flex-shrink-0">
          <p className="uppercase tracking-wide mb-1.5" style={{ color: realApp.text3, fontSize: s.t1 }}>Payment Method</p>
          <div className="flex flex-col gap-1">
            {paymentMethods.map((m) => (
              <div
                key={m.label}
                className="rounded-md flex items-center gap-1.5"
                style={{ background: m.active ? 'rgba(212,168,67,0.08)' : realApp.surface, border: `1px solid ${m.active ? realApp.gold : realApp.border}`, padding: s.pad * 0.4 }}
              >
                <div className="rounded-full flex-shrink-0" style={{ width: s.pad * 0.3, height: s.pad * 0.3, border: m.active ? `4px solid ${realApp.gold}` : `2px solid ${realApp.text3}` }} />
                <div className="flex-1">
                  <span className="font-semibold" style={{ color: m.active ? realApp.text1 : realApp.text2, fontSize: s.t2 }}>{m.label}</span>
                  <p style={{ color: realApp.text3, fontSize: s.t1 }}>{m.desc}</p>
                </div>
                {m.badge && <span className="rounded px-1.5 py-0.5 font-bold flex-shrink-0" style={{ background: '#635BFF22', color: '#8b85ff', fontSize: s.t1 }}>{m.badge}</span>}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right column: sticky order summary */}
      <div className="flex-1 rounded-md flex flex-col overflow-y-auto" style={{ background: realApp.surface, border: `1px solid ${realApp.border}`, padding: s.pad * 0.5 }}>
        <p className="uppercase tracking-wide mb-1" style={{ color: realApp.text3, fontSize: s.t1 }}>Order Summary</p>
        <div className="flex flex-col gap-1 mb-1">
          {CART_ITEMS.map((item) => (
            <div key={item.name} className="flex items-center justify-between">
              <span style={{ color: realApp.text2, fontSize: s.t1 }}><span style={{ color: realApp.gold, fontWeight: 600 }}>{item.qty}×</span> {item.name}</span>
              <span style={{ color: realApp.text1, fontSize: s.t1, fontWeight: 600 }}>€{(item.qty * item.price).toFixed(2)}</span>
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
        <div style={{ height: 1, background: realApp.border, margin: `${s.pad * 0.3}px 0` }} />
        <div className="flex items-center justify-between">
          <span className="font-bold" style={{ color: realApp.text1, fontSize: s.t2 }}>Total</span>
          <span className="font-bold" style={{ color: realApp.gold, fontFamily: realApp.fontDisplay, fontSize: s.t4 }}>€{TOTAL.toFixed(2)}</span>
        </div>
        <p style={{ color: realApp.text3, fontSize: s.t1, marginTop: 2 }}>Delivery charges may vary based on distance.</p>

        <div className="rounded-full text-center font-bold text-white mt-auto" style={{ background: realApp.red, padding: `${s.pad * 0.5}px 0`, fontSize: s.t2, marginTop: s.pad * 0.4 }}>
          Place Order · Pay €{TOTAL.toFixed(2)}
        </div>
        <div className="rounded-md text-center" style={{ border: `1px solid ${realApp.border}`, marginTop: 4, padding: s.pad * 0.3 }}>
          <span style={{ color: realApp.text2, fontSize: s.t1 }}>Back to Checkout</span>
        </div>
        <div className="flex items-center justify-center gap-1" style={{ marginTop: 4 }}>
          <span style={{ color: realApp.text3, fontSize: s.t1 }}>🔒 Secured by Stripe · 256-bit SSL Encrypted</span>
        </div>
      </div>
    </div>
  )
}
