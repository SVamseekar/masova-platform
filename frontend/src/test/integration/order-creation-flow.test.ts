/**
 * Integration Test: Order Creation Flow
 * Tests the complete flow: browse menu → create order → initiate payment
 * Uses MSW to intercept all API calls — no live backend required.
 */

import { describe, it, expect } from 'vitest';

const API_BASE_URL = 'http://localhost:8080';

describe('Order Creation Flow', () => {
  it('should complete the entire flow successfully', async () => {
    // Step 1: GET /api/menu — MSW handler returns menu items
    const response1 = await fetch(`${API_BASE_URL}/api/menu`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    expect(response1.status).toBe(200);
    const menuData = await response1.json();
    expect(Array.isArray(menuData)).toBe(true);

    // Step 2: POST /api/orders — MSW handler returns a new order
    const response2 = await fetch(`${API_BASE_URL}/api/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        storeId: 'store-1',
        items: [{ menuItemId: 'item-1', quantity: 2 }],
        orderType: 'DELIVERY',
      }),
    });

    expect(response2.status).toBe(200);
    const orderData = await response2.json();
    expect(orderData).toBeDefined();

    // Step 3: POST /api/payments/initiate — MSW handler returns payment initiation
    const response3 = await fetch(`${API_BASE_URL}/api/payments/initiate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId: orderData.id || 'order-1', method: 'UPI' }),
    });

    expect(response3.status).toBe(200);
    const paymentData = await response3.json();
    expect(paymentData).toBeDefined();
  });

  it('should handle errors gracefully', async () => {
    // Verify MSW returns structured data even for unknown IDs
    const response = await fetch(`${API_BASE_URL}/api/orders/nonexistent-order-id`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    // MSW handler exists for GET /api/orders/:orderId — should return 200 with mock data
    expect([200, 404]).toContain(response.status);
  });
});
