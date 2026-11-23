import { describe, expect, it } from 'vitest'
import { prerenderRoutes, renderPage } from './prerender'
import { COUNTRY_CODES, SITE_LEGAL_PATHS, SITE_LOCALES, SITE_PAGES } from './locales'

const SITE_URL = 'https://getmasova.rest'

function canonicalOf(head: string): string | undefined {
  return head.match(/<link rel="canonical" href="([^"]+)"/)?.[1]
}

describe('site prerender', () => {
  const routes = prerenderRoutes()

  it('covers every page, country page and legal page, once each', () => {
    const paths = routes.map((route) => route.path)
    expect(paths).toHaveLength(SITE_LOCALES.length * (SITE_PAGES.length + COUNTRY_CODES.length) + SITE_LEGAL_PATHS.length)
    expect(new Set(paths).size).toBe(paths.length)
  })

  it('gives every page its own canonical URL, title and heading', () => {
    const titles = new Set<string>()
    for (const route of routes) {
      const page = renderPage(route)
      expect(canonicalOf(page.head), route.path).toBe(route.path === '/' ? `${SITE_URL}/` : `${SITE_URL}${route.path}`)
      expect(page.body, route.path).toMatch(/<h1[^>]*>[^<]+/)
      titles.add(page.head.match(/<title>([^<]*)<\/title>/)?.[1] ?? '')
    }
    // Language versions share some page titles only where the copy is the same word (e.g. "FAQ"),
    // so most titles must still differ.
    expect(titles.size).toBeGreaterThan(routes.length * 0.9)
  })

  it('links each language version to the others with hreflang', () => {
    const page = renderPage(routes.find((route) => route.path === '/de/pricing')!)
    expect(page.lang).toBe('de-DE')
    for (const href of ['/pricing', '/de/pricing', '/fr/pricing', '/it/pricing', '/es/pricing']) {
      expect(page.head).toContain(`href="${SITE_URL}${href}" data-seo-hreflang`)
    }
    expect(page.head).toContain(`hreflang="x-default" href="${SITE_URL}/pricing"`)
  })

  it('renders the page content, not an empty shell', () => {
    const page = renderPage(routes.find((route) => route.path === '/pricing')!)
    expect(page.body).toContain('Per site, per month')
    expect(page.body).toContain('href="/contact"')
  })
})
