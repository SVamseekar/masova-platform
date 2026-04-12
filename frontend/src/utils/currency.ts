export const formatINR = (amount: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

// Currencies that have no minor subdivision (1 unit = 1 unit, not 100 cents)
const NO_DECIMAL_CURRENCIES = new Set(['HUF', 'JPY', 'KRW', 'TWD', 'BIF', 'CLP', 'GNF', 'ISK', 'MGA', 'PYG', 'RWF', 'UGX', 'VND', 'VUV', 'XAF', 'XOF', 'XPF']);

/**
 * Format a monetary amount stored in minor units (cents, paise) for display.
 * Uses Intl.NumberFormat with the store's currency and locale.
 *
 * @param amountMinorUnits - integer minor units (e.g. 1999 → €19.99, 29900 → ₹299)
 * @param currency - ISO 4217 code, e.g. "EUR", "INR", "GBP"
 * @param locale - BCP 47 locale, e.g. "de-DE", "en-IN"
 */
export function formatMoney(
  amountMinorUnits: number,
  currency: string,
  locale: string
): string {
  const isNoDecimal = NO_DECIMAL_CURRENCIES.has(currency);
  const divisor = isNoDecimal ? 1 : 100;
  const amount = amountMinorUnits / divisor;

  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: isNoDecimal ? 0 : 2,
    maximumFractionDigits: isNoDecimal ? 0 : 2,
  }).format(amount);
}