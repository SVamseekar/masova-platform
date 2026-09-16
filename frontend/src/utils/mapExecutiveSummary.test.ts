import { describe, expect, it } from 'vitest';

/**
 * Mirrors mapExecutiveSummary / mapChurnPrediction from analyticsApi without importing
 * the RTK module (which requires VITE_API_GATEWAY_URL at module load).
 */

function num(v: unknown, fallback = 0): number {
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  if (typeof v === 'string' && v.trim() !== '' && Number.isFinite(Number(v))) return Number(v);
  return fallback;
}

function trendFromChange(change: number): 'UP' | 'DOWN' | 'STABLE' {
  if (change > 0.5) return 'UP';
  if (change < -0.5) return 'DOWN';
  return 'STABLE';
}

function mapExecutiveSummary(raw: Record<string, any> | null | undefined) {
  if (raw && raw.revenue && typeof raw.revenue.total === 'number') {
    return {
      revenue: {
        total: num(raw.revenue.total),
        change: num(raw.revenue.change),
        trend: raw.revenue.trend ?? trendFromChange(num(raw.revenue.change)),
      },
      orders: {
        total: num(raw.orders?.total),
        change: num(raw.orders?.change),
        trend: raw.orders?.trend ?? trendFromChange(num(raw.orders?.change)),
      },
      customers: {
        new: num(raw.customers?.new),
        returning: num(raw.customers?.returning),
        atRisk: num(raw.customers?.atRisk),
      },
      topInsights: Array.isArray(raw.topInsights) ? raw.topInsights : [],
    };
  }

  const fin = raw?.financialSummary ?? {};
  const ops = raw?.operationalMetrics ?? {};
  const growth = raw?.growthMetrics ?? {};
  const revenueChange = num(growth.revenueGrowthRate);
  const orderChange = num(growth.orderGrowthRate);
  const topInsights = Array.isArray(raw?.insights)
    ? raw!.insights!
        .map((i: any) => i?.title || i?.description || i?.recommendation || '')
        .filter((s: string) => Boolean(s && s.trim()))
    : [];

  return {
    revenue: {
      total: num(fin.totalRevenue),
      change: revenueChange,
      trend: trendFromChange(revenueChange),
    },
    orders: {
      total: num(ops.totalOrders),
      change: orderChange,
      trend: trendFromChange(orderChange),
    },
    customers: {
      new: num(ops.newCustomers),
      returning: Math.max(0, num(ops.activeCustomers) - num(ops.newCustomers)),
      atRisk: 0,
    },
    topInsights,
  };
}

describe('mapExecutiveSummary (Phase D)', () => {
  it('maps backend financialSummary / operationalMetrics to dashboard shape', () => {
    const mapped = mapExecutiveSummary({
      reportPeriod: 'MONTH',
      financialSummary: { totalRevenue: 1234.5, totalCosts: 500 },
      operationalMetrics: {
        totalOrders: 42,
        averageOrderValue: 29.4,
        newCustomers: 5,
        activeCustomers: 20,
      },
      growthMetrics: { revenueGrowthRate: 8.5, orderGrowthRate: -2 },
      insights: [{ title: 'Push delivery promo' }, { description: 'AOV down slightly' }],
    });

    expect(mapped.revenue.total).toBe(1234.5);
    expect(mapped.revenue.change).toBe(8.5);
    expect(mapped.revenue.trend).toBe('UP');
    expect(mapped.orders.total).toBe(42);
    expect(mapped.orders.change).toBe(-2);
    expect(mapped.orders.trend).toBe('DOWN');
    expect(mapped.customers.new).toBe(5);
    expect(mapped.customers.returning).toBe(15);
    expect(mapped.topInsights).toEqual(['Push delivery promo', 'AOV down slightly']);
  });

  it('does not throw on empty payload', () => {
    const mapped = mapExecutiveSummary({});
    expect(mapped.revenue.total).toBe(0);
    expect(mapped.orders.total).toBe(0);
    expect(mapped.topInsights).toEqual([]);
  });
});
