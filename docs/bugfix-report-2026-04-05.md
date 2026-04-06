# MaSoVa Bug Fix Report — 2026-04-05 Test Suite Run

This document categorizes every error from the `masova-logs/` test run into three buckets:
1. **Source code bugs** — code that needs to be changed
2. **Test suite bugs** — tests sending wrong data / hitting wrong endpoints
3. **Deploy/environment issues** — stale binaries on Dell, missing config

Each fix includes the exact file, line, and what to change.

---

## Part 1: Source Code Fixes

### FIX-S1: RabbitMQ MessageConverter missing JavaTimeModule (CRITICAL)

**Symptom:** Every `OrderCreatedEvent` and `OrderStatusChangedEvent` publish fails:
```
[AMQP] Failed to publish OrderCreatedEvent orderId=...: Failed to convert Message content
```
Also causes intelligence-service consumer failure:
```
Cannot convert from [[B] to [PaymentCompletedEvent]
contentType=application/x-java-serialized-object
```

**Root cause:** `Jackson2JsonMessageConverter` in `MaSoVaRabbitMQConfig` is constructed with the default `ObjectMapper`, which doesn't have `JavaTimeModule`. It fails to serialize `DomainEvent.occurredAt` (`Instant`), causing RabbitTemplate to fall back to Java serialization. The consumer side then receives `application/x-java-serialized-object` and can't deserialize it with its JSON converter.

**File:** `shared-models/src/main/java/com/MaSoVa/shared/messaging/config/MaSoVaRabbitMQConfig.java`

**Change lines 107-109 from:**
```java
@Bean
public MessageConverter jsonMessageConverter() {
    return new Jackson2JsonMessageConverter();
}
```

**To:**
```java
@Bean
public MessageConverter jsonMessageConverter() {
    ObjectMapper mapper = new ObjectMapper();
    mapper.registerModule(new com.fasterxml.jackson.datatype.jsr310.JavaTimeModule());
    mapper.disable(com.fasterxml.jackson.databind.SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
    return new Jackson2JsonMessageConverter(mapper);
}
```

**Add imports at top:**
```java
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
```

**After deploying:** Delete the old RabbitMQ queues so stale Java-serialized messages don't poison the consumer:
```bash
# On Dell, in the RabbitMQ management UI or via CLI:
rabbitmqctl purge_queue masova.analytics.order-events
rabbitmqctl purge_queue masova.analytics.payment-events
rabbitmqctl purge_queue masova.notification.order-events
```

**Impact:** Fixes ALL AMQP publish errors in commerce-service AND the consumer crash in intelligence-service. This is the single highest-impact fix.

---

### FIX-S2: MenuController `copy-menu` expects query params, not JSON body

**Symptom:**
```
Required request parameter 'sourceStoreId' for method parameter type String is not present
```

**Root cause:** The endpoint signature uses `@RequestParam`:
```java
@PostMapping("/copy-menu")
public ResponseEntity<Map<String, Object>> copyMenuBetweenStores(
        @RequestParam String sourceStoreId,
        @RequestParam String targetStoreId)
```

But the test sends `sourceStoreId` and `targetStoreId` in the JSON body. Spring MVC doesn't extract `@RequestParam` from a JSON body — only from query string or form data.

**Decision: Fix the code (not the test).** The test sends a POST with a JSON body, which is the more RESTful convention for an action endpoint. The test suite is the API consumer, so fixing the code to accept the body is the right call.

**File:** `commerce-service/src/main/java/com/MaSoVa/commerce/menu/controller/MenuController.java` (around line 176)

**Change from:**
```java
@PostMapping("/copy-menu")
public ResponseEntity<Map<String, Object>> copyMenuBetweenStores(
        @RequestParam String sourceStoreId,
        @RequestParam String targetStoreId) {
```

**To:**
```java
@PostMapping("/copy-menu")
public ResponseEntity<Map<String, Object>> copyMenuBetweenStores(
        @RequestBody Map<String, String> request) {
    String sourceStoreId = request.get("sourceStoreId");
    String targetStoreId = request.get("targetStoreId");
    if (sourceStoreId == null || targetStoreId == null) {
        return ResponseEntity.badRequest().body(Map.of("error", "sourceStoreId and targetStoreId are required"));
    }
```

---

### FIX-S3: Payment service needs idempotency on initiate

**Symptom:**
```
E11000 duplicate key error collection: masova_payment.transactions index: orderId dup key: { orderId: "..." }
```

**Root cause:** `PaymentService.initiatePayment()` always creates a new `Transaction` document. If the test (or a real client) calls `POST /api/payments/initiate` twice for the same order, it fails with a duplicate key on the `orderId` unique index.

**File:** `payment-service/src/main/java/com/MaSoVa/payment/service/PaymentService.java`

**Fix:** At the start of `initiatePayment()`, check if a transaction already exists for the orderId. If it does, return the existing transaction instead of creating a new one.

