import { describe, expect, it } from 'vitest'
import { fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import ProductSitePage from './ProductSitePage'
import { SITE_COPY } from './content'
import { ASSISTANT_SCHEDULE, INBOX_ASSISTANTS } from './content/shared'
import {
  COUNTRY_CODES, PRODUCT_AREAS, SITE_LOCALES, SITE_LOCALE_TAGS, SITE_PAGES, countryPath, sitePath,
  type CountryCode, type SiteLocale, type SitePage,
} from './locales'

function renderPage(locale: SiteLocale, page: SitePage, country?: CountryCode) {
  return render(
    <MemoryRouter initialEntries={[country ? countryPath(locale, country) : sitePath(locale, page)]}>
      <ProductSitePage locale={locale} page={page} country={country} />
    </MemoryRouter>,
  )
}

describe('ProductSitePage', () => {
  it.each(SITE_PAGES.filter((page) => page !== 'home'))('renders the %s page with its own heading', (page) => {
    renderPage('en', page)
    expect(screen.getByRole('heading', { level: 1, name: SITE_COPY.en.pages[page].heading })).toBeInTheDocument()
  })

  it('renders the home page hero', () => {
    renderPage('en', 'home')
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(SITE_COPY.en.hero.titleLead)
  })

  it.each(SITE_LOCALES)('renders every page in %s without errors', (locale) => {
    for (const page of SITE_PAGES) {
      const view = renderPage(locale, page)
      expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
      view.unmount()
    }
  })

  it.each(COUNTRY_CODES)('renders the country page for %s with the country as its heading', (code) => {
    renderPage('en', 'countries', code)
    expect(screen.getByRole('heading', { level: 1, name: SITE_COPY.en.countries.list[code].name })).toBeInTheDocument()
    expect(document.title).toBe(`${SITE_COPY.en.countries.list[code].name} | MaSoVa`)
  })

  it.each(SITE_LOCALES)('sets the document language and title for %s', (locale) => {
    renderPage(locale, 'ai')
    expect(document.title).toBe(`${SITE_COPY[locale].pages.ai.heading} | MaSoVa`)
    expect(document.documentElement.lang).toMatch(new RegExp(`^${locale}`))
  })

  it('publishes hreflang alternates for every language plus x-default', () => {
    renderPage('fr', 'pilot')
    const alternates = [...document.head.querySelectorAll('link[rel="alternate"][data-seo-hreflang]')]
    expect(alternates.map((link) => link.getAttribute('hreflang'))).toEqual([...SITE_LOCALES.map((code) => SITE_LOCALE_TAGS[code]), 'x-default'])
    expect(alternates.find((link) => link.getAttribute('hreflang') === 'de-DE')).toHaveAttribute('href', expect.stringMatching(/\/de\/pilot$/))
  })

  it('points country page alternates at the same country in each language', () => {
    renderPage('en', 'countries', 'DE')
    const german = document.head.querySelector('link[rel="alternate"][hreflang="de-DE"]')
    expect(german).toHaveAttribute('href', expect.stringMatching(/\/de\/countries\/germany$/))
  })

  it('keeps navigation inside the current language', () => {
    renderPage('it', 'home')
    const links = screen.getAllByRole('link', { name: SITE_COPY.it.pages.pricing.eyebrow })
    expect(links[0]).toHaveAttribute('href', '/it/pricing')
  })

  it('labels every app stage in words, not only colour', () => {
    renderPage('en', 'apps')
    expect(screen.getAllByText(SITE_COPY.en.ui.status.available).length).toBeGreaterThan(0)
  })

  it('shows another app when it is picked in the showcase', async () => {
    renderPage('en', 'apps')
    const driver = SITE_COPY.en.apps.items.find((app) => app.key === 'driver')!
    screen.getByRole('button', { name: driver.name }).click()
    expect(await screen.findByRole('heading', { level: 3, name: driver.name })).toBeInTheDocument()
    expect(screen.getByText(driver.points[0])).toBeInTheDocument()
  })

  it('moves an approved proposal into the decision record and clears it on start again', () => {
    renderPage('en', 'ai')
    const inbox = SITE_COPY.en.ai.inbox
    const log = screen.getByRole('complementary', { name: inbox.logTitle })
    expect(within(log).getByText(inbox.logEmpty)).toBeInTheDocument()

    fireEvent.click(screen.getAllByRole('button', { name: inbox.approve })[0])
    expect(within(log).getByText(inbox.items[0].action)).toBeInTheDocument()
    expect(within(log).getByText(new RegExp(inbox.approved))).toBeInTheDocument()

    fireEvent.click(within(log).getByRole('button', { name: inbox.reset }))
    expect(within(log).queryByText(inbox.items[0].action)).not.toBeInTheDocument()
    expect(within(log).getByText(inbox.logEmpty)).toBeInTheDocument()
  })

  it('shows only stock proposals when the stock filter is picked', () => {
    renderPage('en', 'ai')
    const inbox = SITE_COPY.en.ai.inbox
    fireEvent.click(screen.getByRole('button', { name: 'Stock' }))
    const shown = screen.getAllByRole('heading', { level: 3 }).map((h) => h.textContent)
    inbox.items.forEach((item, i) => {
      const isStock = ASSISTANT_SCHEDULE[INBOX_ASSISTANTS[i]].group === 'stock'
      expect(shown.includes(item.title)).toBe(isStock)
    })
  })

  it('shows the driver day when the driver role is picked', () => {
    renderPage('en', 'apps')
    const driver = SITE_COPY.en.apps.roles[4]
    fireEvent.click(screen.getByRole('button', { name: driver.role }))
    expect(screen.getByText(driver.text)).toBeInTheDocument()
  })

  it('lists every app against every product area in the app matrix', () => {
    const { container } = renderPage('en', 'apps')
    const table = container.querySelector('table.ms-matrix') as HTMLTableElement
    expect(within(table).getAllByRole('rowheader').filter((th) => th.getAttribute('scope') === 'row')).toHaveLength(SITE_COPY.en.apps.items.length)
    expect(within(table).getAllByRole('columnheader').filter((th) => th.getAttribute('scope') === 'col')).toHaveLength(PRODUCT_AREAS.length)
    expect(SITE_COPY.en.apps.items).toHaveLength(12)
  })

  it.each(PRODUCT_AREAS)('gives the %s page one section per feature group', (area) => {
    const { container } = renderPage('en', area)
    const sections = container.querySelectorAll('section[id^="g"]')
    expect([...sections].filter((el) => /^g\d+$/.test(el.id))).toHaveLength(SITE_COPY.en.areas.items[area].groups.length)
  })

  it('names Razorpay for India and Stripe for Germany on the country pages', () => {
    const india = renderPage('en', 'countries', 'IN')
    expect(screen.getByText(SITE_COPY.en.countries.payRazorpay)).toBeInTheDocument()
    india.unmount()
    renderPage('en', 'countries', 'DE')
    expect(screen.getByText(SITE_COPY.en.countries.payStripe)).toBeInTheDocument()
  })

  it('shows the text of each solution when its pill is clicked', () => {
    renderPage('en', 'solutions')
    for (const type of SITE_COPY.en.solutions.types) {
      fireEvent.click(screen.getByRole('button', { name: type.name }))
      expect(screen.getByText(type.text)).toBeInTheDocument()
    }
  })
})
