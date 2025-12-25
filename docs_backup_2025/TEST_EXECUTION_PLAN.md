# MaSoVa Production Readiness - Manual Test Execution Plan

**Test Date:** December 9, 2025
**Tester:** AI QA Engineer
**Objective:** Verify all production readiness fixes are implemented and working

---

## Prerequisites

### Services to Start:
```bash
# Terminal 1 - User Service (Port 8082)
cd user-service && mvn spring-boot:run

# Terminal 2 - Order Service (Port 8083)
cd order-service && mvn spring-boot:run

# Terminal 3 - Payment Service (Port 8084)
cd payment-service && mvn spring-boot:run

# Terminal 4 - Analytics Service (Port 8085)
cd analytics-service && mvn spring-boot:run

# Terminal 5 - Customer Service (Port 8086)
cd customer-service && mvn spring-boot:run

# Terminal 6 - Delivery Service (Port 8087)
cd delivery-service && mvn spring-boot:run

# Terminal 7 - API Gateway (Port 8080)
cd api-gateway && mvn spring-boot:run
```

### Test Data Setup:
```bash
# Create 2 test stores
STORE_A_ID="store_001"
STORE_B_ID="store_002"

# Create test users:
# - Manager A (Store A): manager_a@test.com
# - Manager B (Store B): manager_b@test.com
# - Staff A (Store A): staff_a@test.com
# - Customer A: customer_a@test.com
# - Customer B: customer_b@test.com
# - Driver A (Store A): driver_a@test.com
```

---

## Test Suite 1: Critical Security Tests

### TEST-SEC-001: Analytics Authorization Missing ❌ CRITICAL
**Status:** EXPECTED TO FAIL
**Severity:** P0 - CRITICAL
**JIRA:** CRIT-002

**Steps:**
1. Login as Customer A
2. Extract JWT token
3. Call: `GET http://localhost:8085/api/analytics/sales/today` with Store A ID
4. **Expected:** 403 Forbidden (Customer role not allowed)
5. **Actual (Predicted):** 200 OK with sales data (SECURITY BREACH)

**cURL Command:**
```bash
# Step 1: Login as customer
CUSTOMER_TOKEN=$(curl -s -X POST http://localhost:8082/api/users/login \
  -H "Content-Type: application/json" \
  -d '{"email":"customer_a@test.com","password":"Test@123"}' | jq -r '.accessToken')

# Step 2: Try to access analytics (should fail)
curl -X GET "http://localhost:8085/api/analytics/sales/today" \
  -H "Authorization: Bearer $CUSTOMER_TOKEN" \
  -H "X-Store-Id: $STORE_A_ID"
```

**Evidence Location:** `analytics-service/.../AnalyticsController.java` - Missing @PreAuthorize

---

### TEST-SEC-002: Store Data Isolation in Orders ✅ SHOULD PASS
**Status:** EXPECTED TO PASS
**Severity:** P0 - CRITICAL
**JIRA:** CRIT-001, STORE-003

**Steps:**
1. Login as Manager A (Store A)
2. Create Order 1 in Store A
3. Login as Manager B (Store B)
4. Try to access Store A's Order 1
5. **Expected:** 403 Forbidden or Order not visible
6. **Actual (Predicted):** Should be blocked ✓

**cURL Commands:**
```bash
# Login as Manager A
MANAGER_A_TOKEN=$(curl -s -X POST http://localhost:8082/api/users/login \
  -H "Content-Type: application/json" \
  -d '{"email":"manager_a@test.com","password":"Test@123"}' | jq -r '.accessToken')

# Create order in Store A
ORDER_ID=$(curl -s -X POST http://localhost:8083/api/orders \
  -H "Authorization: Bearer $MANAGER_A_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "storeId": "'$STORE_A_ID'",
    "customerName": "Test Customer",
    "items": [{"menuItemId": "item1", "quantity": 2}]
  }' | jq -r '.id')

# Login as Manager B
MANAGER_B_TOKEN=$(curl -s -X POST http://localhost:8082/api/users/login \
  -H "Content-Type: application/json" \
  -d '{"email":"manager_b@test.com","password":"Test@123"}' | jq -r '.accessToken')

# Try to access Store A's order from Store B
curl -X GET "http://localhost:8083/api/orders/$ORDER_ID" \
  -H "Authorization: Bearer $MANAGER_B_TOKEN" \
  -H "X-Store-Id: $STORE_B_ID"
```

