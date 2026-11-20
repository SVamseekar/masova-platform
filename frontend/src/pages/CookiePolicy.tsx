import React from 'react'
import LegalPageLayout, { LegalNote, type LegalSection } from '../apps/ProductSite/components/LegalPageLayout'
import SupportEmailLink from '../apps/ProductSite/components/SupportEmailLink'

const SECTIONS: LegalSection[] = [
  {
    title: 'What we use',
    body: (
      <p>
        MaSoVa uses cookies and similar browser storage on this website and in its web apps to keep you
        signed in and remember your choices. Only if you agree, we also use them to measure how the
        website is used.
      </p>
    ),
  },
  {
    title: 'Categories',
    body: (
      <ul>
        <li><strong>Essential:</strong> sign-in sessions, security and your cookie choice. Always on, because the product cannot work without them.</li>
        <li><strong>Analytics:</strong> optional, and off until you accept them in the cookie dialog.</li>
        <li><strong>Marketing:</strong> optional, and off until you accept them.</li>
      </ul>
    ),
  },
  {
    title: 'Your choices',
    body: (
      <p>
        Use the cookie dialog on this site to accept or reject optional cookies. You can also clear site
        data in your browser, which resets your choice. Essential cookies cannot be switched off while
        you use the service.
      </p>
    ),
  },
  {
    title: 'More information',
    body: (
      <>
        <p>
          The <a href="/privacy">privacy policy</a> explains how we handle personal data. Questions:{' '}
          <SupportEmailLink to="privacy" />.
        </p>
        <LegalNote>
          <p>This page covers getmasova.rest and the MaSoVa web apps.</p>
        </LegalNote>
      </>
    ),
  },
]

export const CookiePolicy: React.FC = () => (
  <LegalPageLayout
    path="/cookies"
    title="Cookie Policy"
    summary="Which cookies MaSoVa uses, what they are for and how to change your choice."
    updated="17 November 2026"
    sections={SECTIONS}
  />
)

export default CookiePolicy