```java
// Add at the start of initiatePayment():
Optional<Transaction> existing = transactionRepository.findByOrderId(orderId);
if (existing.isPresent()) {
    log.info("Transaction already exists for orderId={}, returning existing", orderId);
    return existing.get();
}
```

---

### FIX-S4: Logistics `PurchaseOrder` needs auto-generated `orderNumber`

**Symptom:**
```
E11000 duplicate key error collection: masova_logistics.purchase_orders
index: orderNumber dup key: { orderNumber: null }
```

**Root cause:** The `orderNumber` field has a unique index but no auto-generation. When a purchase order is created without explicitly setting `orderNumber`, it stays `null`. The second PO also has `null`, causing a dup key collision.

**File:** The purchase order service class (likely `logistics-service/src/main/java/com/MaSoVa/logistics/inventory/service/PurchaseOrderService.java`)

**Fix:** In the `createPurchaseOrder()` method, auto-generate `orderNumber` before saving:

```java
if (purchaseOrder.getOrderNumber() == null || purchaseOrder.getOrderNumber().isBlank()) {
    purchaseOrder.setOrderNumber("PO-" + System.currentTimeMillis());
}
```

---

### FIX-S5: `OrderController.getCustomerOrders` is too restrictive

**Symptom:**
```
AccessDeniedException: Access Denied
```
on `GET /api/orders/customer/{customerId}` when called with a manager token.

**Root cause:** The endpoint has `@PreAuthorize("hasRole('CUSTOMER')")` which blocks managers from viewing customer orders. Managers need this for the POS/staff dashboard. This also causes the downstream `OrderServiceClient` in core-service to get a 400 "Access Denied" during GDPR data export.

**File:** `commerce-service/src/main/java/com/MaSoVa/commerce/order/controller/OrderController.java` (line 174)

**Change from:**
```java
@PreAuthorize("hasRole('CUSTOMER')")
```

**To:**
```java
@PreAuthorize("hasAnyRole('CUSTOMER', 'MANAGER', 'STAFF')")
```

---

### FIX-S6: `UserService.deactivateUser` crashes when no active session exists

**Symptom:**
```
Failed to end session during deactivation for user ...: No active session found
```

**Root cause:** `UserService.deactivateUser()` calls `WorkingSessionService.endSession()` which throws `RuntimeException("No active session found")`. The deactivation code doesn't wrap this in a try/catch, so the entire deactivation fails if the user never started a working session.

**File:** `core-service/src/main/java/com/MaSoVa/core/user/service/UserService.java`

**Fix:** Wrap the session-end call in a try/catch that logs a warning but continues deactivation:

```java
// In deactivateUser(), around the endSession call:
try {
    workingSessionService.endSession(userId);
} catch (RuntimeException e) {
    log.warn("No active session to end during deactivation for user {}: {}", userId, e.getMessage());
}
```

---

### FIX-S7: Duplicate store codes cause `IncorrectResultSizeDataAccessException`

**Symptom:**
```
Query { "code" : "DOM001"} returned non unique result
```
Appears 3 times in core-service log — multiple stores with code `DOM001` exist in MongoDB.

**Root cause:** `StoreRepository.findByCode("DOM001")` returns more than one document. Either the test data seeder creates duplicate stores, or there's no unique index on `code`.

**File:** `core-service/src/main/java/com/MaSoVa/core/...` (store entity/repository)

**Fix:**
1. Add a unique index on `Store.code` (`@Indexed(unique = true)`)
2. Clean up duplicate stores in the database: `db.stores.find({code: "DOM001"})` — delete all but one
3. The test data seeder should use `findByCode` + create-if-not-exists pattern

---

### FIX-S8: `Address` DTO missing `@JsonIgnoreProperties` — rejects `postalCode`

**Symptom:**
```
Unrecognized field "postalCode" (class com.MaSoVa.shared.model.Address), not marked as ignorable
(7 known properties: "state", "pincode", "street", "landmark", "city", "latitude", "longitude")
```

**Root cause:** The `Address` class has a field called `pincode` but the test sends `postalCode`. The class also lacks `@JsonIgnoreProperties(ignoreUnknown = true)`.

**Decision: Fix BOTH.** Add `@JsonIgnoreProperties` to `Address` for forward compatibility. The test should also send `pincode` (the correct field name), but the class should be tolerant.

**File:** `shared-models/src/main/java/com/MaSoVa/shared/model/Address.java`

**Fix:** Add annotation:
```java
@JsonIgnoreProperties(ignoreUnknown = true)
public class Address {
```

---

### FIX-S9: `CustomerService` caching null values crashes Redis

**Symptom:**
```
Cache 'customers' does not allow 'null' values; Avoid storing null via '@Cacheable(unless="#result == null")'
or configure RedisCache to allow 'null' via RedisCacheConfiguration
```
Appears 3 times.

**Root cause:** `@Cacheable("customers")` on a method that returns `null` when customer not found. Redis default config disallows null values.