**Verification:**
- Response should be 403 or 404
- Manager B should NOT see Store A's order details

---

### TEST-SEC-003: Payment Cross-Store Access Prevention ✅ SHOULD PASS
**Status:** EXPECTED TO PASS
**Severity:** P0 - CRITICAL
**JIRA:** CRIT-003

**Steps:**
1. Create payment transaction for Store A order
2. Login as Manager B (Store B)
3. Try to access Store A's transaction
4. **Expected:** 403 Forbidden
5. **Actual (Predicted):** Should be blocked by validateStoreAccess() ✓

**cURL Commands:**
```bash
# Manager B tries to access Store A transaction
curl -X GET "http://localhost:8084/api/payments/$TRANSACTION_ID" \
  -H "Authorization: Bearer $MANAGER_B_TOKEN" \
  -H "X-Store-Id: $STORE_B_ID"
```

**Evidence Location:** `PaymentController.java:44-52` - validateStoreAccess() method

---

### TEST-SEC-004: Staff Without StoreId Rejected ✅ SHOULD PASS
**Status:** EXPECTED TO PASS
**Severity:** P1 - HIGH
**JIRA:** SEC-002

**Steps:**
1. Create staff user without storeId in JWT
2. Try to access any staff endpoint
3. **Expected:** 403 Forbidden from Gateway
4. **Actual (Predicted):** Gateway blocks at line 66-69 ✓

**cURL Command:**
```bash
# Try to login as staff without store assignment (should fail during token generation)
curl -X POST http://localhost:8082/api/users/login \
  -H "Content-Type: application/json" \
  -d '{"email":"staff_no_store@test.com","password":"Test@123"}'
```

**Evidence Location:** `JwtAuthenticationFilter.java:66-69` - Validates storeId for staff roles

---

## Test Suite 2: GDPR Compliance Tests

### TEST-GDPR-001: Customer Deletion Anonymization ✅ SHOULD PASS
**Status:** EXPECTED TO PASS
**Severity:** P0 - CRITICAL
**JIRA:** CRIT-004

**Steps:**
1. Create customer with PII (name, email, phone)
2. Customer places 2 orders
3. Call DELETE /api/customers/{id}/gdpr
4. Verify customer data anonymized:
   - name → "DELETED_USER"
   - email → "deleted_{id}@anonymized.local"
   - phone → "0000000000"
5. Verify orders still exist but customer info anonymized

**cURL Commands:**
```bash
# Create customer
CUSTOMER_ID=$(curl -s -X POST http://localhost:8086/api/customers \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john.doe@test.com",
    "phone": "9876543210",
    "storeId": "'$STORE_A_ID'"
  }' | jq -r '.id')

# Delete customer (GDPR)
curl -X DELETE "http://localhost:8086/api/customers/$CUSTOMER_ID/gdpr" \
  -H "Authorization: Bearer $MANAGER_A_TOKEN"

# Verify anonymization
curl -X GET "http://localhost:8086/api/customers/$CUSTOMER_ID" \
  -H "Authorization: Bearer $MANAGER_A_TOKEN" | jq '.name, .email, .phone'
```

**Expected Output:**
```json
{
  "name": "DELETED_USER",
  "email": "deleted_xxx@anonymized.local",
  "phone": "0000000000"
}
```

---

### TEST-GDPR-002: PII Encryption in Payments ✅ SHOULD PASS
**Status:** EXPECTED TO PASS
**Severity:** P0 - CRITICAL
**JIRA:** CRIT-005

**Steps:**
1. Create payment transaction with customer email/phone
2. Query MongoDB directly to check raw data
3. **Expected:** Email and phone stored as Base64 encrypted strings
4. **Actual (Predicted):** EncryptionService encrypts before save ✓

**MongoDB Query:**
```javascript
// Connect to MongoDB
mongosh mongodb://localhost:27017/masova_payments

// Query transaction
db.transactions.findOne({orderId: "ORDER_123"})

// Verify customerEmail and customerPhone are encrypted (Base64 strings)
```

**Evidence Location:** `PaymentService.java` - Uses EncryptionService for PII fields

---

### TEST-GDPR-003: PII Not in Logs ✅ SHOULD PASS
**Status:** EXPECTED TO PASS
**Severity:** P1 - HIGH
**JIRA:** GDPR-001

