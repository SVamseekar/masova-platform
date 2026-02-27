# Comprehensive Unit Testing Implementation Plan
## MaSoVa Restaurant Management System

## Executive Summary

**Total Components/Classes to Test:** 220+
- Frontend: 156 React components (0% tested)
- Backend: 65+ service classes, 31+ controllers (< 5% tested)

**Current Test Coverage:** < 2% overall
- Backend: Only 3 test files in user-service
- Frontend: Zero test infrastructure

---

## Phase 1: Setup Testing Infrastructure

### 1.1 Frontend Testing Setup
**Install dependencies:**
```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom @vitest/ui
```

**Create configuration files:**
- `vitest.config.ts` - Configure Vitest with React, jsdom environment
- `frontend/src/test/setup.ts` - Global test setup, mock configurations
- Update `package.json` with test scripts

**Setup mock utilities:**
- Redux store mock wrapper
- React Router mock wrapper
- API mock utilities (MSW - Mock Service Worker)
- Context providers mock wrapper

**Estimated time:** Setup foundation for all frontend tests

---

### 1.2 Backend Testing Infrastructure Enhancement
**Add to all service pom.xml files:**
- Ensure spring-boot-starter-test is present
- Add Testcontainers where needed
- Add MockWebServer for external API testing

**Create shared test utilities in shared-models:**
- Base test classes with common setup
- Test data builders/fixtures
- Custom assertion utilities
- Mock factories for common dependencies

---

## Phase 2: Backend Unit Tests Implementation

### Priority Order (Critical Business Logic First)

#### **TIER 1: CRITICAL SERVICE CLASSES (15 classes)**

**1. order-service (HIGHEST PRIORITY)**
- **OrderService.java** (1044 lines)
  - Test cases needed: ~35
  - Focus areas:
    - Order creation with tax/delivery fee calculations
    - Status transition validations (PENDING → PREPARING → READY → etc.)
    - Quality checkpoint workflows
    - Payment status integration
    - Driver assignment logic
    - Cancellation workflows with refund triggers
  - Mocks needed: OrderRepository, MenuServiceClient, CustomerServiceClient, DeliveryServiceClient, WebSocket

**2. payment-service (CRITICAL - SECURITY)**
- **PaymentService.java** (456 lines)
  - Test cases needed: ~25
  - Focus areas:
    - Payment initiation and Razorpay integration
    - Signature verification (security critical)
    - Idempotency key handling
    - Payment verification workflows
    - Cash payment recording
    - Daily reconciliation calculations
  - Mocks needed: TransactionRepository, RazorpayService, OrderServiceClient

- **RazorpayService.java**
  - Test cases needed: ~15
  - Focus areas:
    - Order creation API calls
    - Payment verification API calls
    - Signature validation (HMAC SHA-256)
    - Error handling and retries
  - Mocks needed: RazorpayClient HTTP calls

- **PiiEncryptionService.java** (SECURITY CRITICAL)
  - Test cases needed: ~12
  - Focus areas:
    - AES-256-GCM encryption/decryption
    - IV generation and handling
    - Key management
    - Edge cases (empty strings, special characters)
  - Mocks needed: None (pure cryptography)

- **RefundService.java** (209 lines)
  - Test cases needed: ~18
  - Focus areas:
    - Refund creation and validation
    - Partial refund calculations
    - Razorpay refund API integration
    - Refund status tracking
  - Mocks needed: RefundRepository, RazorpayService, TransactionRepository

**3. user-service**
- **UserService.java** (973 lines) - EXPAND EXISTING TESTS
  - Test cases needed: ~40 (many exist, expand coverage)
  - Focus areas:
    - Authentication flows (email/phone)
    - Employee PIN generation (4-digit unique)
    - PIN verification with brute force protection
    - Kiosk account creation
    - User role management
  - Mocks needed: UserRepository, PasswordEncoder, JwtService

- **JwtService.java** (SECURITY CRITICAL)
  - Test cases needed: ~15
  - Focus areas:
    - Token generation with claims
    - Token validation and expiration
    - Token parsing and extraction
    - Security edge cases
  - Mocks needed: None (uses JWT library)

