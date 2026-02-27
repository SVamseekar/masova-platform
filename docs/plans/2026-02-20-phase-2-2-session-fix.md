# Phase 2.2 — Session Bug Fix Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix the "refresh = logout" session bug so users stay logged in across page reloads and token expiry, and properly invalidate tokens on logout via the Redis blacklist.

**Architecture:** Three independent fixes applied in order: (1) migrate the Redis JWT blacklist from Phase 2.1 into core-service's JwtService and wire it to the logout endpoint; (2) fix the stale legacy axios.ts interceptor which reads raw localStorage keys that don't exist in the Redux auth state; (3) unify the two conflicting refresh endpoint URLs that cause silent refresh failures.

**Tech Stack:** Java 21 / Spring Boot 3 (core-service), Spring Data Redis (StringRedisTemplate), React 19 / TypeScript (frontend), Redux Toolkit / RTK Query, axios.

---

## Critical Context

- **core-service** is at `core-service/src/main/java/com/MaSoVa/core/`
- **Redis is already wired** in core-service: `application.yml` lines 13-22 configure lettuce pool, `spring.cache.type=redis` is active
- **Redis is used** in EmailService for rate limiting — `StringRedisTemplate` is available as a Spring bean
- **JwtService** is at `core-service/src/main/java/com/MaSoVa/core/user/service/JwtService.java` — no Redis dependency yet
- **UserService.logout()** at line 398 only ends working sessions, does NOT blacklist the token
- **Logout controller** at `UserController.java:174` receives `X-User-Id` header but NOT the Bearer token — needs to be changed to extract the token from `Authorization` header
- **SecurityConfig** marks `/api/users/logout` as PUBLIC (line 40 of core SecurityConfig) — meaning JwtAuthFilter does NOT set SecurityContext for it, so we must manually extract the Bearer token in the controller
- **shared-security filter** `JwtAuthenticationFilter.java` validates token but does NOT check a blacklist — needs blacklist check added
- **Frontend baseQueryWithAuth.ts** correctly uses `/users/refresh` endpoint and mutex-based thread-safe refresh — this is the **correct** implementation
- **Frontend axios.ts** is a **legacy file** that reads `localStorage.accessToken` and `localStorage.refreshToken` directly (keys that do NOT exist — Redux uses `auth_accessToken` / `auth_refreshToken`) and calls `/refresh-token` (non-existent endpoint). This interceptor silently fails and never retries, causing apparent "logout on error"
- **authApi.ts** references `/users/refresh-token` — this endpoint does NOT exist on the backend (only `/users/refresh` does)
- **useTokenRefresh.ts** correctly uses `/users/refresh` — consistent with baseQueryWithAuth

---

## Fix Map (3 tasks, sequential)

| Task | Component | Issue | Fix |
|------|-----------|-------|-----|
| 1 | core-service JwtService | No Redis blacklist | Add `invalidateToken()` + `isBlacklisted()` methods |
| 2 | core-service UserController + UserService | Logout doesn't blacklist token | Extract Bearer token in controller, pass to `logout()`, call `jwtService.invalidateToken()` |
| 3 | shared-security JwtAuthFilter | Doesn't check blacklist | Inject `StringRedisTemplate`, check blacklist before passing auth |
| 4 | frontend axios.ts | Legacy interceptor reading wrong storage keys, wrong endpoint | Remove token refresh logic; let Redux handle it |
| 5 | frontend authApi.ts | Wrong refresh endpoint `/refresh-token` | Fix to `/refresh` to match backend |

---

## Task 1: Add Redis Blacklist to JwtService

**Files:**
- Modify: `core-service/src/main/java/com/MaSoVa/core/user/service/JwtService.java`

**Step 1: Add StringRedisTemplate field**

At line 10, after the existing imports, add:
```java
import org.springframework.data.redis.core.StringRedisTemplate;
import java.util.concurrent.TimeUnit;
```

After the `@Service` annotation class fields (after line 51, `kioskRefreshTokenExpiration`), add:

```java
private static final String BLACKLIST_PREFIX = "jwt:blacklist:";

@Autowired
private StringRedisTemplate redisTemplate;
```

**Step 2: Add `invalidateToken()` method**

After the `generateKioskRefreshToken()` method (after line 149), add:

```java
/**
 * Blacklist a token in Redis until its natural expiry.
 * Called on logout. Fail-open: if Redis is down, log the error but don't block logout.
 */
public void invalidateToken(String token) {
    try {
        Date expiration = extractExpiration(token);
        long remainingMs = expiration.getTime() - System.currentTimeMillis();
        if (remainingMs > 0) {
            redisTemplate.opsForValue().set(
                BLACKLIST_PREFIX + token, "1", remainingMs, TimeUnit.MILLISECONDS
            );
            logger.debug("Token blacklisted, expires in {}ms", remainingMs);
        }
    } catch (Exception e) {
        logger.warn("Failed to blacklist token (Redis may be down): {}", e.getMessage());
    }
}

/**
 * Check whether a token has been blacklisted (i.e., user logged out).
 * Fail-open: if Redis is down, returns false (allow the request) to prevent lockouts.
 */
public boolean isBlacklisted(String token) {
    try {
        return Boolean.TRUE.equals(redisTemplate.hasKey(BLACKLIST_PREFIX + token));
    } catch (Exception e) {
        logger.warn("Redis blacklist check failed (fail-open): {}", e.getMessage());
        return false;
    }
}
```

**Step 3: Verify it compiles**

```bash
cd /Users/souravamseekarmarti/Projects/MaSoVa-restaurant-management-system
JAVA_HOME=$(ls -d /Library/Java/JavaVirtualMachines/temurin-21.*/Contents/Home | head -1) \
  mvn compile -pl core-service -am -q 2>&1 | tail -20
```

Expected: BUILD SUCCESS with no errors.

**Step 4: Commit**

```bash
git add core-service/src/main/java/com/MaSoVa/core/user/service/JwtService.java
git commit -m "feat(core): add Redis JWT blacklist to JwtService — invalidateToken + isBlacklisted"
```

---

## Task 2: Wire Blacklist to Logout Endpoint

**Files:**
- Modify: `core-service/src/main/java/com/MaSoVa/core/user/controller/UserController.java`
- Modify: `core-service/src/main/java/com/MaSoVa/core/user/service/UserService.java`

**Step 1: Update `UserService.logout()` to accept and blacklist the token**

Find `UserService.java` line 398:
```java
public void logout(String userId) {
```

Replace the entire method with:
```java
public void logout(String userId, String accessToken) {
    // Blacklist the access token so it cannot be reused after logout
    if (accessToken != null && !accessToken.isBlank()) {
        jwtService.invalidateToken(accessToken);
    }

    User user = getUserById(userId);
    if (user.isEmployee()) {
        try {
            sessionService.endSession(userId);
        } catch (Exception e) {
            logger.error("Failed to end working session for user {}: {}", userId, e.getMessage(), e);
        }
    }
}
```

**Step 2: Update `UserController.logout()` to extract Bearer token and pass it**

Find `UserController.java` line 174:
```java
@PostMapping("/logout")
@Operation(summary = "User logout")
@SecurityRequirement(name = "bearerAuth")
public ResponseEntity<Map<String, String>> logout(@RequestHeader("X-User-Id") String userId) {
    userService.logout(userId);
    return ResponseEntity.ok(Map.of("message", "Logged out successfully"));
}
```

Replace with:
```java
@PostMapping("/logout")
@Operation(summary = "User logout")
@SecurityRequirement(name = "bearerAuth")
public ResponseEntity<Map<String, String>> logout(
        @RequestHeader("X-User-Id") String userId,
        HttpServletRequest request) {
    String authHeader = request.getHeader("Authorization");
    String accessToken = (authHeader != null && authHeader.startsWith("Bearer "))
        ? authHeader.substring(7)
        : null;
    userService.logout(userId, accessToken);
    return ResponseEntity.ok(Map.of("message", "Logged out successfully"));
}
```