**Steps:**
1. Trigger actions that log PII (login, order creation, email sending)
2. Check application logs
3. **Expected:** PII is masked (e.g., j***@example.com, ***7890)
4. **Actual (Predicted):** PiiMasker utility properly masks ✓

**Log Verification:**
```bash
# Check user-service logs for masked email
tail -f user-service/logs/application.log | grep "Authentication attempt"

# Should see: "Authentication attempt for email: j***@example.com"
# Should NOT see: "Authentication attempt for email: john@example.com"
```

**Evidence Location:** `UserService.java`, `EmailService.java` - Uses PiiMasker

---

### TEST-GDPR-004: Consent Defaults to FALSE ✅ SHOULD PASS
**Status:** EXPECTED TO PASS
**Severity:** P0 - CRITICAL
**JIRA:** CRIT-006

**Steps:**
1. Create new customer without specifying consent
2. **Expected:** marketingOptIn=false, smsOptIn=false
3. **Actual (Predicted):** Defaults properly set ✓

**cURL Command:**
```bash
curl -X POST http://localhost:8086/api/customers \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Jane Doe",
    "email": "jane@test.com",
    "phone": "9123456789"
  }' | jq '.marketingOptIn, .smsOptIn'
```

**Expected Output:**
```json
false
false
```

**Evidence Location:** `Customer.java:71-72` - Defaults set to false

---

## Test Suite 3: Order & Payment Flow Tests

### TEST-ORDER-001: Complete Customer Order Flow ✅ SHOULD PASS
**Severity:** P0 - CRITICAL
**Flow:** Customer → Payment → Kitchen → Delivery → Completion

**Steps:**
1. Customer places order
2. Payment initiated
3. Payment verified
4. Order moves to kitchen (PREPARING → OVEN → BAKED)
5. Driver assigned
6. Order dispatched
7. Driver accepts delivery
8. OTP generated
9. Delivery verified with OTP
10. Order completed

**Notifications Expected at Each Stage:**
- Order confirmed
- Payment successful
- Order preparing
- Order ready
- Driver assigned
- Driver en route
- Order delivered

**cURL Test Sequence:**
```bash
# 1. Customer places order
ORDER_RESPONSE=$(curl -s -X POST http://localhost:8083/api/orders \
  -H "Authorization: Bearer $CUSTOMER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "storeId": "'$STORE_A_ID'",
    "customerId": "'$CUSTOMER_A_ID'",
    "customerName": "Test Customer",
    "customerEmail": "customer@test.com",
    "customerPhone": "9876543210",
    "orderType": "DELIVERY",
    "deliveryAddress": {
      "street": "123 Test St",
      "city": "Mumbai",
      "pincode": "400001"
    },
    "items": [
      {"menuItemId": "pizza_margherita", "quantity": 2, "price": 299.0}
    ]
  }')

ORDER_ID=$(echo $ORDER_RESPONSE | jq -r '.id')
echo "Order created: $ORDER_ID"

# 2. Initiate payment
PAYMENT_RESPONSE=$(curl -s -X POST http://localhost:8084/api/payments/initiate \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "'$ORDER_ID'",
    "amount": 598.0,
    "storeId": "'$STORE_A_ID'",
    "customerEmail": "customer@test.com",
    "customerPhone": "9876543210"
  }')

RAZORPAY_ORDER_ID=$(echo $PAYMENT_RESPONSE | jq -r '.razorpayOrderId')
echo "Payment initiated: $RAZORPAY_ORDER_ID"

# 3. Simulate payment verification
curl -s -X POST http://localhost:8084/api/payments/verify \
  -H "Content-Type: application/json" \
  -d '{
    "razorpayOrderId": "'$RAZORPAY_ORDER_ID'",
    "razorpayPaymentId": "pay_test123",
    "razorpaySignature": "test_signature"
  }'

# 4. Staff moves order through kitchen stages
curl -s -X PATCH "http://localhost:8083/api/orders/$ORDER_ID/next-stage" \
  -H "Authorization: Bearer $STAFF_TOKEN"

# 5. Manager assigns driver
curl -s -X PATCH "http://localhost:8083/api/orders/$ORDER_ID/assign-driver" \
  -H "Authorization: Bearer $MANAGER_A_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"driverId": "'$DRIVER_A_ID'"}'

# 6. Generate delivery OTP
OTP_RESPONSE=$(curl -s -X POST "http://localhost:8087/api/delivery/$ORDER_ID/generate-otp" \
  -H "Authorization: Bearer $MANAGER_A_TOKEN")
DELIVERY_OTP=$(echo $OTP_RESPONSE | jq -r '.otp')

# 7. Driver accepts delivery
curl -s -X POST http://localhost:8087/api/delivery/accept \
  -H "Authorization: Bearer $DRIVER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "trackingId": "'$TRACKING_ID'",
    "driverId": "'$DRIVER_A_ID'",
    "estimatedPickupMinutes": 10
  }'

# 8. Verify delivery with OTP
curl -s -X POST http://localhost:8087/api/delivery/verify-otp \
  -H "Authorization: Bearer $DRIVER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "'$ORDER_ID'",
    "otp": "'$DELIVERY_OTP'",
    "driverId": "'$DRIVER_A_ID'"
  }'

# Verify order status is DELIVERED
curl -s -X GET "http://localhost:8083/api/orders/$ORDER_ID" \
  -H "Authorization: Bearer $CUSTOMER_TOKEN" | jq '.status'
```