**4. customer-service**
- **CustomerService.java** (1171 lines)
  - Test cases needed: ~45
  - Focus areas:
    - Customer creation and deduplication
    - Loyalty points (add, redeem, tier upgrades)
    - Address management (add, update, delete, set default)
    - GDPR anonymization workflows
    - Customer preferences
  - Mocks needed: CustomerRepository, CustomerAuditService

**5. notification-service**
- **NotificationService.java** (229 lines)
  - Test cases needed: ~20
  - Focus areas:
    - Multi-channel routing (email, SMS, push)
    - User preference filtering
    - Quiet hours enforcement
    - Retry logic for failed notifications
    - Async processing
  - Mocks needed: NotificationRepository, EmailService, SmsService, PushService

**6. inventory-service**
- **InventoryService.java** (438 lines)
  - Test cases needed: ~25
  - Focus areas:
    - Stock reservation with optimistic locking
    - Reserved stock release
    - Stock consumption
    - Concurrent operation handling
    - Stock adjustment validations
  - Mocks needed: InventoryItemRepository

**7. review-service**
- **ReviewService.java** (278 lines)
  - Test cases needed: ~20
  - Focus areas:
    - Review creation with token validation
    - Sentiment analysis integration
    - Moderation workflows
    - Average rating calculations
  - Mocks needed: ReviewRepository, SentimentAnalysisService

**8. analytics-service**
- **AnalyticsService.java** (300+ lines)
  - Test cases needed: ~25
  - Focus areas:
    - Sales metrics aggregation
    - Trend calculations
    - Multi-service data aggregation
    - Caching behavior
  - Mocks needed: OrderServiceClient, UserServiceClient

**9. delivery-service**
- **RouteOptimizationService.java** (160 lines)
  - Test cases needed: ~15
  - Focus areas:
    - Google Maps API integration
    - Route caching
    - Fallback logic
    - Distance/duration calculations
  - Mocks needed: Google Maps API client

**10. shared-models**
- **EncryptionService.java**
- **GlobalExceptionHandler.java**
- **InputValidator.java**

---

#### **TIER 2: HIGH PRIORITY SERVICE CLASSES (25 classes)**

**order-service:**
- CustomerNotificationService
- KitchenEquipmentService
- PredictiveNotificationService
- RatingTokenService

**notification-service:**
- EmailService, SmsService, PushService
- CampaignService
- RatingRequestService
- ManagerNotificationService

**user-service:**
- ShiftService, ShiftValidationService
- StoreService
- WorkingSessionService
- AccessControlService
- GDPR services (4 classes)

**delivery-service:**
- AutoDispatchService
- ETACalculationService
- LiveTrackingService
- PerformanceService

**inventory-service:**
- SupplierService
- WasteAnalysisService
- PurchaseOrderService

**customer-service:**
- CustomerAuditService
- CustomerDataRetentionService

**review-service:**
- SentimentAnalysisService
- ModerationService
- ReviewResponseService
- AnalyticsService

**menu-service:**
- MenuService

**analytics-service:**
- BIEngineService
- CostAnalysisService
- ExecutiveReportingService

---

#### **TIER 3: CONTROLLER TESTS (31+ controllers)**

**Approach:** Integration tests with MockMvc
- Mock service layer
- Test request/response mapping
- Validate HTTP status codes
- Test error handling
- Test authentication/authorization

**Services to cover:**
- order-service: OrderController, KitchenEquipmentController
- payment-service: PaymentController, RefundController, WebhookController
- user-service: UserController, GdprController, ShiftController
- notification-service: NotificationController, CampaignController
- And all others (31 total)

---

#### **TIER 4: REPOSITORY INTEGRATION TESTS (28+ repositories)**

**Approach:** Spring Boot Data JPA tests with Testcontainers
- @DataMongoTest for MongoDB repositories
- Test custom queries
- Test indexes and performance
- Validate entity mappings

---

## Phase 3: Frontend Unit Tests Implementation

### Priority Order

#### **TIER 1: CORE INFRASTRUCTURE COMPONENTS (10 components)**

