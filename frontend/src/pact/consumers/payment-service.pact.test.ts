import path from 'path';
import { PactV4, MatchersV3 } from '@pact-foundation/pact';

const { like, string } = MatchersV3;

const provider = new PactV4({
  consumer: 'masova-frontend',
  provider: 'payment-service',
  dir: path.resolve(process.cwd(), 'pacts'),
  logLevel: 'error',
});

describe('Payment Service Pact', () => {
  describe('POST /api/payments/initiate', () => {
    it('initiates a payment and returns razorpay order details', async () => {
      await provider
        .addInteraction()
        .given('payment service is available')
        .uponReceiving('a request to initiate payment')
        .withRequest('POST', '/api/payments/initiate', (builder) => {
          builder.jsonBody({
            orderId: string('order-1'),
            amount: like(500.00),
            customerId: string('cust-1'),
            customerEmail: string('test@masova.com'),
            storeId: string('store-1'),
            orderType: string('TAKEAWAY'),
            paymentMethod: string('CARD'),
          });
        })
        .willRespondWith(200, (builder) => {
          builder.jsonBody(like({
            transactionId: string('txn-1'),
            razorpayOrderId: string('order_razorpay_1'),
            razorpayKeyId: string('rzp_test_key'),
            amount: like(500.00),
            status: string('INITIATED'),
          }));
        })
        .executeTest(async (mockServer) => {
          const response = await fetch(`${mockServer.url}/api/payments/initiate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              orderId: 'order-1', amount: 500.00, customerId: 'cust-1',
              customerEmail: 'test@masova.com', storeId: 'store-1',
              orderType: 'TAKEAWAY', paymentMethod: 'CARD',
            }),
          });
          expect(response.status).toBe(200);
          const data = await response.json();
          expect(data).toHaveProperty('transactionId');
          expect(data).toHaveProperty('razorpayOrderId');
        });
    });
  });

  describe('POST /api/payments/verify', () => {
    it('verifies a payment and returns SUCCESS status', async () => {
      await provider
        .addInteraction()
        .given('payment transaction exists with id txn-1')
        .uponReceiving('a request to verify payment')
        .withRequest('POST', '/api/payments/verify', (builder) => {
          builder.jsonBody({
            razorpayOrderId: string('order_razorpay_1'),
            razorpayPaymentId: string('pay_razorpay_1'),
            razorpaySignature: string('valid_signature'),
          });
        })
        .willRespondWith(200, (builder) => {
          builder.jsonBody(like({
            transactionId: string('txn-1'),
            status: string('SUCCESS'),
          }));
        })
        .executeTest(async (mockServer) => {
          const response = await fetch(`${mockServer.url}/api/payments/verify`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              razorpayOrderId: 'order_razorpay_1',
              razorpayPaymentId: 'pay_razorpay_1',
              razorpaySignature: 'valid_signature',
            }),
          });
          expect(response.status).toBe(200);
        });
    });
  });
});
