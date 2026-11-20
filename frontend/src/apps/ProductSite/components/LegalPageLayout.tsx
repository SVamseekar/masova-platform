import { useEffect, useMemo, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import '../site.css'
import { Seo } from '../../../components/seo/Seo'
import { SiteContext } from '../SiteContext'
import { getSiteCopy } from '../content'
import { DEFAULT_SITE_LOCALE, SITE_LEGAL_PATHS, SITE_LOCALE_TAGS, type SiteLegalPath } from '../locales'
import SiteNav from './SiteNav'
import SiteFooter from './SiteFooter'
import { PageLink } from './Layout'

export interface LegalSection {
  title: string
  body: ReactNode
}

interface LegalPageLayoutProps {
  path: SiteLegalPath
  title: string
  /** One sentence for the page header and the meta description. */
  summary: string
  updated: string
  sections: LegalSection[]
}

/** A highlighted box inside a legal section, for contact details and short notes. */
export function LegalNote({ children }: { children: ReactNode }) {
  return <div className="ms-legal-note">{children}</div>
}

/**
 * Frame for the legal pages: the site's own navigation and footer, a list of sections
 * to jump to, and the text. Legal pages are published in English only.
 */
export default function LegalPageLayout({ path, title, summary, updated, sections }: LegalPageLayoutProps) {
  const value = useMemo(() => ({ locale: DEFAULT_SITE_LOCALE, copy: getSiteCopy(DEFAULT_SITE_LOCALE) }), [])
  const { copy } = value

  useEffect(() => {
    if (!window.location.hash) window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
  }, [path])

  return (
    <SiteContext.Provider value={value}>
      <div id="product-site" className="ms" lang={SITE_LOCALE_TAGS[DEFAULT_SITE_LOCALE]}>
        <Seo title={`${title} | MaSoVa`} description={summary} path={path} lang={SITE_LOCALE_TAGS[DEFAULT_SITE_LOCALE]} />
        <a className="ms-skip" href="#main">{copy.ui.skip}</a>
        <SiteNav page="home" />
        <main id="main">
          <header className="ms-page-head ms-on-dark">
            <div className="ms-wrap ms-page-head-inner">
              <div className="ms-page-head-copy">
                <p className="ms-eyebrow">{copy.footer.legalTitle}</p>
                <h1 className="ms-page-title">{title}</h1>
                <p className="ms-lead">{summary}</p>
                <p className="ms-legal-updated">Last updated {updated}</p>
              </div>
            </div>
          </header>

          <div className="ms-section">
            <div className="ms-wrap ms-legal">
              <nav className="ms-legal-toc" aria-label="On this page">
                <h2>On this page</h2>
                <ol>
                  {sections.map((section, i) => (
                    <li key={section.title}><a href={`#s${i + 1}`}>{section.title}</a></li>
                  ))}
                </ol>
              </nav>

              <article className="ms-legal-body">
                {sections.map((section, i) => (
                  <section key={section.title} id={`s${i + 1}`} aria-labelledby={`s${i + 1}-title`}>
                    <h2 id={`s${i + 1}-title`} data-section-anchor>
                      <span className="ms-num" aria-hidden="true">{String(i + 1).padStart(2, '0')}</span>
                      {section.title}
                    </h2>
                    {section.body}
                  </section>
                ))}

                <nav className="ms-legal-more" aria-label={copy.footer.legalTitle}>
                  {SITE_LEGAL_PATHS.map((href, i) => (
                    <Link key={href} to={href} aria-current={href === path ? 'page' : undefined}>{copy.footer.legal[i]}</Link>
                  ))}
                  <PageLink page="contact" className="ms-link">{copy.pages.contact.eyebrow}</PageLink>
                </nav>
              </article>
            </div>
          </div>
        </main>
        <SiteFooter page="home" />
      </div>
    </SiteContext.Provider>
  )
}
