/**
 * Pact Contract Test: Payment Service
 * Defines the contract between the frontend and payment-service.
 *
 * Provider states here must match the @State annotations in
 * payment-service/src/test/java/com/MaSoVa/payment/contract/PaymentPactVerificationIT.java
 */

import { PactV3, MatchersV3 } from '@pact-foundation/pact';
import path from 'path';
import axios from 'axios';

const { like, regex } = MatchersV3;

const provider = new PactV3({
  consumer: 'masova-frontend',
  provider: 'payment-service',
  dir: path.resolve(process.cwd(), 'pacts'),
});

describe('Payment Service Contract Tests', () => {
  describe('POST /api/payments/initiate', () => {
    it('initiates a payment successfully', async () => {
      provider
        .given('payment service is available')
        .uponReceiving('a request to initiate a payment')
        .withRequest({
          method: 'POST',
          path: '/api/payments/initiate',
          headers: {
            'Content-Type': 'application/json',
            Authorization: regex(/^Bearer .+$/, 'Bearer test-token'),
          },
          body: {
            orderId: like('ORDER-PACT-1'),
            amount: like(450.0),
            paymentMethod: like('CARD'),
          },
        })
        .willRespondWith({
          status: 200,
          headers: { 'Content-Type': 'application/json' },
          body: {
            transactionId: like('TXN-PACT-1'),
            status: like('PENDING'),
          },
        });

      await provider.executeTest(async (mockServer) => {
        const response = await axios.post(
          `${mockServer.url}/api/payments/initiate`,
          { orderId: 'ORDER-PACT-1', amount: 450.0, paymentMethod: 'CARD' },
          { headers: { Authorization: 'Bearer test-token', 'Content-Type': 'application/json' } }
        );
        expect(response.status).toBe(200);
        expect(response.data.transactionId).toBeDefined();
      });
    });
  });

  describe('GET /api/payments/{transactionId}', () => {
    it('returns payment status successfully', async () => {
      provider
        .given('payment service is available')
        .uponReceiving('a request to get payment status')
        .withRequest({
          method: 'GET',
          path: '/api/payments/TXN-PACT-1',
          headers: {
            Authorization: regex(/^Bearer .+$/, 'Bearer test-token'),
          },
        })
        .willRespondWith({
          status: 200,
          headers: { 'Content-Type': 'application/json' },
          body: {
            transactionId: 'TXN-PACT-1',
            status: like('SUCCESS'),
          },
        });

      await provider.executeTest(async (mockServer) => {
        const response = await axios.get(`${mockServer.url}/api/payments/TXN-PACT-1`, {
          headers: { Authorization: 'Bearer test-token' },
        });
        expect(response.status).toBe(200);
        expect(response.data.transactionId).toBe('TXN-PACT-1');
      });
    });
  });
});
