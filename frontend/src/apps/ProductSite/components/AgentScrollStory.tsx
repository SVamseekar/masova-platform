import React, { useRef, useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  MessageCircle, TrendingUp, Sparkles, Package, ChefHat, HeartHandshake, Star, Users,
} from 'lucide-react'
import { AGENT_STORY_STEPS, type AgentIconKey } from '../constants'

const STORY_ICONS: Record<AgentIconKey, React.ComponentType<{ size?: number; style?: React.CSSProperties }>> = {
  MessageCircle, TrendingUp, Sparkles, Package, ChefHat, HeartHandshake, Star, Users,
}
import SectionLabel from './SectionLabel'
import { colors } from '../tokens'

export default function AgentScrollStory() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState(0)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    const onScroll = () => {
      const rect = el.getBoundingClientRect()
      const progress = Math.min(1, Math.max(0, -rect.top / (rect.height - window.innerHeight)))
      const idx = Math.min(AGENT_STORY_STEPS.length - 1, Math.floor(progress * AGENT_STORY_STEPS.length))
      setActive(idx)
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const step = AGENT_STORY_STEPS[active]
  const StepIcon = STORY_ICONS[step.iconKey]

  return (
    <section id="agent-story" ref={containerRef} className="relative" style={{ minHeight: '280vh', background: colors.bg }}>
      <div className="sticky top-0 h-screen flex items-center px-6 overflow-hidden">
        <div className="absolute inset-0 agent-scanlines opacity-20 pointer-events-none" />

        <div className="max-w-7xl mx-auto w-full grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <SectionLabel>A day in your business</SectionLabel>
            <h2
              className="text-3xl md:text-4xl font-bold text-white mb-6"
              style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
            >
              Your restaurants never sleep.
              <br />
              <span style={{ color: colors.gold }}>MaSoVa keeps watch.</span>
            </h2>

            <div className="space-y-2 mb-8">
              {AGENT_STORY_STEPS.map((s, i) => (
                <div
                  key={s.time}
                  className="flex items-center gap-3 py-2 transition-opacity duration-300"
                  style={{ opacity: i === active ? 1 : 0.35 }}
                >
                  <span
                    className="text-xs w-16 shrink-0"
                    style={{ color: i === active ? s.color : colors.textMuted }}
                  >
                    {s.time}
                  </span>
                  <span
                    className="h-px flex-1"
                    style={{ background: i === active ? s.color : colors.border }}
                  />
                  <span className="text-sm text-gray-400">{s.agent}</span>
                </div>
              ))}
            </div>

            <motion.div
              key={step.time}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35 }}
              className="rounded-xl p-5"
              style={{ background: colors.bgElevated, border: `1px solid ${step.color}44` }}
            >
              <p className="text-xs mb-2" style={{ color: step.color }}>
                {step.time} · {step.agent}
              </p>
              <p className="text-white text-lg font-medium mb-2">{step.headline}</p>
              <p className="text-gray-400 text-sm leading-relaxed">{step.body}</p>
            </motion.div>
          </div>

          <motion.div
            className="relative rounded-2xl aspect-square max-w-md mx-auto w-full"
            style={{ border: `1px solid ${colors.goldBorder}`, background: colors.bgElevated }}
            animate={{
              boxShadow: [
                `0 0 40px ${step.color}22`,
                `0 0 80px ${step.color}33`,
                `0 0 40px ${step.color}22`,
              ],
            }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            <div className="absolute inset-0 flex items-center justify-center p-8">
              <div className="text-center">
                <motion.div
                  className="w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center"
                  style={{ background: `${step.color}22`, border: `2px solid ${step.color}` }}
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <StepIcon size={36} style={{ color: step.color }} />
                </motion.div>
                <p className="text-white font-semibold text-xl mb-2">{step.agent}</p>
                <p className="text-gray-500 text-sm">{step.action}</p>
              </div>
            </div>
            <div className="agent-orbit-ring absolute inset-4 rounded-full pointer-events-none" />
          </motion.div>
        </div>
      </div>
    </section>
  )
}