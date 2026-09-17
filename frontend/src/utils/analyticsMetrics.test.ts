import { describe, it, expect } from 'vitest';
import {
  normalizeOrderTypeBreakdown,
  productDisplayName,
  mapSalesForecastResponse,
  activePeakHours,
  analyticsAmountIsMajorUnits,
  ORDER_TYPE_LABELS,
} from './analyticsMetrics';

describe('normalizeOrderTypeBreakdown', () => {
  it('returns empty for missing/wrong shape (prevents Object.entries bug)', () => {
    expect(normalizeOrderTypeBreakdown(undefined)).toEqual([]);
    expect(normalizeOrderTypeBreakdown(null)).toEqual([]);
    expect(normalizeOrderTypeBreakdown({ totalSales: 10, totalOrders: 1 })).toEqual([]);
  });

  it('maps breakdown array with labels', () => {
    const rows = normalizeOrderTypeBreakdown({
      breakdown: [
        { orderType: 'DELIVERY', count: 12, sales: 359.51, percentage: 100, averageOrderValue: 29.96 },
        { orderType: 'TAKEAWAY', count: 6, sales: 0, percentage: 0, averageOrderValue: 0 },
      ],
      totalSales: 359.51,
      totalOrders: 18,
    });
    expect(rows).toHaveLength(2);
    expect(rows[0].label).toBe(ORDER_TYPE_LABELS.DELIVERY);
    expect(rows[0].count).toBe(12);
    expect(rows[0].sales).toBeCloseTo(359.51);
    expect(rows[1].label).toBe('Takeaway');
  });
});

describe('productDisplayName', () => {
  it('prefers itemName', () => {
    expect(productDisplayName('Margherita', 'm1')).toBe('Margherita');
  });

  it('falls back to short id when name is null', () => {
    expect(productDisplayName(null, 'm1')).toBe('m1');
    expect(productDisplayName('  ', 'seed-fb')).toBe('seed-fb');
  });

  it('truncates long mongo ids', () => {
    const id = '6a1da7cd81e32e63c475774d';
    expect(productDisplayName(undefined, id)).toMatch(/^Item 6a1da7cd/);
  });

  it('handles fully missing', () => {
    expect(productDisplayName(null, null)).toBe('Unknown item');
  });
});

describe('mapSalesForecastResponse', () => {
  it('maps modelAccuracy (0–1) to accuracy percent', () => {
    const mapped = mapSalesForecastResponse({
      forecasts: [{ date: '2026-07-11', forecastedSales: 10 }],
      modelAccuracy: 0.82,
      forecastPeriod: 'WEEKLY',
    });
    expect(mapped.accuracy).toBeCloseTo(82);
    expect(mapped.period).toBe('WEEKLY');
    expect(mapped.forecasts).toHaveLength(1);
  });

  it('keeps accuracy already in 0–100 scale', () => {
    const mapped = mapSalesForecastResponse({ accuracy: 75, forecasts: [] });
    expect(mapped.accuracy).toBe(75);
  });

  it('handles null body', () => {
    const mapped = mapSalesForecastResponse(null);
    expect(mapped.forecasts).toEqual([]);
    expect(mapped.accuracy).toBe(0);
  });
});

describe('activePeakHours', () => {
  it('filters zero-order hours', () => {
    const active = activePeakHours({
      peakHour: 0,
      hourlyData: [
        { hour: 0, orderCount: 19, sales: 100, label: '12 AM' },
        { hour: 1, orderCount: 0, sales: 0, label: '1 AM' },
      ],
    });
    expect(active).toHaveLength(1);
    expect(active[0].hour).toBe(0);
    expect(active[0].orderCount).toBe(19);
  });
});

describe('analytics money contract', () => {
  it('documents major-unit amounts for formatMajorAmount', () => {
    expect(analyticsAmountIsMajorUnits()).toBe(true);
  });
});
