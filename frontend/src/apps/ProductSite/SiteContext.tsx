import { createContext, useContext } from 'react'
import type { SiteCopy } from './content/types'
import type { SiteLocale } from './locales'

interface SiteContextValue {
  locale: SiteLocale
  copy: SiteCopy
}

export const SiteContext = createContext<SiteContextValue | null>(null)

export function useSite(): SiteContextValue {
  const value = useContext(SiteContext)
  if (!value) throw new Error('useSite must be used inside <SiteContext.Provider>')
  return value
}
