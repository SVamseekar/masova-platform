import React from 'react'
import LegalPageLayout, { LegalNote, type LegalSection } from '../apps/ProductSite/components/LegalPageLayout'
import SupportEmailLink from '../apps/ProductSite/components/SupportEmailLink'

const SECTIONS: LegalSection[] = [
  {
    title: 'Scope',
    body: (
      <p>
        This policy covers payments for restaurant orders made through MaSoVa: on a restaurant&rsquo;s
        ordering site or app, and online payments taken at the counter. It does not replace the consumer
        rights the law gives you in your country.
      </p>
    ),
  },
  {
    title: 'The restaurant decides',
    body: (
      <p>
        Each restaurant decides whether to refund an order and how much. A manager approves every full
        or partial refund in the manager dashboard. The support chat can pass a refund request to the
        restaurant&rsquo;s staff; it never issues a refund itself.
      </p>
    ),
  },
  {
    title: 'Timing',
    body: (
      <ul>
        <li>An approved card refund usually reaches your account within 5 to 10 working days, depending on your bank.</li>
        <li>Orders paid in cash are refunded by the restaurant directly.</li>
        <li>Orders placed on a delivery marketplace are refunded through that marketplace.</li>
      </ul>
    ),
  },
  {
    title: 'MaSoVa fees',
    body: (
      <p>
        What a restaurant pays MaSoVa for the software is separate from refunds of guest orders. For a
        billing question, contact <SupportEmailLink to="billing" />.
      </p>
    ),
  },
  {
    title: 'Contact',
    body: (
      <LegalNote>
        <p>
          For a specific order, contact the restaurant first. For a problem with the service itself:{' '}
          <SupportEmailLink to="billing" />
        </p>
      </LegalNote>
    ),
  },
]

export const RefundPolicy: React.FC = () => (
  <LegalPageLayout
    path="/refunds"
    title="Refund Policy"
    summary="How refunds work for orders paid through a restaurant that uses MaSoVa."
    updated="17 November 2026"
    sections={SECTIONS}
  />
)

export default RefundPolicy
