/**
 * Pact Contract Test: Commerce Service
 * Defines the contract between the frontend and commerce-service for orders.
 *
 * Provider states here must match the @State annotations in
 * commerce-service/src/test/java/com/MaSoVa/commerce/contract/CommercePactVerificationIT.java
 */

import { PactV3, MatchersV3 } from '@pact-foundation/pact';
import path from 'path';
import axios from 'axios';

const { like, regex } = MatchersV3;

const provider = new PactV3({
  consumer: 'masova-frontend',
  provider: 'commerce-service',
  dir: path.resolve(process.cwd(), 'pacts'),
});

const ORDER_ID = 'ORDER-PACT-1';
const LOWERCASE_ORDER_ID = 'order-pact-1';
const MENU_ITEM_ID = 'menu-pact-1';

const orderResponseBody = {
  id: like(ORDER_ID),
  orderNumber: like('ORD-2026-0001'),
  customerName: like('Jane Doe'),
  storeId: like('STORE-PACT-1'),
  status: like('RECEIVED'),
  total: like(450.0),
  currency: like('INR'),
};

describe('Commerce Service Contract Tests', () => {
  describe('GET /api/orders/{orderId}', () => {
    it('returns the order successfully', async () => {
      provider
        .given('order exists with id ORDER-PACT-1')
        .uponReceiving('a request to get order by ID')
        .withRequest({
          method: 'GET',
          path: `/api/orders/${ORDER_ID}`,
          headers: {
            Authorization: regex(/^Bearer .+$/, 'Bearer test-token'),
          },
        })
        .willRespondWith({
          status: 200,
          headers: { 'Content-Type': 'application/json' },
          body: orderResponseBody,
        });

      await provider.executeTest(async (mockServer) => {
        const response = await axios.get(`${mockServer.url}/api/orders/${ORDER_ID}`, {
          headers: { Authorization: 'Bearer test-token' },
        });
        expect(response.status).toBe(200);
        expect(response.data.id).toBe(ORDER_ID);
      });
    });
  });

  describe('POST /api/orders', () => {
    it('creates a new order successfully', async () => {
      provider
        .given('menu items exist')
        .uponReceiving('a request to create a new order')
        .withRequest({
          method: 'POST',
          path: '/api/orders',
          headers: {
            'Content-Type': 'application/json',
            Authorization: regex(/^Bearer .+$/, 'Bearer test-token'),
          },
          body: {
            customerName: like('Jane Doe'),
            storeId: like('STORE-PACT-1'),
            orderType: like('DELIVERY'),
            items: like([
              {
                menuItemId: like('MENU-1'),
                name: like('Margherita Pizza'),
                quantity: like(1),
                price: like(350.0),
              },
            ]),
          },
        })
        .willRespondWith({
          status: 201,
          headers: { 'Content-Type': 'application/json' },
          body: orderResponseBody,
        });

      await provider.executeTest(async (mockServer) => {
        const response = await axios.post(
          `${mockServer.url}/api/orders`,
          {
            customerName: 'Jane Doe',
            storeId: 'STORE-PACT-1',
            orderType: 'DELIVERY',
            items: [
              { menuItemId: 'MENU-1', name: 'Margherita Pizza', quantity: 1, price: 350.0 },
            ],
          },
          { headers: { Authorization: 'Bearer test-token', 'Content-Type': 'application/json' } }
        );
        expect(response.status).toBe(201);
      });
    });
  });

  describe('POST /api/orders/{orderId}/status', () => {
    it('updates order status successfully', async () => {
      provider
        .given('order exists with id ORDER-PACT-1')
        .uponReceiving('a request to update order status')
        .withRequest({
          method: 'POST',
          path: `/api/orders/${ORDER_ID}/status`,
          headers: {
            'Content-Type': 'application/json',
            Authorization: regex(/^Bearer .+$/, 'Bearer test-token'),
          },
          body: {
            status: like('PREPARING'),
          },
        })
        .willRespondWith({
          status: 200,
          headers: { 'Content-Type': 'application/json' },
          body: orderResponseBody,
        });

      await provider.executeTest(async (mockServer) => {
        const response = await axios.post(
          `${mockServer.url}/api/orders/${ORDER_ID}/status`,
          { status: 'PREPARING' },
          { headers: { Authorization: 'Bearer test-token', 'Content-Type': 'application/json' } }
        );
        expect(response.status).toBe(200);
      });
    });
  });

  describe('GET /api/orders/{orderId} (lowercase id)', () => {
    it('returns the order successfully', async () => {
      provider
        .given('order exists with id order-pact-1')
        .uponReceiving('a request to get order by ID')
        .withRequest({
          method: 'GET',
          path: `/api/orders/${LOWERCASE_ORDER_ID}`,
        })
        .willRespondWith({
          status: 200,
          headers: { 'Content-Type': 'application/json' },
          body: {
            id: like(LOWERCASE_ORDER_ID),
            orderNumber: like('ORD-20250101-001'),
            customerName: like('Test Customer'),
            storeId: like('store-1'),
            status: like('RECEIVED'),
            orderType: like('DELIVERY'),
            paymentStatus: like('PENDING'),
            total: like(299),
            createdAt: like('2025-01-15T10:30:00Z'),
            items: like([
              { menuItemId: like('item-1'), name: like('Pizza'), quantity: like(1), price: like(299) },
            ]),
          },
        });

      await provider.executeTest(async (mockServer) => {
        const response = await axios.get(`${mockServer.url}/api/orders/${LOWERCASE_ORDER_ID}`);
        expect(response.status).toBe(200);
        expect(response.data.id).toBe(LOWERCASE_ORDER_ID);
      });
    });
  });

  describe('POST /api/orders/{orderId}/status (lowercase id)', () => {
    it('updates order status to PREPARING successfully', async () => {
      provider
        .given('order exists with id order-pact-1')
        .uponReceiving('a request to update order status to PREPARING')
        .withRequest({
          method: 'POST',
          path: `/api/orders/${LOWERCASE_ORDER_ID}/status`,
          headers: { 'Content-Type': 'application/json' },
          body: { status: like('PREPARING') },
        })
        .willRespondWith({
          status: 200,
          headers: { 'Content-Type': 'application/json' },
          body: {
            id: like(LOWERCASE_ORDER_ID),
            status: like('PREPARING'),
            updatedAt: like('2025-01-15T11:00:00Z'),
          },
        });

      await provider.executeTest(async (mockServer) => {
        const response = await axios.post(
          `${mockServer.url}/api/orders/${LOWERCASE_ORDER_ID}/status`,
          { status: 'PREPARING' },
          { headers: { 'Content-Type': 'application/json' } }
        );
        expect(response.status).toBe(200);
      });
    });
  });

  describe('GET /api/menu', () => {
    it('returns all menu items successfully', async () => {
      provider
        .given('menu items exist')
        .uponReceiving('a request to get all menu items')
        .withRequest({
          method: 'GET',
          path: '/api/menu',
        })
        .willRespondWith({
          status: 200,
          headers: { 'Content-Type': 'application/json' },
          body: MatchersV3.eachLike({
            id: like('menu-1'),
            name: like('Margherita Pizza'),
            basePrice: like(29900),
            isAvailable: like(true),
            allergensDeclared: like(true),
          }),
        });

      await provider.executeTest(async (mockServer) => {
        const response = await axios.get(`${mockServer.url}/api/menu`);
        expect(response.status).toBe(200);
        expect(Array.isArray(response.data)).toBe(true);
      });
    });
  });

  describe('GET /api/menu/{id}', () => {
    it('returns a menu item by id successfully', async () => {
      provider
        .given('menu item exists with id menu-pact-1')
        .uponReceiving('a request to get menu item by id')
        .withRequest({
          method: 'GET',
          path: `/api/menu/${MENU_ITEM_ID}`,
        })
        .willRespondWith({
          status: 200,
          headers: { 'Content-Type': 'application/json' },
          body: {
            id: like(MENU_ITEM_ID),
            name: like('Margherita Pizza'),
            basePrice: like(29900),
            isAvailable: like(true),
          },
        });

      await provider.executeTest(async (mockServer) => {
        const response = await axios.get(`${mockServer.url}/api/menu/${MENU_ITEM_ID}`);
        expect(response.status).toBe(200);
        expect(response.data.id).toBe(MENU_ITEM_ID);
      });
    });
  });

  describe('PATCH /api/menu/items/{id}/allergens', () => {
    it('declares allergens successfully', async () => {
      provider
        .given('menu item exists with id menu-pact-1')
        .uponReceiving('a request to declare allergens')
        .withRequest({
          method: 'PATCH',
          path: `/api/menu/items/${MENU_ITEM_ID}/allergens`,
          headers: { 'Content-Type': 'application/json' },
          body: {
            allergenFree: like(false),
            allergens: like(['MILK', 'CEREALS_GLUTEN']),
          },
        })
        .willRespondWith({
          status: 200,
          headers: { 'Content-Type': 'application/json' },
          body: {
            id: like(MENU_ITEM_ID),
            allergensDeclared: like(true),
          },
        });

      await provider.executeTest(async (mockServer) => {
        const response = await axios.patch(
          `${mockServer.url}/api/menu/items/${MENU_ITEM_ID}/allergens`,
          { allergenFree: false, allergens: ['MILK', 'CEREALS_GLUTEN'] },
          { headers: { 'Content-Type': 'application/json' } }
        );
        expect(response.status).toBe(200);
      });
    });
  });
});
