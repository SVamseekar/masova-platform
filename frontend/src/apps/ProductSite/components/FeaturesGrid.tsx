import { type ComponentType, type CSSProperties } from 'react'
import { FEATURES } from '../constants'
import SectionLabel from './SectionLabel'
import Reveal from './Reveal'
import FeatureMockup from './FeatureMockup'
import { colors } from '../tokens'

interface FeatureCardProps {
  icon: ComponentType<{ size?: number; style?: CSSProperties }>
  title: string
  desc: string
  mockupId: string
}

function FeatureCard({ icon: Icon, title, desc, mockupId }: FeatureCardProps) {
  return (
    <div
      className="rounded-2xl bg-[#111111] flex-shrink-0 flex flex-col"
      style={{ border: `1px solid ${colors.border}`, width: 300 }}
    >
      <div className="p-6 flex-1 flex flex-col">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
          style={{ background: colors.redMuted }}
        >
          <Icon size={20} style={{ color: colors.red }} />
        </div>
        <h3 className="text-white font-semibold mb-2">{title}</h3>
        <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
        <FeatureMockup mockupId={mockupId} />
      </div>
    </div>
  )
}

export default function FeaturesGrid() {
  const doubled = [...FEATURES, ...FEATURES]

  return (
    <section id="features" className="bg-[#080808] py-32 scroll-mt-20 overflow-hidden">
      <div className="max-w-7xl mx-auto px-6">
        <Reveal className="text-center mb-16">
          <SectionLabel>Also included</SectionLabel>
          <h2
            className="text-4xl md:text-5xl font-bold text-white"
            style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
          >
            Built for the full operation
          </h2>
          <p className="text-gray-500 mt-3">Hover to pause · scroll to browse at your own pace</p>
        </Reveal>
      </div>

      <div className="feature-filmstrip relative">
        <div
          className="absolute inset-y-0 left-0 w-24 z-10 pointer-events-none"
          style={{ background: 'linear-gradient(90deg, #080808 0%, transparent 100%)' }}
        />
        <div
          className="absolute inset-y-0 right-0 w-24 z-10 pointer-events-none"
          style={{ background: 'linear-gradient(270deg, #080808 0%, transparent 100%)' }}
        />
        <div className="flex gap-4 animate-feature-marquee w-max px-6">
          {doubled.map(({ icon, title, desc, mockupId }, i) => (
            <FeatureCard key={`${title}-${i}`} icon={icon} title={title} desc={desc} mockupId={mockupId} />
          ))}
        </div>
      </div>
    </section>
  )
}
