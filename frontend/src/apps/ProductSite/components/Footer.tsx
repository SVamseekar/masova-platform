import React from 'react'
import { motion } from 'framer-motion'
import { ArrowRight, Shield, Globe } from 'lucide-react'
import { GOLD_GRADIENT_TEXT, GITHUB_URL, SITE_URL } from '../constants'

type FooterLink = { label: string; href: string; external?: boolean }

const FOOTER_SECTIONS: { title: string; links: FooterLink[] }[] = [
  {
    title: 'Platform',
    links: [
      { label: 'Agent Brain', href: '#agent-brain' },
      { label: 'Live Demo', href: '#demo' },
      { label: 'Product Tour', href: '#product-tour' },
      { label: 'Mobile Apps', href: '#mobile' },
      { label: 'Channels', href: '#channels' },
    ],
  },
  {
    title: 'AI & Ops',
    links: [
      { label: 'AI Agents', href: '#ai-agents' },
      { label: 'Features', href: '#features' },
      { label: 'Order Flow', href: '#order-flow' },
      { label: 'Pricing', href: '#pricing' },
      { label: 'FAQ', href: '#faq' },
    ],
  },
  {
    title: 'Developers',
    links: [
      { label: 'API Reference', href: '/api-docs' },
      { label: 'GitHub', href: GITHUB_URL, external: true },
      { label: 'Platform Overview', href: '#developers' },
      { label: 'Live Site', href: SITE_URL, external: true },
    ],
  },
  {
    title: 'Contact',
    links: [
      { label: 'hello@masova.com', href: 'mailto:hello@masova.com' },
      { label: 'Book a demo', href: '#pricing' },
      { label: 'Watch agents', href: '#demo' },
    ],
  },
]

export default function Footer() {
  return (
    <>
      <section
        className="py-24 px-6"
        style={{
          background: '#0d0d0d',
          borderTop: '1px solid rgba(212,175,55,0.15)',
          borderBottom: '1px solid rgba(212,175,55,0.15)',
        }}
      >
        <motion.div
          className="max-w-4xl mx-auto text-center"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Ready to put agents on your floor?
          </h2>
          <p className="text-gray-400 mb-8 text-lg max-w-xl mx-auto">
            Eight specialised agents propose actions — your managers approve. Start with a free trial
            or talk to us about multi-location rollout.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="#pricing"
              className="group inline-flex items-center gap-2 px-8 py-4 rounded-xl font-bold text-sm hover:gap-3 transition-all duration-200"
              style={{
                background: '#D4AF37',
                color: '#080808',
              }}
            >
              Start free trial
              <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
            </a>
            <a
              href="mailto:hello@masova.com"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-medium text-sm transition-colors duration-200"
              style={{
                background: '#1a1a1a',
                border: '1px solid rgba(212,175,55,0.35)',
                color: '#D4AF37',
              }}
            >
              Contact sales
            </a>
          </div>
        </motion.div>
      </section>

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
              <p className="text-gray-500 text-xs leading-relaxed max-w-xs">
                The agentic restaurant operating system — eight AI agents on a propose-then-approve
                loop, wired to your live orders, kitchen, and mobile apps.
              </p>
            </div>

            {FOOTER_SECTIONS.map(({ title, links }) => (
              <div key={title}>
                <p className="text-white text-xs font-semibold mb-3 uppercase tracking-wide">{title}</p>
                <ul className="space-y-2">
                  {links.map(({ label, href, external }) => (
                    <li key={label}>
                      <a
                        href={href}
                        className="text-gray-600 text-xs hover:text-gray-300 transition-colors"
                        {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                      >
                        {label}
                      </a>
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
                <Shield size={12} style={{ color: '#D4AF37' }} />
                GDPR Compliant
              </span>
              <span className="flex items-center gap-1.5 text-xs text-gray-600">
                <Globe size={12} style={{ color: '#D4AF37' }} />
                Built for Europe
              </span>
            </div>
          </div>
        </div>
      </footer>
    </>
  )
}