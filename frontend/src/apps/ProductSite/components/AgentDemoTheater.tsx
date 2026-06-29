import { useState } from 'react'
import { motion } from 'framer-motion'
import { Play, Sparkles, MessageCircle } from 'lucide-react'
import SectionLabel from './SectionLabel'
import { colors } from '../tokens'

const DEMO_CHATS = [
  { role: 'customer' as const, text: 'Where is my order #2041?' },
  { role: 'agent' as const, text: 'Order #2041 is OUT_FOR_DELIVERY — driver Marco, ETA 8 minutes. Want live tracking?' },
  { role: 'customer' as const, text: 'Any gluten-free mains tonight?' },
  { role: 'agent' as const, text: 'Yes — Grilled Sea Bass and Dal Tadka are marked gluten-free. Shall I add one to your cart?' },
]

export default function AgentDemoTheater() {
  const [playing, setPlaying] = useState(false)
  const [visibleLines, setVisibleLines] = useState(0)

  const startDemo = () => {
    setPlaying(true)
    setVisibleLines(0)
    DEMO_CHATS.forEach((_, i) => {
      setTimeout(() => setVisibleLines(i + 1), (i + 1) * 900)
    })
  }

  return (
    <section id="demo" className="py-32 px-6" style={{ background: '#050505' }}>
      <div className="max-w-7xl mx-auto">
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
            See how customers get help — instantly
          </h2>
          <p className="text-gray-400 max-w-xl mx-auto">
            Full video walkthroughs coming soon. For now, click the preview to watch a sample chat —
            the same experience your guests get in the app.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-8 items-center">
          {/* Video placeholder */}
          <motion.div
            className="relative rounded-2xl overflow-hidden aspect-video group cursor-pointer"
            style={{ border: `1px solid ${colors.goldBorder}`, background: colors.bgElevated }}
            whileHover={{ scale: 1.01 }}
            onClick={startDemo}
          >
            <div
              className="absolute inset-0 flex flex-col items-center justify-center gap-4 z-10"
              style={{
                background: 'linear-gradient(180deg, rgba(8,8,8,0.3) 0%, rgba(8,8,8,0.85) 100%)',
              }}
            >
              <motion.div
                className="w-16 h-16 rounded-full flex items-center justify-center"
                style={{ background: colors.redMuted, border: `1px solid ${colors.redBorder}` }}
                animate={playing ? { scale: [1, 1.1, 1] } : {}}
                transition={{ duration: 1.5, repeat: playing ? Infinity : 0 }}
              >
                <Play size={28} style={{ color: colors.red, marginLeft: 4 }} fill={colors.red} />
              </motion.div>
              <p className="text-white font-medium">Customer chat · 2 min preview</p>
              <p className="text-gray-500 text-sm">Video demo uploading — click to try the chat</p>
            </div>
            <div className="absolute inset-0 agent-demo-grid opacity-40" />
          </motion.div>

          {/* Chat simulation */}
          <div
            className="rounded-2xl overflow-hidden flex flex-col min-h-[320px]"
            style={{ border: `1px solid ${colors.border}`, background: colors.bgElevated }}
          >
            <div className="px-4 py-3 flex items-center gap-2" style={{ borderBottom: `1px solid ${colors.border}` }}>
              <Sparkles size={16} style={{ color: colors.gold }} />
              <span className="text-sm text-white font-medium">Customer chat</span>
              <span className="ml-auto text-[10px] text-green-400">● online</span>
            </div>
            <div className="p-4 flex-1 space-y-3 overflow-y-auto">
              {DEMO_CHATS.slice(0, visibleLines).map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${msg.role === 'customer' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className="max-w-[85%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed"
                    style={
                      msg.role === 'customer'
                        ? { background: '#1f2937', color: '#e5e7eb' }
                        : { background: colors.redMuted, color: '#f3f4f6', border: `1px solid ${colors.redBorder}` }
                    }
                  >
                    {msg.role === 'agent' && (
                      <MessageCircle size={12} className="inline mr-1.5 opacity-60" style={{ color: colors.red }} />
                    )}
                    {msg.text}
                  </div>
                </motion.div>
              ))}
              {visibleLines === 0 && (
                <p className="text-gray-600 text-sm text-center py-8">Click the preview to start the demo chat</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}