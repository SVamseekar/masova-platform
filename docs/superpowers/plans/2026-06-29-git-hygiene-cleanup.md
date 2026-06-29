# Git Hygiene Cleanup Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. This plan is NOT a code-feature plan — it is git/GitHub repo hygiene work (branch cleanup, PR cleanup, protection config, hook hardening, docs). Tasks are ordered safest-first; later tasks depend on earlier ones being verified clean.

**Goal:** Bring the masova-platform git/GitHub setup to a clean, defensible "industry grade" baseline — no stale branches, no redundant PRs, consistent commit hygiene enforcement, cross-platform line-ending safety, and no plaintext leaked credentials in tracked files — without losing any commit, branch, or feature work.

**Architecture:** Each task is a standalone verification-then-action pair: verify safety with a read-only git/gh command, show the result, only then perform the (reversible-where-possible) action. No task rewrites existing git history (no rebase/filter-branch/force-push) — leaked-credential remediation is handled by replacing live tracked file content going forward, not by purging history, since the key is already invalidated/denylisted in code.

**Tech Stack:** git, GitHub CLI (`gh`), GitHub branch protection API, husky/native git hooks (bash), `.gitattributes`.

## Global Constraints

- NEVER add "Co-Authored-By" trailer to git commits (CLAUDE.md).
- NEVER force-push, never rewrite published history, never run destructive git ops (`reset --hard`, `clean -f`, `branch -D`) without explicit per-action confirmation.
- Commit format: `feat(service):`, `fix(service):`, `chore:`, `docs:` (CLAUDE.md).
- GitHub Flow: feature branches → PR → merge to main (CLAUDE.md).
- Repo: `https://github.com/SVamseekar/masova-platform.git`, default branch `main`, branch protection already requires 1 review + `Backend Tests` + `Frontend Tests` status checks, no force-push, no deletion allowed on `main`.

---

### Task 0: Tag-backup all active feature branches before any deletion

**Files:** none (local + remote git tags only)

**Context:** Insurance step requested by user review. Tags are cheap, additive, and survive branch deletion — even branches already confirmed safe to delete get a tag, so recovery is trivial if a verification step turns out to be wrong. This must run before Task 1.

- [ ] **Step 0: Commit this plan document itself so it's in version control before execution begins**

```bash
git status docs/superpowers/plans/2026-06-29-git-hygiene-cleanup.md
git add docs/superpowers/plans/2026-06-29-git-hygiene-cleanup.md
git commit -m "docs: add git hygiene cleanup plan"
git push
```

(Run on whatever branch is currently checked out — this is a docs-only addition with no risk, and matches existing commit conventions.)

- [ ] **Step 1: Fetch latest refs**

```bash
git fetch origin --prune
```

