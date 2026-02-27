# Phase 2 Remaining — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Complete Phase 2.3 (delivery radius validation at order placement + frontend checkout warning), Phase 2.4 (CI/CD pipeline rewrite for the new 6-service architecture), and Phase 2.5 (docker-compose with all 6 services).

**Architecture:**
- **2.3**: Backend — add `GET /api/stores/{storeId}/delivery-radius-check?lat=&lng=` endpoint to core-service StoreController; add radius validation in commerce-service OrderService before fee calculation. Frontend — call that endpoint on PaymentPage when DELIVERY is selected, block order placement with inline warning if outside radius.
- **2.4**: Replace stale `.github/workflows/release.yml` (references deleted old 10-service names) with a new `ci.yml` that runs backend tests + frontend vitest on every push/PR, plus a deploy job on main. Keep `api-contract-validation.yml` as-is (it's separate).
- **2.5**: Extend `docker-compose.yml` with entries for all 6 backend services + frontend dev server using `mvn spring-boot:run` exec format.

**Tech Stack:** Java 21 / Spring Boot 3 (core-service, commerce-service), TypeScript / React 19 (frontend), GitHub Actions, Docker Compose 3.8.

---

## Critical Context

- **Store entity** `shared-models/.../entity/Store.java` already has `isWithinDeliveryRadius(lat, lng)` (line 109) using Haversine. `configuration.getDeliveryRadiusKm()` defaults to `5.0`.
- **StoreController** is in `core-service/src/main/java/com/MaSoVa/core/user/controller/StoreController.java`. It has `/api/stores/nearby` but NO radius-check endpoint for a specific lat/lng against a specific store.
- **OrderService** `createOrder()` in `commerce-service/.../order/service/OrderService.java` checks `orderType == DELIVERY` at line 92. The delivery address is in `request.getDeliveryAddress()` (latitude/longitude fields). There is **no StoreRepository** in commerce-service — store data lives in core-service. We validate via an HTTP call to core-service OR by calling `deliveryServiceClient.calculateDeliveryFee()` which already knows zones. The simplest approach: add a new `StoreServiceClient` (feign-style RestTemplate call) in commerce-service to call the new core-service endpoint, reject if outside radius.
- **PaymentPage** `frontend/src/pages/customer/PaymentPage.tsx` has `orderType` state (line 39), `selectedAddressId` (line 40), `customerProfile.addresses`. The address lat/lng is on the customer address object.
- **storeApi.ts** already has `getNearbyStores(lat, lon, radiusKm)` endpoint but that's a different query. We need a simpler `checkDeliveryRadius(storeId, lat, lng)` RTK Query endpoint.
- **CI workflows**: `.github/workflows/release.yml` references `user-service/target/`, `menu-service/target/` etc. — all deleted in Phase 1. Must be replaced. The new services are: `api-gateway`, `core-service`, `commerce-service`, `payment-service`, `logistics-service`, `intelligence-service`.
- **Frontend test command**: `npm run test:run` (vitest run, non-interactive).
- **Maven compile**: `JAVA_HOME=$(ls -d /Library/Java/JavaVirtualMachines/temurin-21.*/Contents/Home | head -1) mvn compile -pl <module> -am -q`

---

## Task 1: Backend — Delivery Radius Check Endpoint (core-service)

**Files:**
- Modify: `core-service/src/main/java/com/MaSoVa/core/user/controller/StoreController.java`
- Modify: `core-service/src/main/java/com/MaSoVa/core/user/service/StoreService.java`

**Step 1: Read both files fully before editing.**

**Step 2: Add `checkDeliveryRadius()` to StoreService**

Read `StoreService.java` to find where to insert (after `getStoresInDeliveryRadius()` or at end of file before closing brace). Add:

```java
public Map<String, Object> checkDeliveryRadius(String storeId, double latitude, double longitude) {
    Store store = getStore(storeId);
    boolean within = store.isWithinDeliveryRadius(latitude, longitude);
    double radiusKm = store.getConfiguration() != null
        ? store.getConfiguration().getDeliveryRadiusKm()
        : 5.0;
    return Map.of(
        "withinRadius", within,
        "storeId", storeId,
        "deliveryRadiusKm", radiusKm,
        "latitude", latitude,
        "longitude", longitude
    );
}
```

Note: `Map` is already imported in StoreService (check — add `import java.util.Map;` if missing).

**Step 3: Add endpoint to StoreController**

After the `@GetMapping("/nearby")` block (around line 102), add:

```java
@GetMapping("/{storeId}/delivery-radius-check")
@Operation(summary = "Check if coordinates are within store's delivery radius")
public ResponseEntity<Map<String, Object>> checkDeliveryRadius(
        @PathVariable("storeId") String storeId,
        @RequestParam double latitude,
        @RequestParam double longitude) {
    Map<String, Object> result = storeService.checkDeliveryRadius(storeId, latitude, longitude);
    return ResponseEntity.ok(result);
}
```

Note: `Map` is already imported in StoreController.

**Step 4: Compile**
```bash
JAVA_HOME=$(ls -d /Library/Java/JavaVirtualMachines/temurin-21.*/Contents/Home | head -1) \
  mvn compile -pl core-service -am -q 2>&1 | tail -10
```
Expected: BUILD SUCCESS.

**Step 5: Commit**
```bash
git add core-service/src/main/java/com/MaSoVa/core/user/controller/StoreController.java \
        core-service/src/main/java/com/MaSoVa/core/user/service/StoreService.java
git commit -m "feat(core): add GET /stores/{id}/delivery-radius-check endpoint"
```

---

## Task 2: Backend — Validate Radius Before Order Creation (commerce-service)

**Files:**
- Create: `commerce-service/src/main/java/com/MaSoVa/commerce/order/client/StoreServiceClient.java`
- Modify: `commerce-service/src/main/java/com/MaSoVa/commerce/order/service/OrderService.java`
- Modify: `commerce-service/src/main/resources/application.yml`

**Step 1: Read `OrderService.java` imports and constructor (lines 1-62) and the delivery block (lines 89-117).**

**Step 2: Read `commerce-service/src/main/resources/application.yml` to understand existing service URL config.**

**Step 3: Create StoreServiceClient**

Create new file `commerce-service/src/main/java/com/MaSoVa/commerce/order/client/StoreServiceClient.java`:

```java
package com.MaSoVa.commerce.order.client;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.util.Map;

@Component
public class StoreServiceClient {

    private static final Logger log = LoggerFactory.getLogger(StoreServiceClient.class);

    private final RestTemplate restTemplate;

    @Value("${services.core.url:http://localhost:8085}")
    private String coreServiceUrl;

    public StoreServiceClient(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
    }

    /**
     * Returns true if the coordinates are within the store's delivery radius.
     * Fail-open: returns true on any error so order placement is not blocked by network issues.
     */
    @SuppressWarnings("unchecked")
    public boolean isWithinDeliveryRadius(String storeId, double latitude, double longitude) {
        try {
            String url = UriComponentsBuilder
                .fromHttpUrl(coreServiceUrl + "/api/stores/{storeId}/delivery-radius-check")
                .queryParam("latitude", latitude)
                .queryParam("longitude", longitude)
                .buildAndExpand(storeId)
                .toUriString();

            Map<String, Object> result = restTemplate.getForObject(url, Map.class);
            if (result == null) return true; // fail-open
            Boolean within = (Boolean) result.get("withinRadius");
            return within == null || within;
        } catch (Exception e) {
            log.warn("Delivery radius check failed for store {} — failing open: {}", storeId, e.getMessage());
            return true; // fail-open: don't block orders if core-service is slow
        }
    }
}
```

**Step 4: Check if RestTemplate is already a bean in commerce-service**

Run:
```bash
grep -rn "RestTemplate\|RestTemplateConfig" /Users/souravamseekarmarti/Projects/MaSoVa-restaurant-management-system/commerce-service/src/main/java --include="*.java" | grep -i "bean\|config" | head -10
```

If no `@Bean RestTemplate` found, check `DeliveryServiceClient.java` to see how it gets its RestTemplate. If DeliveryServiceClient uses constructor injection of `RestTemplate`, a `@Bean` must exist somewhere — find it and confirm. If not found, we need to add `RestTemplateConfig`. Read `commerce-service` for any existing config class:
```bash
find /Users/souravamseekarmarti/Projects/MaSoVa-restaurant-management-system/commerce-service/src/main/java -name "*Config*.java" | head -10
```

If no RestTemplate bean exists, create `commerce-service/src/main/java/com/MaSoVa/commerce/config/RestTemplateConfig.java`:
```java
package com.MaSoVa.commerce.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestTemplate;

@Configuration
public class RestTemplateConfig {
    @Bean
    public RestTemplate restTemplate() {
        return new RestTemplate();
    }
}
```

**Step 5: Add core service URL to `application.yml`**

Read `commerce-service/src/main/resources/application.yml`. Find the `services:` block. Add under it:
```yaml
  core:
    url: ${CORE_SERVICE_URL:http://localhost:8085}
```

**Step 6: Inject StoreServiceClient into OrderService and validate before fee calculation**

In `OrderService.java`:

Add `StoreServiceClient storeServiceClient;` to the class fields (after `deliveryServiceClient`).

Add to constructor parameters: `, StoreServiceClient storeServiceClient` and assignment `this.storeServiceClient = storeServiceClient;`.

In `createOrder()`, after line 95 (the `if (request.getDeliveryAddress() != null && ...latitude != null && ...longitude != null)` check), BEFORE the `deliveryServiceClient.calculateDeliveryFee(...)` call, add:

```java
// Validate delivery address is within store's delivery radius
boolean withinRadius = storeServiceClient.isWithinDeliveryRadius(
    request.getStoreId(),
    request.getDeliveryAddress().getLatitude(),
    request.getDeliveryAddress().getLongitude()
);
if (!withinRadius) {
    throw new IllegalArgumentException(
        "Delivery address is outside this store's delivery radius. Please choose a different store or select Takeaway."
    );
}
```

**Step 7: Compile**
```bash
JAVA_HOME=$(ls -d /Library/Java/JavaVirtualMachines/temurin-21.*/Contents/Home | head -1) \
  mvn compile -pl commerce-service -am -q 2>&1 | tail -10
```
Expected: BUILD SUCCESS.

**Step 8: Commit**
```bash
git add commerce-service/src/main/java/com/MaSoVa/commerce/order/client/StoreServiceClient.java \
        commerce-service/src/main/java/com/MaSoVa/commerce/order/service/OrderService.java \
        commerce-service/src/main/resources/application.yml
# If RestTemplateConfig was created:
git add commerce-service/src/main/java/com/MaSoVa/commerce/config/RestTemplateConfig.java 2>/dev/null || true
git commit -m "feat(commerce): validate delivery radius before order creation — reject out-of-range addresses"
```

---

## Task 3: Frontend — RTK Query Endpoint for Radius Check

**Files:**
- Modify: `frontend/src/store/api/storeApi.ts`

**Step 1: Read `frontend/src/store/api/storeApi.ts` fully.**

**Step 2: Add the response interface** (after existing interfaces near the top):

```typescript
export interface DeliveryRadiusCheckResult {
  withinRadius: boolean;
  storeId: string;
  deliveryRadiusKm: number;
  latitude: number;
  longitude: number;
}
```

**Step 3: Add the query endpoint** inside the `storeApi` endpoints builder (after `getNearbyStores`):

```typescript
checkDeliveryRadius: builder.query<DeliveryRadiusCheckResult, { storeId: string; latitude: number; longitude: number }>({
  query: ({ storeId, latitude, longitude }) =>
    `/stores/${storeId}/delivery-radius-check?latitude=${latitude}&longitude=${longitude}`,
}),
```

**Step 4: Export the generated hook** — RTK Query auto-generates it as `useCheckDeliveryRadiusQuery`. Verify it appears in the exported hooks at the bottom of the file (RTK Query does this automatically with `storeApi.endpoints.checkDeliveryRadius.useQuery` — check how other hooks are exported in this file and follow the same pattern).

**Step 5: TypeScript check**
```bash
cd /Users/souravamseekarmarti/Projects/MaSoVa-restaurant-management-system/frontend
npm run build 2>&1 | grep -E "error TS|ERROR" | head -20
```
Expected: no new errors.

**Step 6: Commit**
```bash
git add frontend/src/store/api/storeApi.ts
git commit -m "feat(frontend): add checkDeliveryRadius RTK Query endpoint to storeApi"
```

---

## Task 4: Frontend — Checkout Delivery Radius Warning

**Files:**
- Modify: `frontend/src/pages/customer/PaymentPage.tsx`

**Step 1: Read `PaymentPage.tsx` fully** (it is ~500 lines).

**Step 2: Import the new hook** at the top with the other storeApi imports. Find the existing storeApi import line and add `useCheckDeliveryRadiusQuery` to it.

**Step 3: Get the selected address coordinates**

After the existing `selectedAddressId` state (around line 40), add:

```typescript
// Get selected address object for radius check
const selectedAddress = customerProfile?.addresses?.find(a => a.id === selectedAddressId) ?? null;
const selectedLat = selectedAddress?.latitude ?? null;
const selectedLng = selectedAddress?.longitude ?? null;
```

**Step 4: Call the radius check hook** (after the `selectedAddress` variables):

```typescript
const { data: radiusCheck } = useCheckDeliveryRadiusQuery(
  {
    storeId: selectedStoreId || '',
    latitude: selectedLat ?? 0,
    longitude: selectedLng ?? 0,
  },
  {
    skip:
      orderType !== 'DELIVERY' ||
      !selectedStoreId ||
      selectedLat === null ||
      selectedLng === null,
  }
);

const isOutsideDeliveryRadius =
  orderType === 'DELIVERY' &&
  selectedLat !== null &&
  selectedLng !== null &&
  radiusCheck !== undefined &&
  radiusCheck.withinRadius === false;
```

**Step 5: Block order placement when outside radius**

Find the existing `isPlaceOrderDisabled` variable (around line 223) and add `|| isOutsideDeliveryRadius` to its condition:

```typescript
const isPlaceOrderDisabled =
  isLoading ||
  (orderType === 'DELIVERY' && !guestInfo && (!customerProfile || !selectedAddressId)) ||
  isOutsideDeliveryRadius;
```

**Step 6: Add inline warning UI**

Find where the delivery address section renders (around the `{orderType === 'DELIVERY' && (` block near line 268 or 448). After the address display, add the warning — find a good spot near the address selector, before the place order button:

```tsx
{isOutsideDeliveryRadius && (
  <div style={{
    backgroundColor: '#fff3cd',
    border: '1px solid #ffc107',
    borderRadius: '8px',
    padding: '12px 16px',
    color: '#856404',
    fontSize: '14px',
    marginTop: '8px',
  }}>
    ⚠ Your delivery address is outside this store's delivery area ({radiusCheck?.deliveryRadiusKm} km radius).
    Please choose a closer address or switch to Takeaway.
  </div>
)}
```

**Step 7: TypeScript check**
```bash
cd /Users/souravamseekarmarti/Projects/MaSoVa-restaurant-management-system/frontend
npm run build 2>&1 | grep -E "error TS|ERROR" | head -20
```
Expected: no new errors from PaymentPage.tsx.

**Step 8: Commit**
```bash
git add frontend/src/pages/customer/PaymentPage.tsx
git commit -m "feat(frontend): block checkout and warn when delivery address outside store radius"
```

---

## Task 5: CI/CD — Rewrite release.yml for 6-Service Architecture

**Files:**
- Modify: `.github/workflows/release.yml`

**Step 1: Read the current `.github/workflows/release.yml` fully.**

**Step 2: Replace the entire file** with the updated version that references the new 6-service names:

```yaml
name: Build and Release MaSoVa

# Trigger on version tags (e.g., v2.1.0)
on:
  push:
    tags:
      - 'v*.*.*'

permissions:
  contents: write
  packages: write

env:
  DOCKER_IMAGE: souravamseekar/masova-backend
  DOCKER_FRONTEND_IMAGE: souravamseekar/masova-frontend

jobs:
  # ============================================================
  # Job 1: Build all 6 services
  # ============================================================
  build:
    name: Build All Services
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-java@v4
        with:
          java-version: '21'
          distribution: 'temurin'
          cache: maven

      - name: Extract version from tag
        id: version
        run: |
          VERSION=${GITHUB_REF#refs/tags/v}
          echo "VERSION=$VERSION" >> $GITHUB_OUTPUT

      - name: Build all modules (skip tests — tests run in CI job)
        run: mvn clean install -DskipTests

      - name: Collect service JARs
        run: |
          mkdir -p masova-release
          for svc in api-gateway core-service commerce-service payment-service logistics-service intelligence-service; do
            cp $svc/target/*.jar masova-release/ 2>/dev/null || echo "No JAR for $svc"
          done
          ls -lh masova-release/

      - name: Upload JARs as artifact
        uses: actions/upload-artifact@v4
        with:
          name: masova-jars-${{ steps.version.outputs.VERSION }}
          path: masova-release/

  # ============================================================
  # Job 2: Build and push Docker images
  # ============================================================
  docker:
    name: Build Docker Images
    needs: build
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Download JARs
        uses: actions/download-artifact@v4
        with:
          name: masova-jars-${{ needs.build.outputs.VERSION }}
          path: masova-release/

      - name: Log in to Docker Hub
        uses: docker/login-action@v3
        with:
          username: ${{ secrets.DOCKERHUB_USERNAME }}
          password: ${{ secrets.DOCKERHUB_TOKEN }}

      - name: Build and push backend image
        uses: docker/build-push-action@v5
        with:
          context: .
          file: api-gateway/Dockerfile
          push: true
          tags: |
            ${{ env.DOCKER_IMAGE }}:${{ github.ref_name }}
            ${{ env.DOCKER_IMAGE }}:latest

      - name: Set up Node for frontend build
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: frontend/package-lock.json

      - name: Build frontend
        run: cd frontend && npm ci && npm run build

      - name: Build and push frontend image
        uses: docker/build-push-action@v5
        with:
          context: frontend
          file: frontend/Dockerfile.production
          push: true
          tags: |
            ${{ env.DOCKER_FRONTEND_IMAGE }}:${{ github.ref_name }}
            ${{ env.DOCKER_FRONTEND_IMAGE }}:latest

  # ============================================================
  # Job 3: Create GitHub Release
  # ============================================================
  release:
    name: Create Release
    needs: [build, docker]
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Extract version
        id: version
        run: |
          VERSION=${GITHUB_REF#refs/tags/v}
          echo "VERSION=$VERSION" >> $GITHUB_OUTPUT

      - name: Download JARs
        uses: actions/download-artifact@v4
        with:
          name: masova-jars-${{ steps.version.outputs.VERSION }}
          path: masova-release/

      - name: Package release archive
        run: |
          cd masova-release
          tar -czf ../masova-v${{ steps.version.outputs.VERSION }}.tar.gz .
          cd ..
          zip -r masova-v${{ steps.version.outputs.VERSION }}.zip masova-release/

      - name: Create GitHub Release
        uses: softprops/action-gh-release@v2
        with:
          files: |
            masova-v${{ steps.version.outputs.VERSION }}.tar.gz
            masova-v${{ steps.version.outputs.VERSION }}.zip
          body: |
            ## MaSoVa v${{ steps.version.outputs.VERSION }}

            ### Services
            - api-gateway (port 8080)
            - core-service (port 8085)
            - commerce-service (port 8084)
            - payment-service (port 8089)
            - logistics-service (port 8095)
            - intelligence-service (port 8087)

            ### Infrastructure
            Run `docker-compose up -d` to start MongoDB, Redis, and RabbitMQ.
```

**Step 3: Validate YAML syntax**
```bash
python3 -c "import yaml; yaml.safe_load(open('.github/workflows/release.yml'))" && echo "YAML valid"
```
Expected: `YAML valid`

**Step 4: Commit**
```bash
git add .github/workflows/release.yml
git commit -m "ci: rewrite release.yml for 6-service architecture (Phase 1 consolidation)"
```

---

## Task 6: CI/CD — Add PR/Push CI Workflow

**Files:**
- Create: `.github/workflows/ci.yml`

**Step 1: Create the file**

```yaml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  # ============================================================
  # Backend Tests
  # ============================================================
  backend:
    name: Backend Tests
    runs-on: ubuntu-latest

    services:
      mongodb:
        image: mongo:7
        ports:
          - 27017:27017
        options: >-
          --health-cmd "mongosh --eval 'db.runCommand({ ping: 1 })'"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

      redis:
        image: redis:7-alpine
        ports:
          - 6379:6379
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

      rabbitmq:
        image: rabbitmq:3.12-alpine
        ports:
          - 5672:5672
        env:
          RABBITMQ_DEFAULT_USER: masova
          RABBITMQ_DEFAULT_PASS: masova_secret

    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-java@v4
        with:
          java-version: '21'
          distribution: 'temurin'
          cache: maven

      - name: Run backend tests
        env:
          JWT_SECRET: ci-test-secret-key-at-least-64-chars-long-for-hs512-algorithm-security
          RABBITMQ_USERNAME: masova
          RABBITMQ_PASSWORD: masova_secret
        run: mvn test -pl core-service,commerce-service,payment-service,logistics-service,intelligence-service,api-gateway --no-transfer-progress 2>&1 | tail -40

  # ============================================================
  # Frontend Tests
  # ============================================================
  frontend:
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

      - name: Run frontend tests
        run: cd frontend && npm run test:run

      - name: TypeScript check
        run: cd frontend && npm run build -- --mode production 2>&1 | tail -20

  # ============================================================
  # Deploy to staging (main branch only)
  # ============================================================
  deploy-staging:
    name: Deploy Staging
    needs: [backend, frontend]
    if: github.ref == 'refs/heads/main' && github.event_name == 'push'
    runs-on: ubuntu-latest
    steps:
      - name: Staging deploy placeholder
        run: echo "Deploy to staging — configure Cloud Run or SSH target here"
```

**Step 2: Validate YAML syntax**
```bash
python3 -c "import yaml; yaml.safe_load(open('.github/workflows/ci.yml'))" && echo "YAML valid"
```
Expected: `YAML valid`

**Step 3: Commit**
```bash
git add .github/workflows/ci.yml
git commit -m "ci: add CI workflow — backend tests + frontend vitest on every push/PR"
```

---

## Task 7: Docker Compose — Add All 6 Services

**Files:**
- Modify: `docker-compose.yml`

**Step 1: Read `docker-compose.yml` fully** (currently has mongodb, redis, rabbitmq only).

**Step 2: Add all 6 backend services and the frontend dev server**

After the existing `rabbitmq` service block and before the `volumes:` section, add:

```yaml
  # ============================================================
  # Backend Services
  # ============================================================
  core-service:
    build:
      context: core-service
      dockerfile: Dockerfile
    ports:
      - "8085:8085"
    environment:
      - SPRING_DATA_MONGODB_URI=mongodb://masova-mongodb:27017/masova_core
      - SPRING_REDIS_HOST=masova-redis
      - SPRING_RABBITMQ_HOST=masova-rabbitmq
      - SPRING_RABBITMQ_USERNAME=masova
      - SPRING_RABBITMQ_PASSWORD=masova_secret
      - JWT_SECRET=dev-jwt-secret-key-at-least-64-characters-long-for-hs512-security
    depends_on:
      - masova-mongodb
      - masova-redis
      - masova-rabbitmq
    networks:
      - masova-network
    restart: unless-stopped

  commerce-service:
    build:
      context: commerce-service
      dockerfile: Dockerfile
    ports:
      - "8084:8084"
    environment:
      - SPRING_DATA_MONGODB_URI=mongodb://masova-mongodb:27017/masova_commerce
      - SPRING_REDIS_HOST=masova-redis
      - SPRING_RABBITMQ_HOST=masova-rabbitmq
      - SPRING_RABBITMQ_USERNAME=masova
      - SPRING_RABBITMQ_PASSWORD=masova_secret
      - JWT_SECRET=dev-jwt-secret-key-at-least-64-characters-long-for-hs512-security
      - CORE_SERVICE_URL=http://core-service:8085
    depends_on:
      - masova-mongodb
      - masova-redis
      - masova-rabbitmq
      - core-service
    networks:
      - masova-network
    restart: unless-stopped

  payment-service:
    build:
      context: payment-service
      dockerfile: Dockerfile
    ports:
      - "8089:8089"
    environment:
      - SPRING_DATA_MONGODB_URI=mongodb://masova-mongodb:27017/masova_payment
      - SPRING_REDIS_HOST=masova-redis
      - SPRING_RABBITMQ_HOST=masova-rabbitmq
      - SPRING_RABBITMQ_USERNAME=masova
      - SPRING_RABBITMQ_PASSWORD=masova_secret
      - JWT_SECRET=dev-jwt-secret-key-at-least-64-characters-long-for-hs512-security
    depends_on:
      - masova-mongodb
      - masova-redis
      - masova-rabbitmq
    networks:
      - masova-network
    restart: unless-stopped

  logistics-service:
    build:
      context: logistics-service
      dockerfile: Dockerfile
    ports:
      - "8095:8095"
    environment:
      - SPRING_DATA_MONGODB_URI=mongodb://masova-mongodb:27017/masova_logistics
      - SPRING_REDIS_HOST=masova-redis
      - SPRING_RABBITMQ_HOST=masova-rabbitmq
      - SPRING_RABBITMQ_USERNAME=masova
      - SPRING_RABBITMQ_PASSWORD=masova_secret
      - JWT_SECRET=dev-jwt-secret-key-at-least-64-characters-long-for-hs512-security
      - CORE_SERVICE_URL=http://core-service:8085
    depends_on:
      - masova-mongodb
      - masova-redis
      - masova-rabbitmq
      - core-service
    networks:
      - masova-network
    restart: unless-stopped

  intelligence-service:
    build:
      context: intelligence-service
      dockerfile: Dockerfile
    ports:
      - "8087:8087"
    environment:
      - SPRING_DATA_MONGODB_URI=mongodb://masova-mongodb:27017/masova_analytics
      - SPRING_REDIS_HOST=masova-redis
      - SPRING_RABBITMQ_HOST=masova-rabbitmq
      - SPRING_RABBITMQ_USERNAME=masova
      - SPRING_RABBITMQ_PASSWORD=masova_secret
      - JWT_SECRET=dev-jwt-secret-key-at-least-64-characters-long-for-hs512-security
    depends_on:
      - masova-mongodb
      - masova-redis
      - masova-rabbitmq
    networks:
      - masova-network
    restart: unless-stopped

  api-gateway:
    build:
      context: api-gateway
      dockerfile: Dockerfile
    ports:
      - "8080:8080"
    environment:
      - CORE_SERVICE_URL=http://core-service:8085
      - COMMERCE_SERVICE_URL=http://commerce-service:8084
      - PAYMENT_SERVICE_URL=http://payment-service:8089
      - LOGISTICS_SERVICE_URL=http://logistics-service:8095
      - INTELLIGENCE_SERVICE_URL=http://intelligence-service:8087
      - JWT_SECRET=dev-jwt-secret-key-at-least-64-characters-long-for-hs512-security
    depends_on:
      - core-service
      - commerce-service
      - payment-service
      - logistics-service
      - intelligence-service
    networks:
      - masova-network
    restart: unless-stopped
```

**Step 3: Add Dockerfiles for services that don't have them**

Check which services have a Dockerfile:
```bash
for svc in core-service commerce-service payment-service logistics-service intelligence-service; do
  [ -f "$svc/Dockerfile" ] && echo "$svc: ✓" || echo "$svc: MISSING"
done
```

For each MISSING service, create a Dockerfile (same pattern as api-gateway):
```dockerfile
FROM openjdk:21-jdk-slim
WORKDIR /app
COPY target/*.jar app.jar
EXPOSE <PORT>
ENTRYPOINT ["java", "-jar", "app.jar"]
```

Ports: core-service=8085, commerce-service=8084, payment-service=8089, logistics-service=8095, intelligence-service=8087.

**Step 4: Validate docker-compose syntax**
```bash
docker compose config --quiet && echo "Compose valid"
```
Expected: `Compose valid` (or no output with exit code 0).

**Step 5: Commit**
```bash
git add docker-compose.yml
# Add any new Dockerfiles
for svc in core-service commerce-service payment-service logistics-service intelligence-service; do
  [ -f "$svc/Dockerfile" ] && git add "$svc/Dockerfile"
done
git commit -m "feat(infra): add all 6 services to docker-compose with Dockerfiles"
```

---

## End-to-End Verification

**Phase 2.3:**
1. Start core-service: `JAVA_HOME=... mvn spring-boot:run -pl core-service`
2. Test: `curl "http://localhost:8085/api/stores/store-1/delivery-radius-check?latitude=17.385&longitude=78.487"` → `{"withinRadius":true,...}`
3. Test out-of-range: `curl "http://localhost:8085/api/stores/store-1/delivery-radius-check?latitude=28.6139&longitude=77.2090"` → `{"withinRadius":false,...}`
4. Frontend: select DELIVERY, choose address far from store → warning banner appears, "Place Order" is disabled

**Phase 2.4:**
1. `python3 -c "import yaml; yaml.safe_load(open('.github/workflows/ci.yml'))"` → no error
2. `python3 -c "import yaml; yaml.safe_load(open('.github/workflows/release.yml'))"` → no error
3. Push to main → CI workflow runs in GitHub Actions

**Phase 2.5:**
1. `docker compose config --quiet` → no errors
2. `docker compose build api-gateway` → builds successfully
