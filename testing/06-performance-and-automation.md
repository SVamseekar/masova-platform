# Performance Testing & Test Automation Guide

**Document:** 06-performance-and-automation.md
**Purpose:** Performance benchmarks, load testing, and automation strategy
**Priority:** HIGH (Production readiness)

---

## 📋 Table of Contents

1. [Performance Testing](#performance-testing)
2. [Load & Stress Testing](#load--stress-testing)
3. [Test Automation Strategy](#test-automation-strategy)
4. [CI/CD Integration](#cicd-integration)
5. [Tools & Frameworks](#tools--frameworks)

---

## Performance Testing

### 🎯 Performance Benchmarks

#### API Response Time Targets

| Endpoint Category | p50 | p90 | p95 | p99 | Target |
|-------------------|-----|-----|-----|-----|--------|
| Health Checks | <25ms | <50ms | <75ms | <100ms | ✅ PASS if p95 <75ms |
| Public Endpoints (Menu) | <100ms | <200ms | <250ms | <300ms | ✅ PASS if p95 <250ms |
| Authenticated CRUD | <150ms | <250ms | <300ms | <400ms | ✅ PASS if p95 <300ms |
| Complex Queries (Analytics) | <300ms | <500ms | <700ms | <1000ms | ✅ PASS if p95 <700ms |
| Payment Processing | <2000ms | <3000ms | <4000ms | <5000ms | ✅ PASS if p95 <4000ms |

#### Database Query Performance

| Query Type | Target Time | Max Acceptable | Target |
|------------|-------------|----------------|--------|
| Simple SELECT by ID | <10ms | <25ms | ✅ PASS if <25ms |
| SELECT with WHERE | <20ms | <50ms | ✅ PASS if <50ms |
| JOIN queries (2 tables) | <30ms | <75ms | ✅ PASS if <75ms |
| Complex aggregations | <100ms | <200ms | ✅ PASS if <200ms |
| Full-text search | <50ms | <100ms | ✅ PASS if <100ms |

#### Frontend Performance Targets

| Metric | Target | Max Acceptable | Measurement Tool |
|--------|--------|----------------|------------------|
| Initial Page Load | <2s | <3s | Lighthouse |
| Time to Interactive | <3s | <5s | Lighthouse |
| First Contentful Paint | <1s | <2s | Lighthouse |
| Largest Contentful Paint | <2.5s | <4s | Lighthouse |
| Cumulative Layout Shift | <0.1 | <0.25 | Lighthouse |
| WebSocket Connection | <100ms | <500ms | Manual |
| Real-time Update Latency | <100ms | <200ms | Manual |

---

### 📊 Performance Test Cases

#### PT-1.1: API Gateway Response Time
**Tool:** Apache JMeter or k6
**Test Configuration:**
- Concurrent Users: 10
- Duration: 5 minutes
- Ramp-up: 30 seconds

**Test Script (k6 example):**
```javascript
import http from 'k6/http';
import { check, sleep } from 'k6';

export let options = {
  stages: [
    { duration: '30s', target: 10 },  // Ramp-up
    { duration: '5m', target: 10 },   // Steady state
    { duration: '30s', target: 0 },   // Ramp-down
  ],
  thresholds: {
    http_req_duration: ['p(95)<300'],  // 95% of requests <300ms
    http_req_failed: ['rate<0.01'],    // <1% failures
  },
};

export default function () {
  let response = http.get('http://localhost:8080/api/menu/items');

  check(response, {
    'status is 200': (r) => r.status === 200,
    'response time <300ms': (r) => r.timings.duration < 300,
  });

  sleep(1);
}
```

**Success Criteria:**
- ✅ p95 response time < 300ms
- ✅ 0% error rate
- ✅ No memory leaks

---

#### PT-1.2: Database Query Performance
**Tool:** MongoDB Compass, Profiler
**Test Queries:**

```javascript
// 1. Simple SELECT by ID (Target: <10ms)
db.orders.findOne({ _id: ObjectId("...") })

// 2. SELECT with WHERE (Target: <20ms)
db.orders.find({ storeId: "store-001", status: "PREPARING" })

// 3. Complex aggregation (Target: <100ms)
db.orders.aggregate([
  { $match: { storeId: "store-001" } },
  { $group: { _id: "$status", count: { $sum: 1 } } }
])

// 4. Full-text search (Target: <50ms)
db.menu_items.find({ $text: { $search: "pizza" } })
```

**Verification:**
```bash
# Enable MongoDB profiling
db.setProfilingLevel(2)

# View slow queries
db.system.profile.find({ millis: { $gt: 100 } }).pretty()
```

**Success Criteria:**
- ✅ All queries meet target times
- ✅ Proper indexes exist
- ✅ No full collection scans

---

#### PT-1.3: Redis Cache Performance
**Tool:** redis-benchmark
**Test Commands:**

```bash
# 1. GET operations (should be <1ms)
redis-benchmark -t get -n 10000 -q

# 2. SET operations
redis-benchmark -t set -n 10000 -q

# 3. Mixed operations
redis-benchmark -t get,set -n 10000 -q

# 4. Pipeline performance
redis-benchmark -t get -n 10000 -P 10 -q
```

**Expected Results:**
```
GET: >50,000 requests/second
SET: >40,000 requests/second
```

**Success Criteria:**
- ✅ GET > 50k req/s
- ✅ SET > 40k req/s
- ✅ Cache hit rate > 80%

---

#### PT-1.4: WebSocket Performance
**Tool:** Artillery or custom script
**Test Configuration:**
- Concurrent connections: 100
- Duration: 5 minutes
- Message rate: 1 message/second per connection

**Artillery Config:**
```yaml
config:
  target: 'ws://localhost:8083'
  phases:
    - duration: 300
      arrivalRate: 20
  engines:
    ws:
      timeout: 30000

scenarios:
  - name: "Order updates via WebSocket"
    engine: ws
    flow:
      - connect:
          url: "/ws/orders"
      - send:
          destination: "/app/orders/subscribe"
          payload: '{"storeId":"store-001"}'
      - think: 5
      - loop:
        - receive:
            capture:
              - json: "$.orderId"
                as: "orderId"
        count: 100
```

**Success Criteria:**
- ✅ All connections stable
- ✅ Message delivery <100ms
- ✅ No dropped messages
- ✅ No connection timeouts

---

#### PT-1.5: Frontend Lighthouse Scores
**Tool:** Google Lighthouse (Chrome DevTools)
**Test Pages:**
- Homepage (`/`)
- Menu page (`/menu`)
- Customer dashboard (`/customer/dashboard`)
- Manager dashboard (`/manager/dashboard`)
- Kitchen display (`/kitchen/queue`)

**Command Line:**
```bash
# Install Lighthouse CLI
npm install -g lighthouse

# Run test
lighthouse http://localhost:5173 \
  --output html \
  --output-path ./lighthouse-report.html \
  --chrome-flags="--headless"

# Run for mobile
lighthouse http://localhost:5173 \
  --preset=mobile \
  --output html \
  --output-path ./lighthouse-mobile.html
```

**Target Scores:**

| Category | Desktop | Mobile | Weight |
|----------|---------|--------|--------|
| Performance | ≥90 | ≥85 | HIGH |
| Accessibility | ≥90 | ≥90 | CRITICAL |
| Best Practices | ≥90 | ≥90 | MEDIUM |
| SEO | ≥80 | ≥80 | MEDIUM |

**Success Criteria:**
- ✅ All pages meet target scores
- ✅ No critical accessibility issues
- ✅ Mobile performance acceptable

---

## Load & Stress Testing

### 🔥 Load Test Scenarios

#### LT-2.1: Normal Load Test
**Goal:** Validate system under expected production load
**Configuration:**
- Concurrent users: 100
- Duration: 30 minutes
- User scenarios: 70% browse, 20% order, 10% track

**k6 Script:**
```javascript
import http from 'k6/http';
import { check, group, sleep } from 'k6';

export let options = {
  stages: [
    { duration: '5m', target: 50 },   // Ramp-up to 50
    { duration: '5m', target: 100 },  // Ramp-up to 100
    { duration: '20m', target: 100 }, // Stay at 100
    { duration: '5m', target: 0 },    // Ramp-down
  ],
};

export default function () {
  let scenario = Math.random();

  if (scenario < 0.7) {
    // 70% - Browse menu
    group('Browse Menu', function() {
      http.get('http://localhost:8080/api/menu/items');
    });
  } else if (scenario < 0.9) {
    // 20% - Place order (authenticated)
    group('Place Order', function() {
      let token = 'Bearer ...';  // Get from login
      let orderPayload = JSON.stringify({
        customerId: 'cust-001',
        items: [{ menuItemId: 'item-001', quantity: 2 }],
        orderType: 'DELIVERY'
      });

      http.post('http://localhost:8080/api/orders', orderPayload, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token
        }
      });
    });
  } else {
    // 10% - Track order
    group('Track Order', function() {
      http.get('http://localhost:8080/api/orders/order-123');
    });
  }

  sleep(Math.random() * 3 + 2);  // 2-5 second think time
}
```

**Success Criteria:**
- ✅ 0% error rate
- ✅ Response times within targets
- ✅ No service crashes
- ✅ CPU < 80%, Memory < 85%

---

#### LT-2.2: Stress Test (Peak Load)
**Goal:** Identify breaking point
**Configuration:**
- Start: 100 users
- Peak: 500 users
- Duration: 15 minutes

**Success Criteria:**
- ✅ System handles 500 concurrent users
- ✅ Graceful degradation (not crash)
- ✅ Recovery after load reduction

---

#### LT-2.3: Spike Test
**Goal:** Validate sudden traffic spike handling
**Configuration:**
- Normal: 50 users
- Spike: 300 users (sudden)
- Duration: 2 minutes spike

**k6 Configuration:**
```javascript
export let options = {
  stages: [
    { duration: '2m', target: 50 },    // Normal load
    { duration: '10s', target: 300 },  // Sudden spike
    { duration: '2m', target: 300 },   // Sustained spike
    { duration: '10s', target: 50 },   // Drop
    { duration: '2m', target: 50 },    // Recovery
  ],
};
```

**Success Criteria:**
- ✅ No crashes during spike
- ✅ Auto-scaling triggered (if configured)
- ✅ Fast recovery

---

#### LT-2.4: Endurance Test (Soak Test)
**Goal:** Detect memory leaks and degradation
**Configuration:**
- Concurrent users: 50
- Duration: 4 hours
- Constant load

**Success Criteria:**
- ✅ No memory leaks
- ✅ Stable performance throughout
- ✅ No connection pool exhaustion

**Monitoring Commands:**
```bash
# Monitor Java heap usage
watch -n 5 'jstat -gc <PID> 1000 1'

# Monitor Docker container resources
watch -n 5 'docker stats'

# Monitor MongoDB connections
watch -n 5 'mongosh --eval "db.serverStatus().connections"'
```

---

### 🎯 Performance Optimization Checklist

#### Backend Optimizations
- [ ] Database indexes on frequently queried fields
- [ ] Redis caching for menu items (10-minute TTL)
- [ ] Redis caching for customer profiles
- [ ] Connection pooling configured (MongoDB)
- [ ] JVM heap size optimized (-Xmx2G recommended)
- [ ] Async processing for heavy operations
- [ ] API rate limiting (100 req/min)
- [ ] GZIP compression enabled

#### Frontend Optimizations
- [ ] Code splitting (React lazy loading)
- [ ] Image optimization (WebP format, lazy loading)
- [ ] Bundle size < 500KB (main chunk)
- [ ] Tree shaking enabled
- [ ] Minification and uglification
- [ ] CDN for static assets (production)
- [ ] Service worker for caching (PWA)
- [ ] Debouncing on search inputs

#### Database Optimizations
```javascript
// Ensure indexes exist
db.orders.createIndex({ storeId: 1, status: 1, createdAt: -1 })
db.orders.createIndex({ customerId: 1, createdAt: -1 })
db.orders.createIndex({ orderNumber: 1 }, { unique: true })

db.menu_items.createIndex({ name: "text", description: "text" })
db.menu_items.createIndex({ category: 1, isAvailable: 1 })

db.users.createIndex({ "personalInfo.email": 1 }, { unique: true })
db.users.createIndex({ "personalInfo.phone": 1 }, { unique: true })

db.customers.createIndex({ userId: 1 }, { unique: true })
db.customers.createIndex({ "loyaltyInfo.tier": 1 })
```

---

## Test Automation Strategy

### 🤖 Automation Pyramid

```
        /\
       /  \
      / E2E \         10% - End-to-End Tests (Cypress)
     /______\
    /        \
   / Integration \   30% - Integration Tests (RestAssured)
  /______________\
 /                \
/    Unit Tests    \ 60% - Unit Tests (JUnit, Jest)
\__________________/
```

### Test Levels & Tools

#### Level 1: Unit Tests (60%)
**Backend (Java/Spring Boot):**
- **Tool:** JUnit 5 + Mockito
- **Coverage Target:** 80%+
- **What to Test:**
  - Service layer business logic
  - DTO validation
  - Utility functions
  - Exception handling

**Example:**
```java
@SpringBootTest
class OrderServiceTest {

    @Mock
    private OrderRepository orderRepository;

    @InjectMocks
    private OrderService orderService;

    @Test
    void testCreateOrder_Success() {
        // Given
        CreateOrderRequest request = new CreateOrderRequest();
        // ... setup request

        when(orderRepository.save(any())).thenReturn(mockOrder);

        // When
        Order result = orderService.createOrder(request);

        // Then
        assertNotNull(result);
        assertEquals("RECEIVED", result.getStatus());
        verify(orderRepository, times(1)).save(any());
    }
}
```

**Frontend (React/TypeScript):**
- **Tool:** Jest + React Testing Library
- **Coverage Target:** 70%+
- **What to Test:**
  - Component rendering
  - User interactions
  - State management
  - Utility functions

**Example:**
```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { MenuItemCard } from './MenuItemCard';

test('adds item to cart when button clicked', () => {
  const mockAddToCart = jest.fn();
  render(<MenuItemCard item={mockItem} onAddToCart={mockAddToCart} />);

  const addButton = screen.getByText('Add to Cart');
  fireEvent.click(addButton);

  expect(mockAddToCart).toHaveBeenCalledWith(mockItem);
});
```

---

#### Level 2: Integration Tests (30%)
**Backend API Testing:**
- **Tool:** RestAssured or Postman/Newman
- **What to Test:**
  - API endpoints
  - Database interactions
  - Service-to-service communication
  - Authentication/Authorization

**RestAssured Example:**
```java
@SpringBootTest(webEnvironment = WebEnvironment.RANDOM_PORT)
class OrderControllerIntegrationTest {

    @LocalServerPort
    private int port;

    @Test
    void testCreateOrder_IntegrationTest() {
        given()
            .port(port)
            .contentType(ContentType.JSON)
            .header("Authorization", "Bearer " + jwtToken)
            .body(orderRequest)
        .when()
            .post("/api/orders")
        .then()
            .statusCode(201)
            .body("status", equalTo("RECEIVED"))
            .body("orderNumber", notNullValue());
    }
}
```

**Postman Collection Example:**
```json
{
  "name": "Order Service Integration Tests",
  "item": [
    {
      "name": "Create Order",
      "event": [
        {
          "listen": "test",
          "script": {
            "exec": [
              "pm.test('Status code is 201', function() {",
              "    pm.response.to.have.status(201);",
              "});",
              "pm.test('Order created', function() {",
              "    var jsonData = pm.response.json();",
              "    pm.expect(jsonData.status).to.eql('RECEIVED');",
              "});"
            ]
          }
        }
      ],
      "request": {
        "method": "POST",
        "url": "{{baseUrl}}/api/orders",
        "body": {
          "mode": "raw",
          "raw": "{ \"customerId\": \"cust-001\", ... }"
        }
      }
    }
  ]
}
```

---

#### Level 3: End-to-End Tests (10%)
**Tool:** Cypress or Playwright
**What to Test:**
- Critical user journeys
- Multi-page workflows
- Real browser interactions

**Cypress Example:**
```javascript
describe('Customer Order Flow', () => {
  it('should complete full order journey', () => {
    // Login
    cy.visit('/login');
    cy.get('[data-cy=email]').type('customer@test.com');
    cy.get('[data-cy=password]').type('Test@123');
    cy.get('[data-cy=login-btn]').click();

    // Browse menu
    cy.url().should('include', '/customer/dashboard');
    cy.get('[data-cy=menu-link]').click();

    // Add to cart
    cy.get('[data-cy=menu-item]').first().within(() => {
      cy.get('[data-cy=add-to-cart]').click();
    });

    // Checkout
    cy.get('[data-cy=cart-icon]').click();
    cy.get('[data-cy=checkout-btn]').click();

    // Place order
    cy.get('[data-cy=place-order-btn]').click();

    // Verify success
    cy.url().should('include', '/payment');
    cy.contains('Order placed successfully');
  });
});
```

---

### 📁 Test Organization Structure

```
testing/
├── backend/
│   ├── unit/
│   │   ├── service/
│   │   │   ├── OrderServiceTest.java
│   │   │   ├── PaymentServiceTest.java
│   │   │   └── ...
│   │   └── util/
│   │       └── ValidationUtilTest.java
│   ├── integration/
│   │   ├── api/
│   │   │   ├── OrderControllerTest.java
│   │   │   └── PaymentControllerTest.java
│   │   └── repository/
│   │       └── OrderRepositoryTest.java
│   └── e2e/
│       └── postman/
│           ├── MaSoVa-API-Collection.json
│           └── environment.json
├── frontend/
│   ├── unit/
│   │   ├── components/
│   │   │   ├── MenuItemCard.test.tsx
│   │   │   └── OrderCard.test.tsx
│   │   ├── store/
│   │   │   ├── authSlice.test.ts
│   │   │   └── cartSlice.test.ts
│   │   └── utils/
│   │       └── validation.test.ts
│   ├── integration/
│   │   └── api/
│   │       ├── orderApi.test.ts
│   │       └── paymentApi.test.ts
│   └── e2e/
│       └── cypress/
│           ├── integration/
│           │   ├── customer-flow.spec.js
│           │   ├── manager-flow.spec.js
│           │   └── kitchen-flow.spec.js
│           └── support/
│               └── commands.js
├── performance/
│   ├── k6/
│   │   ├── load-test.js
│   │   ├── stress-test.js
│   │   └── spike-test.js
│   └── artillery/
│       └── websocket-test.yml
└── reports/
    ├── junit/
    ├── coverage/
    └── lighthouse/
```

---

## CI/CD Integration

### 🔄 GitHub Actions Workflow

**File:** `.github/workflows/ci-cd.yml`

```yaml
name: MaSoVa CI/CD Pipeline

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main, develop ]

jobs:
  # JOB 1: Backend Unit Tests
  backend-tests:
    runs-on: ubuntu-latest
    services:
      mongodb:
        image: mongo:latest
        ports:
          - 27017:27017
      redis:
        image: redis:alpine
        ports:
          - 6379:6379

    steps:
      - uses: actions/checkout@v3

      - name: Set up JDK 21
        uses: actions/setup-java@v3
        with:
          java-version: '21'
          distribution: 'temurin'

      - name: Build shared-models
        run: |
          cd shared-models
          mvn clean install

      - name: Test User Service
        run: |
          cd user-service
          mvn test

      - name: Test Order Service
        run: |
          cd order-service
          mvn test

      - name: Upload coverage reports
        uses: codecov/codecov-action@v3
        with:
          files: ./target/site/jacoco/jacoco.xml

  # JOB 2: Frontend Unit Tests
  frontend-tests:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Set up Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: |
          cd frontend
          npm ci

      - name: Run tests
        run: |
          cd frontend
          npm test -- --coverage

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./frontend/coverage/lcov.info

  # JOB 3: Build & Package
  build:
    needs: [backend-tests, frontend-tests]
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Build backend services
        run: |
          cd api-gateway && mvn clean package -DskipTests
          cd ../user-service && mvn clean package -DskipTests
          # ... other services

      - name: Build frontend
        run: |
          cd frontend
          npm ci
          npm run build

      - name: Upload artifacts
        uses: actions/upload-artifact@v3
        with:
          name: build-artifacts
          path: |
            */target/*.jar
            frontend/dist/

  # JOB 4: Integration Tests
  integration-tests:
    needs: build
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3
      - name: Download artifacts
        uses: actions/download-artifact@v3

      - name: Start services
        run: docker-compose up -d

      - name: Wait for services
        run: sleep 30

      - name: Run Postman tests
        run: |
          npm install -g newman
          newman run testing/backend/e2e/postman/MaSoVa-API-Collection.json \
            -e testing/backend/e2e/postman/environment.json

  # JOB 5: E2E Tests
  e2e-tests:
    needs: integration-tests
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Start application
        run: docker-compose up -d

      - name: Run Cypress tests
        uses: cypress-io/github-action@v5
        with:
          working-directory: frontend
          start: npm start
          wait-on: 'http://localhost:5173'
          wait-on-timeout: 120

  # JOB 6: Performance Tests (on main branch only)
  performance-tests:
    if: github.ref == 'refs/heads/main'
    needs: e2e-tests
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Install k6
        run: |
          sudo apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
          echo "deb https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
          sudo apt-get update
          sudo apt-get install k6

      - name: Run load test
        run: k6 run testing/performance/k6/load-test.js

      - name: Upload results
        uses: actions/upload-artifact@v3
        with:
          name: performance-results
          path: k6-results.json
```

---

### 🚀 Deployment Checklist

**Pre-Deployment:**
- [ ] All unit tests passing
- [ ] All integration tests passing
- [ ] All E2E tests passing
- [ ] Code coverage meets targets (80% backend, 70% frontend)
- [ ] Performance tests passed
- [ ] Security scan completed
- [ ] No critical/high severity bugs

**Deployment:**
- [ ] Database migrations executed
- [ ] Environment variables configured
- [ ] SSL certificates installed
- [ ] Load balancer configured
- [ ] Monitoring enabled (logs, metrics, alerts)
- [ ] Backup strategy in place

**Post-Deployment:**
- [ ] Smoke tests passed
- [ ] Health endpoints returning 200
- [ ] Monitoring dashboards green
- [ ] Error rate < 1%
- [ ] Response times within targets

---

## Tools & Frameworks

### Recommended Testing Stack

| Category | Tool | Purpose | License |
|----------|------|---------|---------|
| **Backend Unit** | JUnit 5 | Java unit testing | Apache 2.0 |
| **Backend Mocking** | Mockito | Mock objects | MIT |
| **Backend Integration** | RestAssured | API testing | Apache 2.0 |
| **Frontend Unit** | Jest | JavaScript testing | MIT |
| **Frontend Component** | React Testing Library | React component testing | MIT |
| **E2E** | Cypress | Browser automation | MIT |
| **API Testing** | Postman/Newman | API collection testing | Free/Paid |
| **Load Testing** | k6 | Performance testing | AGPL v3 |
| **WebSocket Testing** | Artillery | Real-time testing | MPL 2.0 |
| **Code Coverage** | JaCoCo (Java), Istanbul (JS) | Coverage reports | EPL/MIT |
| **CI/CD** | GitHub Actions | Automation | Free tier |

---

## ✅ Automation Completion Criteria

- [ ] 60% unit test coverage (backend)
- [ ] 70% unit test coverage (frontend)
- [ ] 100% critical API endpoints tested (integration)
- [ ] 7 E2E scenarios automated
- [ ] Performance benchmarks established
- [ ] CI/CD pipeline functional
- [ ] All tests green on main branch
- [ ] Test reports generated automatically
- [ ] Regression suite < 30 minutes execution time

---

**Final Document:** Proceed to `07-TEST-EXECUTION-SUMMARY.md` for tracking and sign-off.

---

*Automation ensures consistent quality. Invest in test automation early for long-term benefits.*