---

## Test Suite 4: Real-Time Features

### TEST-REALTIME-001: Kitchen WebSocket Updates ✅ SHOULD PASS
**Severity:** P1 - HIGH
**JIRA:** RT-001

**Manual Test (Browser Console):**
```javascript
// In KDS page console
const ws = new WebSocket('ws://localhost:8083/ws/orders');
ws.onopen = () => {
  ws.send(JSON.stringify({
    type: 'SUBSCRIBE',
    topic: '/topic/store/STORE_A/kitchen'
  }));
};
ws.onmessage = (event) => {
  console.log('Order update:', JSON.parse(event.data));
};

// Then create an order and watch for WebSocket update
```

**Verification:**
- New orders appear instantly in KDS
- Status changes reflect immediately
- No 5-second polling delay

---

### TEST-REALTIME-002: Customer Order Tracking ✅ SHOULD PASS
**Severity:** P1 - HIGH
**JIRA:** RT-002

**Steps:**
1. Customer places order
2. Open tracking page
3. Staff updates order status
4. **Expected:** Customer sees update within 1 second
5. **Actual (Predicted):** WebSocket pushes update instantly ✓

**Evidence:** `useOrderTrackingWebSocket.ts` hook implemented

---

## Test Suite 5: Production Features

### TEST-PROD-001: Circuit Breakers Configured ✅ SHOULD PASS
**Severity:** P1 - HIGH
**JIRA:** PROD-001

**Test Steps:**
1. Stop Order Service
2. Call Analytics endpoint that depends on Order Service
3. **Expected:** Circuit breaker trips, fallback response returned
4. **Actual (Predicted):** Resilience4j handles gracefully ✓

**cURL Command:**
```bash
# Stop order-service
# Call analytics that needs order data
curl -X GET "http://localhost:8085/api/analytics/sales/today" \
  -H "Authorization: Bearer $MANAGER_TOKEN" \
  -H "X-Store-Id: $STORE_A_ID"

# Should return fallback response, not crash
```

**Evidence Location:** `CircuitBreakerConfiguration.java` - All services configured

---

### TEST-PROD-002: Correlation IDs in Logs ✅ SHOULD PASS
**Severity:** P2 - MEDIUM
**JIRA:** PROD-002

**Steps:**
1. Make API request with X-Correlation-ID header
2. Check logs across services
3. **Expected:** Same correlation ID in all service logs
4. **Actual (Predicted):** CorrelationIdFilter + Interceptor propagate ✓

**Test Command:**
```bash
curl -X GET "http://localhost:8083/api/orders/kitchen" \
  -H "Authorization: Bearer $STAFF_TOKEN" \
  -H "X-Correlation-ID: test-correlation-123" \
  -H "X-Store-Id: $STORE_A_ID"

# Check logs
grep "test-correlation-123" */logs/application.log
```

---

### TEST-PROD-003: Dynamic Delivery Fee Calculation ✅ SHOULD PASS
**Severity:** P1 - HIGH
**JIRA:** HARD-001

**Steps:**
1. Place order with delivery address at different distances
2. **Expected:** Fees calculated based on zones (Zone A: 30, B: 50, C: 80)
3. **Actual (Predicted):** DeliveryZoneService calculates dynamically ✓

