import { realApp } from '../realAppTheme'

type ScaleProps = { t1: string; t2: string; t3: string; t4: string; gap: string; pad: number; sidebar: string; mapH: string; frameH: number }

// EU sample data standing in for MenuPage.tsx's real (India) menu items — same
// component structure: 3-group sidebar filter (Cuisine/Category/Dietary), search
// bar, responsive card grid with Recommended badge, spice dots, prep time,
// allergen banner, variant note, and a persistent price row + separate qty stepper.
const MENU_ITEMS = [
  {
    name: 'Wiener Schnitzel', price: '€14.90', dietary: 'Non-Veg', qty: 1,
    recommended: true, desc: 'Breaded veal cutlet, lemon, lingonberry jam', spice: 0,
    prepMin: 18, allergens: ['Gluten', 'Egg'], variants: 1,
  },
  {
    name: 'Margherita Pizza', price: '€10.90', dietary: 'Vegetarian', qty: 0,
    recommended: false, desc: 'San Marzano tomato, buffalo mozzarella, basil', spice: 0,
    prepMin: 12, allergens: ['Gluten', 'Dairy'], variants: 2,
  },
  {
    name: 'Grilled Sea Bass', price: '€18.50', dietary: 'Non-Veg', qty: 2,
    recommended: false, desc: 'Herb butter, roasted fennel, lemon', spice: 0,
    prepMin: 22, allergens: ['Fish'], variants: 0,
  },
  {
    name: 'Ratatouille', price: '€9.20', dietary: 'Vegan', qty: 0,
    recommended: false, desc: 'Provençal stewed vegetables, herbs de Provence', spice: 1,
    prepMin: 15, allergens: [], variants: 0,
  },
] as const

function dietaryColor(d: string) {
  if (d === 'Vegan') return realApp.success
  if (d === 'Vegetarian') return '#2e7d32'
  return realApp.red
}

function SpiceDots({ level, s }: { level: number; s: ScaleProps }) {
  if (level === 0) return null
  return (
    <span className="inline-flex items-center gap-0.5">
      {Array.from({ length: level }).map((_, i) => (
        <span key={i} className="rounded-full inline-block" style={{ width: 4, height: 4, background: '#e53e3e' }} />
      ))}
    </span>
  )
}

export default function MenuScreen({ s }: { s: ScaleProps }) {
  return (
    <div className="flex h-full overflow-hidden">
      <div className={`${s.sidebar} flex-shrink-0 flex flex-col gap-2 pr-3 overflow-y-auto`} style={{ borderRight: `1px solid ${realApp.border}` }}>
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
          <p className="uppercase tracking-wide mb-1" style={{ color: realApp.text3, fontSize: s.t1 }}>Category</p>
          {['Mains', 'Sides'].map((c, i) => (
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
      <div className={`flex-1 pl-3 flex flex-col ${s.gap} overflow-y-auto`}>
        <div className="rounded-full flex-shrink-0" style={{ background: realApp.surface2, border: `1px solid ${realApp.border}`, padding: `${s.pad * 0.35}px ${s.pad * 0.6}px` }}>
          <span style={{ color: realApp.text3, fontSize: s.t1 }}>Search for dishes…</span>
        </div>
        <p className="font-semibold flex-shrink-0" style={{ color: realApp.text1, fontFamily: realApp.fontDisplay, fontSize: s.t3 }}>Continental</p>
        <div className="grid grid-cols-2 gap-2">
          {MENU_ITEMS.map((item) => (
            <div key={item.name} className="rounded-md flex flex-col overflow-hidden" style={{ background: realApp.surface, border: `1px solid ${realApp.border}` }}>
              <div className="flex items-center justify-center relative" style={{ height: s.pad * 2.2, background: realApp.surface2 }}>
                <div
                  className="rounded-full"
                  style={{ width: s.pad * 1.3, height: s.pad * 1.3, background: 'radial-gradient(circle at 38% 32%, rgba(212,168,67,0.25) 0%, rgba(212,168,67,0.05) 50%, transparent 100%)', border: '1px solid rgba(212,168,67,0.18)' }}
                />
              </div>
              <div style={{ padding: s.pad * 0.5 }}>
                <div className="flex items-start justify-between gap-1">
                  <span className="font-semibold block" style={{ color: realApp.text1, fontSize: s.t2 }}>{item.name}</span>
                  {item.recommended && (
                    <span className="px-1 py-0.5 rounded-full flex-shrink-0" style={{ background: 'rgba(212,168,67,0.15)', color: realApp.gold, border: `1px solid ${realApp.gold}`, fontSize: s.t1 }}>★</span>
                  )}
                </div>
                <p className="mt-0.5" style={{ color: realApp.text3, fontSize: s.t1, lineHeight: 1.3 }}>{item.desc}</p>
                <div className="flex items-center gap-1 mt-1 flex-wrap">
                  <span className="px-1.5 py-0.5 rounded-full text-white" style={{ background: dietaryColor(item.dietary), fontSize: s.t1 }}>
                    {item.dietary}
                  </span>
                  <SpiceDots level={item.spice} s={s} />
                </div>
                <p className="mt-1" style={{ color: realApp.text3, fontSize: s.t1 }}>{item.prepMin} min prep{item.variants > 0 ? ` · +${item.variants} sizes` : ''}</p>
                {item.allergens.length > 0 && (
                  <div className="flex items-center gap-1 mt-1 flex-wrap">
                    <span style={{ color: realApp.text3, fontSize: s.t1, fontWeight: 600 }}>Contains:</span>
                    {item.allergens.map((a) => (
                      <span key={a} className="px-1 py-0.5 rounded" style={{ background: 'rgba(255,165,0,0.1)', border: '1px solid rgba(255,165,0,0.3)', color: 'orange', fontSize: s.t1 }}>{a}</span>
                    ))}
                  </div>
                )}
                <div className="flex items-center justify-between mt-1.5 pt-1.5" style={{ borderTop: `1px solid ${realApp.border}` }}>
                  <span className="font-bold" style={{ color: realApp.gold, fontSize: s.t2 }}>{item.price}</span>
                  <div className="flex items-center gap-1">
                    {item.qty > 0 && (
                      <div className="flex items-center gap-0.5 rounded-full" style={{ background: realApp.surface2, border: `1px solid ${realApp.border}`, padding: '1px 3px' }}>
                        <span style={{ color: realApp.text1, fontSize: s.t1, width: 8, textAlign: 'center' }}>−</span>
                        <span style={{ color: realApp.text1, fontSize: s.t1, fontWeight: 700, minWidth: 8, textAlign: 'center' }}>{item.qty}</span>
                        <span style={{ color: realApp.red, fontSize: s.t1, width: 8, textAlign: 'center' }}>+</span>
                      </div>
                    )}
                    <span className="rounded-full px-2 py-0.5 font-semibold text-white" style={{ background: item.qty > 0 ? realApp.success : realApp.red, fontSize: s.t1 }}>
                      {item.qty > 0 ? '✓ In Cart' : 'Add'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
