import React from 'react'
import { motion } from 'framer-motion'
import { ArrowRight, Shield, Globe } from 'lucide-react'
import { GOLD_GRADIENT_TEXT } from '../constants'

const FOOTER_LINK_MAP: Record<string, string> = {
  Features: '#features',
  'AI Agents': '#ai-agents',
  Pricing: '#pricing',
  Changelog: '#changelog',
  About: '#about',
  Blog: '#blog',
  Careers: '#careers',
  Press: '#press',
  'Privacy Policy': '#privacy',
  'Terms of Service': '#terms',
  GDPR: '#gdpr',
  'Cookie Policy': '#cookie-policy',
  Documentation: '#documentation',
  'API Reference': '/api-docs',
  Status: '#status',
  Contact: 'mailto:hello@masova.com',
}

const FOOTER_LINKS = {
  Product: ['Features', 'AI Agents', 'Pricing', 'Changelog'],
  Company: ['About', 'Blog', 'Careers', 'Press'],
  Legal: ['Privacy Policy', 'Terms of Service', 'GDPR', 'Cookie Policy'],
  Support: ['Documentation', 'API Reference', 'Status', 'Contact'],
}

export default function Footer() {
  return (
    <>
      {/* CTA Banner */}
      <section
        className="py-24 px-6"
        style={{ background: '#0d0d0d', borderTop: '1px solid rgba(212,175,55,0.15)', borderBottom: '1px solid rgba(212,175,55,0.15)' }}
      >
        <motion.div
          className="max-w-4xl mx-auto text-center"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Ready to transform your restaurant?
          </h2>
          <p className="text-gray-400 mb-8 text-lg">
            Join hundreds of restaurants across Europe running on MaSoVa.
          </p>
          <a
            href="#pricing"
            className="group inline-flex items-center gap-2 px-8 py-4 rounded-xl font-bold text-sm hover:gap-3 transition-all duration-200"
            style={{ background: '#1a1a1a', border: '1px solid rgba(212,175,55,0.5)', color: '#D4AF37' }}
            onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.borderColor = 'rgba(212,175,55,0.8)' }}
            onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.borderColor = 'rgba(212,175,55,0.5)' }}
          >
            Start your free trial
            <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
          </a>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="bg-[#080808] px-6 py-16" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
            {/* Brand */}
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <div style={{ width: 28, height: 28, background: '#1a1a1a', border: '1px solid rgba(212,175,55,0.4)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ ...GOLD_GRADIENT_TEXT, fontSize: 14 }}>M</span>
                </div>
                <span style={{ ...GOLD_GRADIENT_TEXT, fontSize: 18 }}>MaSoVa</span>
              </div>
              <p className="text-gray-600 text-xs leading-relaxed">
                The complete restaurant operating system built for European multi-location restaurants.
              </p>
            </div>

            {/* Links */}
            {Object.entries(FOOTER_LINKS).map(([section, links]) => (
              <div key={section}>
                <p className="text-white text-xs font-semibold mb-3 uppercase tracking-wide">{section}</p>
                <ul className="space-y-2">
                  {links.map(link => {
                    const href = FOOTER_LINK_MAP[link] ?? '#'
                    const isExternal = href.startsWith('http')
                    return (
                      <li key={link}>
                        <a
                          href={href}
                          className="text-gray-600 text-xs hover:text-gray-400 transition-colors"
                          {...(isExternal ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                        >
                          {link}
                        </a>
                      </li>
                    )
                  })}
                </ul>
              </div>
            ))}
          </div>

          <div className="pt-6 flex flex-col md:flex-row items-center justify-between gap-4" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
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
