import { motion } from 'framer-motion'
import { MessageCircle, BarChart3, ChefHat, Navigation, MapPin, type LucideIcon } from 'lucide-react'
import { AI_AGENTS } from '../constants'

const ICON_MAP: Record<string, LucideIcon> = {
  MessageCircle,
  BarChart3,
  ChefHat,
  Navigation,
  MapPin,
}

export default function AIAgentsSection() {
  const topRow = AI_AGENTS.slice(0, 2)
  const bottomRow = AI_AGENTS.slice(2)

  return (
    <section id="ai-agents" className="bg-[#0A0A0A] py-32 px-6">
      <div className="max-w-7xl mx-auto">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <p className="text-sm font-medium mb-4 tracking-wide uppercase" style={{ color: '#E53E3E' }}>AI Agents</p>
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Five agents. One restaurant that runs itself.
          </h2>
          <p className="text-gray-400 max-w-xl mx-auto">
            Every agent is live and working today — from the moment a customer taps your app to the second the driver drops off the order.
          </p>
        </motion.div>

        {/* Top row: 2 agents centred */}
        <div className="flex flex-wrap justify-center gap-6 mb-6">
          {topRow.map((agent, i) => (
            <AgentCard key={agent.name} agent={agent} index={i} />
          ))}
        </div>

        {/* Bottom row: 3 agents */}
        <div className="flex flex-wrap justify-center gap-6">
          {bottomRow.map((agent, i) => (
            <AgentCard key={agent.name} agent={agent} index={i + 2} />
          ))}
        </div>
      </div>
    </section>
  )
}

type Agent = (typeof AI_AGENTS)[number]

function AgentCard({ agent, index }: { agent: Agent; index: number }) {
  const Icon = ICON_MAP[agent.lucideIcon]

  return (
    <motion.div
      className="flex flex-col rounded-2xl relative overflow-hidden"
      style={{
        width: '300px',
        background: '#111111',
        border: '1px solid rgba(255,255,255,0.08)',
        borderTop: `3px solid ${agent.color}`,
      }}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      whileHover={{ scale: 1.03 }}
    >
      {/* Live badge */}
      <div className="absolute top-4 right-4 flex items-center gap-1.5">
        <span className="w-2 h-2 rounded-full bg-green-400 block" style={{ boxShadow: '0 0 6px #4ADE80' }} />
        <span className="text-xs font-medium text-green-400">Live</span>
      </div>

      <div className="p-6 flex flex-col flex-1">
        {/* Icon */}
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
          style={{ background: `${agent.color}1A` }}
        >
          {Icon && <Icon size={20} style={{ color: agent.color }} />}
        </div>

        {/* Name + role */}
        <h3 className="text-white font-semibold mb-1">{agent.name}</h3>
        <p className="text-xs font-medium mb-3" style={{ color: agent.color }}>{agent.role}</p>

        {/* Description */}
        <p className="text-gray-400 text-sm leading-relaxed">{agent.description}</p>
      </div>
    </motion.div>
  )
}
