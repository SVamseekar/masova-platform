/**
 * Public contact addresses for MaSoVa (all on getmasova.rest, hosted on Zoho Mail).
 * Use these constants everywhere instead of hardcoding an address.
 */
export const CONTACT_EMAILS = {
  hello: 'hello@getmasova.rest',
  sales: 'sales@getmasova.rest',
  partners: 'partners@getmasova.rest',
  press: 'press@getmasova.rest',
  support: 'support@getmasova.rest',
  crew: 'crew@getmasova.rest',
  billing: 'billing@getmasova.rest',
  privacy: 'privacy@getmasova.rest',
  legal: 'legal@getmasova.rest',
  security: 'security@getmasova.rest',
  founder: 'founder@getmasova.rest',
} as const

export type ContactEmailKey = keyof typeof CONTACT_EMAILS

export interface ContactDirectoryEntry {
  key: ContactEmailKey
  label: string
  description: string
}

/** Ordered list shown in the website contact directory. */
export const CONTACT_DIRECTORY: ContactDirectoryEntry[] = [
  { key: 'hello', label: 'General', description: 'Questions about MaSoVa and walkthrough requests' },
  { key: 'sales', label: 'Sales', description: 'Pricing, plans and multi-store rollouts' },
  { key: 'support', label: 'Customer support', description: 'Help with orders, the apps or your account' },
  { key: 'billing', label: 'Billing', description: 'Invoices, payments and refunds' },
  { key: 'privacy', label: 'Privacy & GDPR', description: 'Data access, erasure and other data protection requests' },
  { key: 'legal', label: 'Legal', description: 'Contracts, terms and legal notices' },
  { key: 'security', label: 'Security', description: 'Report a vulnerability responsibly' },
  { key: 'partners', label: 'Partnerships', description: 'Integrations, aggregators and resellers' },
  { key: 'press', label: 'Press', description: 'Media enquiries and brand assets' },
  { key: 'founder', label: 'Founder', description: 'Investors and strategic conversations' },
]
