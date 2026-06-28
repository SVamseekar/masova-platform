# MaSoVa Full Codebase Security Audit

Companion to [`oauth_security_audit.md`](./oauth_security_audit.md) (Google OAuth findings — not repeated here). This audit covers the rest of the platform: backend services, frontend, mobile apps, and the AI agent service.

**Follow-up verification (2026-06-22):** All original findings below were re-checked against the live codebase by an independent Cursor agent audit. Every item in the original report was confirmed still present and unfixed. Four additional findings (marked **NEW** in the summary table) were discovered during that pass and are documented in §6–§9 below.

---

## Summary of Findings

| Severity | Area | Issue | Location | Impact | Remediated |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 🔴 **CRITICAL** | AI agent | `cancel_order` tool executes a real cancellation directly from chat — no approval gate | `masova-support/src/masova_agent/tools/backend_tools.py:279-309` | Untrusted chat input cancels live orders with no manager review | |
| 🔴 **CRITICAL** | AI agent | Every agent backend call is sent with `X-User-Type: MANAGER` + a static shared token | `masova-support/.../backend_tools.py:13-20` | Any chat user inherits manager-level backend privilege through the agent | |
| 🔴 **CRITICAL** | Backend | Cross-store IDOR via spoofable `X-Selected-Store-Id`/`X-User-Store-Id` headers | `StoreContextUtil` (all 5 services) + every controller using `getStoreIdFromHeaders()` | Any authenticated user can read/modify another restaurant's inventory, menu, delivery, orders by setting an arbitrary store header | |
| 🟠 **HIGH** | AI agent | IDOR — tool args (`order_id`, `customer_id`) come from LLM-parsed chat text, never bound to the authenticated session identity | `masova-support/.../backend_tools.py:57,181,216,279,312` | A user can read/cancel/refund another customer's order by naming its ID in chat | |
| 🟠 **HIGH** | AI agent | No authentication on `/agent/chat` or `/agents/{name}/trigger` | `masova-support/src/masova_agent/main.py:116-184` | Anyone can impersonate any `customerId`, or fire internal scheduled jobs on demand | |
| 🟠 **HIGH** | Backend | PIN brute-force lockout keyed on spoofable `X-Forwarded-For` | `core-service/.../AuthController.java:166-175` | Unlimited brute-force of 5-digit employee PIN by rotating the header per request | |
| 🟠 **HIGH** | Backend | Identical hardcoded default JWT secret shipped in source across all 6 services | `*/application.yml`, `shared-security/.../JwtTokenProvider.java:17` | If `JWT_SECRET` env var is ever unset anywhere, anyone can forge valid tokens for any user/role/store | |
| 🟡 **MEDIUM** | Mobile | JWT access + refresh tokens stored in plaintext AsyncStorage (no Keychain/Keystore) | `MaSoVaCrewApp/src/store/slices/authSlice.ts:19-23`; `masova-mobile/src/services/api.ts:28-30,126-134` | Refresh-token theft on rooted device / ADB backup → persistent account takeover | **2026-06-23** — Plan B |
| 🟡 **MEDIUM** | AI agent | `submit_complaint`/`request_refund` create real backend records directly, no pending/approval state | `masova-support/.../backend_tools.py:181-213,312-339` | Forged complaints/refund requests attributable to arbitrary customers | |
| 🟡 **MEDIUM** | Backend | Weak `java.util.Random` (not `SecureRandom`) used for delivery OTP in one code path | `commerce-service/.../OrderService.java:437` | Delivery-handoff OTP more predictable than the `SecureRandom` path used elsewhere | |
| 🟡 **MEDIUM** | Backend | Kitchen Display System marked public at commerce-service's own security layer (currently masked by gateway routing) | `commerce-service/.../SecurityConfig.java:38-40` | One gateway-route change or direct LAN hit away from exposing all live kitchen orders with zero auth | |
| 🟡 **MEDIUM** | Frontend | Receipt generator interpolates customer-supplied fields into raw HTML string for download | `frontend/src/components/ReceiptGenerator.tsx:85-230` | Script execution in whatever opens the downloaded receipt file, if name/address/notes contain markup | **2026-06-23** — Plan B |
| 🟢 **LOW** | Mobile | `usesCleartextTraffic` templated, not statically `false`; `masova-mobile` manifest has `allowBackup="true"` | `MaSoVaCrewApp/android/.../AndroidManifest.xml:30`; `masova-mobile/android/.../AndroidManifest.xml:14` | MITM risk if cleartext resolves true in release; ADB backup can exfiltrate tokens on customer app | **2026-06-23** — Plan B |
| 🟢 **LOW** | Frontend | Dead `useSecureAuth.ts` hook uses a different/weaker auth pattern than the canonical RTK Query flow | `frontend/src/hooks/useSecureAuth.ts` | Not currently wired in; risk only if reintroduced later | **2026-06-23** — Plan B |
| 🟠 **HIGH** | Backend | **NEW** — Order-level IDOR: no ownership check on single-order GET or cancel | `commerce-service/.../OrderController.java:94-98,266-272` | Any authenticated `CUSTOMER` can read or cancel any order by MongoDB ObjectId; compounds AI-agent IDOR even if agent auth is fixed | |
| 🟡 **MEDIUM** | Backend | **NEW** — Hardcoded Razorpay test API credentials in source | `payment-service/src/main/resources/application.yml:59-62` | If `RAZORPAY_KEY_*` env vars are unset, committed test keys are used at runtime | |
| 🟡 **MEDIUM** | Backend | **NEW** — Public order tracking returns full order object with no auth or field redaction | `commerce-service/.../OrderController.java:104-107`; gateway route `commerce_orders_track` | Leaked/guessed order IDs expose customer name, address, items, payment status | |
| 🟢 **LOW** | API gateway | **NEW** — CORS allows credentials alongside a wildcard Vercel origin pattern | `api-gateway/.../CorsConfig.java:20-27,38` | Overly broad cross-origin surface if wildcard resolves; preview deployments inherit credentialed access | |

