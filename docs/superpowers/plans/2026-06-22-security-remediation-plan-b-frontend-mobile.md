# Security Remediation Plan B — Frontend & Mobile

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. Frontend runs on Mac (`frontend/`); mobile apps are `MaSoVaCrewApp/` and `masova-mobile/`, also on Mac.

**Goal:** Close the MEDIUM/LOW findings isolated to the frontend and mobile apps — receipt HTML injection, dead insecure auth hook, plaintext mobile token storage, and Android manifest gaps. None of these depend on Plan A's backend changes and can ship independently.

**Design spec:** [`2026-06-22-security-remediation-design.md`](../specs/2026-06-22-security-remediation-design.md)

**Source findings:** [`full_codebase_security_audit.md`](../../full_codebase_security_audit.md) §Frontend, §Mobile

**Tech stack:** React + TypeScript (frontend), React Native 0.83 (MaSoVaCrewApp), React Native 0.81 (masova-mobile, NOT Expo Go).

**Mandatory after every task:** run both `superpowers:code-reviewer` and `feature-dev:code-reviewer` agents on the diff before moving to the next task.

---

### Task 1: Escape HTML in receipt generator

**Files:**
- Modify: `frontend/src/components/ReceiptGenerator.tsx` (lines 85–230, `generateReceiptHTML`)

- [ ] **Step 1: Add an HTML-escaping helper (or use an existing one)**

Check `frontend/src/utils/security.ts` first — it already has `sanitizeHTML`/`sanitizeInput` exports per the audit's confirmed-non-issues list elsewhere in the codebase. Reuse if suitable; otherwise add a minimal escape function (`&`, `<`, `>`, `"`, `'`).

- [ ] **Step 2: Escape every interpolated field in `generateReceiptHTML`**

`customerName`, `customerPhone`, `deliveryAddress`, `item.specialInstructions`, and any other customer-supplied string fields going into the raw HTML template.

- [ ] **Step 3: Consider the alternative — render existing in-page React DOM instead**

The audit notes lines 276–412 already render a safe in-page React version. If feasible without a large refactor, prefer exporting/printing that DOM instead of building a separate raw HTML string. If this is a bigger change than escaping, do escaping now and leave the DOM-export approach as a follow-up note.

- [ ] **Step 4: Write tests**

`frontend/src/components/ReceiptGenerator.test.tsx` (create if absent): a customer name containing `<script>alert(1)</script>` or an `onerror=` attribute produces escaped output in the generated HTML string, not executable markup.

---

### Task 2: Delete or clearly deprecate the dead `useSecureAuth.ts` hook

**Files:**
- Modify or delete: `frontend/src/hooks/useSecureAuth.ts`

- [ ] **Step 1: Confirm it's truly unused**

Grep for `useSecureAuth` imports across `frontend/src` — the audit states it's not imported anywhere, but verify before deleting (per CLAUDE.md project-wide rule: "Before removing any endpoint, use Serena/Greptile to find all callers first" — apply the same diligence here even though it's a hook, not an endpoint).

- [ ] **Step 2: Delete the file**

Since it's confirmed unused and uses a weaker/divergent auth pattern than the canonical `authSlice.ts`/`axios.ts` flow, delete rather than mark deprecated — per project convention, don't keep latent traps around.

- [ ] **Step 3: Confirm no test file or story references it**

Remove `frontend/src/hooks/useSecureAuth.test.ts` if it exists, and any Storybook/docs references.

---

### Task 3: Migrate mobile token storage to Keychain/Keystore — MaSoVaCrewApp

**Files:**
- Modify: `MaSoVaCrewApp/src/store/slices/authSlice.ts` (lines 19–23)
- Modify: `MaSoVaCrewApp/package.json` (add dependency)

- [ ] **Step 1: Add `react-native-keychain` (or `react-native-encrypted-storage`) as a dependency**

Confirm which the team prefers — `react-native-keychain` is more widely used for token-specific storage; recommend it unless there's an existing pattern elsewhere in the monorepo to match.

- [ ] **Step 2: Move only `ACCESS_TOKEN` and `REFRESH_TOKEN` to Keychain**

Per the audit's fix recommendation: keep AsyncStorage for non-sensitive UI state (`USER` display fields can likely stay, but re-check — if `USER` contains anything sensitive like full JWT claims, move it too).

- [ ] **Step 3: Add a migration path for existing logged-in users**

On app start, if tokens exist in the old AsyncStorage location, read them once, write to Keychain, then clear the AsyncStorage entry — so existing sessions aren't force-logged-out by this change.

- [ ] **Step 4: Update `RoleRouter`/wherever tokens are read for API calls**

Ensure all read sites switch to the new Keychain-backed accessor, not just the write site.

- [ ] **Step 5: Write tests**

Mock Keychain module; confirm tokens are written/read via Keychain, not AsyncStorage; confirm the one-time migration path works when legacy AsyncStorage tokens are present.

---

### Task 4: Migrate mobile token storage to Keychain/Keystore — masova-mobile

**Files:**
- Modify: `masova-mobile/src/services/api.ts` (lines 28–30, 126–134)
- Modify: `masova-mobile/package.json` (add dependency)

- [ ] **Step 1–5: Mirror Task 3's steps for `masova-mobile`**

Same dependency, same migration-path requirement for `AUTH_TOKEN_KEY`/`REFRESH_TOKEN_KEY`. Since this app is bare RN 0.81 on Metro :8888 (not Expo Go — per CLAUDE.md), confirm the chosen library's native module links correctly without Expo's managed workflow (may require `pod install` / Gradle sync — flag this as a manual step if so).

---

### Task 5: Fix Android manifest gaps

**Files:**
- Modify: `masova-mobile/android/app/src/main/AndroidManifest.xml` (line 14 area)
- Verify (no change expected if already correct): `MaSoVaCrewApp/android/app/src/main/AndroidManifest.xml` (line 30 area)

- [ ] **Step 1: Set `android:allowBackup="false"` in masova-mobile's manifest**

MaSoVaCrewApp already sets this correctly per the audit — match that pattern.

- [ ] **Step 2: Verify `usesCleartextTraffic` resolves to `false` in MaSoVaCrewApp's release build**

It's templated (`${usesCleartextTraffic}`) — check the release `gradle.properties` or build variant config that resolves this placeholder, confirm it's `false` for release builds specifically (debug may differ).

- [ ] **Step 3: Write/update a build-config test or manual verification note**

If there's no automated way to assert manifest placeholder resolution, document the manual verification step (e.g. `cd android && ./gradlew :app:processReleaseManifest` then inspect the merged manifest) in this task's completion notes rather than skipping verification entirely.

---

## Final verification (after all tasks)

- [ ] Run `superpowers:code-reviewer` and `feature-dev:code-reviewer` on the full diff
- [ ] Run frontend test suite (`npm test` / Vitest) and confirm no regressions
- [ ] Manually test login persistence across app restart on both mobile apps after the Keychain migration (existing session should survive the upgrade, not force re-login)
- [ ] Update `docs/full_codebase_security_audit.md` with a "Remediated" column/date once each finding is closed
