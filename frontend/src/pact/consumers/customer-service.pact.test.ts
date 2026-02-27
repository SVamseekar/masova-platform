/**
 * Pact Contract Test: Customer Service
 * Defines the contract between frontend and customer-service
 *
 * This test ensures that customer-service API matches what the frontend expects.
 * If backend changes break this contract, tests will fail.
 */

import { Pact, Matchers } from '@pact-foundation/pact';
import { pactConfig, providers } from '../pact-config';

const { like, eachLike, term } = Matchers;

describe('Customer Service Contract Tests', () => {
  const provider = new Pact({
    ...pactConfig,
    provider: providers.customerService.provider,
    port: providers.customerService.port,
  });

  beforeAll(() => provider.setup());
  afterEach(() => provider.verify());
  afterAll(() => provider.finalize());

  const CUSTOMER_ID = '507f1f77bcf86cd799439099';

  describe('GET /api/customers/{id}', () => {
    beforeEach(() => {
      return provider.addInteraction({
        state: `customer with ID ${CUSTOMER_ID} exists`,
        uponReceiving: 'a request to get customer by ID',
        withRequest: {
          method: 'GET',
          path: `/api/customers/${CUSTOMER_ID}`,
          headers: {
            Accept: 'application/json',
            Authorization: term({
              matcher: '^Bearer .+$',
              generate: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
            }),
          },
        },
        willRespondWith: {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
          body: like({
            id: CUSTOMER_ID,
            userId: 'user-123',
            name: 'John Doe',
            email: 'john.doe@example.com',
            phone: '+1234567890',
            addresses: eachLike({
              id: 'addr-123',
              label: 'HOME',
              addressLine1: '123 Main St',
              city: 'San Francisco',
              state: 'CA',
              postalCode: '94102',
              country: 'US',
              isDefault: true,
            }),
            loyaltyInfo: like({
              totalPoints: 1500,
              tier: term({
                matcher: '^(BRONZE|SILVER|GOLD|PLATINUM)$',
                generate: 'SILVER',
              }),
            }),
            orderStats: like({
              totalOrders: 25,
              completedOrders: 23,
              totalSpent: 1250.50,
            }),
            active: true,
            emailVerified: true,
            phoneVerified: false,
            createdAt: term({
              matcher: '^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}',
              generate: '2024-01-15T10:30:00',
            }),
          }),
        },
      });
    });

    it('returns the customer successfully', async () => {
      const response = await fetch(
        `http://localhost:${providers.customerService.port}/api/customers/${CUSTOMER_ID}`,
        {
          headers: {
            Accept: 'application/json',
            Authorization: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
          },
        }
      );

      expect(response.status).toBe(200);
      const customer = await response.json();
      expect(customer).toHaveProperty('id');
      expect(customer).toHaveProperty('name');
      expect(customer).toHaveProperty('email');
      expect(customer).toHaveProperty('loyaltyInfo');
    });
  });

  describe('PUT /api/customers/{id}', () => {
    beforeEach(() => {
      return provider.addInteraction({
        state: `customer with ID ${CUSTOMER_ID} exists`,
        uponReceiving: 'a request to update customer',
        withRequest: {
          method: 'PUT',
          path: `/api/customers/${CUSTOMER_ID}`,
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            Authorization: term({
              matcher: '^Bearer .+$',
              generate: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
            }),
          },
          body: like({
            name: 'John Updated',
            phone: '+1987654321',
          }),
        },
        willRespondWith: {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
          body: like({
            id: CUSTOMER_ID,
            name: 'John Updated',
            phone: '+1987654321',
            updatedAt: term({
              matcher: '^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}',
              generate: '2024-01-16T14:00:00',
            }),
          }),
        },
      });
    });

    it('updates customer successfully', async () => {
      const response = await fetch(
        `http://localhost:${providers.customerService.port}/api/customers/${CUSTOMER_ID}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            Authorization: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
          },
          body: JSON.stringify({
            name: 'John Updated',
            phone: '+1987654321',
          }),
        }
      );

      expect(response.status).toBe(200);
      const customer = await response.json();
      expect(customer.name).toBe('John Updated');
    });
  });

  describe('POST /api/customers/{id}/addresses', () => {
    beforeEach(() => {
      return provider.addInteraction({
        state: `customer with ID ${CUSTOMER_ID} exists`,
        uponReceiving: 'a request to add address',
        withRequest: {
          method: 'POST',
          path: `/api/customers/${CUSTOMER_ID}/addresses`,
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            Authorization: term({
              matcher: '^Bearer .+$',
              generate: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
            }),
          },
          body: like({
            label: 'WORK',
            addressLine1: '456 Office Blvd',
            city: 'San Francisco',
            state: 'CA',
            postalCode: '94105',
            country: 'US',
          }),
        },
        willRespondWith: {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
          body: like({
            id: CUSTOMER_ID,
            addresses: eachLike({
              id: term({
                matcher: '^[a-zA-Z0-9-]+$',
                generate: 'addr-456',
              }),
              label: 'WORK',
              addressLine1: '456 Office Blvd',
            }),
          }),
        },
      });
    });

    it('adds address successfully', async () => {
      const response = await fetch(
        `http://localhost:${providers.customerService.port}/api/customers/${CUSTOMER_ID}/addresses`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            Authorization: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
          },
          body: JSON.stringify({
            label: 'WORK',
            addressLine1: '456 Office Blvd',
            city: 'San Francisco',
            state: 'CA',
            postalCode: '94105',
            country: 'US',
          }),
        }
      );

      expect(response.status).toBe(200);
      const customer = await response.json();
      expect(customer.addresses).toBeDefined();
    });
  });

  describe('POST /api/customers/{id}/loyalty/points', () => {
    beforeEach(() => {
      return provider.addInteraction({
        state: `customer with ID ${CUSTOMER_ID} exists`,
        uponReceiving: 'a request to add loyalty points',
        withRequest: {
          method: 'POST',
          path: `/api/customers/${CUSTOMER_ID}/loyalty/points`,
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            Authorization: term({
              matcher: '^Bearer .+$',
              generate: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
            }),
          },
          body: like({
            points: 100,
            type: 'EARNED',
            description: 'Order completion bonus',
            orderId: 'order-123',
          }),
        },
        willRespondWith: {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
          body: like({
            id: CUSTOMER_ID,
            loyaltyInfo: like({
              totalPoints: 1600,
              pointsEarned: 1600,
            }),
          }),
        },
      });
    });

    it('adds loyalty points successfully', async () => {
      const response = await fetch(
        `http://localhost:${providers.customerService.port}/api/customers/${CUSTOMER_ID}/loyalty/points`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            Authorization: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
          },
          body: JSON.stringify({
            points: 100,
            type: 'EARNED',
            description: 'Order completion bonus',
            orderId: 'order-123',
          }),
        }
      );

      expect(response.status).toBe(200);
      const customer = await response.json();
      expect(customer.loyaltyInfo.totalPoints).toBeDefined();
    });
  });
});
