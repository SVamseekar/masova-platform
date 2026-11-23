/**
 * Sends a GA4 event through the gtag set up by components/GoogleAnalytics.tsx.
 * Does nothing where gtag is not loaded (development, tests, blocked script). Consent Mode
 * applies as for page views: without analytics consent Google gets a cookieless ping only.
 * Never pass personal data (names, e-mail addresses) in params.
 */
export function trackEvent(name: string, params: Record<string, string | number> = {}): void {
  if (typeof window.gtag !== 'function') return
  window.gtag('event', name, params)
}
