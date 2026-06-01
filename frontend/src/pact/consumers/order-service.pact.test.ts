/**
 * Auto-generated Pact Contract Test for OrderService
 * Generated: 2026-01-18T15:55:55.666Z
 *
 * This test ensures the frontend and backend API contracts match.
 * DO NOT EDIT MANUALLY - Regenerate using automated-testing-suite.js
 */

import { pactWith } from 'jest-pact';
import { like, string, integer, boolean } from '@pact-foundation/pact/src/dsl/matchers';

pactWith(
  {
    consumer: 'MaSoVa-Frontend',
    provider: 'OrderService',
    port: 8083,
  },
  (interaction) => {

    test('markOrderDelivered', async () => {
      await interaction
        .given('order-service is available')
        .uponReceiving('PUT request to /api/v1/orders/{orderId}/mark-delivered')
        .withRequest({
          method: 'PUT',
          path: '/api/v1/orders/{orderId}/mark-delivered',
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

    test('markOrderDelivered_1', async () => {
      await interaction
        .given('order-service is available')
        .uponReceiving('PUT request to /api/orders/{orderId}/mark-delivered')
        .withRequest({
          method: 'PUT',
          path: '/api/orders/{orderId}/mark-delivered',
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

    test('setDeliveryProof', async () => {
      await interaction
        .given('order-service is available')
        .uponReceiving('PUT request to /api/v1/orders/{orderId}/delivery-proof')
        .withRequest({
          method: 'PUT',
          path: '/api/v1/orders/{orderId}/delivery-proof',
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

    test('setDeliveryProof_1', async () => {
      await interaction
        .given('order-service is available')
        .uponReceiving('PUT request to /api/orders/{orderId}/delivery-proof')
        .withRequest({
          method: 'PUT',
          path: '/api/orders/{orderId}/delivery-proof',
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

    test('setDeliveryOtp', async () => {
      await interaction
        .given('order-service is available')
        .uponReceiving('PUT request to /api/v1/orders/{orderId}/delivery-otp')
        .withRequest({
          method: 'PUT',
          path: '/api/v1/orders/{orderId}/delivery-otp',
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
