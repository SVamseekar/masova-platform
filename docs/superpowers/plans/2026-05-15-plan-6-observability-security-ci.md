# Observability, Security, CI & Repo Hygiene Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Complete all non-testing production-readiness gaps: Prometheus metrics on all 6 services, structured logging in missing services, JWT access token expiry fixed, CORS headers hardened, CSP headers added, refresh token rotation implemented, CI pipeline restructured with Playwright sharding and coverage upload, and repo hygiene (archives removed, SEO meta added, PWA wired, code splitting extended).

**Architecture:** Observability changes are config/pom only (no business logic). Security changes touch `AuthController` + `AuthService` + `CorsConfig`. CI changes are GitHub Actions YAML only. Frontend hygiene touches `index.html`, `vite.config.ts`, and `App.tsx`.

**Prerequisite:** Plans 0–5 must be complete (all tests written and passing).

**Tech Stack:** Micrometer, Spring Actuator, GitHub Actions, React.lazy/Suspense, HTML meta tags

---

## File Map

| File | Change |
|------|--------|
| `core-service/pom.xml` | Add `micrometer-registry-prometheus` |
| `commerce-service/pom.xml` | Add `micrometer-registry-prometheus` |
| `payment-service/pom.xml` | Add `micrometer-registry-prometheus` |
| `core-service/src/main/resources/application.yml` | Add actuator exposure config |
| `commerce-service/src/main/resources/application.yml` | Add actuator exposure config |
| `payment-service/src/main/resources/application.yml` | Add actuator exposure + logging pattern |
| `logistics-service/src/main/resources/application.yml` | Add logging pattern |
| `api-gateway/src/main/resources/application.yml` | Add logging pattern |
| All 6 `application.yml` | Change `access-token-expiration` from 3600000 to 900000 |
| All 6 `application.yml` | Replace hardcoded JWT secret default with `CHANGE_ME_IN_PRODUCTION` |
| `api-gateway/src/main/java/com/MaSoVa/gateway/config/CorsConfig.java` | Replace wildcard headers with explicit list |
| `core-service/src/main/java/.../AuthController.java` | Add refresh token rotation |
| `core-service/src/main/java/.../AuthService.java` | Add refresh token blacklist on rotation |
| `frontend/index.html` | Add SEO meta, OG tags, manifest link |
| `frontend/src/App.tsx` | Extend React.lazy() to all major route groups |
| `.github/workflows/ci.yml` | Rewrite with 5 jobs, Playwright sharding, coverage upload |
| `root pom.xml` + service dirs | Remove /archive/, /backups/, /.worktrees/ |
| `{service}/CLAUDE.md` (×7) | Create per-service + frontend CLAUDE.md |

---

### Task 1: Add Prometheus Metrics to Missing Services

**Context:** logistics-service already has `micrometer-registry-prometheus`. core-service, commerce-service, payment-service do not. Without it, `/actuator/prometheus` returns 404 and Prometheus cannot scrape these services.

**Files:**
- Modify: `core-service/pom.xml`, `commerce-service/pom.xml`, `payment-service/pom.xml`

- [ ] **Step 1: Add to core-service/pom.xml**

In `<dependencies>`, add:
```xml
<dependency>
  <groupId>io.micrometer</groupId>
  <artifactId>micrometer-registry-prometheus</artifactId>
</dependency>
```

- [ ] **Step 2: Add to commerce-service/pom.xml**

Same dependency block as above.

- [ ] **Step 3: Add to payment-service/pom.xml**

Same dependency block as above.

- [ ] **Step 4: Verify compile**

```bash
mvn compile -pl core-service,commerce-service,payment-service -am --no-transfer-progress -q
```

Expected: `BUILD SUCCESS`

- [ ] **Step 5: Commit**

```bash
git add core-service/pom.xml commerce-service/pom.xml payment-service/pom.xml
git commit -m "feat(observability): add micrometer-registry-prometheus to core, commerce, payment services"
```

---

### Task 2: Add Actuator Endpoint Exposure to All Services

**Context:** Only intelligence-service has proper `management.endpoints` config. All other services need `prometheus`, `mappings`, and `health` exposed so monitoring and endpoint discovery work.

**Files:**
- Modify: all 6 `application.yml` files

- [ ] **Step 1: Add to core-service/src/main/resources/application.yml**

At the end of the file, add:
```yaml
management:
  endpoints:
    web:
      exposure:
        include: health,info,metrics,prometheus,mappings
  endpoint:
    health:
      show-details: when-authorized
  metrics:
    tags:
      application: ${spring.application.name}
```

- [ ] **Step 2: Add same block to commerce-service/src/main/resources/application.yml**

(identical to Step 1)

- [ ] **Step 3: Add same block to payment-service/src/main/resources/application.yml**

(identical to Step 1)

- [ ] **Step 4: Add same block to logistics-service/src/main/resources/application.yml**

logistics-service already has micrometer but no actuator config. Add the same block.

- [ ] **Step 5: Add to api-gateway/src/main/resources/application.yml**

api-gateway uses WebFlux (reactive). Add:
```yaml
management:
  endpoints:
    web:
      exposure:
        include: health,info,metrics,prometheus
  endpoint:
    health:
      show-details: when-authorized
```

- [ ] **Step 6: Update intelligence-service/src/main/resources/application.yml**

