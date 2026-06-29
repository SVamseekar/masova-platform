import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  MessageCircle, TrendingUp, Sparkles, Package, ChefHat, HeartHandshake, Star, Users,
} from 'lucide-react'
import { AGENT_STORY_STEPS, type AgentIconKey } from '../constants'
import SectionLabel from './SectionLabel'
import { colors } from '../tokens'

const STORY_ICONS: Record<AgentIconKey, React.ComponentType<{ size?: number; style?: React.CSSProperties }>> = {
  MessageCircle, TrendingUp, Sparkles, Package, ChefHat, HeartHandshake, Star, Users,
}

export default function AgentScrollStory() {
  const [active, setActive] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setActive(prev => (prev + 1) % AGENT_STORY_STEPS.length)
    }, 7000)
    return () => clearInterval(timer)
  }, [])

  const step = AGENT_STORY_STEPS[active]
  const StepIcon = STORY_ICONS[step.iconKey]

  return (
    <section id="agent-story" className="py-32 px-6" style={{ background: colors.bg }}>
      <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
        <div>
          <SectionLabel>A day in your business</SectionLabel>
          <h2
            className="text-3xl md:text-4xl font-bold text-white mb-4"
            style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
          >
            Your restaurants never sleep.
            <br />
            <span style={{ color: colors.gold }}>MaSoVa keeps watch.</span>
          </h2>
          <p className="text-gray-400 text-sm mb-8 max-w-md leading-relaxed">
            Tap a moment below to see what happens behind the scenes — while you focus on service.
          </p>

          <div className="space-y-2 mb-6">
            {AGENT_STORY_STEPS.map((s, i) => (
              <button
                key={s.time}
                type="button"
                onClick={() => setActive(i)}
                className="w-full flex items-center gap-3 py-2.5 px-3 rounded-lg text-left transition-all duration-200"
                style={{
                  opacity: i === active ? 1 : 0.55,
                  background: i === active ? `${s.color}12` : 'transparent',
                  border: i === active ? `1px solid ${s.color}44` : '1px solid transparent',
                }}
              >
                <span
                  className="text-xs w-16 shrink-0 font-medium"
                  style={{ color: i === active ? s.color : colors.textMuted }}
                >
                  {s.time}
                </span>
                <span
                  className="h-px flex-1 max-w-[40px]"
                  style={{ background: i === active ? s.color : colors.border }}
                />
                <span className="text-sm text-gray-300 flex-1">{s.agent}</span>
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={step.time}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.3 }}
              className="rounded-xl p-5"
              style={{ background: colors.bgElevated, border: `1px solid ${step.color}44` }}
            >
              <p className="text-xs mb-2 font-medium" style={{ color: step.color }}>
                {step.time} · {step.agent}
              </p>
              <p className="text-white text-lg font-medium mb-2">{step.headline}</p>
              <p className="text-gray-400 text-sm leading-relaxed mb-3">{step.body}</p>
              <p className="text-gray-500 text-xs">{step.action}</p>
            </motion.div>
          </AnimatePresence>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={step.time}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.35 }}
            className="relative rounded-2xl aspect-square max-w-md mx-auto w-full"
            style={{ border: `1px solid ${colors.goldBorder}`, background: colors.bgElevated }}
          >
            <div className="absolute inset-0 flex items-center justify-center p-8">
              <div className="text-center">
                <div
                  className="w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center"
                  style={{ background: `${step.color}22`, border: `2px solid ${step.color}` }}
                >
                  <StepIcon size={36} style={{ color: step.color }} />
                </div>
                <p className="text-white font-semibold text-xl mb-2">{step.agent}</p>
                <p className="text-gray-500 text-sm leading-relaxed max-w-[220px] mx-auto">{step.action}</p>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  )
}