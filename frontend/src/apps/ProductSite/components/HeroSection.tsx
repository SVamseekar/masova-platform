import { motion } from 'framer-motion'
import { Bot, Sparkles } from 'lucide-react'
import { colors, motion as motionTokens } from '../tokens'
import { STATS } from '../constants'
import AgentConstellation from './AgentConstellation'
import RealAppMockup from './RealAppMockup'

const headlineVariant = (delay: number) => ({
  initial: { opacity: 0, y: 32 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.65, delay, ease: [0.22, 1, 0.36, 1] },
  },
})

const fadeUpVariant = (delay: number) => ({
  initial: motionTokens.fadeUp.initial,
  animate: {
    ...motionTokens.fadeUp.animate,
    transition: { ...motionTokens.ease, delay },
  },
})

export default function HeroSection() {
  return (
    <section
      style={{
        position: 'relative',
        overflow: 'hidden',
        background: colors.bg,
        paddingTop: 96,
        paddingBottom: 80,
        paddingLeft: 24,
        paddingRight: 24,
      }}
    >
      <AgentConstellation />

      <div
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'radial-gradient(ellipse 70% 50% at 50% 40%, rgba(212,175,55,0.08) 0%, transparent 65%)',
          pointerEvents: 'none',
        }}
      />

      <div style={{ position: 'relative', zIndex: 1, maxWidth: 800, margin: '0 auto', textAlign: 'center' }}>
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            background: 'rgba(212,175,55,0.1)',
            border: '1px solid rgba(212,175,55,0.35)',
            borderRadius: 999,
            padding: '6px 16px',
            marginBottom: 28,
          }}
        >
          <Bot size={14} style={{ color: colors.gold }} />
          <span style={{ fontSize: 13, color: colors.gold, fontWeight: 600 }}>
            Built for multi-location restaurants
          </span>
          <Sparkles size={12} style={{ color: colors.goldLight }} />
        </motion.div>

        <h1 style={{ margin: 0, marginBottom: 24, fontWeight: 800, lineHeight: 1.05 }}>
          <motion.span
            variants={headlineVariant(0.05)}
            initial="initial"
            animate="animate"
            style={{
              display: 'block',
              color: colors.textPrimary,
              fontSize: 'clamp(42px, 6.5vw, 82px)',
              letterSpacing: '-0.03em',
              fontFamily: "'Playfair Display', Georgia, serif",
            }}
          >
            Run every location.
          </motion.span>
          <motion.span
            variants={headlineVariant(0.15)}
            initial="initial"
            animate="animate"
            style={{
              display: 'block',
              color: colors.gold,
              fontSize: 'clamp(42px, 6.5vw, 82px)',
              letterSpacing: '-0.03em',
              fontFamily: "'Playfair Display', Georgia, serif",
            }}
          >
            With less chaos.
          </motion.span>
        </h1>

        <motion.p
          {...fadeUpVariant(0.28)}
          style={{
            color: colors.textSecondary,
            fontSize: 'clamp(17px, 2vw, 20px)',
            maxWidth: 560,
            lineHeight: 1.65,
            margin: '0 auto 36px',
          }}
        >
          Orders, kitchen, delivery, and customer questions — in one calm system. Smart assistants
          handle the busywork; you and your managers approve every important decision.
        </motion.p>

        <motion.div
          {...fadeUpVariant(0.38)}
          style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 40 }}
        >
          <a
            href="#agent-brain"
            style={{
              background: colors.red,
              color: '#fff',
              fontWeight: 700,
              fontSize: 15,
              padding: '14px 28px',
              borderRadius: 10,
              textDecoration: 'none',
              boxShadow: '0 8px 28px rgba(250,45,72,0.32)',
            }}
          >
            See how it works
          </a>
          <a
            href="#demo"
            style={{
              color: colors.gold,
              fontSize: 15,
              fontWeight: 500,
              textDecoration: 'none',
              padding: '14px 20px',
              border: `1px solid ${colors.goldBorder}`,
              borderRadius: 10,
            }}
          >
            Watch a quick demo →
          </a>
        </motion.div>

        <motion.div
          {...fadeUpVariant(0.48)}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto mb-16"
        >
          {STATS.map(({ value, label, icon: Icon }, i) => (
            <div
              key={label}
              className="rounded-xl py-4 px-3"
              style={{ background: colors.bgElevated, border: `1px solid ${colors.border}` }}
            >
              <Icon size={16} style={{ color: i % 2 === 0 ? colors.red : colors.gold, margin: '0 auto 8px' }} />
              <p className="text-2xl font-bold text-white">{value}</p>
              <p className="text-[11px] text-gray-500 mt-1">{label}</p>
            </div>
          ))}
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.55 }}
        style={{ position: 'relative', zIndex: 1, maxWidth: 920, margin: '0 auto' }}
      >
        <RealAppMockup size="large" />
      </motion.div>
    </section>
  )
}