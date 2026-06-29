import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { CheckCircle2, XCircle, ArrowRight } from 'lucide-react'
import { PRICING_TIERS } from '../constants'
import SectionLabel from './SectionLabel'
import { colors } from '../tokens'

export default function PricingSection() {
  const [annual, setAnnual] = useState(false)

  return (
    <section id="pricing" className="bg-[#080808] py-32 px-6">
      <div className="max-w-7xl mx-auto">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <SectionLabel>Pricing</SectionLabel>
          <h2
            className="text-4xl md:text-5xl font-bold text-white mb-6"
            style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
          >
            Simple, transparent pricing
          </h2>

          <div className="inline-flex items-center gap-3 rounded-full p-1" style={{ background: 'rgba(255,255,255,0.05)' }}>
            <button
              type="button"
              onClick={() => setAnnual(false)}
              className="px-4 py-1.5 rounded-full text-sm font-medium transition-all"
              style={!annual ? { background: colors.gold, color: colors.bg } : { color: '#9CA3AF' }}
            >
              Monthly
            </button>
            <button
              type="button"
              onClick={() => setAnnual(true)}
              className="px-4 py-1.5 rounded-full text-sm font-medium transition-all"
              style={annual ? { background: colors.gold, color: colors.bg } : { color: '#9CA3AF' }}
            >
              Annual
              <span className="ml-2 text-xs font-semibold" style={{ color: annual ? colors.bg : colors.gold }}>
                −17%
              </span>
            </button>
          </div>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6">
          {PRICING_TIERS.map(({ name, price, tagline, highlight, badge, features, cta }, i) => {
            const displayPrice = price ? (annual ? Math.round(price * 0.83) : price) : null
            const ctaHref = cta === 'Contact sales' ? 'mailto:hello@masova.com' : 'mailto:hello@masova.com?subject=MaSoVa%20free%20trial'

            return (
              <motion.div
                key={name}
                className="relative p-6 rounded-2xl flex flex-col"
                style={
                  highlight
                    ? { border: `1px solid ${colors.goldBorderStrong}`, background: colors.goldMuted }
                    : { border: `1px solid ${colors.border}`, background: colors.bgElevated }
                }
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                whileHover={{ y: -4 }}
              >
                {badge && (
                  <div
                    className="absolute -top-3 left-1/2 -translate-x-1/2 text-xs font-semibold px-3 py-1 rounded-full"
                    style={{ background: colors.gold, color: colors.bg }}
                  >
                    {badge}
                  </div>
                )}

                <div className="mb-6">
                  <h3 className="text-white font-bold text-lg mb-1">{name}</h3>
                  <p className="text-gray-500 text-sm mb-4">{tagline}</p>
                  {displayPrice ? (
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-bold text-white">€{displayPrice}</span>
                      <span className="text-gray-500 text-sm">/month</span>
                    </div>
                  ) : (
                    <div className="text-3xl font-bold text-white">Custom</div>
                  )}
                  {annual && price && (
                    <p className="text-xs text-gray-500 mt-1">Billed annually · 2 months free</p>
                  )}
                </div>

                <ul className="space-y-2.5 flex-1 mb-6">
                  {features.map(({ icon: Icon, text, included }) => (
                    <li key={text} className="flex items-start gap-2.5">
                      {included
                        ? <CheckCircle2 size={15} style={{ color: colors.gold }} className="flex-shrink-0 mt-0.5" />
                        : <XCircle size={15} className="text-gray-700 flex-shrink-0 mt-0.5" />
                      }
                      <span className={`text-sm flex items-center gap-1.5 ${included ? 'text-gray-300' : 'text-gray-600'}`}>
                        <Icon size={13} className={included ? 'text-gray-500' : 'text-gray-700'} />
                        {text}
                      </span>
                    </li>
                  ))}
                </ul>

                <a
                  href={ctaHref}
                  className="group flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all duration-200"
                  style={
                    highlight
                      ? { background: colors.gold, color: colors.bg }
                      : { background: 'rgba(255,255,255,0.08)', color: '#fff' }
                  }
                >
                  {cta}
                  <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" />
                </a>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}