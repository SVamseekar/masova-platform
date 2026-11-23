/**
 * Facts the site shows that are the same in every language: which app is at
 * which stage, when each assistant runs, and the currency, site languages and
 * delivery marketplaces of each country. Text lives in the language files.
 */
import type { CountryCode, ProductArea, SiteLanguage, SiteLocale, SitePage } from '../locales'
import type { AppStatus } from './types'

/** Stage of each app in the family. Keys match `apps.items[].key` in the copy. */
export const APP_STATUS: Record<string, AppStatus> = {
  web: 'available',
  counter: 'available',
  kiosk: 'available',
  kds: 'available',
  driver: 'available',
  manager: 'available',
  agents: 'available',
  support: 'early',
  'customer-app': 'early',
  'staff-app': 'early',
  copilot: 'preview',
  voice: 'preview',
}

export const APP_KEYS = Object.keys(APP_STATUS)

/** Apps grouped by who uses them: guests, team, managers (same order as `apps.audiences`). */
export const APP_GROUPS: string[][] = [
  ['web', 'kiosk', 'customer-app', 'support', 'voice'],
  ['counter', 'kds', 'driver', 'staff-app'],
  ['manager', 'agents', 'copilot'],
]

/** Photo (only where one fits the area; each photo is used once on the site), apps and assistants (by index in `ai.assistants`) for each product area. */
export const AREA_META: Record<ProductArea, { image?: string; apps: string[]; assistants: number[] }> = {
  ordering: { image: '/site/restaurant-table.webp', apps: ['web', 'kiosk', 'customer-app', 'support', 'voice'], assistants: [0, 6] },
  counter: { apps: ['counter', 'kiosk', 'staff-app'], assistants: [7] },
  kitchen: { image: '/site/kitchen-chef.webp', apps: ['kds', 'staff-app', 'manager'], assistants: [5, 0] },
  delivery: { apps: ['driver', 'manager', 'staff-app', 'web'], assistants: [0, 2] },
  stock: { image: '/site/stock-produce.webp', apps: ['manager', 'agents'], assistants: [1, 0] },
  team: { apps: ['manager', 'counter', 'staff-app'], assistants: [2, 5] },
  guests: { image: '/site/guest-meal.webp', apps: ['manager', 'web', 'customer-app', 'support'], assistants: [3, 4] },
  insights: { apps: ['manager', 'agents', 'copilot'], assistants: [7, 0] },
}

/** Product menu columns: front of house, back of house, intelligence. */
export const MEGA_COLUMNS: SitePage[][] = [
  ['ordering', 'counter', 'kitchen', 'delivery'],
  ['stock', 'team', 'guests', 'insights'],
  ['ai', 'apps', 'integrations', 'compliance'],
]

/**
 * When each assistant works, on a 24-hour clock (same order as `ai.assistants`).
 * `at` are the hours it runs; `from`/`to` is a continuous window; neither means on demand.
 */
export const ASSISTANT_SCHEDULE: { at?: number[]; from?: number; to?: number; group: 'stock' | 'team' | 'guests' | 'prices' | 'ask' }[] = [
  { at: [2], group: 'stock' },
  { at: [0, 6, 12, 18], group: 'stock' },
  { at: [20], group: 'team' },
  { from: 0, to: 24, group: 'guests' },
  { at: [10], group: 'guests' },
  { at: [23], group: 'team' },
  { from: 9, to: 22, group: 'prices' },
  { from: 0, to: 24, group: 'ask' },
]

/** Which assistant wrote each sample proposal in the decisions demo (same order as `ai.inbox.items`). */
export const INBOX_ASSISTANTS = [1, 2, 3, 6, 4]

export type Region = 'europe' | 'americas' | 'asiaPacific'

export interface CountryFacts {
  code: CountryCode
  region: Region
  currency: string
  /** Site languages a restaurant in this country is likely to read, most likely first. */
  locales: SiteLanguage[]
  /** Name of the till or fiscal rule the country applies to in-store sales, if it has one. */
  till?: string
  /** Online payment provider MaSoVa uses here. */
  pay: 'stripe' | 'razorpay'
  /** Marketplaces operating here whose orders staff can log into the kitchen queue. */
  marketplaces: string[]
}

