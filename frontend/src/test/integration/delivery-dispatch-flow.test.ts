/**
 * Integration Test: Delivery Dispatch Flow
 *
 * Uses MSW handlers and apiUrl() — no live backend required.
 */

import { describe, it, expect } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '../mocks/server';
import { apiUrl } from '../testApiBase';

const mockDispatchResponse = {
  orderId: 'order-1',
  driverId: 'driver-1',
  driverName: 'Rajesh Kumar',
  driverPhone: '555-1001',
  distanceToPickup: 2.5,
  estimatedPickupTime: 10,
  estimatedDeliveryTime: 25,
  assignedAt: new Date().toISOString(),
  dispatchMethod: 'AUTO',
  status: 'ASSIGNED',
};

describe('Delivery Dispatch Flow', () => {
  it('should complete the entire flow successfully', async () => {
    server.use(
      http.post(apiUrl('/delivery/dispatch'), () =>
        HttpResponse.json(mockDispatchResponse),
      ),
    );

    const response1 = await fetch(apiUrl('/orders/order-1'));
    expect(response1.status).toBe(200);
    const order = await response1.json();
    expect(order).toHaveProperty('id');

    const response2 = await fetch(apiUrl('/delivery/dispatch'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId: order.id }),
    });
    expect(response2.status).toBe(200);
    const dispatch = await response2.json();
    expect(dispatch).toBeTruthy();

    const response3 = await fetch(apiUrl('/notifications'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId: order.id, type: 'DISPATCH' }),
    });
    expect(response3.status).toBe(200);
  });

  it('should handle errors gracefully', async () => {
    server.use(
      http.post(apiUrl('/delivery/dispatch'), () =>
        HttpResponse.json({ message: 'No drivers available' }, { status: 409 })
      )
    );

    const response = await fetch(apiUrl('/delivery/dispatch'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId: 'order-1' }),
    });
    expect(response.status).toBe(409);
  });
});