import React from 'react'
import LegalPageLayout, { LegalNote, type LegalSection } from '../apps/ProductSite/components/LegalPageLayout'
import SupportEmailLink from '../apps/ProductSite/components/SupportEmailLink'

const SECTIONS: LegalSection[] = [
  {
    title: 'Who we are',
    body: (
      <>
        <p>
          MaSoVa provides restaurant management software to business customers: restaurant owners,
          operators and their staff. For account and subscription data, MaSoVa is the data controller.
        </p>
        <p>
          For guest data (people who order through a restaurant&rsquo;s MaSoVa ordering site or app), the
          restaurant is the data controller and MaSoVa acts as its data processor.
        </p>
        <LegalNote>
          <p><strong>Contact:</strong> <SupportEmailLink /></p>
          <p><strong>Data protection enquiries:</strong> <SupportEmailLink to="privacy" /></p>
        </LegalNote>
      </>
    ),
  },
  {
    title: 'What we collect',
    body: (
      <ul>
        <li><strong>Account details:</strong> name, work email, phone, role</li>
        <li><strong>Business details:</strong> restaurant name, locations, billing address</li>
        <li><strong>Usage data:</strong> IP address, device type and access logs, for security and support</li>
        <li><strong>Messages you send us:</strong> walkthrough requests, support requests, feedback</li>
        <li><strong>Payment details:</strong> handled by our payment provider; we never store full card numbers</li>
      </ul>
    ),
  },
  {
    title: 'Why we may use it',
    body: (
      <>
        <p>Under Article 6 of the GDPR we rely on:</p>
        <ul>
          <li><strong>Contract:</strong> providing the service you signed up for</li>
          <li><strong>Legitimate interest:</strong> keeping the service secure and improving the product</li>
          <li><strong>Legal obligation:</strong> tax and financial records</li>
          <li><strong>Consent:</strong> optional analytics and marketing cookies</li>
        </ul>
      </>
    ),
  },
  {
    title: 'Where data is stored',
    body: (
      <p>
        We agree the hosting region with each restaurant group in the data processing agreement. Where
        personal data leaves the EEA or the UK, we use appropriate safeguards such as Standard
        Contractual Clauses.
      </p>
    ),
  },
  {
    title: 'Who we share it with',
    body: (
      <>
        <p>We share data only with service providers that work under a data processing agreement:</p>
        <ul>
          <li>Payment processing (Stripe; Razorpay in India)</li>
          <li>Cloud hosting</li>
          <li>Email, SMS and push delivery for order updates and account messages</li>
          <li>Analytics, only if you accept analytics cookies</li>
        </ul>
        <p>Ask us for the current list of sub-processors at <SupportEmailLink to="privacy" />.</p>
      </>
    ),
  },
  {
    title: 'Your rights',
    body: (
      <>
        <p>
          Depending on where you live, for example in the EEA or the UK, you can ask to see, correct,
          delete, move or restrict the use of your personal data. Email <SupportEmailLink to="privacy" /> and
          we will respond within one month.
        </p>
        <p>
          If you ordered from a restaurant that uses MaSoVa, contact that restaurant for requests about
          your order data. Signed-in guests can also use the privacy tools in the restaurant&rsquo;s ordering
          site.
        </p>
      </>
    ),
  },
  {
    title: 'How long we keep it',
    body: (
      <p>
        Account data is kept for the length of the subscription plus 30 days after it ends. Financial
        records are kept for as long as the tax law that applies to us requires. Marketing preferences
        are deleted after two years without activity.
      </p>
    ),
  },
  {
    title: 'Security',
    body: (
      <p>
        Data travels over encrypted connections. Access is limited by store and by role, and access to
        personal data is logged. Read more on our <a href="/security">security page</a>.
      </p>
    ),
  },
  {
    title: 'Cookies',
    body: (
      <p>
        Essential cookies run the site. Analytics and marketing cookies are off until you switch them on
        in the cookie dialog. See the <a href="/cookies">cookie policy</a>.
      </p>
    ),
  },
  {
    title: 'What restaurants remain responsible for',
    body: (
      <p>
        MaSoVa gives restaurants tools for allergen display, consent records and guest data export. Each
        restaurant remains responsible for food-labelling law (EU Regulation 1169/2011 where it applies),
        its food safety procedures, its tax invoicing and its own privacy notice to guests.
      </p>
    ),
  },
  {
    title: 'Complaints',
    body: (
      <p>
        Email <SupportEmailLink to="privacy" /> with any privacy question. You may also complain to the data
        protection authority in your country.
      </p>
    ),
  },
]

export const PrivacyPolicy: React.FC = () => (
  <LegalPageLayout
    path="/privacy"
    title="Privacy Policy"
    summary="What personal data MaSoVa collects, why, who it is shared with and the rights you have over it."
    updated="17 November 2026"
    sections={SECTIONS}
  />
)

export default PrivacyPolicy
