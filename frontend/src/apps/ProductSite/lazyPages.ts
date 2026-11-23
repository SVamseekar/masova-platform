import { lazyWithPreload } from '../../lib/lazyWithPreload'
import { siteRouteFromPath, type SiteLegalPath } from './locales'

/** getmasova.rest pages, loaded on demand like every other route. */
export const ProductSitePage = lazyWithPreload(() => import('./ProductSitePage'))
export const PrivacyPolicy = lazyWithPreload(() => import('../../pages/PrivacyPolicy').then((m) => ({ default: m.PrivacyPolicy })))
export const TermsOfService = lazyWithPreload(() => import('../../pages/TermsOfService').then((m) => ({ default: m.TermsOfService })))
export const CookiePolicy = lazyWithPreload(() => import('../../pages/CookiePolicy').then((m) => ({ default: m.CookiePolicy })))
export const RefundPolicy = lazyWithPreload(() => import('../../pages/RefundPolicy').then((m) => ({ default: m.RefundPolicy })))

const LEGAL_PAGES: Record<SiteLegalPath, { preload: () => Promise<unknown> }> = {
  '/privacy': PrivacyPolicy,
  '/terms': TermsOfService,
  '/cookies': CookiePolicy,
  '/refunds': RefundPolicy,
}

/**
 * Loads the code for the site page at this path before the app first renders.
 * These pages arrive prerendered (scripts/prerender-site.mjs); with the code already loaded,
 * React replaces the prerendered page with the same page instead of a loading spinner.
 * Resolves for any other path too, and never rejects: if loading fails, the route loads as usual.
 */
export function preloadSitePage(pathname: string): Promise<void> {
  const path = pathname.replace(/\/+$/, '') || '/'
  const legal = LEGAL_PAGES[path as SiteLegalPath]
  const load = legal ? legal.preload() : siteRouteFromPath(path) ? ProductSitePage.preload() : Promise.resolve()
  return load.then(
    () => undefined,
    (error: unknown) => {
      console.warn(`[preloadSitePage] could not load the code for ${path}; the route retries when it renders`, error)
    },
  )
}
