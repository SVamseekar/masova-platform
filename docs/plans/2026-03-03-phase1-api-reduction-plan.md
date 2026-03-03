# Phase 1 — API Reduction (471 → 175 Endpoints) Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Reduce 471 scattered endpoints to 175 canonical paths across 6 microservices with zero feature loss.

**Architecture:** Each service keeps its own controllers. Remove `/api/v1/` duplicate path mappings. Collapse per-filter endpoints into query params. Merge sub-resources into parent controllers where logical. Move `TestDataController` behind `@Profile("dev")`. Guard internal endpoints from API Gateway.

**Tech Stack:** Spring Boot 3, Spring MVC `@RequestMapping`, Spring Security filter chain, springdoc-openapi

---

## Tools for This Phase

Read this section before starting ANY task. These are the exact tools to use and when.

### `using-git-worktrees` (Skill)
**Use it:** BEFORE starting Task 1.1. This phase deletes and rewrites controller mappings — that is destructive. Work in an isolated worktree so main is never broken.
**How to invoke:** Type `/using-git-worktrees` and follow the instructions to create a worktree named `feat/api-reduction`.

### `jdtls-lsp` — Java Language Server (MCP tool)
**Use it:** Continuously while editing every controller file. When you remove a method or change a path, the LSP will immediately show if any other class references that method.
**Specifically:** In Task 1.6 when you merge 3 delivery controllers into one, the LSP will flag any remaining imports of the deleted controllers in other files — fix those immediately, do not leave them for compile time.
**How to invoke:** Runs automatically. Use `mcp__ide__getDiagnostics` on any file to get current diagnostics.

### `serena` — Semantic Code Navigation (MCP tool)
**Use it:** Before removing any endpoint method — use Serena to find all callers first.
**Specifically:** Before deleting `GET /api/stores/nearby` in Task 1.1, ask Serena "find all references to getNearbyStores" or "find all Feign clients calling /api/stores/nearby". If any other service calls it, update the Feign client URL FIRST before removing the endpoint.
**How to invoke:** Use the `serena` MCP tools available in your session.

### `greptile` — Semantic Codebase Search (MCP tool)
**Use it:** When Serena doesn't find something obvious. For example, in Task 1.5 before deleting `RatingController`, use Greptile to search "RatingController" or "/api/ratings" across the entire codebase.
**Specifically:** Search "api/v1/" to find ALL v1 path duplicates across all services in one query — faster than reading every controller manually.
**How to invoke:** Use the `mcp__plugin_greptile_greptile__*` tools available in your session.

### `feature-dev:code-explorer` (Agent)
**Use it:** At the start of each service task (1.1 through 1.8) — before touching any file. Run this agent to get a deep understanding of that service's controller structure.
**Specifically:** Run it for logistics-service before Task 1.6 — that service has 3 delivery controllers that need merging, and you need to understand all the method signatures first.
**How to invoke:** Use the Agent tool with `subagent_type: "feature-dev:code-explorer"`. Give it the service directory path.

### `context7` — Library Docs (MCP tool)
**Use it:** Before writing any Resilience4j circuit breaker config in Task 1.9. The Resilience4j Spring Boot 3 config differs from Boot 2.
**How to invoke:** `resolve-library-id` for `resilience4j-spring-boot3` → `query-docs` for `CircuitBreaker annotation`.

### `systematic-debugging` (Skill)
**Use it:** If after removing an endpoint a service starts returning 500s or 404s on endpoints you did NOT touch — invoke this skill before guessing the cause.
**How to invoke:** Type `/systematic-debugging`.

### `security-guidance` (Skill)
**Use it:** After Task 1.9 (gateway guard + circuit breakers). Verify that `POST /api/customers/get-or-create` is truly blocked at the gateway and no auth endpoints were accidentally made public.
**How to invoke:** Type `/security-guidance` after Task 1.9.

