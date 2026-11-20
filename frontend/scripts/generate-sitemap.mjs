// Writes public/sitemap.xml from the site's own list of languages, pages and countries.
// Run from frontend/: node --experimental-strip-types scripts/generate-sitemap.mjs
import { writeFileSync } from 'node:fs'
import {
  COUNTRY_CODES, DEFAULT_SITE_LOCALE, SITE_LOCALES, SITE_LOCALE_TAGS, SITE_PAGES, countryPath, sitePath,
} from '../src/apps/ProductSite/locales.ts'

const ORIGIN = 'https://getmasova.rest'
const today = new Date().toISOString().slice(0, 10)

/** Legal pages: outside the language prefixes, published in English only. The ordering app (/order, /menu) is noindex and stays out. */
const SINGLE_PAGES = [
  ['/privacy', 'yearly', '0.4'],
  ['/terms', 'yearly', '0.4'],
  ['/cookies', 'yearly', '0.4'],
  ['/refunds', 'yearly', '0.4'],
]

function entry(pathFor, locale, changefreq, priority) {
  const alternates = [
    ...SITE_LOCALES.map((code) => `    <xhtml:link rel="alternate" hreflang="${SITE_LOCALE_TAGS[code]}" href="${ORIGIN}${pathFor(code)}"/>`),
    `    <xhtml:link rel="alternate" hreflang="x-default" href="${ORIGIN}${pathFor(DEFAULT_SITE_LOCALE)}"/>`,
  ]
  return ['  <url>', `    <loc>${ORIGIN}${pathFor(locale)}</loc>`, ...alternates, `    <lastmod>${today}</lastmod>`, `    <changefreq>${changefreq}</changefreq>`, `    <priority>${priority}</priority>`, '  </url>'].join('\n')
}

const urls = []
for (const page of SITE_PAGES) {
  const priority = page === 'home' ? '1.0' : page === 'product' || page === 'ai' || page === 'pricing' || page === 'contact' ? '0.9' : '0.8'
  for (const locale of SITE_LOCALES) urls.push(entry((code) => sitePath(code, page), locale, 'weekly', priority))
}
for (const country of COUNTRY_CODES) {
  for (const locale of SITE_LOCALES) urls.push(entry((code) => countryPath(code, country), locale, 'monthly', '0.6'))
}
for (const [path, changefreq, priority] of SINGLE_PAGES) {
  urls.push(['  <url>', `    <loc>${ORIGIN}${path}</loc>`, `    <lastmod>${today}</lastmod>`, `    <changefreq>${changefreq}</changefreq>`, `    <priority>${priority}</priority>`, '  </url>'].join('\n'))
}

const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${urls.join('\n')}\n</urlset>\n`
writeFileSync(new URL('../public/sitemap.xml', import.meta.url), xml)
console.log(`sitemap.xml: ${urls.length} URLs`)
