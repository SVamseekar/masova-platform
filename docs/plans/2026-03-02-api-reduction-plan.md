# API Reduction Implementation Plan: 471 → 125 Endpoints

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Reduce the MaSoVa API surface from 471 to 125 endpoints with zero feature loss by eliminating duplicate versioned paths, consolidating filter endpoints into query params, and removing dev-only test endpoints from production.

**Architecture:** Each service gets new clean controllers alongside the old ones, frontend RTK Query hooks are updated to new paths, then old controllers are removed. API Gateway routes are updated last.

**Tech Stack:** Spring Boot 3, Spring MVC, `@RequestMapping`, RTK Query (frontend), `test-api-full.js` (integration tests)

**Execution Order:** core-service → commerce-service → logistics-service → payment-service → intelligence-service → api-gateway → test-api-full.js update

---

## Prerequisites

Read the design doc first:
- `docs/plans/2026-03-02-api-reduction-design.md`

Services run on Dell at `192.168.50.88`. Ports:
- api-gateway: 8080, core-service: 8085, commerce-service: 8084
- logistics-service: 8086, payment-service: 8089, intelligence-service: 8087

Key files to understand before starting:
- `shared-models/src/main/java/com/MaSoVa/shared/config/ApiVersionConfig.java` — defines `/api/v1` and `/api` constants
- `api-gateway/src/main/java/com/MaSoVa/gateway/config/GatewayConfig.java` — all 47 gateway routes (confirmed)

---

## Task 1: Remove TestDataController from Production

**Files:**
- Modify: `core-service/src/main/java/com/MaSoVa/core/user/controller/TestDataController.java`

**Step 1: Add @Profile("dev") to TestDataController**

Open the file and add the annotation:
```java
@Profile("dev")
@RestController
@RequestMapping("/api/test-data")
public class TestDataController {
    // existing content unchanged
}
```

Add import at the top:
```java
import org.springframework.context.annotation.Profile;
```

**Step 2: Verify it compiles**

On Dell PowerShell, from `core-service/` directory:
```
mvn compile "-Dmaven.test.skip=true"
```
Expected: `BUILD SUCCESS`

**Step 3: Verify endpoint is gone (optional, skip if no Dell access right now)**

```
node scripts/test-api-full.js 2>&1 | Select-String "test-data"
```
Expected: test-data endpoints return 404 in production profile.

**Step 4: Commit**
```bash
git add core-service/src/main/java/com/MaSoVa/core/user/controller/TestDataController.java
git commit -m "feat: restrict TestDataController to dev profile only"
```

---

## Task 2: core-service — Consolidate UserController (42 → 13 endpoints)

**Files:**
- Modify: `core-service/src/main/java/com/MaSoVa/core/user/controller/UserController.java`
- Modify: `core-service/src/main/java/com/MaSoVa/core/user/service/UserService.java` (may need query param support)

**Step 1: Write the failing test (in test-api-full.js on Mac)**

Before changing anything, confirm current endpoints pass. Run:
```
node scripts/test-api-full.js 2>&1 | head -100
```
Note baseline pass count.

**Step 2: Add query param support to UserService (if not already there)**

Check `UserService.java` for a method like `findByTypeAndStore`. If it doesn't support query params, add:
```java
public List<UserDto> findUsers(String type, String storeId, Boolean available) {
    // delegate to existing findByType, findByStore, findAvailableDrivers methods
    // combine filters with specification pattern or manual if-else
}
```

**Step 3: Update UserController — replace individual filter endpoints**

Remove these methods from `UserController.java`:
- `getByType(@PathVariable String type)` → mapped to `GET /api/users/type/{type}`
- `getDriversByStore()` → `GET /api/users/drivers/store`
- `getAvailableDrivers()` → `GET /api/users/drivers/available`
- `getManagers()` → `GET /api/users/managers`
- `getStatus(@PathVariable)` → `GET /api/users/{id}/status`
- `updateStatus(@PathVariable)` → `PUT /api/users/{id}/status`
- `canTakeOrders(@PathVariable)` → `GET /api/users/{id}/can-take-orders`
- `getProfile()` → `GET /api/users/profile`
- `updateProfile()` → `PUT /api/users/profile`
- `generateAllPins()` → `POST /api/users/generate-all-pins`

Update the list endpoint `GET /api/users` to accept query params:
```java
@GetMapping
public ResponseEntity<List<UserDto>> getUsers(
    @RequestParam(required = false) String type,
    @RequestParam(required = false) String storeId,
    @RequestParam(required = false) Boolean available
) {
    return ResponseEntity.ok(userService.findUsers(type, storeId, available));
}
```

Move `generateAllPins` logic into the existing `POST /api/users/kiosk/generate-pins` endpoint body or a separate admin endpoint.

**Step 4: Compile and verify**
```
mvn compile "-Dmaven.test.skip=true"
```

**Step 5: Update test-api-full.js**

In `scripts/test-api-full.js`, find the Users section and update any calls to removed endpoints to use query params instead. E.g.:
- `GET /api/users/type/DRIVER` → `GET /api/users?type=DRIVER`
- `GET /api/users/drivers/available` → `GET /api/users?type=DRIVER&available=true`