---

## Backend (6 Spring Boot services)

### 1. CRITICAL — Cross-store IDOR via client-supplied store headers

All five services scope queries using a `storeId` pulled straight from request headers:

```java
// logistics-service/.../InventoryController.java:47-55
private String getStoreIdFromHeaders(HttpServletRequest request) {
    String userType = request.getHeader("X-User-Type");
    String selectedStoreId = request.getHeader("X-Selected-Store-Id");
    String userStoreId = request.getHeader("X-User-Store-Id");
    if ("MANAGER".equals(userType) || "CUSTOMER".equals(userType)) {
        return selectedStoreId != null ? selectedStoreId : userStoreId;
    }
    return userStoreId;
}
```

`@PreAuthorize` only validates the **role** claim from the JWT — never that the authenticated user actually belongs to the store named in the header. The gateway makes this worse by blindly forwarding the client's `X-Selected-Store-Id` unvalidated:

```java
// api-gateway/.../JwtAuthenticationFilter.java:132-137
String selectedStoreId = request.getHeaders().getFirst("X-Selected-Store-Id");
if (selectedStoreId != null && !selectedStoreId.trim().isEmpty()) {
    requestBuilder.header("X-Selected-Store-Id", selectedStoreId);
}
```

**Exploit**: A logged-in manager/customer for Store A sends any request with a valid JWT but `X-Selected-Store-Id: <Store B>`. Role check passes; the header is used verbatim to scope the DB query — returning or mutating Store B's inventory, delivery metrics, menu, or OTPs.

**Fix**: Validate server-side that the requesting user's JWT-derived identity actually has access to the requested store (lookup against the user's assigned store list) before honoring `X-Selected-Store-Id`/`X-User-Store-Id`. Never treat a client header as the authorization boundary.

### 2. HIGH — PIN lockout bypass via spoofed `X-Forwarded-For`

```java
// core-service/.../AuthController.java:166-175
String xForwardedFor = request.getHeader("X-Forwarded-For");
if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
    return xForwardedFor.split(",")[0].trim();
}
```

This is the sole key for the 5-attempt/15-minute lockout on `POST /api/auth/validate-pin` (5-digit PIN, 100k combinations). The gateway disables forwarded-header normalization (`api-gateway/.../application.yml:28-36`), so nothing strips an attacker-supplied value. Rotating the header per request resets the lockout bucket every time — unlimited brute force.

