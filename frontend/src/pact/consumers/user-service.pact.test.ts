/**
 * Auto-generated Pact Contract Test for UserService
 * Generated: 2026-01-18T15:55:55.663Z
 *
 * This test ensures the frontend and backend API contracts match.
 * DO NOT EDIT MANUALLY - Regenerate using automated-testing-suite.js
 */

import { pactWith } from 'jest-pact';
import { like, string, integer, boolean } from '@pact-foundation/pact/src/dsl/matchers';

pactWith(
  {
    consumer: 'MaSoVa-Frontend',
    provider: 'UserService',
    port: 8081,
  },
  (interaction) => {

    test('getUser', async () => {
      await interaction
        .given('user-service is available')
        .uponReceiving('GET request to /api/users/{userId}')
        .withRequest({
          method: 'GET',
          path: '/api/users/{userId}',
          
        })
        .willRespondWith({
          status: 200,
          headers: { 'Content-Type': 'application/json' },
          body: like({
            // Auto-generated from OpenAPI schema
            data: {}
          }),
        });

      // Verify interaction
      const baseUrl = interaction.mockService.baseUrl;
      // TODO: Add actual API call verification
    });

    test('updateUser', async () => {
      await interaction
        .given('user-service is available')
        .uponReceiving('PUT request to /api/users/{userId}')
        .withRequest({
          method: 'PUT',
          path: '/api/users/{userId}',
          headers: { 'Content-Type': 'application/json' },
        })
        .willRespondWith({
          status: 200,
          headers: { 'Content-Type': 'application/json' },
          body: like({
            // Auto-generated from OpenAPI schema
            data: {}
          }),
        });

      // Verify interaction
      const baseUrl = interaction.mockService.baseUrl;
      // TODO: Add actual API call verification
    });

    test('deactivateUser', async () => {
      await interaction
        .given('user-service is available')
        .uponReceiving('DELETE request to /api/users/{userId}')
        .withRequest({
          method: 'DELETE',
          path: '/api/users/{userId}',
          headers: { 'Content-Type': 'application/json' },
        })
        .willRespondWith({
          status: 200,
          headers: { 'Content-Type': 'application/json' },
          body: like({
            // Auto-generated from OpenAPI schema
            data: {}
          }),
        });

      // Verify interaction
      const baseUrl = interaction.mockService.baseUrl;
      // TODO: Add actual API call verification
    });

    test('getDriverStatus', async () => {
      await interaction
        .given('user-service is available')
        .uponReceiving('GET request to /api/users/{userId}/status')
        .withRequest({
          method: 'GET',
          path: '/api/users/{userId}/status',
          
        })
        .willRespondWith({
          status: 200,
          headers: { 'Content-Type': 'application/json' },
          body: like({
            // Auto-generated from OpenAPI schema
            data: {}
          }),
        });

      // Verify interaction
      const baseUrl = interaction.mockService.baseUrl;
      // TODO: Add actual API call verification
    });

    test('updateDriverStatus', async () => {
      await interaction
        .given('user-service is available')
        .uponReceiving('PUT request to /api/users/{userId}/status')
        .withRequest({
          method: 'PUT',
          path: '/api/users/{userId}/status',
          headers: { 'Content-Type': 'application/json' },
        })
        .willRespondWith({
          status: 200,
          headers: { 'Content-Type': 'application/json' },
          body: like({
            // Auto-generated from OpenAPI schema
            data: {}
          }),
        });

      // Verify interaction
      const baseUrl = interaction.mockService.baseUrl;
      // TODO: Add actual API call verification
    });

    test('getCurrentUserProfile', async () => {
      await interaction
        .given('user-service is available')
        .uponReceiving('GET request to /api/users/profile')
        .withRequest({
          method: 'GET',
          path: '/api/users/profile',
          
        })
        .willRespondWith({
          status: 200,
          headers: { 'Content-Type': 'application/json' },
          body: like({
            // Auto-generated from OpenAPI schema
            data: {}
          }),
        });

      // Verify interaction
      const baseUrl = interaction.mockService.baseUrl;
      // TODO: Add actual API call verification
    });

    test('updateCurrentUserProfile', async () => {
      await interaction
        .given('user-service is available')
        .uponReceiving('PUT request to /api/users/profile')
        .withRequest({
          method: 'PUT',
          path: '/api/users/profile',
          headers: { 'Content-Type': 'application/json' },
        })
        .willRespondWith({
          status: 200,
          headers: { 'Content-Type': 'application/json' },
          body: like({
            // Auto-generated from OpenAPI schema
            data: {}
          }),
        });

      // Verify interaction
      const baseUrl = interaction.mockService.baseUrl;
      // TODO: Add actual API call verification
    });

    test('getStore', async () => {
      await interaction
        .given('user-service is available')
        .uponReceiving('GET request to /api/stores/{storeId}')
        .withRequest({
          method: 'GET',
          path: '/api/stores/{storeId}',
          
        })
        .willRespondWith({
          status: 200,
          headers: { 'Content-Type': 'application/json' },
          body: like({
            // Auto-generated from OpenAPI schema
            data: {}
          }),
        });

      // Verify interaction
      const baseUrl = interaction.mockService.baseUrl;
      // TODO: Add actual API call verification
    });

    test('updateStore', async () => {
      await interaction
        .given('user-service is available')
        .uponReceiving('PUT request to /api/stores/{storeId}')
        .withRequest({
          method: 'PUT',
          path: '/api/stores/{storeId}',
          headers: { 'Content-Type': 'application/json' },
        })
        .willRespondWith({
          status: 200,
          headers: { 'Content-Type': 'application/json' },
          body: like({
            // Auto-generated from OpenAPI schema
            data: {}
          }),
        });

      // Verify interaction
      const baseUrl = interaction.mockService.baseUrl;
      // TODO: Add actual API call verification
    });

    test('getShift', async () => {
      await interaction
        .given('user-service is available')
        .uponReceiving('GET request to /api/shifts/{shiftId}')
        .withRequest({
          method: 'GET',
          path: '/api/shifts/{shiftId}',
          
        })
        .willRespondWith({
          status: 200,
          headers: { 'Content-Type': 'application/json' },
          body: like({
            // Auto-generated from OpenAPI schema
            data: {}
          }),
        });

      // Verify interaction
      const baseUrl = interaction.mockService.baseUrl;
      // TODO: Add actual API call verification
    });

    test('updateShift', async () => {
      await interaction
        .given('user-service is available')
        .uponReceiving('PUT request to /api/shifts/{shiftId}')
        .withRequest({
          method: 'PUT',
          path: '/api/shifts/{shiftId}',
          headers: { 'Content-Type': 'application/json' },
        })
        .willRespondWith({
          status: 200,
          headers: { 'Content-Type': 'application/json' },
          body: like({
            // Auto-generated from OpenAPI schema
            data: {}
          }),
        });

      // Verify interaction
      const baseUrl = interaction.mockService.baseUrl;
      // TODO: Add actual API call verification
    });

    test('cancelShift', async () => {
      await interaction
        .given('user-service is available')
        .uponReceiving('DELETE request to /api/shifts/{shiftId}')
        .withRequest({
          method: 'DELETE',
          path: '/api/shifts/{shiftId}',
          headers: { 'Content-Type': 'application/json' },
        })
        .willRespondWith({
          status: 200,
          headers: { 'Content-Type': 'application/json' },
          body: like({
            // Auto-generated from OpenAPI schema
            data: {}
          }),
        });

      // Verify interaction
      const baseUrl = interaction.mockService.baseUrl;
      // TODO: Add actual API call verification
    });

  }
);
