import { Scale, Shield, MapPin, Cpu, Star } from 'lucide-react'
import { realApp } from './realAppTheme'

function Mini({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="mt-4 rounded-xl p-3"
      style={{ background: realApp.bg, border: `1px solid ${realApp.border}` }}
    >
      {children}
    </div>
  )
}

function Row({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="flex items-center justify-between py-1">
      <span className="text-[10px]" style={{ color: realApp.text3 }}>{label}</span>
      <span className="text-[10px] font-medium" style={{ color: color ?? realApp.text1 }}>{value}</span>
    </div>
  )
}

function DashboardMockup() {
  const sections = [
    { name: 'Orders', badge: '12 live' },
    { name: 'Inventory', badge: '3 low' },
    { name: 'Operations', badge: null },
    { name: 'People', badge: '18 on shift' },
    { name: 'Analytics', badge: null },
    { name: 'Compliance', badge: '✓ signed' },
    { name: 'AI Agents', badge: '8 active' },
    { name: 'Aggregators', badge: '4 synced' },
  ]
  return (
    <Mini>
      <div className="grid grid-cols-4 gap-1.5">
        {sections.map((s, i) => (
          <div
            key={s.name}
            className="rounded-md px-1.5 py-1.5 text-center"
            style={{ background: i === 0 ? 'rgba(198,42,9,0.12)' : realApp.surface, border: `1px solid ${i === 0 ? realApp.red : realApp.border}` }}
          >
            <p className="text-[8px]" style={{ color: i === 0 ? realApp.redLight : realApp.text2 }}>{s.name}</p>
            {s.badge && <p className="text-[7px] mt-0.5" style={{ color: realApp.gold }}>{s.badge}</p>}
          </div>
        ))}
      </div>
    </Mini>
  )
}

function VatMockup() {
  const countries = [
    { c: 'DE', rate: '19%', status: 'Signed' },
    { c: 'FR', rate: '20%', status: 'Signed' },
    { c: 'BE', rate: '21%', status: 'Pending' },
  ]
  return (
    <Mini>
      <div className="flex items-center gap-2 mb-1.5">
        <Scale size={12} style={{ color: realApp.gold }} />
        <span className="text-[10px] font-medium" style={{ color: realApp.text1 }}>Fiscal signing · 3 countries</span>
      </div>
      {countries.map((row) => (
        <div key={row.c} className="flex items-center justify-between py-0.5">
          <span className="text-[9px]" style={{ color: realApp.text3 }}>{row.c} · {row.rate} VAT</span>
          <span className="text-[9px] font-medium" style={{ color: row.status === 'Signed' ? realApp.success : realApp.warning }}>{row.status}</span>
        </div>
      ))}
    </Mini>
  )
}

function PosMockup() {
  const rows = [
    { label: 'Table 4', mode: 'Dine-in', total: '€38.20' },
    { label: 'Order #118', mode: 'Takeaway', total: '€14.90' },
    { label: 'Order #117', mode: 'Delivery', total: '€27.60' },
  ]
  return (
    <Mini>
      <div className="grid grid-cols-3 gap-1.5 mb-1.5">
        {['Dine-in', 'Takeaway', 'Delivery'].map((m, i) => (
          <div key={m} className="rounded-md py-1.5 text-center" style={{ background: i === 0 ? 'rgba(198,42,9,0.12)' : realApp.surface, border: `1px solid ${i === 0 ? realApp.red : realApp.border}` }}>
            <p className="text-[7px]" style={{ color: i === 0 ? realApp.redLight : realApp.text2 }}>{m}</p>
          </div>
        ))}
      </div>
      {rows.map((r) => (
        <Row key={r.label} label={`${r.label} · ${r.mode}`} value={r.total} color={realApp.gold} />
      ))}
    </Mini>
  )
}

function AllergenMockup() {
  const items = [
    { name: 'Chicken Biryani', tags: ['Nuts'] },
    { name: 'Margherita Pizza', tags: ['Dairy', 'Gluten'] },
    { name: 'Dal Tadka', tags: [] },
  ]
  return (
    <Mini>
      {items.map((it) => (
        <div key={it.name} className="flex items-center justify-between py-1">
          <span className="text-[9px]" style={{ color: realApp.text2 }}>{it.name}</span>
          <div className="flex gap-1">
            {it.tags.length === 0 ? (
              <span className="text-[8px]" style={{ color: realApp.success }}>✓ clear</span>
            ) : (
              it.tags.map((t) => (
                <span key={t} className="text-[7px] px-1.5 py-0.5 rounded-full" style={{ background: 'rgba(239,68,68,0.15)', color: '#EF4444', border: '1px solid rgba(239,68,68,0.3)' }}>
                  {t}
                </span>
              ))
            )}
          </div>
        </div>
      ))}
    </Mini>
  )
}

function InventoryMockup() {
  const stock = [
    { name: 'Tomatoes', level: '4.2 kg', status: 'Low', color: realApp.warning },
    { name: 'Basmati Rice', level: '38 kg', status: 'OK', color: realApp.success },
    { name: 'Mozzarella', level: '1.1 kg', status: 'Critical', color: realApp.red },
  ]
  return (
    <Mini>
      {stock.map((s) => (
        <div key={s.name} className="flex items-center justify-between py-1">
          <span className="text-[9px]" style={{ color: realApp.text2 }}>{s.name}</span>
          <div className="flex items-center gap-1.5">
            <span className="text-[9px]" style={{ color: realApp.text3 }}>{s.level}</span>
            <span className="text-[8px] px-1.5 py-0.5 rounded-full" style={{ background: `${s.color}22`, color: s.color }}>{s.status}</span>
          </div>
        </div>
      ))}
    </Mini>
  )
}

