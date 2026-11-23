/**
 * Server-side entry for the build-time prerender (scripts/prerender-site.mjs).
 * Renders each page of getmasova.rest to HTML, so search engines, link previews and
 * AI tools that read the raw HTML get that page's own content and tags.
 * Not part of the browser bundle.
 */
import type { ReactElement } from 'react'
import { renderToString } from 'react-dom/server'
import { StaticRouter } from 'react-router-dom'
import ProductSitePage from './ProductSitePage'
import { PrivacyPolicy } from '../../pages/PrivacyPolicy'
import { TermsOfService } from '../../pages/TermsOfService'
import { CookiePolicy } from '../../pages/CookiePolicy'
import { RefundPolicy } from '../../pages/RefundPolicy'
import { COUNTRY_CODES, SITE_LEGAL_PATHS, SITE_LOCALES, SITE_PAGES, countryPath, sitePath, type SiteLegalPath } from './locales'
import { SeoCollectorContext, buildSeoHead, seoHeadToHtml, type SeoProps } from '../../components/seo/seoHead'

/** Source module of each page's code, as keyed in Vite's manifest. */
const SITE_CHUNK = 'src/apps/ProductSite/ProductSitePage.tsx'

const LEGAL_PAGES: Record<SiteLegalPath, { element: () => ReactElement; chunk: string }> = {
  '/privacy': { element: () => <PrivacyPolicy />, chunk: 'src/pages/PrivacyPolicy.tsx' },
  '/terms': { element: () => <TermsOfService />, chunk: 'src/pages/TermsOfService.tsx' },
  '/cookies': { element: () => <CookiePolicy />, chunk: 'src/pages/CookiePolicy.tsx' },
  '/refunds': { element: () => <RefundPolicy />, chunk: 'src/pages/RefundPolicy.tsx' },
}

export interface PrerenderRoute {
  path: string
  element: () => ReactElement
  /** Manifest key of the page's code chunk, whose CSS and preloads the page links. */
  chunk: string
}

/** Every page of the site: each page and country page in every language, then the legal pages. */
export function prerenderRoutes(): PrerenderRoute[] {
  const routes: PrerenderRoute[] = []
  for (const locale of SITE_LOCALES) {
    for (const page of SITE_PAGES) {
      routes.push({ path: sitePath(locale, page), chunk: SITE_CHUNK, element: () => <ProductSitePage locale={locale} page={page} /> })
    }
    for (const country of COUNTRY_CODES) {
      routes.push({
        path: countryPath(locale, country),
        chunk: SITE_CHUNK,
        element: () => <ProductSitePage locale={locale} page="countries" country={country} />,
      })
    }
  }
  for (const path of SITE_LEGAL_PATHS) routes.push({ path, ...LEGAL_PAGES[path] })
  return routes
}

export interface PrerenderedPage {
  /** Value for <html lang>. */
  lang: string
  /** Page-specific head tags: title, description, canonical, hreflang, Open Graph. */
  head: string
  /** Markup for inside <div id="root">. */
  body: string
}

export function renderPage(route: PrerenderRoute): PrerenderedPage {
  let seo: SeoProps | null = null
  const body = renderToString(
    <SeoCollectorContext.Provider value={(props) => { seo = props }}>
      <StaticRouter location={route.path}>{route.element()}</StaticRouter>
    </SeoCollectorContext.Provider>,
  )
  if (!seo) throw new Error(`${route.path} rendered no <Seo>; its head tags would fall back to the home page's`)
  const head = buildSeoHead(seo)
  return { lang: head.lang, head: seoHeadToHtml(head), body }
}