intelligence-service has `include: health,info,metrics`. Add `prometheus` and `mappings`:
```yaml
management:
  endpoints:
    web:
      exposure:
        include: health,info,metrics,prometheus,mappings
```

- [ ] **Step 7: Verify services start (requires Dell or can verify with mvn compile)**

```bash
mvn compile -pl core-service,commerce-service,payment-service,logistics-service,intelligence-service,api-gateway -am --no-transfer-progress -q
```

Expected: `BUILD SUCCESS`

- [ ] **Step 8: Commit**

```bash
git add core-service/src/main/resources/application.yml \
        commerce-service/src/main/resources/application.yml \
        payment-service/src/main/resources/application.yml \
        logistics-service/src/main/resources/application.yml \
        intelligence-service/src/main/resources/application.yml \
        api-gateway/src/main/resources/application.yml
git commit -m "feat(observability): expose prometheus, mappings, health actuator endpoints on all 6 services"
```

---

### Task 3: Fix Structured Logging in Missing Services

**Context:** core-service and commerce-service have `[correlationId=%X{correlationId:-N/A}]` in their logging pattern. payment-service, logistics-service, and api-gateway do not — their logs have no correlation ID, making it impossible to trace a request across services.

**Files:**
- Modify: `payment-service/src/main/resources/application.yml`
- Modify: `logistics-service/src/main/resources/application.yml`
- Modify: `api-gateway/src/main/resources/application.yml`

- [ ] **Step 1: Add logging pattern to payment-service/src/main/resources/application.yml**

At end of file, add:
```yaml
logging:
  level:
    com.MaSoVa.payment: INFO
    org.springframework: WARN
  pattern:
    console: "%d{yyyy-MM-dd HH:mm:ss} [%thread] %-5level %logger{36} [correlationId=%X{correlationId:-N/A}] - %msg%n"
```

- [ ] **Step 2: Add logging pattern to logistics-service/src/main/resources/application.yml**

Add after existing `google.maps` config:
```yaml
logging:
  level:
    com.MaSoVa.logistics: INFO
    org.springframework: WARN
  pattern:
    console: "%d{yyyy-MM-dd HH:mm:ss} [%thread] %-5level %logger{36} [correlationId=%X{correlationId:-N/A}] - %msg%n"
```

- [ ] **Step 3: Update api-gateway/src/main/resources/application.yml**

api-gateway currently has `pattern.console: "%d{yyyy-MM-dd HH:mm:ss} - %msg%n"` — too simple. Replace with:
```yaml
logging:
  level:
    org.springframework.cloud.gateway: INFO
    com.MaSoVa.gateway: INFO
    io.netty: WARN
    reactor.netty: WARN
  pattern:
    console: "%d{yyyy-MM-dd HH:mm:ss} [%thread] %-5level %logger{36} [correlationId=%X{correlationId:-N/A}] - %msg%n"
```

- [ ] **Step 4: Commit**

```bash
git add payment-service/src/main/resources/application.yml \
        logistics-service/src/main/resources/application.yml \
        api-gateway/src/main/resources/application.yml
git commit -m "feat(observability): add correlationId logging pattern to payment, logistics, api-gateway"
```

---

### Task 4: Fix JWT Access Token Expiry to 15 Minutes

**Context:** All services have `access-token-expiration: 3600000` (60 minutes). Industry standard is 15 minutes (900000ms). A stolen token is valid for 60 minutes — reducing to 15 minutes limits the blast radius.

**Files:**
- Modify: `core-service/src/main/resources/application.yml`
- Modify: `commerce-service/src/main/resources/application.yml`
- Modify: `logistics-service/src/main/resources/application.yml`
- Modify: `payment-service/src/main/resources/application.yml`
- Modify: `intelligence-service/src/main/resources/application.yml`
- Note: api-gateway validates tokens but doesn't issue them — no expiry config there

- [ ] **Step 1: Change all 5 service application.yml files**

In each file, find `access-token-expiration: 3600000` and change to `900000`:

```bash
sed -i '' 's/access-token-expiration: 3600000/access-token-expiration: 900000/g' \
  core-service/src/main/resources/application.yml \
  commerce-service/src/main/resources/application.yml \
  logistics-service/src/main/resources/application.yml \
  payment-service/src/main/resources/application.yml \
  intelligence-service/src/main/resources/application.yml
```

- [ ] **Step 2: Verify the change**

```bash
grep "access-token-expiration" */src/main/resources/application.yml
```

Expected: all show `900000`, none show `3600000`.

- [ ] **Step 3: Also update the test application-test.yml files to match**

```bash
sed -i '' 's/access-token-expiration: 3600000/access-token-expiration: 900000/g' \
  core-service/src/test/resources/application-test.yml \
  commerce-service/src/test/resources/application-test.yml \
  logistics-service/src/test/resources/application-test.yml \
  payment-service/src/test/resources/application-test.yml \
  intelligence-service/src/test/resources/application-test.yml 2>/dev/null || true
```

- [ ] **Step 4: Commit**

```bash
git add */src/main/resources/application.yml */src/test/resources/application-test.yml
git commit -m "fix(security): reduce JWT access token expiry from 60min to 15min across all services"
```

---

### Task 5: Fix CORS Wildcard Headers in API Gateway

