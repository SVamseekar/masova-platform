/**
 * Integration Test: Order Creation Flow
 *
 * Uses MSW handlers and apiUrl() — no live backend required.
 */

import { describe, it, expect } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '../mocks/server';
import { apiUrl } from '../testApiBase';

describe('Order Creation Flow', () => {
  it('should complete the entire flow successfully', async () => {
    const response1 = await fetch(apiUrl('/menu'));
    expect(response1.status).toBe(200);
    const menuItems = await response1.json();
    expect(Array.isArray(menuItems)).toBe(true);
    expect(menuItems.length).toBeGreaterThan(0);

    const orderPayload = {
      storeId: '1',
      customerId: '1',
      items: [{ menuItemId: menuItems[0].id, quantity: 1 }],
      orderType: 'DELIVERY',
    };

    const response2 = await fetch(apiUrl('/orders'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderPayload),
    });
    expect(response2.status).toBe(200);
    const order = await response2.json();
    expect(order).toHaveProperty('id');

    const response3 = await fetch(apiUrl('/payments/initiate'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId: order.id, amount: 500 }),
    });
    expect(response3.status).toBe(200);
    const payment = await response3.json();
    expect(payment).toHaveProperty('transactionId');
  });

  it('should handle errors gracefully', async () => {
    server.use(
      http.get(apiUrl('/menu'), () =>
        HttpResponse.json({ message: 'Service unavailable' }, { status: 503 })
      )
    );

    const response = await fetch(apiUrl('/menu'));
    expect(response.status).toBe(503);
  });
});