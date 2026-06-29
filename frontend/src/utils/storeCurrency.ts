/** Build setStoreCurrency payload from a store API record (India defaults when fields absent). */
export function storeCurrencyPayload(store?: {
  currency?: string | null;
  locale?: string | null;
  countryCode?: string | null;
} | null) {
  return {
    currency: store?.currency || 'INR',
    locale: store?.locale || 'en-IN',
    countryCode: store?.countryCode ?? null,
  };
}