export const SITE_COUNTRIES: CountryFacts[] = [
  { code: 'GB', region: 'europe', currency: 'GBP', locales: ['en'], pay: 'stripe', marketplaces: ['Uber Eats', 'Just Eat', 'Deliveroo'] },
  { code: 'IE', region: 'europe', currency: 'EUR', locales: ['en'], pay: 'stripe', marketplaces: ['Deliveroo', 'Just Eat', 'Uber Eats'] },
  { code: 'DE', region: 'europe', currency: 'EUR', locales: ['de', 'en'], till: 'KassenSichV · TSE', pay: 'stripe', marketplaces: ['Wolt', 'Uber Eats'] },
  { code: 'AT', region: 'europe', currency: 'EUR', locales: ['de', 'en'], till: 'RKSV', pay: 'stripe', marketplaces: ['Wolt'] },
  { code: 'CH', region: 'europe', currency: 'CHF', locales: ['de', 'fr', 'it', 'en'], pay: 'stripe', marketplaces: ['Uber Eats', 'Just Eat'] },
  { code: 'FR', region: 'europe', currency: 'EUR', locales: ['fr', 'en'], till: 'NF525', pay: 'stripe', marketplaces: ['Uber Eats', 'Deliveroo'] },
  { code: 'BE', region: 'europe', currency: 'EUR', locales: ['nl', 'fr', 'de', 'en'], till: 'GKS 2.0', pay: 'stripe', marketplaces: ['Deliveroo', 'Uber Eats'] },
  { code: 'NL', region: 'europe', currency: 'EUR', locales: ['nl', 'en'], pay: 'stripe', marketplaces: ['Uber Eats'] },
  { code: 'LU', region: 'europe', currency: 'EUR', locales: ['fr', 'de', 'en'], pay: 'stripe', marketplaces: [] },
  { code: 'IT', region: 'europe', currency: 'EUR', locales: ['it', 'en'], till: 'RT', pay: 'stripe', marketplaces: ['Deliveroo', 'Just Eat', 'Uber Eats'] },
  { code: 'ES', region: 'europe', currency: 'EUR', locales: ['es', 'en'], till: 'Verifactu', pay: 'stripe', marketplaces: ['Just Eat', 'Uber Eats'] },
  { code: 'PT', region: 'europe', currency: 'EUR', locales: ['pt', 'en'], till: 'AT · SAF-T (PT)', pay: 'stripe', marketplaces: ['Uber Eats'] },
  { code: 'PL', region: 'europe', currency: 'PLN', locales: ['pl', 'en'], till: 'Kasa online · KSeF', pay: 'stripe', marketplaces: ['Wolt', 'Uber Eats'] },
  { code: 'CZ', region: 'europe', currency: 'CZK', locales: ['cs', 'en'], till: 'EET 2.0', pay: 'stripe', marketplaces: ['Wolt'] },
  { code: 'HU', region: 'europe', currency: 'HUF', locales: ['hu', 'en'], till: 'NAV', pay: 'stripe', marketplaces: ['Wolt'] },
  { code: 'RO', region: 'europe', currency: 'RON', locales: ['ro', 'en'], till: 'AMEF', pay: 'stripe', marketplaces: ['Wolt'] },
  { code: 'SE', region: 'europe', currency: 'SEK', locales: ['sv', 'en'], till: 'Kassaregister', pay: 'stripe', marketplaces: ['Wolt', 'Uber Eats'] },
  { code: 'DK', region: 'europe', currency: 'DKK', locales: ['da', 'en'], pay: 'stripe', marketplaces: ['Wolt', 'Just Eat'] },
  { code: 'FI', region: 'europe', currency: 'EUR', locales: ['fi', 'sv', 'en'], pay: 'stripe', marketplaces: ['Wolt'] },
  { code: 'US', region: 'americas', currency: 'USD', locales: ['en', 'es'], pay: 'stripe', marketplaces: ['Uber Eats'] },
  { code: 'CA', region: 'americas', currency: 'CAD', locales: ['en', 'fr'], pay: 'stripe', marketplaces: ['Uber Eats'] },
  { code: 'IN', region: 'asiaPacific', currency: 'INR', locales: ['en', 'hi'], pay: 'razorpay', marketplaces: [] },
  { code: 'SG', region: 'asiaPacific', currency: 'SGD', locales: ['en', 'ms'], pay: 'stripe', marketplaces: [] },
  { code: 'MY', region: 'asiaPacific', currency: 'MYR', locales: ['ms', 'en'], pay: 'stripe', marketplaces: [] },
  { code: 'AU', region: 'asiaPacific', currency: 'AUD', locales: ['en'], pay: 'stripe', marketplaces: ['Uber Eats'] },
  { code: 'NZ', region: 'asiaPacific', currency: 'NZD', locales: ['en'], pay: 'stripe', marketplaces: ['Uber Eats'] },
]

export const REGIONS: Region[] = ['europe', 'americas', 'asiaPacific']

export function countryFacts(code: CountryCode): CountryFacts {
  return SITE_COUNTRIES.find((country) => country.code === code) ?? SITE_COUNTRIES[0]
}

/**
 * Whether search engines may index a country page in this language: English (the default
 * locale) and the languages restaurants in that country read. The other language versions
 * stay published for visitors but carry noindex and stay out of the sitemap, because the
 * country pages differ only in a few facts and 130 of them read to Google as duplicates.
 * Type-only imports here keep this file loadable by scripts/generate-sitemap.mjs.
 */
export function isCountryPageIndexed(code: CountryCode, locale: SiteLocale): boolean {
  return locale === 'en' || countryFacts(code).locales.includes(locale)
}

/** Country preselected in the contact form and highlighted on the countries page for each site language. */
export const DEFAULT_COUNTRY_FOR_LOCALE: Record<SiteLanguage, CountryCode> = {
  en: 'GB',
  de: 'DE',
  fr: 'FR',
  it: 'IT',
  es: 'ES',
  nl: 'NL',
  pt: 'PT',
  pl: 'PL',
  cs: 'CZ',
  sv: 'SE',
  da: 'DK',
  fi: 'FI',
  ro: 'RO',
  hu: 'HU',
  hi: 'IN',
  ms: 'MY',
}

/** Brand names shown on the integrations page, in the same order as `integrations.groups`. */
export const INTEGRATION_BRANDS: string[][] = [
  ['Stripe', 'Razorpay', 'Visa', 'Mastercard', 'UPI'],
  ['Google Maps', 'OpenStreetMap'],
  ['Email', 'SMS', 'Push'],
  ['Google'],
  ['Uber Eats', 'Deliveroo', 'Just Eat', 'Wolt'],
  ['KassenSichV · TSE', 'NF525', 'RT', 'GKS', 'RKSV', 'Verifactu'],
]

/** The concierge's topics, in the same order as `concierge.topics` in the copy. */
export const CONCIERGE_TOPICS = ['ai', 'pilot', 'sales', 'question'] as const
