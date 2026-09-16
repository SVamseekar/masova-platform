import { realApp } from '../realAppTheme'

type ScaleProps = { t1: string; t2: string; t3: string; t4: string; gap: string; pad: number; sidebar: string; mapH: string; frameH: number }

// Mirrors real ProfilePage.tsx: loyalty tier card, nav rail, overview stats (EU customer).
export default function ProfileScreen({ s }: { s: ScaleProps }) {
  const nav = ['Overview', 'Personal Info', 'Addresses', 'Food Preferences', 'Notifications']

  return (
    <div className="h-full overflow-hidden flex flex-col" style={{ background: realApp.bg }}>
      {/* Tier card */}
      <div
        className="rounded-md mx-2 mt-2"
        style={{
          background: 'linear-gradient(135deg, #2A1A0A 0%, #3D2410 50%, #1A0E05 100%)',
          border: `1px solid ${realApp.gold}`,
          padding: s.pad * 0.7,
        }}
      >
        <p style={{ color: realApp.gold, fontSize: s.t1, fontWeight: 700, letterSpacing: '0.06em' }}>BRONZE MEMBER</p>
        <p style={{ color: realApp.text1, fontSize: s.t3, fontWeight: 700, fontFamily: realApp.fontDisplay, marginTop: 2 }}>
          Anna Mueller
        </p>
        <p style={{ color: realApp.text2, fontSize: s.t1, marginTop: 2 }}>840 / 1,000 pts to Silver</p>
        <div className="mt-1 rounded-full overflow-hidden" style={{ height: 4, background: 'rgba(255,255,255,0.1)' }}>
          <div style={{ width: '84%', height: '100%', background: realApp.gold }} />
        </div>
      </div>

      <div className="flex flex-1 min-h-0 mt-2 px-2 gap-2">
        {/* Nav rail */}
        <div className="flex flex-col" style={{ width: s.sidebar, gap: 4 }}>
          {nav.map((label, i) => (
            <div
              key={label}
              className="rounded"
              style={{
                padding: `${s.pad * 0.25}px ${s.pad * 0.35}px`,
                background: i === 0 ? realApp.surface2 : 'transparent',
                border: i === 0 ? `1px solid ${realApp.border}` : '1px solid transparent',
                color: i === 0 ? realApp.gold : realApp.text3,
                fontSize: s.t1,
                fontWeight: i === 0 ? 600 : 400,
              }}
            >
              {label}
            </div>
          ))}
        </div>

        {/* Overview */}
        <div className="flex-1 overflow-hidden flex flex-col" style={{ gap: 6 }}>
          <p style={{ color: realApp.text1, fontSize: s.t2, fontWeight: 700 }}>Overview</p>
          <div className="grid grid-cols-2 gap-1.5">
            {[
              { label: 'Orders', value: '12' },
              { label: 'Saved €', value: '48' },
              { label: 'Points', value: '840' },
              { label: 'Fav store', value: 'Berlin' },
            ].map((stat) => (
              <div
                key={stat.label}
                className="rounded"
                style={{
                  background: realApp.surface,
                  border: `1px solid ${realApp.border}`,
                  padding: s.pad * 0.4,
                }}
              >
                <p style={{ color: realApp.text3, fontSize: s.t1 }}>{stat.label}</p>
                <p style={{ color: realApp.text1, fontSize: s.t2, fontWeight: 700 }}>{stat.value}</p>
              </div>
            ))}
          </div>
          <div
            className="rounded flex-1"
            style={{
              background: realApp.surface,
              border: `1px solid ${realApp.border}`,
              padding: s.pad * 0.4,
            }}
          >
            <p style={{ color: realApp.text2, fontSize: s.t1, marginBottom: 4 }}>Recent order</p>
            <p style={{ color: realApp.text1, fontSize: s.t2, fontWeight: 600 }}>#SEED-ORD-042 · €24.90</p>
            <p style={{ color: realApp.success, fontSize: s.t1, marginTop: 2 }}>Delivered · Mitte</p>
          </div>
        </div>
      </div>
    </div>
  )
}
