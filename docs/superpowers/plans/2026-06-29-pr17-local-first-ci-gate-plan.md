# PR #17 Local-First CI Gate Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Get PR #17 (`chore/sync-local-main-and-log-cleanup`) to all-green CI by fixing the Core Pact provider verification and the Logistics unit-test regression it indirectly caused, then establish a local-first verification habit (Dell Tier 1A/1B, Mac Tier 1C) so future pushes are verified locally before they ever reach GitHub Actions. Frontend Tests (417/1385 failing across 57 files, heterogeneous causes) is explicitly scoped OUT of this plan as a separate `systematic-debugging` tranche — Task 2.5 sign-off and Task 3 (merge) do not require it green unless the user decides otherwise at the sign-off gate.

**Architecture:** Each backend fix follows the established Pact-regeneration pattern already used for Commerce (`cf633164`) and Logistics (`5089fe78`): the frontend Pact consumer test (source of truth) defines fewer interactions than the stale committed pact JSON, so regenerating via `npm run test:pact` + `scripts/copy-pacts.sh` drops the stale interactions; any remaining real mismatches get a minimal, justified production or test fix. The Logistics unit-test regression is fixed by updating the two assertions to match the already-approved `getDefaultZones()` fallback behavior (no new production change — that change was already approved in `5089fe78`). The local-first gate is a checklist + one verification script, not new CI infra.

**Tech Stack:** Maven (JDK 21 on Dell, JDK 17 on Mac — Mac cannot run full `mvn verify`), Node 20/Vitest/Pact-JS (frontend, Mac), Docker Compose (mongodb/redis/rabbitmq/postgres on Dell), GitHub CLI (`gh`).

## Global Constraints

