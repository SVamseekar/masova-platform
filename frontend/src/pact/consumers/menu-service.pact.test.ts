import path from 'path';
import { PactV4, MatchersV3 } from '@pact-foundation/pact';

const { like, eachLike, string } = MatchersV3;

const provider = new PactV4({
  consumer: 'masova-frontend',
  provider: 'commerce-service',
  dir: path.resolve(process.cwd(), 'pacts'),
  logLevel: 'error',
});

describe('Commerce Service (Menu) Pact', () => {
  describe('GET /api/menu', () => {
    it('returns list of menu items', async () => {
      await provider
        .addInteraction()
        .given('menu items exist')
        .uponReceiving('a request to get all menu items')
        .withRequest('GET', '/api/menu')
        .willRespondWith(200, (builder) => {
          builder.jsonBody(eachLike({
            id: string('menu-1'),
            name: string('Margherita Pizza'),
            basePrice: like(29900),
            isAvailable: like(true),
            allergensDeclared: like(true),
          }));
        })
        .executeTest(async (mockServer) => {
          const response = await fetch(`${mockServer.url}/api/menu`);
          expect(response.status).toBe(200);
          const data = await response.json();
          expect(Array.isArray(data)).toBe(true);
          expect(data[0]).toHaveProperty('id');
          expect(data[0]).toHaveProperty('name');
        });
    });
  });

  describe('GET /api/menu/:id', () => {
    it('returns a single menu item by id', async () => {
      await provider
        .addInteraction()
        .given('menu item exists with id menu-pact-1')
        .uponReceiving('a request to get menu item by id')
        .withRequest('GET', '/api/menu/menu-pact-1')
        .willRespondWith(200, (builder) => {
          builder.jsonBody(like({
            id: string('menu-pact-1'),
            name: string('Margherita Pizza'),
            basePrice: like(29900),
            isAvailable: like(true),
          }));
        })
        .executeTest(async (mockServer) => {
          const response = await fetch(`${mockServer.url}/api/menu/menu-pact-1`);
          expect(response.status).toBe(200);
          const data = await response.json();
          expect(data.id).toBe('menu-pact-1');
        });
    });
  });

  describe('PATCH /api/menu/items/:id/allergens', () => {
    it('declares allergens for a menu item', async () => {
      await provider
        .addInteraction()
        .given('menu item exists with id menu-pact-1')
        .uponReceiving('a request to declare allergens')
        .withRequest('PATCH', '/api/menu/items/menu-pact-1/allergens', (builder) => {
          builder.jsonBody({
            allergens: like(['MILK', 'GLUTEN']),
            allergenFree: like(false),
          });
        })
        .willRespondWith(200, (builder) => {
          builder.jsonBody(like({
            id: string('menu-pact-1'),
            allergensDeclared: like(true),
          }));
        })
        .executeTest(async (mockServer) => {
          const response = await fetch(
            `${mockServer.url}/api/menu/items/menu-pact-1/allergens`,
            {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ allergens: ['MILK', 'GLUTEN'], allergenFree: false }),
            }
          );
          expect(response.status).toBe(200);
        });
    });
  });
});
