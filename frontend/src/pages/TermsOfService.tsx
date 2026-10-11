import React from 'react'
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

export const TermsOfService: React.FC = () => {
  return (
    <LegalPageLayout title="Terms of Service" updated="July 10, 2026">
      <div>
        <Section title="1. Agreement">
          <p>
            These Terms govern access to MaSoVa restaurant management software (the &quot;Platform&quot;)
            by restaurant operators and their authorised staff. By creating an account or using the
            Platform you agree to these Terms.
          </p>
        </Section>

        <Section title="2. The service">
          <p>
            MaSoVa provides POS, kitchen display, delivery coordination, inventory, staff scheduling,
            analytics, and customer ordering tools. Features available depend on your plan and store
            configuration (including country and currency).
          </p>
        </Section>

        <Section title="3. Accounts and security">
          <ul>
            <li>You must provide accurate business contact information.</li>
            <li>You are responsible for staff accounts, PINs, and device access at your stores.</li>
            <li>Do not share admin credentials; revoke access when staff leave.</li>
          </ul>
        </Section>

        <Section title="4. Acceptable use">
          <p>
            You may not misuse the Platform (e.g. attempt unauthorised access, disrupt services, or
            process unlawful content). Aggregator and payment integrations remain subject to those
            providers&apos; terms.
          </p>
        </Section>

        <Section title="5. Payments">
          <p>
            Card and wallet payments are processed by third-party processors (e.g. Stripe in the EU).
            MaSoVa does not store full card numbers. Refunds follow your store policy and applicable
            payment network rules.
          </p>
        </Section>

        <Section title="6. Data">
          <p>
            Our <a href="/privacy">Privacy Policy</a>{' '}
            describes how we process personal data. Where you use MaSoVa to serve diners, you are the
            controller for diner data and MaSoVa acts as processor under a DPA on request.
          </p>
        </Section>

        <Section title="7. Contact">
          <div className="msite-legal-note">
            <p><strong>Legal / support:</strong> <SupportEmailLink /></p>
          </div>
        </Section>
      </div>
    </LegalPageLayout>
  )
}

export default TermsOfService