**1. AppHeader.tsx**
- Test cases: ~15
- Areas: User states, cart integration, navigation, store selector, dropdowns

**2. StoreSelector.tsx**
- Test cases: ~12
- Areas: Store selection, Redux updates, context-based storage, dropdown

**3. CartDrawer.tsx**
- Test cases: ~18
- Areas: Quantity updates, removal, bill calculations, drawer states

**4. TokenRefreshManager.tsx**
- Test cases: ~10
- Areas: Token refresh logic, axios interceptors, retry behavior

**5. ErrorBoundary.tsx**
- Test cases: ~8
- Areas: Error catching, fallback UI, error logging

**6. ProtectedRoute.tsx**
- Test cases: ~10
- Areas: Auth checks, redirects, role-based access

**7. ConnectionMonitorProvider.tsx**
- Test cases: ~8
- Areas: Online/offline detection, reconnection logic

**8. Neumorphic UI Components (Button, Input, Card)**
- Test cases per component: ~8-12
- Areas: Variants, states, props, interactions

---

#### **TIER 2: PAGE COMPONENTS - HIGH TRAFFIC (15 pages)**

**Customer Pages:**
- MenuPage.tsx (~20 test cases)
- CheckoutPage.tsx (~25 test cases)
- LiveTrackingPage.tsx (~18 test cases)
- OrderTrackingPage.tsx (~12 test cases)

**Manager Pages:**
- DashboardPage.tsx (~30 test cases)
- OrderManagementPage.tsx (~25 test cases)
- StaffManagementPage.tsx (~20 test cases)
- InventoryDashboardPage.tsx (~18 test cases)

**Kitchen Pages:**
- KitchenDisplayPage.tsx (~25 test cases)
- OrderQueuePage.tsx (~20 test cases)

**Driver Pages:**
- DriverDashboard.tsx (~20 test cases)

**POS Pages:**
- POSDashboard.tsx (~25 test cases)

**Auth Pages:**
- LoginPage.tsx (~15 test cases)

---

#### **TIER 3: COMPLEX FEATURE COMPONENTS (20 components)**

- DriverTrackingMap.tsx (~15 test cases)
- AddressAutocomplete.tsx (~12 test cases)
- CampaignBuilder.tsx (~18 test cases)
- MenuPanel.tsx (~15 test cases)
- OrderPanel.tsx (~15 test cases)
- VirtualList.tsx (~12 test cases)
- NotificationBell.tsx (~12 test cases)
- Chart components (3 components, ~10 each)
- Inventory dialogs (7 components, ~8-12 each)

---

#### **TIER 4: REMAINING COMPONENTS (111 components)**

- Simple presentational components (~5-8 test cases each)
- Form components (~8-12 test cases each)
- Modal components (~6-8 test cases each)
- Card/Display components (~5-8 test cases each)

---

## Testing Strategy & Best Practices

### Backend Testing Patterns

**Unit Test Structure:**
```java
@ExtendWith(MockitoExtension.class)
class ServiceNameTest {
    @Mock private DependencyRepository repository;
    @InjectMocks private ServiceName service;

    @Test
    @DisplayName("Should perform action when valid input provided")
    void testMethodName() {
        // Arrange
        // Act
        // Assert
    }
}
```

**Key Principles:**
- One test class per service class
- Test file naming: `{ClassName}Test.java`
- Use @DisplayName for readable test descriptions
- Arrange-Act-Assert pattern
- Mock all external dependencies
- Test both happy paths and error scenarios
- Test edge cases and boundary conditions
- Use ArgumentCaptor to verify method arguments
- Test async operations with timeouts

### Frontend Testing Patterns

**Component Test Structure:**
```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { TestWrapper } from '@/test/TestWrapper';

describe('ComponentName', () => {
  it('should render correctly', () => {
    // Arrange
    render(<ComponentName />, { wrapper: TestWrapper });

    // Act & Assert
    expect(screen.getByText('Expected Text')).toBeInTheDocument();
  });

  it('should handle user interaction', async () => {
    // Arrange
    const onClickMock = vi.fn();
    render(<ComponentName onClick={onClickMock} />, { wrapper: TestWrapper });

    // Act
    fireEvent.click(screen.getByRole('button'));

    // Assert
    await waitFor(() => {
      expect(onClickMock).toHaveBeenCalledTimes(1);
    });
  });
});
```

