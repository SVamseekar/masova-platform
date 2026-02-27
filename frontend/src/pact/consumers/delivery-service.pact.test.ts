/**
 * Auto-generated Pact Contract Test for DeliveryService
 * Generated: 2026-01-18T15:55:55.667Z
 *
 * This test ensures the frontend and backend API contracts match.
 * DO NOT EDIT MANUALLY - Regenerate using automated-testing-suite.js
 */

import { pactWith } from 'jest-pact';
import { like, string, integer, boolean } from '@pact-foundation/pact/src/dsl/matchers';

pactWith(
  {
    consumer: 'MaSoVa-Frontend',
    provider: 'DeliveryService',
    port: 8090,
  },
  (interaction) => {

    test('updateDriverStatus', async () => {
      await interaction
        .given('delivery-service is available')
        .uponReceiving('PUT request to /api/delivery/driver/status')
        .withRequest({
          method: 'PUT',
          path: '/api/delivery/driver/status',
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

    test('markAsPickedUp', async () => {
      await interaction
        .given('delivery-service is available')
        .uponReceiving('POST request to /api/delivery/{trackingId}/pickup')
        .withRequest({
          method: 'POST',
          path: '/api/delivery/{trackingId}/pickup',
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

    test('markAsInTransit', async () => {
      await interaction
        .given('delivery-service is available')
        .uponReceiving('POST request to /api/delivery/{trackingId}/in-transit')
        .withRequest({
          method: 'POST',
          path: '/api/delivery/{trackingId}/in-transit',
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

    test('markAsArrived', async () => {
      await interaction
        .given('delivery-service is available')
        .uponReceiving('POST request to /api/delivery/{trackingId}/arrived')
        .withRequest({
          method: 'POST',
          path: '/api/delivery/{trackingId}/arrived',
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

    test('regenerateOtp', async () => {
      await interaction
        .given('delivery-service is available')
        .uponReceiving('POST request to /api/delivery/{orderId}/regenerate-otp')
        .withRequest({
          method: 'POST',
          path: '/api/delivery/{orderId}/regenerate-otp',
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