### `pr-review-toolkit:code-reviewer` (Agent)
**Use it:** Once per service after its tasks are done — NOT after every individual task (too expensive on Pro).
**Specifically:** After Task 1.4 (core-service complete), run this agent on all modified core-service controllers. After Task 1.6 (logistics complete), run it on the new `DeliveryController.java`.
**How to invoke:** Use the Agent tool with `subagent_type: "pr-review-toolkit:code-reviewer"`.

### `commit-commands:commit-push-pr` (Skill)
**Use it:** At the end of Task 1.11 (smoke test passes) to create the PR for this entire phase.
**How to invoke:** Type `/commit-push-pr`.

---

## Pre-Flight: Read the API Reduction Design

Before touching any controller, read the canonical 175-endpoint table in:
`docs/plans/2026-03-03-master-implementation-plan-v2.md` — section "Final 175-Endpoint Canonical API"

This is your specification. Every controller rewrite must match that spec exactly.

---

## Task 1.1: CORE-SERVICE — Auth + Users + Stores Controllers

**Files:**
- Modify: `core-service/src/main/java/com/MaSoVa/core/auth/controller/AuthController.java`
- Modify: `core-service/src/main/java/com/MaSoVa/core/user/controller/UserController.java`
- Modify: `core-service/src/main/java/com/MaSoVa/core/store/controller/StoreController.java`

**Step 1: Read AuthController.java**

Count current endpoint mappings. Look for any `/api/v1/auth/` duplicates.

**Step 2: Remove v1 duplicates from AuthController**

Find any class-level `@RequestMapping` or method-level paths like `/api/v1/auth/...`.
Change class-level mapping to `@RequestMapping("/api/auth")` only.
Remove any secondary `@GetMapping("/api/v1/auth/...")` method aliases.

Target 7 auth endpoints:
```
POST /api/auth/login
POST /api/auth/register
POST /api/auth/logout
POST /api/auth/refresh
POST /api/auth/google
POST /api/auth/change-password
POST /api/auth/validate-pin
```

If `change-password` or `validate-pin` don't exist → add stub that returns 501 Not Implemented (to be filled in Phase 3).

**Step 3: Read UserController.java**

Count endpoints. Look for:
- Separate endpoints for listing by type (`/drivers`, `/kiosk-users`, etc.) — collapse to `GET /api/users?type=DRIVER`
- `/api/v1/users/` duplicates — remove
- Separate deactivate/activate endpoints for kiosk — keep as `POST /api/users/kiosk/{id}/deactivate`

Target 11 user endpoints per spec.

**Step 4: Collapse UserController filter variants**

If you see:
```java
@GetMapping("/drivers")
public List<User> getDrivers(@RequestParam String storeId) { ... }

@GetMapping("/available-drivers")
public List<User> getAvailableDrivers(@RequestParam String storeId) { ... }
```

Collapse to:
```java
@GetMapping
public List<User> getUsers(
    @RequestParam(required = false) String type,
    @RequestParam(required = false) String storeId,
    @RequestParam(required = false) Boolean available,
    @RequestParam(required = false) String search) { ... }
```

The implementation should use these params to build the MongoDB query filter dynamically.

**Step 5: Read StoreController.java**

Target 4 endpoints:
```
GET  /api/stores          (query: code, region, near=lat,lng, radius, lat, lng)
GET  /api/stores/{id}
POST /api/stores
PATCH /api/stores/{id}
```

If there's a separate `GET /api/stores/nearby` or `GET /api/stores/check-radius` endpoint, collapse into the `GET /api/stores` query param: `?near=lat,lng&radius=10`.

**Step 6: Build core-service**

```powershell
cd core-service
mvn compile "-Dmaven.test.skip=true"
```
Expected: `BUILD SUCCESS`

**Step 7: Commit**

```bash
git add core-service/src/main/java/com/MaSoVa/core/auth/
git add core-service/src/main/java/com/MaSoVa/core/user/
git add core-service/src/main/java/com/MaSoVa/core/store/
git commit -m "feat(core): collapse auth/users/stores to canonical 22 endpoints, remove v1 duplicates"
```

---

## Task 1.2: CORE-SERVICE — Shifts + Sessions Controllers