**File:** `core-service/src/main/java/com/MaSoVa/core/customer/service/CustomerService.java`

**Fix:** Add null guard to the `@Cacheable` annotation:
```java
@Cacheable(value = "customers", unless = "#result == null")
```

---

### FIX-S10: `NullPointerException` in review analytics — `type` is null

**Symptom:**
```
NullPointerException: Cannot invoke "java.lang.Class.isEnum()" because "type" is null
```

**Root cause:** A MongoDB query or aggregation tries to deserialize a document with a null field that Spring Data expects to have a type. Likely a review aggregation pipeline hitting a malformed document.

**File:** Needs investigation — likely `core-service/src/main/java/com/MaSoVa/core/review/service/ReviewService.java` or its repository.

**Fix:** Check the review aggregation methods for null-safe handling. This may also be caused by a review document created with missing fields from the test suite (which sends `rating` instead of `overallRating`).

---

### FIX-S11: Payment service needs graceful handling of "transaction not found"

**Symptom:**
```
Error fetching transaction: Transaction not found: {orderId}
Error marking transaction as reconciled: Transaction not found: {orderId}
Error initiating refund: Transaction not found: {orderId}
Error fetching refund: Refund not found: {orderId}
```

**Root cause:** The test calls fetch/reconcile/refund using the **order ID** as the transaction ID, but the payment service `initiatePayment` failed (FIX-S3 dup key), so no transaction was created for the second order. These are cascading errors from FIX-S3.

**Fix:** FIX-S3 (idempotency check) will prevent the initial failure. The remaining "not found" errors will resolve once the transaction is created successfully. However, the fetch/reconcile endpoints should also return 404 instead of 500 when a transaction doesn't exist:

```java
// In PaymentService.getTransaction():
// Change: throw new RuntimeException("Transaction not found: " + id);
// To: throw new TransactionNotFoundException(id);  // mapped to 404 in controller
```

---

### FIX-S12: Customer controller missing `GET /{id}/addresses` and `GET /{id}/loyalty` endpoints

**Symptom:**
```
GET /api/customers/{id}/addresses → HttpRequestMethodNotSupportedException: GET not supported
GET /api/customers/{id}/loyalty → NoResourceFoundException: No static resource
```

**Root cause:** The `CustomerController` has POST/PATCH/DELETE for addresses and POST for loyalty, but no GET endpoints to retrieve them. The `CustomerServiceClient` (used by GDPR portability/data export in `UserService`) calls `GET /api/customers/{id}/addresses` and `GET /api/customers/{id}/loyalty` — but these endpoints don't exist.

**File:** `core-service/src/main/java/com/MaSoVa/core/customer/controller/CustomerController.java`

**Fix:** Add two GET endpoints:

```java
@GetMapping("/{id}/addresses")
@Operation(summary = "Get customer addresses")
public ResponseEntity<List<Address>> getAddresses(@PathVariable String id) {
    return ResponseEntity.ok(customerService.getAddresses(id));
}

@GetMapping("/{id}/loyalty")
@Operation(summary = "Get customer loyalty info")
public ResponseEntity<?> getLoyaltyInfo(@PathVariable String id) {
    return ResponseEntity.ok(customerService.getLoyaltyInfo(id));
}
```

(The actual service methods may already exist — just the controller endpoints are missing.)

**Impact:** Fixes the `CustomerServiceClient` 500 errors during GDPR data export (Chain 5 below).

---

### FIX-S13: Kiosk creation needs idempotency on phone number

**Symptom:**
```
E11000 duplicate key error collection: masova_core.users index: personalInfo.phone dup key: { personalInfo.phone: "0000000000" }
```

**Root cause:** The test (or subsequent test runs) calls `createKioskAccount` with phone `0000000000` when a kiosk with that phone already exists from a prior run. The kiosk creation code doesn't check for existing kiosk before inserting.

**File:** `core-service/src/main/java/com/MaSoVa/core/user/service/UserService.java` (or wherever kiosk creation lives)

**Fix:** Check for existing kiosk by phone before creating:
```java
Optional<User> existing = userRepository.findByPersonalInfoPhone("0000000000");
if (existing.isPresent() && existing.get().getUserType() == UserType.KIOSK) {
    return existing.get(); // Return existing kiosk
}
```

---

## Part 2: Deploy / Environment Fixes (Dell Recompile Required)

These are NOT code bugs — the source files already contain the fix but Dell is running stale compiled classes.

### FIX-D1: Recompile and restart ALL services on Dell

The following files have been modified in git but the running services are on old bytecode:

