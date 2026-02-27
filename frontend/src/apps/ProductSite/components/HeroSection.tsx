import { motion } from 'framer-motion'
import { colors, motion as motionTokens } from '../tokens'

// ---------------------------------------------------------------------------
// Animation variants
// ---------------------------------------------------------------------------

const eyebrowVariant = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
}

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

const screenshotVariant = {
  initial: { opacity: 0, y: 40 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.8, delay: 0.6, ease: [0.22, 1, 0.36, 1] },
  },
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function BackgroundLayers() {
  return (
    <div
      aria-hidden
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 0,
        // Grid texture — bottom-most layer
        backgroundImage:
          'repeating-linear-gradient(0deg, transparent, transparent 79px, rgba(255,255,255,0.02) 80px)',
      }}
    >
      {/* Top-left gold blob */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'radial-gradient(ellipse 600px 400px at 10% 30%, rgba(212,175,55,0.07) 0%, transparent 70%)',
        }}
      />
      {/* Top-right white whisper blob */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'radial-gradient(ellipse 500px 350px at 90% 20%, rgba(255,255,255,0.03) 0%, transparent 70%)',
        }}
      />
    </div>
  )
}

function EyebrowBadge() {
  return (
    <motion.div
      variants={eyebrowVariant}
      initial="initial"
      animate="animate"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        background: 'rgba(212,175,55,0.08)',
        border: '1px solid rgba(212,175,55,0.2)',
        borderRadius: 999,
        padding: '4px 14px',
        marginBottom: 28,
      }}
    >
      {/* Pulsing gold dot */}
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: '50%',
          background: colors.gold,
          display: 'inline-block',
          animation: 'pulse 2s cubic-bezier(0.4,0,0.6,1) infinite',
        }}
      />
      <span
        style={{
          fontSize: 13,
          color: colors.gold,
          fontFamily: "'Inter', system-ui, sans-serif",
          fontWeight: 500,
          letterSpacing: '0.01em',
        }}
      >
        Now live across Europe
      </span>
    </motion.div>
  )
}

function Headline() {
  return (
    <div style={{ marginBottom: 24 }}>
      <motion.div
        variants={headlineVariant(0.05)}
        initial="initial"
        animate="animate"
      >
        <span
          style={{
            display: 'block',
            color: colors.textPrimary,
            fontWeight: 800,
            fontSize: 'clamp(48px, 7vw, 88px)',
            letterSpacing: '-0.03em',
            lineHeight: 1,
            fontFamily: "'Inter', system-ui, sans-serif",
          }}
        >
          The Restaurant OS
        </span>
      </motion.div>

      <motion.div
        variants={headlineVariant(0.15)}
        initial="initial"
        animate="animate"
      >
        <span
          style={{
            display: 'block',
            color: colors.gold,
            fontWeight: 800,
            fontSize: 'clamp(48px, 7vw, 88px)',
            letterSpacing: '-0.03em',
            lineHeight: 1,
            fontFamily: "'Inter', system-ui, sans-serif",
          }}
        >
          Built for Growth.
        </span>
      </motion.div>
    </div>
  )
}

function Subheading() {
  return (
    <motion.p
      {...fadeUpVariant(0.3)}
      style={{
        color: colors.textSecondary,
        fontSize: 'clamp(17px, 2vw, 21px)',
        maxWidth: 520,
        lineHeight: 1.6,
        margin: '0 auto 40px',
        fontFamily: "'Inter', system-ui, sans-serif",
        fontWeight: 400,
      }}
    >
      One platform. Every shift, every store, every order.
    </motion.p>
  )
}

function CTARow() {
  return (
    <motion.div
      {...fadeUpVariant(0.4)}
      style={{
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 16,
        flexWrap: 'wrap',
        marginBottom: 28,
      }}
    >
      <PrimaryButton />
      <SecondaryButton />
    </motion.div>
  )
}

function PrimaryButton() {
  const handleEnter = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.currentTarget.style.background = '#f0f0f0'
  }
  const handleLeave = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.currentTarget.style.background = colors.textPrimary
  }

  return (
    <a
      href="#pricing"
      style={{
        background: colors.textPrimary,
        color: colors.bg,
        fontWeight: 600,
        fontSize: 15,
        padding: '14px 28px',
        borderRadius: 10,
        textDecoration: 'none',
        display: 'inline-block',
        fontFamily: "'Inter', system-ui, sans-serif",
        transition: 'background 0.15s ease',
        cursor: 'pointer',
        whiteSpace: 'nowrap',
      }}
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
    >
      Start free trial
    </a>
  )
}

