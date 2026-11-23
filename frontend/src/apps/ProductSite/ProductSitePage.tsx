import { useMemo } from 'react'
import './site.css'
import './scenes.css'
import { useLandingScrollRestore } from './hooks/useLandingScrollRestore'
import { SiteContext } from './SiteContext'
import { getSiteCopy } from './content'
import { isCountryPageIndexed } from './content/shared'
import {
  DEFAULT_SITE_LOCALE, PRODUCT_AREAS, SITE_LOCALES, SITE_LOCALE_TAGS, countryPath, sitePath,
  type CountryCode, type ProductArea, type SiteLocale, type SitePage,
} from './locales'
import { Seo } from '../../components/seo/Seo'
import { SITE_URL } from '../../lib/site'
import SiteNav from './components/SiteNav'
import SiteFooter from './components/SiteFooter'
import { CtaBand, PageHeader, useReveal } from './components/Layout'
import { AiHomeSection, AreasGrid, CountriesTeaser, HeroSection, JourneySection, RolesSection } from './components/HomeSections'
import {
  AboutPage, AiPage, AppsPage, AreaPage, CompliancePage, CountriesPage, CountryPage, FaqPage, IntegrationsPage,
  PilotPage, PricingPage, ProductPage, SecurityPage, SolutionsPage,
} from './components/Pages'
import ContactSection from './components/ContactSection'
import Concierge from './components/Concierge'
import { ShowcaseSection } from './components/Showcase'
import { usePointerGlow } from './components/Effects'

function PageBody({ page, country }: { page: SitePage; country?: CountryCode }) {
  if ((PRODUCT_AREAS as readonly string[]).includes(page)) return <AreaPage area={page as ProductArea} />
  switch (page) {
    case 'home':
      return (
        <>
          <HeroSection />
          <ShowcaseSection />
          <JourneySection />
          <AreasGrid />
          <AiHomeSection />
          <RolesSection />
          <CountriesTeaser />
        </>
      )
    case 'product': return <ProductPage />
    case 'apps': return <AppsPage />
    case 'ai': return <AiPage />
    case 'solutions': return <SolutionsPage />
    case 'countries': return country ? <CountryPage code={country} /> : <CountriesPage />
    case 'compliance': return <CompliancePage />
    case 'security': return <SecurityPage />
    case 'integrations': return <IntegrationsPage />
    case 'pricing': return <PricingPage />
    case 'pilot': return <PilotPage />
    case 'faq': return <FaqPage />
    case 'about': return <AboutPage />
    case 'contact':
      return (
        <>
          <PageHeader page="contact" />
          <ContactSection />
        </>
      )
    default: return null
  }
}

interface ProductSitePageProps {
  locale?: SiteLocale
  page?: SitePage
  /** Set for a country page such as /countries/germany. */
  country?: CountryCode
}

/**
 * getmasova.rest: the marketing site for the whole MaSoVa family.
 * Every page is published in every site language (see locales.ts for the URL scheme).
 */
export default function ProductSitePage({ locale = DEFAULT_SITE_LOCALE, page = 'home', country }: ProductSitePageProps) {
  useLandingScrollRestore()
  const value = useMemo(() => ({ locale, copy: getSiteCopy(locale) }), [locale])
  const { copy } = value
  const pathFor = (code: SiteLocale) => (country ? countryPath(code, country) : sitePath(code, page))

  useReveal(`${locale}/${page}/${country ?? ''}`)
  usePointerGlow()

  // A country page is indexed only in English and the languages read there (isCountryPageIndexed).
  // Indexed versions link to each other with hreflang; the other versions are noindex and link to none.
  const noindex = country !== undefined && !isCountryPageIndexed(country, locale)
  const alternates = useMemo(() => {
    if (noindex) return []
    const urlFor = (code: SiteLocale) => `${SITE_URL}${country ? countryPath(code, country) : sitePath(code, page)}`
    const indexed = SITE_LOCALES.filter((code) => !country || isCountryPageIndexed(country, code))
    return [
      ...indexed.map((code) => ({ hrefLang: SITE_LOCALE_TAGS[code], href: urlFor(code) })),
      { hrefLang: 'x-default', href: urlFor(DEFAULT_SITE_LOCALE) },
    ]
  }, [page, country, noindex])
  const meta = copy.pages[page]
  const title = page === 'home' ? copy.meta.title : `${country ? copy.countries.list[country].name : meta.heading} | MaSoVa`
  const description = page === 'home' ? copy.meta.description : country ? `${copy.countries.list[country].name}: ${copy.countries.pageLead}` : meta.lead

  return (
    <SiteContext.Provider value={value}>
      <div id="product-site" className="ms" lang={SITE_LOCALE_TAGS[locale]}>
        <Seo
          title={title}
          description={description}
          path={pathFor(locale)}
          lang={SITE_LOCALE_TAGS[locale]}
          ogLocale={SITE_LOCALE_TAGS[locale].replace('-', '_')}
          alternates={alternates}
          noindex={noindex}
          jsonLd={page === 'home'}
        />
        <a className="ms-skip" href="#main">{copy.ui.skip}</a>
        <div className="ms-progress" aria-hidden="true" />
        <SiteNav page={page} country={country} />
        <main id="main">
          <PageBody page={page} country={country} />
          {page !== 'contact' && <CtaBand page={page} />}
        </main>
        <SiteFooter page={page} country={country} />
        {page !== 'contact' && <Concierge />}
      </div>
    </SiteContext.Provider>
  )
}
