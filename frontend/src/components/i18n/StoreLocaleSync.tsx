import { useEffect } from 'react';
import { useAppSelector } from '../../store/hooks';
import { selectCartLocale } from '../../store/slices/cartSlice';
import { applyStoreLocale } from '../../i18n';

/** Keeps react-i18next language in sync with Redux cart locale (store selection + hydration). */
export function StoreLocaleSync() {
  const locale = useAppSelector(selectCartLocale);

  useEffect(() => {
    applyStoreLocale(locale);
  }, [locale]);

  return null;
}