**Files:**
- Modify: `core-service/src/main/java/com/MaSoVa/core/shift/controller/ShiftController.java`
- Modify: `core-service/src/main/java/com/MaSoVa/core/session/controller/WorkingSessionController.java`

**Step 1: Read ShiftController.java**

Target 10 shift endpoints per spec. Look for:
- Separate `/api/shifts/by-date/{date}`, `/api/shifts/by-employee/{id}` etc → collapse to `GET /api/shifts?date=&employeeId=`
- `/api/v1/shifts/` duplicates → remove
- `POST /api/shifts/copy-week` — if missing, add stub

**Step 2: Verify shift state transition endpoints**

Confirm these exist as POST:
```
POST /api/shifts/{id}/confirm
POST /api/shifts/{id}/start
POST /api/shifts/{id}/complete
```

If any are PATCH (body: `status: CONFIRMED`) — keep as-is BUT add the POST alias too. Don't break existing functionality.

**Step 3: Read WorkingSessionController.java**

Target 9 session endpoints. Note the canonical paths:
```
POST /api/sessions       (start — NOT /api/sessions/start)
POST /api/sessions/end   (end — NOT /api/sessions/current/end)
POST /api/sessions/clock-in
POST /api/sessions/clock-out
GET  /api/sessions
GET  /api/sessions/pending
POST /api/sessions/{id}/approve
POST /api/sessions/{id}/reject
POST /api/sessions/{id}/break
```

Look for any `/api/sessions/current/end` or `/api/sessions/start` paths and fix to canonical.

**Step 4: Build and commit**

```powershell
mvn compile "-Dmaven.test.skip=true"
```

```bash
git add core-service/src/main/java/com/MaSoVa/core/shift/
git add core-service/src/main/java/com/MaSoVa/core/session/
git commit -m "feat(core): collapse shifts to 10 endpoints, sessions to 9 endpoints, fix canonical paths"
```

---

## Task 1.3: CORE-SERVICE — Customers + Notifications + Preferences + Campaigns Controllers

**Files:**
- Modify: `core-service/src/main/java/com/MaSoVa/core/customer/controller/CustomerController.java`
- Modify: `core-service/src/main/java/com/MaSoVa/core/notification/controller/NotificationController.java`
- Modify: `core-service/src/main/java/com/MaSoVa/core/notification/controller/UserPreferencesController.java`
- Modify: `core-service/src/main/java/com/MaSoVa/core/campaign/controller/CampaignController.java`

**Step 1: Read CustomerController.java**

Target 13 endpoints. CustomerController currently has ~40 endpoints. Look for:
- `GET /api/customers/filter?tier=GOLD` vs `GET /api/customers?tier=GOLD` → collapse
- `GET /api/customers/by-email?email=` → collapse to `GET /api/customers?email=`
- `POST /api/customers/{id}/add-tag` and `DELETE /api/customers/{id}/remove-tag` → collapse to `POST /api/customers/{id}/tags` with body `{ add: [], remove: [] }`
- `POST /api/customers/{id}/loyalty/add` and `POST /api/customers/{id}/loyalty/redeem` → collapse to `POST /api/customers/{id}/loyalty` with body `{ type: ADD|REDEEM, amount: N }`
- `GET /api/customers/{id}/loyalty` → fold into `GET /api/customers/{id}` response (include loyalty + maxRedeemable)
- `POST /api/customers/{id}/gdpr-anonymise` or similar → this is `DELETE /api/customers/{id}` in spec (soft delete, GDPR)

**Step 2: Implement collapsed loyalty endpoint**

In CustomerController, replace separate add/redeem with:
```java
@PostMapping("/{id}/loyalty")
public ResponseEntity<?> manageLoyalty(
    @PathVariable String id,
    @RequestBody LoyaltyRequest request) {
    // request.type = ADD or REDEEM, request.amount = N
    if ("ADD".equals(request.getType())) {
        return ResponseEntity.ok(customerService.addLoyaltyPoints(id, request.getAmount()));
    } else if ("REDEEM".equals(request.getType())) {
        return ResponseEntity.ok(customerService.redeemLoyaltyPoints(id, request.getAmount()));
    }
    return ResponseEntity.badRequest().body("type must be ADD or REDEEM");
}
```