**Key Principles:**
- Test file naming: `{ComponentName}.test.tsx`
- Co-locate tests with components (same directory)
- Use TestWrapper for Redux/Router providers
- Mock API calls with MSW (Mock Service Worker)
- Test user interactions, not implementation details
- Use semantic queries (getByRole, getByLabelText)
- Test accessibility (ARIA attributes)
- Avoid snapshot tests (brittle)
- Test loading/error states
- Test conditional rendering

---

## Mock Strategy

### Backend Mocks
- **Repository mocks:** Mockito when() for data access
- **External API clients:** MockWebServer or WireMock
- **Payment gateway:** Mock RazorpayClient responses
- **Google Maps API:** Mock HTTP responses
- **WebSocket:** Manual mock implementation
- **Time-based logic:** Clock injection pattern

### Frontend Mocks
- **Redux:** Custom store configuration for tests
- **React Router:** MemoryRouter with initial entries
- **API calls:** MSW (Mock Service Worker) handlers
- **External libraries:**
  - Maps: Mock component wrapper
  - Charts: Mock Recharts/Chart.js
  - Payment gateway: Mock Razorpay SDK
- **Context providers:** Custom test wrappers
- **LocalStorage/SessionStorage:** Mock Storage API

---

## Test Coverage Goals

### Phase-by-Phase Coverage Targets

**After Phase 1 (Infrastructure):**
- Infrastructure ready, 0% code coverage (baseline)

**After Phase 2 (Backend Breadth):**
- Backend Services: 40-50% line coverage
- All 65+ services have at least 3-5 tests

**After Phase 3 (Frontend Breadth):**
- Frontend Components: 30-40% line coverage
- All 156 components have at least 2-4 tests

**After Phase 4 (Controllers):**
- Controllers: 50-60% line coverage
- All 31+ controllers tested

**After Phase 5 (Deepening Critical Paths):**
- Critical services (payment, auth, order): 80-90% coverage
- Overall backend: 60-70% coverage
- Overall frontend: 50-60% coverage

**After Phase 6 (Repositories):**
- Repositories: 70-80% coverage
- Overall backend: 70-80% coverage

**After Phase 7 (Edge Cases):**
- Overall backend: 75-85% coverage
- Overall frontend: 60-70% coverage
- Critical paths: > 90% coverage

**After Phase 8 (Complete):**
- **Backend Services:** > 80% line coverage
- **Frontend Components:** > 70% line coverage
- **Critical paths (payment, auth, orders):** > 90% coverage
- **UI components (presentational):** > 60% coverage
- **Controllers:** > 75% coverage
- **Repositories:** > 70% coverage

### Coverage Exclusions
- Generated code
- Configuration classes (unless complex logic)
- DTOs/Models (unless complex validation)
- Main application classes
- Third-party library wrappers

---

## Implementation Approach

### Strategy: BREADTH-FIRST with Incremental Phases

**Approach:** Write basic tests for ALL components/classes first to establish coverage, then iteratively deepen critical areas.

---

### **PHASE 1: Infrastructure Setup & Foundation**
**Goal:** Establish testing infrastructure and shared utilities

**Backend:**
1. Create shared test utilities in `shared-models/src/test/`
   - BaseServiceTest.java (common setup)
   - TestDataBuilder.java (test fixtures)
   - MockFactory.java (common mocks)
2. Add missing test dependencies to all service pom.xml files
3. Create test configuration templates

**Frontend:**
1. Install Vitest + React Testing Library
2. Create `vitest.config.ts` (Vite-native configuration)
3. Create `frontend/src/test/setup.ts` (global test setup)
4. Create `frontend/src/test/TestWrapper.tsx` (Redux + Router wrapper)
5. Create `frontend/src/test/mocks/handlers.ts` (MSW API mocks)
6. Create `frontend/src/test/utils/testUtils.tsx` (custom render, utilities)
7. Add test scripts to package.json

**Deliverable:** Fully functional testing infrastructure for both frontend and backend