| File | Error it causes |
|------|----------------|
| `KitchenEquipment.java` (EquipmentStatus enum) | `No enum constant OPERATIONAL` |
| `KitchenEquipmentController.java` (maintenance date parse) | `unparsed text found at index 23` |
| `OrderController.java` (setDeliveryOtp null checks) | `NullPointerException: text` |
| `OrderService.java` (QualityCheckpoint null-safe filter) | `NullPointerException: getCheckpointName() is null` |
| `RejectionRequest.java` (@JsonIgnoreProperties) | `Unrecognized field "rejectedBy"` |
| `CancellationRequest.java` (@JsonIgnoreProperties) | `Unrecognized field "cancelledBy"` |
| `RouteOptimizationRequest.java` (@JsonIgnoreProperties) | `Unrecognized field "driverId"` |
| `LocationUpdateRequest.java` (@JsonIgnoreProperties) | `Unrecognized field "orderId"` |
| `DeliveryVerificationRequest.java` (@JsonIgnoreProperties) | `Unrecognized field "photoUrl"` / `"signatureUrl"` |
| `WasteRecord.java` (@JsonIgnoreProperties) | `Unrecognized field "reason"` |

**Action on Dell (PowerShell):**
```powershell
# Stop all services, then rebuild from root:
cd D:\projects\masova-platform
mvn clean install "-Dmaven.test.skip=true"

# Restart each service:
cd shared-models && mvn install "-Dmaven.test.skip=true" && cd ..
cd core-service && mvn spring-boot:run "-Dmaven.test.skip=true"
cd commerce-service && mvn spring-boot:run "-Dmaven.test.skip=true"
cd logistics-service && mvn spring-boot:run "-Dmaven.test.skip=true"
cd payment-service && mvn spring-boot:run "-Dmaven.test.skip=true"
cd intelligence-service && mvn spring-boot:run "-Dmaven.test.skip=true"
```

### FIX-D2: Flush Redis cache

**Symptom:** `LinkedHashMap cannot be cast to SalesForecastResponse` (and ChurnPredictionResponse, DemandForecastResponse, CostAnalysisResponse, BenchmarkingResponse, ExecutiveSummaryResponse) in intelligence-service. Also `LinkedHashMap cannot be cast to User` in core-service.

**Root cause:** Redis cache contains values serialized by a previous version of the code. The `GenericJackson2JsonRedisSerializer` with `activateDefaultTyping` stores `@class` type hints, but when the class structure changes (or the cache was written before the custom CacheConfig existed), the deserialized object becomes a `LinkedHashMap` instead of the expected DTO.

**Action on Dell:**
```powershell
docker exec -it masova-redis redis-cli FLUSHALL
```

### FIX-D3: Brevo API key missing

**Symptom:** `Brevo API error. Status: 401, Body: {"message":"authentication not found in headers"}`

**Action:** Add the Brevo API key to `core-service/src/main/resources/application-dev.yml`:
```yaml
brevo:
  api-key: ${BREVO_API_KEY:your-api-key-here}
```

Or set environment variable `BREVO_API_KEY` before starting core-service. If you don't have a Brevo account for dev, this error is harmless — email notifications just won't send.

---

## Part 3: Test Suite Fixes

File: `scripts/test-api-full.js`

### FIX-T1: `copy-menu` sends body but endpoint expects query params

**If FIX-S2 is applied (recommended),** no test change needed.

**If keeping `@RequestParam`:** Change lines 689-694 from:
```javascript
const rCopy = await req(`${S.commerce}/api/menu/copy-menu`, {
  method: 'POST', ...menuMgrOpts,
  body: { sourceStoreId: D.storeId001, targetStoreId: D.storeId003 },
});
```
**To:**
```javascript
const rCopy = await req(`${S.commerce}/api/menu/copy-menu?sourceStoreId=${D.storeId001}&targetStoreId=${D.storeId003}`, {
  method: 'POST', ...menuMgrOpts,
});
```

### FIX-T2: `PUT /api/orders/customer/{id}/anonymize` — endpoint doesn't exist in commerce-service

**Line ~around the anonymize tests in the orders section.**

The anonymize endpoint is in **core-service** (`CustomerService.anonymizeAndDeleteCustomer`), not commerce-service. The test hits `/api/orders/customer/{id}/anonymize` on commerce-service which has no such mapping.

**Fix:** Either remove this test or point it at core-service:
```javascript
// Change from:
await req(`${S.commerce}/api/orders/customer/${D.customerId}/anonymize`, ...);
// To:
await req(`${S.core}/api/customers/${D.customerId}/anonymize`, ...);
```

Verify that the core-service customer controller actually exposes a `PUT /api/customers/{id}/anonymize` endpoint first.

### FIX-T3: `GET /api/delivery/customer/{id}` — endpoint doesn't exist in logistics-service

The test hits `/api/delivery/customer/{customerId}` which doesn't exist. Spring treats it as a static resource request and returns 404.

**Fix:** Remove this test, or if the intent is to get deliveries by customer, check what endpoints the delivery controller actually exposes and use the correct path.

### FIX-T4: Purchase order `reject` sends `rejectedBy` but DTO has `rejectionReason` + `storeId`

Even after FIX-D1 (recompile with `@JsonIgnoreProperties`), the test sends `rejectedBy` which gets ignored — and never sends `rejectionReason`, which is the actual field.

