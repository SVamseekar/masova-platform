/**
 * Shape of every piece of text on the marketing site. One object per language
 * (en.ts, de.ts, ...). Everything that is not text (icons, statuses, schedules,
 * currencies, brand names) lives in shared.ts so a translation cannot change it.
 * Claims must match the Product Truth Register: nothing here may claim fiscal
 * signing, direct marketplace connections, voice ordering, customers, metrics
 * or certifications that do not exist.
 */
import type { ContactEmailKey } from '../../../config/contact'
import type { CountryCode, ProductArea, SitePage } from '../locales'

export type { CountryCode }

export type AppStatus = 'available' | 'early' | 'preview'

export interface TitledText {
  title: string
  text: string
}

export interface PageCopy {
  /** Short name of the page: used for the eyebrow, navigation, footer and search. */
  eyebrow: string
  /** The page's <h1>, and its <title> together with the site name. */
  heading: string
  /** Lead paragraph, also used as the meta description. */
  lead: string
}

export interface AreaCopy {
  label: string
  /** One line for cards and the product menu. */
  tagline: string
  imageAlt: string
  groups: { title: string; text: string; features: TitledText[] }[]
}

export interface SiteCopy {
  meta: { title: string; description: string }
  pages: Record<SitePage, PageCopy>
  ui: {
    skip: string
    sampleData: string
    explore: string
    next: string
    bookCta: string
    allFeatures: string
    forLabel: string
    stepLabel: string
    status: Record<AppStatus, string>
  }
  nav: {
    signIn: string
    openMenu: string
    closeMenu: string
    language: string
    home: string
    /** Column titles of the product menu: front of house, back of house, intelligence. */
    groups: [string, string, string]
    asideTitle: string
    search: {
      open: string
      placeholder: string
      empty: string
      pages: string
      features: string
      countries: string
      close: string
    }
  }
  hero: {
    eyebrow: string
    titleLead: string
    titleAccent: string
    sub: string
    secondary: string
    lifecycleLabel: string
    lifecycle: string[]
    previewLabel: string
  }
  facts: { value: string; label: string }[]
  journey: {
    eyebrow: string
    title: string
    lead: string
    steps: { name: string; app: string; text: string }[]
  }
  areas: {
    eyebrow: string
    title: string
    lead: string
    appsTitle: string
    assistantsTitle: string
    items: Record<ProductArea, AreaCopy>
  }
  apps: {
    items: { key: string; name: string; who: string; text: string; points: string[] }[]
    /** Headings for the three groups of apps: guests, team, managers. */
    audiences: [string, string, string]
    usedIn: string
    matrixTitle: string
    matrixLead: string
    rolesTitle: string
    roles: { role: string; text: string }[]
  }
  ai: {
    /** `chips`: one short task per assistant, in the same order as `assistants`, shown as a drifting ribbon. */
    home: { eyebrow: string; title: string; lead: string; cta: string; chips: string[] }
    cycle: { eyebrow: string; title: string; lead: string; alwaysOn: string }
    team: { eyebrow: string; title: string; lead: string; readsLabel: string; proposalLabel: string }
    /** `reads`: the data an assistant works from, in a few words. */
    assistants: { name: string; does: string; example: string; when: string; reads: string }[]
    voice: {
      eyebrow: string
      title: string
      lead: string
      listening: string
      answering: string
      note: string
      /** Two sample exchanges: a guest first, then a manager. */
      talks: { who: string; ask: string; answer: string }[]
    }
    inbox: {
      eyebrow: string
      title: string
      lead: string
      filters: string[]
      approve: string
      dismiss: string
      approved: string
      dismissed: string
      reset: string
      logTitle: string
      logEmpty: string
      done: string
      impactLabel: string
      sourcesLabel: string
      items: { title: string; body: string; action: string; impact: string; sources: string }[]
    }
    how: { title: string; steps: TitledText[] }
    rules: { title: string; items: string[] }
    more: { title: string; items: TitledText[] }
  }
  solutions: {
    types: { name: string; text: string; points: string[] }[]
    rolesTitle: string
    roles: { role: string; text: string }[]
  }
  countries: {
    regions: { europe: string; americas: string; asiaPacific: string }
    find: string
    pageLead: string
    currencyLabel: string
    languagesLabel: string
    runsLabel: string
    runs: string
    keepLabel: string
    payLabel: string
    payStripe: string
    payRazorpay: string
    marketplacesLabel: string
    marketplacesNote: string
    disclaimer: string
    other: string
    otherCta: string
    back: string
    list: Record<CountryCode, { name: string; keep: string }>
  }
  compliance: {
    blocks: { title: string; text: string; points: string[] }[]
    allergensTitle: string
    allergens: string[]
    tillsTitle: string
    tillsText: string
    tillsCta: string
  }
  security: {
    items: TitledText[]
    docsTitle: string
    docsText: string
    docs: string[]
    reportTitle: string
    reportText: string
  }
  integrations: {
    groups: TitledText[]
    roadmapTitle: string
    roadmapText: string
    roadmap: TitledText[]
    askTitle: string
    askText: string
  }
  pricing: {
    principles: TitledText[]
    includedTitle: string
    included: string[]
    othersTitle: string
    others: TitledText[]
    pilotTitle: string
    pilotText: string
    pilotCta: string
  }
  pilot: {
    steps: { when: string; title: string; text: string }[]
    measuresTitle: string
    measuresText: string
    measures: string[]
    weTitle: string
    we: string[]
    youTitle: string
    you: string[]
    supportTitle: string
    support: TitledText[]
    exitTitle: string
    exitText: string
    fit: string
    imageAlt: string
  }
  faq: { groups: { title: string; items: { q: string; a: string }[] }[] }
  about: {
    storyTitle: string
    story: string[]
    factsTitle: string
    facts: { value: string; label: string }[]
    principlesTitle: string
    principles: TitledText[]
    imageAlt: string
  }
  contact: {
    points: TitledText[]
    emailLead: string
    directoryTitle: string
    directory: { key: ContactEmailKey; label: string; text: string }[]
    form: {
      fullName: string
      email: string
      restaurant: string
      restaurantHint: string
      sites: string
      sitesOptions: string[]
      country: string
      countryOther: string
      role: string
      roleOptions: string[]
      message: string
      messageHint: string
      optional: string
      consentLead: string
      consentLink: string
      consentTail: string
      submit: string
      sending: string
      required: string
      invalidEmail: string
      selectPlaceholder: string
      successTitle: string
      successBody: string
      again: string
      error: string
    }
  }
  cta: { title: string; text: string; secondary: string }
  /** Home: four product cards with realistic screens of what MaSoVa prepares. */
  showcase: {
    eyebrow: string
    title: string
    lead: string
    cards: TitledText[]
    chat: { name: string; role: string; ask: string; thinking: string; answer: string; input: string }
  }
  /** The pop-up guide in the corner of every page except contact. Answers are pre-written. */
  concierge: {
    open: string
    close: string
    title: string
    greeting: string
    intro: string
    /** Same order as CONCIERGE_TOPICS: ai, pilot, sales, question. */
    topics: string[]
    back: string
    aiAnswer: string
    aiAction: string
    pilotAnswer: string
    sitesQuestion: string
    salesAnswer: string
    salesEmail: string
    questionAnswer: string
    questionAction: string
    bookAction: string
    note: string
  }
  footer: {
    tagline: string
    columns: [string, string, string]
    legalTitle: string
    legal: [string, string, string, string]
    legalNote: string
    rights: string
  }
}
