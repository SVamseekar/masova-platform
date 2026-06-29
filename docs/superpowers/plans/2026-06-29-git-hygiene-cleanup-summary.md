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

**Merge:** ✅ PR #17 merged `e9a2c992` (2026-06-29). PR #18 Dell path doc merged `7788fa75`.

Dedicated plans (committed on main via PR #17):

- `2026-06-29-pr17-local-first-ci-gate-plan.md` — backend/Pact/Dell gate
- `2026-06-29-pr17-frontend-tests-fix-plan.md` — frontend Vitest fix

## Global feature branches — keep for adaptation work (post-PR #17)

Feature code for Global-2/3/4 is **on `main`** (absorbed via PR #17). Branches are **working branches** for adapting that code to the post-remediation codebase — not separate implementations.

| Branch | Action |
|---|---|
| `feature/global-2-eu-vat-engine` | `git reset --hard origin/main` then fix VAT tests/integration |
| `feature/global-3-currency-locale-i18n` | same, then currency/i18n adaptation |
| `feature/global-4-stripe-payments` | same, then complete Stripe frontend/mobile |

See `scripts/rebase-global-features.ps1` / `.sh` after each branch fast-forwards to `main`.

## Local-only state (Task 3.5 — not destroyed)

- 3 stashes — pending manual worktree review (git-hygiene plan Task 3.5 Step 4)
- Local `security-remediation-plan-a` — delete with `git branch -d` only after confirming commit is on `main` post-merge
- Upstream tracking for `feature/global-2` and `feature/global-3` — set per Task 3.5 Step 2

## Safeguards (Tasks 4–8)

| Task | Item | Status |
|---|---|---|
| 4 | `.gitattributes` | ✅ PR `chore/git-hygiene-safeguards` |
| 5 | `.github/CODEOWNERS` | ✅ same PR |
| 6 | Pre-commit secret scan + API validation | ✅ `scripts/git-hooks/pre-commit` + install scripts |
| 7 | Razorpay key in `phase5-env-vars.md` | ✅ placeholders (application.yml + .env.example already clean from PR #17) |
| 8 | Branch protection tightening | ⏳ **After safeguards PR merges** — see below |
| 3.5 | Stash audit | ⏳ Pending manual review |

### Install git hooks (Mac — when ready; scripts ship in PR #19)

```bash
./scripts/install-git-hooks.sh
```

Run once on Mac after PR #19 merges. Not required for git/GitHub hygiene closure.

### Task 8 — run after safeguards PR merges to `main`

```bash
gh api repos/SVamseekar/masova-platform/branches/main/protection > /tmp/main-protection-before.json

gh api -X PUT repos/SVamseekar/masova-platform/branches/main/protection \
  -F required_status_checks[strict]=true \
  -F 'required_status_checks[contexts][]=Backend Tests' \
  -F 'required_status_checks[contexts][]=Frontend Tests' \
  -F enforce_admins=true \
  -F required_pull_request_reviews[dismiss_stale_reviews]=true \
  -F required_pull_request_reviews[require_code_owner_reviews]=true \
  -F required_pull_request_reviews[required_approving_review_count]=1 \
  -F required_linear_history=true \
  -F required_conversation_resolution=true \
  -F allow_force_pushes=false \
  -F allow_deletions=false
```

**Merge habit going forward:** Use **Squash merge** on PRs (solo-friendly, pairs with `required_linear_history`). Full PR history stays on GitHub; `main` gets one clean commit per PR. PR #17 used merge commit intentionally to preserve absorbed Plan A/B history — that was a one-time exception.

## Deferred — handle later (not blocking git hygiene or Globals)

| Item | Notes |
|---|---|
| **Dell git hooks** | `install-git-hooks.ps1` — run when you want local secret scan on Dell |
| **Dell sync scripts** | `sync-dell-dev.ps1` — optional automation beyond `git pull origin main` |
| **Frontend on Dell policy** | Dev layout change (frontend :3000 on Dell vs Mac) — document in CLAUDE.md when you switch |
| **Dell Tier 1B** | Testcontainers/docker-java local verify — CI Pact is authoritative until fixed |
| **Task 3.5 stash audit** | 3 stashes — manual worktree review when convenient |

**Dell minimum today:** `cd D:\projects\masova-platform && git pull origin main` after each `main` merge.

## Known leaked test credential

`RAZORPAY_KEY_SECRET` test value was denylisted in `RazorpayConfig.java`. Plaintext fallbacks removed from `application.yml`, `.env.example`, `docs/plans/phase5-env-vars.md`. Git history not rewritten (test-mode key, already rejected in code).