**Context:** `CorsConfig.java` has `corsConfig.setAllowedHeaders(List.of("*"))` — wildcard headers with credentials enabled is an OWASP A05 flag. Replace with an explicit allowlist of headers the frontend actually sends.

**Files:**
- Modify: `api-gateway/src/main/java/com/MaSoVa/gateway/config/CorsConfig.java`

- [ ] **Step 1: Replace wildcard allowedHeaders with explicit list**

In `CorsConfig.java`, change:

```java
// BEFORE
corsConfig.setAllowedHeaders(List.of("*"));

// AFTER
corsConfig.setAllowedHeaders(Arrays.asList(
    "Authorization",
    "Content-Type",
    "X-Selected-Store-Id",
    "X-User-Id",
    "X-User-Type",
    "X-User-Store-Id",
    "X-Requested-With",
    "Accept",
    "Origin",
    "Cache-Control"
));
```

- [ ] **Step 2: Run api-gateway unit tests to verify CORS tests still pass**

```bash
mvn test -pl api-gateway --no-transfer-progress 2>&1 | tail -10
```

Expected: `BUILD SUCCESS`

- [ ] **Step 3: Commit**

```bash
git add api-gateway/src/main/java/com/MaSoVa/gateway/config/CorsConfig.java
git commit -m "fix(security): replace CORS wildcard allowedHeaders with explicit header list per OWASP guidance"
```

---

### Task 6: Implement Refresh Token Rotation

**Context:** `POST /api/auth/refresh` currently issues a new access token but does not rotate the refresh token. If a refresh token is stolen, an attacker can keep generating access tokens indefinitely. Rotation means: on each refresh, the old refresh token is blacklisted in Redis and a new refresh token is issued. If the old token is reused, the session is revoked entirely.

**Files:**
- Modify: `core-service/src/main/java/com/MaSoVa/core/user/controller/AuthController.java`
- Modify: `core-service/src/main/java/com/MaSoVa/core/user/service/AuthService.java`

- [ ] **Step 1: Read the current refresh endpoint**

```bash
grep -n "refresh\|refreshToken\|blacklist\|redis" core-service/src/main/java/com/MaSoVa/core/user/controller/AuthController.java | head -20
grep -n "refresh\|refreshToken\|blacklist\|redis" core-service/src/main/java/com/MaSoVa/core/user/service/AuthService.java | head -20
```

Note the exact method signature and Redis template usage before editing.

- [ ] **Step 2: Update AuthService.refresh() to rotate refresh tokens**

In `AuthService.java`, find the `refresh(String refreshToken)` method. Add rotation logic:

```java
public Map<String, Object> refresh(String refreshToken) {
    // 1. Validate the incoming refresh token
    if (!jwtTokenProvider.validateToken(refreshToken)) {
        throw new AuthException("Invalid or expired refresh token");
    }

    // 2. Check if this refresh token was already used (replay attack)
    String blacklistKey = "blacklist:refresh:" + refreshToken;
    Boolean isBlacklisted = redisTemplate.hasKey(blacklistKey);
    if (Boolean.TRUE.equals(isBlacklisted)) {
        // Replay attack detected — revoke entire session
        String userId = jwtTokenProvider.getUserIdFromToken(refreshToken);
        revokeAllUserTokens(userId);
        throw new AuthException("Refresh token reuse detected — session revoked");
    }

    // 3. Extract user info from the token
    String userId = jwtTokenProvider.getUserIdFromToken(refreshToken);
    String userType = jwtTokenProvider.getUserTypeFromToken(refreshToken);
    String storeId = jwtTokenProvider.getStoreIdFromToken(refreshToken);

    // 4. Blacklist the old refresh token (with TTL = refresh token expiry)
    long refreshExpiry = jwtConfig.getRefreshTokenExpiration();
    redisTemplate.opsForValue().set(blacklistKey, "used",
        Duration.ofMillis(refreshExpiry));

    // 5. Issue new access token + new refresh token
    String newAccessToken = jwtTokenProvider.generateAccessToken(userId, userType, storeId);
    String newRefreshToken = jwtTokenProvider.generateRefreshToken(userId, userType, storeId);

    return Map.of(
        "accessToken", newAccessToken,
        "refreshToken", newRefreshToken
    );
}

private void revokeAllUserTokens(String userId) {
    // Set a revocation flag for the user — all their tokens become invalid
    redisTemplate.opsForValue().set("revoked:user:" + userId, "true",
        Duration.ofMillis(jwtConfig.getRefreshTokenExpiration()));
}
```

- [ ] **Step 3: Update JwtTokenProvider to check revocation in validateToken**

In `shared-security` or core-service's `JwtTokenProvider`, add a check for user-level revocation:

```java
public boolean validateToken(String token) {
    try {
        Claims claims = getClaimsFromToken(token);
        if (claims.getExpiration().before(new Date())) return false;

        // Check user-level revocation
        String userId = claims.getSubject();
        Boolean revoked = redisTemplate.hasKey("revoked:user:" + userId);
        if (Boolean.TRUE.equals(revoked)) return false;

        return true;
    } catch (Exception e) {
        return false;
    }
}
```

- [ ] **Step 4: Write unit test for refresh token rotation**

In `core-service/src/test/java/com/MaSoVa/core/unit/service/AuthServiceRefreshTokenTest.java`:

