import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { AI_AGENTS } from '../constants'

function CustomerAgentDemo({ messages }: { messages: { role: string; text: string }[] }) {
  const [visible, setVisible] = useState(0)
  useEffect(() => {
    if (visible >= messages.length) return
    const t = setTimeout(() => setVisible(v => v + 1), 1200)
    return () => clearTimeout(t)
  }, [visible, messages.length])

  return (
    <div className="mt-4 space-y-2">
      {messages.slice(0, visible).map((m, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
        >
          <span
            className="text-xs px-3 py-2 rounded-xl max-w-[80%]"
            style={
              m.role === 'user'
                ? { background: '#E53E3E', color: 'white' }
                : { background: 'rgba(255,255,255,0.08)', color: '#D1D5DB' }
            }
          >
            {m.text}
          </span>
        </motion.div>
      ))}
    </div>
  )
}

function KitchenAgentDemo({ alerts }: { alerts: { type: string; text: string }[] }) {
  const [visible, setVisible] = useState(0)
  useEffect(() => {
    if (visible >= alerts.length) return
    const t = setTimeout(() => setVisible(v => v + 1), 1400)
    return () => clearTimeout(t)
  }, [visible, alerts.length])

  const colors: Record<string, React.CSSProperties> = {
    warning: { color: '#FBBF24', background: 'rgba(251,191,36,0.1)' },
    info: { color: '#60A5FA', background: 'rgba(96,165,250,0.1)' },
    success: { color: '#34D399', background: 'rgba(52,211,153,0.1)' },
  }

  return (
    <div className="mt-4 space-y-2">
      {alerts.slice(0, visible).map((a, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          className="text-xs px-3 py-2 rounded-xl"
          style={colors[a.type] ?? {}}
        >
          {a.text}
        </motion.div>
      ))}
    </div>
  )
}

function ManagerAgentDemo({ queries }: { queries: { q: string; a: string }[] }) {
  const [visible, setVisible] = useState(0)
  useEffect(() => {
    if (visible >= queries.length * 2) return
    const t = setTimeout(() => setVisible(v => v + 1), 1000)
    return () => clearTimeout(t)
  }, [visible, queries.length])

  return (
    <div className="mt-4 space-y-3">
      {queries.map((q, i) => (
        <div key={i}>
          {visible > i * 2 && (
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xs text-gray-500 mb-1">
              ❓ {q.q}
            </motion.p>
          )}
          {visible > i * 2 + 1 && (
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xs text-gray-300 px-3 py-2 rounded-xl" style={{ background: 'rgba(255,255,255,0.05)' }}>
              {q.a}
            </motion.p>
          )}
        </div>
      ))}
    </div>
  )
}

export default function AIAgentsSection() {
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
            Your restaurant runs itself.
          </h2>
          <p className="text-gray-400 max-w-xl mx-auto">
            Three AI agents work 24/7 — handling customers, watching the kitchen, and surfacing insights for managers.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6">
          {AI_AGENTS.map(({ icon: Icon, name, tagline, desc, messages, alerts, queries }, i) => (
            <motion.div
              key={name}
              className="p-6 rounded-2xl bg-[#111111] flex flex-col"
              style={{ border: '1px solid rgba(255,255,255,0.08)' }}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
            >
              <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4" style={{ background: 'rgba(229,62,62,0.1)' }}>
                <Icon size={20} style={{ color: '#E53E3E' }} />
              </div>
              <h3 className="text-white font-semibold">{name}</h3>
              <p className="text-xs mb-2" style={{ color: '#E53E3E' }}>{tagline}</p>
              <p className="text-gray-500 text-sm leading-relaxed mb-4">{desc}</p>
              <div className="flex-1 min-h-[140px]">
                {messages && <CustomerAgentDemo messages={messages} />}
                {alerts && <KitchenAgentDemo alerts={alerts} />}
                {queries && <ManagerAgentDemo queries={queries} />}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