**Step 6: Commit**
```bash
git add core-service/src/main/java/com/MaSoVa/core/user/controller/UserController.java
git add core-service/src/main/java/com/MaSoVa/core/user/service/UserService.java
git add scripts/test-api-full.js
git commit -m "feat: consolidate UserController filter endpoints into query params (42→13)"
```

---

## Task 3: core-service — Consolidate StoreController (13 → 5 endpoints)

**Files:**
- Modify: `core-service/src/main/java/com/MaSoVa/core/user/controller/StoreController.java`

**Step 1: Update StoreController to accept query params**

Remove these methods:
- `GET /api/stores/public` — merged into `GET /api/stores` (same data, auth-gated fields)
- `GET /api/stores/public/{storeId}` — same as `GET /api/stores/{storeId}`
- `GET /api/stores/public/code/{storeCode}` — use `GET /api/stores?code={storeCode}`
- `GET /api/stores/code/{storeCode}` — use `GET /api/stores?code={storeCode}`

> ⚠️ **DO NOT remove `GET /api/stores/public/find-by-location`** — this endpoint is ADDED by the store selection feature (feat/store-selection). It must be preserved when consolidating the public endpoints.
- `GET /api/stores/region/{regionId}` — use `GET /api/stores?region={regionId}`
- `GET /api/stores/operational-status` — field on `GET /api/stores/{storeId}`
- `GET /api/stores/metrics` — moved to analytics
- `POST /api/stores/access-check` — logic in middleware
- `GET /api/stores/{storeId}/nearby` — duplicate of `GET /api/stores?near=lat,lng`

Update the list method:
```java
@GetMapping
public ResponseEntity<?> getStores(
    @RequestParam(required = false) String code,
    @RequestParam(required = false) String region,
    @RequestParam(required = false) Double near,  // lat,lng as "17.4,78.4"
    @RequestParam(required = false) Double radius,
    HttpServletRequest request
) { ... }
```

Keep `GET /api/stores/{storeId}/delivery-radius` as-is.

**Step 2: Compile**
```
mvn compile "-Dmaven.test.skip=true"
```

**Step 3: Update gateway routes**

In `GatewayConfig.java`, find the `core_stores_*` routes and update them to remove routes for the removed paths.

**Step 4: Commit**
```bash
git add core-service/src/main/java/com/MaSoVa/core/user/controller/StoreController.java
git add api-gateway/src/main/java/com/MaSoVa/gateway/config/GatewayConfig.java
git commit -m "feat: consolidate StoreController filter endpoints into query params (13→5)"
```

---

## Task 4: core-service — Consolidate WorkingSessionController (18 → 9 endpoints)

**Files:**
- Modify: `core-service/src/main/java/com/MaSoVa/core/user/controller/WorkingSessionController.java`

**Step 1: Rename controller base path**

> ✅ **Gateway already done:** `GatewayConfig.java` already has a `core_sessions` route for `/api/sessions/**` (confirmed by codebase audit). The controller `@RequestMapping` change below is the ONLY remaining step — no gateway route update needed for this task.

Change `@RequestMapping("/api/users/sessions")` to `@RequestMapping("/api/sessions")`.

> ⚠️ **Breaking change for mobile apps.** The Driver App (`MaSoVaDriverApp`) and Staff App use this path. This task must be coordinated with a mobile app update OR use a path alias during transition (keep old path as deprecated alongside new).

**Transition approach:** Add the new path as an ADDITIONAL mapping while keeping old path temporarily:
```java
@RequestMapping({"/api/sessions", "/api/users/sessions"})
```
Remove the `/api/users/sessions` alias only after mobile apps are updated.

**Step 2: Merge start endpoints**

Merge `POST /start` and `POST /start-with-location` into one:
```java
@PostMapping
public ResponseEntity<WorkingSessionDto> startSession(
    @RequestBody StartSessionRequest request,  // location is optional in body
    @RequestHeader("X-User-Id") String employeeId,
    @RequestHeader(value = "X-User-Store-Id", required = false) String storeId
) { ... }
```

**Step 3: Merge end endpoints**

Replace `DELETE /end` and `POST /end-with-location` with:
```java
@PostMapping("/current/end")
public ResponseEntity<WorkingSessionDto> endSession(
    @RequestBody(required = false) EndSessionRequest request,
    @RequestHeader("X-User-Id") String employeeId
) { ... }
```

**Step 4: Remove redundant list endpoints**

Remove:
- `GET /store/active` → use `GET /api/sessions?storeId={id}&active=true`
- `GET /store` → use `GET /api/sessions?storeId={id}`
- `GET /{employeeId}` → use `GET /api/sessions?employeeId={id}`
- `GET /{employeeId}/status` → use `GET /api/sessions?employeeId={id}&active=true`
- `GET /{employeeId}/report` → moved to `GET /api/analytics/staff/{staffId}/hours` (intelligence-service)

