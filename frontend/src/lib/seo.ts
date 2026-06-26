import { SITE_NAME, SITE_TAGLINE, SITE_URL } from './site'

export const DEFAULT_TITLE = `${SITE_NAME} — ${SITE_TAGLINE}`

export const DEFAULT_DESCRIPTION =
  'MaSoVa is an AI-native restaurant management platform for multi-store operations: POS, kitchen display, delivery, inventory, staff scheduling, and customer ordering — built for modern EU restaurants.'

export const SITE_KEYWORDS = [
  'restaurant management system',
  'restaurant POS',
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

export function buildSoftwareApplicationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: SITE_NAME,
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
    description: DEFAULT_DESCRIPTION,
    url: SITE_URL,
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'EUR',
    },
  }
}

export function buildHomeJsonLd() {
  return [
    buildOrganizationSchema(),
    buildWebSiteSchema(),
    buildSoftwareApplicationSchema(),
  ]
}