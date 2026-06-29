# Git Hygiene Cleanup — Summary (2026-06-29)

## Safety net

All deleted/closed branches were tagged first (`backup/<branch-name>`) — recoverable indefinitely:

```bash
git checkout -b <branch-name> backup/<branch-name-with-slashes-as-dashes>
```

Remote tags (verified): `backup/feat-demo-germany-seed`, `backup/feature-global-1-allergen`, `backup/feature-global-2-eu-vat-engine`, `backup/feature-global-3-currency-locale-i18n`, `backup/feature-global-4-stripe-payments`, `backup/feature-global-5-fiscal-signing`, `backup/feature-global-6-aggregator-hub`, `backup/feature-phase0-production-blockers`, `backup/security-remediation-plan-a`, `backup/security-remediation-plan-b`.

## Branches deleted (0 commits ahead of main — pointer-only)

- `chore/fix-ci-workflows`, `chore/rename-to-masova-platform`, `chore/repo-cleanup`, `docs/readme-and-templates`, `feat/backend-test-infrastructure`, `fix/api-gateway-test-deps`, `feat/in-progress-changes` — already gone from remote before this cleanup (earlier `git fetch --prune`)
- `feature/global-1-allergen`
- `feature/global-5-fiscal-signing`
- `feature/global-6-aggregator-hub`
- `feature/phase0-production-blockers`
- `feat/demo-germany-seed`

## PRs closed (commits absorbed into PR #17 via merge commits `e672eea1`, `115958f3`)

- #15 `security-remediation-plan-a` (branch deleted)
- #16 `security-remediation-plan-b` (branch deleted)

## PR #17 — CI gate (Task 2.5) — RESOLVED 2026-06-29

| Check | Final status |
|---|---|
| Backend Tests | ✅ |
| Backend Pact Provider Verification | ✅ (Core 2/2, Logistics 2/2) |
| Pact Consumer Tests | ✅ |
| Validate OpenAPI Specs | ✅ |
| Frontend Tests | ✅ **102/102 files, 1400/1400 tests** |

Fixes landed on `chore/sync-local-main-and-log-cleanup` (13 frontend commits + 2 backend commits + ProtectedRoute OOM fix `4c692a31`). Dell Tier 1A green; Tier 1B skipped locally (Testcontainers/docker-java over SSH broken — CI Pact authoritative).

**Merge:** User approved merge 2026-06-29. Requires approving GitHub review (cannot self-approve) — merge via GitHub UI after review, or disable review requirement temporarily.

Dedicated plans (untracked → committed with this summary):

- `2026-06-29-pr17-local-first-ci-gate-plan.md` — backend/Pact/Dell gate
- `2026-06-29-pr17-frontend-tests-fix-plan.md` — frontend Vitest fix

## Global feature branches — rebased 2026-06-29 (pre-merge onto PR #17 tip)

| Branch | Unique commits after rebase | Notes |
|---|---|---|
| `feature/global-2-eu-vat-engine` | **0** (tip = PR #17) | All work already absorbed into PR #17; branch is a pointer at current tip — safe to delete after merge or keep for future Global-2 work |
| `feature/global-3-currency-locale-i18n` | **0** (tip = PR #17) | Same — fully absorbed |
| `feature/global-4-stripe-payments` | **1** (`da3a2b82` docs: mark Global-4 DONE) | Rebased cleanly; only a stale docs commit remains — drop or cherry-pick after merge |

Remote updated via `git push --force-with-lease`. After PR #17 merges, run `git fetch && git rebase origin/main` on any branch still in use (should be no-op for global-2/3).

See `scripts/rebase-global-features.ps1` (Dell) / `scripts/rebase-global-features.sh` (Mac).

## Local-only state (Task 3.5 — not destroyed)

- 3 stashes — pending manual worktree review (git-hygiene plan Task 3.5 Step 4)
- Local `security-remediation-plan-a` — delete with `git branch -d` only after confirming commit is on `main` post-merge
- Upstream tracking for `feature/global-2` and `feature/global-3` — set per Task 3.5 Step 2

## New safeguards — PENDING (Tasks 4–8, post-merge follow-up PRs)

| Item | Status |
|---|---|
| `.gitattributes` | Not added yet (Task 4) |
| `.github/CODEOWNERS` | Not added yet (Task 5) |
| Pre-commit secret scan | Not added yet (Task 6, local-only hook) |
| Branch protection: `require_code_owner_reviews`, `required_linear_history` | Not enabled yet (Task 8) |

## Dell dev environment sync — NEW (2026-06-29)

**Policy change:** Frontend dev moves from Mac M1 → Dell (`192.168.50.88`). Mac remains valid for mobile apps and AI agent.

After every `main` merge (or when switching machines):

```powershell
# On Dell (PowerShell) — see scripts/sync-dell-dev.ps1
git fetch origin --prune
git checkout main
git pull origin main
docker compose up -d mongodb redis rabbitmq postgres
cd frontend && npm ci
cd ..
# Backend: start services per CLAUDE.md
# Frontend: cd frontend && npm run dev  # :3000
```

Tier 1B (Testcontainers on Dell) still broken over SSH — use Tier 1A + CI Pact until docker-java is fixed.

## Known leaked test credential

`RAZORPAY_KEY_SECRET` test value was denylisted in `RazorpayConfig.java`. Plaintext fallbacks removed from `application.yml`, `.env.example`, `docs/plans/phase5-env-vars.md`. Git history not rewritten (test-mode key, already rejected in code).