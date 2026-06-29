import { describe, it, expect } from 'vitest';
import {
  estimateIndiaGst,
  getPreCheckoutTaxLabel,
  estimatePreCheckoutTax,
  computePreCheckoutTotals,
  formatTaxDisplay,
} from './orderTax';

describe('orderTax', () => {
  it('estimateIndiaGst applies 5%', () => {
    expect(estimateIndiaGst(200)).toBeCloseTo(10);
  });

  it('returns GST label for India stores', () => {
    expect(getPreCheckoutTaxLabel(null)).toBe('Tax (5% GST)');
    expect(getPreCheckoutTaxLabel(undefined)).toBe('Tax (5% GST)');
  });

  it('returns VAT label for EU stores', () => {
    expect(getPreCheckoutTaxLabel('DE')).toBe('VAT (at checkout)');
  });

  it('does not estimate tax for EU stores', () => {
    expect(estimatePreCheckoutTax(100, 'DE')).toBeNull();
    expect(estimatePreCheckoutTax(100, null)).toBeCloseTo(5);
  });

  it('computePreCheckoutTotals excludes VAT for EU stores', () => {
    const eu = computePreCheckoutTotals(100, 10, 'FR');
    expect(eu.tax).toBeNull();
    expect(eu.total).toBeCloseTo(110);
    expect(eu.isEuStore).toBe(true);
  });

  it('computePreCheckoutTotals includes GST for India stores', () => {
    const india = computePreCheckoutTotals(100, 10, null);
    expect(india.tax).toBeCloseTo(5);
    expect(india.total).toBeCloseTo(115);
    expect(india.isEuStore).toBe(false);
  });

  it('formatTaxDisplay shows dash when tax is null', () => {
    expect(formatTaxDisplay(null, (v) => `€${v}`)).toBe('—');
    expect(formatTaxDisplay(5, (v) => `€${v}`)).toBe('€5');
  });
});