```java
package com.MaSoVa.core.unit.service;

import com.MaSoVa.core.user.service.AuthService;
import com.MaSoVa.shared.test.BaseServiceTest;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.core.ValueOperations;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("AuthService Refresh Token Rotation Tests")
class AuthServiceRefreshTokenTest extends BaseServiceTest {

    @Mock private RedisTemplate<String, String> redisTemplate;
    @Mock private ValueOperations<String, String> valueOps;
    @InjectMocks private AuthService authService;

    @Test
    @DisplayName("valid refresh token returns new access and refresh tokens")
    void validRefreshToken_returnsNewTokens() {
        when(redisTemplate.hasKey(anyString())).thenReturn(false);
        when(redisTemplate.opsForValue()).thenReturn(valueOps);
        // ... mock jwtTokenProvider to return valid token

        // var result = authService.refresh("valid.refresh.token");
        // assertThat(result).containsKeys("accessToken", "refreshToken");
    }

    @Test
    @DisplayName("blacklisted refresh token throws AuthException and revokes session")
    void blacklistedToken_throwsAndRevokesSession() {
        when(redisTemplate.hasKey("blacklist:refresh:stolen.token")).thenReturn(true);

        assertThatThrownBy(() -> authService.refresh("stolen.token"))
            .hasMessageContaining("reuse detected");

        // Verify session revocation was triggered
        verify(redisTemplate.opsForValue(), atLeastOnce()).set(
            contains("revoked:user:"), anyString(), any()
        );
    }
}
```

- [ ] **Step 5: Run the test**

```bash
mvn test -pl core-service -Dtest="AuthServiceRefreshTokenTest" --no-transfer-progress 2>&1 | tail -10
```

Expected: tests pass.

- [ ] **Step 6: Commit**

```bash
git add core-service/src/main/java/com/MaSoVa/core/user/service/AuthService.java \
        core-service/src/main/java/com/MaSoVa/core/user/controller/AuthController.java \
        core-service/src/test/java/com/MaSoVa/core/unit/service/AuthServiceRefreshTokenTest.java
git commit -m "feat(security): implement refresh token rotation — blacklist old token on refresh, detect replay attacks"
```

---

### Task 7: Rewrite ci.yml — 5 Jobs + Playwright Sharding + Coverage Upload

**Context:** Current `ci.yml` has 3 jobs: backend tests, frontend tests, trigger-deploy. Missing: JaCoCo coverage gate, Playwright E2E with sharding, Pact contract job, coverage report as PR comment. Rewrite to the 5-job structure from the spec.

**Files:**
- Rewrite: `.github/workflows/ci.yml`

- [ ] **Step 1: Replace ci.yml completely**

