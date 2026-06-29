/**
 * Pact Contract Test: Logistics Service
 * Defines the contract between the frontend and logistics-service for delivery.
 *
 * Provider states here must match the @State annotations in
 * logistics-service/src/test/java/com/MaSoVa/logistics/contract/LogisticsPactVerificationIT.java
 */

import { PactV3, MatchersV3 } from '@pact-foundation/pact';
import path from 'path';
import axios from 'axios';

const { like, regex } = MatchersV3;

const provider = new PactV3({
  consumer: 'masova-frontend',
  provider: 'logistics-service',
  dir: path.resolve(process.cwd(), 'pacts'),
});

describe('Logistics Service Contract Tests', () => {
  describe('GET /api/delivery/zones', () => {
    it('returns delivery zones successfully', async () => {
      provider
        .given('delivery zones configured')
        .uponReceiving('a request to get delivery zones')
        .withRequest({
          method: 'GET',
          path: '/api/delivery/zones',
          query: { storeId: 'STORE-PACT-1' },
          headers: {
            Authorization: regex(/^Bearer .+$/, 'Bearer test-token'),
          },
        })
        .willRespondWith({
          status: 200,
          headers: { 'Content-Type': 'application/json' },
          body: like([
            { zoneName: 'A', minDistanceKm: 0.0, maxDistanceKm: 3.0, deliveryFeeINR: 29, estimatedDeliveryMinutes: 15 },
            { zoneName: 'B', minDistanceKm: 3.0, maxDistanceKm: 6.0, deliveryFeeINR: 49, estimatedDeliveryMinutes: 25 },
          ]),
        });

      await provider.executeTest(async (mockServer) => {
        const response = await axios.get(`${mockServer.url}/api/delivery/zones`, {
          params: { storeId: 'STORE-PACT-1' },
          headers: { Authorization: 'Bearer test-token' },
        });
        expect(response.status).toBe(200);
      });
    });
  });

  describe('GET /api/delivery/track/{orderId}', () => {
    it('returns delivery tracking successfully', async () => {
      provider
        .given('delivery tracking exists')
        .uponReceiving('a request to track a delivery')
        .withRequest({
          method: 'GET',
          path: '/api/delivery/track/ORDER-PACT-1',
        })
        .willRespondWith({
          status: 200,
          headers: { 'Content-Type': 'application/json' },
          body: {
            orderId: 'ORDER-PACT-1',
            orderStatus: like('OUT_FOR_DELIVERY'),
          },
        });

      await provider.executeTest(async (mockServer) => {
        const response = await axios.get(`${mockServer.url}/api/delivery/track/ORDER-PACT-1`);
        expect(response.status).toBe(200);
        expect(response.data.orderId).toBe('ORDER-PACT-1');
      });
    });
  });
});
