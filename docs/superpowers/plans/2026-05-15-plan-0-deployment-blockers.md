# Deployment Blockers Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix 5 confirmed deployment blockers that will cause production failures before any other work begins.

**Architecture:** Each blocker is an independent fix in a different file. None depend on each other. All can be verified locally without Dell services running except Task 4 (requires `mvn compile` on commerce-service).

**Tech Stack:** Maven/Flyway (Java), TypeScript/Vite (frontend), GitHub Actions YAML

---

## File Map

| File | Change |
|------|--------|
| `commerce-service/src/main/resources/db/migration/V6__fiscal_signatures.sql` | Rename → V8 |
| `commerce-service/src/main/resources/db/migration/V7__uk_vat_ledger.sql` | Rename → V9 |
| `commerce-service/src/main/resources/db/migration/V8__stripe_tax_calculations.sql` | Rename → V10 |
| `frontend/src/config/api.config.ts` | Add `VITE_API_BASE_URL` fallback |
| `frontend/.env.example` | Fix `VITE_WS_URL` port + add `VITE_API_GATEWAY_URL` |
| `.github/workflows/deploy.yml` | Add missing env vars to backend deploy step |
| `.github/workflows/api-contract-validation.yml` | Rewrite to use current 5 services |

---

### Task 1: Fix Duplicate Flyway Migration Versions in commerce-service

**Context:** commerce-service has two files with version V6 and two with V7. Flyway throws `FlywayException: Found more than one migration with version 6` at startup — the service will not start. The existing sequence is V1→V5, then V6 (×2), V7 (×2), V8. We need to renumber the duplicates to V8, V9, V10.

**Files:**
- Rename: `commerce-service/src/main/resources/db/migration/V6__fiscal_signatures.sql` → `V8__fiscal_signatures.sql`
- Rename: `commerce-service/src/main/resources/db/migration/V7__uk_vat_ledger.sql` → `V9__uk_vat_ledger.sql`
- Rename: `commerce-service/src/main/resources/db/migration/V8__stripe_tax_calculations.sql` → `V10__stripe_tax_calculations.sql`

- [ ] **Step 1: Verify the conflict**

```bash
ls commerce-service/src/main/resources/db/migration/
```

Expected output shows two V6 and two V7 files:
```
V1__orders_schema.sql
V2__order_tips.sql
V3__order_tips_missing_cols.sql
V4__order_vat_columns.sql
V5__order_currency.sql
V6__aggregator_order_columns.sql   ← keep as V6
V6__fiscal_signatures.sql          ← rename to V8
V7__aggregator_connections.sql     ← keep as V7
V7__uk_vat_ledger.sql              ← rename to V9
V8__stripe_tax_calculations.sql    ← rename to V10
```

- [ ] **Step 2: Rename the conflicting files**

```bash
cd commerce-service/src/main/resources/db/migration
mv V6__fiscal_signatures.sql V8__fiscal_signatures.sql
mv V7__uk_vat_ledger.sql V9__uk_vat_ledger.sql
mv V8__stripe_tax_calculations.sql V10__stripe_tax_calculations.sql
```

- [ ] **Step 3: Verify no duplicates remain**

```bash
ls commerce-service/src/main/resources/db/migration/ | sort
```

Expected:
```
V1__orders_schema.sql
V2__order_tips.sql
V3__order_tips_missing_cols.sql
V4__order_vat_columns.sql
V5__order_currency.sql
V6__aggregator_order_columns.sql
V7__aggregator_connections.sql
V8__fiscal_signatures.sql
V9__uk_vat_ledger.sql
V10__stripe_tax_calculations.sql
```

- [ ] **Step 4: Verify commerce-service compiles (Mac — no Dell needed)**

```bash
mvn compile -pl commerce-service -am --no-transfer-progress -q
```

