import { Link } from 'react-router-dom'
import { Globe } from 'lucide-react'
import Brand from './Brand'
import SupportEmailLink from './SupportEmailLink'
import { PageLink } from './Layout'
import { useSite } from '../SiteContext'
import { PRODUCT_AREAS, SITE_LEGAL_PATHS, SITE_LOCALES, SITE_LOCALE_NAMES, SITE_LOCALE_TAGS, countryPath, sitePath, type CountryCode, type SitePage } from '../locales'

const COLUMNS: SitePage[][] = [
  ['product', ...PRODUCT_AREAS],
  ['ai', 'apps', 'solutions', 'countries', 'integrations', 'compliance', 'security'],
  ['about', 'pricing', 'pilot', 'faq', 'contact'],
]

export default function SiteFooter({ page, country }: { page: SitePage; country?: CountryCode }) {
  const { copy, locale } = useSite()
  const footer = copy.footer
  return (
    <footer className="ms-footer ms-on-dark">
      <div className="ms-wrap">
        <div className="ms-footer-grid">
          <div>
            <PageLink page="home"><Brand /></PageLink>
            <p className="ms-footer-tag">{footer.tagline}</p>
            <SupportEmailLink className="ms-footer-email" />
          </div>
          {COLUMNS.map((links, i) => (
            <nav key={footer.columns[i]} aria-label={footer.columns[i]}>
              <h3>{footer.columns[i]}</h3>
              <ul>
                {links.map((target) => (
                  <li key={target}><PageLink page={target}>{copy.pages[target].eyebrow}</PageLink></li>
                ))}
              </ul>
            </nav>
          ))}
          <nav aria-label={footer.legalTitle}>
            <h3>{footer.legalTitle}</h3>
            <ul>
              {SITE_LEGAL_PATHS.map((href, i) => (
                <li key={href}><Link to={href}>{footer.legal[i]}</Link></li>
              ))}
            </ul>
          </nav>
        </div>
        <nav className="ms-footer-langs" aria-label={copy.nav.language}>
          <Globe size={15} aria-hidden="true" />
          {SITE_LOCALES.map((code) => (
            <Link
              key={code}
              to={country ? countryPath(code, country) : sitePath(code, page)}
              lang={SITE_LOCALE_TAGS[code]}
              hrefLang={SITE_LOCALE_TAGS[code]}
              aria-current={code === locale ? 'true' : undefined}
            >
              {SITE_LOCALE_NAMES[code]}
            </Link>
          ))}
        </nav>
        <div className="ms-footer-bottom">
          <span>© 2026 MaSoVa. {footer.rights}</span>
          <span>{footer.legalNote}</span>
        </div>
      </div>
    </footer>
  )
}
