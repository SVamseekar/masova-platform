import React from 'react'
import { Shield, Globe } from 'lucide-react'
import { GOLD_GRADIENT_TEXT, PAGE_SECTIONS, openContactForm } from '../constants'
import SupportEmailLink from './SupportEmailLink'
import { scrollToSection } from '../utils/scrollToSection'
import { colors } from '../tokens'

type FooterLink = { label: string; href: string; external?: boolean; action?: 'contact' }

function handleFooterNav(event: React.MouseEvent<HTMLAnchorElement>, href: string) {
  if (!href.startsWith('#')) return
  event.preventDefault()
  window.history.pushState(null, '', href)
  scrollToSection(href, 'smooth')
}

const FOOTER_SECTIONS: { title: string; links: FooterLink[] }[] = [
  {
    title: 'Product',
    links: PAGE_SECTIONS.slice(0, 7).map(({ label, href }) => ({ label, href })),
  },
  {
    title: 'More',
    links: PAGE_SECTIONS.slice(7, 10).map(({ label, href }) => ({ label, href })),
  },
  {
    title: 'Get started',
    links: [
      { label: 'Get in touch', href: '#contact', action: 'contact' },
      { label: 'FAQ', href: '#faq' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { label: 'Privacy Policy', href: '/privacy' },
    ],
  },
]

export default function Footer() {
  return (
    <footer className="bg-[#080808] px-6 py-16" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-8 mb-12">
          <div className="col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div
                style={{
                  width: 28,
                  height: 28,
                  background: '#1a1a1a',
                  border: '1px solid rgba(212,175,55,0.4)',
                  borderRadius: 8,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <span style={{ ...GOLD_GRADIENT_TEXT, fontSize: 14 }}>M</span>
              </div>
              <span style={{ ...GOLD_GRADIENT_TEXT, fontSize: 18 }}>MaSoVa</span>
            </div>
            <p className="text-gray-500 text-xs leading-relaxed max-w-xs mb-4">
              Restaurant operations software for owners and managers — ordering, kitchen, delivery,
              and customer care in one platform.
            </p>
            <p className="text-gray-600 text-xs">
              <SupportEmailLink className="text-gray-500 hover:text-gray-300 transition-colors underline-offset-2 hover:underline" />
            </p>
          </div>

          {FOOTER_SECTIONS.map(({ title, links }) => (
            <div key={title}>
              <p className="text-white text-xs font-semibold mb-3 uppercase tracking-wide">{title}</p>
              <ul className="space-y-2">
                {links.map(({ label, href, external, action }) => (
                  <li key={label}>
                    {action === 'contact' ? (
                      <button
                        type="button"
                        onClick={() => openContactForm()}
                        className="text-gray-600 text-xs hover:text-gray-300 transition-colors cursor-pointer text-left"
                      >
                        {label}
                      </button>
                    ) : (
                      <a
                        href={href}
                        className="text-gray-600 text-xs hover:text-gray-300 transition-colors"
                        onClick={external ? undefined : (e) => handleFooterNav(e, href)}
                        {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                      >
                        {label}
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div
          className="pt-6 flex flex-col md:flex-row items-center justify-between gap-4"
          style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}
        >
          <p className="text-gray-600 text-xs">© 2026 MaSoVa. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 text-xs text-gray-600">
              <Shield size={12} style={{ color: colors.gold }} />
              GDPR-ready
            </span>
            <span className="flex items-center gap-1.5 text-xs text-gray-600">
              <Globe size={12} style={{ color: colors.gold }} />
              EU-focused
            </span>
          </div>
        </div>
      </div>
    </footer>
  )
}