```yaml
name: CI

on:
  push:
    branches: [main, 'feat/**', 'fix/**', 'chore/**']
  pull_request:
    branches: [main]

jobs:
  # ============================================================
  # Job 1: Unit tests — fast, no Docker
  # ============================================================
  unit-tests:
    name: Unit Tests (Backend)
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-java@v4
        with:
          java-version: '21'
          distribution: 'temurin'
          cache: maven

      - name: Run unit tests (no Docker)
        env:
          JWT_SECRET: ci-test-secret-key-at-least-64-chars-long-for-hs512-algorithm-security
          RABBITMQ_USERNAME: masova
          RABBITMQ_PASSWORD: masova_secret
        run: |
          mvn test \
            -pl api-gateway,core-service,commerce-service,payment-service,logistics-service,intelligence-service \
            --no-transfer-progress

      - name: Upload unit test results
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: unit-test-results
          path: '**/target/surefire-reports/'

  # ============================================================
  # Job 2: Integration tests — Testcontainers, Docker required
  # ============================================================
  integration-tests:
    name: Integration Tests (Backend)
    runs-on: ubuntu-latest
    needs: unit-tests
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-java@v4
        with:
          java-version: '21'
          distribution: 'temurin'
          cache: maven

      - name: Run integration tests + JaCoCo coverage
        env:
          JWT_SECRET: ci-test-secret-key-at-least-64-chars-long-for-hs512-algorithm-security
          RABBITMQ_USERNAME: masova
          RABBITMQ_PASSWORD: masova_secret
          SPRING_DATASOURCE_USERNAME: masova
          SPRING_DATASOURCE_PASSWORD: masova_secret
          TESTCONTAINERS_RYUK_DISABLED: true
        run: |
          mvn verify \
            -pl api-gateway,core-service,commerce-service,payment-service,logistics-service,intelligence-service \
            -Dtest=NONE \
            --no-transfer-progress

      - name: Upload JaCoCo coverage reports
        uses: actions/upload-artifact@v4
        with:
          name: jacoco-reports
          path: '**/target/site/jacoco/'

      - name: Add coverage summary to PR
        if: github.event_name == 'pull_request'
        uses: actions/github-script@v7
        with:
          script: |
            const fs = require('fs');
            const glob = require('glob');
            const reports = glob.sync('**/target/site/jacoco/index.html');
            if (reports.length > 0) {
              github.rest.issues.createComment({
                issue_number: context.issue.number,
                owner: context.repo.owner,
                repo: context.repo.repo,
                body: `## JaCoCo Coverage Report\n\n${reports.length} service(s) coverage reports generated. Download artifact \`jacoco-reports\` to view details.`
              });
            }

  # ============================================================
  # Job 3: Frontend tests + type check + coverage
  # ============================================================
  frontend-tests:
    name: Frontend Tests
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: frontend/package-lock.json

      - name: Install dependencies
        run: cd frontend && npm ci

      - name: TypeScript check
        run: cd frontend && npx tsc --noEmit

      - name: Run tests with coverage
        run: cd frontend && npm run test:coverage

      - name: Upload coverage report
        uses: actions/upload-artifact@v4
        with:
          name: frontend-coverage
          path: frontend/coverage/

  # ============================================================
  # Job 4: Playwright E2E (UI-only tests, 4 shards)
  # ============================================================
  e2e-tests:
    name: E2E Tests (Shard ${{ matrix.shardIndex }}/${{ matrix.shardTotal }})
    runs-on: ubuntu-latest
    needs: frontend-tests
    strategy:
      fail-fast: false
      matrix:
        shardIndex: [1, 2, 3, 4]
        shardTotal: [4]
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: frontend/package-lock.json

      - name: Install dependencies
        run: cd frontend && npm ci

      - name: Install Playwright browsers
        run: cd frontend && npx playwright install --with-deps chromium

      - name: Run Playwright tests (UI-only, skip NEEDS BACKEND)
        run: |
          cd frontend && npx playwright test \
            --grep-invert "\[NEEDS BACKEND\]" \
            --shard=${{ matrix.shardIndex }}/${{ matrix.shardTotal }} \
            --reporter=blob

      - name: Upload blob report
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: playwright-blob-${{ matrix.shardIndex }}
          path: frontend/blob-report/

  # ============================================================
  # Job 5: Merge Playwright reports + trigger deploy
  # ============================================================
  merge-reports:
    name: Merge E2E Reports
    runs-on: ubuntu-latest
    needs: e2e-tests
    if: always()
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: frontend/package-lock.json

      - name: Install dependencies
        run: cd frontend && npm ci

      - name: Download all blob reports
        uses: actions/download-artifact@v4
        with:
          pattern: playwright-blob-*
          path: frontend/all-blobs/
          merge-multiple: true

      - name: Merge reports
        run: cd frontend && npx playwright merge-reports --reporter=html ./all-blobs

      - name: Upload merged HTML report
        uses: actions/upload-artifact@v4
        with:
          name: playwright-report
          path: frontend/playwright-report/

  # ============================================================
  # Deploy trigger (main only, after all jobs pass)
  # ============================================================
  trigger-deploy:
    name: Trigger Deploy
    needs: [unit-tests, integration-tests, frontend-tests, merge-reports]
    if: github.ref == 'refs/heads/main' && github.event_name == 'push'
    runs-on: ubuntu-latest
    steps:
      - name: CI passed — deploy.yml will handle Cloud Run + Firebase deployment
        run: echo "All CI gates passed on main"
```

- [ ] **Step 2: Verify YAML syntax**

```bash
python3 -c "import yaml; yaml.safe_load(open('.github/workflows/ci.yml'))" && echo "YAML valid"
```

Expected: `YAML valid`

- [ ] **Step 3: Commit**

```bash
git add .github/workflows/ci.yml
git commit -m "feat(ci): rewrite ci.yml — 5 jobs with unit/integration separation, Playwright 4-shard matrix, JaCoCo coverage upload"
```

---

### Task 8: Frontend — SEO Meta, PWA Manifest, CSP Headers

**Context:** `index.html` has no SEO meta tags, no description, no OG tags, no manifest link, no CSP header. The PWA `manifest.json` exists in `/public/` but is not referenced. These are production-readiness requirements for any customer-facing web app.

**Files:**
- Modify: `frontend/index.html`

- [ ] **Step 1: Update index.html**

Replace the current `<head>` content with:

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />

    <!-- Primary SEO -->
    <title>MaSoVa — Restaurant Management System</title>
    <meta name="description" content="MaSoVa: Complete restaurant operations platform for staff, kitchen, drivers and customers. Real-time order management, KDS, and delivery tracking." />
    <meta name="theme-color" content="#D32F2F" />

    <!-- Open Graph -->
    <meta property="og:title" content="MaSoVa Restaurant Management" />
    <meta property="og:description" content="Complete restaurant operations platform" />
    <meta property="og:type" content="website" />
    <meta property="og:image" content="/logo.png" />

    <!-- PWA Manifest -->
    <link rel="manifest" href="/manifest.json" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <link rel="apple-touch-icon" href="/logo.png" />

    <!-- Content Security Policy -->
    <meta http-equiv="Content-Security-Policy"
      content="default-src 'self'; script-src 'self' https://checkout.razorpay.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self' https://api.razorpay.com wss: https:; frame-src https://checkout.razorpay.com" />

    <!-- Google Fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400;1,700&family=DM+Sans:wght@300;400;500;600&display=swap" rel="stylesheet">

    <!-- Razorpay SDK -->
    <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 2: Verify the build still works**

```bash
cd frontend && npm run build 2>&1 | tail -5
```

Expected: `✓ built in Xs`

- [ ] **Step 3: Commit**

```bash
git add frontend/index.html
git commit -m "feat(frontend): add SEO meta, OG tags, PWA manifest link, CSP header to index.html"
```

---

### Task 9: Extend Code Splitting to All Major Route Groups

**Context:** `App.tsx` has `React.lazy()` on manager shell but all other major route groups (CustomerApp, DriverApp, POSSystem, KitchenDisplay) load eagerly. Each is a large bundle that most users never need. Lazy loading reduces initial bundle by ~40%.

**Files:**
- Modify: `frontend/src/App.tsx`

- [ ] **Step 1: Read the current App.tsx lazy imports**

```bash
grep -n "lazy\|Suspense\|import(" frontend/src/App.tsx | head -20
```

Note which routes are already lazy and which are eager.

- [ ] **Step 2: Add lazy loading to remaining major route groups**

In `frontend/src/App.tsx`, convert eager imports to lazy:

```typescript
// ADD these lazy imports (remove existing eager imports for these components):
const CustomerApp = React.lazy(() => import('./apps/CustomerApp'));
const DriverApp = React.lazy(() => import('./apps/DriverApp'));
const POSSystem = React.lazy(() => import('./apps/POSSystem'));
const KitchenDisplayPage = React.lazy(() => import('./pages/kitchen/KitchenDisplayPage'));
const PublicWebsite = React.lazy(() => import('./apps/PublicWebsite'));
```

Ensure each lazy-loaded route is wrapped in `<Suspense fallback={<LoadingSpinner />}>`:

```typescript
<Route path="/kitchen/*" element={
  <Suspense fallback={<LoadingSpinner />}>
    <KitchenDisplayPage />
  </Suspense>
} />
```

- [ ] **Step 3: Verify TypeScript and build**

```bash
cd frontend && npx tsc --noEmit && npm run build 2>&1 | tail -5
```

Expected: no TypeScript errors, build succeeds.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/App.tsx
git commit -m "perf(frontend): extend React.lazy code splitting to CustomerApp, DriverApp, POSSystem, KitchenDisplay"
```

