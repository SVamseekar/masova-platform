import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Bot, ShieldCheck, Radio } from 'lucide-react'
import { AGENT_LIVE_FEED, AI_AGENTS } from '../constants'
import SectionLabel from './SectionLabel'
import { colors } from '../tokens'

export default function AgentCommandCenter() {
  const [active, setActive] = useState(0)
  const agent = AI_AGENTS[active]

  return (
    <section id="agent-brain" className="py-32 px-6 relative overflow-hidden" style={{ background: colors.bgAlt }}>
      <div
        aria-hidden
        className="absolute inset-0 opacity-30"
        style={{
          background:
            'radial-gradient(ellipse 80% 50% at 50% 0%, rgba(212,175,55,0.12) 0%, transparent 60%)',
        }}
      />

      <div className="max-w-7xl mx-auto relative z-10">
        <motion.div
          className="text-center mb-14 max-w-3xl mx-auto"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <SectionLabel>Agent command center</SectionLabel>
          <h2
            className="text-4xl md:text-5xl font-bold text-white mb-4 leading-tight"
            style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
          >
            Eight specialists.
            <br />
            <span style={{ color: colors.gold }}>One manager in control.</span>
          </h2>
          <p className="text-gray-400 text-lg">
            <strong className="text-gray-300 font-normal">masova-support</strong> runs on Google ADK + Gemini.
            Agents draft. Managers approve. Nothing hits production without a human sign-off.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-5 gap-6 items-stretch">
          {/* Agent selector */}
          <div className="lg:col-span-2 flex flex-col gap-2 max-h-[420px] overflow-y-auto pr-1 agent-feed-scroll">
            {AI_AGENTS.map((a, i) => (
              <button
                key={a.name}
                type="button"
                onClick={() => setActive(i)}
                className="text-left rounded-xl px-4 py-3 transition-all duration-200"
                style={{
                  background: active === i ? `${a.color}18` : colors.bgElevated,
                  border: `1px solid ${active === i ? `${a.color}55` : colors.border}`,
                }}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Bot size={14} style={{ color: a.color }} />
                  <span className="text-sm font-semibold text-white">{a.name}</span>
                  {i < 3 && (
                    <span className="ml-auto text-[10px] text-green-400 flex items-center gap-1">
                      <Radio size={10} /> live
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500">{a.role}</p>
              </button>
            ))}
          </div>

          {/* Live terminal */}
          <div
            className="lg:col-span-3 rounded-2xl overflow-hidden flex flex-col min-h-[420px]"
            style={{ border: `1px solid ${colors.goldBorder}`, background: '#0a0a0a' }}
          >
            <div
              className="px-4 py-3 flex items-center justify-between"
              style={{ borderBottom: `1px solid ${colors.border}`, background: colors.bgElevated }}
            >
              <div className="flex items-center gap-2">
                <div className="flex gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500/50" />
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500/50" />
                  <span className="w-2.5 h-2.5 rounded-full bg-green-500/50" />
                </div>
                <span className="text-xs font-mono text-gray-500 ml-2">masova-support · agent stream</span>
              </div>
              <span className="text-[10px] text-gray-600 font-mono">POST /agents/{'{name}'}/trigger</span>
            </div>

            <div className="p-5 flex-1 font-mono text-sm space-y-3 overflow-hidden">
              <AnimatePresence mode="wait">
                <motion.div
                  key={agent.name}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.25 }}
                >
                  <p style={{ color: agent.color }} className="mb-3">
                    ▸ {agent.name} — {agent.role}
                  </p>
                  <p className="text-gray-400 leading-relaxed mb-4">{agent.description}</p>
                  {AGENT_LIVE_FEED[active]?.map((line, li) => (
                    <motion.p
                      key={line}
                      className="text-gray-500 text-xs mb-2 pl-3"
                      style={{ borderLeft: `2px solid ${agent.color}44` }}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: li * 0.12 }}
                    >
                      {line}
                    </motion.p>
                  ))}
                </motion.div>
              </AnimatePresence>
            </div>

            <div
              className="px-4 py-3 flex items-center gap-2 text-xs"
              style={{ borderTop: `1px solid ${colors.border}`, background: `${colors.gold}08` }}
            >
              <ShieldCheck size={14} style={{ color: colors.gold }} />
              <span className="text-gray-400">
                Propose-then-approve · <span className="text-gray-300">awaiting manager</span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}