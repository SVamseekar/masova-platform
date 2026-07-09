/**
 * Country-aware payment methods for POS and customer checkout.
 * India (IN) includes UPI; EU / other markets do not.
 */

export type PaymentMethodCode = 'CASH' | 'CARD' | 'UPI' | 'WALLET';

const INDIA_METHODS: readonly PaymentMethodCode[] = ['CASH', 'CARD', 'UPI', 'WALLET'] as const;
const EU_AND_DEFAULT_METHODS: readonly PaymentMethodCode[] = ['CASH', 'CARD', 'WALLET'] as const;

/**
 * Payment methods available for a store country (ISO 3166-1 alpha-2).
 * null/undefined is treated as legacy India (Razorpay/UPI era default in cartSlice).
 * Pass explicit 'DE' (or other non-IN) for EU demo stores.
 */
export function paymentMethodsForCountry(
  countryCode?: string | null
): readonly PaymentMethodCode[] {
  const code = (countryCode ?? 'IN').toUpperCase();
  if (code === 'IN') {
    return INDIA_METHODS;
  }
  return EU_AND_DEFAULT_METHODS;
}

/** True when UPI should be offered (India only). */
export function isUpiAvailable(countryCode?: string | null): boolean {
  return paymentMethodsForCountry(countryCode).includes('UPI');
}

/**
 * Filter a preferred method so it is valid for the store country.
 * Falls back to CARD when preferred is unavailable (e.g. UPI on DE).
 */
export function resolvePreferredPaymentMethod(
  preferred: string | undefined | null,
  countryCode?: string | null,
  fallback: PaymentMethodCode = 'CARD'
): PaymentMethodCode {
  const allowed = paymentMethodsForCountry(countryCode);
  if (preferred && (allowed as readonly string[]).includes(preferred)) {
    return preferred as PaymentMethodCode;
  }
  return allowed.includes(fallback) ? fallback : allowed[0];
}
