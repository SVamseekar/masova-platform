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

  describe('POST /api/auth/login', () => {
    it('logs in successfully with valid credentials', async () => {
      provider
        .given('a user exists with email pact-login@masova.com and password Pact-Password123')
        .uponReceiving('a login request with valid credentials')
        .withRequest({
          method: 'POST',
          path: '/api/auth/login',
          headers: { 'Content-Type': 'application/json' },
          body: {
            email: 'pact-login@masova.com',
            password: 'Pact-Password123',
          },
        })
        .willRespondWith({
          status: 200,
          headers: { 'Content-Type': 'application/json' },
          body: {
            accessToken: like('eyJhbGciOiJIUzUxMiJ9.example.token'),
            refreshToken: like('eyJhbGciOiJIUzUxMiJ9.example.refresh'),
            user: {
              id: like('USER-PACT-LOGIN-1'),
              email: like('pact-login@masova.com'),
              type: like('CUSTOMER'),
            },
          },
        });

      await provider.executeTest(async (mockServer) => {
        const response = await axios.post(`${mockServer.url}/api/auth/login`, {
          email: 'pact-login@masova.com',
          password: 'Pact-Password123',
        });
        expect(response.status).toBe(200);
        expect(response.data.accessToken).toBeTruthy();
        expect(response.data.user.email).toBe('pact-login@masova.com');
      });
    });

    it('rejects an invalid password', async () => {
      // core-service's authenticate() throws a plain RuntimeException("Invalid credentials"),
      // which the shared GlobalExceptionHandler's generic Exception handler maps to 500 —
      // not 401. Documenting the real, current behavior; a dedicated AuthenticationException
      // mapped to 401 would be more correct but is a separate fix from this contract test.
      provider
        .given('a user exists with email pact-login@masova.com and password Pact-Password123')
        .uponReceiving('a login request with an invalid password')
        .withRequest({
          method: 'POST',
          path: '/api/auth/login',
          headers: { 'Content-Type': 'application/json' },
          body: {
            email: 'pact-login@masova.com',
            password: 'wrong-password',
          },
        })
        .willRespondWith({
          status: 500,
        });

      await provider.executeTest(async (mockServer) => {
        await expect(
          axios.post(`${mockServer.url}/api/auth/login`, {
            email: 'pact-login@masova.com',
            password: 'wrong-password',
          })
        ).rejects.toMatchObject({
          response: { status: 500 },
        });
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
