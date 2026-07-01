import React from 'react'
import { motion } from 'framer-motion'
import { Rocket, Building2, Headphones, ArrowRight } from 'lucide-react'
import SectionLabel from './SectionLabel'
import Reveal, { REVEAL_VIEWPORT } from './Reveal'
import { colors, typography } from '../tokens'
import { openContactForm } from '../constants'

interface OnboardingCardProps {
  icon: React.ReactNode
  title: string
  description: string
  footer?: React.ReactNode
  delay?: number
}

function OnboardingCard({ icon, title, description, footer, delay = 0 }: OnboardingCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={REVEAL_VIEWPORT}
      transition={{ duration: 0.5, delay }}
      className="rounded-2xl p-6 flex flex-col h-full"
      style={{ background: colors.bgElevated, border: `1px solid ${colors.border}` }}
    >
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
        style={{ background: colors.redMuted }}
      >
        {icon}
      </div>
      <h3 className="text-white font-semibold mb-2">{title}</h3>
      <p className="text-gray-500 text-sm leading-relaxed flex-1">{description}</p>
      {footer && <div className="mt-4 pt-4 border-t border-white/5">{footer}</div>}
    </motion.div>
  )
}

export default function DeveloperSection() {
  return (
    <section id="getting-started" className="bg-[#080808] py-32 px-6">
      <div className="max-w-7xl mx-auto">
        <Reveal className="text-center mb-16 space-y-4">
          <SectionLabel>Onboarding & support</SectionLabel>
          <h2
            className="text-4xl md:text-5xl font-bold text-white leading-tight"
            style={{ fontFamily: typography.fontDisplay }}
          >
            We set you up. We stay with you.
          </h2>
          <p className="text-gray-400 text-sm md:text-base max-w-xl mx-auto leading-relaxed">
            Most restaurants are live within 48 hours. One site or many — hands-on onboarding and
            a team that answers when you call.
          </p>
        </Reveal>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <OnboardingCard
            icon={<Rocket size={20} style={{ color: colors.red }} />}
            title="Fast onboarding"
            description="We import your menu, configure locations, and train your managers. No IT project required."
            footer={
              <span className="text-xs text-gray-500">Typical go-live: 48 hours</span>
            }
          />
          <OnboardingCard
            icon={<Building2 size={20} style={{ color: colors.red }} />}
            title="Built for multi-location"
            description="One dashboard for every site — compare sales, spot slow kitchens, and roll out menu changes everywhere."
            delay={0.08}
            footer={
              <div className="flex flex-wrap gap-2">
                {['Franchise', 'Regional ops', 'Scaling brands'].map((label) => (
                  <span
                    key={label}
                    className="text-[10px] font-medium text-gray-400 bg-[#1a1a1a] border border-white/5 rounded-full px-2.5 py-1"
                  >
                    {label}
                  </span>
                ))}
              </div>
            }
          />
          <OnboardingCard
            icon={<Headphones size={20} style={{ color: colors.red }} />}
            title="Real support"
            description="Chat on Growth plans. Phone and a dedicated account manager on Enterprise. We speak restaurant."
            delay={0.16}
            footer={
              <button
                type="button"
                onClick={() => openContactForm()}
                className="inline-flex items-center gap-1.5 text-xs font-semibold transition-all hover:opacity-85 cursor-pointer"
                style={{ color: colors.red }}
              >
                Book a walkthrough
                <ArrowRight size={13} />
              </button>
            }
          />
        </div>
      </div>
    </section>
  )
}