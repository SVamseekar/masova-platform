import { motion } from 'framer-motion'
import { Smartphone, Users, CheckCircle2 } from 'lucide-react'
import { MOBILE_APPS } from '../constants'
import SectionLabel from './SectionLabel'
import { colors } from '../tokens'

function PhoneMock({ accent, children }: { accent: string; children: React.ReactNode }) {
  return (
    <div
      className="mx-auto w-[220px] rounded-[2rem] p-2 relative"
      style={{
        background: 'linear-gradient(160deg, #2a2a2a, #111)',
        border: '1px solid rgba(255,255,255,0.12)',
        boxShadow: `0 32px 80px rgba(0,0,0,0.5), 0 0 40px ${accent}18`,
      }}
    >
      <div className="absolute top-3 left-1/2 -translate-x-1/2 w-16 h-1 rounded-full bg-black/60 z-10" />
      <div
        className="rounded-[1.5rem] overflow-hidden min-h-[380px] flex flex-col"
        style={{ background: colors.bgElevated, border: `1px solid ${accent}33` }}
      >
        {children}
      </div>
    </div>
  )
}

export default function MobileEcosystemSection() {
  const customer = MOBILE_APPS[0]
  const crew = MOBILE_APPS[1]

  return (
    <section id="mobile" className="py-32 px-6" style={{ background: colors.bgAlt }}>
      <div className="max-w-7xl mx-auto">
        <motion.div
          className="text-center mb-16 max-w-3xl mx-auto"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <SectionLabel>Mobile apps</SectionLabel>
          <h2
            className="text-4xl md:text-5xl font-bold text-white mb-4 leading-tight"
            style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
          >
            Your brand in every pocket
          </h2>
          <p className="text-gray-400 text-lg">
            Customers order on your branded app. Kitchen, drivers, cashiers, and managers each get
            the right screen — no confusion, no extra logins.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-16 items-start">
          {/* Customer app */}
          <motion.div
            initial={{ opacity: 0, x: -24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="flex flex-col items-center lg:items-end lg:pr-8"
          >
            <PhoneMock accent={customer.accentColor}>
              <div className="p-5 flex-1 flex flex-col gap-3">
                <div className="flex items-center gap-2 mb-2">
                  <Smartphone size={16} style={{ color: customer.accentColor }} />
                  <span className="text-xs font-semibold text-white">{customer.name}</span>
                </div>
                <p className="text-[11px] text-gray-500 leading-relaxed">{customer.tagline}</p>
                <div className="mt-auto space-y-2">
                  {customer.highlights.slice(0, 4).map(h => (
                    <div key={h} className="flex items-center gap-2 text-[11px] text-gray-400">
                      <CheckCircle2 size={12} style={{ color: customer.accentColor }} />
                      {h}
                    </div>
                  ))}
                </div>
              </div>
            </PhoneMock>
            <p className="text-center lg:text-right text-gray-500 text-sm mt-6 max-w-xs">
              Card payments · live delivery tracking · in-app chat support
            </p>
          </motion.div>

          {/* Crew app */}
          <motion.div
            initial={{ opacity: 0, x: 24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="flex flex-col items-center lg:items-start lg:pl-8"
          >
            <PhoneMock accent={colors.gold}>
              <div className="p-5 flex-1 flex flex-col gap-3">
                <div className="flex items-center gap-2 mb-2">
                  <Users size={16} style={{ color: colors.gold }} />
                  <span className="text-xs font-semibold text-white">{crew.name}</span>
                </div>
                <p className="text-[11px] text-gray-500 leading-relaxed">{crew.tagline}</p>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {(crew.roles ?? []).map(role => (
                    <div
                      key={role.label}
                      className="rounded-lg px-2 py-2 text-center"
                      style={{ background: `${role.color}18`, border: `1px solid ${role.color}44` }}
                    >
                      <p className="text-[10px] font-bold" style={{ color: role.color }}>
                        {role.label}
                      </p>
                    </div>
                  ))}
                </div>
                <div className="mt-auto space-y-2">
                  {crew.highlights.slice(0, 3).map(h => (
                    <div key={h} className="flex items-center gap-2 text-[11px] text-gray-400">
                      <CheckCircle2 size={12} style={{ color: colors.gold }} />
                      {h}
                    </div>
                  ))}
                </div>
              </div>
            </PhoneMock>
            <p className="text-center lg:text-left text-gray-500 text-sm mt-6 max-w-xs">
              Works when Wi‑Fi drops · driver GPS · instant kitchen alerts
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  )
}