import React, { useEffect } from 'react'
import '../product-site.css'
import { Link } from 'react-router-dom'
import Navbar from './Navbar'
import SupportEmailLink from './SupportEmailLink'
import { GOLD_GRADIENT_TEXT } from '../constants'
import { scrollToTop } from '../utils/scrollToSection'
import { colors } from '../tokens'

interface LegalPageLayoutProps {
  children: React.ReactNode
  title: string
  updated: string
}

export default function LegalPageLayout({ children, title, updated }: LegalPageLayoutProps) {
  useEffect(() => {
    scrollToTop('instant')
  }, [])

  return (
    <div id="product-site" style={{ background: colors.bg, minHeight: '100vh' }}>
      <Navbar />
      <main className="pt-28 pb-16 px-6">
        <div className="max-w-3xl mx-auto space-y-10">
          <header className="space-y-3 border-b border-white/5 pb-8">
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-xs text-gray-500 hover:text-white transition-colors"
            >
              <span style={{ ...GOLD_GRADIENT_TEXT, fontSize: 14 }}>MaSoVa</span>
              <span className="text-gray-600">/</span>
              <span>{title}</span>
            </Link>
            <h1
              className="text-4xl md:text-5xl font-bold text-white"
              style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
            >
              {title}
            </h1>
            <p className="text-xs text-gray-500">Last updated {updated}</p>
          </header>
          {children}
        </div>
      </main>
      <footer
        className="px-6 py-8 border-t border-white/5 text-center text-xs text-gray-600"
        style={{ background: colors.bg }}
      >
        <p>
          Questions?{' '}
          <a href="/#contact" className="text-gray-400 hover:text-white transition-colors">
            Book a walkthrough
          </a>{' '}
          or email <SupportEmailLink />
        </p>
        <p className="mt-2">© 2026 MaSoVa. All rights reserved.</p>
      </footer>
    </div>
  )
}