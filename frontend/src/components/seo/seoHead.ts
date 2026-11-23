import { createContext } from 'react'
import { DEFAULT_DESCRIPTION, DEFAULT_TITLE, SITE_KEYWORDS, buildHomeJsonLd } from '../../lib/seo'
import { SITE_URL } from '../../lib/site'

export interface SeoAlternate {
  /** BCP 47 tag or "x-default". */
  hrefLang: string
  /** Absolute URL. */
  href: string
}

export interface SeoProps {
  title?: string
  description?: string
  path?: string
  noindex?: boolean
  /** BCP 47 tag for <html lang>, e.g. "de-DE". */
  lang?: string
  /** Open Graph locale, e.g. "de_DE". */
  ogLocale?: string
  /** Language alternates for this page (hreflang links). */
  alternates?: SeoAlternate[]
  /** Add the organisation/website JSON-LD (home page only). */
  jsonLd?: boolean
}

export interface SeoMeta {
  /** "name" for ordinary meta tags, "property" for Open Graph. */
  attr: 'name' | 'property'
  key: string
  content: string
}

/** Everything a page puts in <head>, worked out once for the browser and for the build-time prerender. */
export interface SeoHead {
  lang: string
  title: string
  canonical: string
  metas: SeoMeta[]
  alternates: SeoAlternate[]
  jsonLd: object[]
}

export function buildSeoHead({
  title = DEFAULT_TITLE,
  description = DEFAULT_DESCRIPTION,
  path = '/',
  noindex = false,
  lang = 'en-GB',
  ogLocale = 'en_GB',
  alternates = [],
  jsonLd = !noindex,
}: SeoProps): SeoHead {
  const url = path === '/' ? `${SITE_URL}/` : `${SITE_URL}${path}`
  const name = (key: string, content: string): SeoMeta => ({ attr: 'name', key, content })
  const property = (key: string, content: string): SeoMeta => ({ attr: 'property', key, content })
  return {
    lang,
    title,
    canonical: url,
    metas: [
      name('description', description),
      name('keywords', SITE_KEYWORDS),
      name('robots', noindex ? 'noindex, nofollow' : 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1'),
      property('og:title', title),
      property('og:description', description),
      property('og:url', url),
      property('og:type', 'website'),
      property('og:site_name', 'MaSoVa'),
      property('og:locale', ogLocale),
      name('twitter:card', 'summary_large_image'),
      name('twitter:title', title),
      name('twitter:description', description),
    ],
    alternates,
    jsonLd: jsonLd && !noindex ? buildHomeJsonLd() : [],
  }
}

function escapeAttr(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

/**
 * The head tags as HTML, for the build-time prerender. The data-seo-* attributes match the
 * ones the Seo component looks for, so the browser updates these tags instead of adding copies.
 */
export function seoHeadToHtml(head: SeoHead): string {
  return [
    `<title>${escapeAttr(head.title)}</title>`,
    ...head.metas.map(({ attr, key, content }) => `<meta ${attr}="${key}" content="${escapeAttr(content)}" />`),
    `<link rel="canonical" href="${escapeAttr(head.canonical)}" />`,
    ...head.alternates.map(({ hrefLang, href }) => `<link rel="alternate" hreflang="${escapeAttr(hrefLang)}" href="${escapeAttr(href)}" data-seo-hreflang="" />`),
    // "<" is escaped so no string in the data can close the script element early.
    ...head.jsonLd.map((schema) => `<script type="application/ld+json" data-seo-jsonld="home">${JSON.stringify(schema).replace(/</g, '\\u003c')}</script>`),
  ].join('\n    ')
}

/**
 * Set only by the build-time prerender. A Seo component rendered inside it reports its
 * props here, so each prerendered page gets the same tags the browser would set.
 */
export const SeoCollectorContext = createContext<((props: SeoProps) => void) | null>(null)