Update `GET /api/sessions` to accept all these as query params.

**Step 5: Compile**
```
mvn compile "-Dmaven.test.skip=true"
```

**Step 6: Update gateway routes**

Add route `core_sessions` for `/api/sessions/**` in GatewayConfig.

**Step 7: Commit**
```bash
git add core-service/src/main/java/com/MaSoVa/core/user/controller/WorkingSessionController.java
git add api-gateway/src/main/java/com/MaSoVa/gateway/config/GatewayConfig.java
git commit -m "feat: consolidate WorkingSessionController, rename /api/sessions (18→9)"
```

---

## Task 5: core-service — Consolidate CustomerController (40 → 13 endpoints)

**Files:**
- Modify: `core-service/src/main/java/com/MaSoVa/core/customer/controller/CustomerController.java`

**Step 1: Remove the /api/v1/customers dual-path**

`CustomerController` has `@RequestMapping` for both `/api/v1/customers` and `/api/customers`. Remove the `/api/v1/customers` path from the annotation:
```java
@RequestMapping("/api/customers")  // remove ApiVersionConfig.V1 reference
```

**Step 2: Remove all individual filter GET endpoints**

Replace these with a single parameterised `GET /api/customers`:
```java
@GetMapping
public ResponseEntity<Page<CustomerDto>> getCustomers(
    @RequestParam(required = false) String filter,  // active, inactive, high-value, etc.
    @RequestParam(required = false) String email,
    @RequestParam(required = false) String phone,
    @RequestParam(required = false) String userId,
    @RequestParam(required = false) String tag,
    Pageable pageable
) { ... }
```

Remove endpoints replaced by this:
- `GET /active`, `GET /inactive`, `GET /high-value`, `GET /top-spenders`
- `GET /recently-active`, `GET /birthdays/today`, `GET /marketing-opt-in`, `GET /sms-opt-in`
- `GET /loyalty/tier/{tier}`
- `GET /email/{email}`, `GET /phone/{phone}`, `GET /user/{userId}`

**Step 3: Remove internal-only endpoints from controller**

- Remove `POST /{id}/order-stats` (internal computation)
- Remove `PATCH /{id}/verify-email` and `PATCH /{id}/verify-phone` (called via email link, not frontend)
- Mark `POST /get-or-create` as internal-only (not exposed via gateway — see Task 10)

**Step 4: Merge loyalty endpoints**

Merge `POST /{id}/loyalty/points` and `POST /{id}/loyalty/redeem` into:
```java
@PostMapping("/{id}/loyalty")
public ResponseEntity<LoyaltyDto> updateLoyalty(
    @PathVariable String id,
    @RequestBody LoyaltyRequest request  // contains: type (ADD|REDEEM), amount
) { ... }
```

Remove `GET /{id}/loyalty/max-redeemable` — the response from `GET /{id}` should include this field.

**Step 5: Merge notes into PATCH**

Remove `POST /{id}/notes` — notes field should be updatable via `PATCH /{id}`.

**Step 6: Compile**
```
mvn compile "-Dmaven.test.skip=true"
```

**Step 7: Update test-api-full.js**

Update Customer section in test suite to use new parameterised paths.

**Step 8: Commit**
```bash
git add core-service/src/main/java/com/MaSoVa/core/customer/controller/CustomerController.java
git add scripts/test-api-full.js
git commit -m "feat: consolidate CustomerController filter endpoints into query params (40→13)"
```

---

## Task 6: core-service — Consolidate ReviewController + ResponseController (33 → 10 endpoints)

**Files:**
- Modify: `core-service/src/main/java/com/MaSoVa/core/review/controller/ReviewController.java`
- Modify: `core-service/src/main/java/com/MaSoVa/core/review/controller/ResponseController.java`

**Step 1: Update ReviewController to use query params**

Remove individual filter endpoints:
- `GET /driver/{id}`, `GET /staff/{id}`, `GET /item/{id}`, `GET /customer/{id}`
- `GET /recent`, `GET /rating`, `GET /needs-response`, `GET /flagged`, `GET /pending`
- `GET /stats/driver/{id}`, `GET /stats/item/{id}`, `GET /staff/{id}/rating`
- `GET /public/item/{id}/average`

Replace with parameterised list:
```java
@GetMapping
public ResponseEntity<Page<ReviewDto>> getReviews(
    @RequestParam(required = false) String status,      // pending, approved, flagged
    @RequestParam(required = false) String entityType,  // driver, staff, item
    @RequestParam(required = false) String entityId,
    @RequestParam(required = false) Integer rating,
    Pageable pageable
) { ... }

@GetMapping("/stats")
public ResponseEntity<ReviewStatsDto> getStats(
    @RequestParam(required = false) String entityType,
    @RequestParam(required = false) String entityId
) { ... }
```

**Step 2: Merge ResponseController into ReviewController**

