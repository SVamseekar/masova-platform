import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Shield, Settings } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useGrantConsentMutation } from '../../store/api/gdprApi'

interface CookiePreferences {
  necessary: boolean
  functional: boolean
  analytics: boolean
  marketing: boolean
}

const colors = {
  bg: '#0d0d0d',
  red: '#FA2D48',
  border: 'rgba(255,255,255,0.08)',
}

const overlayStyle: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  zIndex: 99999,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '1rem',
  boxSizing: 'border-box',
}

const backdropStyle: React.CSSProperties = {
  position: 'absolute',
  inset: 0,
  background: 'rgba(0, 0, 0, 0.72)',
  backdropFilter: 'blur(4px)',
  WebkitBackdropFilter: 'blur(4px)',
}

const dialogStyle: React.CSSProperties = {
  position: 'relative',
  zIndex: 1,
  width: '100%',
  maxWidth: '28rem',
  borderRadius: '1rem',
  overflow: 'hidden',
  background: colors.bg,
  border: `1px solid ${colors.border}`,
  boxShadow: '0 24px 80px rgba(0, 0, 0, 0.55)',
}

export const CookieConsent: React.FC = () => {
  const [grantConsent] = useGrantConsentMutation()
  const [open, setOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [showDetails, setShowDetails] = useState(false)
  const [preferences, setPreferences] = useState<CookiePreferences>({
    necessary: true,
    functional: true,
    analytics: false,
    marketing: false,
  })
  const navigate = useNavigate()

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    const consent = localStorage.getItem('cookie_consent')
    if (!consent) {
      setOpen(true)
    } else {
      try {
        setPreferences(JSON.parse(consent))
      } catch {
        setOpen(true)
      }
    }
  }, [])

  useEffect(() => {
    if (!open) return
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prevOverflow
    }
  }, [open])

  const persist = async (prefs: CookiePreferences) => {
    localStorage.setItem('cookie_consent', JSON.stringify(prefs))
    window.dispatchEvent(new Event('cookie_consent_updated'))
    setPreferences(prefs)
    setOpen(false)
    setShowDetails(false)

    const userId = localStorage.getItem('userId')
    if (!userId) return

    try {
      if (prefs.analytics) {
        await grantConsent({
          userId,
          consentType: 'COOKIES',
          version: '1.0',
          consentText: 'User consented to analytics tracking',
        }).unwrap()
      }
      if (prefs.marketing) {
        await grantConsent({
          userId,
          consentType: 'MARKETING',
          version: '1.0',
          consentText: 'User consented to marketing communications',
        }).unwrap()
      }
      if (prefs.functional) {
        await grantConsent({
          userId,
          consentType: 'DATA_PROCESSING',
          version: '1.0',
          consentText: 'User consented to personalization features',
        }).unwrap()
      }
    } catch (error) {
      console.error('Error saving consent:', error)
    }
  }

  const handleAcceptAll = () =>
    persist({ necessary: true, functional: true, analytics: true, marketing: true })

  const handleRejectAll = () =>
    persist({ necessary: true, functional: false, analytics: false, marketing: false })

  const handleSavePreferences = () => persist(preferences)

  const toggle = (key: keyof CookiePreferences) => {
    if (key === 'necessary') return
    setPreferences((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  if (!mounted || !open) return null

  return createPortal(
    <AnimatePresence>
      <div
        style={overlayStyle}
        role="dialog"
        aria-modal="true"
        aria-labelledby="cookie-consent-title"
      >
        <motion.div
          style={backdropStyle}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          aria-hidden
        />

        <motion.div
          style={dialogStyle}
          initial={{ y: 20, opacity: 0, scale: 0.98 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 20, opacity: 0 }}
          transition={{ duration: 0.25 }}
        >
          <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 8,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  background: 'rgba(250,45,72,0.12)',
                  border: '1px solid rgba(250,45,72,0.25)',
                }}
              >
                <Shield size={18} style={{ color: colors.red }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <h3
                  id="cookie-consent-title"
                  style={{
                    color: '#fff',
                    fontWeight: 700,
                    fontSize: '1rem',
                    margin: 0,
                    fontFamily: "'Playfair Display', Georgia, serif",
                  }}
                >
                  Cookie settings
                </h3>
                <p style={{ color: '#9ca3af', fontSize: '0.75rem', lineHeight: 1.6, margin: 0 }}>
                  We use essential cookies to run the site. Analytics and marketing cookies are optional.{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setOpen(false)
                      navigate('/privacy')
                    }}
                    style={{
                      color: '#d1d5db',
                      textDecoration: 'underline',
                      background: 'none',
                      border: 'none',
                      padding: 0,
                      cursor: 'pointer',
                      fontSize: 'inherit',
                    }}
                  >
                    Privacy Policy
                  </button>
                </p>
              </div>
            </div>

            {showDetails ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '40vh', overflowY: 'auto' }}>
                <CookieRow
                  title="Necessary"
                  description="Required for login, security, and core features."
                  enabled
                  locked
                />
                <CookieRow
                  title="Functional"
                  description="Remember preferences and dashboard settings."
                  enabled={preferences.functional}
                  onToggle={() => toggle('functional')}
                />
                <CookieRow
                  title="Analytics"
                  description="Anonymous usage statistics to improve the product."
                  enabled={preferences.analytics}
                  onToggle={() => toggle('analytics')}
                />
                <CookieRow
                  title="Marketing"
                  description="Campaign attribution and product updates."
                  enabled={preferences.marketing}
                  onToggle={() => toggle('marketing')}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '0.5rem' }}>
                  <button
                    type="button"
                    onClick={() => setShowDetails(false)}
                    style={{
                      fontSize: '0.75rem',
                      color: '#6b7280',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: 0,
                    }}
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={handleSavePreferences}
                    style={{
                      padding: '0.5rem 1rem',
                      borderRadius: 8,
                      color: '#fff',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      background: colors.red,
                      border: 'none',
                      cursor: 'pointer',
                    }}
                  >
                    Save
                  </button>
                </div>
              </div>
            ) : (
              <div
                className="cookie-consent-actions"
                style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}
              >
                <button type="button" onClick={handleRejectAll} style={secondaryBtnStyle}>
                  Essential only
                </button>
                <button
                  type="button"
                  onClick={() => setShowDetails(true)}
                  style={{ ...secondaryBtnStyle, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                >
                  <Settings size={13} />
                  Manage
                </button>
                <button type="button" onClick={handleAcceptAll} style={primaryBtnStyle}>
                  Accept all
                </button>
              </div>
            )}
          </div>
        </motion.div>
      </div>
      <style>{`
        @media (min-width: 640px) {
          .cookie-consent-actions {
            flex-direction: row !important;
          }
          .cookie-consent-actions button {
            flex: 1;
          }
        }
      `}</style>
    </AnimatePresence>,
    document.body,
  )
}

const secondaryBtnStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.625rem 1rem',
  borderRadius: 12,
  border: `1px solid ${colors.border}`,
  color: '#d1d5db',
  fontSize: '0.75rem',
  fontWeight: 600,
  background: 'transparent',
  cursor: 'pointer',
}

const primaryBtnStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.625rem 1rem',
  borderRadius: 12,
  color: '#fff',
  fontSize: '0.75rem',
  fontWeight: 700,
  background: colors.red,
  border: 'none',
  cursor: 'pointer',
}

function CookieRow({
  title,
  description,
  enabled,
  locked,
  onToggle,
}: {
  title: string
  description: string
  enabled: boolean
  locked?: boolean
  onToggle?: () => void
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        gap: '0.75rem',
        padding: '0.5rem 0',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
      }}
    >
      <div>
        <p style={{ color: '#fff', fontSize: '0.75rem', fontWeight: 600, margin: 0 }}>{title}</p>
        <p style={{ color: '#6b7280', fontSize: '0.6875rem', margin: '2px 0 0' }}>{description}</p>
      </div>
      <button
        type="button"
        disabled={locked}
        onClick={onToggle}
        style={{
          position: 'relative',
          display: 'inline-flex',
          height: 20,
          width: 36,
          flexShrink: 0,
          borderRadius: 9999,
          border: '2px solid transparent',
          cursor: locked ? 'not-allowed' : 'pointer',
          background: locked ? '#27272a' : enabled ? '#10b981' : '#3f3f46',
          padding: 0,
        }}
      >
        <span
          style={{
            display: 'inline-block',
            height: 16,
            width: 16,
            borderRadius: '50%',
            background: '#fff',
            boxShadow: '0 1px 2px rgba(0,0,0,0.2)',
            transform: enabled ? 'translateX(16px)' : 'translateX(0)',
            transition: 'transform 0.15s ease',
            margin: '0 2px',
          }}
        />
      </button>
    </div>
  )
}