**Step 3: Collapse notification endpoints**

Target 5 notification endpoints. Look for:
- `GET /api/notifications/unread?userId=` → collapse to `GET /api/notifications?userId=&unread=true`
- Any v1 duplicates

**Step 4: Verify preferences endpoints (3)**

```
GET    /api/preferences/{userId}
PATCH  /api/preferences/{userId}
DELETE /api/preferences/{userId}
```

**Step 5: Verify campaigns (8 endpoints)**

All 8 campaign endpoints should exist. If any are missing (e.g., schedule, execute, cancel) add stubs.

**Step 6: Build and commit**

```bash
git add core-service/src/main/java/com/MaSoVa/core/customer/
git add core-service/src/main/java/com/MaSoVa/core/notification/
git add core-service/src/main/java/com/MaSoVa/core/campaign/
git commit -m "feat(core): collapse customer/notification/campaign to canonical 29 endpoints"
```

---

## Task 1.4: CORE-SERVICE — Reviews + GDPR + Consolidate ResponseController

**Files:**
- Modify: `core-service/src/main/java/com/MaSoVa/core/review/controller/ReviewController.java`
- Delete or Merge: `core-service/src/main/java/com/MaSoVa/core/review/controller/ResponseController.java`
- Modify: `core-service/src/main/java/com/MaSoVa/core/gdpr/controller/GdprController.java`

**Step 1: Read ReviewController.java and ResponseController.java**

Responses are a sub-resource of reviews. Merge ResponseController into ReviewController:

```java
// In ReviewController — replaces ResponseController
@PostMapping("/{id}/response")
public ResponseEntity<?> addOrUpdateResponse(
    @PathVariable String id,
    @RequestBody ManagerResponseRequest request) {
    return ResponseEntity.ok(reviewService.addResponse(id, request));
}
```

Delete `ResponseController.java` after merging.

**Step 2: Add response-templates endpoint**

```java
@GetMapping("/response-templates")
public ResponseEntity<List<ResponseTemplate>> getResponseTemplates() {
    return ResponseEntity.ok(reviewService.getResponseTemplates());
}
```

If `getResponseTemplates()` doesn't exist in service — add it returning hardcoded templates for now.

**Step 3: Verify public token endpoints**

```
GET  /api/reviews/public/token/{token}    ← NOT /api/ratings/token/{token}
POST /api/reviews/public/submit
```

If these are currently at `/api/ratings/...` in `RatingController.java` (commerce-service), move them to core-service `ReviewController`.

**Step 4: Verify GDPR endpoints (8)**

```
GET    /api/gdpr/consent?userId=
POST   /api/gdpr/consent
DELETE /api/gdpr/consent
POST   /api/gdpr/request
GET    /api/gdpr/request?userId=
POST   /api/gdpr/request/{id}/process
GET    /api/gdpr/export/{userId}
GET    /api/gdpr/audit/{userId}
```

**Step 5: Add health endpoint to gateway**

In `api-gateway`: verify `GET /api/health` aggregates all 5 service health checks. If not, add it.

**Step 6: Build core-service**

```powershell
mvn compile "-Dmaven.test.skip=true"
```

**Step 7: Commit**

```bash
git add core-service/src/main/java/com/MaSoVa/core/review/
git add core-service/src/main/java/com/MaSoVa/core/gdpr/
git commit -m "feat(core): merge ResponseController into ReviewController, fix review/gdpr canonical paths"
```

---

## Task 1.5: COMMERCE-SERVICE — Menu + Orders + Equipment Controllers