**Fix**: Key the lockout on `request.getRemoteAddr()` (true socket peer) unless the gateway is a known, fixed proxy; additionally key by the PIN/user identity being targeted, not solely claimed IP.

### 3. HIGH — Hardcoded JWT secret fallback in every service

```yaml
jwt:
  secret: ${JWT_SECRET:MaSoVa-secret-key-for-jwt-token-generation-very-long-key-must-be-at-least-256-bits-for-production-security}
```

Identical default across all `application.yml` files and `shared-security/.../JwtTokenProvider.java:17`. `JwtTokenProvider` (used by commerce/payment/logistics/intelligence) has **no validation** that rejects this fallback — only core-service and the gateway log a warning, they don't fail startup.

**Exploit**: If `JWT_SECRET` is ever unset in any environment, this exact string (visible in the public/private repo) lets anyone forge a valid HS512 JWT for any user/role/store across every service.

**Fix**: Drop the literal default (`${JWT_SECRET}` with no fallback, fail-fast on missing config) everywhere, and upgrade the existing "warn on weak secret" checks to hard failures. Apply the same `@PostConstruct` validation to `JwtTokenProvider`.

### 4. MEDIUM — Weak PRNG for delivery OTP

```java
// commerce-service/.../OrderService.java:437
String otp = String.format("%04d", new java.util.Random().nextInt(10000));
```
vs. the correct pattern already used elsewhere:
```java
// logistics-service/.../ProofOfDeliveryService.java:50
int otp = secureRandom.nextInt(9000) + 1000;
```
`ProofOfDeliveryService.verifyDeliveryOtp` also has no attempt-count/lockout, compounding predictability with brute-forceability.

**Fix**: Use the shared `SecureRandom` instance for OTP generation in `OrderService`, and add a per-order attempt lockout to `verifyDeliveryOtp`.

### 5. MEDIUM — KDS public at commerce-service's own security layer

```java
// commerce-service/.../SecurityConfig.java:38-40
"/api/orders/kitchen",
"/api/orders/kitchen/**",
```
Listed in `getPublicEndpoints()` — unauthenticated at the service level. Currently masked because the gateway's `commerce_orders` route requires JWT for this path, but it's defense-in-depth that doesn't exist: one routing change or a direct LAN hit to port 8084 exposes all live kitchen orders with zero auth.

**Fix**: Remove these paths from the public allowlist; KDS staff already authenticate via JWT through the gateway.

### 6. HIGH — Order-level IDOR (no ownership check on GET/cancel) **NEW — found 2026-06-22**

`OrderController` has `validateAndGetStoreId()` for list endpoints, but single-order read and cancel bypass it entirely:

```java
// commerce-service/.../OrderController.java:94-98
@GetMapping("/{orderId}")
@PreAuthorize("hasAnyRole('CUSTOMER', 'MANAGER', 'ASSISTANT_MANAGER', 'STAFF', 'DRIVER')")
public ResponseEntity<Order> getOrder(@PathVariable String orderId) {
    return ResponseEntity.ok(orderService.getOrderById(orderId));
}

// commerce-service/.../OrderController.java:266-272
@DeleteMapping("/{orderId}")
@PreAuthorize("hasAnyRole('CUSTOMER', 'MANAGER', 'ASSISTANT_MANAGER', 'STAFF')")
public ResponseEntity<Order> cancelOrder(@PathVariable String orderId, ...) {
    return ResponseEntity.ok(orderService.cancelOrder(orderId, reason));
}
```

`@PreAuthorize` checks role only — never that `order.customerId` matches `X-User-Id` from the JWT. Any authenticated customer holding a valid token can fetch or cancel **any** order if they know (or guess) its ObjectId.

**Exploit**: Enumerate or obtain order IDs from email tracking links, support logs, or WebSocket broadcasts; call `GET /api/orders/{id}` or `DELETE /api/orders/{id}` with a customer JWT.

**Fix**: For `CUSTOMER` role, enforce `order.getCustomerId().equals(X-User-Id)` before returning or mutating. Staff/manager paths should continue to use store-scoped checks (and ideally the store-header validation from Finding 1).