Expected: `BUILD SUCCESS` — no Flyway errors at compile time (Flyway runs at startup, but compile success confirms the file renaming didn't break anything structurally).

- [ ] **Step 5: Commit**

```bash
git add commerce-service/src/main/resources/db/migration/
git commit -m "fix(commerce): renumber duplicate Flyway migration versions V6/V7 to V8/V9/V10"
```

---

### Task 2: Fix Frontend Production Build Crash (VITE_API_GATEWAY_URL)

**Context:** `frontend/src/config/api.config.ts` calls `validateEnvVars()` on module load which throws if `VITE_API_GATEWAY_URL` is not set. The deploy workflow sets `VITE_API_BASE_URL` but not `VITE_API_GATEWAY_URL`. The app crashes immediately on production load. Fix: make `VITE_API_GATEWAY_URL` fall back to `VITE_API_BASE_URL` so both env var names work.

**Files:**
- Modify: `frontend/src/config/api.config.ts`

- [ ] **Step 1: Read the current validateEnvVars function**

```bash
grep -n "validateEnvVars\|VITE_API_GATEWAY\|VITE_API_BASE" frontend/src/config/api.config.ts
```

Expected output shows validation throws on missing `VITE_API_GATEWAY_URL`.

- [ ] **Step 2: Update api.config.ts to support both env var names**

In `frontend/src/config/api.config.ts`, replace the `validateEnvVars` function and the `API_CONFIG` gateway URL reference:

```typescript
// Replace the validateEnvVars function:
const validateEnvVars = () => {
  const gatewayUrl = import.meta.env.VITE_API_GATEWAY_URL || import.meta.env.VITE_API_BASE_URL;
  const wsUrl = import.meta.env.VITE_WS_URL;

  if (!gatewayUrl) {
    throw new Error(
      'Missing required environment variable: VITE_API_GATEWAY_URL (or VITE_API_BASE_URL as fallback)\n' +
      'Please set one of these in your .env file.'
    );
  }

  if (!wsUrl) {
    throw new Error(
      'Missing required environment variable: VITE_WS_URL\n' +
      'Please set this in your .env file.'
    );
  }
};

// Replace the GATEWAY constant:
const GATEWAY = import.meta.env.VITE_API_GATEWAY_URL || import.meta.env.VITE_API_BASE_URL;
```

Also update `API_CONFIG`:
```typescript
export const API_CONFIG = {
  API_GATEWAY_URL: import.meta.env.VITE_API_GATEWAY_URL || import.meta.env.VITE_API_BASE_URL,
  BASE_URL: import.meta.env.VITE_API_GATEWAY_URL || import.meta.env.VITE_API_BASE_URL,
  USER_SERVICE_URL: import.meta.env.VITE_API_GATEWAY_URL || import.meta.env.VITE_API_BASE_URL,
  ORDER_SERVICE_URL: import.meta.env.VITE_API_GATEWAY_URL || import.meta.env.VITE_API_BASE_URL,
  PAYMENT_SERVICE_URL: import.meta.env.VITE_API_GATEWAY_URL || import.meta.env.VITE_API_BASE_URL,
  CUSTOMER_SERVICE_URL: import.meta.env.VITE_API_GATEWAY_URL || import.meta.env.VITE_API_BASE_URL,
  REVIEW_SERVICE_URL: import.meta.env.VITE_API_GATEWAY_URL || import.meta.env.VITE_API_BASE_URL,
  // ... rest unchanged
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
cd frontend && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Verify build works with only VITE_API_BASE_URL set**

```bash
cd frontend && VITE_API_BASE_URL=http://192.168.50.88:8080 VITE_WS_URL=http://192.168.50.88:8084/ws npm run build 2>&1 | tail -5
```

Expected: `✓ built in Xs` — no crash.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/config/api.config.ts
git commit -m "fix(frontend): support VITE_API_BASE_URL as fallback for VITE_API_GATEWAY_URL to prevent prod crash"
```

---

### Task 3: Fix VITE_WS_URL Wrong Port in .env.example

**Context:** `.env.example` has `VITE_WS_URL=http://localhost:8083/ws`. commerce-service (which owns the WebSocket endpoint) runs on port 8084, not 8083. Port 8083 was the old pre-Phase1 order-service port. WebSocket connections silently fail in local dev.

**Files:**
- Modify: `frontend/.env.example`

- [ ] **Step 1: Fix the port**

In `frontend/.env.example`, change:
```
VITE_WS_URL=http://localhost:8083/ws
```
to:
```
VITE_WS_URL=http://localhost:8084/ws
```

- [ ] **Step 2: Also add VITE_API_GATEWAY_URL as an alias to .env.example**

After the existing `VITE_API_GATEWAY_URL=http://localhost:8080/api` line, add a comment clarifying both vars:
```
# API Gateway URL - used by api.config.ts
# Both variable names are supported (VITE_API_GATEWAY_URL takes precedence)
VITE_API_GATEWAY_URL=http://localhost:8080/api
VITE_API_BASE_URL=http://192.168.50.88:8080
```

- [ ] **Step 3: Commit**

```bash
git add frontend/.env.example
git commit -m "fix(frontend): correct VITE_WS_URL port from 8083 to 8084 (commerce-service WebSocket)"
```

---

### Task 4: Fix deploy.yml Missing Backend Env Vars

**Context:** The Cloud Run deploy step is missing `SPRING_DATASOURCE_URL` (all services need PostgreSQL), `STRIPE_SECRET_KEY` + `STRIPE_WEBHOOK_SECRET` (payment-service), `TWILIO_ACCOUNT_SID` + `TWILIO_AUTH_TOKEN` (core-service SMS), and `FIREBASE_SERVICE_ACCOUNT_JSON` (core-service push notifications). Services will start but fail to connect or crash on first use.

**Files:**
- Modify: `.github/workflows/deploy.yml`

- [ ] **Step 1: Add SPRING_DATASOURCE_URL to every backend service deploy**

In `.github/workflows/deploy.yml`, in the `deploy-backend` job's `Deploy to Cloud Run` step, add to the `--set-env-vars` block for ALL 6 services:

```yaml
SPRING_DATASOURCE_URL=jdbc:postgresql://${{ secrets.POSTGRES_HOST }}:5432/masova_db,\
SPRING_DATASOURCE_USERNAME=${{ secrets.POSTGRES_USERNAME }},\
SPRING_DATASOURCE_PASSWORD=${{ secrets.POSTGRES_PASSWORD }},\
```

- [ ] **Step 2: Add Stripe vars (payment-service only)**

The `deploy-backend` matrix job deploys all services with the same env block. Payment-service needs Stripe vars. Since all services share the same `--set-env-vars` block in the matrix, add these — they will be set on all services but only payment-service uses them:

```yaml
STRIPE_SECRET_KEY=${{ secrets.STRIPE_SECRET_KEY }},\
STRIPE_WEBHOOK_SECRET=${{ secrets.STRIPE_WEBHOOK_SECRET }},\
STRIPE_PUBLISHABLE_KEY=${{ secrets.STRIPE_PUBLISHABLE_KEY }},\
```

- [ ] **Step 3: Add Twilio and Firebase vars (core-service only)**

Similarly add to the shared env block:
```yaml
TWILIO_ACCOUNT_SID=${{ secrets.TWILIO_ACCOUNT_SID }},\
TWILIO_AUTH_TOKEN=${{ secrets.TWILIO_AUTH_TOKEN }},\
TWILIO_PHONE_NUMBER=${{ secrets.TWILIO_PHONE_NUMBER }},\
FIREBASE_SERVICE_ACCOUNT_JSON=${{ secrets.FIREBASE_SERVICE_ACCOUNT_JSON }},\
```

- [ ] **Step 4: Add VITE_API_GATEWAY_URL to frontend deploy**

In the `deploy-frontend` job's `Build` step:
```yaml
- name: Build
  run: cd frontend && npm run build
  env:
    VITE_API_BASE_URL: https://api.masova.app
    VITE_API_GATEWAY_URL: https://api.masova.app/api
    VITE_WS_URL: wss://api.masova.app/ws
    VITE_AGENT_URL: https://agent.masova.app
    VITE_RAZORPAY_KEY_ID: ${{ secrets.RAZORPAY_KEY_ID }}
    VITE_GOOGLE_MAPS_API_KEY: ${{ secrets.GOOGLE_MAPS_API_KEY }}
    VITE_GOOGLE_OAUTH_CLIENT_ID: ${{ secrets.GOOGLE_OAUTH_CLIENT_ID }}
```

- [ ] **Step 5: Verify YAML syntax is valid**

```bash
python3 -c "import yaml; yaml.safe_load(open('.github/workflows/deploy.yml'))" && echo "YAML valid"
```

Expected: `YAML valid`

- [ ] **Step 6: Commit**

```bash
git add .github/workflows/deploy.yml
git commit -m "fix(ci): add missing env vars to Cloud Run deploy (PostgreSQL, Stripe, Twilio, Firebase, VITE_API_GATEWAY_URL)"
```

---

### Task 5: Rewrite api-contract-validation.yml to Use Current Services

**Context:** `api-contract-validation.yml` tries to start `user-service`, `menu-service`, `order-service` etc — all merged into 5 services in Phase 1. It also runs `mvn test -Dtest=PactProviderTest` which doesn't exist and silently passes. This entire workflow needs rewriting to use the current 5 services and remove the fake provider verification.

**Files:**
- Rewrite: `.github/workflows/api-contract-validation.yml`

- [ ] **Step 1: Replace the entire file with the corrected workflow**

```yaml
name: API Contract Validation

on:
  pull_request:
    branches: [main]
  push:
    branches: [main]

jobs:
  # ============================================================
  # Job 1: Validate OpenAPI specs are in sync with code
  # ============================================================
  validate-openapi-specs:
    name: Validate OpenAPI Specs
    runs-on: ubuntu-latest
    services:
      mongodb:
        image: mongo:7
        ports: ["27017:27017"]
      redis:
        image: redis:7-alpine
        ports: ["6379:6379"]
      rabbitmq:
        image: rabbitmq:3.12-alpine
        ports: ["5672:5672"]
        env:
          RABBITMQ_DEFAULT_USER: masova
          RABBITMQ_DEFAULT_PASS: masova_secret
      postgres:
        image: postgres:16-alpine
        ports: ["5432:5432"]
        env:
          POSTGRES_USER: masova
          POSTGRES_PASSWORD: masova_secret
          POSTGRES_DB: masova_db
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-java@v4
        with:
          java-version: '21'
          distribution: 'temurin'
          cache: maven

      - name: Build all services (skip tests)
        run: mvn clean install -DskipTests -T 4 --no-transfer-progress
        env:
          JWT_SECRET: ci-test-secret-key-at-least-64-chars-long-for-hs512-algorithm-security

      - name: Start backend services
        run: |
          for svc in api-gateway core-service commerce-service payment-service logistics-service intelligence-service; do
            nohup mvn spring-boot:run -pl $svc --no-transfer-progress > /tmp/$svc.log 2>&1 &
          done
        env:
          JWT_SECRET: ci-test-secret-key-at-least-64-chars-long-for-hs512-algorithm-security
          SPRING_DATASOURCE_URL: jdbc:postgresql://localhost:5432/masova_db
          SPRING_DATASOURCE_USERNAME: masova
          SPRING_DATASOURCE_PASSWORD: masova_secret
          RABBITMQ_USERNAME: masova
          RABBITMQ_PASSWORD: masova_secret

      - name: Wait for services to be healthy
        run: |
          declare -A PORTS=(
            [api-gateway]=8080
            [core-service]=8085
            [commerce-service]=8084
            [payment-service]=8089
            [logistics-service]=8086
            [intelligence-service]=8087
          )
          for svc in "${!PORTS[@]}"; do
            port=${PORTS[$svc]}
            for i in $(seq 1 30); do
              if curl -sf http://localhost:$port/actuator/health > /dev/null 2>&1; then
                echo "✅ $svc ready on :$port"
                break
              fi
              if [ $i -eq 30 ]; then
                echo "❌ $svc timed out"
                cat /tmp/$svc.log | tail -30
                exit 1
              fi
              sleep 5
            done
          done

      - name: Refresh OpenAPI spec files
        run: |
          mkdir -p specs
          curl -sf http://localhost:8085/v3/api-docs > specs/core-spec.json
          curl -sf http://localhost:8084/v3/api-docs > specs/commerce-spec.json
          curl -sf http://localhost:8086/v3/api-docs > specs/logistics-spec.json
          curl -sf http://localhost:8089/v3/api-docs > specs/payment-spec.json
          curl -sf http://localhost:8087/v3/api-docs > specs/intelligence-spec.json

      - name: Count endpoints and verify ~175 total
        run: node -e "
          const fs = require('fs');
          const specs = ['core','commerce','logistics','payment','intelligence'];
          let total = 0;
          specs.forEach(s => {
            const spec = JSON.parse(fs.readFileSync('specs/' + s + '-spec.json'));
            const count = Object.values(spec.paths || {})
              .flatMap(p => Object.keys(p))
              .filter(m => ['get','post','put','patch','delete'].includes(m)).length;
            console.log(s + ': ' + count + ' endpoints');
            total += count;
          });
          console.log('Total: ' + total);
          if (total < 160 || total > 200) {
            console.error('FAIL: Expected ~175 endpoints, got ' + total);
            process.exit(1);
          }
          console.log('PASS: Endpoint count within expected range');
        "

      - name: Upload refreshed specs
        uses: actions/upload-artifact@v4
        with:
          name: openapi-specs
          path: specs/

  # ============================================================
  # Job 2: Pact consumer tests (frontend generates contracts)
  # ============================================================
  pact-consumer-tests:
    name: Pact Consumer Tests
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

      - name: Run Pact consumer tests
        run: cd frontend && npm run test:pact

      - name: Upload Pact contracts
        uses: actions/upload-artifact@v4
        with:
          name: pact-contracts
          path: frontend/pacts/

  # ============================================================
  # Job 3: Detect breaking API changes vs main
  # ============================================================
  api-breaking-change-detection:
    name: Detect Breaking API Changes
    runs-on: ubuntu-latest
    if: github.event_name == 'pull_request'
    needs: validate-openapi-specs
    steps:
      - uses: actions/checkout@v4
        with:
          ref: main
          path: main-branch

      - name: Download current branch specs
        uses: actions/download-artifact@v4
        with:
          name: openapi-specs
          path: current-specs/

      - name: Install openapi-diff
        run: npm install -g openapi-diff

      - name: Check for breaking changes
        run: |
          BREAKING=0
          for svc in core commerce logistics payment intelligence; do
            if [ -f "main-branch/specs/${svc}-spec.json" ] && [ -f "current-specs/${svc}-spec.json" ]; then
              echo "Checking $svc for breaking changes..."
              openapi-diff main-branch/specs/${svc}-spec.json current-specs/${svc}-spec.json \
                --format markdown > /tmp/${svc}-diff.md 2>&1 || true
              if grep -q "BREAKING" /tmp/${svc}-diff.md 2>/dev/null; then
                echo "❌ BREAKING changes in $svc"
                cat /tmp/${svc}-diff.md
                BREAKING=1
              else
                echo "✅ No breaking changes in $svc"
              fi
            fi
          done
          exit $BREAKING
```

- [ ] **Step 2: Verify YAML syntax**

```bash
python3 -c "import yaml; yaml.safe_load(open('.github/workflows/api-contract-validation.yml'))" && echo "YAML valid"
```

Expected: `YAML valid`

- [ ] **Step 3: Commit**

```bash
git add .github/workflows/api-contract-validation.yml
git commit -m "fix(ci): rewrite api-contract-validation to use current 5 services, remove dead pre-Phase1 service references"
```

---

## Verification Checklist

After completing all 5 tasks, verify:

- [ ] `ls commerce-service/src/main/resources/db/migration/ | sort` shows no duplicate version numbers
- [ ] `cd frontend && VITE_API_BASE_URL=http://localhost:8080 VITE_WS_URL=http://localhost:8084/ws npm run build` exits 0
- [ ] `python3 -c "import yaml; yaml.safe_load(open('.github/workflows/deploy.yml'))"` exits 0
- [ ] `python3 -c "import yaml; yaml.safe_load(open('.github/workflows/api-contract-validation.yml'))"` exits 0
- [ ] `grep "8083" frontend/.env.example` returns nothing (wrong port removed)