**Lines 1829-1832 — change from:**
```javascript
body: { rejectedBy: D.managerId, reason: 'API test rejection' },
```

**To:**
```javascript
body: { rejectionReason: 'API test rejection', storeId: D.storeId001 || 'DOM001' },
```

### FIX-T5: Purchase order `cancel` sends `cancelledBy` but DTO has `reason` + `storeId`

**Lines 1836-1839 — change from:**
```javascript
body: { cancelledBy: D.managerId, reason: 'API test cancel' },
```

**To:**
```javascript
body: { reason: 'API test cancel', storeId: D.storeId001 || 'DOM001' },
```

### FIX-T6: Waste record `PUT` sends `reason` but entity field is `wasteReason`

Even with `@JsonIgnoreProperties(ignoreUnknown = true)` on `WasteRecord`, the field `reason` maps to nothing. The entity field is `wasteReason`.

**Lines 1894-1896 — change from:**
```javascript
body: { quantity: 2, reason: 'SPOILAGE', notes: 'Updated via API test' },
```

**To:**
```javascript
body: { quantity: 2, wasteReason: 'SPOILAGE', notes: 'Updated via API test' },
```

### FIX-T7: Store metrics test passes MongoDB `_id` as `storeCode`

**Symptom:** `Store not found with code: 69a2eed14642c64a6d1c59f6`

The test passes `D.storeId001` (a MongoDB ObjectId) in the `X-Selected-Store-Id` header, but `StoreService.getMetrics` looks up by `storeCode` (e.g., `DOM001`).

**Lines 556-562 — change from:**
```javascript
headers: { 'X-Selected-Store-Id': D.storeId001, 'X-User-Store-Id': D.storeId001, ... },
```

**To:**
```javascript
headers: { 'X-Selected-Store-Id': 'DOM001', 'X-User-Store-Id': 'DOM001', ... },
```

### FIX-T8: Delivery lifecycle tests run out of order

**Symptom:** `Delivery is already marked as delivered`, `Cannot be rejected. Status: DELIVERED`, `OTP can only be regenerated for dispatched orders`

The delivery tests mark an order as delivered, then try to reject it and regenerate OTP. These state transitions are one-way.

**Fix:** Restructure the delivery test section to:
1. Create delivery → dispatch → update location → verify OTP → mark delivered (happy path)
2. Create a **second** delivery for reject/regenerate-otp tests
3. Don't try to reject an already-delivered order

### FIX-T9: `GET /api/v1/orders/customer/{customerId}` uses customer token but endpoint needs `CUSTOMER` role

The test at lines 2174-2177 calls:
```javascript
const rCust = await req(`${S.commerce}/api/v1/orders/customer/${D.customerId}`, { token: tok.customer });
```

