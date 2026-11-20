import { describe, expect, it } from 'vitest'
import { SITE_COPY } from './index'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { COUNTRY_CODES, SITE_LEGAL_PATHS, SITE_LOCALES, SITE_PAGES, isSiteLocale } from '../locales'
import { APP_GROUPS, APP_STATUS, AREA_META, ASSISTANT_SCHEDULE, INBOX_ASSISTANTS, SITE_COUNTRIES } from './shared'

type Json = string | number | boolean | null | Json[] | { [key: string]: Json }

/** Every leaf path in an object, with array positions, e.g. "apps.items.2.key". */
function leafPaths(value: Json, prefix = ''): string[] {
  if (Array.isArray(value)) return value.flatMap((item, i) => leafPaths(item, `${prefix}${i}.`))
  if (value && typeof value === 'object') {
    return Object.entries(value).flatMap(([key, item]) => leafPaths(item, `${prefix}${key}.`))
  }
  return [prefix.slice(0, -1)]
}

function leafValues(value: Json): string[] {
  if (Array.isArray(value)) return value.flatMap(leafValues)
  if (value && typeof value === 'object') return Object.values(value).flatMap(leafValues)
  return typeof value === 'string' ? [value] : []
}

/** Fields that are identifiers or structure, not text, and must match English exactly. */
const STRUCTURAL = /(^|\.)(key|value)$/

const english = SITE_COPY.en as unknown as Json

describe('site copy', () => {
  it.each(SITE_LOCALES.filter((l) => l !== 'en'))('%s has exactly the same fields and list lengths as English', (locale) => {
    const copy = SITE_COPY[locale] as unknown as Json
    expect(leafPaths(copy).sort()).toEqual(leafPaths(english).sort())
  })

  it.each(SITE_LOCALES.filter((l) => l !== 'en'))('%s keeps the same keys and figures as English', (locale) => {
    const copy = SITE_COPY[locale] as unknown as Json
    const pick = (root: Json) =>
      leafPaths(root)
        .filter((path) => STRUCTURAL.test(path))
        .map((path) => [path, path.split('.').reduce<Json>((node, key) => (node as Record<string, Json>)[key], root)])
    expect(pick(copy)).toEqual(pick(english))
  })

  it.each(SITE_LOCALES)('%s keeps the {email} and {address} placeholders', (locale) => {
    const form = SITE_COPY[locale].contact.form
    expect(form.successBody).toContain('{email}')
    expect(form.error).toContain('{address}')
  })

  it.each(SITE_LOCALES.filter((l) => l !== 'en'))('%s is translated, not a copy of English', (locale) => {
    const copy = SITE_COPY[locale]
    for (const page of Object.keys(copy.pages) as (keyof typeof copy.pages)[]) {
      expect(copy.pages[page].lead).not.toBe(SITE_COPY.en.pages[page].lead)
    }
    expect(copy.ai.rules.items).not.toEqual(SITE_COPY.en.ai.rules.items)
  })

  it('publishes only languages that have their own copy, none falling back to English', () => {
    expect(Object.keys(SITE_COPY).sort()).toEqual([...SITE_LOCALES].sort())
    const fallback = SITE_LOCALES.filter((l) => l !== 'en' && SITE_COPY[l] === SITE_COPY.en)
    expect(fallback).toEqual([])
  })

  it.each(SITE_LOCALES)('%s has no straight apostrophes or double quotes in its text', (locale) => {
    const bad = leafValues(SITE_COPY[locale] as unknown as Json).filter((text) => /['"]/.test(text))
    expect(bad).toEqual([])
  })

  it.each(SITE_LOCALES)('%s has no empty strings', (locale) => {
    const empty = leafValues(SITE_COPY[locale] as unknown as Json).filter((text) => !text.trim())
    expect(empty).toEqual([])
  })

  // Public claims must match the Product Truth Register: these phrases describe things that are not built.
  const BANNED = [
    /fiscal signing (built in|for)/i,
    /certified fiscal/i,
    /12[- ]country/i,
    /12 EU countries/i,
    /production[- ]grade/i,
    /GDPR[- ](certified|compliant)/i,
    /SOC ?2 (certified|compliant)/i,
    /autonomous/i,
    /(integrated|integration) with (Wolt|Deliveroo|Uber Eats|Just Eat)/i,
    /\blive API/i,
  ]

  it.each(SITE_LOCALES)('%s makes no claims the product cannot back up', (locale) => {
    const text = leafValues(SITE_COPY[locale] as unknown as Json)
    const hits = text.filter((line) => BANNED.some((pattern) => pattern.test(line)))
    expect(hits).toEqual([])
  })

  it.each(SITE_LOCALES)('%s describes every app in APP_STATUS with exactly three points', (locale) => {
    const items = SITE_COPY[locale].apps.items
    expect(items.map((app) => app.key).sort()).toEqual(Object.keys(APP_STATUS).sort())
    for (const app of items) expect(app.points).toHaveLength(3)
  })

  it.each(SITE_LOCALES)('%s has one assistant per schedule entry and one inbox item per inbox assistant', (locale) => {
    expect(SITE_COPY[locale].ai.assistants).toHaveLength(ASSISTANT_SCHEDULE.length)
    expect(SITE_COPY[locale].ai.inbox.items).toHaveLength(INBOX_ASSISTANTS.length)
  })

  it.each(SITE_LOCALES)('%s lists the 14 regulated allergens', (locale) => {
    expect(SITE_COPY[locale].compliance.allergens).toHaveLength(14)
  })

  it.each(SITE_LOCALES)('%s has a country entry for every country page', (locale) => {
    expect(Object.keys(SITE_COPY[locale].countries.list).sort()).toEqual([...COUNTRY_CODES].sort())
  })
})

describe('site structure', () => {
  it('only refers to apps that exist, and puts every app in exactly one group', () => {
    const keys = Object.keys(APP_STATUS)
    for (const key of APP_GROUPS.flat()) expect(keys).toContain(key)
    for (const meta of Object.values(AREA_META)) for (const key of meta.apps) expect(keys).toContain(key)
    for (const key of keys) expect(APP_GROUPS.filter((group) => group.includes(key))).toHaveLength(1)
  })

  it('lists only the four supported marketplaces for any country', () => {
    const allowed = ['Uber Eats', 'Deliveroo', 'Just Eat', 'Wolt']
    for (const country of SITE_COUNTRIES) for (const name of country.marketplaces) expect(allowed).toContain(name)
  })

  it('offers at least one published language on every country page', () => {
    for (const country of SITE_COUNTRIES) expect(country.locales.filter(isSiteLocale).length).toBeGreaterThan(0)
  })

  it('has a sitemap with every page and country page in every published language, and no retired URLs', () => {
    const xml = readFileSync(resolve(process.cwd(), 'public/sitemap.xml'), 'utf8')
    const urls = xml.match(/<url>/g) ?? []
    expect(urls).toHaveLength(SITE_LOCALES.length * (SITE_PAGES.length + COUNTRY_CODES.length) + SITE_LEGAL_PATHS.length)
    const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1])
    expect(locs.filter((loc) => /\/trust|stock-and-team|\/order$|\/menu$/.test(loc))).toEqual([])
  })
})
