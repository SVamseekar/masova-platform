import { describe, it, expect } from 'vitest';
import { summarizeStoreOrders, isSaleOrder, deriveTopProducts } from './storeOrderMetrics';

const today = new Date().toISOString();

describe('storeOrderMetrics', () => {
  it('treats PAID and completed tickets as sales, not cancelled', () => {
    expect(isSaleOrder({ createdAt: today, status: 'DELIVERED', total: 10 })).toBe(true);
    expect(isSaleOrder({ createdAt: today, status: 'PREPARING', paymentStatus: 'PAID', total: 10 })).toBe(true);
    expect(isSaleOrder({ createdAt: today, status: 'CANCELLED', paymentStatus: 'PAID', total: 10 })).toBe(false);
  });

  it('sums today sales and top products from tickets', () => {
    const rows = [
      {
        createdAt: today,
        status: 'DELIVERED',
        paymentStatus: 'PAID',
        total: 20,
        orderType: 'DELIVERY',
        items: [{ name: 'Margherita Verace', quantity: 2, price: 11.5 }],
      },
      {
        createdAt: today,
        status: 'COMPLETED',
        paymentStatus: 'PAID',
        total: 16,
        orderType: 'DINE_IN',
        items: [{ name: 'Margherita Verace', quantity: 1, price: 11.5 }],
      },
    ];
    const s = summarizeStoreOrders(rows, 'Europe/Berlin', new Date());
    expect(s.todaySales).toBe(36);
    expect(s.todayOrderCount).toBe(2);
    expect(s.topProducts[0].itemName).toBe('Margherita Verace');
    expect(s.topProducts[0].quantitySold).toBe(3);
    expect(s.typeBreakdown.breakdown.length).toBe(2);
    expect(s.trendWeekly.dataPoints.length).toBe(7);
  });

  it('ranks products by revenue', () => {
    const top = deriveTopProducts([
      {
        createdAt: today,
        status: 'COMPLETED',
        items: [
          { name: 'A', quantity: 1, price: 5 },
          { name: 'B', quantity: 2, price: 10 },
        ],
      },
    ]);
    expect(top[0].itemName).toBe('B');
  });
});
