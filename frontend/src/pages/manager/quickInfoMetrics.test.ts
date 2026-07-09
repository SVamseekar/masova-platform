import { describe, it, expect } from 'vitest';
import {
  sumWasteCost,
  filterWasteByStore,
  countItems,
  topStockItemNames,
  countLiveOrders,
  countPendingPayments,
  countRefundsOnDate,
  countAgentStatuses,
} from './quickInfoMetrics';
import { AGENT_CATALOG, getAgentStatusCounts } from './agentCatalog';

describe('sumWasteCost', () => {
  it('sums totalCost (seed shape)', () => {
    expect(sumWasteCost([
      { totalCost: 2.2 },
      { totalCost: 1.5 },
    ])).toBeCloseTo(3.7);
  });

  it('falls back to wasteCost then cost', () => {
    expect(sumWasteCost([
      { wasteCost: 4 },
      { cost: 1 },
      {},
    ])).toBe(5);
  });

  it('returns 0 for empty/null', () => {
    expect(sumWasteCost([])).toBe(0);
    expect(sumWasteCost(null)).toBe(0);
    expect(sumWasteCost(undefined)).toBe(0);
  });

  it('ignores non-finite values', () => {
    expect(sumWasteCost([
      { totalCost: Number.NaN },
      { totalCost: 3 },
    ])).toBe(3);
  });
});

describe('filterWasteByStore', () => {
  const rows = [
    { storeId: 'DOM001', totalCost: 1 },
    { storeId: 'DOM002', totalCost: 9 },
    { totalCost: 2 },
  ];

  it('filters to matching storeId and keeps rows without storeId', () => {
    const filtered = filterWasteByStore(rows, 'DOM001');
    expect(filtered).toHaveLength(2);
    expect(sumWasteCost(filtered)).toBe(3);
  });

  it('returns all when storeId empty', () => {
    expect(filterWasteByStore(rows, '')).toHaveLength(3);
  });
});

describe('countItems / topStockItemNames', () => {
  it('counts arrays', () => {
    expect(countItems([1, 2, 3])).toBe(3);
    expect(countItems(undefined)).toBe(0);
  });

  it('picks display names in order', () => {
    expect(topStockItemNames([
      { itemName: 'Basil' },
      { name: 'Flour' },
      { itemCode: 'SEED-X' },
      { itemName: 'Extra' },
    ], 3)).toEqual(['Basil', 'Flour', 'SEED-X']);
  });
});

describe('order snapshot counts', () => {
  const orders = [
    { status: 'PREPARING', paymentStatus: 'PENDING', updatedAt: '2026-07-10T10:00:00' },
    { status: 'DELIVERED', paymentStatus: 'PAID', updatedAt: '2026-07-10T11:00:00' },
    { status: 'COMPLETED', paymentStatus: 'REFUNDED', updatedAt: '2026-07-10T12:00:00' },
    { status: 'READY', paymentStatus: 'REFUNDED', updatedAt: '2026-07-09T12:00:00' },
  ];

  it('counts live non-terminal orders', () => {
    expect(countLiveOrders(orders)).toBe(2);
  });

  it('counts pending payments', () => {
    expect(countPendingPayments(orders)).toBe(1);
  });

  it('counts refunds on a calendar day', () => {
    expect(countRefundsOnDate(orders, '2026-07-10')).toBe(1);
    expect(countRefundsOnDate(orders, '2026-07-09')).toBe(1);
  });
});

describe('countAgentStatuses / AGENT_CATALOG', () => {
  it('tallies active / event-driven / stub from catalog', () => {
    const counts = countAgentStatuses(AGENT_CATALOG);
    expect(counts.total).toBe(8);
    expect(counts.active).toBe(4);
    expect(counts.eventDriven).toBe(1);
    expect(counts.stub).toBe(3);
  });

  it('matches getAgentStatusCounts helper', () => {
    expect(getAgentStatusCounts()).toEqual(countAgentStatuses(AGENT_CATALOG));
  });
});
