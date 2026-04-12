import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import en from './locales/en.json';
import de from './locales/de.json';
import fr from './locales/fr.json';
import it from './locales/it.json';
import nl from './locales/nl.json';
import hu from './locales/hu.json';
import lb from './locales/lb.json';

export const SUPPORTED_LOCALES = ['en', 'de', 'fr', 'it', 'nl', 'hu', 'lb'] as const;
export type SupportedLocale = typeof SUPPORTED_LOCALES[number];

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      de: { translation: de },
      fr: { translation: fr },
      it: { translation: it },
      nl: { translation: nl },
      hu: { translation: hu },
      lb: { translation: lb },
    },
    fallbackLng: 'en',
    interpolation: { escapeValue: false },
    detection: {
      order: ['htmlTag', 'navigator'],
      caches: [],
    },
  });

/**
 * Change the active language from a BCP 47 locale tag.
 * Called when store locale is loaded (e.g. "de-DE" → activates "de").
 * No-op for null/unsupported locales — stays on current language.
 */
export function applyStoreLocale(storeLocale: string | null | undefined): void {
  if (!storeLocale) return;
  const lang = storeLocale.split('-')[0];
  if (SUPPORTED_LOCALES.includes(lang as SupportedLocale)) {
    i18n.changeLanguage(lang);
  }
}

export default i18n;
