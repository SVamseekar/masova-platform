/**
 * Auto-generated Pact Contract Test for PaymentService
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
    provider: 'PaymentService',
    port: 8086,
  },
  (interaction) => {

    test('markAsReconciled', async () => {
      await interaction
        .given('payment-service is available')
        .uponReceiving('POST request to /api/payments/{transactionId}/reconcile')
        .withRequest({
          method: 'POST',
          path: '/api/payments/{transactionId}/reconcile',
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

    test('markAsReconciled_1', async () => {
      await interaction
        .given('payment-service is available')
        .uponReceiving('POST request to /api/v1/payments/{transactionId}/reconcile')
        .withRequest({
          method: 'POST',
          path: '/api/v1/payments/{transactionId}/reconcile',
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

    test('verifyPayment', async () => {
      await interaction
        .given('payment-service is available')
        .uponReceiving('POST request to /api/payments/verify')
        .withRequest({
          method: 'POST',
          path: '/api/payments/verify',
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

    test('verifyPayment_1', async () => {
      await interaction
        .given('payment-service is available')
        .uponReceiving('POST request to /api/v1/payments/verify')
        .withRequest({
          method: 'POST',
          path: '/api/v1/payments/verify',
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

    test('initiatePayment', async () => {
      await interaction
        .given('payment-service is available')
        .uponReceiving('POST request to /api/payments/initiate')
        .withRequest({
          method: 'POST',
          path: '/api/payments/initiate',
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
