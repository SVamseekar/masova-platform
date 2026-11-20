import type { SiteLocale } from '../locales'
import type { SiteCopy } from './types'
import en from './en'
import de from './de'
import fr from './fr'
import it from './it'
import es from './es'

/** Copy for every published language (SITE_LOCALES). The Record type makes a missing file a compile error. */
export const SITE_COPY: Record<SiteLocale, SiteCopy> = { en, de, fr, it, es }

export function getSiteCopy(locale: SiteLocale): SiteCopy {
  return SITE_COPY[locale]
}
