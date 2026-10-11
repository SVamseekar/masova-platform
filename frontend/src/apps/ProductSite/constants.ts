export const SITE_URL = 'https://masova.souravamseekar.com'
export const SUPPORT_EMAIL = 'masova@souravamseekar.com'

export const OPEN_CONTACT_EVENT = 'masova:open-contact'

export function openContactForm() {
  if (window.location.pathname !== '/') {
    window.location.assign('/#contact')
    return
  }
  window.dispatchEvent(new CustomEvent(OPEN_CONTACT_EVENT))
}

/** Approved monthly prices. Annual terms are confirmed in a walkthrough. */
export const PRICING_TIERS: { name: string; price: number | null }[] = [
  { name: 'Starter', price: 149 },
  { name: 'Growth', price: 349 },
  { name: 'Enterprise', price: null },
]
