import React, { useEffect } from 'react'
import { Mail, MapPin, Shield } from 'lucide-react'
import SectionLabel from './SectionLabel'
import Reveal from './Reveal'
import DemoRequestForm from './DemoRequestForm'
import SupportEmailLink from './SupportEmailLink'
import { OPEN_CONTACT_EVENT } from '../constants'
import { scrollToSection } from '../utils/scrollToSection'
import { colors, typography } from '../tokens'

function focusFirstField() {
  window.setTimeout(() => {
    document.getElementById('fullName')?.focus({ preventScroll: true })
  }, 400)
}

export default function ContactSection() {
  useEffect(() => {
    const onOpen = () => {
      scrollToSection('#contact', 'smooth')
      focusFirstField()
    }
    window.addEventListener(OPEN_CONTACT_EVENT, onOpen)
    return () => window.removeEventListener(OPEN_CONTACT_EVENT, onOpen)
  }, [])

  return (
    <section id="contact" className="bg-[#080808] py-32 px-6 scroll-mt-24">
      <div className="max-w-3xl mx-auto">
        <Reveal className="text-center mb-10 space-y-4">
          <SectionLabel>Get in touch</SectionLabel>
          <h2
            className="text-4xl md:text-5xl font-bold text-white leading-tight"
            style={{ fontFamily: typography.fontDisplay }}
          >
            Book a walkthrough for your team
          </h2>
          <p className="text-gray-400 text-base max-w-xl mx-auto leading-relaxed">
            Tell us about your restaurants. We reply within one business day at{' '}
            <SupportEmailLink className="text-gray-300 hover:text-white transition-colors underline-offset-2 hover:underline" />.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-5 text-xs text-gray-500 pt-1">
            <span className="inline-flex items-center gap-1.5">
              <Mail size={13} style={{ color: colors.gold }} />
              <SupportEmailLink />
            </span>
            <span className="inline-flex items-center gap-1.5">
              <MapPin size={13} style={{ color: colors.gold }} />
              EU-focused
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Shield size={13} style={{ color: colors.gold }} />
              GDPR-ready
            </span>
          </div>
        </Reveal>

        <Reveal
          className="rounded-2xl p-6 md:p-10"
          style={{
            background: colors.bgElevated,
            border: `1px solid ${colors.goldBorder}`,
            boxShadow: '0 24px 80px rgba(0,0,0,0.45)',
          }}
        >
          <DemoRequestForm />
        </Reveal>
      </div>
    </section>
  )
}