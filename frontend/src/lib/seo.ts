import { SITE_NAME, SITE_TAGLINE, SITE_URL } from './site'

export const DEFAULT_TITLE = `${SITE_NAME} — ${SITE_TAGLINE}`

export const DEFAULT_DESCRIPTION =
  'Online ordering, counter, kitchen display, delivery, stock, rotas, guests and reports in one connected system, with AI assistants that prepare decisions for a manager to approve. Runs alongside the till you already use.'

export const SITE_KEYWORDS = [
  'restaurant management system',
  'restaurant ordering system',
  'kitchen display system',
  'multi-store restaurant software',
  'food delivery platform',
  'restaurant inventory',
  'staff scheduling restaurant',
  'MaSoVa',
].join(', ')

export function buildOrganizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE_NAME,
    url: SITE_URL,
    description: DEFAULT_DESCRIPTION,
  }
}

export function buildWebSiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    url: SITE_URL,
    description: DEFAULT_DESCRIPTION,
    inLanguage: 'en-GB',
  }
}

export function buildHomeJsonLd() {
  return [
    buildOrganizationSchema(),
    buildWebSiteSchema(),
  ]
}