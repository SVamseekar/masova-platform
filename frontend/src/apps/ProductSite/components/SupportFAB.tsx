import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, BookOpen, Mail } from 'lucide-react'

const glassStyle: React.CSSProperties = {
  background: 'rgba(20, 20, 20, 0.85)',
  backdropFilter: 'blur(12px)',
  WebkitBackdropFilter: 'blur(12px)',
  border: '1px solid rgba(212, 175, 55, 0.3)',
  borderRadius: 12,
}

export default function SupportFAB() {
  const [open, setOpen] = useState(false)

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
              <a
                href="/api-docs"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  color: '#D4AF37',
                  fontSize: 13,
                  textDecoration: 'none',
                  fontFamily: 'Inter, system-ui, sans-serif',
                  transition: 'color 0.2s',
                }}
                onMouseEnter={e => (e.currentTarget.style.color = '#f0cc6a')}
                onMouseLeave={e => (e.currentTarget.style.color = '#D4AF37')}
              >
                <BookOpen size={14} />
                View Documentation
              </a>
              <a
                href="mailto:hello@masova.com"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  color: '#D4AF37',
                  fontSize: 13,
                  textDecoration: 'none',
                  fontFamily: 'Inter, system-ui, sans-serif',
                  transition: 'color 0.2s',
                }}
                onMouseEnter={e => (e.currentTarget.style.color = '#f0cc6a')}
                onMouseLeave={e => (e.currentTarget.style.color = '#D4AF37')}
              >
                <Mail size={14} />
                Contact Support
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FAB Button */}
      <motion.button
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