Note: `HttpServletRequest` is already imported at line 18.

**Step 3: Verify it compiles**

```bash
JAVA_HOME=$(ls -d /Library/Java/JavaVirtualMachines/temurin-21.*/Contents/Home | head -1) \
  mvn compile -pl core-service -am -q 2>&1 | tail -20
```

Expected: BUILD SUCCESS.

**Step 4: Commit**

```bash
git add core-service/src/main/java/com/MaSoVa/core/user/controller/UserController.java \
        core-service/src/main/java/com/MaSoVa/core/user/service/UserService.java
git commit -m "feat(core): wire JWT blacklist to logout — token invalidated on every logout call"
```

---

## Task 3: Check Blacklist in JwtAuthenticationFilter

**Files:**
- Modify: `shared-security/src/main/java/com/MaSoVa/shared/security/filter/JwtAuthenticationFilter.java`

**Step 1: Read the full filter file to understand its current structure**

Read `shared-security/src/main/java/com/MaSoVa/shared/security/filter/JwtAuthenticationFilter.java` before editing.

**Step 2: Add StringRedisTemplate injection**

The filter is a Spring `@Component`. It already uses `@Autowired` for `JwtTokenProvider`. Add:

```java
@Autowired(required = false)
private org.springframework.data.redis.core.StringRedisTemplate redisTemplate;

private static final String BLACKLIST_PREFIX = "jwt:blacklist:";
```

The `required = false` prevents startup failure if Redis is not available in a service that doesn't have Redis configured (shared-security is used across services — logistics-service, payment-service may not have Redis).

**Step 3: Add blacklist check in `doFilterInternal()`**

Find the line that reads:
```java
if (StringUtils.hasText(jwt) && tokenProvider.validateToken(jwt)) {
```

Replace with:
```java
if (StringUtils.hasText(jwt) && tokenProvider.validateToken(jwt) && !isBlacklisted(jwt)) {
```

Then add the helper method to the class (before the final closing brace):
```java
private boolean isBlacklisted(String token) {
    if (redisTemplate == null) return false; // fail-open if Redis not wired
    try {
        return Boolean.TRUE.equals(redisTemplate.hasKey(BLACKLIST_PREFIX + token));
    } catch (Exception e) {
        return false; // fail-open: don't lock users out if Redis is down
    }
}
```

**Step 4: Verify shared-security compiles**

```bash
JAVA_HOME=$(ls -d /Library/Java/JavaVirtualMachines/temurin-21.*/Contents/Home | head -1) \
  mvn compile -pl shared-security -am -q 2>&1 | tail -20
```

Expected: BUILD SUCCESS.

**Step 5: Verify core-service (which depends on shared-security) still compiles**

```bash
JAVA_HOME=$(ls -d /Library/Java/JavaVirtualMachines/temurin-21.*/Contents/Home | head -1) \
  mvn compile -pl core-service -am -q 2>&1 | tail -20
```

Expected: BUILD SUCCESS.

**Step 6: Commit**

```bash
git add shared-security/src/main/java/com/MaSoVa/shared/security/filter/JwtAuthenticationFilter.java
git commit -m "feat(security): check Redis JWT blacklist in JwtAuthenticationFilter — blocks reuse of logged-out tokens"
```

---

## Task 4: Fix Legacy axios.ts Interceptor

**Files:**
- Modify: `frontend/src/utils/axios.ts`

**Background:** This file reads `localStorage.accessToken` and `localStorage.refreshToken` — keys that DO NOT exist. Redux stores them under `auth_accessToken` / `auth_refreshToken`. It also calls `/refresh-token` (non-existent). The RTK Query `baseQueryWithAuth.ts` already handles token refresh correctly with mutex-based locking. The axios.ts interceptor is dead code that adds confusion.

**Step 1: Remove the broken refresh logic from the response interceptor**

The entire response interceptor (lines 29-78) should be simplified. Replace the current `axiosInstance.interceptors.response.use(...)` block with:

