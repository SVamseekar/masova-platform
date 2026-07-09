import { useState, useEffect, useRef, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Sparkles, MessageCircle } from 'lucide-react'
import SectionLabel from './SectionLabel'
import LiveOrderStrip from './LiveOrderStrip'
import { colors } from '../tokens'

// Mirrors the real ChatWidget's product theme (chatWidgetTheme.ts, isProductSite branch)
// and PRODUCT_QUICK_ACTIONS — this is the actual "Agent" widget live on this page, not a fake demo.
const CHAT_BRAND = '#D4AF37'
const CHAT_BRAND_MUTED = 'rgba(212,175,55,0.18)'
const CHAT_PANEL_BG = '#121212'
const CHAT_MESSAGES_BG = '#0a0a0a'
const CHAT_AGENT_BUBBLE = '#141414'

const QUICK_ACTIONS = [
  { label: 'Explain the agents', icon: Sparkles },
  { label: 'Compare plans', icon: MessageCircle },
]

// Three short scenarios, looped — each a different kind of question the Support Agent
// handles, to read as "a lot happening" rather than one fixed script.
const DEMO_SCENARIOS: { role: 'agent' | 'user'; text: string }[][] = [
  [
    { role: 'agent', text: "I'm the Support Agent — not a FAQ bot. I reason over your question and pull real product context before I answer. What should I look into?" },
    { role: 'user', text: 'How do MaSoVa smart assistants work for restaurant managers?' },
    { role: 'agent', text: '8 assistants run in the background — demand forecasting, stock alerts, review replies, shift suggestions. Every one drafts an action; a manager approves before anything goes live.' },
  ],
  [
    { role: 'user', text: 'Where is my order #2041?' },
    { role: 'agent', text: 'Order #2041 is OUT_FOR_DELIVERY — driver Marco, ETA 8 minutes. Want live tracking?' },
  ],
  [
    { role: 'user', text: 'Does the Margherita pizza contain gluten?' },
    { role: 'agent', text: 'Yes — Margherita Pizza is flagged for Gluten and Dairy under our 14-EU-allergen system. That badge shows on the customer menu and the kitchen ticket automatically.' },
  ],
]

const DEMO_CHATS = DEMO_SCENARIOS.flat()

export default function AgentDemoTheater() {
  const [visibleLines, setVisibleLines] = useState(0)
  const sectionRef = useRef<HTMLElement>(null)
  const timersRef = useRef<number[]>([])
  const hasAutoStarted = useRef(false)

  const startDemo = useCallback(() => {
    const runOnce = () => {
      timersRef.current.forEach((id) => window.clearTimeout(id))
      timersRef.current = []
      setVisibleLines(0)
      DEMO_CHATS.forEach((_, i) => {
        const id = window.setTimeout(() => setVisibleLines(i + 1), (i + 1) * 900)
        timersRef.current.push(id)
      })
      const loopId = window.setTimeout(runOnce, DEMO_CHATS.length * 900 + 3500)
      timersRef.current.push(loopId)
    }
    runOnce()
  }, [])

  useEffect(() => {
    const section = sectionRef.current
    if (!section) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAutoStarted.current) {
          hasAutoStarted.current = true
          startDemo()
        }
      },
      { threshold: 0.35 },
    )
    observer.observe(section)
    return () => {
      observer.disconnect()
      timersRef.current.forEach((id) => window.clearTimeout(id))
    }
  }, [startDemo])

  return (
    <section ref={sectionRef} id="demo" className="py-32 px-6 scroll-mt-20" style={{ background: '#050505' }}>
      <div className="max-w-3xl mx-auto">
        <motion.div
          className="text-center mb-14"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <SectionLabel>See it live</SectionLabel>
          <h2
            className="text-4xl md:text-5xl font-bold text-white mb-4"
            style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
          >
            The same Support Agent, right on this page
          </h2>
          <p className="text-gray-400 max-w-xl mx-auto">
            This isn't a mockup of a chat — it's the real widget. Click the <span style={{ color: CHAT_BRAND }}>Agent</span> button in the corner to talk to it yourself.
          </p>
        </motion.div>

        <motion.div
          className="mb-10"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <LiveOrderStrip compact />
        </motion.div>

        {/* Real chat panel replica — same layout/theme as components/chat/ChatWidget.tsx */}
        <motion.div
          className="rounded-2xl overflow-hidden mx-auto"
          style={{ maxWidth: 420, background: CHAT_PANEL_BG, border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 28px 80px rgba(0,0,0,0.75)' }}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <div className="flex items-center gap-2.5 px-4 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ background: CHAT_BRAND_MUTED, border: `1px solid ${CHAT_BRAND}` }}
            >
              <MessageCircle size={14} style={{ color: CHAT_BRAND }} />
            </div>
            <div>
              <p className="text-white text-sm font-semibold leading-tight">Support Agent</p>
              <p className="text-[10px] leading-tight" style={{ color: CHAT_BRAND }}>8 tools wired · proposes, never auto-acts</p>
            </div>
            <span className="ml-auto text-[10px] text-green-400">● online</span>
          </div>

          <div className="p-4 flex flex-col gap-3 overflow-y-auto" style={{ background: CHAT_MESSAGES_BG, minHeight: 280 }}>
            {DEMO_CHATS.slice(0, visibleLines).map((msg, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className="max-w-[85%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed"
                  style={
                    msg.role === 'user'
                      ? { background: colors.red, color: '#fff' }
                      : { background: CHAT_AGENT_BUBBLE, color: '#e5e7eb', border: '1px solid rgba(212,175,55,0.15)' }
                  }
                >
                  {msg.text}
                </div>
              </motion.div>
            ))}
            {visibleLines === 0 && (
              <p className="text-gray-600 text-sm text-center py-8">Loading conversation…</p>
            )}
          </div>

          {visibleLines >= DEMO_CHATS.length && (
            <div className="p-3 flex gap-2 flex-wrap" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
              {QUICK_ACTIONS.map(({ label, icon: Icon }) => (
                <span
                  key={label}
                  className="flex items-center gap-1.5 text-[11px] px-3 py-1.5 rounded-full"
                  style={{ background: CHAT_BRAND_MUTED, color: CHAT_BRAND, border: `1px solid ${CHAT_BRAND}44` }}
                >
                  <Icon size={11} /> {label}
                </span>
              ))}
            </div>
          )}

          <div className="px-4 py-3 flex items-center gap-2" style={{ borderTop: '1px solid rgba(255,255,255,0.08)', background: '#1a1a1a' }}>
            <span className="flex-1 text-sm" style={{ color: '#6b7280' }}>Tell the agent what to check…</span>
            <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: colors.red }}>
              <span className="text-white text-xs">→</span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