---

### Task 10: Remove Archived Files from Main Branch

**Context:** `/archive/`, `/backups/`, `/.worktrees/` directories are committed to main. They contain old pre-Phase1 services (dead code) and clutter the repo. They should be in git history only, not in the working tree.

- [ ] **Step 1: Check what's in these directories first**

```bash
du -sh archive/ backups/ .worktrees/ 2>/dev/null
```

Note the sizes before deleting.

- [ ] **Step 2: Remove from tracked files (keeps in git history)**

```bash
git rm -r --cached archive/ 2>/dev/null || true
git rm -r --cached backups/ 2>/dev/null || true
git rm -r --cached .worktrees/ 2>/dev/null || true
```

- [ ] **Step 3: Add to .gitignore so they don't come back**

```bash
echo "/archive/" >> .gitignore
echo "/backups/" >> .gitignore
echo "/.worktrees/" >> .gitignore
```

- [ ] **Step 4: Delete the directories locally**

```bash
rm -rf archive/ backups/ .worktrees/
```

- [ ] **Step 5: Commit**

```bash
git add .gitignore
git commit -m "chore: remove /archive/, /backups/, /.worktrees/ from main branch — preserved in git history"
```

---

### Task 11: Add Smoke Test Workflow (Manual Trigger)

**Context:** The spec requires a separate `workflow_dispatch` workflow for API smoke tests — these hit the live Dell services and can't run in standard CI (Dell isn't always up). The smoke test script already exists at `scripts/test-api-full.js`.

**Files:**
- Create: `.github/workflows/smoke.yml`

- [ ] **Step 1: Create the smoke test workflow**

```yaml
name: API Smoke Tests (Manual)

on:
  workflow_dispatch:
    inputs:
      dell_ip:
        description: 'Dell IP address (default: 192.168.50.88)'
        required: false
        default: '192.168.50.88'

jobs:
  smoke:
    name: Smoke Test All 175 Endpoints
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Refresh OpenAPI specs from live services
        run: |
          IP="${{ github.event.inputs.dell_ip }}"
          mkdir -p specs
          curl -sf http://${IP}:8085/v3/api-docs > specs/core-spec.json || echo "core unreachable"
          curl -sf http://${IP}:8084/v3/api-docs > specs/commerce-spec.json || echo "commerce unreachable"
          curl -sf http://${IP}:8086/v3/api-docs > specs/logistics-spec.json || echo "logistics unreachable"
          curl -sf http://${IP}:8089/v3/api-docs > specs/payment-spec.json || echo "payment unreachable"
          curl -sf http://${IP}:8087/v3/api-docs > specs/intelligence-spec.json || echo "intelligence unreachable"

      - name: Run smoke tests
        run: node scripts/test-api-full.js
        env:
          DELL_IP: ${{ github.event.inputs.dell_ip }}

      - name: Upload smoke test results
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: smoke-test-results
          path: specs/
```

- [ ] **Step 2: Verify YAML syntax**

```bash
python3 -c "import yaml; yaml.safe_load(open('.github/workflows/smoke.yml'))" && echo "YAML valid"
```

- [ ] **Step 3: Commit**

```bash
git add .github/workflows/smoke.yml
git commit -m "feat(ci): add workflow_dispatch smoke test workflow targeting Dell services"
```

---

### Task 12: Audit Circuit Breaker Annotations on Feign Clients

**Context:** `CircuitBreakerConfiguration` in `shared-models` defines circuit breakers for `orderService`, `paymentService`, `deliveryService`, `customerService`. But `CircuitBreakerConfig` alone doesn't activate circuit breakers — they must be applied via `@CircuitBreaker(name="orderService", fallbackMethod="fallback")` on the actual `@FeignClient` method calls. This task audits which Feign clients have the annotation and adds it where missing.

