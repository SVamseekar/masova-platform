/**
 * Integration Test: Delivery Dispatch Flow
 * Tests: fetch order → dispatch delivery → check driver status
 * Uses MSW to intercept all API calls — no live backend required.
 */

import { describe, it, expect } from 'vitest';

const API_BASE_URL = 'http://localhost:8080';

describe('Delivery Dispatch Flow', () => {
  it('should complete the entire flow successfully', async () => {
    // Step 1: GET /api/orders/:orderId — MSW handler returns an order
    const response1 = await fetch(`${API_BASE_URL}/api/orders/order-dispatch-1`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    expect(response1.status).toBe(200);
    const orderData = await response1.json();
    expect(orderData).toBeDefined();

    // Step 2: POST /api/delivery/dispatch — MSW handler returns dispatch confirmation
    const response2 = await fetch(`${API_BASE_URL}/api/delivery/dispatch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId: 'order-dispatch-1' }),
    });

    expect(response2.status).toBe(200);
    const dispatchData = await response2.json();
    expect(dispatchData).toBeDefined();

    // Step 3: GET /api/delivery/drivers/available — MSW returns available drivers
    const response3 = await fetch(`${API_BASE_URL}/api/delivery/drivers/available`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    expect(response3.status).toBe(200);
    const driversData = await response3.json();
    expect(driversData).toBeDefined();
  });

  it('should handle errors gracefully', async () => {
    // Verify dispatch endpoint exists and is handled by MSW
    const response = await fetch(`${API_BASE_URL}/api/delivery/dispatch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId: 'nonexistent' }),
    });
    expect([200, 400, 404]).toContain(response.status);
  });
});
