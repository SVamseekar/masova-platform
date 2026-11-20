import React from 'react'
import LegalPageLayout, { LegalNote, type LegalSection } from '../apps/ProductSite/components/LegalPageLayout'
import SupportEmailLink from '../apps/ProductSite/components/SupportEmailLink'

const SECTIONS: LegalSection[] = [
  {
    title: 'Agreement',
    body: (
      <p>
        These terms cover the use of MaSoVa restaurant management software (the &ldquo;service&rdquo;) by
        restaurant operators and their authorised staff. By creating an account or using the service you
        agree to these terms.
      </p>
    ),
  },
  {
    title: 'The service',
    body: (
      <p>
        MaSoVa provides online ordering, a counter, a kitchen display, delivery management, stock, staff
        scheduling, guest tools and reports. The features you have depend on your agreement with us and
        on how each store is set up, including its country and currency.
      </p>
    ),
  },
  {
    title: 'Accounts and security',
    body: (
      <ul>
        <li>Give us accurate business contact details.</li>
        <li>You are responsible for staff accounts, PINs and devices at your stores.</li>
        <li>Do not share administrator sign-in details, and remove access when staff leave.</li>
      </ul>
    ),
  },
  {
    title: 'Acceptable use',
    body: (
      <p>
        Do not misuse the service: for example, do not try to gain access you are not entitled to,
        disrupt the service or use it for anything unlawful. Delivery marketplaces and payment providers
        you use alongside MaSoVa remain subject to their own terms.
      </p>
    ),
  },
  {
    title: 'Payments',
    body: (
      <p>
        Online payments are processed by payment providers (Stripe, and Razorpay in India) through your
        own account with them. MaSoVa never stores full card numbers. Refunds follow your store policy
        and the rules of the payment networks; see the <a href="/refunds">refund policy</a>.
      </p>
    ),
  },
  {
    title: 'Data',
    body: (
      <p>
        Our <a href="/privacy">privacy policy</a> explains how we handle personal data. Where you use
        MaSoVa to serve guests, you are the controller of guest data and MaSoVa is your processor under a
        data processing agreement, which we provide on request.
      </p>
    ),
  },
  {
    title: 'Contact',
    body: (
      <LegalNote>
        <p><strong>Legal:</strong> <SupportEmailLink to="legal" /></p>
      </LegalNote>
    ),
  },
]

export const TermsOfService: React.FC = () => (
  <LegalPageLayout
    path="/terms"
    title="Terms of Service"
    summary="The terms that apply when a restaurant and its staff use MaSoVa."
    updated="17 November 2026"
    sections={SECTIONS}
  />
)

export default TermsOfService