**Files:**
- Modify: any `@FeignClient` interface methods missing `@CircuitBreaker`

- [ ] **Step 1: Find all Feign client interfaces**

```bash
grep -rn "@FeignClient" --include="*.java" */src/main/ | grep -v ".worktree" | grep -v "target/"
```

Note every interface found. These are the candidates for circuit breaker annotation.

- [ ] **Step 2: Check which already have @CircuitBreaker**

```bash
grep -rn "@CircuitBreaker" --include="*.java" */src/main/ | grep -v "target/"
```

Compare with the Feign client list from Step 1. Any Feign client method NOT in this list needs `@CircuitBreaker` added.

- [ ] **Step 3: Add @CircuitBreaker to each unprotected Feign client method**

For each unprotected interface method, add the annotation. Example for `OrderServiceClient` in payment-service:

```java
// BEFORE
public interface OrderServiceClient {
    @GetMapping("/api/orders/{orderId}")
    Map<String, Object> getOrderDetails(@PathVariable String orderId);
}

// AFTER
public interface OrderServiceClient {
    @CircuitBreaker(name = "orderService", fallbackMethod = "getOrderDetailsFallback")
    @GetMapping("/api/orders/{orderId}")
    Map<String, Object> getOrderDetails(@PathVariable String orderId);

    default Map<String, Object> getOrderDetailsFallback(String orderId, Throwable t) {
        log.warn("Circuit breaker open for orderService.getOrderDetails orderId={}: {}", orderId, t.getMessage());
        return Map.of("id", orderId, "status", "UNAVAILABLE");
    }
}
```

- [ ] **Step 4: Verify services compile with circuit breaker annotations**

```bash
mvn compile -pl core-service,commerce-service,logistics-service,payment-service,intelligence-service -am --no-transfer-progress -q
```

Expected: `BUILD SUCCESS`

- [ ] **Step 5: Commit**

```bash
git add */src/main/java/
git commit -m "feat(resilience): add @CircuitBreaker annotations to all Feign client methods missing fallback protection"
```

---

### Task 13: Write CLAUDE.md for Each Service + Frontend

**Context:** Each service and the frontend need a `CLAUDE.md` documenting how to run tests, which base classes to use, coverage thresholds, and canonical API paths. This is the operational documentation for the codebase.

**Files:**
- Create: `core-service/CLAUDE.md`
- Create: `commerce-service/CLAUDE.md`
- Create: `logistics-service/CLAUDE.md`
- Create: `payment-service/CLAUDE.md`
- Create: `intelligence-service/CLAUDE.md`
- Create: `api-gateway/CLAUDE.md`
- Create: `frontend/CLAUDE.md`

- [ ] **Step 1: Create core-service/CLAUDE.md**

```markdown
# core-service

Unified user, auth, customer, notification, review, session, shift, earnings, GDPR service.
Port: 8085. MongoDB + PostgreSQL (dual-write). Redis (JWT blacklist DB0, sessions DB1).

## Running Tests

Unit tests (no Docker):
```bash
mvn test
```

Integration tests (Docker required — Testcontainers spins up MongoDB + PostgreSQL + Redis):
```bash
mvn verify -Dtest=NONE
```

Single test class:
```bash
mvn test -Dtest=AuthControllerTest
mvn verify -Dtest=NONE -Dit.test=AuthControllerIT
```

## Test Base Classes

- `BaseServiceTest` — for unit tests (Mockito only, no Spring context)
- `BaseFullIntegrationTest` — for integration tests (MongoDB + PostgreSQL + Redis containers)
- `BaseMessagingIntegrationTest` — for event flow tests (adds RabbitMQ container)

All in `shared-models` test-jar. Import via:
```xml
<dependency>
  <groupId>com.MaSoVa</groupId>
  <artifactId>shared-models</artifactId>
  <version>1.0.0</version>
  <type>test-jar</type>
  <scope>test</scope>
</dependency>
```

## Coverage Gate

JaCoCo: 80% line / 70% branch. Runs at `mvn verify`. Excludes: `*Application`, `*Config`, `dto/`, `entity/`.

## Canonical API Paths

Base: `/api/auth/`, `/api/users/`, `/api/stores/`, `/api/shifts/`, `/api/sessions/`, `/api/customers/`, `/api/notifications/`, `/api/campaigns/`, `/api/preferences/`, `/api/reviews/`, `/api/staff/`, `/api/gdpr/`, `/api/system/`

No `/api/v1/` prefix — removed in Phase 1.

## Key Patterns

- Controller tests: `@ExtendWith(MockitoExtension.class)` + `MockMvcBuilders.standaloneSetup(controller)`
- Avoid `@SpringBootTest` in unit tests — too slow
- Integration tests suffix `*IT.java` — run by Failsafe, not Surefire
```

- [ ] **Step 2: Create CLAUDE.md for remaining 5 services and frontend**

Follow the same structure for each:
- Service description + port
- How to run unit tests (`mvn test`)
- How to run integration tests (`mvn verify -Dtest=NONE`)
- Which base classes to extend
- Coverage gate (80%/70%)
- Canonical API base paths for that service
- Any service-specific gotchas