Move response endpoints from `ResponseController` into `ReviewController` as sub-resource endpoints:
```java
@PostMapping("/{reviewId}/response")
public ResponseEntity<ReviewResponseDto> addOrUpdateResponse(
    @PathVariable String reviewId,
    @RequestBody ReviewResponseRequest request
) { ... }

@GetMapping("/response-templates")
public ResponseEntity<List<ResponseTemplateDto>> getTemplates() { ... }
```

Delete `ResponseController.java` or mark it `@Deprecated` and route to ReviewController.

**Step 3: Compile**
```
mvn compile "-Dmaven.test.skip=true"
```

**Step 4: Commit**
```bash
git add core-service/src/main/java/com/MaSoVa/core/review/controller/ReviewController.java
git add core-service/src/main/java/com/MaSoVa/core/review/controller/ResponseController.java
git commit -m "feat: consolidate ReviewController, merge ResponseController (33→10)"
```

---

## Task 7: core-service — Consolidate Remaining Controllers

**Files:**
- Modify: `core-service/src/main/java/com/MaSoVa/core/notification/controller/NotificationController.java`
- Modify: `core-service/src/main/java/com/MaSoVa/core/notification/controller/UserPreferencesController.java`
- Modify: `core-service/src/main/java/com/MaSoVa/core/user/controller/GdprController.java`
- Modify: `core-service/src/main/java/com/MaSoVa/core/user/controller/SystemInfoController.java`

**Step 1: Notifications (8 → 5)**

Remove:
- `GET /user/{userId}/unread` → use `GET /api/notifications?userId={id}&unread=true`
- `GET /user/{userId}/recent` → use `GET /api/notifications?userId={id}&recent=true`
- `GET /user/{userId}/unread-count` → include count in list response header (`X-Unread-Count`)

Update list endpoint:
```java
@GetMapping
public ResponseEntity<List<NotificationDto>> getNotifications(
    @RequestParam(required = false) String userId,
    @RequestParam(required = false) Boolean unread,
    @RequestParam(required = false) Boolean recent,
    HttpServletResponse response  // for setting X-Unread-Count header
) { ... }
```

**Step 2: UserPreferences (6 → 3)**

Remove:
- `PATCH /{userId}/channel/{channel}` → merge into `PATCH /{userId}`
- `PATCH /{userId}/contact` → merge into `PATCH /{userId}`
- `PATCH /{userId}/device-token` → merge into `PATCH /{userId}`

Update PATCH to accept any combination of fields in the body.

**Step 3: GDPR (15 → 8)**

Remove redundant request type endpoints:
- `POST /request/{id}/access`
- `POST /request/{id}/erasure`
- `POST /request/{id}/portability`
- `POST /request/{id}/rectification`

Replace all four with:
```java
@PostMapping("/request/{id}/process")
public ResponseEntity<GdprRequestDto> processRequest(
    @PathVariable String id,
    @RequestBody ProcessRequestBody body  // contains: type (ACCESS|ERASURE|PORTABILITY|RECTIFICATION)
) { ... }
```

Remove `GET /privacy-policy` — serve as static file from frontend.

**Step 4: SystemInfo (5 → 2)**

Remove:
- `GET /api/system/updates/check`
- `GET /api/system/updates/status`
- `GET /api/system/info` — merge into health response

Keep:
- `GET /api/system/health` (add version/info fields to response)
- `GET /api/system/version`

**Step 5: Compile all changes**
```
mvn compile "-Dmaven.test.skip=true"
```

**Step 6: Commit**
```bash
git add core-service/src/main/java/com/MaSoVa/core/notification/
git add core-service/src/main/java/com/MaSoVa/core/user/controller/GdprController.java
git add core-service/src/main/java/com/MaSoVa/core/user/controller/SystemInfoController.java
git commit -m "feat: consolidate Notification/Preferences/GDPR/System controllers (37→16)"
```

---

## Task 8: commerce-service — Consolidate MenuController (18 → 8 endpoints)

**Files:**
- Modify: `commerce-service/src/main/java/com/MaSoVa/commerce/menu/controller/MenuController.java`

**Step 1: Remove individual public filter endpoints**

Remove:
- `GET /api/menu/public/cuisine/{cuisine}`
- `GET /api/menu/public/category/{category}`
- `GET /api/menu/public/dietary/{dietary}`
- `GET /api/menu/public/tag/{tag}`
- `GET /api/menu/public/recommended`
- `GET /api/menu/items` (manager list duplicate)

Update `GET /api/menu` to accept all filters and serve both public and manager requests based on auth:
```java
@GetMapping
public ResponseEntity<?> getMenu(
    @RequestParam(required = false) String cuisine,
    @RequestParam(required = false) String category,
    @RequestParam(required = false) String dietary,
    @RequestParam(required = false) String tag,
    @RequestParam(required = false) String search,
    @RequestParam(required = false) Boolean recommended,
    @RequestHeader(value = "Authorization", required = false) String auth
) {
    boolean isManager = auth != null && jwtService.isManager(auth);
    return ResponseEntity.ok(menuService.getMenu(cuisine, category, dietary, tag, search, recommended, isManager));
}
```

**Step 2: Remove DELETE /items (bulk delete)**

