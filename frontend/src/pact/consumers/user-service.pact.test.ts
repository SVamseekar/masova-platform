import path from 'path';
import { PactV4, MatchersV3 } from '@pact-foundation/pact';

const { like, eachLike, string } = MatchersV3;

const provider = new PactV4({
  consumer: 'masova-frontend',
  provider: 'core-service',
  dir: path.resolve(process.cwd(), 'pacts'),
  logLevel: 'error',
});

describe('Core Service (Users/Auth) Pact', () => {
  describe('POST /api/auth/login', () => {
    it('returns access token on valid credentials', async () => {
      await provider
        .addInteraction()
        .given('user exists with email test@masova.com')
        .uponReceiving('a login request with valid credentials')
        .withRequest('POST', '/api/auth/login', (builder) => {
          builder.jsonBody({
            email: string('test@masova.com'),
            password: string('Test1234!'),
          });
        })
        .willRespondWith(200, (builder) => {
          builder.jsonBody(like({
            accessToken: string('access.token.value'),
            refreshToken: string('refresh.token.value'),
            user: like({
              id: string('user-1'),
              email: string('test@masova.com'),
              type: string('CUSTOMER'),
            }),
          }));
        })
        .executeTest(async (mockServer) => {
          const response = await fetch(`${mockServer.url}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'test@masova.com', password: 'Test1234!' }),
          });
          expect(response.status).toBe(200);
          const data = await response.json();
          expect(data).toHaveProperty('accessToken');
          expect(data).toHaveProperty('user');
        });
    });
  });

  describe('GET /api/stores', () => {
    it('returns list of stores', async () => {
      await provider
        .addInteraction()
        .given('stores exist')
        .uponReceiving('a request to list stores')
        .withRequest('GET', '/api/stores')
        .willRespondWith(200, (builder) => {
          builder.jsonBody(eachLike({
            id: string('store-1'),
            name: string('MaSoVa Mumbai'),
            code: string('MUM001'),
          }));
        })
        .executeTest(async (mockServer) => {
          const response = await fetch(`${mockServer.url}/api/stores`);
          expect(response.status).toBe(200);
          const data = await response.json();
          expect(Array.isArray(data)).toBe(true);
        });
    });
  });
});
