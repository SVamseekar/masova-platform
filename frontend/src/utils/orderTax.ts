/** India legacy GST estimate — 5% for pre-checkout display only. */
export const INDIA_GST_RATE = 0.05;

export function estimateIndiaGst(subtotal: number): number {
  return subtotal * INDIA_GST_RATE;
}

/** EU stores: VAT is calculated server-side — no client-side rate lookup. */
export function getPreCheckoutTaxLabel(countryCode: string | null | undefined): string {
  return countryCode ? 'VAT (at checkout)' : 'Tax (5% GST)';
}

export function estimatePreCheckoutTax(
  subtotal: number,
  countryCode: string | null | undefined
): number | null {
  if (countryCode) {
    return null;
  }
  return estimateIndiaGst(subtotal);
}

export interface PreCheckoutTotals {
  tax: number | null;
  taxLabel: string;
  total: number;
  isEuStore: boolean;
}

export function computePreCheckoutTotals(
  subtotal: number,
  deliveryFee: number,
  countryCode: string | null | undefined
): PreCheckoutTotals {
  const isEuStore = Boolean(countryCode);
  const tax = estimatePreCheckoutTax(subtotal, countryCode);
  const taxLabel = getPreCheckoutTaxLabel(countryCode);
  const total = subtotal + deliveryFee + (tax ?? 0);
  return { tax, taxLabel, total, isEuStore };
}

export function formatTaxDisplay(
  tax: number | null,
  fmt: (value: number) => string
): string {
  return tax === null ? '—' : fmt(tax);
}