**Files:**
- Modify: `commerce-service/src/main/java/com/MaSoVa/commerce/menu/controller/MenuController.java`
- Modify: `commerce-service/src/main/java/com/MaSoVa/commerce/order/controller/OrderController.java`
- Modify: `commerce-service/src/main/java/com/MaSoVa/commerce/kitchen/controller/KitchenEquipmentController.java`
- Delete or Guard: `commerce-service/src/main/java/com/MaSoVa/commerce/test/TestDataController.java` (if exists)

**Step 1: Read MenuController.java**

Target 8 endpoints. Look for:
- `GET /api/menu/recommended` → collapse to `GET /api/menu?recommended=true`
- `GET /api/menu/by-category/{category}` → collapse to `GET /api/menu?category=PIZZA`
- `GET /api/menu/search?q=` → collapse to `GET /api/menu?search=burger`
- `/api/v1/menu/` duplicates → remove

**Step 2: Verify `POST /api/menu/copy`**

This copies menu items from one store to another. If missing, add:
```java
@PostMapping("/copy")
public ResponseEntity<?> copyMenu(
    @RequestParam String fromStoreId,
    @RequestParam String toStoreId,
    @RequestHeader("Authorization") String token) {
    return ResponseEntity.ok(menuService.copyMenu(fromStoreId, toStoreId));
}
```

**Step 3: Read OrderController.java**

Target 12 endpoints. Look for:
- `POST /api/orders/{id}/next-stage` — this is "bump" for KDS
- `DELETE /api/orders/{id}` should cancel the order
- `GET /api/orders/track/{id}` — public endpoint (no auth)
- `PATCH /api/orders/{id}` — must handle: items update, priority, driver assignment, make-table flag, delivery proof/OTP fields

**Step 4: Verify explicit status transition endpoint**

```java
@PostMapping("/{id}/status")
public ResponseEntity<?> updateOrderStatus(
    @PathVariable String id,
    @RequestBody UpdateOrderStatusRequest request) {
    // request.status = new status, request.reason = optional
    return ResponseEntity.ok(orderService.updateOrderStatus(id, request));
}
```

This is the explicit state machine endpoint. Separate from `PATCH /{id}` which handles field updates.

**Step 5: Move RatingController to reviews (or delete if duplicate)**

In `commerce-service`, find `RatingController.java`. Its 2 endpoints (`GET /api/reviews/public/token/{token}` and `POST /api/reviews/public/submit`) should be in core-service ReviewController (done in Task 1.4). Delete this controller from commerce-service.

**Step 6: Guard TestDataController behind dev profile**

Find any `TestDataController.java` in commerce-service (or any service). Add:
```java
@Profile("dev")
@RestController
@RequestMapping("/api/test-data")
public class TestDataController { ... }
```

**Step 7: Read KitchenEquipmentController.java**

Target 6 equipment endpoints — path is `/api/equipment` (NOT `/api/kitchen-equipment`):
```
GET    /api/equipment
POST   /api/equipment
GET    /api/equipment/{id}
PATCH  /api/equipment/{id}
DELETE /api/equipment/{id}
POST   /api/equipment/{id}/maintenance
```

Update class-level `@RequestMapping` from `/api/kitchen-equipment` to `/api/equipment`.

**Step 8: Build commerce-service**

```powershell
cd commerce-service
mvn compile "-Dmaven.test.skip=true"
```

**Step 9: Commit**

```bash
git add commerce-service/src/main/java/com/MaSoVa/commerce/
git commit -m "feat(commerce): collapse menu/orders/equipment to 26 canonical endpoints, fix /equipment path"
```

---

## Task 1.6: LOGISTICS-SERVICE — Delivery + Inventory + Suppliers + PO + Waste Controllers

**Files:**
- Modify: `logistics-service/src/main/java/com/MaSoVa/logistics/delivery/controller/DispatchController.java`
- Modify: `logistics-service/src/main/java/com/MaSoVa/logistics/delivery/controller/TrackingController.java`
- Modify: `logistics-service/src/main/java/com/MaSoVa/logistics/inventory/controller/InventoryController.java`
- Modify: `logistics-service/src/main/java/com/MaSoVa/logistics/supplier/controller/SupplierController.java`
- Modify: `logistics-service/src/main/java/com/MaSoVa/logistics/purchase/controller/PurchaseOrderController.java`
- Modify: `logistics-service/src/main/java/com/MaSoVa/logistics/waste/controller/WasteController.java`
- Modify: `logistics-service/src/main/java/com/MaSoVa/logistics/delivery/controller/PerformanceController.java`

