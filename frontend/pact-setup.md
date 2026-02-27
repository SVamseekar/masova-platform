# Pact Contract Testing Setup for MaSoVa

## Overview

Pact is a consumer-driven contract testing framework that ensures frontend (consumer) and backend (provider) APIs remain in sync.

## Installation

```bash
cd frontend
npm install --save-dev @pact-foundation/pact @pact-foundation/pact-node
```

## How It Works

1. **Frontend (Consumer)** defines what it expects from the API
2. Pact generates a **contract file** (JSON)
3. **Backend (Provider)** runs tests to verify it meets the contract
4. **CI/CD** fails if contracts are broken

## Directory Structure

```
frontend/
├── src/
│   └── pact/
│       ├── consumers/         # Consumer tests (frontend expectations)
│       │   ├── order.pact.test.ts
│       │   ├── delivery.pact.test.ts
│       │   └── payment.pact.test.ts
│       └── pact-config.ts     # Pact configuration
└── pacts/                      # Generated contract files
    ├── frontend-order-service.json
    ├── frontend-delivery-service.json
    └── frontend-payment-service.json
```

## Configuration Steps

### 1. Install Dependencies

```bash
npm install --save-dev @pact-foundation/pact@^13.0.0
```

### 2. Create Pact Config

See `src/pact/pact-config.ts`

### 3. Write Consumer Tests

Example: `src/pact/consumers/order.pact.test.ts`

### 4. Run Tests

```bash
npm run test:pact
```

This generates contract files in `pacts/` directory.

### 5. Publish Contracts

Contracts are published to Pact Broker or shared with backend team.

### 6. Backend Verifies Contracts

Backend team runs provider tests to verify they meet the contracts.

## Example Contract Test

```typescript
import { Pact } from '@pact-foundation/pact';
import { orderApi } from '../store/api/orderApi';

describe('Order Service Contract', () => {
  const provider = new Pact({
    consumer: 'frontend',
    provider: 'order-service',
    port: 8545,
    log: path.resolve(__dirname, '../../logs', 'pact.log'),
    dir: path.resolve(__dirname, '../../pacts'),
  });

  beforeAll(() => provider.setup());
  afterAll(() => provider.finalize());

  describe('GET /orders/{id}', () => {
    beforeEach(() => {
      return provider.addInteraction({
        state: 'order 123 exists',
        uponReceiving: 'a request for order 123',
        withRequest: {
          method: 'GET',
          path: '/orders/123',
          headers: {
            Accept: 'application/json',
          },
        },
        willRespondWith: {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
          },
          body: {
            id: '123',
            customerName: 'John Doe',  // ← Frontend expects this exact field
            total: 299.99,
            status: 'PREPARING',
          },
        },
      });
    });

    it('returns the order', async () => {
      // Make actual API call
      const order = await fetchOrder('123');

      // Assertions
      expect(order.id).toBe('123');
      expect(order.customerName).toBe('John Doe');
      expect(order.total).toBe(299.99);
    });
  });
});
```

## Benefits

1. **Automated Contract Validation** - Tests fail if API changes break frontend
2. **Consumer-Driven** - Frontend defines what it needs
3. **CI/CD Integration** - Prevents deploying broken APIs
4. **Documentation** - Contracts serve as API documentation
5. **Fast Feedback** - Catch issues before deployment

## CI/CD Integration

### GitHub Actions Workflow

```yaml
name: Contract Tests

on: [push, pull_request]

jobs:
  pact-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Install dependencies
        run: cd frontend && npm install
      - name: Run Pact tests
        run: cd frontend && npm run test:pact
      - name: Publish contracts
        run: cd frontend && npm run pact:publish
```

## Next Steps

1. Install Pact dependencies
2. Configure Pact in frontend
3. Write contract tests for critical flows
4. Set up Pact provider tests in backend
5. Integrate into CI/CD pipeline