Remove the `DELETE /api/menu/items` endpoint — destructive bulk op. Individual delete remains.

**Step 3: Merge availability update into PATCH**

Remove:
- `PATCH /api/menu/items/{id}/availability`
- `PATCH /api/menu/items/{id}/availability/{status}`

These are now handled by `PATCH /api/menu/{id}` with `isAvailable` in the body.

Update PATCH endpoint:
```java
@PatchMapping("/{id}")
public ResponseEntity<MenuItemDto> updateMenuItem(
    @PathVariable String id,
    @RequestBody MenuItemUpdateRequest request  // includes isAvailable field
) { ... }
```

**Step 4: Compile**
```
mvn compile "-Dmaven.test.skip=true"
```

**Step 5: Commit**
```bash
git add commerce-service/src/main/java/com/MaSoVa/commerce/menu/controller/MenuController.java
git commit -m "feat: consolidate MenuController filter endpoints into query params (18→8)"
```

---

## Task 9: commerce-service — Consolidate OrderController (34 → 12 endpoints)

**Files:**
- Modify: `commerce-service/src/main/java/com/MaSoVa/commerce/order/controller/OrderController.java`

**Step 1: Remove /api/v1/orders dual path**

Change the `@RequestMapping` annotation from:
```java
@RequestMapping({ApiVersionConfig.V1 + "/orders", ApiVersionConfig.LEGACY + "/orders"})
```
To:
```java
@RequestMapping("/api/orders")
```

**Step 2: Remove individual filter GET endpoints**

Remove:
- `GET /number/{orderNumber}` → use `GET /api/orders?number={x}`
- `GET /status/{status}` → use `GET /api/orders?status={x}`
- `GET /date/{date}` → use `GET /api/orders?from={date}&to={date}`
- `GET /range` → use `GET /api/orders?from={date}&to={date}`
- `GET /staff/{staffId}/date/{date}` → use `GET /api/orders?staffId={id}&date={d}`
- `GET /customer/{customerId}` → use `GET /api/orders?customerId={id}`
- `GET /search`
- `GET /active-deliveries/count` → field in analytics
- `GET /analytics/kitchen-staff` + `GET /analytics/pos-staff` → moved to intelligence-service
- `GET /store/make-table/{station}` → use `GET /api/orders?makeTableStation={x}`

Update list endpoint:
```java
@GetMapping
public ResponseEntity<Page<OrderDto>> getOrders(
    @RequestParam(required = false) String storeId,
    @RequestParam(required = false) String status,
    @RequestParam(required = false) String customerId,
    @RequestParam(required = false) String staffId,
    @RequestParam(required = false) String from,
    @RequestParam(required = false) String to,
    @RequestParam(required = false) String number,
    @RequestParam(required = false) String makeTableStation,
    Pageable pageable
) { ... }
```

**Step 3: Add explicit status transition endpoint**

Add `POST /api/orders/{orderId}/status`:
```java
@PostMapping("/{orderId}/status")
public ResponseEntity<OrderDto> updateStatus(
    @PathVariable String orderId,
    @RequestBody OrderStatusRequest request  // contains: status, reason (for audit log)
) { ... }
```

This replaces status changes that were buried in the generic PATCH body.

**Step 4: Update PATCH to only handle mutable non-status fields**

`PATCH /api/orders/{orderId}` now only handles: items, priority, specialInstructions, kitchenStaffId, makeTableStation, deliveryProofType, deliveryPhotoUrl, deliverySignatureUrl, contactlessDelivery, deliveryOtp.

**Step 5: Remove rating endpoints**

Remove:
- `GET /rating/token/{token}` → moved to `GET /api/reviews/public/token/{token}`
- `POST /rating/token/{token}/mark-used` → internal call only

**Step 6: Compile**
```
mvn compile "-Dmaven.test.skip=true"
```

**Step 7: Update test-api-full.js**

Update Orders section in test suite:
- `POST /api/v1/orders` → `POST /api/orders`
- All filter GETs to query params

**Step 8: Commit**
```bash
git add commerce-service/src/main/java/com/MaSoVa/commerce/order/controller/OrderController.java
git add scripts/test-api-full.js
git commit -m "feat: consolidate OrderController, remove /api/v1 path, add explicit status transition (34→12)"
```

---

## Task 10: commerce-service — Consolidate KitchenEquipmentController (11 → 6 endpoints)

**Files:**
- Modify: `commerce-service/src/main/java/com/MaSoVa/commerce/order/controller/KitchenEquipmentController.java`

> Note: Current path is `/api/kitchen-equipment`. The design doc uses `/api/equipment`. Check with the frontend — if `kitchen-equipment` is already in use in RTK Query hooks, keep the path name to avoid unnecessary breaking changes. Use `kitchen-equipment` if already established.

**Step 1: Remove filter endpoints**

Remove:
- `GET /store/status/{status}` → use `GET /api/equipment?status={x}`
- `GET /store/maintenance-needed` → use `GET /api/equipment?needsMaintenance=true`
- `POST /store/reset-usage` → add as `action: "reset-usage"` in `PATCH /{id}`

