export const formatINR = (amount: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

// Currencies that have no minor subdivision (1 unit = 1 unit, not 100 cents)
const NO_DECIMAL_CURRENCIES = new Set([
  'HUF', 'JPY', 'KRW', 'TWD', 'BIF', 'CLP', 'GNF', 'ISK', 'MGA', 'PYG', 'RWF', 'UGX', 'VND', 'VUV', 'XAF', 'XOF', 'XPF',
]);

/** True when currency uses 1/100 minor units (INR paise, EUR cents, etc.). */
export function usesMinorSubdivision(currency: string): boolean {
  return !NO_DECIMAL_CURRENCIES.has(currency);
}

/**
 * Convert API/menu stored price to cart major units.
 * API stores paise/cents for subdivided currencies; face value for HUF etc.
 */
export function apiPriceToCartMajor(apiPrice: number, currency: string): number {
  return usesMinorSubdivision(currency) ? apiPrice / 100 : apiPrice;
}

/** Convert cart major units to integer minor units for formatMoney(). */
export function cartMajorToMinorUnits(cartMajor: number, currency: string): number {
  return usesMinorSubdivision(currency) ? Math.round(cartMajor * 100) : Math.round(cartMajor);
}

/**
 * Number-formatting locale for money. The product UI is English, so amounts read the same in
 * every store: symbol first, comma thousands, dot decimals (€1,283.50). INR keeps Indian grouping.
 */
export function moneyDisplayLocale(currency: string): string {
  return currency === 'INR' ? 'en-IN' : 'en-GB';
}

/**
 * Format a monetary amount stored in minor units (cents, paise) for display.
 * Uses Intl.NumberFormat with the store's currency. `_locale` (the store locale) is accepted for
 * call-site compatibility but does not change the number format; see moneyDisplayLocale.
 */
export function formatMoney(
  amountMinorUnits: number,
  currency: string,
  _locale?: string
): string {
  const isNoDecimal = NO_DECIMAL_CURRENCIES.has(currency);
  const divisor = isNoDecimal ? 1 : 100;
  const amount = amountMinorUnits / divisor;

  return new Intl.NumberFormat(moneyDisplayLocale(currency), {
    style: 'currency',
    currency,
    minimumFractionDigits: isNoDecimal ? 0 : 2,
    maximumFractionDigits: isNoDecimal ? 0 : 2,
  }).format(amount);
}

/** Format cart/order amounts stored in major units (rupees, euros, HUF forint). */
export function formatMajorAmount(major: number, currency: string, locale?: string): string {
  return formatMoney(cartMajorToMinorUnits(major, currency), currency, locale);
}

/** Format API/menu basePrice (already in API storage units). */
export function formatApiPrice(apiPrice: number, currency: string, locale?: string): string {
  return formatMoney(apiPrice, currency, locale);
}