```typescript
// Response interceptor - pass through responses, let RTK Query handle auth errors
axiosInstance.interceptors.response.use(
  (response: any) => response,
  (error: any) => Promise.reject(error)
);
```

**Step 2: Fix the request interceptor to read from the correct storage key**

The request interceptor (lines 14-27) reads `localStorage.getItem('accessToken')` — wrong key. Fix to read from the same key Redux uses:

Replace line 16:
```typescript
const token = localStorage.getItem('accessToken');
```
With:
```typescript
const token = localStorage.getItem('auth_accessToken') || sessionStorage.getItem('auth_accessToken');
```

**Step 3: Verify TypeScript compiles**

```bash
cd /Users/souravamseekarmarti/Projects/MaSoVa-restaurant-management-system/frontend
npm run build 2>&1 | tail -30
```

Expected: no TypeScript errors.

**Step 4: Commit**

```bash
git add frontend/src/utils/axios.ts
git commit -m "fix(frontend): fix axios interceptor — correct storage key, remove dead refresh logic"
```

---

## Task 5: Fix Stale Endpoint in authApi.ts

**Files:**
- Modify: `frontend/src/store/api/authApi.ts`

**Step 1: Read authApi.ts to find the wrong endpoint**

Read `frontend/src/store/api/authApi.ts` fully.

**Step 2: Fix the refreshToken endpoint URL**

Find the line that uses `/users/refresh-token` and change it to `/users/refresh` to match:
- The actual backend endpoint: `POST /api/users/refresh`
- The working `baseQueryWithAuth.ts` which already uses `/users/refresh`

**Step 3: Verify TypeScript compiles**

```bash
cd /Users/souravamseekarmarti/Projects/MaSoVa-restaurant-management-system/frontend
npm run build 2>&1 | tail -20
```

Expected: BUILD SUCCESS, no errors.

**Step 4: Commit**

```bash
git add frontend/src/store/api/authApi.ts
git commit -m "fix(frontend): unify token refresh endpoint to /users/refresh — matches backend and baseQueryWithAuth"
```

---

## End-to-End Verification

After all 5 tasks:

**Test 1 — Logout invalidates token:**
1. Start core-service and Redis (`docker-compose up -d redis`)
2. Login → get access token
3. Call `POST /api/users/logout` with `Authorization: Bearer <token>` and `X-User-Id: <userId>`
4. Immediately call any authenticated endpoint with the same token
5. Expected: 401 Unauthorized (token is now blacklisted)

**Test 2 — Token refresh works on page reload:**
1. Login → store refresh token
2. Wait for access token to expire (or manipulate Redux state to clear it)
3. Reload page → RTK Query fires a request → gets 401 → `baseQueryWithAuth` calls `/users/refresh` → new access token received → original request retried successfully
4. Expected: user stays logged in, no redirect to login page

**Test 3 — Refresh token expiry gracefully logs out:**
1. Login → manually expire the refresh token (or test with very short TTL)
2. Access token expires → refresh attempt → backend returns 401
3. Expected: `baseQueryWithAuth` dispatches `logout()` → user redirected to login page

---

## Rollback Notes

If Redis is down after deploying Task 1-3:
- `isBlacklisted()` returns `false` (fail-open) in both JwtService and JwtAuthFilter
- Logout still works (working session ends), tokens just won't be blacklisted until Redis recovers
- No service disruption

---

## Key File Paths (Absolute)

| File | Purpose |
|------|---------|
| `core-service/src/main/java/com/MaSoVa/core/user/service/JwtService.java` | Add Redis blacklist methods |
| `core-service/src/main/java/com/MaSoVa/core/user/service/UserService.java` | Wire blacklist to logout |
| `core-service/src/main/java/com/MaSoVa/core/user/controller/UserController.java` | Extract Bearer token in logout |
| `shared-security/src/main/java/com/MaSoVa/shared/security/filter/JwtAuthenticationFilter.java` | Check blacklist on every request |
| `frontend/src/utils/axios.ts` | Fix storage key + remove dead refresh logic |
| `frontend/src/store/api/authApi.ts` | Fix refresh endpoint URL |