**Step 2: Merge status/power/temperature updates**

Remove:
- `PATCH /{id}/status`
- `PATCH /{id}/power`
- `PATCH /{id}/temperature`

Replace with single:
```java
@PatchMapping("/{id}")
public ResponseEntity<KitchenEquipmentDto> updateEquipment(
    @PathVariable String id,
    @RequestBody KitchenEquipmentUpdateRequest request  // any combination of: status, power, temperature, action
) { ... }
```

**Step 3: Compile**
```
mvn compile "-Dmaven.test.skip=true"
```

**Step 4: Commit**
```bash
git add commerce-service/src/main/java/com/MaSoVa/commerce/order/controller/KitchenEquipmentController.java
git commit -m "feat: consolidate KitchenEquipmentController PATCH endpoints (11→6)"
```

---

## Task 11: logistics-service — Consolidate Delivery Controllers (29 → 13 endpoints)

**Files:**
- Modify: `logistics-service/src/main/java/com/MaSoVa/logistics/delivery/controller/DispatchController.java`
- Modify: `logistics-service/src/main/java/com/MaSoVa/logistics/delivery/controller/TrackingController.java`
- Modify: `logistics-service/src/main/java/com/MaSoVa/logistics/delivery/controller/PerformanceController.java`

**Step 1: Consolidate dispatch endpoints**

In DispatchController, rename:
- `POST /auto-dispatch` → `POST /api/delivery/dispatch`

Remove:
- `POST /verify-signature` + `POST /verify-photo` + `POST /contactless` → merge into `POST /{trackingId}/deliver` with `body.method` field:
```java
@PostMapping("/{trackingId}/deliver")
public ResponseEntity<TrackingDto> markDelivered(
    @PathVariable String trackingId,
    @RequestBody DeliverRequest request  // method: SIGNATURE|PHOTO|CONTACTLESS|OTP, proof: url
) { ... }
```

Remove `POST /route-optimize` — internal operation.

**Step 2: Consolidate zone endpoints**

Remove:
- `GET /zone/validate`
- `GET /zone/list`
- `GET /zone/fee`
- `GET /zone/check`

Replace with:
```java
@GetMapping("/zones")
public ResponseEntity<?> getZones(
    @RequestParam(required = false) Double lat,
    @RequestParam(required = false) Double lng,
    @RequestParam(required = false) String storeId
) { ... }
```

**Step 3: Remove redundant endpoints**

- Remove `GET /health` → use `/actuator/health`
- Remove `GET /eta/{orderId}` → field on `GET /delivery/track/{orderId}`
- Remove `GET /drivers/available` → use core-service `GET /api/users?type=DRIVER&available=true`
- Remove `GET /metrics/today` → moved to intelligence-service

**Step 4: Rename OTP endpoint**

Rename `POST /{orderId}/otp` → `POST /{orderId}/otp/generate`

**Step 5: Compile**
```
mvn compile "-Dmaven.test.skip=true"
```

**Step 6: Commit**
```bash
git add logistics-service/src/main/java/com/MaSoVa/logistics/delivery/controller/
git commit -m "feat: consolidate delivery controllers, merge proof-of-delivery variants (29→13)"
```

---

## Task 12: logistics-service — Simplify Inventory (62 → 7 endpoints)

**Files:**
- Modify: `logistics-service/src/main/java/com/MaSoVa/logistics/inventory/controller/InventoryController.java`
- Modify: `logistics-service/src/main/java/com/MaSoVa/logistics/inventory/controller/SupplierController.java` (keep as internal reference data only)
- Remove: `logistics-service/src/main/java/com/MaSoVa/logistics/inventory/controller/PurchaseOrderController.java`
- Remove: `logistics-service/src/main/java/com/MaSoVa/logistics/inventory/controller/WasteController.java`

> **Important:** The design doc says to remove Supplier/PurchaseOrder/Waste as dedicated CRUD APIs and simplify to fields on inventory items. Decide with the team: if these are actively used in the frontend, mark `@Deprecated` and remove in a later release rather than deleting now.

**Step 1: Simplify InventoryController**

Add query params to list endpoint:
```java
@GetMapping
public ResponseEntity<List<InventoryItemDto>> getInventory(
    @RequestParam(required = false) String storeId,
    @RequestParam(required = false) String category,
    @RequestParam(required = false) Boolean lowStock,
    @RequestParam(required = false) Boolean outOfStock
) { ... }
```

Remove individual filter variants.

**Step 2: Add PATCH to handle all stock operations**

Update `PATCH /{id}` to handle: stock update, waste recording, reserve, release, consume — all via body action field:
```java
@PatchMapping("/{id}")
public ResponseEntity<InventoryItemDto> updateItem(
    @PathVariable String id,
    @RequestBody InventoryUpdateRequest request  // action: UPDATE_STOCK|RECORD_WASTE|RESERVE|RELEASE|CONSUME, quantity, reason
) { ... }
```

**Step 3: Mark PurchaseOrderController and WasteController as deprecated**

