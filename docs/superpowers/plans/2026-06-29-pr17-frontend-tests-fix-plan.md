# PR #17 Frontend Tests Fix Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Get the `Frontend Tests` CI job green on PR #17 (`chore/sync-local-main-and-log-cleanup`) by fixing the 417 failing Vitest tests across 57 files, using root-cause fixes in test infrastructure first (highest ROI), then targeted per-domain cleanup.

**Architecture:** Follow `superpowers:systematic-debugging` — no fixes before evidence. Confirmed failure modes cluster into four shared root causes (MSW base URL mismatch, partial Redux `cart` preloads dropping `currency`/`locale`, RTL `userEvent` vs `pointer-events: none`, and stale query text). Fix shared infrastructure once, re-run the suite, then batch-fix remaining file-specific drift. **Test/mock layer only** — do not change production RTK slice URLs in this plan (app works against real gateway; tests must mirror gateway URLs in MSW).

**Tech Stack:** Vitest 1.6.x, RTL 16.x, MSW 2.x, `@testing-library/user-event` 14.x, Node 20 (CI), Mac M1 (local Tier 1C).

**Branch:** `chore/sync-local-main-and-log-cleanup` (same PR #17). Backend gates already green.

**Related docs:** `docs/superpowers/plans/2026-05-15-plan-4-frontend-test-infrastructure.md` (broader slice/handler audit — defer production slice changes; this plan scopes to green CI via test layer).

---

## Global Constraints

- Mac only for frontend verification (`cd frontend && npx tsc --noEmit && npm run test:run`).
- Use CI env when running locally (matches `ci.yml`):
  ```bash
  export VITE_API_GATEWAY_URL=http://localhost:8080/api
  export VITE_API_BASE_URL=http://localhost:8080/api
  export VITE_WS_URL=http://localhost:8080/ws
  ```
- One commit per task (or per logical task group where steps are tiny).
- Commit format: `fix(frontend):`, `test(frontend):`, `chore:` per CLAUDE.md.
- NEVER add "Co-Authored-By" trailer.
- Do not merge PR #17 — user decides merge after Frontend Tests green + review.
- If a failure requires production semantics change (not just test/mock), STOP and ask.

---

## Phase 0 Findings (systematic-debugging — completed 2026-06-29)

| Metric | Value (CI run `28354256218`) |
|---|---|
| Test files | 57 failed \| 44 passed (102 total) |
| Tests | 417 failed \| 962 passed (1385 total) |
| `tsc --noEmit` | pass (CI runs before vitest) |

### Confirmed root causes (ordered by blast radius)

**RC-1 — MSW / test API base URL missing `/api` (largest bucket)**

- MSW handlers + `*.test.ts` API constants use:
  ```ts
  const API = import.meta.env.VITE_API_URL || 'http://localhost:8080';
  ```
- Production + CI RTK Query uses `VITE_API_GATEWAY_URL=http://localhost:8080/api`.
- Example: RTK calls `GET http://localhost:8080/api/customers/cust-1`; MSW registers `GET http://localhost:8080/customers/cust-1` → unhandled → `fetch failed` / `isSuccess: false`.
- **Proof:** `customerApi.test.ts` → 34/36 fail with MSW warnings for `/api/customers/...` (local repro with CI env).

**RC-2 — Partial `cart` preloadedState wipes `currency`/`locale`**

- `createTestStore(preloadedState)` shallow-merges at root; tests pass `cart: { items: [], selectedStoreId }` without `currency`/`locale`.
- Components call `formatMoney(amount, currency, locale)` from cart selectors → `currency` is `undefined` → `TypeError: Currency code is required with currency style`.
- **Proof:** `MenuPanel.test.tsx` — 10/13 fail with that exact error; `defaultCartState` omits `currency`/`locale`.

**RC-3 — RTL `userEvent.click` on `pointer-events: none` buttons**

- Neumorphic `Button` sets `pointer-events: none` when `disabled` or `isLoading`.
- `@testing-library/user-event` v14 rejects the click (correct browser behavior).
- **Proof:** `Button.test.tsx` — 2 failures only; `currency.test.ts` passes (isolated).

**RC-4 — Stale test queries / copy drift**

- Example: `KitchenDisplayPage.test.tsx` expects `'Completed'`; UI column title is `'Picked Up'` (`KitchenDisplayPage.tsx:504`).
- Similar `Unable to find an element with the text: ...` failures across page/component tests.

### Secondary issues (fix after RC-1..RC-4 re-run)

- Missing type imports in tests (`MenuPanel.test.tsx` uses `MenuItem[]` without import).
- Incomplete `vi.mock` factories (POS/Driver suites).
- Stale MSW sub-routes that don't match RTK paths (lower priority once base URL fixed — many paths like `/user/:userId` are still used by slices).

### What is NOT the problem

- `tsc --noEmit` — passes.
- Pact consumer tests — separate job, already green.
- Backend / Dell Tier 1A — green.

---

## Task 0: Baseline script and failure taxonomy

**Files:**
- Create: `frontend/scripts/test-failure-taxonomy.mjs`

- [ ] **Step 1: Add taxonomy script**

```javascript
#!/usr/bin/env node
/**
 * Runs vitest JSON reporter and buckets failures by error signature.
 * Usage: cd frontend && node scripts/test-failure-taxonomy.mjs
 */
import { execSync } from 'node:child_process';

const env = {
  ...process.env,
  VITE_API_GATEWAY_URL: 'http://localhost:8080/api',
  VITE_API_BASE_URL: 'http://localhost:8080/api',
  VITE_WS_URL: 'http://localhost:8080/ws',
};

const raw = execSync('npx vitest run --reporter=json', {
  cwd: new URL('..', import.meta.url).pathname,
  env,
  maxBuffer: 50 * 1024 * 1024,
});

const report = JSON.parse(raw.toString());
let failedFiles = 0;
let failedTests = 0;
const buckets = {};

for (const file of report.testResults ?? []) {
  const fails = (file.assertionResults ?? []).filter((a) => a.status === 'failed');
  if (fails.length === 0) continue;
  failedFiles++;
  failedTests += fails.length;
  for (const f of fails) {
    const msg = f.failureMessages?.[0] ?? '';
    let bucket = 'other';
    if (msg.includes('Currency code is required')) bucket = 'currency-locale';
    else if (msg.includes('without a matching request handler') || msg.includes('fetch failed')) bucket = 'msw-url';
    else if (msg.includes('pointer-events')) bucket = 'user-event';
    else if (msg.includes('Unable to find an element')) bucket = 'query-drift';
    else if (msg.includes('is not a function') || msg.includes('Cannot read properties')) bucket = 'mock-setup';
    buckets[bucket] = (buckets[bucket] ?? 0) + 1;
  }
}

console.log(JSON.stringify({ failedFiles, failedTests, buckets }, null, 2));
```

- [ ] **Step 2: Run baseline (before any fixes)**

```bash
cd /Users/souravamseekarmarti/Projects/MaSoVa-restaurant-management-system/frontend
node scripts/test-failure-taxonomy.mjs | tee /tmp/frontend-taxonomy-before.json
```

Expected: `failedTests` near 417; `msw-url` and `currency-locale` among top buckets.

- [ ] **Step 3: Commit**

```bash
git add frontend/scripts/test-failure-taxonomy.mjs
git commit -m "chore(frontend): add vitest failure taxonomy script for CI debug"
```

---

## Task 1: Centralize test API base URL (fixes RC-1)

**Files:**
- Create: `frontend/src/test/testApiBase.ts`
- Modify: all 12 files in `frontend/src/test/mocks/handlers/*.ts`
- Modify: `frontend/src/store/api/*Api.test.ts` (9 files using `VITE_API_URL`)

- [ ] **Step 1: Create `testApiBase.ts`**

```typescript
/**
 * Single source of truth for MSW handler URLs and API integration tests.
 * Must match api.config.ts gateway URL used by RTK Query in CI.
 */
export const TEST_API_BASE =
  import.meta.env.VITE_API_GATEWAY_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  'http://localhost:8080/api';

/** Gateway root without trailing slash — e.g. http://localhost:8080/api */
export function apiUrl(path: string): string {
  const base = TEST_API_BASE.replace(/\/$/, '');
  const suffix = path.startsWith('/') ? path : `/${path}`;
  return `${base}${suffix}`;
}
```

- [ ] **Step 2: Update every MSW handler file**

Replace in each handler file:
```typescript
const API = import.meta.env.VITE_API_URL || 'http://localhost:8080';
```
with:
```typescript
import { apiUrl } from '../../testApiBase';
```
And replace handler paths:
- `${API}/customers` → `apiUrl('/customers')`
- `${API}/orders` → `apiUrl('/orders')`
- etc.

Files (all under `frontend/src/test/mocks/handlers/`):
`authHandlers.ts`, `menuHandlers.ts`, `orderHandlers.ts`, `deliveryHandlers.ts`, `userHandlers.ts`, `customerHandlers.ts`, `paymentHandlers.ts`, `inventoryHandlers.ts`, `analyticsHandlers.ts`, `notificationHandlers.ts`, `reviewHandlers.ts`, `sessionHandlers.ts`.

**Note:** `notificationHandlers.ts` may already embed `/api/` in paths — normalize to `apiUrl()` for consistency (avoid double `/api/api/`).

- [ ] **Step 3: Update API `*.test.ts` files**

Replace `const API = import.meta.env.VITE_API_URL || 'http://localhost:8080';` with:
```typescript
import { TEST_API_BASE } from '../../test/testApiBase';
const API = TEST_API_BASE;
```

Files:
`authApi.test.ts`, `storeApi.test.ts`, `inventoryApi.test.ts`, `paymentApi.test.ts`, `orderApi.test.ts`, `customerApi.test.ts`, `deliveryApi.test.ts`, `userApi.test.ts`, `menuApi.test.ts`.

- [ ] **Step 4: Verify MSW fix on highest-signal file**

```bash
cd frontend
VITE_API_GATEWAY_URL=http://localhost:8080/api VITE_WS_URL=http://localhost:8080/ws \
  npx vitest run src/store/api/customerApi.test.ts
```

Expected: majority of 36 tests pass (some may still fail on stale handler routes — note for Task 6).

- [ ] **Step 5: Commit**

```bash
git add frontend/src/test/testApiBase.ts frontend/src/test/mocks/handlers/ frontend/src/store/api/*.test.ts
git commit -m "fix(frontend): align MSW and API test base URL with gateway /api prefix"
```

---

## Task 2: Deep-merge cart defaults in test store (fixes RC-2)

**Files:**
- Modify: `frontend/src/test/TestWrapper.tsx`
- Modify: `frontend/src/test/utils/testUtils.tsx` (export helper)
- Create: `frontend/src/test/defaultPreloadedState.ts`

- [ ] **Step 1: Create default preloaded state helper**

```typescript
// frontend/src/test/defaultPreloadedState.ts
import type { PreloadedState } from '@reduxjs/toolkit';
import type { RootState } from '../store/store';

/** Cart defaults matching cartSlice initial state — required for formatMoney in tests. */
export const defaultCartPreload: RootState['cart'] = {
  items: [],
  total: 0,
  itemCount: 0,
  deliveryFee: 0,
  isLoading: false,
  selectedStoreId: null,
  selectedStoreName: null,
  currency: 'INR',
  locale: 'en-IN',
};

export function mergePreloadedState(
  partial?: PreloadedState<RootState>
): PreloadedState<RootState> {
  if (!partial) return { cart: defaultCartPreload };
  return {
    ...partial,
    cart: { ...defaultCartPreload, ...partial.cart },
  };
}
```

- [ ] **Step 2: Use merge in `createTestStore`**

In `TestWrapper.tsx` `createTestStore`:
```typescript
import { mergePreloadedState } from './defaultPreloadedState';

export function createTestStore(preloadedState?: PreloadedState<RootState>) {
  return configureStore({
    // ...reducers unchanged...
    preloadedState: mergePreloadedState(preloadedState),
  });
}
```

- [ ] **Step 3: Export from testUtils for direct use**

```typescript
export { defaultCartPreload, mergePreloadedState } from '../defaultPreloadedState';
```

- [ ] **Step 4: Verify on POS MenuPanel**

```bash
cd frontend
VITE_API_GATEWAY_URL=http://localhost:8080/api VITE_WS_URL=http://localhost:8080/ws \
  npx vitest run src/apps/POSSystem/components/MenuPanel.test.tsx
```

Expected: no `Currency code is required` errors.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/test/defaultPreloadedState.ts frontend/src/test/TestWrapper.tsx frontend/src/test/utils/testUtils.tsx
git commit -m "fix(frontend): preserve cart currency/locale defaults in test store preload"
```

---

## Task 3: RTL interaction helper for disabled/loading controls (fixes RC-3)

**Files:**
- Create: `frontend/src/test/utils/userEvent.ts`
- Modify: `frontend/src/components/ui/neumorphic/Button.test.tsx`

- [ ] **Step 1: Add shared userEvent factory**

```typescript
// frontend/src/test/utils/userEvent.ts
import userEvent from '@testing-library/user-event';

/** Default for most tests */
export const user = userEvent.setup();

/**
 * Use when asserting disabled/loading controls that set pointer-events: none.
 * user-event v14 correctly refuses those clicks; this disables the check.
 */
export const userNoPointerCheck = userEvent.setup({ pointerEventsCheck: 0 });
```

- [ ] **Step 2: Fix Button.test.tsx**

Replace disabled/loading click tests:
```typescript
import { user, userNoPointerCheck } from '@/test/utils/userEvent';

// disabled state test:
await userNoPointerCheck.click(screen.getByRole('button'));

// loading interaction test:
await userNoPointerCheck.click(screen.getByRole('button'));
```

- [ ] **Step 3: Run Button tests**

```bash
cd frontend && npx vitest run src/components/ui/neumorphic/Button.test.tsx
```

Expected: all tests pass.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/test/utils/userEvent.ts frontend/src/components/ui/neumorphic/Button.test.tsx
git commit -m "fix(frontend): use pointerEventsCheck override for disabled button tests"
```

---

## Task 4: Re-run taxonomy and fix query/copy drift (fixes RC-4)

**Files:**
- Modify: tests flagged with `query-drift` bucket after Task 1–3

- [ ] **Step 1: Re-run taxonomy**

```bash
cd frontend && node scripts/test-failure-taxonomy.mjs | tee /tmp/frontend-taxonomy-mid.json
```

Expected: `failedTests` drops substantially (target: <100 remaining).

- [ ] **Step 2: Fix KitchenDisplayPage column label**

In `frontend/src/pages/kitchen/KitchenDisplayPage.test.tsx` line ~95:
```typescript
// BEFORE
expect(screen.getByText('Completed')).toBeInTheDocument();
// AFTER — matches KitchenDisplayPage.tsx column title for COMPLETED status
expect(screen.getByText('Picked Up')).toBeInTheDocument();
```

- [ ] **Step 3: Fix Input helperText empty assertion**

In `Input.test.tsx`, `container.textContent` may include `<style>` from component. Replace:
```typescript
expect(container.textContent).toBe('');
```
with:
```typescript
expect(screen.queryByText(/./)).not.toBeInTheDocument(); // no visible helper text
// OR check helper paragraph absent:
expect(container.querySelector('.neumorphic-input-helper')).not.toBeInTheDocument();
```
(Read `Input.tsx` for actual helper class name before editing.)

- [ ] **Step 4: Batch-fix remaining `query-drift` files**

For each file in taxonomy `query-drift` list:
1. Read the component source for current copy/roles.
2. Update test queries — do not change production UI unless test is wrong about intended behavior.
3. Run file: `npx vitest run <file>`.

- [ ] **Step 5: Commit in logical groups** (e.g. kitchen pages, POS, customer pages).

---

## Task 5: Mock/setup fixes (POS, Driver, missing imports)

**Files:**
- Modify: failing files in `mock-setup` bucket

- [ ] **Step 1: Fix MenuPanel missing type import**

```typescript
import type { MenuItem } from '@/store/api/menuApi';
```

- [ ] **Step 2: Audit POS/Driver `vi.mock` factories**

Pattern: mocks that replace RTK hooks must export all symbols the module under test imports. For each failing POS/Driver file:
1. Read component imports from `orderApi`, `menuApi`, `paymentApi`, `customerApi`.
2. Ensure mock returns matching hook names + `orderApi` reducer stub if store is configured.

Reference working mock: `KitchenDisplayPage.test.tsx` lines 17–27.

- [ ] **Step 3: Run POS suite**

```bash
cd frontend
VITE_API_GATEWAY_URL=http://localhost:8080/api VITE_WS_URL=http://localhost:8080/ws \
  npx vitest run src/apps/POSSystem/
```

- [ ] **Step 4: Run Driver suite**

```bash
npx vitest run src/apps/DriverApp/
```

- [ ] **Step 5: Commit**

```bash
git commit -m "fix(frontend): repair POS and Driver test mocks and missing imports"
```

---

## Task 6: Align MSW handlers with RTK paths (remaining API test failures)

**Files:**
- Modify: specific handlers where tests still fail after Task 1

**Context:** Base URL fix resolves most mismatches. Remaining failures are often DELETE/PUT paths or endpoints where handler exists but method/path differs. Fix handlers to match what `*Api.ts` actually calls (read slice `query:` functions — do not invent backend paths).

- [ ] **Step 1: Run all `src/store/api/*.test.ts`**

```bash
cd frontend
VITE_API_GATEWAY_URL=http://localhost:8080/api VITE_WS_URL=http://localhost:8080/ws \
  npx vitest run src/store/api/
```

- [ ] **Step 2: For each failure, add/fix handler**

Example workflow for `deleteCustomer`:
1. Grep `deleteCustomer` in `customerApi.ts` for HTTP method + path.
2. Add matching `http.delete(apiUrl('/customers/:id'), ...)` in `customerHandlers.ts`.

- [ ] **Step 3: Re-run API tests until all pass**

- [ ] **Step 4: Commit**

```bash
git commit -m "fix(frontend): align MSW handlers with RTK Query customer/order paths"
```

---

## Task 7: Full suite green + CI verification

**Files:** none

- [ ] **Step 1: TypeScript check**

```bash
cd frontend && npx tsc --noEmit
```

Expected: exit 0.

- [ ] **Step 2: Full vitest (CI command)**

```bash
cd frontend
VITE_API_GATEWAY_URL=http://localhost:8080/api \
VITE_API_BASE_URL=http://localhost:8080/api \
VITE_WS_URL=http://localhost:8080/ws \
npm run test:run
```

Expected:
```
Test Files  102 passed (102)
Tests  1385 passed (1385)
```

- [ ] **Step 3: Taxonomy after**

```bash
node scripts/test-failure-taxonomy.mjs | tee /tmp/frontend-taxonomy-after.json
```

Expected: `failedTests: 0`.

- [ ] **Step 4: Push and poll PR #17**

```bash
git push origin chore/sync-local-main-and-log-cleanup
gh pr checks 17
```

Expected: `Frontend Tests` = pass (both matrix legs if applicable).

- [ ] **Step 5: Stop — await user merge decision**

Do not merge. Report: backend + frontend CI green, review status.

---

## Local Verification Checklist (Tier 1C)

| Step | Command | Pass criteria |
|---|---|---|
| Types | `cd frontend && npx tsc --noEmit` | exit 0 |
| Unit tests | `npm run test:run` (with CI env vars) | 0 failures |
| Taxonomy | `node scripts/test-failure-taxonomy.mjs` | `failedTests: 0` |
| CI | `gh pr checks 17` | `Frontend Tests` pass |

---

## Risks and out-of-scope

| Risk | Mitigation |
|---|---|
| Fixing MSW reveals RTK slice path bugs | This plan fixes handlers to match current slices; production slice audit is Plan 4, separate PR |
| 57 files have heterogeneous leftovers after RC-1..RC-4 | Taxonomy script after each task; don't batch-fix blindly |
| Full suite runtime (~6–10 min) | Use `npx vitest run <path>` per task; full suite only in Task 7 |
| `integration/*.test.ts` may hit real network | Mock or skip if not MSW-covered; fix in Task 6 |

**Out of scope:** Playwright E2E (Plan 5), production API reduction, coverage threshold enforcement, Dell SSH runs.

---

## User review checklist

1. **RC-1..RC-4 ordering** — infrastructure first, then drift/mocks. OK?
2. **No production RTK URL changes** in this plan — tests adapt to current slices. OK?
3. **Branch** — continue on `chore/sync-local-main-and-log-cleanup` / PR #17. OK?

**Execution options after approval:**

1. **Subagent-Driven (recommended)** — one subagent per task, review between tasks.
2. **Inline Execution** — `superpowers:executing-plans` in this session with checkpoints.

Which approach?

---

## Completion Record (2026-06-29)

**Status: DONE** — merged via PR #17 (`chore/sync-local-main-and-log-cleanup`).

| Metric | Before (CI) | After |
|---|---|---|
| Test files | 57 failed / 44 passed | **102/102 pass** |
| Tests | 417 failed / 962 passed | **1400/1400 pass** |
| `tsc --noEmit` | pass | pass |
| CI Frontend Tests | fail | **pass** |

**Root causes fixed:** RC-1 MSW `/api` base URL, RC-2 cart preloads, RC-3 `userNoPointerCheck`, RC-4 query drift, RC-6 handler shapes/routing. Additional: `ProtectedRoute.test.tsx` Navigate loop OOM (`4c692a31`).

**Key commits:** `b07adf44` … `4c692a31` (13 frontend fix commits on PR branch).

**Taxonomy after:** `{ failedFiles: 0, failedTests: 0, buckets: {} }`