**Step 1: Consolidate Dispatch + Tracking + Performance into single Delivery controller**

Currently 3 separate controllers handle delivery. Merge into one `DeliveryController` at `/api/delivery`:

```
POST /api/delivery/dispatch
POST /api/delivery/accept
POST /api/delivery/reject
POST /api/delivery/location
POST /api/delivery/verify-otp
GET  /api/delivery/track/{orderId}
GET  /api/delivery/zones
GET  /api/delivery/driver/{id}/pending
GET  /api/delivery/driver/{id}/performance
POST /api/delivery/{id}/otp
POST /api/delivery/{id}/advance
```

Move all methods from `DispatchController`, `TrackingController`, `PerformanceController` into a new `DeliveryController.java`. Delete the 3 old files after confirming all methods moved.

**Step 2: Collapse inventory filter variants**

Target 7 inventory endpoints. Look for:
- `GET /api/inventory/low-stock` → collapse to `GET /api/inventory?lowStock=true`
- `GET /api/inventory/out-of-stock` → collapse to `GET /api/inventory?outOfStock=true`
- `GET /api/inventory/expiring` → collapse to `GET /api/inventory?expiring=true`
- `GET /api/inventory/by-category/{cat}` → collapse to `GET /api/inventory?category=PRODUCE`

Collapse PATCH inventory operations. Currently there may be separate endpoints for:
- `POST /api/inventory/{id}/adjust` (adjust quantity)
- `POST /api/inventory/{id}/reserve` (reserve stock)
- `POST /api/inventory/{id}/consume` (consume reserved)

Collapse to `PATCH /api/inventory/{id}` with body `{ operation: ADJUST|RESERVE|RELEASE|CONSUME, quantity: N }`. Keep backward-compat if other services call these.

**Step 3: Verify suppliers (6 endpoints)**

```
GET  /api/suppliers
POST /api/suppliers
GET  /api/suppliers/{id}
PATCH /api/suppliers/{id}
DELETE /api/suppliers/{id}
GET  /api/suppliers/compare?category=PRODUCE
```

**Step 4: Verify purchase orders (10 endpoints)**

All 10 PO endpoints per spec. Key ones to check:
- `POST /api/purchase-orders/{id}/receive` — triggers inventory update
- `POST /api/purchase-orders/auto-generate` — called by Agent 3

**Step 5: Collapse waste filter variants**

Target 6 waste endpoints:
- Any `GET /api/waste/by-category/{cat}` → collapse to `GET /api/waste?category=PRODUCE`
- `GET /api/waste/stats` must support `?view=cost|trend|top-items|preventable`

**Step 6: Build logistics-service**

```powershell
cd logistics-service
mvn compile "-Dmaven.test.skip=true"
```

**Step 7: Commit**

```bash
git add logistics-service/src/main/java/com/MaSoVa/logistics/
git commit -m "feat(logistics): merge delivery controllers, collapse to 40 canonical endpoints"
```

---

## Task 1.7: PAYMENT-SERVICE — Collapse to 8 Endpoints

**Files:**
- Modify: `payment-service/src/main/java/com/MaSoVa/payment/controller/PaymentController.java`
- Modify: `payment-service/src/main/java/com/MaSoVa/payment/controller/RefundController.java`
- Modify: `payment-service/src/main/java/com/MaSoVa/payment/controller/WebhookController.java`

**Step 1: Read all 3 payment controllers**

Target 8 total payment endpoints. Currently 15 (from OpenAPI count) due to v1 duplicates + separate reconciliation endpoints.

**Step 2: Remove reconciliation endpoint if present**

`GET /api/payments/reconcile` or `POST /api/payments/reconcile` — if this exists, remove it. Analytics on payments belong in intelligence-service.