function StaffMockup() {
  const shifts = [{ n: 'Mon', v: 60 }, { n: 'Tue', v: 80 }, { n: 'Wed', v: 45 }, { n: 'Thu', v: 90 }, { n: 'Fri', v: 100 }, { n: 'Sat', v: 95 }, { n: 'Sun', v: 70 }]
  return (
    <Mini>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[9px] font-medium" style={{ color: realApp.text1 }}>This week's coverage</span>
        <span className="text-[8px]" style={{ color: realApp.success }}>18 on shift now</span>
      </div>
      <div className="flex items-end gap-1.5 h-10">
        {shifts.map((s) => (
          <div key={s.n} className="flex-1 rounded-t" style={{ height: `${s.v}%`, background: realApp.gold }} />
        ))}
      </div>
    </Mini>
  )
}

function LoyaltyMockup() {
  const tiers = [{ label: 'Bronze', color: '#B08D57' }, { label: 'Silver', color: '#9CA3AF' }, { label: 'Gold', color: realApp.gold }, { label: 'Platinum', color: '#E5E7EB' }]
  return (
    <Mini>
      <div className="flex items-center gap-1.5 mb-1.5">
        {tiers.map((t) => (
          <span key={t.label} className="text-[8px] px-1.5 py-0.5 rounded-full" style={{ background: `${t.color}22`, color: t.color, border: `1px solid ${t.color}44` }}>
            {t.label}
          </span>
        ))}
      </div>
      <div className="flex items-center gap-1 text-[9px] mb-1" style={{ color: realApp.text2 }}>
        <Star size={10} style={{ color: realApp.gold }} /> 4.8 avg · 212 reviews
      </div>
      <Row label="Active campaign" value="Weekend 15% off" color={realApp.gold} />
    </Mini>
  )
}

function RefundsMockup() {
  return (
    <Mini>
      <Row label="Refund #R-118" value="Pending" color={realApp.warning} />
      <Row label="Refund #R-117" value="Approved" color={realApp.success} />
      <Row label="Refund #R-116" value="Approved" color={realApp.success} />
      <Row label="Daily reconciled" value="€1,240.00" color={realApp.gold} />
    </Mini>
  )
}

function GdprMockup() {
  const rows = [
    { label: 'Export request #C-3391', status: 'Processed' },
    { label: 'Erasure request #C-3388', status: 'In progress' },
  ]
  return (
    <Mini>
      <div className="flex items-center gap-2 mb-1.5">
        <Shield size={12} style={{ color: realApp.success }} />
        <span className="text-[10px] font-medium" style={{ color: realApp.text1 }}>Compliance requests</span>
      </div>
      {rows.map((r) => (
        <Row key={r.label} label={r.label} value={r.status} color={r.status === 'Processed' ? realApp.success : realApp.warning} />
      ))}
    </Mini>
  )
}

function ZonesMockup() {
  const zones = [
    { label: 'Zone A · 0–3km', fee: '€1.90' },
    { label: 'Zone B · 3–6km', fee: '€2.90' },
    { label: 'Zone C · 6–10km', fee: '€4.50' },
  ]
  return (
    <Mini>
      <div className="flex items-center gap-2 mb-1.5">
        <MapPin size={12} style={{ color: realApp.red }} />
        <span className="text-[10px] font-medium" style={{ color: realApp.text1 }}>Berlin Mitte · 3 zones</span>
      </div>
      {zones.map((z) => (
        <Row key={z.label} label={z.label} value={z.fee} />
      ))}
    </Mini>
  )
}

function EquipmentMockup() {
  const equipment = [
    { name: 'Walk-in fridge', reading: '3.8°C', ok: true },
    { name: 'Freezer unit 2', reading: '-18°C', ok: true },
    { name: 'Oven 1', reading: 'Maintenance due', ok: false },
  ]
  return (
    <Mini>
      <div className="flex items-center gap-2 mb-1.5">
        <Cpu size={12} style={{ color: realApp.info }} />
        <span className="text-[10px] font-medium" style={{ color: realApp.text1 }}>Equipment status</span>
      </div>
      {equipment.map((e) => (
        <Row key={e.name} label={e.name} value={e.reading} color={e.ok ? realApp.success : realApp.warning} />
      ))}
    </Mini>
  )
}

const MOCKUPS: Record<string, () => React.JSX.Element> = {
  dashboard: DashboardMockup,
  vat: VatMockup,
  pos: PosMockup,
  allergen: AllergenMockup,
  inventory: InventoryMockup,
  staff: StaffMockup,
  loyalty: LoyaltyMockup,
  refunds: RefundsMockup,
  gdpr: GdprMockup,
  zones: ZonesMockup,
  equipment: EquipmentMockup,
}

export default function FeatureMockup({ mockupId }: { mockupId: string }) {
  const Mockup = MOCKUPS[mockupId]
  if (!Mockup) return null
  return <Mockup />
}
