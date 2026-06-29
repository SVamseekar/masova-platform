/**
 * Pact Contract Test: Core Service
 * Defines the contract between the frontend and core-service for users and stores.
 *
 * Provider states here must match the @State annotations in
 * core-service/src/test/java/com/MaSoVa/core/contract/CorePactVerificationIT.java
 */

import { PactV3, MatchersV3 } from '@pact-foundation/pact';
import path from 'path';
import axios from 'axios';

const { like, regex } = MatchersV3;

const provider = new PactV3({
  consumer: 'masova-frontend',
  provider: 'core-service',
  dir: path.resolve(process.cwd(), 'pacts'),
});

describe('Core Service Contract Tests', () => {
  describe('GET /api/users/{userId}', () => {
    it('returns the user successfully', async () => {
      provider
        .given('user exists with id USER-PACT-1')
        .uponReceiving('a request to get user by ID')
        .withRequest({
          method: 'GET',
          path: '/api/users/USER-PACT-1',
          headers: {
            Authorization: regex(/^Bearer .+$/, 'Bearer test-token'),
          },
        })
        .willRespondWith({
          status: 200,
          headers: { 'Content-Type': 'application/json' },
          body: {
            id: 'USER-PACT-1',
            name: like('John Manager'),
            email: like('john.manager@example.com'),
            type: like('MANAGER'),
          },
        });

      await provider.executeTest(async (mockServer) => {
        const response = await axios.get(`${mockServer.url}/api/users/USER-PACT-1`, {
          headers: { Authorization: 'Bearer test-token' },
        });
        expect(response.status).toBe(200);
        expect(response.data.id).toBe('USER-PACT-1');
      });
    });
  });

  describe('GET /api/stores/{storeId}', () => {
    it('returns the store successfully', async () => {
      provider
        .given('store exists with id STORE-PACT-1')
        .uponReceiving('a request to get store by ID')
        .withRequest({
          method: 'GET',
          path: '/api/stores/STORE-PACT-1',
          headers: {
            Authorization: regex(/^Bearer .+$/, 'Bearer test-token'),
          },
        })
        .willRespondWith({
          status: 200,
          headers: { 'Content-Type': 'application/json' },
          body: {
            id: 'STORE-PACT-1',
            name: like('MaSoVa Berlin'),
            address: {
              city: like('Berlin'),
            },
          },
        });

      await provider.executeTest(async (mockServer) => {
        const response = await axios.get(`${mockServer.url}/api/stores/STORE-PACT-1`, {
          headers: { Authorization: 'Bearer test-token' },
        });
        expect(response.status).toBe(200);
        expect(response.data.id).toBe('STORE-PACT-1');
      });
    });
  });
});
