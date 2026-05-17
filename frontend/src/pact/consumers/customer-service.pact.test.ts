import path from 'path';
import { PactV4, MatchersV3 } from '@pact-foundation/pact';

const { like, eachLike, string } = MatchersV3;

const provider = new PactV4({
  consumer: 'masova-frontend',
  provider: 'core-service',
  dir: path.resolve(process.cwd(), 'pacts'),
  logLevel: 'error',
});

describe('Core Service (Customers) Pact', () => {
  describe('GET /api/customers/:id', () => {
    it('returns customer by id', async () => {
      await provider
        .addInteraction()
        .given('customer exists with id cust-pact-1')
        .uponReceiving('a request to get customer by id')
        .withRequest('GET', '/api/customers/cust-pact-1')
        .willRespondWith(200, (builder) => {
          builder.jsonBody(like({
            id: string('cust-pact-1'),
            email: string('customer@masova.com'),
            loyaltyInfo: like({ totalPoints: like(100), tier: string('SILVER') }),
          }));
        })
        .executeTest(async (mockServer) => {
          const response = await fetch(`${mockServer.url}/api/customers/cust-pact-1`);
          expect(response.status).toBe(200);
          const data = await response.json();
          expect(data.id).toBe('cust-pact-1');
        });
    });
  });

  describe('GET /api/customers', () => {
    it('returns list of customers', async () => {
      await provider
        .addInteraction()
        .given('customers exist')
        .uponReceiving('a request to list customers')
        .withRequest('GET', '/api/customers')
        .willRespondWith(200, (builder) => {
          builder.jsonBody(eachLike({
            id: string('cust-1'),
            email: string('customer@masova.com'),
            active: like(true),
          }));
        })
        .executeTest(async (mockServer) => {
          const response = await fetch(`${mockServer.url}/api/customers`);
          expect(response.status).toBe(200);
          const data = await response.json();
          expect(Array.isArray(data)).toBe(true);
        });
    });
  });
});
