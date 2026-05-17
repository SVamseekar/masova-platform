import path from 'path';
import { PactV4, MatchersV3 } from '@pact-foundation/pact';

const { like, eachLike, string } = MatchersV3;

const provider = new PactV4({
  consumer: 'masova-frontend',
  provider: 'commerce-service',
  dir: path.resolve(process.cwd(), 'pacts'),
  logLevel: 'error',
});

describe('Commerce Service (Orders) Pact', () => {
  describe('GET /api/orders/:orderId', () => {
    it('returns the order successfully', async () => {
      await provider
        .addInteraction()
        .given('order exists with id order-pact-1')
        .uponReceiving('a request to get order by ID')
        .withRequest('GET', '/api/orders/order-pact-1')
        .willRespondWith(200, (builder) => {
          builder.jsonBody(like({
            id: string('order-pact-1'),
            orderNumber: string('ORD-20250101-001'),
            customerName: string('Test Customer'),
            storeId: string('store-1'),
            items: eachLike({ menuItemId: string('item-1'), name: string('Pizza'), quantity: like(1), price: like(299) }),
            total: like(299),
            status: string('RECEIVED'),
            orderType: string('DELIVERY'),
            paymentStatus: string('PENDING'),
            createdAt: string('2025-01-15T10:30:00Z'),
          }));
        })
        .executeTest(async (mockServer) => {
          const response = await fetch(`${mockServer.url}/api/orders/order-pact-1`);
          expect(response.status).toBe(200);
          const order = await response.json();
          expect(order).toHaveProperty('id');
          expect(order).toHaveProperty('status');
          expect(Array.isArray(order.items)).toBe(true);
        });
    });
  });

  describe('POST /api/orders', () => {
    it('creates a new order successfully', async () => {
      await provider
        .addInteraction()
        .given('store exists with id store-1')
        .uponReceiving('a request to create a new order')
        .withRequest('POST', '/api/orders', (builder) => {
          builder.jsonBody({
            storeId: string('store-1'),
            customerName: string('Test Customer'),
            items: eachLike({ menuItemId: string('item-1'), name: string('Pizza'), quantity: like(1), price: like(299) }),
            orderType: string('DELIVERY'),
          });
        })
        .willRespondWith(201, (builder) => {
          builder.jsonBody(like({
            id: string('order-pact-new'),
            orderNumber: string('ORD-20250101-002'),
            customerName: string('Test Customer'),
            status: string('RECEIVED'),
            total: like(299),
          }));
        })
        .executeTest(async (mockServer) => {
          const response = await fetch(`${mockServer.url}/api/orders`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              storeId: 'store-1',
              customerName: 'Test Customer',
              items: [{ menuItemId: 'item-1', name: 'Pizza', quantity: 1, price: 299 }],
              orderType: 'DELIVERY',
            }),
          });
          expect(response.status).toBe(201);
          const order = await response.json();
          expect(order).toHaveProperty('id');
          expect(order.status).toBe('RECEIVED');
        });
    });
  });

  describe('POST /api/orders/:orderId/status', () => {
    it('updates order status successfully', async () => {
      await provider
        .addInteraction()
        .given('order exists with id order-pact-1')
        .uponReceiving('a request to update order status to PREPARING')
        .withRequest('POST', '/api/orders/order-pact-1/status', (builder) => {
          builder.jsonBody({ status: string('PREPARING') });
        })
        .willRespondWith(200, (builder) => {
          builder.jsonBody(like({
            id: string('order-pact-1'),
            status: string('PREPARING'),
            updatedAt: string('2025-01-15T11:00:00Z'),
          }));
        })
        .executeTest(async (mockServer) => {
          const response = await fetch(`${mockServer.url}/api/orders/order-pact-1/status`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'PREPARING' }),
          });
          expect(response.status).toBe(200);
          const order = await response.json();
          expect(order.status).toBe('PREPARING');
        });
    });
  });
});
