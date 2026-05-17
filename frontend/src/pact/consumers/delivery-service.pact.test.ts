import path from 'path';
import { PactV4, MatchersV3 } from '@pact-foundation/pact';

const { like, eachLike, string } = MatchersV3;

const provider = new PactV4({
  consumer: 'masova-frontend',
  provider: 'logistics-service',
  dir: path.resolve(process.cwd(), 'pacts'),
  logLevel: 'error',
});

describe('Logistics Service (Delivery) Pact', () => {
  describe('GET /api/delivery/track/:orderId', () => {
    it('returns tracking information for an order', async () => {
      await provider
        .addInteraction()
        .given('delivery tracking exists for order order-track-1')
        .uponReceiving('a request to track delivery')
        .withRequest('GET', '/api/delivery/track/order-track-1')
        .willRespondWith(200, (builder) => {
          builder.jsonBody(like({
            orderId: string('order-track-1'),
            status: string('IN_TRANSIT'),
            driverName: string('Rajesh Driver'),
            estimatedMinutes: like(15),
          }));
        })
        .executeTest(async (mockServer) => {
          const response = await fetch(`${mockServer.url}/api/delivery/track/order-track-1`);
          expect(response.status).toBe(200);
          const data = await response.json();
          expect(data).toHaveProperty('status');
          expect(data).toHaveProperty('orderId');
        });
    });
  });

  describe('GET /api/delivery/drivers/available', () => {
    it('returns list of available drivers', async () => {
      await provider
        .addInteraction()
        .given('drivers are available')
        .uponReceiving('a request to get available drivers')
        .withRequest('GET', '/api/delivery/drivers/available')
        .willRespondWith(200, (builder) => {
          builder.jsonBody(eachLike({
            id: string('driver-1'),
            name: string('Rajesh Kumar'),
            status: string('AVAILABLE'),
            rating: like(4.8),
          }));
        })
        .executeTest(async (mockServer) => {
          const response = await fetch(`${mockServer.url}/api/delivery/drivers/available`);
          expect(response.status).toBe(200);
          const data = await response.json();
          expect(Array.isArray(data)).toBe(true);
        });
    });
  });
});