### 7. MEDIUM — Hardcoded Razorpay test credentials in source **NEW — found 2026-06-22**

```yaml
# payment-service/src/main/resources/application.yml:59-62
razorpay:
  key-id: ${RAZORPAY_KEY_ID:rzp_test_RjYYkXMmoArj4C}
  key-secret: ${RAZORPAY_KEY_SECRET:Asbe0hf12kZn0VSX4ykn3Nvq}
  webhook-secret: ${RAZORPAY_WEBHOOK_SECRET:whsec_YOUR_WEBHOOK_SECRET_HERE}
```

Real Razorpay **test** API credentials are committed as YAML fallbacks. The frontend correctly fetches keys from the backend at runtime (not hardcoded in `frontend/src`), but the payment-service itself will boot with these defaults whenever the env vars are missing — same class of risk as the JWT secret fallback (Finding 3).

**Fix**: Remove literal defaults (`${RAZORPAY_KEY_ID}` with no fallback); fail-fast on missing payment config in non-dev profiles. Rotate the exposed test keys in the Razorpay dashboard.

### 8. MEDIUM — Public order tracking exposes full order object **NEW — found 2026-06-22**

```java
// commerce-service/.../OrderController.java:104-107
@GetMapping("/track/{orderId}")
@Operation(summary = "Track order (public, no auth)")
public ResponseEntity<Order> trackOrder(@PathVariable String orderId) {
    return ResponseEntity.ok(orderService.getOrderById(orderId));
}
```

The gateway exposes this intentionally for email tracking links (`commerce_orders_track` route, no JWT). However, the handler returns the **complete** `Order` entity — customer name, phone, delivery address, line items, payment status — with no field redaction and no signed/expiring tracking token.

MongoDB ObjectIds are hard to brute-force, but IDs leak via email links, support chat, logs, and the public rating flow. Anyone with an ID gets full PII.

**Fix**: Return a redacted `OrderTrackingDTO` (status, ETA, item names only); optionally require a signed `?token=` query param bound to the order ID and expiry.

### 9. LOW — CORS wildcard Vercel origin with credentials **NEW — found 2026-06-22**

```java
// api-gateway/.../CorsConfig.java:20-27,38
corsConfig.setAllowedOrigins(Arrays.asList(
    ...
    "https://*.vercel.app"  // All Vercel deployments
));
corsConfig.setAllowCredentials(true);
```

Spring's `setAllowedOrigins` does **not** support subdomain wildcards — the `https://*.vercel.app` entry is likely ineffective at runtime. However, the explicit list already includes a Vercel preview URL pattern, and `allowCredentials(true)` means any origin on that list can send credentialed cross-origin requests (cookies, `Authorization`). A compromised or attacker-controlled Vercel preview deployment on an allowed origin could interact with the API as an authenticated browser session.

**Fix**: Replace wildcard with an explicit allowlist of known production/preview origins; use `setAllowedOriginPatterns` only if subdomain matching is truly required, and keep the list as narrow as possible.

---

## AI Agent (masova-support)

### 1. CRITICAL — `cancel_order` executes directly, no approval gate

```python
# src/masova_agent/tools/backend_tools.py:303
data = _post(f"/orders/{order_id}/cancel", {"reason": reason})
```
Called directly as an LLM tool with no pending-approval step, contradicting the documented design invariant ("agents never auto-write to the DB, they propose; manager approves"). A chat message like "cancel order X" cancels it immediately and auto-triggers a refund per the tool's own response text.

**Fix**: Route `cancel_order` (and `submit_complaint`/`request_refund`) through a pending-approval queue instead of calling `/orders/{id}/cancel` directly, or have the backend independently authorize the request against the order's true owner.

### 2. CRITICAL — Every tool call runs with static manager privilege