- [ ] **Step 2: Tag every remote branch that is a deletion/close candidate, plus the protected feature branches, as a safety net (guard against branches already deleted — e.g. by an earlier `--prune` — so the loop doesn't error out)**

```bash
for b in feature/global-1-allergen feature/global-5-fiscal-signing feature/global-6-aggregator-hub feature/phase0-production-blockers feat/demo-germany-seed security-remediation-plan-a security-remediation-plan-b feature/global-2-eu-vat-engine feature/global-3-currency-locale-i18n feature/global-4-stripe-payments; do
  if git rev-parse --verify "origin/$b" >/dev/null 2>&1; then
    tagname="backup/$(echo "$b" | tr '/' '-')"
    git tag "$tagname" "origin/$b"
  else
    echo "$b: does not exist on remote, skipping tag"
  fi
done
git push origin --tags
```

- [ ] **Step 3: Verify tags landed on remote**

```bash
git ls-remote --tags origin | grep backup/
```

Expected: a `backup/*` tag for every branch that still existed in Step 2 (up to 10; fewer if any were already deleted before this task ran). These are permanent unless explicitly deleted later (`git push origin --delete tag <name>`) — keep them indefinitely, they cost nothing.

---

### Task 1: Verify and delete zero-ahead stale branches

**Files:** none (remote branch refs only)

**Context:** Original audit identified 10 branches as 0-ahead of `origin/main`. A `git fetch --prune` run during user review already removed 7 of them server-side (they were deleted by someone/something between the audit and now): `chore/fix-ci-workflows`, `chore/rename-to-masova-platform`, `chore/repo-cleanup`, `docs/readme-and-templates`, `feat/backend-test-infrastructure`, `fix/api-gateway-test-deps`, and `feat/in-progress-changes` (not originally listed, also gone now). Current remaining 0-ahead candidates, reconfirmed live: `feature/global-1-allergen`, `feature/global-5-fiscal-signing`, `feature/global-6-aggregator-hub`, `feature/phase0-production-blockers`, plus `feat/demo-germany-seed` (found during user review, also 0-ahead — was missing from the original list). Deleting a branch only removes the pointer; commits reachable from `main` are unaffected. Task 0's tags provide a recovery path regardless.

- [ ] **Step 1: Fetch latest refs**

```bash
git fetch origin --prune
```

- [ ] **Step 2: Re-verify each branch is still 0-ahead of main AND still exists on remote (don't assume the earlier list is current)**

```bash
for b in feature/global-1-allergen feature/global-5-fiscal-signing feature/global-6-aggregator-hub feature/phase0-production-blockers feat/demo-germany-seed; do
  if git rev-parse --verify "origin/$b" >/dev/null 2>&1; then
    ahead=$(git rev-list --count origin/main..origin/"$b" 2>/dev/null)
    echo "$b: exists=yes ahead=$ahead"
  else
    echo "$b: exists=no (already deleted, skip)"
  fi
done
```

Expected: each existing branch prints `ahead=0`. If any branch shows `ahead` > 0, STOP and remove that branch from the deletion list — it has unmerged work. If a branch prints `exists=no`, skip it in Step 3 (already gone, no action needed).

- [ ] **Step 3: Delete only the branches confirmed exists=yes AND ahead=0 in Step 2 (use `|| true` so an already-deleted branch doesn't abort the loop)**

```bash
for b in feature/global-1-allergen feature/global-5-fiscal-signing feature/global-6-aggregator-hub feature/phase0-production-blockers feat/demo-germany-seed; do
  git push origin --delete "$b" || true
done
```

Expected output per branch still present: ` - [deleted]         <branch>`. Branches already gone will print a harmless "remote ref does not exist" error that `|| true` absorbs.

- [ ] **Step 4: Confirm deletion and that main is untouched**

```bash
git fetch origin --prune
git branch -r
```

Expected: none of `feature/global-1-allergen`, `feature/global-5-fiscal-signing`, `feature/global-6-aggregator-hub`, `feature/phase0-production-blockers`, `feat/demo-germany-seed` appear. `feature/global-2-eu-vat-engine`, `feature/global-3-currency-locale-i18n`, `feature/global-4-stripe-payments`, `security-remediation-plan-a`, `security-remediation-plan-b`, `chore/sync-local-main-and-log-cleanup`, `main` should still be present.

```bash
git log origin/main --oneline -5
```

Expected: identical commit list/hashes to before Task 1 (main untouched).

---

### Task 2: Verify PR #15 and #16 are fully superseded, then close and delete

**Files:** none (GitHub PR objects + remote branch refs only)

**Context:** PR #15 (`security-remediation-plan-a`) and PR #16 (`security-remediation-plan-b`) were already merged into `chore/sync-local-main-and-log-cleanup` (PR #17, current branch) via merge commits `e672eea1` and `115958f3`. Verified: `git log origin/security-remediation-plan-a --not origin/chore/sync-local-main-and-log-cleanup` and the equivalent for plan-b both returned empty — meaning zero commits exist in those branches that aren't already in the current branch.

- [ ] **Step 1: Re-verify zero unique commits (repeat the check, since time has passed)**

```bash
git fetch origin --prune
echo "=== plan-a unique commits not in current branch ==="
git log origin/security-remediation-plan-a --not origin/chore/sync-local-main-and-log-cleanup --oneline
echo "=== plan-b unique commits not in current branch ==="
git log origin/security-remediation-plan-b --not origin/chore/sync-local-main-and-log-cleanup --oneline
```

Expected: both sections print nothing. If either prints commits, STOP — do not close that PR; those commits need to be merged first.

- [ ] **Step 2: Close PR #15 with an explanatory comment**

```bash
gh pr comment 15 --body "Superseded by #17 — all commits from this branch are already merged in via e672eea1. Closing without merging to avoid duplicate/conflicting merge."
gh pr close 15
```

- [ ] **Step 3: Close PR #16 with an explanatory comment**

```bash
gh pr comment 16 --body "Superseded by #17 — all commits from this branch are already merged in via 115958f3. Closing without merging to avoid duplicate/conflicting merge."
gh pr close 16
```

- [ ] **Step 4: Delete the now-closed PR branches**

```bash
git push origin --delete security-remediation-plan-a
git push origin --delete security-remediation-plan-b
```

Expected: ` - [deleted]         security-remediation-plan-a` and same for plan-b.

- [ ] **Step 5: Confirm PR #17 still shows the work intact**

```bash
gh pr view 17 --json title,state,mergeable,commits --jq '.title, .state, .mergeable, (.commits | length)'
```

Expected: state `OPEN`, mergeable `MERGEABLE` (or `CONFLICTING` only if main moved — investigate if so, do not proceed to merge in that case), commit count > 0.

---

### Task 2.5: Resolve PR #17 CI failures (BLOCKING — out of scope for this plan, tracked here as a gate)

**Files:** TBD — depends on root-causing each failure below. Not detailed as plan steps because this is application-code debugging, not git hygiene, and needs its own investigation/plan.

**Context:** As of this plan's last live check, PR #17 has 1 passing required check (`Backend Tests`) and 3 failing checks plus a pending review:
- `Frontend Tests`: dozens of real test failures across `KitchenDisplayPage.test.tsx`, `security.test.ts`, `customerApi.test.ts`, `inventoryApi.test.ts`, `orderApi.test.ts`, `POSDashboard.test.tsx` — failure modes include RTK Query mock setup (`orderApi` export missing from `vi.mock`), MSW handlers not matching request URLs, and assertion mismatches (`expected false to be true`). This is broad enough that it looks like a shared mock/fixture regression, not isolated test rot.
- `Validate OpenAPI Specs`: `payment-service` times out during the "wait for services to be healthy" step in CI, then fails to boot via `spring-boot-maven-plugin:run` with a Spring property resolution error.
- `Backend Pact Provider Verification`: fails in the same payment-service startup path.
- Review: `REVIEW_REQUIRED` — no approving review yet (separate from CI, also blocking).

Task 3 (merge) MUST NOT proceed until these are green and approved. This task is intentionally left as a gate/checkpoint, not an implementation task — use `superpowers:systematic-debugging` when picking this up, since the frontend failures in particular look systemic (likely one shared root cause, e.g. a changed mock factory or MSW handler file) rather than six unrelated bugs.

- [ ] **Step 1: Re-check current status before assuming the above is still accurate**

```bash
gh pr checks 17
gh pr view 17 --json reviewDecision --jq '.reviewDecision'
```

- [ ] **Step 2: If still failing, stop here and scope a dedicated debugging pass (separate from this plan) before continuing to Task 3**

---

### Task 3: Merge PR #17 into main

**Files:** none directly (PR merge via GitHub)

**Context:** PR #17 (`chore/sync-local-main-and-log-cleanup`) contains all absorbed work from plan-a/plan-b plus additional CI fixes. This is the one action in this plan that changes `main`'s content — protected by existing branch protection (1 review + 2 required status checks).

- [ ] **Step 1: Confirm required status checks are passing**

```bash
gh pr checks 17
```

Expected: `Backend Tests` and `Frontend Tests` both show `pass`. If either is pending/failing, STOP and resolve before merging.

- [ ] **Step 2: Confirm required review approval exists**

```bash
gh pr view 17 --json reviewDecision --jq '.reviewDecision'
```

Expected: `APPROVED`. If not, request/obtain review before merging — do not bypass via admin override.

- [ ] **Step 3: Merge via GitHub (merge commit, not squash/rebase, to preserve full history)**

```bash
gh pr merge 17 --merge
```

- [ ] **Step 4: Verify main updated and pull locally**

```bash
git fetch origin
git log origin/main --oneline -5
git checkout main
git pull origin main
```

---

### Task 3.5: Local repo cleanup and stash audit (informational — no destructive action without separate confirmation)

**Files:** none (local-only: stashes, local branches, tracking config)

**Context:** Local-only state accumulated during the Plan A/B merge work: 3 stashes, a local `security-remediation-plan-a` branch with 1 unpushed commit, and two `feature/global-*` branches with no upstream tracking configured. None of this is at risk from Tasks 1-9 (stashes and local-only commits are never touched by branch deletion or PR closure — those only affect remote refs), but it's worth surfacing so it doesn't silently rot. This task is read-only/audit — it does NOT drop any stash. A diffstat comparison run during planning was inconclusive (very large diffs, likely due to divergent base commits rather than missing work) — do not infer "already absorbed" or "still needed" from line counts alone.

**Run this task AFTER Task 3 (PR #17 merged to main) — Step 3 below compares against `main` and assumes the merge has already happened. If run before Task 3, the comparison is meaningless (the local branch's commit won't be on `main` yet, since it isn't merged).

- [ ] **Step 1: List current stashes and local branch tracking state**

```bash
git stash list
git for-each-ref refs/heads --format='%(refname:short) -> %(upstream:short)'
```

- [ ] **Step 2: Set upstream tracking for the two feature branches missing it (safe, additive, does not change any commit)**

```bash
git branch --set-upstream-to=origin/feature/global-2-eu-vat-engine feature/global-2-eu-vat-engine
git branch --set-upstream-to=origin/feature/global-3-currency-locale-i18n feature/global-3-currency-locale-i18n
```

- [ ] **Step 3: Check the local-only `security-remediation-plan-a` branch's unpushed commit against PR #17's merged content**

```bash
git log main --not security-remediation-plan-a --oneline | head -5
git log security-remediation-plan-a --not main --oneline
```

If the second command prints nothing, the local branch's commit (`0d777389`) is already on `main` post-merge — the local branch can be deleted with `git branch -d security-remediation-plan-a` (safe — `-d`, not `-D`, refuses to delete if there's unmerged work). If it prints a commit, STOP and inspect before deleting anything.

- [ ] **Step 4: For all 3 stashes, do NOT run `git stash drop` in this pass. Instead, for each stash, check it out into a disposable worktree for a proper side-by-side review when you have time**

```bash
git worktree add /tmp/stash-review-0 main
cd /tmp/stash-review-0 && git stash apply stash@{0} && cd -

git worktree add /tmp/stash-review-1 main
cd /tmp/stash-review-1 && git stash apply stash@{1} && cd -

git worktree add /tmp/stash-review-2 main
cd /tmp/stash-review-2 && git stash apply stash@{2} && cd -
```

Review the applied changes manually in each worktree (diff against current `main`/relevant feature branch) before deciding to drop. Remove each worktree when done: `git worktree remove /tmp/stash-review-0 --force` (repeat for `-1` and `-2`) — this only removes the temporary worktree directory, not the stash itself.

- [ ] **Step 5: Report findings back before dropping any stash — this plan does not pre-authorize stash deletion**

---

### Task 4: Add `.gitattributes` for cross-platform line-ending safety

**Files:**
- Create: `.gitattributes`

**Context:** Work happens on Mac M1 (frontend) and Dell Windows (all 6 backend services) per CLAUDE.md. Without `.gitattributes`, CRLF/LF inconsistency across the split is a real risk (Windows tools may introduce CRLF into `.java`/`.yml`/`.sql` files, causing noisy diffs or build issues). This file does not change any existing tracked file content — it only sets normalization rules for future commits and `git diff` rendering.

- [ ] **Step 1: Start from a fresh, up-to-date main (Task 3 must be merged first — otherwise this branch inherits all 25 commits from chore/sync-local-main-and-log-cleanup), and create the PR branch immediately**

```bash
git checkout main
git pull origin main
git checkout -b chore/add-gitattributes
```

- [ ] **Step 2: Create `.gitattributes`**

```
* text=auto eol=lf

*.java text eol=lf
*.ts text eol=lf
*.tsx text eol=lf
*.js text eol=lf
*.jsx text eol=lf
*.json text eol=lf
*.yml text eol=lf
*.yaml text eol=lf
*.sql text eol=lf
*.md text eol=lf
*.sh text eol=lf
*.properties text eol=lf

*.png binary
*.jpg binary
*.jpeg binary
*.gif binary
*.ico binary
*.svg text eol=lf
*.jar binary
*.class binary
```

- [ ] **Step 3: Verify no unexpected mass-renormalization is staged**

```bash
git add .gitattributes
git status
```

Expected: only `.gitattributes` shows as a new file. (`git add .gitattributes` alone does not renormalize existing tracked files — that would require `git add --renormalize .` separately, which this plan intentionally does NOT run, to avoid a large diff touching every file's line endings in one commit.)

- [ ] **Step 4: Commit**

```bash
git commit -m "chore: add .gitattributes for cross-platform line-ending consistency"
```

- [ ] **Step 5: Push and open a PR (do not push directly to main) — branch was already created in Step 1, so just push it**

```bash
git push -u origin chore/add-gitattributes
gh pr create --title "chore: add .gitattributes for line-ending consistency" --body "Adds .gitattributes to normalize line endings to LF across the Mac/Dell dev split. Does not renormalize existing tracked files — only affects new commits going forward."
```

---

### Task 5: Add `CODEOWNERS`

**Files:**
- Create: `.github/CODEOWNERS`

**Context:** No `CODEOWNERS` file exists. Branch protection requires 1 approving review but `require_code_owner_reviews` is currently `false` — meaning any collaborator's approval satisfies the rule, not necessarily someone with domain knowledge. Adding `CODEOWNERS` alone does not enforce anything until `require_code_owner_reviews` is also enabled (done in Task 8).

- [ ] **Step 1: Create `.github/CODEOWNERS`**

```
# Default owner for everything not matched below
*                           @SVamseekar

# Backend services
core-service/               @SVamseekar
commerce-service/           @SVamseekar
payment-service/            @SVamseekar
logistics-service/          @SVamseekar
intelligence-service/       @SVamseekar
api-gateway/                @SVamseekar
shared-models/              @SVamseekar

# Frontend
frontend/                   @SVamseekar

# CI/CD and infra
.github/workflows/          @SVamseekar
docker-compose.yml          @SVamseekar
```

- [ ] **Step 2: Commit on the same branch as Task 4 (or a new short-lived branch if Task 4's PR already merged)**

```bash
git add .github/CODEOWNERS
git commit -m "chore: add CODEOWNERS for backend services and frontend"
git push
```

---

### Task 6: Harden pre-commit hook with secret-pattern scanning

**Files:**
- Modify: `.git/hooks/pre-commit`

**Context:** Current hook (618 bytes) only runs `./scripts/validate-api-contracts.sh`. It does not catch secrets before they're committed. `.git/hooks/` is not tracked by git (it's local-only per-clone), so this change does not propagate automatically to other machines (Mac/Dell) — note this limitation to the user rather than treating it as solved repo-wide. For a repo-wide enforced version, a tracked `scripts/pre-commit-hook.sh` + a one-time `git config core.hooksPath` setup documented in README would be needed; that is out of scope here unless requested.

- [ ] **Step 1: Read current hook content (already captured above) and back it up**

```bash
cp .git/hooks/pre-commit /tmp/pre-commit.bak
```

- [ ] **Step 2: Edit the hook to add a secret pattern check before the existing API contract check**

Replace the full file content with:

```bash
#!/bin/bash

# MaSoVa Pre-Commit Hook
# 1. Blocks obvious hardcoded secrets in staged changes
# 2. Validates API contracts before allowing commits

STAGED=$(git diff --cached --name-only --diff-filter=ACM)

if [ -n "$STAGED" ]; then
  SECRET_HITS=$(git diff --cached -U0 -- $STAGED | grep -inE "^\+.*(password|secret|api[_-]?key|private[_-]?key)\s*[:=]\s*['\"]?[A-Za-z0-9+/_-]{12,}" | grep -ivE "\\\$\{|changeme|your-secret|example|placeholder|REPLACE_ME|REDACTED")
  if [ -n "$SECRET_HITS" ]; then
    echo ""
    echo "❌ Pre-commit hook failed: possible hardcoded secret detected in staged changes"
    echo ""
    echo "$SECRET_HITS"
    echo ""
    echo "If this is a false positive, use an env var placeholder (e.g. \${VAR_NAME}) instead of a literal value."
    echo "To skip this check (NOT recommended): git commit --no-verify"
    echo ""
    exit 1
  fi
fi

# Run API contract validation
if [ -f "./scripts/validate-api-contracts.sh" ]; then
  ./scripts/validate-api-contracts.sh
  if [ $? -ne 0 ]; then
    echo ""
    echo "❌ Pre-commit hook failed: API contracts are out of sync"
    echo ""
    echo "To fix:"
    echo "  1. Run: npm run sync-api-types"
    echo "  2. Review and commit the generated types"
    echo "  3. Try committing again"
    echo ""
    echo "To skip this check (NOT recommended):"
    echo "  git commit --no-verify"
    echo ""
    exit 1
  fi
fi

exit 0
```

- [ ] **Step 3: Make executable and test with a deliberate fake secret**

```bash
chmod +x .git/hooks/pre-commit
echo 'TEST_API_KEY=abcd1234efgh5678' > /tmp/secret-test.env
cp /tmp/secret-test.env ./secret-test.env
git add secret-test.env
git commit -m "test: should be blocked"
```

Expected: commit is REJECTED with the "possible hardcoded secret detected" message.

- [ ] **Step 4: Clean up the test file**

```bash
git reset HEAD secret-test.env
rm secret-test.env
```

---

### Task 7: Remediate the known leaked Razorpay test key from tracked files

**Files:**
- Modify: `.env.example`
- Modify: `docs/plans/phase5-env-vars.md`
- Modify: `payment-service/src/main/resources/application.yml`

**Context:** `RAZORPAY_KEY_SECRET` value `Asbe0hf12kZn0VSX4ykn3Nvq` is a Razorpay **test-mode** key (per existing doc comment "test secret in default"), already invalidated in code — `payment-service/src/main/java/com/MaSoVa/payment/config/RazorpayConfig.java:22` hardcodes it as `DENYLISTED_LEAKED_KEY_SECRET` and presumably rejects it if supplied at runtime (verify in Step 1). It still appears as a plaintext fallback default in 3 currently-tracked files. This task removes the plaintext fallback from tracked files going forward — it does NOT purge git history (history rewriting is out of scope per Global Constraints, and unnecessary since the key is test-mode and already denylisted in code).

- [ ] **Step 1: Start from a fresh, up-to-date main and create the PR branch immediately, then confirm `RazorpayConfig.java` actually rejects the denylisted key (don't assume)**

```bash
git checkout main
git pull origin main
git checkout -b chore/remove-leaked-key-fallback-defaults
grep -n -A 10 "DENYLISTED_LEAKED_KEY_SECRET" payment-service/src/main/java/com/MaSoVa/payment/config/RazorpayConfig.java
```

Expected: surrounding code throws/fails fast if the configured secret equals `DENYLISTED_LEAKED_KEY_SECRET`. If it does NOT actually enforce rejection, STOP — this becomes a higher-priority bug fix task, not just a docs/env cleanup, and should be raised to the user before continuing.

- [ ] **Step 2: Replace the fallback default in `application.yml` with a fail-fast (no literal fallback)**

```bash
grep -n "RAZORPAY_KEY_SECRET" payment-service/src/main/resources/application.yml
```

Read the surrounding lines, then edit so the line reads:

```yaml
  key-secret: ${RAZORPAY_KEY_SECRET}
```

(removing the `:Asbe0hf12kZn0VSX4ykn3Nvq` fallback entirely — matches the pattern already used elsewhere per commit `8cb53ef7 fix(security): remove hardcoded Razorpay fallbacks, fail-fast on misconfig`).

- [ ] **Step 3: Replace the value in `.env.example` with a placeholder**

```bash
grep -n "RAZORPAY_KEY_SECRET" .env.example
```

Edit the line to:

```
RAZORPAY_KEY_SECRET=your-razorpay-test-key-secret-here
```

- [ ] **Step 4: Replace the value in `docs/plans/phase5-env-vars.md` (2 occurrences) with a placeholder**

```bash
grep -n "Asbe0hf12kZn0VSX4ykn3Nvq" docs/plans/phase5-env-vars.md
```

Replace both occurrences of `Asbe0hf12kZn0VSX4ykn3Nvq` with `your-razorpay-test-key-secret-here`.

- [ ] **Step 5: Verify no remaining plaintext occurrences in tracked working-tree files**

```bash
git grep -n "Asbe0hf12kZn0VSX4ykn3Nvq" -- . ':!docs/project/CODE_AUDIT/' ':!payment-service/src/main/java/com/MaSoVa/payment/config/RazorpayConfig.java'
```

Expected: no output. (The audit report doc and the denylist constant in `RazorpayConfig.java` are intentionally left — the audit report is a historical record, and the Java constant is the enforcement mechanism, not a leak.)

- [ ] **Step 6: Commit and open a PR (branch was already created in Step 1)**

```bash
git add .env.example docs/plans/phase5-env-vars.md payment-service/src/main/resources/application.yml
git commit -m "chore(security): remove leaked test key plaintext from env defaults and docs"
git push -u origin chore/remove-leaked-key-fallback-defaults
gh pr create --title "chore(security): remove leaked Razorpay test key from tracked defaults" --body "RAZORPAY_KEY_SECRET test key (already denylisted in RazorpayConfig.java) still appeared as a plaintext fallback in application.yml, .env.example, and phase5-env-vars.md. Replaces with fail-fast / placeholder. Does not touch git history since the key is test-mode and already rejected in code."
```

---

### Task 8: Tighten GitHub branch protection on `main`

**Files:** none (GitHub branch protection settings via API)

**Context:** Current protection: 1 required review, `dismiss_stale_reviews: true`, required status checks `Backend Tests`/`Frontend Tests` (strict), no force-push, no deletion, `enforce_admins: true`. Missing: `required_linear_history`, `required_conversation_resolution`, `require_code_owner_reviews` (now meaningful after Task 5's CODEOWNERS).

**Important ordering note:** This task must run AFTER Task 3 (PR #17 merge), not before. `required_linear_history=true` only blocks *future* merge commits from being added to `main` — it does not retroactively object to history already on `main` (including the merge commits already there from Plan A/B, or the one Task 3 creates via `gh pr merge 17 --merge`). The practical consequence going forward: once this is enabled, GitHub will require future PRs to merge via squash or rebase (no more `--merge`/merge-commit option) — update your merge habit (and any `gh pr merge` scripts/aliases) accordingly after this task runs.

- [ ] **Step 1: Capture current protection settings as a rollback reference**

```bash
gh api repos/SVamseekar/masova-platform/branches/main/protection > /tmp/main-protection-before.json
cat /tmp/main-protection-before.json
```

- [ ] **Step 2: Apply the additive changes (linear history, conversation resolution, code owner reviews)**

```bash
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

- [ ] **Step 3: Verify the new settings took effect**

```bash
gh api repos/SVamseekar/masova-platform/branches/main/protection --jq '{linear: .required_linear_history.enabled, convo: .required_conversation_resolution.enabled, codeowners: .required_pull_request_reviews.require_code_owner_reviews}'
```

Expected: `{"linear": true, "convo": true, "codeowners": true}`

- [ ] **Step 4: If anything breaks PR #17 or future merges unexpectedly, roll back using the saved file**

```bash
# Only if needed:
gh api -X PUT repos/SVamseekar/masova-platform/branches/main/protection --input /tmp/main-protection-before.json
```

---

### Task 9: Document the branch/PR cleanup decisions for future reference

**Files:**
- Create: `docs/superpowers/plans/2026-06-29-git-hygiene-cleanup-summary.md`

**Context:** Captures what was deleted/closed and why, so a future session (or teammate) doesn't wonder where `feature/global-1-allergen` went.

- [ ] **Step 1: Write the summary**

```markdown
# Git Hygiene Cleanup — Summary (2026-06-29)

## Safety net
- All deleted/closed branches were tagged first (`backup/<branch-name>`, see Task 0) — recoverable via `git checkout -b <name> backup/<branch-name>` indefinitely.

## Branches deleted (all had 0 commits ahead of main — fully merged, pointer-only deletion)
- chore/fix-ci-workflows, chore/rename-to-masova-platform, chore/repo-cleanup, docs/readme-and-templates, feat/backend-test-infrastructure, fix/api-gateway-test-deps, feat/in-progress-changes — already gone from remote before this cleanup ran (removed by an earlier `git fetch --prune`, not by this plan)
- feature/global-1-allergen
- feature/global-5-fiscal-signing
- feature/global-6-aggregator-hub
- feature/phase0-production-blockers
- feat/demo-germany-seed (found during user review, was missing from original audit list)

## PRs closed (commits fully absorbed into PR #17 via prior merge commits e672eea1, 115958f3)
- #15 security-remediation-plan-a (branch deleted)
- #16 security-remediation-plan-b (branch deleted)

## PR #17 CI gate (Task 2.5)
- Blocked on CI red (Frontend Tests, Validate OpenAPI Specs, Backend Pact Provider Verification) + missing review at plan time. Required a separate debugging pass before Task 3 could proceed — see that session's notes for what was actually wrong/fixed.

## Branches intentionally kept (have unmerged work)
- feature/global-2-eu-vat-engine (11 ahead of main)
- feature/global-3-currency-locale-i18n (12 ahead of main)
- feature/global-4-stripe-payments (10 ahead of main)

## Local-only state (Task 3.5 — audited, not destroyed)
- 3 stashes left untouched pending manual review (see Task 3.5 Step 4 for the worktree-review process)
- Local security-remediation-plan-a branch: deleted only if its unpushed commit was confirmed already on main post-merge
- Upstream tracking added for feature/global-2 and feature/global-3 local branches

## New safeguards added
- .gitattributes — LF line-ending normalization for Mac/Dell cross-platform work
- .github/CODEOWNERS — @SVamseekar as owner across all service directories
- Pre-commit hook hardened with a secret-pattern check (local-only, not repo-tracked — see Task 6 limitation)
- Branch protection on main: added required_linear_history, required_conversation_resolution, require_code_owner_reviews

## Known leaked test credential
- RAZORPAY_KEY_SECRET test value `Asbe0hf12kZn0VSX4ykn3Nvq` was already denylisted in RazorpayConfig.java before this cleanup. Plaintext fallback defaults removed from application.yml, .env.example, docs/plans/phase5-env-vars.md. Git history was NOT rewritten (key is test-mode, already rejected in code, rewriting history risks breaking other branches/forks).
```

- [ ] **Step 2: Commit**

```bash
git add docs/superpowers/plans/2026-06-29-git-hygiene-cleanup-summary.md
git commit -m "docs: summarize git hygiene cleanup decisions"
git push
```

---

## Completion Record (2026-06-29)

| Task | Status |
|---|---|
| 0 — Tag backups | ✅ |
| 1 — Delete stale branches | ✅ |
| 2 — Close PRs #15/#16 | ✅ |
| 2.5 — PR #17 CI green | ✅ |
| 3 — Merge PR #17 | ✅ `e9a2c992` |
| 3.5 — Stash audit | ⏳ Manual |
| 4 — `.gitattributes` | ✅ `chore/git-hygiene-safeguards` PR |
| 5 — `CODEOWNERS` | ✅ same PR |
| 6 — Pre-commit hook | ✅ `scripts/git-hooks/pre-commit` + install scripts |
| 7 — Razorpay doc cleanup | ✅ `phase5-env-vars.md` (yml + .env.example done in PR #17) |
| 8 — Branch protection | ✅ 2026-06-29 (linear history, CODEOWNERS reviews, conversation resolution) |
| 9 — Summary doc | ✅ `2026-06-29-git-hygiene-cleanup-summary.md` |

**Next after safeguards PR merges:** Run Task 8 `gh api` commands (in summary), install hooks on Mac + Dell, optional Task 3.5 stash review.