**Step 3: Consolidate paths**

```
POST /api/payments/cash
POST /api/payments/initiate
POST /api/payments/verify
GET  /api/payments
GET  /api/payments/{id}
POST /api/payments/refund
GET  /api/payments/refunds
POST /api/payments/webhook
```

Merge RefundController and WebhookController into PaymentController if that simplifies the file count. They can stay separate as long as they all mount under `/api/payments`.

**Step 4: Remove v1 duplicates**

Any `@RequestMapping("/api/v1/payments/...")` → remove.

**Step 5: Build and commit**

```powershell
cd payment-service
mvn compile "-Dmaven.test.skip=true"
```

```bash
git add payment-service/src/main/java/com/MaSoVa/payment/
git commit -m "feat(payment): collapse to 8 canonical endpoints, remove reconcile and v1 duplicates"
```

---

## Task 1.8: INTELLIGENCE-SERVICE — Collapse to 11 Analytics Endpoints

**Files:**
- Modify: `intelligence-service/src/main/java/com/MaSoVa/intelligence/analytics/controller/AnalyticsController.java`
- Modify: `intelligence-service/src/main/java/com/MaSoVa/intelligence/analytics/controller/BIController.java`

**Step 1: Read both controllers**

Target 11 endpoints total. Currently 19 (from OpenAPI count). Look for:
- `GET /api/analytics/sales/today` vs `GET /api/analytics/sales/week` → collapse to `GET /api/analytics/sales?period=today|week|month`
- `GET /api/analytics/sales/breakdown` vs `GET /api/analytics/sales/trend` → collapse to `?view=breakdown|trend|peak-hours`
- Separate working hours from staff performance → `GET /api/analytics/staff/{id}/hours`

**Step 2: Merge BIController into AnalyticsController**

If `BIController` has endpoints like `/api/bi/executive` or `/api/analytics/bi/...`, move to:
- `GET /api/analytics/executive`
- `GET /api/analytics/benchmarking`

Delete `BIController.java` after merge.

**Step 3: Verify forecast endpoint**

```java
@GetMapping("/forecast")
public ResponseEntity<?> getForecast(
    @RequestParam(defaultValue = "sales") String type) {
    // type = sales|demand|churn
    return ResponseEntity.ok(analyticsService.getForecast(type));
}
```

**Step 4: Build and commit**

```powershell
cd intelligence-service
mvn compile "-Dmaven.test.skip=true"
```

```bash
git add intelligence-service/src/main/java/com/MaSoVa/intelligence/
git commit -m "feat(intelligence): collapse analytics to 11 canonical endpoints, merge BI controller"
```

---

## Task 1.9: Guard Internal Endpoint + Resilience4j

**Files:**
- Modify: `api-gateway/src/main/java/com/MaSoVa/gateway/config/SecurityConfig.java` (or filter config)
- Modify: Each service's Feign client interfaces

**Step 1: Block internal-only endpoint at gateway**

`POST /api/customers/get-or-create` is service-to-service only. It should NOT be accessible via the API Gateway.

In API Gateway security config, add to the blocked paths:
```java
.requestMatchers("/api/customers/get-or-create").denyAll()
```

Or add to the gateway route config (if using Spring Cloud Gateway routes):
```yaml
# Remove or don't add route for /api/customers/get-or-create
```

**Step 2: Add @CircuitBreaker to Feign clients**

For each Feign client in each service (e.g., `MenuServiceClient`, `CustomerServiceClient`, `DeliveryServiceClient` in commerce-service), add Resilience4j circuit breaker:

```java
@FeignClient(name = "menu-service", url = "${menu.service.url}")
public interface MenuServiceClient {

    @CircuitBreaker(name = "menu-service", fallbackMethod = "getMenuItemFallback")
    @GetMapping("/api/menu/{id}")
    MenuItemDto getMenuItem(@PathVariable String id);

    default MenuItemDto getMenuItemFallback(String id, Exception e) {
        log.warn("Menu service circuit open for item {}: {}", id, e.getMessage());
        return MenuItemDto.builder().id(id).name("Item unavailable").available(false).build();
    }
}
```

