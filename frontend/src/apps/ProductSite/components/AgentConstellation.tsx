import { motion } from 'framer-motion'
import { Bot } from 'lucide-react'
import { colors } from '../tokens'

const NODES = [
  { x: '12%', y: '22%', delay: 0, label: 'Support' },
  { x: '78%', y: '18%', delay: 0.4, label: 'Forecast' },
  { x: '88%', y: '52%', delay: 0.8, label: 'Inventory' },
  { x: '68%', y: '78%', delay: 1.2, label: 'Kitchen' },
  { x: '32%', y: '82%', delay: 1.6, label: 'Churn' },
  { x: '8%', y: '58%', delay: 2, label: 'Reviews' },
  { x: '48%', y: '12%', delay: 2.4, label: 'Pricing' },
  { x: '22%', y: '42%', delay: 2.8, label: 'Shifts' },
]

/** Ambient agent mesh behind the hero — purely decorative */
export default function AgentConstellation() {
  return (
    <div aria-hidden className="agent-constellation" style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
      <svg className="absolute inset-0 w-full h-full opacity-40" preserveAspectRatio="none">
        <defs>
          <linearGradient id="agent-line" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={colors.gold} stopOpacity="0" />
            <stop offset="50%" stopColor={colors.gold} stopOpacity="0.35" />
            <stop offset="100%" stopColor={colors.gold} stopOpacity="0" />
          </linearGradient>
        </defs>
        {NODES.map((a, i) =>
          NODES.slice(i + 1).map(b => (
            <line
              key={`${a.label}-${b.label}`}
              x1={a.x}
              y1={a.y}
              x2={b.x}
              y2={b.y}
              stroke="url(#agent-line)"
              strokeWidth="1"
              className="agent-mesh-line"
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          )),
        )}
      </svg>

      {NODES.map(node => (
        <motion.div
          key={node.label}
          className="agent-node"
          style={{ left: node.x, top: node.y }}
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: node.delay }}
        >
          <span className="agent-node-ring" />
          <Bot size={12} style={{ color: colors.gold, position: 'relative', zIndex: 1 }} />
        </motion.div>
      ))}

      <motion.div
        className="agent-core-pulse"
        style={{
          position: 'absolute',
          left: '50%',
          top: '48%',
          transform: 'translate(-50%, -50%)',
          width: 120,
          height: 120,
          borderRadius: '50%',
          border: `1px solid ${colors.goldBorder}`,
          background: `radial-gradient(circle, ${colors.goldMuted} 0%, transparent 70%)`,
        }}
        animate={{ scale: [1, 1.08, 1], opacity: [0.4, 0.7, 0.4] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      />
    </div>
  )
}