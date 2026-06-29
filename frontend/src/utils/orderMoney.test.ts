import { describe, it, expect } from 'vitest';
import {
  resolveOrderCurrency,
  resolveOrderLocale,
  formatOrderAmount,
} from './orderMoney';

describe('orderMoney', () => {
  it('resolveOrderCurrency prefers order.currency', () => {
    expect(resolveOrderCurrency({ currency: 'EUR' }, 'INR')).toBe('EUR');
    expect(resolveOrderCurrency({}, 'INR')).toBe('INR');
  });

  it('resolveOrderLocale uses vatCountryCode over currency fallback', () => {
    expect(resolveOrderLocale({ vatCountryCode: 'DE', currency: 'EUR' }, 'en-IN')).toBe('de-DE');
    expect(resolveOrderLocale({ currency: 'GBP' }, 'en-IN')).toBe('en-GB');
    expect(resolveOrderLocale({}, 'en-IN')).toBe('en-IN');
  });

  it('formatOrderAmount formats DE order in EUR/de-DE', () => {
    const result = formatOrderAmount(
      42.5,
      { currency: 'EUR', vatCountryCode: 'DE' },
      'INR',
      'en-IN'
    );
    expect(result).toMatch(/42[,.]50/);
    expect(result).toMatch(/€|EUR/);
  });

  it('formatOrderAmount falls back to cart context for India orders', () => {
    const result = formatOrderAmount(299, {}, 'INR', 'en-IN');
    expect(result).toMatch(/299/);
  });
});