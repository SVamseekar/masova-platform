import React from 'react'
import { OPEN_COOKIE_PREFERENCES_EVENT } from '../components/gdpr/CookieConsent'
import LegalPageLayout from '../apps/ProductSite/components/LegalPageLayout'
import SupportEmailLink from '../apps/ProductSite/components/SupportEmailLink'

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2>{title}</h2>
      {children}
    </section>
  )
}

export const CookiePolicy: React.FC = () => {
  return (
    <LegalPageLayout title="Cookie Policy" updated="July 10, 2026">
      <div>
        <Section title="1. What we use">
          <p>
            MaSoVa uses cookies and similar storage on the marketing site and web applications to keep
            you signed in, remember preferences, and (only with consent) measure product marketing.
          </p>
        </Section>

        <Section title="2. Categories">
          <ul>
            <li>
              <strong>Essential</strong> — authentication session, security,
              load balancing. Always on; required for the product to work.
            </li>
            <li>
              <strong>Analytics</strong> — optional, off by default until you
              accept via the cookie banner.
            </li>
            <li>
              <strong>Marketing</strong> — optional, off by default.
            </li>
          </ul>
        </Section>

        <Section title="3. Your choices">
          <p>
            Use the on-site cookie banner to accept or reject optional cookies. You can also clear
            site data in your browser. Essential cookies cannot be disabled while you use the Platform.
          </p>
          <div className="msite-legal-actions">
            <button
              type="button"
              className="msite-btn msite-btn-sm"
              onClick={() => window.dispatchEvent(new Event(OPEN_COOKIE_PREFERENCES_EVENT))}
            >
              Change cookie preferences
            </button>
          </div>
        </Section>

        <Section title="4. More information">
          <p>
            See our <a href="/privacy">Privacy Policy</a>{' '}
            for full data processing details. Questions: <SupportEmailLink />.
          </p>
          <div className="msite-legal-note">
            <p>
              This page describes cookie use for masova.souravamseekar.com and related app hosts.
            </p>
          </div>
        </Section>
      </div>
    </LegalPageLayout>
  )
}

export default CookiePolicy
