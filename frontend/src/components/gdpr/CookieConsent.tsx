import React, { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { BarChart3, Cookie, ExternalLink, Lock, Megaphone } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import { useGrantConsentMutation, useRevokeConsentMutation } from '../../store/api/gdprApi'
import { useAppSelector } from '../../store/hooks'
import { useFocusTrap } from '../../hooks/useFocusTrap'
import { revampCssVariables } from '../../styles/design-tokens'
import './CookieConsent.css'

interface CookiePreferences {
  necessary: boolean
  functional: boolean
  analytics: boolean
  marketing: boolean
}

const OPTIONAL = [
  { key: 'analytics', title: 'Analytics cookies', text: 'Help us understand how visitors use our website, so we can improve it.', icon: BarChart3 },
  { key: 'marketing', title: 'Marketing cookies', text: 'Used to show relevant content and measure the effectiveness of our campaigns.', icon: Megaphone },
] as const

/** Dispatch on window to reopen the dialog, so a choice can be changed or withdrawn. */
export const OPEN_COOKIE_PREFERENCES_EVENT = 'cookie_consent_open'

const SERVER_CONSENTS = [
  { key: 'analytics', consentType: 'COOKIES', consentText: 'User consented to analytics tracking' },
  { key: 'marketing', consentType: 'MARKETING', consentText: 'User consented to marketing communications' },
] as const

// The legal documents stay readable before a choice is made.
const LEGAL_PATHS = ['/privacy', '/privacy-policy', '/terms', '/cookies', '/refunds']

const ESSENTIAL_ONLY: CookiePreferences = { necessary: true, functional: false, analytics: false, marketing: false }

/** Stored choice, or null when the visitor has not chosen yet or the value is unreadable. */
function readStoredPreferences(): CookiePreferences | null {
  try {
    const stored = localStorage.getItem('cookie_consent')
    return stored ? { ...ESSENTIAL_ONLY, ...JSON.parse(stored), necessary: true } : null
  } catch (error) {
    console.warn('Stored cookie preferences could not be read; asking again', error)
    return null
  }
}

export const CookieConsent: React.FC = () => {
  const [grantConsent] = useGrantConsentMutation()
  const [revokeConsent] = useRevokeConsentMutation()
  const userId = useAppSelector((state) => state.auth.user?.id)
  const [stored] = useState(readStoredPreferences)
  const [saved, setSaved] = useState<CookiePreferences | null>(stored)
  const [open, setOpen] = useState(stored === null)
  // Reopened on request: shown on every route, including the legal documents.
  const [requested, setRequested] = useState(false)
  const [preferences, setPreferences] = useState<CookiePreferences>(stored ?? ESSENTIAL_ONLY)
  const dialogRef = useRef<HTMLDivElement>(null)
  const { pathname } = useLocation()
  const visible = open && (requested || !LEGAL_PATHS.includes(pathname))
  useFocusTrap(dialogRef, visible)

  useEffect(() => {
    const reopen = () => {
      setRequested(true)
      setOpen(true)
    }
    window.addEventListener(OPEN_COOKIE_PREFERENCES_EVENT, reopen)
    return () => window.removeEventListener(OPEN_COOKIE_PREFERENCES_EVENT, reopen)
  }, [])

  useEffect(() => {
    if (!visible) return
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    dialogRef.current?.focus()
    return () => {
      document.body.style.overflow = prevOverflow
    }
  }, [visible])

  const persist = async (prefs: CookiePreferences) => {
    try {
      localStorage.setItem('cookie_consent', JSON.stringify(prefs))
    } catch (error) {
      // Storage can be blocked or full; the choice then holds for this page view only.
      console.error('Cookie preferences could not be stored on this device', error)
    }
    window.dispatchEvent(new Event('cookie_consent_updated'))
    const previous = saved
    setSaved(prefs)
    setPreferences(prefs)
    setOpen(false)
    setRequested(false)

    if (!userId) return

    // Each consent type is recorded on its own so one failure does not hide another.
    await Promise.all(SERVER_CONSENTS.map(async ({ key, consentType, consentText }) => {
      try {
        if (prefs[key]) {
          await grantConsent({ userId, consentType, version: '1.0', consentText }).unwrap()
        } else if (previous?.[key]) {
          await revokeConsent({ userId, consentType }).unwrap()
        }
      } catch (error) {
        console.error(`Cookie consent ${consentType} was saved on this device but not recorded on the server`, error)
      }
    }))
  }

  const handleEssentialOnly = () =>
    persist(ESSENTIAL_ONLY)

  const handleSavePreferences = () => persist({ ...preferences, necessary: true, functional: false })

  const toggle = (key: 'analytics' | 'marketing') =>
    setPreferences((prev) => ({ ...prev, [key]: !prev[key] }))

  if (!visible) return null

  return createPortal(
    <div className="cookie-prefs" style={revampCssVariables}>
      <div
        ref={dialogRef}
        className="cookie-prefs-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="cookie-consent-title"
        aria-describedby="cookie-consent-text"
        tabIndex={-1}
      >
        <div className="cookie-prefs-head">
          <Cookie size={40} strokeWidth={1.8} aria-hidden="true" />
          <div>
            <h2 id="cookie-consent-title">Cookie preferences</h2>
            <p id="cookie-consent-text">
              We use cookies to make our website work properly, understand how it is used and to show
              relevant content. You can choose your preferences below.
            </p>
          </div>
        </div>
        <ul>
          <li>
            <Lock size={26} strokeWidth={1.9} aria-hidden="true" />
            <div>
              <b>Essential cookies</b>
              <p>Required for the website to function. These cannot be turned off.</p>
            </div>
            <div className="cookie-prefs-required"><span>On</span><small>Required</small></div>
          </li>
          {OPTIONAL.map(({ key, title, text, icon: Icon }) => (
            <li key={key}>
              <Icon size={26} strokeWidth={1.9} aria-hidden="true" />
              <div>
                <b id={'cookie-' + key}>{title}</b>
                <p>{text}</p>
              </div>
              <button
                type="button"
                role="switch"
                className="cookie-prefs-switch"
                aria-checked={preferences[key]}
                aria-labelledby={'cookie-' + key}
                onClick={() => toggle(key)}
              >
                <i aria-hidden="true" />
                <span aria-hidden="true">{preferences[key] ? 'On' : 'Off'}</span>
              </button>
            </li>
          ))}
        </ul>
        <div className="cookie-prefs-foot">
          <Link to="/privacy" target="_blank" rel="noopener">
            View our Privacy Policy
            <ExternalLink size={16} aria-hidden="true" />
            <span style={{ position: 'absolute', left: -9999 }}>(opens in a new tab)</span>
          </Link>
          <button type="button" onClick={handleEssentialOnly}>Essential only</button>
          <button type="button" className="cookie-prefs-save" onClick={handleSavePreferences}>Save preferences</button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