```python
# src/masova_agent/tools/backend_tools.py:13-20
h = {"Content-Type": "application/json", "X-User-Type": "MANAGER"}
if token: h["Authorization"] = f"Bearer {token}"
```
Every chat-triggered backend call — regardless of who is chatting — authenticates as `MANAGER` using one shared `AGENT_TOKEN`. Any backend endpoint that trusts manager identity (and per Finding 1 above, the manager-vs-store check doesn't exist either) is fully reachable through the chat agent.

**Fix**: Scope the agent's backend calls to the actual customer's identity (constrained "agent-on-behalf-of-customer" role), not a blanket manager token. Backend endpoints must independently verify resource ownership regardless of caller-claimed role.

### 3. HIGH — IDOR via LLM-parsed chat arguments

None of `get_order_status`, `submit_complaint`, `get_loyalty_points`, `request_refund`, `cancel_order` (`backend_tools.py:57,181,216,279,312`) check the supplied `order_id`/`customer_id` against the session's authenticated `customerId` — it's only used for ADK session bucketing, never passed into the tools.

**Exploit**: A user can name another customer's order/customer ID in chat text and the tool will fetch/mutate it, since nothing scopes the call to the requester's own identity.

**Fix**: Tools taking `customer_id` should ignore the LLM-extracted value and use the session-bound identity instead; order-only tools must have the backend verify the order belongs to the calling customer.

### 4. HIGH — No auth on `/agent/chat` or `/agents/{name}/trigger`

`main.py:116-184` — no `Depends(...)`/API key/JWT check on either endpoint set. Combined with Finding 3, anyone can impersonate any `customerId` by putting it in the request body, and anyone can fire internal scheduled jobs (forecasting, churn, pricing) on demand.

**Fix**: Require an API key/JWT on `/agent/chat` that ties the verified caller to `customerId` (reject mismatches); gate `/agents/*/trigger` behind manager auth or a service-to-service secret.

### 5. MEDIUM — Complaint/refund tools write real records with no approval state

`submit_complaint`/`request_refund` (`backend_tools.py:181-213,312-339`) create real backend tickets/refund requests directly. They don't disburse money themselves, but bypass the "propose, don't write" pattern, enabling forged complaints/refund requests attributed to arbitrary customers (compounding Finding 3).

**Fix**: Create these as pending/draft records requiring manager confirmation, consistent with the rest of the agent design.

**Confirmed non-issues**: no SSRF (all calls target the env-configured `backend_url`, never user input), no hardcoded secrets (`.env` gitignored, keys via `os.getenv`), no `eval`/`exec`/`pickle`/unsafe YAML/subprocess anywhere in the service. Background scheduled agents (demand forecasting, churn prevention, inventory reorder, review response) correctly appear to only produce recommendations, not direct writes.

---

## Frontend

### 1. MEDIUM — Receipt HTML template injection

```tsx
// frontend/src/components/ReceiptGenerator.tsx:85-230 (generateReceiptHTML)
```
Builds a downloadable HTML file by directly string-interpolating `customerName`, `customerPhone`, `deliveryAddress`, `item.specialInstructions`, etc., with no escaping, then triggers a `Blob` download. If any of those fields contain `<script>` or event-handler markup, opening the resulting file executes it in the context of whoever opens it (e.g. a staff member's Downloads folder) — not a same-origin XSS against the live SPA, but a real script-execution foothold.

**Fix**: HTML-escape all interpolated fields before constructing `receiptHTML`, or render/export the already-safe in-page React DOM (lines 276-412) instead of building raw HTML strings.

**Remediated 2026-06-23 (Plan B):** `generateReceiptHTML` in `frontend/src/utils/receiptHtml.ts` with `escapeHTML()` on all customer-supplied fields; `receiptHtml.test.ts` covers script/event-handler payloads.

### 2. LOW — Dead `useSecureAuth.ts` hook

Not imported anywhere; uses a different token-storage scheme and bypasses CSRF/return-URL protections the canonical `authSlice.ts`/`axios.ts` flow has. No current risk, but a latent trap if reintroduced.

**Fix**: Delete it, or mark it clearly deprecated/unused.

**Remediated 2026-06-23 (Plan B):** `frontend/src/hooks/useSecureAuth.ts` deleted.

**Confirmed non-issues**: no `dangerouslySetInnerHTML`/`eval`/`Function()` use anywhere in `frontend/src`; no hardcoded payment/API secrets (Razorpay key comes from backend response, Maps key is an intentionally-public `VITE_` var); no postMessage/iframe/origin-check gaps in delivery tracking maps; WebSocket topics are backend-authorized per-channel; open-redirect protection (`utils/security.ts:460-482`) correctly validates return URLs; Bearer-token-only auth confirms CSRF is out of scope.

---

## Mobile (MaSoVaCrewApp + masova-mobile)

### 1. MEDIUM — JWT tokens stored in plaintext AsyncStorage

```js
// MaSoVaCrewApp/src/store/slices/authSlice.ts:19-23
const STORAGE_KEYS = { ACCESS_TOKEN: 'auth_accessToken', REFRESH_TOKEN: 'auth_refreshToken', USER: 'auth_user' };
```
```js
// masova-mobile/src/services/api.ts:28-30,126-134
const AUTH_TOKEN_KEY = 'masova_auth_token';
const REFRESH_TOKEN_KEY = 'masova_refresh_token';
```
Both apps persist access + refresh tokens via redux-persist/AsyncStorage — unencrypted on-device storage. On a rooted/jailbroken device, or via ADB backup extraction, the long-lived refresh token can be read directly and used to mint new access tokens indefinitely.

**Fix**: Migrate to `react-native-keychain` or `react-native-encrypted-storage` for tokens specifically; keep AsyncStorage for non-sensitive UI state only. Neither package is currently a dependency in either app.

**Remediated 2026-06-23 (Plan B):** `react-native-keychain` + `secureTokenStorage.ts` in both apps with legacy AsyncStorage migration. **Post-deploy manual:** `pod install` (iOS) per app.

### 2. LOW — Backup/cleartext config gaps

- `MaSoVaCrewApp/android/.../AndroidManifest.xml:30` — `usesCleartextTraffic` is templated (`${usesCleartextTraffic}`), not statically forced `false`; confirm release builds resolve it to `false`.
- `masova-mobile/android/.../AndroidManifest.xml:14` — `android:allowBackup="true"` (CrewApp correctly sets `false`) — allows ADB backup extraction of the customer app's sandbox, compounding Finding 1.

**Fix**: Set `android:allowBackup="false"` for masova-mobile; verify `usesCleartextTraffic` resolves to `false` in release config.

**Remediated 2026-06-23 (Plan B):** `masova-mobile` `allowBackup="false"`; MaSoVaCrewApp release `manifestPlaceholders.usesCleartextTraffic="false"`. Verify: `cd MaSoVaCrewApp/android && ./gradlew :app:processReleaseManifest`.

**Confirmed non-issues**: no hardcoded API keys/secrets in either app; no deep-link injection surface (no inbound `Linking` handlers registered in either app); `RoleRouter`/`AppNavigator` role gating is UX-only as expected — needs the backend-side store/role checks above to actually matter, but isn't itself a vulnerability; WebView usage (`LocationMapModal.tsx`) loads a fixed OpenStreetMap URL built from the device's own GPS coords, not attacker-controlled; iOS ATS (`NSAllowsArbitraryLoads: false`) is correctly configured.

---

## Priority Remediation Order

1. **AI agent**: gate `cancel_order`/`request_refund`/`submit_complaint` behind approval, scope tool calls to the authenticated customer, add auth to `/agent/chat` and `/agents/*/trigger` — these are live, directly exploitable, no-auth-required paths to unauthorized order cancellation.
2. **Backend**: fix the store-header IDOR (affects every service, every store) and remove the hardcoded JWT secret fallback — both are blast-radius-wide.
3. **Backend** *(NEW)*: add order ownership checks on `GET /api/orders/{id}` and `DELETE /api/orders/{id}` for `CUSTOMER` role — half-day fix, closes a direct IDOR independent of the AI agent.
4. **Backend**: fix PIN lockout key and OTP randomness — narrower but still concrete account/delivery-fraud risk.
5. **Backend** *(NEW)*: redact public order tracking response; remove Razorpay test-key fallbacks from `payment-service/application.yml`.
6. ~~**Mobile**: migrate token storage to Keychain/Keystore~~ — **done 2026-06-23 (Plan B)**.
7. ~~**Frontend**: escape receipt HTML~~ — **done 2026-06-23 (Plan B)**.
8. **API gateway** *(NEW)*: tighten CORS allowlist — low urgency but easy win.
