/**
 * Languages, pages and countries of the getmasova.rest marketing site, and the URL for each.
 * English lives at the root ("/product"), every other language under its code ("/de/product").
 * Slugs stay in English in every language so links and analytics line up.
 * The product apps keep their own i18n setup (src/i18n); this file only covers the site.
 */
export const SITE_LANGUAGES = ['en', 'de', 'fr', 'it', 'es', 'nl', 'pt', 'pl', 'cs', 'sv', 'da', 'fi', 'ro', 'hu', 'hi', 'ms'] as const

/** Any language the site is planned in, published or not. */
export type SiteLanguage = (typeof SITE_LANGUAGES)[number]

/**
 * Languages published today: each has its own written copy in content/<code>.ts.
 * A planned language gets routes, sitemap entries and a place in the switcher only
 * once its code is added here and its file is registered in content/index.ts.
 */
export const SITE_LOCALES = ['en', 'de', 'fr', 'it', 'es'] as const satisfies readonly SiteLanguage[]

export type SiteLocale = (typeof SITE_LOCALES)[number]

export function isSiteLocale(code: string): code is SiteLocale {
  return (SITE_LOCALES as readonly string[]).includes(code)
}

export const DEFAULT_SITE_LOCALE: SiteLocale = 'en'

/** Native names, shown in the language switcher in their own language. */
export const SITE_LOCALE_NAMES: Record<SiteLanguage, string> = {
  en: 'English',
  de: 'Deutsch',
  fr: 'Français',
  it: 'Italiano',
  es: 'Español',
  nl: 'Nederlands',
  pt: 'Português',
  pl: 'Polski',
  cs: 'Čeština',
  sv: 'Svenska',
  da: 'Dansk',
  fi: 'Suomi',
  ro: 'Română',
  hu: 'Magyar',
  hi: 'हिन्दी',
  ms: 'Bahasa Melayu',
}

/** BCP 47 tags used for <html lang>, hreflang and og:locale. */
export const SITE_LOCALE_TAGS: Record<SiteLanguage, string> = {
  en: 'en-GB',
  de: 'de-DE',
  fr: 'fr-FR',
  it: 'it-IT',
  es: 'es-ES',
  nl: 'nl-NL',
  pt: 'pt-PT',
  pl: 'pl-PL',
  cs: 'cs-CZ',
  sv: 'sv-SE',
  da: 'da-DK',
  fi: 'fi-FI',
  ro: 'ro-RO',
  hu: 'hu-HU',
  hi: 'hi-IN',
  ms: 'ms-MY',
}

/** Every fixed page of the site, keyed by a stable name, with its URL slug. */
export const SITE_PAGE_SLUGS = {
  home: '',
  product: 'product',
  ordering: 'product/ordering',
  counter: 'product/counter',
  kitchen: 'product/kitchen',
  delivery: 'product/delivery',
  stock: 'product/stock',
  team: 'product/team',
  guests: 'product/guests',
  insights: 'product/reports',
  apps: 'apps',
  ai: 'ai',
  solutions: 'solutions',
  countries: 'countries',
  compliance: 'compliance',
  security: 'security',
  integrations: 'integrations',
  pricing: 'pricing',
  pilot: 'pilot',
  faq: 'faq',
  about: 'about',
  contact: 'contact',
} as const

export type SitePage = keyof typeof SITE_PAGE_SLUGS

export const SITE_PAGES = Object.keys(SITE_PAGE_SLUGS) as SitePage[]

/** The eight product areas, in the order the site presents them. */
export const PRODUCT_AREAS = ['ordering', 'counter', 'kitchen', 'delivery', 'stock', 'team', 'guests', 'insights'] as const

export type ProductArea = (typeof PRODUCT_AREAS)[number]

/** Countries with their own page, and the slug of that page under /countries. */
export const COUNTRY_SLUGS = {
  IN: 'india',
  GB: 'united-kingdom',
  IE: 'ireland',
  US: 'united-states',
  CA: 'canada',
  AU: 'australia',
  NZ: 'new-zealand',
  SG: 'singapore',
  MY: 'malaysia',
  DE: 'germany',
  AT: 'austria',
  CH: 'switzerland',
  FR: 'france',
  BE: 'belgium',
  NL: 'netherlands',
  LU: 'luxembourg',
  IT: 'italy',
  ES: 'spain',
  PT: 'portugal',
  PL: 'poland',
  CZ: 'czechia',
  HU: 'hungary',
  RO: 'romania',
  SE: 'sweden',
  DK: 'denmark',
  FI: 'finland',
} as const

export type CountryCode = keyof typeof COUNTRY_SLUGS

export const COUNTRY_CODES = Object.keys(COUNTRY_SLUGS) as CountryCode[]

function prefixFor(locale: SiteLocale): string {
  return locale === DEFAULT_SITE_LOCALE ? '' : `/${locale}`
}

export function sitePath(locale: SiteLocale, page: SitePage = 'home'): string {
  const slug = SITE_PAGE_SLUGS[page]
  const prefix = prefixFor(locale)
  if (!slug) return prefix || '/'
  return `${prefix}/${slug}`
}

export function countryPath(locale: SiteLocale, code: CountryCode): string {
  return `${prefixFor(locale)}/${SITE_PAGE_SLUGS.countries}/${COUNTRY_SLUGS[code]}`
}

/** Pages that moved in the 2026-11 restructure: old slug to the page that replaced it. */
export const SITE_REDIRECTS: Record<string, SitePage> = {
  trust: 'security',
  'product/stock-and-team': 'stock',
}

/** Legal pages. They are published in English only and sit outside the language prefixes. */
export const SITE_LEGAL_PATHS = ['/privacy', '/terms', '/cookies', '/refunds'] as const

export type SiteLegalPath = (typeof SITE_LEGAL_PATHS)[number]

/** True for any page of getmasova.rest: a marketing page in any language, or a legal page. */
export function isPublicSitePath(pathname: string): boolean {
  const path = pathname.replace(/\/+$/, '') || '/'
  return (SITE_LEGAL_PATHS as readonly string[]).includes(path) || siteRouteFromPath(path) !== null
}

const PAGE_BY_SLUG = new Map<string, SitePage>(SITE_PAGES.map((page) => [SITE_PAGE_SLUGS[page], page]))
const COUNTRY_BY_SLUG = new Map<string, CountryCode>(COUNTRY_CODES.map((code) => [COUNTRY_SLUGS[code], code]))

export interface SiteRoute {
  locale: SiteLocale
  page: SitePage
  /** Set on a country page ("/countries/germany"); page is then "countries". */
  country?: CountryCode
}

/** Resolves a pathname such as "/", "/ai" or "/de/countries/germany" to a site route, or null for any other path. */
export function siteRouteFromPath(pathname: string): SiteRoute | null {
  const parts = pathname.split('/').filter(Boolean)
  let locale: SiteLocale = DEFAULT_SITE_LOCALE
  if (parts.length && parts[0] !== DEFAULT_SITE_LOCALE && isSiteLocale(parts[0])) {
    locale = parts.shift() as SiteLocale
  }
  const slug = parts.join('/')
  const page = PAGE_BY_SLUG.get(slug)
  if (page) return { locale, page }
  if (parts.length === 2 && parts[0] === SITE_PAGE_SLUGS.countries) {
    const country = COUNTRY_BY_SLUG.get(parts[1])
    if (country) return { locale, page: 'countries', country }
  }
  return null
}