This uses `D.customerId` (the customer's **User** ID), but `getCustomerOrders` expects the customer **profile** ID from core-service. Also, the test calls the v1 path with `tok.customer` but the `@PreAuthorize` only allows `CUSTOMER` role — the JWT's role field needs to be `ROLE_CUSTOMER` for Spring Security.

**After FIX-S5 (broadening PreAuthorize):** this will also work with manager tokens.

**Fix:** Use manager token with the correct customer profile ID:
```javascript
const rCust = await req(`${S.commerce}/api/v1/orders/customer/${D.customerProfileId || D.customerId}`, mgrOpts);
```

### FIX-T10: Inventory adjust uses `menuItemId` instead of `inventoryItemId`

**Symptom:** `Inventory item not found: 69d236153600e6131b5ea1d2` — this is a commerce-service menuItemId being used as a logistics inventory item ID.

The `InventoryServiceClient` in commerce-service sends the `menuItemId` to logistics-service's `/api/inventory/items/{id}/adjust`. But logistics-service inventory items have their own IDs (created by the inventory test section).

**Fix:** This is a commerce-service `InventoryServiceClient` issue. The stock adjustment should look up inventory items by a shared key (like `itemCode` or `menuItemId` field on the inventory item), not by using the MongoDB `_id` directly. Two options:
- **Option A:** Add a `menuItemId` field to `InventoryItem` in logistics-service and query by that
- **Option B:** Skip inventory adjustment when the menuItemId doesn't map to an inventory item (current behavior is to log a warning — this is acceptable for now)

**For the test suite specifically:** The inventory tests create their own items and work fine. The error comes from the **order** tests triggering stock adjustment via `InventoryServiceClient`. No test change needed — fix the client or accept the warning.

### FIX-T11: Kiosk tests — deactivate then regenerate tokens (impossible)

**Symptom:** `Error regenerating kiosk tokens: Kiosk account is deactivated`

**Root cause:** The test deactivates the kiosk account and then immediately tries to regenerate tokens for it. A deactivated kiosk can't regenerate tokens — this is correct service behavior.

**Fix:** Either remove the regenerate-after-deactivate test, or restructure:
1. Test regenerate tokens first (while kiosk is active)
2. Then deactivate
3. Optionally test that regenerate correctly fails with 400 after deactivation (expected-failure test)

### FIX-T12: Loyalty `redeem` sends body but endpoint expects `@RequestParam` for `points`

**Symptom:**
```
Required request parameter 'points' for method parameter type int is not present
```

**Root cause:** The endpoint signature uses `@RequestParam int points` but the test sends `points` in the JSON request body.

**Decision: Fix the test.** The `redeem` endpoint takes `points` as a query parameter.

**Fix in test:** Change from:
```javascript
body: { points: 100, ... }
```
**To:**
```javascript
// Send points as query param:
await req(`${S.core}/api/customers/${id}/loyalty/redeem?points=100`, { method: 'POST', ...opts });
```

### FIX-T13: Purchase order delete test runs after PO is approved/sent/received

**Symptom:** `Can only delete draft or cancelled purchase orders`

**Root cause:** The test flow creates a PO → updates it → approves it → sends it → receives it → then tries to DELETE it. The PO is in `RECEIVED` status, not `DRAFT` or `CANCELLED`.

**Fix:** Restructure the PO test section:
1. Test CRUD: create → update → delete (while still `DRAFT`)
2. For lifecycle tests: create a second PO → approve → send → receive (don't try to delete this one)
3. Alternatively, test delete-after-cancel: create → cancel → delete

### FIX-T14: `AddLoyaltyPointsRequest` field mismatch — test sends `reason` but DTO expects `description`

**Symptom:**
```
Unrecognized field "reason" (class com.MaSoVa.core.customer.dto.request.AddLoyaltyPointsRequest),
not marked as ignorable (4 known properties: "orderId", "type", "points", "description")
```

**Root cause:** The test sends `{ reason: '...' }` but the DTO field is `description`.

**Fix in test:** Change `reason` to `description` in the loyalty add-points requests.

### FIX-T15: `UpdatePreferencesRequest` field mismatch — test sends `preferredCuisine`

**Symptom:**
```
Unrecognized field "preferredCuisine" (class com.MaSoVa.core.customer.dto.request.UpdatePreferencesRequest),
not marked as ignorable (8 known properties: "allergens", "cuisinePreferences", ...)
```

**Root cause:** The test sends `preferredCuisine` but the DTO field is `cuisinePreferences`.

**Fix in test:** Change `preferredCuisine` to `cuisinePreferences` in the update-preferences requests.

### FIX-T16: `UpdateOrderStatsRequest` field mismatch — test sends `orderAmount`

**Symptom:**
```
Unrecognized field "orderAmount" (class com.MaSoVa.core.customer.dto.request.UpdateOrderStatsRequest),
not marked as ignorable (4 known properties: "orderType", "orderId", "status", "orderTotal")
```

**Root cause:** The test sends `orderAmount` but the DTO field is `orderTotal`.

**Fix in test:** Change `orderAmount` to `orderTotal` in the update-order-stats requests.

### FIX-T17: `Campaign` entity field mismatch — test sends `content`

**Symptom:**
```
Unrecognized field "content" (class com.MaSoVa.core.notification.entity.Campaign),
not marked as ignorable (23 known properties: "channel", "delivered", "message", ...)
```

**Root cause:** The test sends `content` but the Campaign entity has `message` (for the body text).

**Fix in test:** Change `content` to `message` in the campaign creation request.

### FIX-T18: `CreateReviewRequest` field mismatch — test sends `rating`

**Symptom:**
```
Unrecognized field "rating" (class com.MaSoVa.core.review.dto.request.CreateReviewRequest),
not marked as ignorable (12 known properties: "deliveryRating", "serviceRating", ... "overallRating", ...)
```

**Root cause:** The test sends `rating` but the DTO has `overallRating`.

**Fix in test:** Change `rating` to `overallRating` in the create-review request.

### FIX-T19: Review response endpoint missing `X-User-ID` header

**Symptom:**
```
Required request header 'X-User-ID' for method parameter type String is not present
```

**Root cause:** The test hits a review response endpoint (likely `POST /api/reviews/{id}/response`) without the `X-User-ID` header.

**Fix in test:** Add `'X-User-ID': D.managerId` to the review response request headers.

### FIX-T20: `removeTags` endpoint called without request body

**Symptom:**
```
Required request body is missing: public ... CustomerController.removeTags(String, Set<String>)
```

**Root cause:** The test calls the remove-tags endpoint without a body. The endpoint expects a `Set<String>` body with tag names to remove.

**Fix in test:** Add a body with the tags to remove:
```javascript
body: ["test-tag"]
```

### FIX-T21: Address test sends `postalCode` instead of `pincode`

**Symptom:** Same as FIX-S8 — `Unrecognized field "postalCode"`.

**Root cause:** The `Address` class uses `pincode` not `postalCode`.

**Fix in test:** Change `postalCode` to `pincode` in the address creation/update requests. (FIX-S8 adds `@JsonIgnoreProperties` as defense-in-depth, but the test should still use the correct field name.)

### FIX-T22: GDPR portability/erasure/rectification tests send wrong request types

**Symptom:**
```
Error processing portability request: Request is not a portability request
Error processing erasure request: Request is not an erasure request
Error processing rectification request: Request is not a rectification request
```

**Root cause:** The GDPR controller checks a `type` field on the request body to determine what kind of GDPR request it is. The test either doesn't send the `type` field or sends the wrong value.

**Fix in test:** Ensure each GDPR request includes the correct `type` field:
```javascript
// Portability:
body: { type: 'PORTABILITY', customerId: D.customerId, ... }
// Erasure:
body: { type: 'ERASURE', customerId: D.customerId, ... }
// Rectification:
body: { type: 'RECTIFICATION', customerId: D.customerId, ... }
```

### FIX-T23: GDPR data download missing `token` query parameter

**Symptom:**
```
Required request parameter 'token' for method parameter type String is not present
```

**Root cause:** The GDPR download endpoint expects a `token` query parameter for authenticated downloads.

**Fix in test:** Add `?token=...` to the download URL (the token would be returned from the portability request).

### FIX-T24: Inventory item PUT sends existing item `_id` — duplicate key on `_id`

**Symptom:**
```
E11000 duplicate key error collection: masova_logistics.inventory_items index: _id_ dup key: { _id: ObjectId('...') }
```

**Root cause:** The test does a PUT to `/api/inventory/items/{id}` which the controller treats as "create/replace at this ID" rather than "update". If the item already exists, MongoDB rejects the insert.

**Fix:** This is either a test issue (should use PATCH for update) or a service issue (PUT handler should use `save()` with the existing ID, not `insert()`). Check the controller method — if it calls `repository.insert()` instead of `repository.save()`, change it to `save()`.

### FIX-T25: Shift/session test sequence issues

**Symptom:**
```
Can only complete shifts that are in progress
Employee has overlapping shifts
No shifts found for previous week to copy
No active session found
Total break time cannot exceed 25% of shift duration. Maximum allowed: 0 minutes
```

**Root cause:** Test creates a shift but doesn't properly start it before trying to complete it. Also tries to add breaks with invalid timing. These are test sequence/data issues.

**Fix in test:** Restructure shift tests to:
1. Create shift → start shift → add break → complete shift (proper lifecycle)
2. Start a session before trying to end it
3. Copy-previous-week only after shifts exist for that week
4. Break time must be within 25% of shift duration

---

## Part 4: Expected / Harmless Errors (No Fix Needed)

| Error | Why it's OK |
|-------|------------|
| Google token verification failed (400 invalid_token) | Test sends `'fake-google-token'` — test itself marks this as PASS on 400/401/500 |
| `UpdateService: Error checking for updates: 404` | Startup check for a non-existent update endpoint — cosmetic |
| Payment webhook signature verification failed | Test sends fake webhook — expected behavior |
| `Transaction not found for Razorpay order: fake_order_id` / `fake2` | Test uses fake Razorpay IDs — expected |
| Brevo API 401 (core-service) | Dev env has no Brevo API key — email notifications just won't send (FIX-D3 optional) |
| `Failed to create customer profile - authentication issue` | Cascading from fake Google token test — the login failed so profile creation fails too |
| `Cannot modify order after preparation has started` (commerce) | Correct business logic — test advances order to PREPARING then tries to update items. Expected rejection. |
| `Access Denied` on shift complete/session end (core-service, lines 6254/6437) | Test calls shift/session endpoints with wrong auth or after deactivation — some are test sequence issues covered by FIX-T25 |

---

## Part 5: Cascading Error Chains

Understanding which errors cause other errors — fix the root and the cascade disappears.

### Chain 1: Payment dup key → fetch/reconcile/refund failures
- **Root:** FIX-S3 (payment idempotency)
- **Cascade:** Transaction not found for fetch, reconcile, refund, refund-fetch
- **Fix S3 and all 6+ payment "not found" errors go away**

### Chain 2: getCustomerOrders AccessDenied → GDPR data export failure
- **Root:** FIX-S5 (broaden PreAuthorize)
- **Cascade:** `OrderServiceClient` 400 "Access Denied" during GDPR portability/erasure
- **Fix S5 and the cross-service call succeeds**

### Chain 3: PaymentServiceClient 403 → GDPR anonymize failure
- **Root:** Payment service endpoints require auth that core-service's internal client doesn't have
- **Cascade:** `PaymentServiceClient` 403 → anonymizePayments fails → GDPR erasure partially fails
- **Fix:** Payment service needs a service-to-service auth mechanism or `@PreAuthorize` that allows internal calls. This is an architecture issue for Phase 3.

### Chain 4: Driver location 500 → malformed routing URL
- **Root:** Core-service has no endpoint at `api/users/drivers/{id}/location` (returns 404 → 500)
- **Cascade:** `UserServiceClient` gets 500 → `FreeRoutingService` builds URL with null lat/lng → "URL string malformed"
- **Fix:** Either create the driver location endpoint in core-service, or handle the 500 gracefully in AutoDispatchService.

### Chain 5: Duplicate store code → store metrics failure
- **Root:** FIX-S7 (duplicate stores with code "DOM001")
- **Cascade:** Every `findByCode("DOM001")` throws `IncorrectResultSizeDataAccessException`
- **Fix S7 (unique index + cleanup) and the metrics/lookup calls work**

### Chain 6: Missing customer GET endpoints → GDPR export failure
- **Root:** FIX-S12 (missing `GET /{id}/addresses` and `GET /{id}/loyalty`)
- **Cascade:** `CustomerServiceClient` gets 500 for addresses → circuit breaker fallback → 500 for loyalty → circuit breaker → 500 for preferences → all three return empty data in GDPR export
- **Fix S12 and the data export includes address/loyalty/preferences data**

### Chain 7: Redis null cache → customer profile fetch failure → GDPR cascade
- **Root:** FIX-S9 (caching null values)
- **Cascade:** `getCustomerProfile` caches null → `CustomerServiceClient` gets 400 cache error → all downstream lookups (addresses, loyalty, preferences) fail because profile lookup failed first
- **Fix S9 and the customer profile resolves, unblocking the rest**

---

## Execution Order

**Step 1 — Apply source code fixes (Mac, then push to Dell):**
1. FIX-S1: `MaSoVaRabbitMQConfig.java` — JavaTimeModule (CRITICAL — unblocks all AMQP)
2. FIX-S2: `MenuController.java` — accept JSON body for copy-menu
3. FIX-S3: `PaymentService.java` — idempotency check (unblocks Chain 1)
4. FIX-S4: `PurchaseOrderService.java` — auto-generate orderNumber
5. FIX-S5: `OrderController.java` — broaden PreAuthorize (unblocks Chain 2)
6. FIX-S6: `UserService.java` — graceful session-end during deactivation
7. FIX-S7: Store entity — unique index on `code` + cleanup duplicates
8. FIX-S8: `Address.java` — add `@JsonIgnoreProperties`
9. FIX-S9: `CustomerService.java` — `@Cacheable(unless="#result == null")`
10. FIX-S10: Review analytics — investigate NPE on null type (may resolve with FIX-T18)
11. FIX-S11: Payment service — return 404 not 500 for missing transactions
12. FIX-S12: `CustomerController.java` — add GET /{id}/addresses and GET /{id}/loyalty
13. FIX-S13: Kiosk creation — idempotency on phone number

**Step 2 — Apply test suite fixes (Mac):**
1. FIX-T1 through FIX-T10 (original fixes)
2. FIX-T11: Kiosk test sequence (regenerate before deactivate)
3. FIX-T12: Loyalty redeem — query param not body
4. FIX-T13: Purchase order delete — test while still DRAFT
5. FIX-T14: Loyalty add-points — `reason` → `description`
6. FIX-T15: Preferences — `preferredCuisine` → `cuisinePreferences`
7. FIX-T16: Order stats — `orderAmount` → `orderTotal`
8. FIX-T17: Campaign — `content` → `message`
9. FIX-T18: Review — `rating` → `overallRating`
10. FIX-T19: Review response — add `X-User-ID` header
11. FIX-T20: removeTags — add body with tag names
12. FIX-T21: Address — `postalCode` → `pincode`
13. FIX-T22: GDPR requests — add correct `type` field
14. FIX-T23: GDPR download — add `token` query param
15. FIX-T24: Inventory item PUT — fix to use update not insert
16. FIX-T25: Shift/session test sequence

**Step 3 — Dell environment:**
1. `git pull` on Dell
2. FIX-D1: `mvn clean install "-Dmaven.test.skip=true"` from root
3. FIX-D2: `docker exec -it masova-redis redis-cli FLUSHALL`
4. FIX-D3: Set Brevo API key (optional)
5. Purge RabbitMQ queues (for FIX-S1)
6. Clean up duplicate stores: `db.stores.deleteMany({code: "DOM001", _id: {$ne: ObjectId("<keep-this-one>")}})` (for FIX-S7)
7. Restart all services

**Step 4 — Re-run test suite:**
```bash
node scripts/test-api-full.js
```

Expected: all errors from this report should be gone. Remaining failures should only be the "Expected/Harmless" category.

---

## Summary

| Category | Count | Impact |
|----------|-------|--------|
| Source code fixes (FIX-S) | 13 | Real bugs — must fix |
| Deploy fixes (FIX-D) | 3 | Dell recompile + cache flush |
| Test suite fixes (FIX-T) | 25 | Wrong field names, wrong sequences, missing params |
| Cascading chains | 7 | Fix root cause, cascade disappears |
| Expected/harmless | 8 | No action needed |