---

### **PHASE 2: Backend Services - Basic Coverage (All 65+ Services)**
**Goal:** Every backend service class gets at least 3-5 basic tests

**Approach:**
- Focus on happy path tests first
- Test main public methods
- 3-5 test cases per service minimum
- Mock all dependencies

**Priority Order (within this phase):**
1. **Payment & Security (4 services)** - PaymentService, RazorpayService, PiiEncryptionService, JwtService
2. **Order Management (5 services)** - OrderService, CustomerNotificationService, KitchenEquipmentService, PredictiveNotificationService, RatingTokenService
3. **Remaining services (56+ services)** - All other services across all microservices

**Target:** 65+ test files created, ~300+ basic test cases, ~40-50% coverage

---

### **PHASE 3: Frontend Components - Basic Coverage (All 156 Components)**
**Goal:** Every React component gets at least 2-4 basic tests

**Approach:**
- Test rendering with default props
- Test one primary user interaction
- Test loading/error states if applicable
- 2-4 test cases per component minimum

**Priority Order (within this phase):**
1. **UI Components (16 components)** - Neumorphic design system (Button, Input, Card, etc.)
2. **Core Infrastructure (10 components)** - AppHeader, StoreSelector, CartDrawer, ErrorBoundary, etc.
3. **Page Components (62 components)** - All pages across customer/manager/driver/kitchen/POS
4. **Feature Components (35 components)** - Forms, charts, delivery, inventory, etc.
5. **App-Specific Components (33 components)** - PublicWebsite, DriverApp, POSSystem

**Target:** 156 test files created, ~450+ basic test cases, ~30-40% coverage

---

### **PHASE 4: Controllers - Basic Coverage (All 31+ Controllers)**
**Goal:** Every controller gets integration tests for main endpoints

**Approach:**
- Use MockMvc for REST API testing
- Mock service layer
- Test 2-3 main endpoints per controller
- Validate request/response mapping
- Test authentication requirements

**Services to cover:**
- order-service (5 controllers)
- payment-service (3 controllers)
- user-service (7 controllers)
- notification-service (4 controllers)
- And all other services (12+ controllers)

**Target:** 31+ controller test files, ~150+ test cases

---

### **PHASE 5: Deepen Critical Business Logic**
**Goal:** Expand tests for complex, high-risk areas to 80%+ coverage

**Backend - Deepen these services:**
1. **OrderService** - Expand from 5 → 35 test cases
   - All status transitions
   - Tax/delivery fee edge cases
   - Quality checkpoint workflows
   - Cancellation + refund scenarios
   - Concurrent updates

2. **PaymentService** - Expand from 5 → 25 test cases
   - Signature verification edge cases
   - Idempotency handling
   - Reconciliation calculations
   - Error handling and retries

3. **CustomerService** - Expand from 5 → 45 test cases
   - Loyalty tier transitions
   - GDPR anonymization workflows
   - Address management edge cases

4. **UserService** - Expand from 5 → 40 test cases
   - PIN generation uniqueness
   - Brute force protection
   - Kiosk account workflows

5. **InventoryService** - Expand from 5 → 25 test cases
   - Optimistic locking scenarios
   - Concurrent reservations
   - Stock adjustment validations

**Frontend - Deepen these components:**
1. **MenuPage** - Expand from 4 → 20 test cases
2. **CheckoutPage** - Expand from 4 → 25 test cases
3. **DashboardPage** - Expand from 4 → 30 test cases
4. **KitchenDisplayPage** - Expand from 4 → 25 test cases
5. **POSDashboard** - Expand from 4 → 25 test cases

**Target:** Critical paths reach 80-90% coverage

---

### **PHASE 6: Repository Integration Tests**
**Goal:** Test custom repository queries and database interactions

**Approach:**
- @DataMongoTest with Testcontainers
- Test custom query methods
- Validate indexes
- Test pagination and sorting

**Target:** 28+ repository test files, ~100+ integration tests

---

### **PHASE 7: Edge Cases & Error Scenarios**
**Goal:** Add tests for error handling, edge cases, boundary conditions

