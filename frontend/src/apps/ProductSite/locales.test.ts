import { describe, expect, it } from 'vitest'
import { COUNTRY_CODES, SITE_LANGUAGES, SITE_LOCALES, SITE_PAGES, SITE_REDIRECTS, countryPath, isPublicSitePath, sitePath, siteRouteFromPath } from './locales'

describe('site URLs', () => {
  it('serves English at the root and other languages under their code', () => {
    expect(sitePath('en')).toBe('/')
    expect(sitePath('en', 'kitchen')).toBe('/product/kitchen')
    expect(sitePath('de')).toBe('/de')
    expect(sitePath('fr', 'stock')).toBe('/fr/product/stock')
    expect(countryPath('en', 'DE')).toBe('/countries/germany')
    expect(countryPath('de', 'DE')).toBe('/de/countries/germany')
  })

  it('resolves every page in every language back to the same locale and page', () => {
    for (const locale of SITE_LOCALES) {
      for (const page of SITE_PAGES) {
        expect(siteRouteFromPath(sitePath(locale, page))).toEqual({ locale, page })
      }
    }
  })

  it('resolves every country page in every language', () => {
    for (const locale of SITE_LOCALES) {
      for (const country of COUNTRY_CODES) {
        expect(siteRouteFromPath(countryPath(locale, country))).toEqual({ locale, page: 'countries', country })
      }
    }
  })

  it('redirects the old URLs to pages that exist', () => {
    for (const target of Object.values(SITE_REDIRECTS)) expect(SITE_PAGES).toContain(target)
  })

  it('tolerates a trailing slash', () => {
    expect(siteRouteFromPath('/de/')).toEqual({ locale: 'de', page: 'home' })
    expect(siteRouteFromPath('/ai/')).toEqual({ locale: 'en', page: 'ai' })
  })

  it('does not claim the product app routes or unknown paths', () => {
    for (const path of ['/kitchen', '/manager', '/pos/orders', '/privacy', '/order', '/en', '/de/kitchen', '/xx', '/product/unknown', '/countries/atlantis']) {
      expect(siteRouteFromPath(path)).toBeNull()
    }
  })

  it('serves no routes for a planned language that is not published yet', () => {
    for (const code of SITE_LANGUAGES.filter((l) => !(SITE_LOCALES as readonly string[]).includes(l))) {
      expect(siteRouteFromPath(`/${code}`)).toBeNull()
      expect(siteRouteFromPath(`/${code}/pricing`)).toBeNull()
    }
  })
})

describe('isPublicSitePath', () => {
  it.each(['/', '/de', '/fr/product/kitchen', '/countries/germany', '/privacy', '/terms', '/cookies', '/refunds', '/privacy/'])(
    'treats %s as a getmasova.rest page',
    (path) => {
      expect(isPublicSitePath(path)).toBe(true)
    },
  )

  it.each(['/order', '/menu', '/manager', '/staff-login', '/kitchen', '/privacy/x'])('treats %s as a product app route', (path) => {
    expect(isPublicSitePath(path)).toBe(false)
  })
})