Add `@Deprecated` annotation and `@ResponseStatus(HttpStatus.GONE)` to class-level, or simply remove if frontend confirms they're unused.

**Step 4: Compile**
```
mvn compile "-Dmaven.test.skip=true"
```

**Step 5: Commit**
```bash
git add logistics-service/src/main/java/com/MaSoVa/logistics/inventory/
git commit -m "feat: simplify InventoryController to 7 endpoints, deprecate PO/Waste CRUD (62→7)"
```

---

## Task 13: payment-service — Remove /api/v1 Paths (24 → 8 endpoints)

**Files:**
- Modify: `payment-service/src/main/java/com/MaSoVa/payment/controller/PaymentController.java`
- Modify: `payment-service/src/main/java/com/MaSoVa/payment/controller/RefundController.java`

**Step 1: Remove /api/v1/payments dual path from PaymentController**

Change `@RequestMapping({ApiVersionConfig.V1 + "/payments", ApiVersionConfig.LEGACY + "/payments"})` to `@RequestMapping("/api/payments")`

**Step 2: Remove customer lookup endpoint**

Remove `GET /customer/{customerId}` → use `GET /api/payments?customerId={id}`

Update list endpoint:
```java
@GetMapping
public ResponseEntity<List<TransactionDto>> getPayments(
    @RequestParam(required = false) String storeId,
    @RequestParam(required = false) String orderId,
    @RequestParam(required = false) String customerId
) { ... }
```

**Step 3: Remove reconciliation endpoints**

Remove `GET /reconciliation` and `POST /{id}/reconcile` — these are internal accounting operations now handled as scheduled jobs, not frontend endpoints.

**Step 4: Simplify RefundController**

Remove individual refund lookup variants:
- `GET /refund/order/{orderId}`
- `GET /refund/customer/{customerId}`
- `GET /refund/transaction/{transactionId}`

Replace with:
```java
@GetMapping("/refunds")
public ResponseEntity<List<RefundDto>> getRefunds(
    @RequestParam(required = false) String orderId,
    @RequestParam(required = false) String transactionId,
    @RequestParam(required = false) String customerId
) { ... }
```

**Step 5: Compile**
```
mvn compile "-Dmaven.test.skip=true"
```

**Step 6: Update test-api-full.js**

Update Payments section: `POST /api/v1/payments/...` → `POST /api/payments/...`

**Step 7: Commit**
```bash
git add payment-service/src/main/java/com/MaSoVa/payment/controller/
git add scripts/test-api-full.js
git commit -m "feat: remove /api/v1 path from PaymentController, consolidate refund lookups (24→8)"
```

---

## Task 14: intelligence-service — Consolidate Analytics (19 → 12 endpoints)

**Files:**
- Modify: `intelligence-service/src/main/java/com/MaSoVa/intelligence/controller/AnalyticsController.java`
- Modify: `intelligence-service/src/main/java/com/MaSoVa/intelligence/controller/BIController.java`

**Step 1: Merge sales endpoints**

Remove individual time endpoints:
- `GET /api/analytics/sales/today`
- `GET /api/analytics/sales/trends`

Replace with:
```java
@GetMapping("/sales")
public ResponseEntity<SalesDto> getSales(
    @RequestParam(defaultValue = "today") String period,  // today, week, month
    @RequestParam(required = false) String breakdown  // type, item
) { ... }
```

**Step 2: Remove cache clear endpoint**

Remove `POST /api/analytics/cache/clear` — internal cron job, not a frontend endpoint.

**Step 3: Remove BIController health endpoint**

Remove `GET /api/bi/health` — use `GET /actuator/health` instead.

**Step 4: Add working hours report endpoint**

Add to AnalyticsController (moved from sessions service):
```java
@GetMapping("/staff/{staffId}/hours")
public ResponseEntity<WorkingHoursDto> getWorkingHours(
    @PathVariable String staffId,
    @RequestParam(required = false) String from,
    @RequestParam(required = false) String to
) {
    // Calls core-service internally to get session data and aggregate
}
```

**Step 5: Compile**
```
mvn compile "-Dmaven.test.skip=true"
```

**Step 6: Commit**
```bash
git add intelligence-service/src/main/java/com/MaSoVa/intelligence/controller/
git commit -m "feat: consolidate analytics endpoints, add staff hours report (19→12)"
```

---

## Task 15: api-gateway — Update Routes

**Files:**
- Modify: `api-gateway/src/main/java/com/MaSoVa/gateway/config/GatewayConfig.java`

**Step 1: Remove routes for deleted endpoints**

Remove gateway routes for all removed paths:
- `/api/v1/**` routes to commerce and payment (now canonical)
- `/api/users/type/**`, `/api/users/drivers/**`, `/api/users/managers` routes
- `/api/stores/public/**`, `/api/stores/code/**`, `/api/stores/region/**` routes
- `/api/users/sessions/**` (replace with `/api/sessions/**`)
- All individual customer filter routes
- All individual order filter routes

**Step 2: Add new routes**

