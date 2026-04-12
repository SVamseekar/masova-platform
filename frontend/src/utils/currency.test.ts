import { describe, it, expect } from 'vitest';
import { formatINR, formatMoney } from './currency';

describe('formatINR', () => {
  it('formats a positive integer correctly', () => {
    const result = formatINR(1000);
    // Indian number format uses commas differently, e.g. 1,000
    expect(result).toContain('1,000');
  });

  it('formats zero', () => {
    const result = formatINR(0);
    expect(result).toContain('0');
  });

  it('formats a large number with Indian grouping', () => {
    const result = formatINR(100000);
    // In en-IN, 100000 is formatted as 1,00,000
    expect(result).toContain('1,00,000');
  });

  it('rounds decimal values since maximumFractionDigits is 0', () => {
    const result = formatINR(12.99);
    // Should round to 13, no decimals
    expect(result).toContain('13');
    expect(result).not.toContain('.');
  });

  it('includes INR currency symbol', () => {
    const result = formatINR(500);
    // The en-IN INR format includes the rupee symbol
    expect(result).toMatch(/[₹]/);
  });

  it('formats negative numbers', () => {
    const result = formatINR(-250);
    expect(result).toContain('250');
    expect(result).toMatch(/-/);
  });
});

describe('formatMoney', () => {
  it('formats EUR cents — 1999 minor units as €19.99', () => {
    const result = formatMoney(1999, 'EUR', 'en-IE');
    expect(result).toMatch(/19[,.]99/);
    expect(result).toMatch(/€|EUR/);
  });

  it('formats GBP pence — 1500 minor units as £15.00', () => {
    const result = formatMoney(1500, 'GBP', 'en-GB');
    expect(result).toMatch(/15[,.]00/);
    expect(result).toMatch(/£|GBP/);
  });

  it('formats HUF — no decimal subdivision, 2000 minor units = 2000 HUF', () => {
    const result = formatMoney(2000, 'HUF', 'hu-HU');
    expect(result).toMatch(/2[\s,.]?000|2000/);
  });

  it('formats INR paise — 29900 minor units as ₹299', () => {
    const result = formatMoney(29900, 'INR', 'en-IN');
    expect(result).toMatch(/299/);
    expect(result).toMatch(/₹|INR/);
  });

  it('formats USD cents — 999 minor units as $9.99', () => {
    const result = formatMoney(999, 'USD', 'en-US');
    expect(result).toMatch(/9[,.]99/);
    expect(result).toMatch(/\$|USD/);
  });

  it('formats 0 minor units as zero amount', () => {
    const result = formatMoney(0, 'EUR', 'en-IE');
    expect(result).toMatch(/0/);
  });
});
