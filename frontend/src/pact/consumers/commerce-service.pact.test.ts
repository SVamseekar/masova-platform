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

const orderResponseBody = {
  id: ORDER_ID,
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
});