Add:
```java
// New sessions path
.route("core_sessions", r -> r.path("/api/sessions/**")
    .filters(f -> f.filter(jwtFilter))
    .uri(coreServiceUri))

// Gateway health aggregator
.route("gateway_health", r -> r.path("/api/health")
    .uri("http://localhost:8080/health"))

// Block get-or-create from being externally accessible
// (POST /api/customers/get-or-create should only be internal service-to-service)
// Add an IP filter or remove this route entirely from public gateway
```

**Step 3: Add aggregated health route**

In `SystemInfoHandler.java`, add handling for `GET /api/health` that calls all 5 services' `/actuator/health` endpoints and aggregates status.

**Step 4: Compile**
```
mvn compile "-Dmaven.test.skip=true"
```

**Step 5: Commit**
```bash
git add api-gateway/src/main/java/com/MaSoVa/gateway/config/GatewayConfig.java
git add api-gateway/src/main/java/com/MaSoVa/gateway/handler/SystemInfoHandler.java
git commit -m "feat: update API Gateway routes for reduced endpoint surface, add /api/health aggregator"
```

---

## Task 16: Update Frontend RTK Query Hooks

**Files:**
- Modify: `frontend/src/api/` — all RTK Query API slice files

**Step 1: Find all API calls in the frontend**

On Mac:
```bash
grep -r "api/v1" frontend/src/
grep -r "/api/users/sessions" frontend/src/
grep -r "drivers/available\|drivers/store\|users/type" frontend/src/
```

**Step 2: Update each RTK Query endpoint definition**

For each file in `frontend/src/api/` (or wherever RTK Query slices are defined):
- Replace `/api/v1/orders` with `/api/orders`
- Replace `/api/v1/customers` with `/api/customers`
- Replace `/api/v1/payments` with `/api/payments`
- Replace `/api/users/sessions` with `/api/sessions`
- Replace `/api/users/drivers/available` with `/api/users?type=DRIVER&available=true`
- Replace any individual filter paths with parameterised equivalents

**Step 3: Run the frontend dev server**
```bash
cd frontend && npm run dev
```
Navigate to key pages: Orders, Customers, Menu, Delivery — verify they load without 404 errors.

**Step 4: Commit**
```bash
git add frontend/src/api/
git commit -m "feat: update RTK Query hooks to use new consolidated API paths"
```

---

## Task 17: Update test-api-full.js for New 125-Endpoint Spec

**Files:**
- Modify: `scripts/test-api-full.js`

**Step 1: Update SPEC_ENDPOINTS count**

The `SPEC_ENDPOINTS` object in test-api-full.js currently reflects the old 471 endpoints. After the reduction, the new counts are:

```javascript
const SPEC_ENDPOINTS = {
  core: 61,       // was 198 (now 238 after subtracting removed)
  commerce: 23,   // was 65
  logistics: 20,  // was 91
  payment: 8,     // was 15
  intel: 12,      // was 19
};
```

**Step 2: Update all endpoint paths**

Search and replace throughout the file:
- `${S.commerce}/api/v1/orders` → `${S.commerce}/api/orders`
- `${S.payment}/api/v1/payments` → `${S.payment}/api/payments`
- `${S.core}/api/v1/customers` → `${S.core}/api/customers`
- `${S.core}/api/users/sessions` → `${S.core}/api/sessions`
- Any `/api/users/type/DRIVER` → `/api/users?type=DRIVER`

**Step 3: Run full test suite**
```
node scripts/test-api-full.js
```
Expected: high pass rate (some endpoints may still fail during transition — that's expected)

**Step 4: Fix any failures caused by path changes**

If endpoints return 404, check gateway routing. If they return 400, check query param format.

**Step 5: Commit**
```bash
git add scripts/test-api-full.js
git commit -m "fix: update test-api-full.js for 125-endpoint API spec"
```

---

## Task 18: Final Verification

**Step 1: Run full test suite against all services**
```
node scripts/test-api-full.js 2>&1 | tail -50
```
Expected: 125 endpoints covered, high pass rate.

**Step 2: Verify no /api/v1 paths remain**

On Dell:
```
Select-String -Path "commerce-service\src\main\java\*\*\*\*.java" -Pattern "api/v1" -Recurse
Select-String -Path "payment-service\src\main\java\*\*\*\*.java" -Pattern "api/v1" -Recurse
```
Expected: no matches (except potentially in deprecated backward-compat aliases).

**Step 3: Check API Gateway routes count**

Count routes in `GatewayConfig.java`:
```bash
grep -c "\.route(" api-gateway/src/main/java/com/MaSoVa/gateway/config/GatewayConfig.java
```
Should be significantly fewer than 46.

**Step 4: Final commit**
```bash
git commit -m "feat: API reduction complete — 471 → 125 endpoints"
```

---

## Rollback Plan

If any task breaks production, each task is independently revertable:
```bash
git revert HEAD  # revert last commit
```

Or use feature flags via Spring profiles:
```java
@ConditionalOnProperty(name = "api.legacy-paths.enabled", havingValue = "true")
```
This allows enabling legacy paths per environment during transition.
