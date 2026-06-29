import { formatMajorAmount } from './currency';

/** BCP-47 locale from ISO country code (mirrors CountryProfileService). */
const COUNTRY_LOCALE: Record<string, string> = {
  DE: 'de-DE',
  FR: 'fr-FR',
  IT: 'it-IT',
  NL: 'nl-NL',
  BE: 'nl-BE',
  HU: 'hu-HU',
  LU: 'lb-LU',
  IE: 'en-IE',
  CH: 'de-CH',
  GB: 'en-GB',
  US: 'en-US',
  CA: 'en-CA',
};

/** Default locale when only currency is known (India legacy = null currency → INR). */
const CURRENCY_LOCALE: Record<string, string> = {
  INR: 'en-IN',
  EUR: 'en-IE',
  GBP: 'en-GB',
  HUF: 'hu-HU',
  CHF: 'de-CH',
  USD: 'en-US',
  CAD: 'en-CA',
};

export interface OrderMoneyContext {
  currency?: string | null;
  vatCountryCode?: string | null;
}

export function resolveOrderCurrency(
  order: OrderMoneyContext,
  cartCurrency: string
): string {
  return order.currency ?? cartCurrency;
}

export function resolveOrderLocale(
  order: OrderMoneyContext,
  cartLocale: string
): string {
  if (order.vatCountryCode && COUNTRY_LOCALE[order.vatCountryCode]) {
    return COUNTRY_LOCALE[order.vatCountryCode];
  }
  const currency = order.currency ?? 'INR';
  return CURRENCY_LOCALE[currency] ?? cartLocale;
}

/** Format an order line amount using the order's currency/locale when present. */
export function formatOrderAmount(
  amount: number,
  order: OrderMoneyContext,
  cartCurrency: string,
  cartLocale: string
): string {
  const currency = resolveOrderCurrency(order, cartCurrency);
  const locale = resolveOrderLocale(order, cartLocale);
  return formatMajorAmount(amount, currency, locale);
}