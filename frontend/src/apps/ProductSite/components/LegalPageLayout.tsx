import React, { useEffect, useRef, useState } from 'react'
import { Cookie, FileText, ReceiptText, ShieldCheck } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import { SiteFooter, SiteNav, SiteShell } from './SiteChrome'
import { scrollToTop } from '../utils/scrollToSection'

interface LegalPageLayoutProps {
  children: React.ReactNode
  title: string
  updated: string
}

const LEGAL_PAGES = [
  { label: 'Privacy', to: '/privacy', icon: ShieldCheck },
  { label: 'Terms', to: '/terms', icon: FileText },
  { label: 'Cookies', to: '/cookies', icon: Cookie },
  { label: 'Refunds', to: '/refunds', icon: ReceiptText },
]

/** Board 03 legal document layout: side navigation, last updated and a contents list. */
export default function LegalPageLayout({ children, title, updated }: LegalPageLayoutProps) {
  const { pathname } = useLocation()
  const bodyRef = useRef<HTMLDivElement>(null)
  const [contents, setContents] = useState<{ id: string; text: string }[]>([])

  useEffect(() => {
    scrollToTop('instant')
  }, [pathname])

  // Build the contents list from the section headings the document renders.
  useEffect(() => {
    const headings = Array.from(bodyRef.current?.querySelectorAll('h2') ?? [])
    setContents(headings.map((heading, index) => {
      const section = heading.closest('section') ?? heading
      section.id = section.id || 'section-' + (index + 1)
      return { id: section.id, text: (heading.textContent ?? '').replace(/^\d+\.\s*/, '') }
    }))
    // The ids exist only now, so a direct link to a section is honoured here.
    const target = window.location.hash ? document.getElementById(window.location.hash.slice(1)) : null
    target?.scrollIntoView()
  }, [pathname, children])

  const current = pathname === '/privacy-policy' ? '/privacy' : pathname

  return (
    <SiteShell>
      <SiteNav />
      <div className="msite-legal">
        <aside className="msite-legal-side">
          <h2>Legal</h2>
          <nav aria-label="Legal documents">
            {LEGAL_PAGES.map(({ label, to, icon: Icon }) => (
              <Link key={to} to={to} aria-current={current === to ? 'page' : undefined}>
                <Icon size={20} strokeWidth={1.6} aria-hidden="true" />
                {label}
              </Link>
            ))}
          </nav>
        </aside>
        <main className="msite-legal-doc">
          <h1>{title}</h1>
          <p className="msite-legal-updated"><strong>Last updated:</strong> {updated}</p>
          {contents.length > 0 && (
            <nav className="msite-legal-toc" aria-label="On this page">
              <b>On this page</b>
              <ol>
                {contents.map(({ id, text }, index) => (
                  <li key={id}><a href={'#' + id}>{index + 1}. {text}</a></li>
                ))}
              </ol>
            </nav>
          )}
          <div ref={bodyRef} className="msite-legal-body">{children}</div>
        </main>
      </div>
      <SiteFooter />
    </SiteShell>
  )
}
