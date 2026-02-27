/**
 * Pact Contract Test: Order Service
 * Defines the contract between frontend and order-service
 *
 * This test ensures that order-service API matches what the frontend expects.
 * If backend changes break this contract, tests will fail.
 */

import { Pact, Matchers } from '@pact-foundation/pact';
import { pactConfig, providers } from '../pact-config';
import path from 'path';

const { like, eachLike, term } = Matchers;

describe('Order Service Contract Tests', () => {
  // Create Pact provider
  const provider = new Pact({
    ...pactConfig,
    provider: providers.orderService.provider,
    port: providers.orderService.port,
  });

  beforeAll(() => provider.setup());
  afterEach(() => provider.verify());
  afterAll(() => provider.finalize());

  describe('GET /api/orders/{orderId}', () => {
    const ORDER_ID = '507f1f77bcf86cd799439011';

    beforeEach(() => {
      return provider.addInteraction({
        state: 'order with ID 507f1f77bcf86cd799439011 exists',
        uponReceiving: 'a request to get order by ID',
        withRequest: {
          method: 'GET',
          path: `/api/orders/${ORDER_ID}`,
          headers: {
            Accept: 'application/json',
            Authorization: term({
              matcher: '^Bearer .+$',
              generate: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
            }),
          },
        },
        willRespondWith: {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
          },
          body: like({
            id: ORDER_ID,
            orderNumber: 'ORD-2024-0001',
            customerName: 'John Doe',
            customerPhone: '+1234567890',
            storeId: 'store-123',
            items: eachLike({
              menuItemId: 'item-123',
              name: 'Margherita Pizza',
              quantity: 2,
              price: 12.99,
            }),
            subtotal: 25.98,
            deliveryFee: 5.00,
            tax: 3.10,
            total: 34.08,
            status: term({
              matcher: '^(RECEIVED|PREPARING|READY|DISPATCHED|DELIVERED|CANCELLED)$',
              generate: 'PREPARING',
            }),
            orderType: term({
              matcher: '^(DINE_IN|TAKEAWAY|DELIVERY)$',
              generate: 'DELIVERY',
            }),
            paymentStatus: term({
              matcher: '^(PENDING|PAID|FAILED|REFUNDED)$',
              generate: 'PAID',
            }),
            createdAt: term({
              matcher: '^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}',
              generate: '2024-01-15T10:30:00',
            }),
          }),
        },
      });
    });

    it('returns the order successfully', async () => {
      // Make API call to the Pact mock server
      const response = await fetch(
        `http://localhost:${providers.orderService.port}/api/orders/${ORDER_ID}`,
        {
          headers: {
            Accept: 'application/json',
            Authorization: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
          },
        }
      );

      expect(response.status).toBe(200);

      const order = await response.json();

      // Verify contract expectations
      expect(order).toHaveProperty('id');
      expect(order).toHaveProperty('customerName');
      expect(order).toHaveProperty('total');
      expect(order).toHaveProperty('status');
      expect(order).toHaveProperty('items');
      expect(Array.isArray(order.items)).toBe(true);
    });
  });

  describe('POST /api/orders', () => {
    beforeEach(() => {
      return provider.addInteraction({
        state: 'store with ID store-123 exists',
        uponReceiving: 'a request to create a new order',
        withRequest: {
          method: 'POST',
          path: '/api/orders',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            Authorization: term({
              matcher: '^Bearer .+$',
              generate: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
            }),
          },
          body: {
            storeId: 'store-123',
            customerName: 'Jane Smith',
            customerPhone: '+1987654321',
            items: eachLike({
              menuItemId: like('item-456'),
              name: like('Pepperoni Pizza'),
              quantity: like(1),
              price: like(14.99),
            }),
            orderType: term({
              matcher: '^(DINE_IN|TAKEAWAY|DELIVERY)$',
              generate: 'DELIVERY',
            }),
            deliveryAddress: like({
              street: '123 Main St',
              city: 'San Francisco',
              state: 'CA',
              pincode: '94102',
            }),
          },
        },
        willRespondWith: {
          status: 201,
          headers: {
            'Content-Type': 'application/json',
          },
          body: like({
            id: term({
              matcher: '^[a-f0-9]{24}$',
              generate: '507f1f77bcf86cd799439012',
            }),
            orderNumber: term({
              matcher: '^ORD-\\d{4}-\\d{4}$',
              generate: 'ORD-2024-0002',
            }),
            customerName: 'Jane Smith',
            status: 'RECEIVED',
            total: like(20.99),
          }),
        },
      });
    });

    it('creates a new order successfully', async () => {
      const newOrder = {
        storeId: 'store-123',
        customerName: 'Jane Smith',
        customerPhone: '+1987654321',
        items: [
          {
            menuItemId: 'item-456',
            name: 'Pepperoni Pizza',
            quantity: 1,
            price: 14.99,
          },
        ],
        orderType: 'DELIVERY',
        deliveryAddress: {
          street: '123 Main St',
          city: 'San Francisco',
          state: 'CA',
          pincode: '94102',
        },
      };

      const response = await fetch(
        `http://localhost:${providers.orderService.port}/api/orders`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            Authorization: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
          },
          body: JSON.stringify(newOrder),
        }
      );

      expect(response.status).toBe(201);

      const createdOrder = await response.json();

      // Verify contract expectations
      expect(createdOrder).toHaveProperty('id');
      expect(createdOrder).toHaveProperty('orderNumber');
      expect(createdOrder.customerName).toBe('Jane Smith');
      expect(createdOrder.status).toBe('RECEIVED');
    });
  });

  describe('PATCH /api/orders/{orderId}/status', () => {
    const ORDER_ID = '507f1f77bcf86cd799439011';

    beforeEach(() => {
      return provider.addInteraction({
        state: 'order with ID 507f1f77bcf86cd799439011 exists and is in PREPARING status',
        uponReceiving: 'a request to update order status',
        withRequest: {
          method: 'PATCH',
          path: `/api/orders/${ORDER_ID}/status`,
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            Authorization: term({
              matcher: '^Bearer .+$',
              generate: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
            }),
          },
          body: {
            status: term({
              matcher: '^(RECEIVED|PREPARING|READY|DISPATCHED|DELIVERED|CANCELLED)$',
              generate: 'READY',
            }),
          },
        },
        willRespondWith: {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
          },
          body: like({
            id: ORDER_ID,
            status: 'READY',
            updatedAt: term({
              matcher: '^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}',
              generate: '2024-01-15T11:00:00',
            }),
          }),
        },
      });
    });

    it('updates order status successfully', async () => {
      const response = await fetch(
        `http://localhost:${providers.orderService.port}/api/orders/${ORDER_ID}/status`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            Authorization: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
          },
          body: JSON.stringify({ status: 'READY' }),
        }
      );

      expect(response.status).toBe(200);

      const updatedOrder = await response.json();

      expect(updatedOrder.id).toBe(ORDER_ID);
      expect(updatedOrder.status).toBe('READY');
      expect(updatedOrder).toHaveProperty('updatedAt');
    });
  });
});
