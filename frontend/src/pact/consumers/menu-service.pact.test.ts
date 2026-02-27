/**
 * Auto-generated Pact Contract Test for MenuService
 * Generated: 2026-01-18T15:55:55.665Z
 *
 * This test ensures the frontend and backend API contracts match.
 * DO NOT EDIT MANUALLY - Regenerate using automated-testing-suite.js
 */

import { pactWith } from 'jest-pact';
import { like, string, integer, boolean } from '@pact-foundation/pact/src/dsl/matchers';

pactWith(
  {
    consumer: 'MaSoVa-Frontend',
    provider: 'MenuService',
    port: 8082,
  },
  (interaction) => {

    test('updateMenuItem', async () => {
      await interaction
        .given('menu-service is available')
        .uponReceiving('PUT request to /api/menu/items/{id}')
        .withRequest({
          method: 'PUT',
          path: '/api/menu/items/{id}',
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

    test('deleteMenuItem', async () => {
      await interaction
        .given('menu-service is available')
        .uponReceiving('DELETE request to /api/menu/items/{id}')
        .withRequest({
          method: 'DELETE',
          path: '/api/menu/items/{id}',
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

    test('getAllMenuItems', async () => {
      await interaction
        .given('menu-service is available')
        .uponReceiving('GET request to /api/menu/items')
        .withRequest({
          method: 'GET',
          path: '/api/menu/items',
          
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

    test('createMenuItem', async () => {
      await interaction
        .given('menu-service is available')
        .uponReceiving('POST request to /api/menu/items')
        .withRequest({
          method: 'POST',
          path: '/api/menu/items',
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

    test('deleteAllMenuItems', async () => {
      await interaction
        .given('menu-service is available')
        .uponReceiving('DELETE request to /api/menu/items')
        .withRequest({
          method: 'DELETE',
          path: '/api/menu/items',
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

    test('createMultipleMenuItems', async () => {
      await interaction
        .given('menu-service is available')
        .uponReceiving('POST request to /api/menu/items/bulk')
        .withRequest({
          method: 'POST',
          path: '/api/menu/items/bulk',
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

    test('copyMenuBetweenStores', async () => {
      await interaction
        .given('menu-service is available')
        .uponReceiving('POST request to /api/menu/copy-menu')
        .withRequest({
          method: 'POST',
          path: '/api/menu/copy-menu',
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

    test('toggleAvailability', async () => {
      await interaction
        .given('menu-service is available')
        .uponReceiving('PATCH request to /api/menu/items/{id}/availability')
        .withRequest({
          method: 'PATCH',
          path: '/api/menu/items/{id}/availability',
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