**Focus Areas:**
- Null/empty input handling
- Invalid data validation
- Concurrent operation conflicts
- Network failures and retries
- Rate limiting
- Authentication/authorization failures

**Target:** Add ~300+ edge case tests across all components/services

---

### **PHASE 8: Integration Tests & CI/CD**
**Goal:** End-to-end tests and continuous integration setup

1. Add cross-service integration tests
2. Add end-to-end workflow tests (order creation → payment → delivery)
3. Configure GitHub Actions / GitLab CI
4. Add test coverage reporting (JaCoCo for Java, Vitest coverage for frontend)
5. Enforce test requirements in PR reviews

**Target:** Full CI/CD pipeline with automated testing

---

## Critical Files to Modify/Create

### Frontend
**New files to create:**
- `frontend/vitest.config.ts`
- `frontend/src/test/setup.ts`
- `frontend/src/test/TestWrapper.tsx`
- `frontend/src/test/mocks/handlers.ts` (MSW)
- `frontend/src/test/utils/testUtils.tsx`
- 156 x `*.test.tsx` files (co-located with components)

**Files to modify:**
- `frontend/package.json` (add dependencies and scripts)
- `frontend/tsconfig.json` (add test types)

### Backend
**New files to create:**
- `shared-models/src/test/java/com/MaSoVa/shared/test/BaseServiceTest.java`
- `shared-models/src/test/java/com/MaSoVa/shared/test/TestDataBuilder.java`
- ~100+ `*Test.java` files across all services

**Existing files with tests to expand:**
- `user-service/src/test/java/com/MaSoVa/user/service/UserServiceTest.java`
- `user-service/src/test/java/com/MaSoVa/user/integration/CompleteWorkflowIntegrationTest.java`

---

## Dependencies to Add

### Frontend (package.json)
```json
{
  "devDependencies": {
    "vitest": "^1.0.0",
    "@testing-library/react": "^14.0.0",
    "@testing-library/jest-dom": "^6.0.0",
    "@testing-library/user-event": "^14.0.0",
    "jsdom": "^23.0.0",
    "@vitest/ui": "^1.0.0",
    "msw": "^2.0.0"
  }
}
```

### Backend (pom.xml additions where missing)
```xml
<dependency>
    <groupId>org.testcontainers</groupId>
    <artifactId>junit-jupiter</artifactId>
    <version>1.19.3</version>
    <scope>test</scope>
</dependency>
<dependency>
    <groupId>org.testcontainers</groupId>
    <artifactId>mongodb</artifactId>
    <version>1.19.3</version>
    <scope>test</scope>
</dependency>
```

---

## Success Metrics

- All 156 frontend components have test files
- All 65+ backend service classes have comprehensive unit tests
- All 31+ controllers have integration tests
- CI/CD pipeline runs tests on every commit
- Test coverage reports generated automatically
- All new code requires accompanying tests (enforced in PR reviews)
- Test execution time < 5 minutes for unit tests
- Zero flaky tests

---

## Risk Mitigation

**Potential Challenges:**
1. **Large codebase:** Break into small, manageable chunks
2. **External API dependencies:** Use mocking extensively
3. **WebSocket testing:** Create specialized test utilities
4. **Async operations:** Proper use of waitFor and async/await
5. **Time-based tests:** Inject Clock for deterministic testing
6. **Database state:** Use Testcontainers for isolation

**Solutions:**
- Incremental implementation (tier by tier)
- Pair programming for complex test scenarios
- Shared test utilities to avoid duplication
- Regular code reviews focused on test quality
- Continuous integration to catch failures early

---

## Conclusion

This plan provides a comprehensive roadmap for achieving high test coverage across the entire MaSoVa Restaurant Management System. By following the tiered approach and focusing on critical business logic first, we ensure the most important functionality is tested early while building a solid testing foundation for the entire codebase.

**Total Estimated Test Files to Create:**
- Backend: ~100+ test classes
- Frontend: ~156 test files
- **Total: 256+ test files**

**Estimated Total Test Cases:**
- Backend: ~800+ test cases
- Frontend: ~1,500+ test cases
- **Total: 2,300+ test cases**