function SecondaryButton() {
  const handleEnter = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.currentTarget.style.color = '#ffffff'
  }
  const handleLeave = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.currentTarget.style.color = colors.textSecondary
  }

  return (
    <a
      href="#demo"
      style={{
        color: colors.textSecondary,
        fontSize: 15,
        fontWeight: 500,
        textDecoration: 'none',
        display: 'inline-block',
        fontFamily: "'Inter', system-ui, sans-serif",
        transition: 'color 0.15s ease',
        cursor: 'pointer',
        whiteSpace: 'nowrap',
      }}
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
    >
      Book a demo →
    </a>
  )
}

function SocialProofStrip() {
  return (
    <motion.div
      {...fadeUpVariant(0.48)}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        color: colors.textMuted,
        fontSize: 13,
        fontFamily: "'Inter', system-ui, sans-serif",
      }}
    >
      <span>Trusted by restaurant groups across</span>
      <span style={{ letterSpacing: '0.05em' }}>🇩🇪 🇳🇱 🇧🇪 🇮🇪 🇬🇧</span>
    </motion.div>
  )
}

function BrowserChrome() {
  return (
    <div
      style={{
        background: '#111111',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        padding: '10px 16px',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
      }}
    >
      {/* Traffic-light dots */}
      <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
        <div style={{ width: 12, height: 12, borderRadius: '50%', background: 'rgba(255,95,87,0.5)' }} />
        <div style={{ width: 12, height: 12, borderRadius: '50%', background: 'rgba(255,189,68,0.5)' }} />
        <div style={{ width: 12, height: 12, borderRadius: '50%', background: 'rgba(40,201,100,0.5)' }} />
      </div>

      {/* URL bar */}
      <div
        style={{
          flex: 1,
          background: 'rgba(255,255,255,0.05)',
          borderRadius: 6,
          padding: '4px 12px',
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <span
          style={{
            fontSize: 12,
            color: colors.textSubtle,
            fontFamily: "'Inter', system-ui, sans-serif",
          }}
        >
          app.masova.eu/order
        </span>
      </div>
    </div>
  )
}

function ScreenshotFrame() {
  return (
    <motion.div
      variants={screenshotVariant}
      initial="initial"
      animate="animate"
      style={{
        maxWidth: 900,
        width: '100%',
        margin: '64px auto 0',
        position: 'relative',
      }}
    >
      {/* Ambient glow behind the frame */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: 14,
          boxShadow: '0 0 120px 40px rgba(212,175,55,0.06)',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      {/* Frame */}
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          borderRadius: 14,
          overflow: 'hidden',
          border: `1px solid ${colors.border}`,
          boxShadow: '0 32px 80px rgba(0,0,0,0.6)',
        }}
      >
        <BrowserChrome />
        <img
          src="/screenshots/customer-home.png"
          alt="MaSoVa online ordering dashboard"
          style={{
            width: '100%',
            display: 'block',
          }}
        />
      </div>
    </motion.div>
  )
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

export default function HeroSection() {
  return (
    <section
      style={{
        position: 'relative',
        overflow: 'hidden',
        background: colors.bg,
        paddingTop: 160,
        paddingBottom: 80,
        paddingLeft: 24,
        paddingRight: 24,
      }}
    >
      {/* Background layers: grid texture + blobs */}
      <BackgroundLayers />

      {/* Content column — centered, maxWidth 720px */}
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          maxWidth: 720,
          margin: '0 auto',
          textAlign: 'center',
        }}
      >
        {/* Eyebrow badge */}
        <EyebrowBadge />

        {/* Headline (2 lines) */}
        <Headline />

        {/* Subheading */}
        <Subheading />

        {/* CTA row */}
        <CTARow />

        {/* Social proof strip */}
        <SocialProofStrip />
      </div>

      {/* Screenshot frame — full width up to 900px, outside the 720px column */}
      <div style={{ position: 'relative', zIndex: 1 }}>
        <ScreenshotFrame />
      </div>
    </section>
  )
}
