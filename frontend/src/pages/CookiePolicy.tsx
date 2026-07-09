import React from 'react'
import LegalPageLayout from '../apps/ProductSite/components/LegalPageLayout'
import SupportEmailLink from '../apps/ProductSite/components/SupportEmailLink'
import { colors } from '../apps/ProductSite/tokens'

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="text-white font-semibold text-base">{title}</h2>
      <div className="text-sm text-gray-400 leading-relaxed space-y-3">{children}</div>
    </section>
  )
}

export const CookiePolicy: React.FC = () => {
  return (
    <LegalPageLayout title="Cookie Policy" updated="July 10, 2026">
      <div className="space-y-10">
        <Section title="1. What we use">
          <p>
            MaSoVa uses cookies and similar storage on the marketing site and web applications to keep
            you signed in, remember preferences, and (only with consent) measure product marketing.
          </p>
        </Section>

        <Section title="2. Categories">
          <ul className="list-disc pl-5 space-y-1">
            <li>
              <span className="text-gray-300">Essential</span> — authentication session, security,
              load balancing. Always on; required for the product to work.
            </li>
            <li>
              <span className="text-gray-300">Analytics</span> — optional, off by default until you
              accept via the cookie banner.
            </li>
            <li>
              <span className="text-gray-300">Marketing</span> — optional, off by default.
            </li>
          </ul>
        </Section>

        <Section title="3. Your choices">
          <p>
            Use the on-site cookie banner to accept or reject optional cookies. You can also clear
            site data in your browser. Essential cookies cannot be disabled while you use the Platform.
          </p>
        </Section>

        <Section title="4. More information">
          <p>
            See our <a href="/privacy" className="underline text-gray-300 hover:text-white">Privacy Policy</a>{' '}
            for full data processing details. Questions: <SupportEmailLink />.
          </p>
          <div
            className="rounded-xl p-4 text-xs"
            style={{ background: colors.bgElevated, border: `1px solid ${colors.border}` }}
          >
            <p className="text-gray-400">
              This page describes cookie use for masova.souravamseekar.com and related app hosts.
            </p>
          </div>
        </Section>
      </div>
    </LegalPageLayout>
  )
}

export default CookiePolicy