**cURL Command:**
```bash
# Check delivery fee for address
curl -X GET "http://localhost:8087/api/delivery/zone/fee?storeId=$STORE_A_ID&lat=19.0760&lon=72.8777" \
  -H "Authorization: Bearer $MANAGER_TOKEN"
```

**Evidence Location:** `DeliveryZoneService.java` - Zone-based pricing

---

### TEST-PROD-004: Dynamic Tax Calculation ✅ SHOULD PASS
**Severity:** P1 - HIGH
**JIRA:** HARD-002

**Steps:**
1. Create order in Maharashtra (5% GST)
2. Create order in different state if configured
3. **Expected:** Tax calculated per state from TaxConfiguration
4. **Actual (Predicted):** Works ✓

**Evidence Location:** `TaxConfiguration.java` - State-specific rates

---

### TEST-PROD-005: Dynamic Preparation Time ✅ SHOULD PASS
**Severity:** P2 - MEDIUM
**JIRA:** HARD-003

**Steps:**
1. Create order during rush hour (12-2 PM or 7-9 PM)
2. **Expected:** Prep time has 1.5x multiplier
3. Create order during non-rush hour
4. **Expected:** Normal prep time

**Evidence Location:** `PreparationTimeConfiguration.java:84-91` - isRushHour() check

---

## Test Suite 6: Edge Cases & Error Handling

### TEST-ERROR-001: Standardized Error Responses ✅ SHOULD PASS
**Severity:** P2 - MEDIUM
**JIRA:** PROD-005

**Steps:**
1. Make invalid API request (e.g., wrong data type)
2. **Expected:** ErrorResponse with correlationId, error code, message
3. **Actual (Predicted):** GlobalExceptionHandler returns standard format ✓

**Test Command:**
```bash
# Send invalid request
curl -X POST http://localhost:8083/api/orders \
  -H "Authorization: Bearer $CUSTOMER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"invalidField": "test"}'
```

**Expected Response Format:**
```json
{
  "status": 400,
  "error": "VALIDATION_FAILED",
  "message": "Request validation failed",
  "path": "/api/orders",
  "correlationId": "abc123",
  "timestamp": "2025-12-09T...",
  "validationErrors": {
    "customerName": "Customer name is required"
  }
}
```

---

## Summary: Test Execution Checklist

Once services are started, execute tests in this order:

### Phase 1: Critical Security (MUST PASS)
- [ ] TEST-SEC-001: Analytics Authorization (WILL FAIL - needs fix)
- [ ] TEST-SEC-002: Store Data Isolation
- [ ] TEST-SEC-003: Payment Cross-Store Access
- [ ] TEST-SEC-004: Staff Without StoreId

### Phase 2: GDPR Compliance (MUST PASS)
- [ ] TEST-GDPR-001: Customer Deletion Anonymization
- [ ] TEST-GDPR-002: PII Encryption in Payments
- [ ] TEST-GDPR-003: PII Not in Logs
- [ ] TEST-GDPR-004: Consent Defaults

### Phase 3: Business Flows (HIGH PRIORITY)
- [ ] TEST-ORDER-001: Complete Order Flow
- [ ] TEST-REALTIME-001: Kitchen WebSocket
- [ ] TEST-REALTIME-002: Customer Tracking WebSocket

### Phase 4: Production Features (MEDIUM PRIORITY)
- [ ] TEST-PROD-001: Circuit Breakers
- [ ] TEST-PROD-002: Correlation IDs
- [ ] TEST-PROD-003: Dynamic Delivery Fees
- [ ] TEST-PROD-004: Dynamic Tax Calculation
- [ ] TEST-PROD-005: Dynamic Preparation Time

### Phase 5: Error Handling (NICE TO HAVE)
- [ ] TEST-ERROR-001: Standardized Errors

---

## Known Issues to Fix Before Testing

### Issue #1: Analytics Missing Authorization ❌ BLOCKING
**File:** `analytics-service/src/main/java/com/MaSoVa/analytics/controller/AnalyticsController.java`
**Fix Required:** Add `@PreAuthorize("hasAnyRole('MANAGER', 'ASSISTANT_MANAGER')")` to ALL endpoints

### Issue #2: API Gateway Default JWT Secret ⚠️ WARNING
**File:** `api-gateway/src/main/java/com/MaSoVa/gateway/filter/JwtAuthenticationFilter.java:26`
**Fix Required:** Remove default, add @PostConstruct validation

---

**Ready to execute tests once services are running!**