- NEVER merge PR #17 without explicit separate user go-ahead (parent plan, Task 3).
- No force-push (parent plan).
- Do NOT modify `shared-security/.../JwtAuthenticationFilter.java` for debug (parent context).
- AskUserQuestion before any NEW production semantics beyond what's already approved (`DeliveryZoneService` null→`getDefaultZones()` fallback, `OrderService`/`StoreServiceClient` currency path on `05ffddab` — both already approved, no new asks expected in this plan; if Core's 2 real interactions need anything beyond JWT/seed wiring, stop and ask).
- One push per local-green cycle — no push-per-failure trial-and-error (parent context).
- Commit format: `feat(service):`, `fix(service):`, `chore:`, `docs:` (CLAUDE.md).
- NEVER add "Co-Authored-By" trailer to git commits (CLAUDE.md).
- TestDataController must stay behind `@Profile("dev")` — not touched by this plan, noted for awareness.
- Mac M1 cannot run full `mvn verify` (JDK 17 vs project's JDK 21 requirement) — all Java verification in this plan runs on Dell via SSH.

---

## Current State (verified 2026-06-29, live)

| Check | Status | Root cause (verified) |
|---|---|---|
| `Pact Consumer Tests` | ✅ pass | — |
| `Validate OpenAPI Specs` | ✅ pass | — |
| `Detect Breaking API Changes` | ✅ pass | — |
| `Backend Pact Provider Verification` | ❌ fail | Core: stale pact JSON has 6 interactions, consumer test only defines 2 (see Task 1) |
| `Backend Tests` (both runs) | ❌ fail | `logistics-service`: `DeliveryZoneServiceTest$GetDeliveryZones.returnsNullOnException` and `.returnsNullWhenStoreNull` still assert `isNull()`, but `5089fe78` changed the production code to return `getDefaultZones()` instead of `null` on those exact paths. Build stops at `logistics-service`, so `intelligence-service` and `core-service` modules never even run (`SKIPPED` in Reactor Summary) — meaning Core's real test status is currently unknown until this is fixed. |
| `Frontend Tests` (both runs) | ❌ fail | 417/1385 tests fail across 57 files; sampled failures are heterogeneous (e.g. `Button.test.tsx` fails on `pointer-events: none` during `userEvent.click` on a disabled button — a Testing Library interaction issue, not an MSW/RTK mock issue). OUT OF SCOPE for this plan (Task 5). |
| Review | `REVIEW_REQUIRED` | No approving review yet — separate from CI, also blocking Task 3. |

**Why Backend Tests will likely go green from one fix:** the Reactor build aborts at the first failing module (`logistics-service`) and skips everything after it (`intelligence-service`, `core-service`). Fixing the 2 assertions is very likely sufficient for this job — but Task 3 of this plan re-runs the full module list locally specifically to confirm `core-service`'s non-Pact unit/integration tests are also clean, since they have not actually executed in CI yet.

---

## Task 1: Fix Core Pact provider verification (stale interactions)

**Files:**
- Modify (regenerate, do not hand-edit): `core-service/src/test/resources/pacts/masova-frontend-core-service.json`
- Modify (regenerate, do not hand-edit): `commerce-service/src/test/resources/pacts/masova-frontend-core-service.json`
- Modify (regenerate, do not hand-edit): `logistics-service/src/test/resources/pacts/masova-frontend-core-service.json`
- Modify (regenerate, do not hand-edit): `payment-service/src/test/resources/pacts/masova-frontend-core-service.json`
- Reference (do not modify unless Step 4 finds a real mismatch): `frontend/src/pact/consumers/core-service.pact.test.ts`
- Reference (do not modify unless Step 4 finds a real mismatch): `core-service/src/test/java/com/MaSoVa/core/contract/CorePactVerificationIT.java`

**Context:** The committed `core-service/src/test/resources/pacts/masova-frontend-core-service.json` has 6 interactions: `a login request with valid credentials`, `a request to get customer by id`, `a request to get store by ID`, `a request to get user by ID`, `a request to list customers`, `a request to list stores`. `core-service.pact.test.ts` (the actual source of truth, read on Mac at lines 1-87) only defines 2: `a request to get user by ID` and `a request to get store by ID`. `CorePactVerificationIT.java` only has `@State` handlers for `user exists with id USER-PACT-1`, `store exists with id STORE-PACT-1`, and `no data` — there is no state handler for `user exists with email test@masova.com`, `customer exists with id cust-pact-1`, `customers exist`, or `stores exist`, so Pact provider verification fails outright on 4 of the 6 stale interactions with "no provider state defined" / 404 errors. This is the exact same drift pattern already fixed for Logistics (`5089fe78`) and Commerce (`cf633164`): the consumer test file was trimmed down at some point but the committed pact JSON (generated from an older version of the consumer test) was never regenerated.

- [ ] **Step 1: On Mac, regenerate the core-service pact from the current consumer test**

```bash
cd /Users/souravamseekarmarti/Projects/MaSoVa-restaurant-management-system/frontend
rm -f pacts/masova-frontend-core-service.json
npx vitest run --config vitest.pact.config.ts src/pact/consumers/core-service.pact.test.ts
```

Expected output: both tests pass (`a request to get user by ID` and `a request to get store by ID`), ending with something like `Test Files  1 passed (1)` / `Tests  2 passed (2)`.

- [ ] **Step 2: Verify the regenerated pact has exactly 2 interactions**

```bash
cd /Users/souravamseekarmarti/Projects/MaSoVa-restaurant-management-system/frontend
node -e "const p = require('./pacts/masova-frontend-core-service.json'); console.log('interactions:', p.interactions.length); p.interactions.forEach(i => console.log(' -', i.description))"
```

Expected output:
```
interactions: 2
 - a request to get user by ID
 - a request to get store by ID
```

If it prints anything other than exactly these 2, STOP — the consumer test file may have changed since this plan was written; re-read `core-service.pact.test.ts` before continuing.

- [ ] **Step 3: Copy the regenerated pact to all 4 backend services**

```bash
cd /Users/souravamseekarmarti/Projects/MaSoVa-restaurant-management-system
for svc in commerce-service core-service logistics-service payment-service; do
  cp frontend/pacts/masova-frontend-core-service.json "$svc/src/test/resources/pacts/masova-frontend-core-service.json"
done
git status --short | grep masova-frontend-core-service
```

Expected: 4 modified files listed, one per service, all named `masova-frontend-core-service.json`.

- [ ] **Step 4: Confirm CorePactVerificationIT already has matching state handlers (it does, per the file read at plan-writing time) — no Java change expected**

```bash
grep -n '@State' core-service/src/test/java/com/MaSoVa/core/contract/CorePactVerificationIT.java
```

Expected output:
```
    @State("user exists with id USER-PACT-1")
    @State(value = "user exists with id USER-PACT-1", action = StateChangeAction.TEARDOWN)
    @State("store exists with id STORE-PACT-1")
    @State(value = "store exists with id STORE-PACT-1", action = StateChangeAction.TEARDOWN)
    @State("no data")
```

These already cover both interactions left in the regenerated pact (`user exists with id USER-PACT-1`, `store exists with id STORE-PACT-1`). If this grep output differs from what's shown above, STOP and re-investigate — do not blindly proceed to Task 3's Dell run assuming it will pass.

- [ ] **Step 5: Commit the regenerated pacts**

```bash
cd /Users/souravamseekarmarti/Projects/MaSoVa-restaurant-management-system
git add commerce-service/src/test/resources/pacts/masova-frontend-core-service.json \
        core-service/src/test/resources/pacts/masova-frontend-core-service.json \
        logistics-service/src/test/resources/pacts/masova-frontend-core-service.json \
        payment-service/src/test/resources/pacts/masova-frontend-core-service.json
git commit -m "fix(pact): regenerate core-service pact to drop 4 stale interactions

core-service.pact.test.ts only defines 2 interactions (get user, get
store) but the committed pact JSON had 6 (also login, get customer,
list customers, list stores) with no matching @State handlers in
CorePactVerificationIT, causing 4/6 provider verification failures.
Same drift pattern already fixed for Logistics (5089fe78) and
Commerce (cf633164)."
```

(Do NOT push yet — pushing happens once in Task 4 after all local gates are green.)

---

## Task 2: Fix Logistics unit-test regression from the `getDefaultZones()` fallback change

**Files:**
- Modify: `logistics-service/src/test/java/com/MaSoVa/logistics/unit/service/DeliveryZoneServiceTest.java:318-340`

**Context:** Commit `5089fe78` changed `DeliveryZoneService.getDeliveryZones` (in `logistics-service/src/main/java/com/MaSoVa/logistics/delivery/service/DeliveryZoneService.java`) so that when the store lookup fails or returns null, it now falls back to `getDefaultZones()` instead of returning `null` — this was an approved fix needed for the Pact contract (the consumer expects a populated body with `Content-Type`, not an empty 404-ish response). However, the **existing unit tests for those exact two code paths were never updated** to reflect the new approved behavior, so they still assert `assertThat(result).isNull()`. This is what currently fails Backend Tests in CI (`DeliveryZoneServiceTest$GetDeliveryZones.returnsNullOnException:339` and `.returnsNullWhenStoreNull:327`, confirmed from the live CI log of run `28350329944`/`28350328310`). The failing CI output already shows what `getDefaultZones()` actually returns:
```
[{"deliveryFeeINR"=30.0, "estimatedDeliveryMinutes"=15, "maxDistanceKm"=3.0, "minDistanceKm"=0.0, "zoneName"="A"},
 {"deliveryFeeINR"=50.0, "estimatedDeliveryMinutes"=25, "maxDistanceKm"=6.0, "minDistanceKm"=3.0, "zoneName"="B"},
 {"deliveryFeeINR"=80.0, "estimatedDeliveryMinutes"=35, "maxDistanceKm"=10.0, "minDistanceKm"=6.0, "zoneName"="C"}]
```
This is a test-only fix — no new production semantics, since the production behavior change was already approved in `5089fe78`.

- [ ] **Step 1: Read the current two failing test methods to get exact surrounding code**

```bash
cd /Users/souravamseekarmarti/Projects/MaSoVa-restaurant-management-system
sed -n '305,341p' logistics-service/src/test/java/com/MaSoVa/logistics/unit/service/DeliveryZoneServiceTest.java
```

Expected: shows `returnsNullWhenStoreNull` (around line 322) and `returnsNullOnException` (around line 332), each currently ending in `assertThat(result).isNull();`.

- [ ] **Step 2: Update `returnsNullWhenStoreNull` to assert the default-zones fallback instead of null**

Replace:
```java
        void returnsNullWhenStoreNull() {
            mockStoreDetails(null);

            List<Map<String, Object>> result = deliveryZoneService.getDeliveryZones(STORE_ID);

            assertThat(result).isNull();
        }
```
with:
```java
        void returnsDefaultZonesWhenStoreNull() {
            mockStoreDetails(null);

            List<Map<String, Object>> result = deliveryZoneService.getDeliveryZones(STORE_ID);

            assertThat(result).isNotNull();
            assertThat(result).hasSize(3);
            assertThat(result.get(0)).containsEntry("zoneName", "A");
        }
```

Note the method name change (`returnsNullWhenStoreNull` → `returnsDefaultZonesWhenStoreNull`) and `@DisplayName` above it must also be updated — read the actual `@DisplayName` text at that location in Step 1's output and update it to say "returns default zones when store is null" (replacing whatever currently says "returns null when store data is null/similar").

- [ ] **Step 3: Update `returnsNullOnException` to assert the default-zones fallback instead of null**

Replace:
```java
        @DisplayName("returns null when restTemplate throws (getStoreDetails catches and returns null)")
        void returnsNullOnException() {
            mockStoreDetailsThrows(new RuntimeException("Network error"));

            // getStoreDetails catches the exception and returns null
            // getDeliveryZones sees null storeData and returns null
            List<Map<String, Object>> result = deliveryZoneService.getDeliveryZones(STORE_ID);

            assertThat(result).isNull();
        }
```
with:
```java
        @DisplayName("returns default zones when restTemplate throws (getStoreDetails catches, getDeliveryZones falls back)")
        void returnsDefaultZonesOnException() {
            mockStoreDetailsThrows(new RuntimeException("Network error"));

            List<Map<String, Object>> result = deliveryZoneService.getDeliveryZones(STORE_ID);

            assertThat(result).isNotNull();
            assertThat(result).hasSize(3);
            assertThat(result.get(0)).containsEntry("zoneName", "A");
        }
```

- [ ] **Step 4: Commit (do not run `mvn test` on Mac — JDK 17 vs project's JDK 21; verification happens on Dell in Task 3)**

```bash
cd /Users/souravamseekarmarti/Projects/MaSoVa-restaurant-management-system
git add logistics-service/src/test/java/com/MaSoVa/logistics/unit/service/DeliveryZoneServiceTest.java
git commit -m "fix(logistics): update DeliveryZoneServiceTest for approved getDefaultZones fallback

5089fe78 changed getDeliveryZones to fall back to getDefaultZones()
instead of returning null when the store lookup fails or returns
null, but left these two unit tests asserting the old null-return
behavior, breaking Backend Tests in CI."
```

---

## Task 3: Run Tier 1A + 1B on Dell (mirrors `ci.yml` backend job + `api-contract-validation.yml` Pact jobs)

**Files:** none (verification only — this task either confirms Task 1/2 fixed everything, or surfaces a new failure to triage before any push)

**Context:** Dell (`Vamsee@192.168.50.88`, JDK 21) is the only machine that can run the full `mvn verify`/`mvn test` suite for all 6 services — Mac is JDK 17 and per CLAUDE.md is frontend/Claude/mobile only. This task pulls the two local commits from Task 1/2 onto Dell and runs the exact module list CI runs, plus the Pact provider verification job, before anything is pushed.

- [ ] **Step 1 (Mac): push the two local commits to the PR branch's remote-tracking state is NOT done yet — instead, bundle them for Dell to pull. Since Dell needs these commits and they're already committed locally on Mac, push now (this is the "one push per local-green cycle" — but Dell needs the commits to test them, so this exception applies: push to the open PR branch, CI will be red until Tier 1A/1B confirm green, which is expected and fine since CI already showed red before this push too)**

Actually — per the Global Constraints ("One push per local-green cycle — no push-per-failure trial-and-error"), do NOT push yet. Instead hand the 2 commits to Dell via `git fetch`/pull through the same remote branch ref without pushing new commits publicly until Tier 1A/1B are confirmed. Use a local bundle instead:

```bash
cd /Users/souravamseekarmarti/Projects/MaSoVa-restaurant-management-system
git bundle create /tmp/pr17-pact-fixes.bundle origin/chore/sync-local-main-and-log-cleanup..HEAD
ls -la /tmp/pr17-pact-fixes.bundle
```

Expected: bundle file created, non-zero size.

- [ ] **Step 2 (Mac → Dell): copy the bundle to Dell and apply it on top of Dell's checkout of the same branch**

```bash
scp /tmp/pr17-pact-fixes.bundle Vamsee@192.168.50.88:/tmp/pr17-pact-fixes.bundle
```

Then on Dell (PowerShell):
```powershell
ssh Vamsee@192.168.50.88
cd D:\Projects\masova-platform
git fetch origin
git checkout chore/sync-local-main-and-log-cleanup
git pull origin chore/sync-local-main-and-log-cleanup
git fetch /tmp/pr17-pact-fixes.bundle
git merge FETCH_HEAD
git log --oneline -3
```

Expected: the two new commits (`fix(pact): regenerate core-service pact...` and `fix(logistics): update DeliveryZoneServiceTest...`) appear at the top of `git log`.

- [ ] **Step 3 (Dell): ensure Docker infra is up**

```powershell
docker compose up -d mongodb redis rabbitmq postgres
docker compose ps
```

Expected: all 4 containers show `Up`/`running` status.

- [ ] **Step 4 (Dell): run Tier 1A — mirrors `ci.yml` backend job exactly (all 6 services)**

```powershell
$env:JWT_SECRET="ci-test-secret-key-at-least-64-chars-long-for-hs512-algorithm-security"
$env:RABBITMQ_USERNAME="masova"
$env:RABBITMQ_PASSWORD="masova_secret"
$env:MONGODB_URI="mongodb://localhost:27017/masova_test"
$env:REDIS_HOST="localhost"
$env:REDIS_PORT="6379"
mvn test -pl api-gateway,core-service,commerce-service,payment-service,logistics-service,intelligence-service -am --no-transfer-progress
```

Expected: `BUILD SUCCESS`, Reactor Summary shows all 6 services (plus `Shared Models`, `Shared Security Library`) as `SUCCESS`, none `SKIPPED`. If `logistics-service` still fails on `DeliveryZoneServiceTest`, re-check Task 2's edits landed (Step 2 above should have confirmed this). If `core-service` fails on anything new (since it was previously `SKIPPED` in CI and never actually ran), STOP — read the failure, do not guess a fix; if it requires new production semantics, use AskUserQuestion before changing anything.

- [ ] **Step 5 (Dell): run Tier 1B — mirrors `api-contract-validation.yml` Pact consumer + provider jobs**

Pact consumer tests run on Mac/Node, not Dell — Tier 1B on Dell is the provider verification half. First regenerate pacts is already done (Task 1), so just copy and verify:

```powershell
bash scripts/copy-pacts.sh
```

Expected output: `Copied 4 pact file(s) to commerce-service`, `Copied 4 pact file(s) to core-service`, `Copied 4 pact file(s) to logistics-service`, `Copied 4 pact file(s) to payment-service`.

```powershell
$env:JWT_SECRET="ci-test-secret-key-at-least-64-chars-long-for-hs512-algorithm-security"
$env:SPRING_DATASOURCE_URL="jdbc:postgresql://localhost:5432/masova_db"
$env:SPRING_DATASOURCE_USERNAME="masova"
$env:SPRING_DATASOURCE_PASSWORD="masova_secret"
$env:RABBITMQ_USERNAME="masova"
$env:RABBITMQ_PASSWORD="masova_secret"
mvn verify -pl shared-models,shared-security,core-service,commerce-service,logistics-service,payment-service -am -Dtest=NONE "-Dsurefire.failIfNoSpecifiedTests=false" "-Dit.test=*PactVerificationIT" --no-transfer-progress
```

Expected: `BUILD SUCCESS`. Look specifically for `CorePactVerificationIT` and `LogisticsPactVerificationIT` in the test output — both should show `Tests run: 2, Failures: 0, Errors: 0` (Core: get-user + get-store interactions; Logistics: the 2 interactions left after `5089fe78`'s cleanup) and `CommercePactVerificationIT` / `PaymentPactVerificationIT` should continue passing as before (already-green, no changes made to them in this plan).

Note: `postgres` was not in the Step 3 `docker compose up` list — if `mvn verify` fails to connect to PostgreSQL, run `docker compose up -d postgres` and retry this step (Postgres is required by `api-contract-validation.yml`'s Pact provider job but not by `ci.yml`'s backend job, hence the omission in Step 3 versus inclusion here).

- [ ] **Step 6 (Dell → report back to Mac): report Tier 1A/1B results**

If both Steps 4 and 5 show `BUILD SUCCESS`, tell the Mac session "Tier 1A and 1B green on Dell" so Task 4 can proceed. If either failed, paste the exact `[ERROR]` block (not the full log) back so the failure can be triaged on Mac before any retry — do not re-run blindly.

---

## Task 4: Single push and CI confirmation

**Files:** none

**Context:** Per the Global Constraints, push happens once per local-green cycle. This task only runs after Task 3 Step 6 reports both Tier 1A and Tier 1B green on Dell.

- [ ] **Step 1 (Mac): confirm the local branch still has exactly the 2 expected commits on top of the PR's current remote head**

```bash
cd /Users/souravamseekarmarti/Projects/MaSoVa-restaurant-management-system
git log origin/chore/sync-local-main-and-log-cleanup..HEAD --oneline
```

Expected: exactly 2 commits listed — the Task 1 pact-regeneration commit and the Task 2 test-fix commit.

- [ ] **Step 2 (Mac): push**

```bash
git push origin chore/sync-local-main-and-log-cleanup
```

Expected: push succeeds, no force flag used, no rejection.

- [ ] **Step 3 (Mac): poll PR #17 checks until Backend Tests and Backend Pact Provider Verification report a result (5-10 min typical)**

```bash
gh pr checks 17
```

Expected, once CI completes: `Backend Tests` = pass (both matrix runs if any), `Backend Pact Provider Verification` = pass, `Pact Consumer Tests` / `Validate OpenAPI Specs` / `Detect Breaking API Changes` remain pass (unaffected by these changes). `Frontend Tests` is expected to remain failing — this is correct and tracked separately in Task 5; do not treat it as a regression from this push.

If `Backend Tests` or `Backend Pact Provider Verification` come back failing with anything other than what Tier 1A/1B already covered, STOP — this means GitHub Actions' environment diverged from Dell's local environment (see Risks section) — do not push again to retry blindly; diagnose the specific diff first.

---

## Task 5: Scope Frontend Tests as a separate follow-up (not executed in this plan)

**Files:** none — this task only writes down the scoping decision; the actual fix is future work.

**Context:** 417 of 1385 frontend tests fail across 57 files (verified live from CI run `28350329944`, job `83981708872`). Sampled failures are NOT a single shared root cause:
- `src/components/ui/neumorphic/Button.test.tsx` fails with `Unable to perform pointer interaction as the element has 'pointer-events: none'` during `userEvent.click()` on a disabled/loading button — a Testing Library/jsdom interaction-library issue, unrelated to MSW or RTK Query.
- The parent plan's earlier characterization ("MSW/RTK mock setup... orderApi export missing from vi.mock... MSW handlers not matching") describes a different subset (`KitchenDisplayPage`, `customerApi`, `inventoryApi`, `orderApi`, `POSDashboard`) that is real but is only part of the 57 failing files — `DriverApp`, `POSSystem/CustomerPanel`, `POSSystem/MenuPanel`, `PINAuthModal`, `PromotionCard`, and neumorphic `Button`/`Input` are also failing for apparently unrelated reasons.

This breadth and heterogeneity means it should NOT be enumerated as fix-it tasks in this plan — it needs its own `systematic-debugging` pass to first establish whether there's a shared trigger (e.g., a global test setup file change, a Vitest/RTL version bump, a shared provider wrapper regression) before treating these as 57 independent bugs.

- [ ] **Step 1: Confirm with the user whether Frontend Tests must be green before Task 3 (merge) in the parent plan, or whether it's acceptable to merge backend-green with Frontend Tests tracked as a fast-follow**

This is a judgment call belonging to the user/parent-plan sign-off gate, not this plan. Do not decide it here — surface it explicitly at Task 2.5 sign-off (parent plan) using AskUserQuestion if not already decided.

- [ ] **Step 2: If the user wants Frontend Tests fixed before merge, open a new dedicated plan via `superpowers:writing-plans` scoped only to that investigation+fix, using `superpowers:systematic-debugging` as the investigation method — do not fold it into this plan's tasks.**

---

## Local Verification Checklist (run this before every future push to PR #17 or any branch touching backend/Pact/frontend)

| CI job (workflow file) | Local command | Where | Pass criteria |
|---|---|---|---|
| `Backend Tests` (`ci.yml`) | `mvn test -pl api-gateway,core-service,commerce-service,payment-service,logistics-service,intelligence-service -am --no-transfer-progress` (with `JWT_SECRET`, `RABBITMQ_USERNAME`, `RABBITMQ_PASSWORD`, `MONGODB_URI`, `REDIS_HOST`, `REDIS_PORT` env vars set as in Task 3 Step 4) | Dell (JDK 21) | `BUILD SUCCESS`, no module shows `SKIPPED` or `FAILURE` in Reactor Summary |
| `Pact Consumer Tests` (`api-contract-validation.yml`) | `cd frontend && npm run test:pact` | Mac | All consumer `.pact.test.ts` files pass; `frontend/pacts/*.json` regenerated |
| `Backend Pact Provider Verification` (`api-contract-validation.yml`) | `bash scripts/copy-pacts.sh` then `mvn verify -pl shared-models,shared-security,core-service,commerce-service,logistics-service,payment-service -am -Dtest=NONE "-Dsurefire.failIfNoSpecifiedTests=false" "-Dit.test=*PactVerificationIT" --no-transfer-progress` (with `JWT_SECRET`, `SPRING_DATASOURCE_*`, `RABBITMQ_*` env vars) | Dell (JDK 21, needs Postgres running too) | `BUILD SUCCESS`, each `*PactVerificationIT` shows `Failures: 0, Errors: 0` |
| `Validate OpenAPI Specs` (`api-contract-validation.yml`) | Optional Tier 3 — boot all 6 services locally and diff `/v3/api-docs` counts (~175 total) via `node scripts/test-api-full.js`-style check, or skip if no recent endpoint changes | Dell | Endpoint count stays in 160-200 range |
| `Frontend Tests` (`ci.yml`) | `cd frontend && npx tsc --noEmit && npm run test:run` | Mac | Tier 1C — currently known-red (417 failures); run to confirm you haven't made it WORSE, not to require green, until Task 5's follow-up plan lands |
| `Detect Breaking API Changes` (`api-contract-validation.yml`) | No practical local equivalent (needs `openapi-diff` against `main`'s artifact) — rely on CI for this one | — | N/A locally |

**Minimum gate before any push to this PR going forward:** Tier 1A (`Backend Tests`) AND Tier 1B (`Backend Pact Provider Verification`) green on Dell. Tier 1C (`Frontend Tests`) should be run to confirm no new regressions, but is not currently required to be green (Task 5).

---

## Risks: where Dell-local and GitHub Actions can diverge

- **JDK patch version**: Dell's installed JDK 21 may be a different patch version than `actions/setup-java@v4`'s `temurin` 21 — unlikely to matter for this fix, but worth knowing if a CI-only failure appears after Task 4 Step 3.
- **Postgres absence in `ci.yml`'s backend job**: the `Backend Tests` job in `ci.yml` does NOT start a Postgres service container, while `api-contract-validation.yml`'s Pact job does. If any test added since `05ffddab`'s dual-write currency work silently depends on Postgres being present, it would fail identically in both CI and Dell's Tier 1A run (same missing dependency) — so this is a shared risk, not a divergence risk.
- **RabbitMQ container startup flakiness**: the raw log noise seen in this plan's investigation (long RabbitMQ boot logs appearing in `--log-failed` output) suggests CI's RabbitMQ container sometimes takes the full health-check retry budget to become ready; Dell's persistent Docker containers (already running, not started fresh per job) won't reproduce this timing risk, so a CI-only flaky failure on RabbitMQ readiness is possible even after Dell shows green.
- **Stale Docker state on Dell**: Dell's `docker compose` containers persist between sessions (unlike CI's fresh containers per job) — if Dell's mongodb/redis/rabbitmq have leftover state from previous test runs, a test could pass locally for the wrong reason (relying on leftover data) and fail in CI's clean environment. Mitigate by recreating containers if any test result looks suspicious: `docker compose down -v && docker compose up -d mongodb redis rabbitmq postgres`.
- **Pact-JS / pact-jvm version drift**: the regenerated pact in Task 1 records `pact-js: 16.0.4`, `pactRust ffi: 0.4.28` in its metadata — if `frontend/package.json`'s `@pact-foundation/pact` version differs from what's actually installed when Task 1 runs, the regenerated JSON's metadata block (and possibly matching-rule serialization) could differ subtly from what CI's `npm ci` installs. Task 1 Step 1 uses the local `node_modules` (whatever `npm install` last produced) — if there's any doubt, run `npm ci` first to match CI's lockfile-exact install.

---

## User review checklist

Before I start executing this plan, please confirm:

1. **Task 1 (Core Pact fix)** — pure pact-regeneration, no production code change. Low risk.
2. **Task 2 (Logistics test fix)** — test-only change, asserts behavior already approved in `5089fe78`. No new production semantics. Low risk.
3. **Task 3 (Dell verification)** — uses a `git bundle`/`scp` handoff instead of pushing twice, to respect "one push per local-green cycle." If you'd rather just push once now and let Dell `git pull` directly (simpler, but means an extra red CI run is visible on the PR in the interim), say so and I'll simplify Task 3.
4. **Task 5 (Frontend Tests)** — intentionally NOT fixed in this plan. 417/1385 failures, heterogeneous causes (sampled: unrelated `Button.test.tsx` Testing Library issue, not just MSW mocks as originally assumed). Confirm you're OK with PR #17 potentially merging (subject to your Task 3 go-ahead in the parent plan) with Frontend Tests still red, tracked as a fast-follow — or tell me now if Frontend Tests must be green first, in which case Task 5 Step 2's follow-up plan should be written before, not after, this plan executes.
5. Confirms this plan does **not** execute Task 3 (merge) from the parent git-hygiene plan — that remains gated on your explicit separate go-ahead plus a passing review.

Two execution options once approved:
1. **Subagent-Driven (recommended)** — fresh subagent per task, review between tasks.
2. **Inline Execution** — execute tasks in this session via `executing-plans`, with checkpoints.

Which approach, and do you want any adjustments to points 3-4 above first?

---

## Completion Record (2026-06-29)

**Status: DONE** (backend scope) + frontend fixed in separate plan same PR.

| Task | Outcome |
|---|---|
| Task 1 — Core Pact regeneration | ✅ `60a81f7e` — 2 interactions, provider states seeded |
| Task 2 — Logistics unit tests | ✅ `fbf29d1d` — `getDefaultZones()` fallback assertions |
| Task 3 — Dell Tier 1A | ✅ BUILD SUCCESS (all 6 services, core 720/720) |
| Task 3 — Dell Tier 1B | ⏭️ Skipped (Option 1) — Testcontainers/docker-java over SSH broken; CI Pact authoritative |
| Task 4 — Push + CI | ✅ All backend checks green |
| Task 5 — Frontend | ✅ Fixed via `2026-06-29-pr17-frontend-tests-fix-plan.md` (102/102, 1400/1400) |

**CI final:** Backend Tests ✅, Backend Pact Provider ✅, Pact Consumer ✅, Validate OpenAPI ✅, Frontend Tests ✅.

**Dell policy update:** Frontend dev moves to Dell — see `scripts/sync-dell-dev.ps1` and git-hygiene summary.
