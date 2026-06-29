import React from 'react'
import { motion } from 'framer-motion'
import {
  MessageCircle, TrendingUp, Sparkles, Package, ChefHat, HeartHandshake, Star, Users, ShieldCheck,
} from 'lucide-react'
import { AI_AGENTS } from '../constants'
import SectionLabel from './SectionLabel'
import { colors } from '../tokens'

const ICON_MAP = {
  MessageCircle, TrendingUp, Sparkles, Package, ChefHat, HeartHandshake, Star, Users,
} as const satisfies Record<string, React.ComponentType<{ size?: number; style?: React.CSSProperties }>>

export default function AIAgentsSection() {
  return (
    <section id="ai-agents" className="py-32 px-6 relative overflow-hidden" style={{ background: colors.bg }}>
      <div
        aria-hidden
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage:
            'radial-gradient(circle at 20% 30%, rgba(59,130,246,0.15) 0%, transparent 40%), radial-gradient(circle at 80% 70%, rgba(212,175,55,0.12) 0%, transparent 40%)',
        }}
      />

      <div className="max-w-7xl mx-auto relative z-10">
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <SectionLabel>Your digital team</SectionLabel>
          <h2
            className="text-4xl md:text-5xl font-bold text-white mb-4"
            style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
          >
            Eight assistants. One calm operation.
          </h2>
          <div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm text-gray-400"
            style={{ border: `1px solid ${colors.goldBorder}`, background: colors.goldMuted }}
          >
            <ShieldCheck size={14} style={{ color: colors.gold }} />
            MaSoVa suggests · You approve · Then it happens
          </div>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {AI_AGENTS.map((agent, i) => (
            <AgentCard key={agent.name} agent={agent} index={i} />
          ))}
        </div>
      </div>
    </section>
  )
}

type Agent = (typeof AI_AGENTS)[number]

function AgentCard({ agent, index }: { agent: Agent; index: number }) {
  const Icon = ICON_MAP[agent.lucideIcon as keyof typeof ICON_MAP]

  return (
    <motion.div
      className="agent-card-glow flex flex-col rounded-2xl relative overflow-hidden h-full transition-shadow duration-300"
      style={{
        background: colors.bgElevated,
        border: `1px solid ${colors.border}`,
        borderTop: `3px solid ${agent.color}`,
      }}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.04 }}
      whileHover={{ y: -4 }}
    >
      <div className="p-5 flex flex-col flex-1">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
          style={{ background: `${agent.color}18` }}
        >
          {Icon && <Icon size={20} style={{ color: agent.color }} />}
        </div>
        <h3 className="text-white font-semibold text-sm mb-1">{agent.name}</h3>
        <p className="text-[10px] uppercase tracking-wider mb-2" style={{ color: agent.color }}>
          {agent.role}
        </p>
        <p className="text-gray-500 text-xs leading-relaxed flex-1">{agent.description}</p>
      </div>
    </motion.div>
  )
}