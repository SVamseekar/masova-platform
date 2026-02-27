import { describe, it, expect } from 'vitest';
import { formatINR } from './currency';

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
