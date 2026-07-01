import React from 'react'
import LegalPageLayout from '../apps/ProductSite/components/LegalPageLayout'
import SupportEmailLink from '../apps/ProductSite/components/SupportEmailLink'
import { openContactForm } from '../apps/ProductSite/constants'
import { colors } from '../apps/ProductSite/tokens'

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="text-white font-semibold text-base">{title}</h2>
      <div className="text-sm text-gray-400 leading-relaxed space-y-3">{children}</div>
    </section>
  )
}

export const PrivacyPolicy: React.FC = () => {
  return (
    <LegalPageLayout title="Privacy Policy" updated="July 1, 2026">
      <div className="space-y-10">
        <Section title="1. Who we are">
          <p>
            MaSoVa provides restaurant management software to business customers (restaurant owners,
            operators, and their staff). For subscription and account data, MaSoVa is the data controller.
          </p>
          <p>
            For end-customer data (diners who order through a restaurant&apos;s MaSoVa-powered app or site),
            the restaurant is the data controller and MaSoVa acts as a data processor.
          </p>
          <div
            className="rounded-xl p-4 text-xs space-y-1"
            style={{ background: colors.bgElevated, border: `1px solid ${colors.border}` }}
          >
            <p><span className="text-white font-medium">Contact:</span> <SupportEmailLink /></p>
            <p><span className="text-white font-medium">Data protection enquiries:</span> <SupportEmailLink /></p>
          </div>
        </Section>

        <Section title="2. What we collect">
          <ul className="list-disc pl-5 space-y-1">
            <li>Account details — name, work email, phone, role</li>
            <li>Business details — restaurant name, locations, billing address</li>
            <li>Usage data — IP address, device type, access logs (security and support)</li>
            <li>Support communications — demo requests, tickets, feedback</li>
            <li>Payment metadata — handled by our payment provider; we do not store full card numbers</li>
          </ul>
        </Section>

        <Section title="3. Legal basis (GDPR Article 6)">
          <ul className="list-disc pl-5 space-y-1">
            <li><span className="text-gray-300">Contract</span> — providing the platform you subscribed to</li>
            <li><span className="text-gray-300">Legitimate interest</span> — security monitoring, product improvement</li>
            <li><span className="text-gray-300">Legal obligation</span> — tax records, financial compliance</li>
            <li><span className="text-gray-300">Consent</span> — optional analytics and marketing cookies</li>
          </ul>
        </Section>

        <Section title="4. Where data is stored">
          <p>
            Production data is hosted in the EU (Frankfurt and Ireland regions). We do not transfer
            personal data outside the EEA without appropriate safeguards (Standard Contractual Clauses).
          </p>
        </Section>

        <Section title="5. Sub-processors">
          <p>We share data only with processors under Data Processing Agreements, including:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Payment processing (Stripe — PSD2 / SCA compliant)</li>
            <li>Cloud infrastructure (EU-hosted)</li>
            <li>Email delivery for transactional notifications</li>
            <li>Analytics (only if you accept analytics cookies)</li>
          </ul>
        </Section>

        <Section title="6. Your rights">
          <p>
            EEA residents can request access, correction, deletion, portability, or restriction of processing.
            Email <SupportEmailLink /> with your request — we respond within 30 days as required by GDPR.
          </p>
          <p>
            Restaurant customers who order through a MaSoVa-powered app should contact the restaurant directly
            for diner data requests. MaSoVa&apos;s in-app data rights tools are available to signed-in customers
            within their restaurant&apos;s live ordering experience.
          </p>
          <div className="flex flex-wrap gap-3 pt-1">
            <button
              type="button"
              onClick={() => openContactForm()}
              className="px-4 py-2 rounded-lg text-white text-xs font-semibold cursor-pointer"
              style={{ background: colors.red }}
            >
              Contact us
            </button>
          </div>
        </Section>

        <Section title="7. Retention">
          <p>
            Account data is kept for the subscription period plus 30 days after cancellation. Financial
            records are retained for 7 years as required by EU tax law. Marketing preferences are
            deleted after 2 years of inactivity.
          </p>
        </Section>

        <Section title="8. Security">
          <p>
            We use TLS encryption in transit, encrypted storage at rest, role-based access controls,
            and audit logging for access to personal data.
          </p>
        </Section>

        <Section title="9. Cookies">
          <p>
            Essential cookies run the site. Analytics and marketing cookies are off by default and
            only enabled through the cookie settings dialog. You can change your choice at any time
            by clearing site data or contacting us.
          </p>
        </Section>

        <Section title="10. Restaurant operator responsibilities">
          <p>
            As a software provider, MaSoVa gives restaurants tools for allergen display, GDPR consent,
            and customer data export — but each restaurant remains responsible for food-labelling law
            (EU Regulation 1169/2011), HACCP processes, VAT invoicing, and their own customer privacy notices.
          </p>
        </Section>

        <Section title="11. Complaints">
          <p>
            Email <SupportEmailLink /> for any privacy question. You may also lodge a complaint with your
            local EU supervisory authority.
          </p>
        </Section>
      </div>
    </LegalPageLayout>
  )
}