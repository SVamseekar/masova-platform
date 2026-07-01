import React, { type ComponentType, type CSSProperties } from 'react'
import { motion } from 'framer-motion'
import { FEATURES } from '../constants'
import SectionLabel from './SectionLabel'
import Reveal, { REVEAL_VIEWPORT } from './Reveal'
import { colors } from '../tokens'

const FEATURED = FEATURES.filter((f) => f.size === 'large')
const STANDARD = FEATURES.filter((f) => f.size === 'small')

interface FeatureCardProps {
  icon: ComponentType<{ size?: number; style?: CSSProperties }>
  title: string
  desc: string
  screenshot: string | null
  index: number
}

function FeatureCard({ icon: Icon, title, desc, screenshot, index }: FeatureCardProps) {
  return (
    <motion.div
      className="rounded-2xl bg-[#111111] transition-all duration-300 overflow-hidden flex flex-col h-full"
      style={{ border: `1px solid ${colors.border}` }}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={REVEAL_VIEWPORT}
      transition={{ duration: 0.5, delay: index * 0.05 }}
      whileHover={{ y: -2 }}
    >
      <div className="p-6 flex-1">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
          style={{ background: colors.redMuted }}
        >
          <Icon size={20} style={{ color: colors.red }} />
        </div>
        <h3 className="text-white font-semibold mb-2">{title}</h3>
        <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
      </div>
      {screenshot && (
        <div className="mt-auto overflow-hidden" style={{ borderRadius: '0 0 12px 12px' }}>
          <img
            src={screenshot}
            alt={title}
            loading="lazy"
            className="w-full block object-cover"
            style={{ maxHeight: 200 }}
          />
        </div>
      )}
    </motion.div>
  )
}

export default function FeaturesGrid() {
  return (
    <section id="features" className="bg-[#080808] py-32 px-6 scroll-mt-20">
      <div className="max-w-7xl mx-auto">
        <Reveal className="text-center mb-16">
          <SectionLabel>Also included</SectionLabel>
          <h2
            className="text-4xl md:text-5xl font-bold text-white"
            style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
          >
            Built for the full operation
          </h2>
        </Reveal>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          {FEATURED.map(({ icon, title, desc, screenshot }, i) => (
            <FeatureCard key={title} icon={icon} title={title} desc={desc} screenshot={screenshot} index={i} />
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {STANDARD.map(({ icon, title, desc, screenshot }, i) => (
            <FeatureCard key={title} icon={icon} title={title} desc={desc} screenshot={screenshot} index={i + FEATURED.length} />
          ))}
        </div>
      </div>
    </section>
  )
}