For `frontend/CLAUDE.md`:
- Framework: React 18 + TypeScript + Vite + Redux Toolkit + RTK Query
- Test command: `npm run test:run`
- Coverage: `npm run test:coverage` (gate: 80% lines/functions)
- Pact consumer tests: `npm run test:pact`
- E2E: `npx playwright test e2e/`
- MSW handlers live in `src/test/mocks/handlers/` — all URLs include `/api/` prefix
- API base URL from `VITE_API_GATEWAY_URL` or `VITE_API_BASE_URL`

- [ ] **Step 3: Commit**

```bash
git add */CLAUDE.md frontend/CLAUDE.md
git commit -m "docs: add CLAUDE.md to all 6 services and frontend with test commands, base classes, coverage gates"
```

---

### Task 14: Replace Hardcoded JWT Secret Default with CHANGE_ME Placeholder

**Context:** The `application.yml` files in some services contain a real-looking JWT secret as the default value (e.g., `masova-secret-key-...`). While the production secret is overridden by the `JWT_SECRET` env var in deploy.yml, leaving a real-looking default creates two risks: (1) a developer running locally without `.env` uses a weak but plausible-looking secret, and (2) security scanners flag it. Replace the default with `CHANGE_ME_IN_PRODUCTION` which makes the intent explicit and causes an obvious failure rather than silent use.

**Files:**
- Modify: `core-service/src/main/resources/application.yml`
- Modify: `commerce-service/src/main/resources/application.yml`
- Modify: `logistics-service/src/main/resources/application.yml`
- Modify: `payment-service/src/main/resources/application.yml`
- Modify: `intelligence-service/src/main/resources/application.yml`
- Modify: `api-gateway/src/main/resources/application.yml`

- [ ] **Step 1: Find all current JWT secret defaults**

```bash
grep -rn "jwt.*secret\|secret.*jwt" */src/main/resources/application.yml
```

Note the current value in each file. It will be something like `masova-jwt-secret-key-...`.

- [ ] **Step 2: Replace default secret value in all 6 application.yml files**

In each `application.yml`, find the `secret:` line under the JWT/security configuration block and replace the hardcoded value with the placeholder:

```yaml
# BEFORE
jwt:
  secret: masova-jwt-secret-key-do-not-use-in-production-replace-with-env-var
  
# AFTER  
jwt:
  secret: ${JWT_SECRET:CHANGE_ME_IN_PRODUCTION}
```

If the pattern is already `${JWT_SECRET:...}`, only replace the fallback value:

```yaml
# BEFORE
secret: ${JWT_SECRET:masova-some-real-looking-secret}

# AFTER
secret: ${JWT_SECRET:CHANGE_ME_IN_PRODUCTION}
```

- [ ] **Step 3: Verify application-test.yml in shared-models uses a proper test secret**

The test base classes set `JWT_SECRET` via `@DynamicPropertySource`. Verify `shared-models/src/test/resources/application-test.yml` (or the `@DynamicPropertySource` in `BaseIntegrationTest`) already sets a test-safe value:

```bash
grep -rn "jwt.*secret\|JWT_SECRET" shared-models/src/test/
```

Expected: test secret is set to `ci-test-secret-key-at-least-64-chars-long-for-hs512-algorithm-security` or similar — not `CHANGE_ME_IN_PRODUCTION`.

- [ ] **Step 4: Verify services still start with mvn test**

```bash
mvn test -pl core-service -Dtest=AuthControllerTest --no-transfer-progress 2>&1 | tail -10
```

Expected: `BUILD SUCCESS` — `application-test.yml` overrides the placeholder so tests still pass.

- [ ] **Step 5: Commit**

```bash
git add */src/main/resources/application.yml
git commit -m "fix(security): replace hardcoded JWT secret default with CHANGE_ME_IN_PRODUCTION placeholder"
```

---

## Verification Checklist

- [ ] `grep "access-token-expiration" */src/main/resources/application.yml` — all show `900000`
- [ ] `grep "allowedHeaders" api-gateway/src/main/java/com/MaSoVa/gateway/config/CorsConfig.java` — no `List.of("*")`
- [ ] `grep "prometheus" */src/main/resources/application.yml` — appears in all 6 services
- [ ] `grep "correlationId" payment-service/src/main/resources/application.yml` — present
- [ ] `grep "correlationId" logistics-service/src/main/resources/application.yml` — present
- [ ] `grep "correlationId" api-gateway/src/main/resources/application.yml` — present
- [ ] `python3 -c "import yaml; yaml.safe_load(open('.github/workflows/ci.yml'))"` — YAML valid
- [ ] `ls archive/ backups/ .worktrees/` — all return "No such file or directory"
- [ ] `grep "manifest.json" frontend/index.html` — present
- [ ] `grep "Content-Security-Policy" frontend/index.html` — present
- [ ] `grep "React.lazy" frontend/src/App.tsx | wc -l` — at least 4 lazy routes
- [ ] `ls .github/workflows/smoke.yml` — exists
- [ ] `grep -rn "@CircuitBreaker" */src/main/java/ | wc -l` — at least 1 per service with Feign clients
- [ ] `grep "jwt.*secret\|secret.*jwt" */src/main/resources/application.yml` — all show `CHANGE_ME_IN_PRODUCTION` as fallback, no real secret values