Add to `application.yml` for each service:
```yaml
resilience4j:
  circuitbreaker:
    instances:
      menu-service:
        slidingWindowSize: 10
        failureRateThreshold: 50
        waitDurationInOpenState: 10s
      customer-service:
        slidingWindowSize: 10
        failureRateThreshold: 50
        waitDurationInOpenState: 10s
```

**Step 3: Commit**

```bash
git add api-gateway/
git add commerce-service/src/main/java/com/MaSoVa/commerce/order/client/
git add core-service/src/main/java/com/MaSoVa/core/
git commit -m "feat: guard internal endpoint at gateway, add Resilience4j circuit breakers to Feign clients"
```

---

## Task 1.10: Regenerate OpenAPI Specs

**Step 1: Start each service individually and regenerate spec**

For each service on Dell, start it and call the OpenAPI endpoint:

```bash
# core-service (port 8085)
curl http://192.168.50.88:8085/v3/api-docs > specs/core-spec.json

# commerce-service (port 8084)
curl http://192.168.50.88:8084/v3/api-docs > specs/commerce-spec.json

# logistics-service (port 8086)
curl http://192.168.50.88:8086/v3/api-docs > specs/logistics-spec.json

# payment-service (port 8089)
curl http://192.168.50.88:8089/v3/api-docs > specs/payment-spec.json

# intelligence-service (port 8087)
curl http://192.168.50.88:8087/v3/api-docs > specs/intelligence-spec.json
```

**Step 2: Count endpoints in new specs**

```bash
cat specs/core-spec.json | python3 -c "
import sys,json
spec = json.load(sys.stdin)
count = sum(len(methods) for methods in spec['paths'].values())
print(f'core-service: {count} endpoints')
"
```

Repeat for each spec file. Verify counts match:
- core: 89
- commerce: 26
- logistics: 40
- payment: 8
- intelligence: 11
- **Total: 175** (+ 1 gateway health = 176)

**Step 3: Update test-api-full.js endpoint counts**

In `scripts/test-api-full.js`, find the expected endpoint count assertions and update to 175.

**Step 4: Commit regenerated specs**

```bash
git add specs/
git add scripts/test-api-full.js
git commit -m "chore: regenerate OpenAPI specs after API reduction (471 → 175 endpoints)"
```

---

## Task 1.11: Smoke Test All Services

**Step 1: Start all 6 services on Dell**

```powershell
docker compose up -d mongodb redis rabbitmq
# start each service in separate terminal
```

**Step 2: Run abbreviated API test**

```bash
node scripts/test-api-full.js 2>&1 | tail -50
```

Expected: endpoint counts match, no 404s on canonical paths, no 500s.

**Step 3: Verify no v1 paths return 200**

```bash
# These should return 404 after cleanup
curl -s -o /dev/null -w "%{http_code}" http://192.168.50.88:8085/api/v1/auth/login
# Expected: 404
```

**Step 4: Commit any fixes found during smoke test**

```bash
git commit -m "fix(api): address smoke test failures after API reduction"
```

---

## Execution Notes

### Key Rules During This Phase
1. **Never remove a service method** — only remove the HTTP route mapping. If a controller method is removed but called internally, you'll get compile errors.
2. **Never break existing Feign client calls** — if `MenuServiceClient.getMenuItem("/api/v1/menu/{id}")` was using the old path, update the Feign client's URL too.
3. **Add before remove** — if collapsing 3 filter endpoints into 1, add the unified endpoint first, verify it works, then remove the 3 old ones.
4. **Test data** — keep `TestDataController` but add `@Profile("dev")` — don't delete the controller entirely.

### Parallel Work Possible
Tasks 1.1–1.4 (core-service) and 1.5 (commerce-service) and 1.6 (logistics) and 1.7 (payment) and 1.8 (intelligence) can be done in parallel across 5 terminals if working on Dell. On Mac, do them sequentially.
