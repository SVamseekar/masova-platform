# Security Remediation Plan A — Backend, Gateway, AI Agent, OAuth

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. Run on Dell (backend services) and Mac (masova-support) as noted per task.

**Goal:** Close every CRITICAL/HIGH finding that lets an authenticated (or in the AI agent's case, unauthenticated) caller read or mutate data belonging to another store, customer, or order, and remove silent-failure default-credential fallbacks across all 6 Spring Boot services, the API gateway, and the AI agent.

**Design spec:** [`2026-06-22-security-remediation-design.md`](../specs/2026-06-22-security-remediation-design.md)

**Source findings:** [`full_codebase_security_audit.md`](../../full_codebase_security_audit.md) §Backend, §AI Agent; [`oauth_security_audit.md`](../../oauth_security_audit.md)

**Tech stack:** Java 21, Spring Boot 3, Spring Cloud Gateway, MongoDB + PostgreSQL dual-write, `shared-security` module, Python 3 / FastAPI / Google ADK (masova-support).

**Mandatory after every task:** run both `superpowers:code-reviewer` and `feature-dev:code-reviewer` agents on the diff before moving to the next task. Fix all issues found before committing (per CLAUDE.md memory requirement).

---

## Priority order (per design spec §7)

1. AI agent auth + approval gate (Tasks 1–4)
2. Backend store/order IDOR (Tasks 5–7)
3. JWT secret + Razorpay fallback removal (Tasks 8–9)
4. PIN lockout + OTP PRNG (Tasks 10–11)
5. KDS public endpoint + order tracking redaction + CORS (Tasks 12–14)
6. OAuth fixes (Tasks 15–17)

---

### Task 1: Add authentication to `/agent/chat` and `/agents/{name}/trigger`

**Files:**
- Modify: `masova-support/src/masova_agent/main.py` (lines 116–184)
- Modify: `masova-support/src/masova_agent/config.py` or equivalent settings module (add API key / shared secret config)

- [ ] **Step 1: Define an API key dependency**

Add a FastAPI dependency that validates a bearer token or `X-API-Key` header against an env-configured secret (`AGENT_API_KEY`), distinct from the existing `AGENT_TOKEN` used for backend calls.

- [ ] **Step 2: Require the dependency on `/agent/chat`**

The chat endpoint must reject requests without a valid caller credential. The credential must resolve to a verified `customerId` (e.g. the gateway forwards the customer's JWT, or the agent validates the JWT itself using the shared `shared-security` JWT verification logic) — not an arbitrary `customerId` in the request body.

- [ ] **Step 3: Reject `customerId` mismatches**

If the request body includes a `customerId` that doesn't match the verified identity from the credential, return 403.

- [ ] **Step 4: Gate `/agents/{name}/trigger` behind manager auth or service secret**

Require either a manager-role JWT or a separate service-to-service secret (`INTERNAL_TRIGGER_SECRET`) — this endpoint fires internal scheduled jobs and must not be publicly callable.

- [ ] **Step 5: Write tests**

Create/extend `masova-support/tests/test_main.py` (or equivalent) with cases: no credential → 401, mismatched `customerId` → 403, valid credential matching `customerId` → 200, `/agents/*/trigger` without manager auth → 401/403.

---

### Task 2: Bind AI agent tool calls to the authenticated customer identity, not LLM-parsed arguments

**Files:**
- Modify: `masova-support/src/masova_agent/tools/backend_tools.py` (lines 57, 181, 216, 279, 312)

- [ ] **Step 1: Thread the verified `customerId` from the request context into the ADK session**

The session-bound identity established in Task 1 must be available to tool functions, not just used for session bucketing.

- [ ] **Step 2: For `get_order_status`, `submit_complaint`, `get_loyalty_points`, `request_refund`, `cancel_order` — ignore LLM-extracted `customer_id`**

Replace any `customer_id` parameter sourced from LLM-parsed chat text with the session-bound identity. The LLM may still extract `order_id` from chat text, but the backend call must additionally pass the verified `customerId` so the backend (Task 6) can enforce ownership.

- [ ] **Step 3: Write tests**

Add unit tests asserting that a tool call with a chat-supplied `customer_id` different from the session identity still resolves/acts using the session identity, never the chat-supplied one.

---

### Task 3: Remove the static `MANAGER` privilege header from agent backend calls

**Files:**
- Modify: `masova-support/src/masova_agent/tools/backend_tools.py` (lines 13–20)

- [ ] **Step 1: Replace the blanket `X-User-Type: MANAGER` header**

Scope outbound backend calls to a constrained "agent-on-behalf-of-customer" identity: forward the verified `customerId` from Task 1/2 and a distinct `X-User-Type: AGENT` (or `CUSTOMER`, matching the actual caller's role) header instead of always claiming `MANAGER`.

- [ ] **Step 2: Add backend-side recognition of the new role/header (coordinate with Task 6)**

The backend must independently verify resource ownership for agent-originated calls regardless of the claimed role — this task only stops the agent from *claiming* manager privilege; Task 6 closes the loop so claiming it wouldn't matter anyway.

- [ ] **Step 3: Write tests**

Verify outbound HTTP calls in `backend_tools.py` no longer set `X-User-Type: MANAGER` unconditionally; confirm the header reflects the real caller context.

---

### Task 4: Gate `cancel_order`, `submit_complaint`, `request_refund` behind a pending-approval state

**Files:**
- Modify: `masova-support/src/masova_agent/tools/backend_tools.py` (lines 181–213, 279–309, 312–339)
- Backend: identify or create a pending-action endpoint in commerce-service (coordinate — this may already have a manager-approval pattern elsewhere in the codebase; check before adding a new one)

- [ ] **Step 1: Survey existing approval/pending patterns**

Before adding new endpoints, search the codebase (Serena/grep) for any existing "pending approval" or "draft" pattern on orders/complaints/refunds that this can reuse.

- [ ] **Step 2: Change `cancel_order` to create a pending cancellation request, not call `/orders/{id}/cancel` directly**

The tool should call a new or existing endpoint that records the request and notifies a manager, rather than mutating order state immediately.

- [ ] **Step 3: Apply the same pattern to `submit_complaint` and `request_refund`**

These already create backend records (per audit, they're "real" but lack approval) — change them to a pending/draft status requiring manager confirmation, consistent with the documented design invariant.

- [ ] **Step 4: Write tests**

Confirm calling these tools no longer mutates live order/complaint/refund state directly — only creates a pending record.

---

### Task 5: Add server-side store-membership validation for `X-Selected-Store-Id`/`X-User-Store-Id`

**Files:**
- Modify: `api-gateway/src/main/java/com/MaSoVa/gateway/filter/JwtAuthenticationFilter.java` (lines 132–137)
- Modify: each service's `StoreContextUtil` equivalent (logistics-service `InventoryController.java:47-55` and equivalents in commerce/payment/intelligence/core)
- Reference: `shared-security` module for any shared store-membership lookup

- [ ] **Step 1: Determine where store-membership is authoritative**

Find where a user's assigned store(s) are stored (likely on the `User` entity / JWT claims). Confirm whether the JWT already carries a `storeId` claim or whether a DB lookup is needed.

- [ ] **Step 2: Add a shared validation helper in `shared-security` or `shared-models`**

Create a method (e.g. `validateStoreAccess(jwtUserId, requestedStoreId)`) that checks the requesting user's JWT-derived identity actually has access to the requested store — used identically by all 5 services and the gateway.

- [ ] **Step 3: Update the gateway to validate before forwarding**

In `JwtAuthenticationFilter.java`, validate `X-Selected-Store-Id` against the user's allowed stores before forwarding the header; reject with 403 on mismatch.

- [ ] **Step 4: Update every service's `getStoreIdFromHeaders()`/`StoreContextUtil` equivalent**

Apply the same validation at the service level too (defense in depth — the gateway check alone isn't sufficient if a service is ever reachable directly). Update logistics-service `InventoryController.java`, and the equivalent in commerce-service, payment-service, intelligence-service, core-service.

- [ ] **Step 5: Write tests**

For each service: test that a JWT for Store A's manager/customer requesting Store B's data via the header is rejected (403), and that legitimate same-store requests still succeed. Include a multi-store manager case if that's a supported role configuration.

---

### Task 6: Add order-ownership checks to `GET /api/orders/{orderId}` and `DELETE /api/orders/{orderId}`

**Files:**
- Modify: `commerce-service/src/main/java/com/MaSoVa/commerce/order/controller/OrderController.java` (lines 94–98, 266–272)
- Modify: `commerce-service/src/main/java/com/MaSoVa/commerce/order/service/OrderService.java` (add ownership check method if not present)

- [ ] **Step 1: Add an ownership check method to `OrderService`**

`assertCustomerOwnsOrder(orderId, jwtUserId)` (or similar) — throws 403 if the requesting `CUSTOMER` role's `X-User-Id` doesn't match `order.getCustomerId()`.

- [ ] **Step 2: Apply the check in `getOrder()`**

For `CUSTOMER` role only — staff/manager roles continue using store-scoped checks from Task 5 instead.

- [ ] **Step 3: Apply the check in `cancelOrder()`**

Same pattern — `CUSTOMER` must own the order; staff/manager use store-scoped authorization.

- [ ] **Step 4: Write tests**

Customer A's JWT requesting/cancelling Customer B's order → 403. Customer A requesting their own order → 200. Manager requesting any order in their store → 200 (uses Task 5's store check, not this one).

---

### Task 7: Bind AI-agent-originated backend calls to ownership checks (closes loop with Task 3)

**Files:**
- Confirm: `commerce-service/.../OrderController.java` (already fixed in Task 6) now rejects agent calls that don't match the order's true customer, regardless of the `X-User-Type` header the agent sends.

- [ ] **Step 1: Verify end-to-end**

Write an integration test: agent backend call with a customer-context header but an order ID belonging to a different customer → 403 from commerce-service, propagated as a clear error back through `backend_tools.py` (not a silent failure or raw 500).

- [ ] **Step 2: Confirm `masova-support` surfaces backend 403s as a user-facing "I can't do that" message**

Per CLAUDE.md: "If Gemini/LLM call fails, fall back to rule-based response — never surface raw API errors to user." Apply the same principle to backend auth failures — don't leak stack traces/raw error bodies into the chat response.

---

### Task 8: Remove hardcoded JWT secret fallback; fail-fast on missing config

**Files:**
- Modify: all `*/application.yml` (api-gateway, core, commerce, payment, logistics, intelligence)
- Modify: `shared-security/src/main/java/com/MaSoVa/shared/security/JwtTokenProvider.java` (line 17)

- [ ] **Step 1: Remove the literal default from every `application.yml`**

Change `${JWT_SECRET:MaSoVa-secret-key-...}` to `${JWT_SECRET}` (no fallback) in all 6 services.

- [ ] **Step 2: Add `@PostConstruct` validation to `JwtTokenProvider`**

Fail application startup if the resolved secret is null, empty, or matches the known-leaked literal string (keep the literal as a denylist constant for one release to catch any environment still using it, then remove the denylist).

- [ ] **Step 3: Upgrade existing warn-only checks in core-service and gateway to hard failures**

Find the existing "warn on weak secret" log statements and change them to throw on startup.

- [ ] **Step 4: Update local dev `.env`/docs**

Ensure `JWT_SECRET` is documented as required in whatever local setup doc backend devs use (e.g. STARTUP-GUIDE.md) so this doesn't break Dell dev startup.

- [ ] **Step 5: Write tests**

Unit test that `JwtTokenProvider` throws on null/empty/denylisted secret at construction.

---

### Task 9: Remove hardcoded Razorpay test credentials

**Files:**
- Modify: `payment-service/src/main/resources/application.yml` (lines 59–62)

- [ ] **Step 1: Remove the literal fallback values**

Change `${RAZORPAY_KEY_ID:rzp_test_...}` etc. to `${RAZORPAY_KEY_ID}` (no fallback) for all three Razorpay properties.

- [ ] **Step 2: Add fail-fast validation in non-dev profiles**

Similar `@PostConstruct` pattern as Task 8 — fail startup if these are unset in non-`dev` Spring profiles; allow a `dev` profile fallback only if needed for local testing, but never the real test key (use an obviously-fake placeholder for dev).

- [ ] **Step 3: Flag credential rotation as a manual follow-up**

This task only removes the hardcoded value from source — rotating the actual exposed key in the Razorpay dashboard is a manual action for the user (see design spec §5, out of scope for automated execution). Note it explicitly in the task completion summary.

---

### Task 10: Fix PIN lockout key to use true socket peer, not spoofable header

**Files:**
- Modify: `core-service/src/main/java/com/MaSoVa/core/user/controller/AuthController.java` (lines 166–175)

- [ ] **Step 1: Replace `X-Forwarded-For`-based IP extraction**

Use `request.getRemoteAddr()` unless the gateway is verified to be the sole, fixed-IP proxy in front of this service (check `api-gateway/.../application.yml:28-36` forwarded-header config referenced in the audit).

- [ ] **Step 2: Add identity-based keying in addition to IP**

Key the lockout bucket on `(targeted PIN/user identity, IP)` rather than IP alone, so rotating source IP doesn't fully reset the bucket if the same target is being brute-forced.

- [ ] **Step 3: Write tests**

Test that spoofing `X-Forwarded-For` across repeated requests no longer resets the lockout counter.

---

### Task 11: Fix weak PRNG for delivery OTP; add attempt lockout

**Files:**
- Modify: `commerce-service/src/main/java/com/MaSoVa/commerce/order/service/OrderService.java` (line 437)
- Modify: `logistics-service/src/main/java/com/MaSoVa/logistics/delivery/.../ProofOfDeliveryService.java` (around line 50, `verifyDeliveryOtp`)

- [ ] **Step 1: Replace `java.util.Random` with the shared `SecureRandom` instance**

Match the pattern already used in `ProofOfDeliveryService.java:50`.

- [ ] **Step 2: Add per-order attempt lockout to `verifyDeliveryOtp`**

Cap verification attempts (e.g. 5 per order) before requiring OTP regeneration.

- [ ] **Step 3: Write tests**

Confirm OTP generation uses `SecureRandom`; confirm lockout triggers after the attempt cap.

---

### Task 12: Remove KDS endpoints from commerce-service's public allowlist

**Files:**
- Modify: `commerce-service/src/main/java/com/MaSoVa/commerce/config/SecurityConfig.java` (lines 38–40)

- [ ] **Step 1: Remove `/api/orders/kitchen` and `/api/orders/kitchen/**` from `getPublicEndpoints()`**

KDS staff already authenticate via JWT through the gateway — this allowlist entry is unnecessary defense-in-depth removal, not a functional change.

- [ ] **Step 2: Verify gateway routing still works end-to-end**

Confirm the gateway's `commerce_orders` route (which already requires JWT) is unaffected, and a direct hit to the service port without a JWT now correctly 401s.

---

### Task 13: Redact public order tracking response

**Files:**
- Modify: `commerce-service/src/main/java/com/MaSoVa/commerce/order/controller/OrderController.java` (lines 104–107)
- Create: `commerce-service/src/main/java/com/MaSoVa/commerce/order/dto/OrderTrackingDTO.java`

- [ ] **Step 1: Create `OrderTrackingDTO`**

Fields: order status, ETA, item names only (no customer name/phone/address/payment status).

- [ ] **Step 2: Update `trackOrder()` to return the DTO instead of the full `Order` entity**

- [ ] **Step 3 (stretch, confirm with user before implementing): Add a signed/expiring tracking token**

If pursued: generate a signed token bound to order ID + expiry at order creation, require it as a query param on `/track/{orderId}`. This is a larger change — implement the DTO redaction (Steps 1–2) first as the minimum fix; treat the signed-token enhancement as optional/follow-up.

- [ ] **Step 4: Write tests**

Confirm `trackOrder()` response no longer includes customer PII fields.

---

### Task 14: Tighten CORS allowlist

**Files:**
- Modify: `api-gateway/src/main/java/com/MaSoVa/gateway/config/CorsConfig.java` (lines 20–27, 38)

- [ ] **Step 1: Replace the `https://*.vercel.app` wildcard entry**

Since `setAllowedOrigins` doesn't support subdomain wildcards, replace with an explicit list of known production/preview origins actually in use.

- [ ] **Step 2: Confirm `allowCredentials(true)` is still needed**

If credentialed cross-origin requests are required, keep it, but ensure the explicit origin list is as narrow as possible.

- [ ] **Step 3: Write tests**

Confirm requests from an origin not on the explicit list are rejected; confirm legitimate frontend origin still works.

---

### Task 15: Fix Google OAuth audience verification bypass

**Files:**
- Modify: `core-service/src/main/java/com/MaSoVa/core/user/service/UserService.java` (around line 358, both `loginWithGoogle` and `registerWithGoogle`)

- [ ] **Step 1: Remove the bypass when `googleOAuthClientId` is blank**

Per the audit's Fix A diff: if `googleOAuthClientId` is null/empty, throw `IllegalStateException` (server misconfigured) instead of skipping the audience check.

- [ ] **Step 2: Always enforce the audience check when configured**

Apply to both `loginWithGoogle` and `registerWithGoogle`.

- [ ] **Step 3: Add `email_verified` claim check**

Reject the token if `email_verified` is present and `false`.

- [ ] **Step 4: Write tests**

Extend `core-service/src/test/java/com/MaSoVa/core/unit/controller/AuthControllerTest.java` (or `UserServiceTest`): blank client-id config → login throws; mismatched audience → throws; `email_verified: false` → throws; valid token → succeeds.

---

### Task 16: Fix Google registration phone placeholder (uniqueness + validation regex)

**Files:**
- Modify: `core-service/src/main/java/com/MaSoVa/core/user/service/UserService.java` (around line 440, `registerWithGoogle`)

- [ ] **Step 1: Generate a unique, validation-passing temporary phone**

Per the audit's suggested fix: `"9" + String.format("%09d", Math.abs((googleSub + email).hashCode()) % 1000000000L)` — or equivalent that guarantees uniqueness per Google `sub` and passes `^[6-9]\d{9}$`.

- [ ] **Step 2: Confirm downstream profile-completion flow**

Verify the frontend/registration flow already prompts the user to update their real phone number post-OAuth-signup (audit implies this exists — confirm, don't assume).

- [ ] **Step 3: Write tests**

Two sequential Google registrations with different `sub`/`email` → both succeed (no unique constraint violation); generated phone passes the `@Pattern` validator.

---

### Task 17: Switch Google token verification to local cryptographic validation (performance fix, bundle with Task 15)

**Files:**
- Modify: `core-service/pom.xml` (add `com.google.api-client:google-api-client`)
- Modify: `core-service/.../UserService.java` (`verifyGoogleIdToken` method)

- [ ] **Step 1: Add the `google-api-client` dependency**

- [ ] **Step 2: Replace the online tokeninfo HTTP call with `GoogleIdTokenVerifier`**

Per the audit's Fix B — use cached public keys for local signature verification instead of an HTTP round-trip to `oauth2.googleapis.com` on every login.

- [ ] **Step 3: Preserve the same claims map shape**

Ensure `sub`, `email`, `email_verified`, `name`, `aud` are still populated identically so Tasks 15–16's logic doesn't need to change.

- [ ] **Step 4: Write tests**

Mock `GoogleIdTokenVerifier` to confirm `verifyGoogleIdToken` no longer makes an outbound HTTP call; confirm claims extraction still matches expected shape.

---

## Final verification (after all tasks)

- [ ] Run `superpowers:code-reviewer` and `feature-dev:code-reviewer` on the full diff one more time
- [ ] Re-run the full backend test suite per service on Dell (`mvn verify -DskipITs -pl <service> ...` per CLAUDE.md memory's SSH/test commands)
- [ ] Manually re-verify each finding's exploit path no longer works (per design spec §4 acceptance criteria)
- [ ] Update `docs/full_codebase_security_audit.md` and `docs/oauth_security_audit.md` with a "Remediated" column/date once each finding is closed
