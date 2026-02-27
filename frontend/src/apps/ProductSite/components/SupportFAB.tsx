import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, BookOpen, Mail, LucideIcon } from 'lucide-react'

const glassStyle: React.CSSProperties = {
  background: 'rgba(20, 20, 20, 0.85)',
  backdropFilter: 'blur(12px)',
  WebkitBackdropFilter: 'blur(12px)',
  border: '1px solid rgba(212, 175, 55, 0.3)',
  borderRadius: 12,
}

const LINK_STYLE: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  color: '#D4AF37',
  fontSize: 13,
  textDecoration: 'none',
  fontFamily: 'Inter, system-ui, sans-serif',
  transition: 'color 0.2s',
}

const LINKS: { href: string; icon: LucideIcon; label: string }[] = [
  { href: '/api-docs', icon: BookOpen, label: 'View Documentation' },
  { href: 'mailto:hello@masova.com', icon: Mail, label: 'Contact Support' },
]

export default function SupportFAB() {
  const [open, setOpen] = useState(false)
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

  return (
    <div style={{ position: 'fixed', bottom: 32, right: 32, zIndex: 9999, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 12 }}>
      {/* Popover */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            style={{
              ...glassStyle,
              padding: '16px 20px',
              minWidth: 220,
              boxShadow: '0 8px 32px rgba(0,0,0,0.6), 0 0 0 1px rgba(212,175,55,0.15)',
            }}
          >
            <p style={{ color: '#ffffff', fontSize: 14, fontWeight: 600, marginBottom: 12, fontFamily: 'Inter, system-ui, sans-serif' }}>
              How can we help?
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {LINKS.map(({ href, icon: Icon, label }, i) => (
                <a
                  key={href}
                  href={href}
                  style={{
                    ...LINK_STYLE,
                    color: hoveredIndex === i ? '#f0cc6a' : '#D4AF37',
                  }}
                  onMouseEnter={() => setHoveredIndex(i)}
                  onMouseLeave={() => setHoveredIndex(null)}
                >
                  <Icon size={14} />
                  {label}
                </a>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FAB Button */}
      <motion.button
        type="button"
        onClick={() => setOpen(v => !v)}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        animate={{
          boxShadow: open
            ? ['0 0 0 0 rgba(212,175,55,0.6)', '0 0 0 16px rgba(212,175,55,0)', '0 0 0 0 rgba(212,175,55,0.6)']
            : ['0 0 0 0 rgba(212,175,55,0.4)', '0 0 0 12px rgba(212,175,55,0)', '0 0 0 0 rgba(212,175,55,0.4)'],
        }}
        transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
        style={{
          width: 56,
          height: 56,
          borderRadius: '50%',
          background: 'rgba(20, 20, 20, 0.85)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          border: '1px solid rgba(212, 175, 55, 0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          outline: 'none',
        }}
        aria-label="Support"
      >
        <Sparkles size={22} color="#D4AF37" />
      </motion.button>
    </div>
  )
}
