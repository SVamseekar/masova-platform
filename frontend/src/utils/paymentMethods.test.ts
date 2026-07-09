import { describe, it, expect } from 'vitest';
import {
  paymentMethodsForCountry,
  isUpiAvailable,
  resolvePreferredPaymentMethod,
} from './paymentMethods';

describe('paymentMethodsForCountry', () => {
  it('includes UPI for India', () => {
    expect(paymentMethodsForCountry('IN')).toEqual(['CASH', 'CARD', 'UPI', 'WALLET']);
    expect(paymentMethodsForCountry('in')).toEqual(['CASH', 'CARD', 'UPI', 'WALLET']);
  });

  it('treats null/undefined as legacy India', () => {
    expect(paymentMethodsForCountry(null)).toContain('UPI');
    expect(paymentMethodsForCountry(undefined)).toContain('UPI');
  });

  it('excludes UPI for EU / DE store', () => {
    expect(paymentMethodsForCountry('DE')).toEqual(['CASH', 'CARD', 'WALLET']);
    expect(paymentMethodsForCountry('DE')).not.toContain('UPI');
    expect(paymentMethodsForCountry('FR')).not.toContain('UPI');
  });
});

describe('isUpiAvailable', () => {
  it('is true only for India', () => {
    expect(isUpiAvailable('IN')).toBe(true);
    expect(isUpiAvailable('DE')).toBe(false);
  });
});

describe('resolvePreferredPaymentMethod', () => {
  it('keeps preferred when allowed', () => {
    expect(resolvePreferredPaymentMethod('UPI', 'IN')).toBe('UPI');
    expect(resolvePreferredPaymentMethod('CARD', 'DE')).toBe('CARD');
  });

  it('drops UPI on DE and falls back to CARD', () => {
    expect(resolvePreferredPaymentMethod('UPI', 'DE')).toBe('CARD');
  });
});
