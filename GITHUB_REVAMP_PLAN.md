# MaSoVa GitHub Repository Revamp Plan
**Date:** 2026-02-27
**Strategy:** GitHub Flow (main + feature branches)
**Machines:** Mac M1 (frontend/mobile) + Dell i3 (backend services)

---

## Table of Contents
1. [Current State Problems](#1-current-state-problems)
2. [Phase 1 — Repo Cleanup & Archiving](#2-phase-1--repo-cleanup--archiving)
3. [Phase 2 — Target Folder Structure](#3-phase-2--target-folder-structure)
4. [Phase 3 — Branching Strategy (GitHub Flow)](#4-phase-3--branching-strategy-github-flow)
5. [Phase 4 — Branch Protection Rules](#5-phase-4--branch-protection-rules)
6. [Phase 5 — Documentation](#6-phase-5--documentation)
7. [Phase 6 — PR & Issue Templates](#7-phase-6--pr--issue-templates)
8. [Phase 7 — CI/CD Workflows (after cleanup)](#8-phase-7--cicd-workflows-after-cleanup)
9. [Phase 8 — Secret Handling](#9-phase-8--secret-handling)
10. [Mac + Dell Workflow Cheatsheet](#10-mac--dell-workflow-cheatsheet)

---

## 1. Current State Problems

| Problem | Impact |
|---|---|
| 106 commits never pushed to GitHub | Dell can't clone up-to-date code |
| `main` is the only branch | Mac and Dell changes collide |
| Old service folders at root (`user-service`, `menu-service`, etc.) | Confusing — these are inactive since consolidation |
| `node_modules/` at repo root | Should never be committed |
| `docs_backup_2025/`, `imp_docs/`, `fresh-errors.txt`, `store_level_filtering.txt` | Noise |
| `backups/` folder with pre-consolidation code | Noise but should be archived not deleted |
| CI workflows reference old service names | Builds will fail |
| Sendinblue API key in git history | Blocked push to GitHub (handle later) |
| No PR template, no CONTRIBUTING.md | Unprofessional for a portfolio/product repo |

---

## 2. Phase 1 — Repo Cleanup & Archiving

### Step 1: Create archive/ folder and move old content

**Move (not delete) these folders into `archive/`:**
```
archive/
├── old-services/
│   ├── user-service/
│   ├── menu-service/
│   ├── order-service/
│   ├── delivery-service/
│   ├── customer-service/
│   ├── review-service/
│   ├── inventory-service/
│   ├── notification-service/
│   └── analytics-service/
├── docs-backup/            ← from docs_backup_2025/
├── imp-docs/               ← from imp_docs/
└── misc/
    ├── fresh-errors.txt
    ├── store_level_filtering.txt
    ├── build-monolith.sh.bak
    └── rollback-masova.sh   (keep at root or archive — your call)
```

**Add `archive/` to `.gitignore`** — no point tracking historical debris:
```gitignore
archive/
```

### Step 2: Clean root-level node_modules
```bash
rm -rf node_modules/    # root-level only — this is not a Node project at root
```
Add to `.gitignore`:
```gitignore
/node_modules/
```

### Step 3: Clean stray files at root
Move to `archive/misc/` or delete:
- `fresh-errors.txt`
- `store_level_filtering.txt`
- `build-monolith.sh.bak`
- `MaSoVa.pdf` (large binary — gitignore or move to Google Drive)
- `dribbble-ref.png`, `homepage-hero.png`, `original-*.webp` (gitignore images at root)

### Step 4: Consolidate scripts/
The `scripts/` folder has 80+ files. Organise into subfolders:
```
scripts/
├── db/           ← all check-*.js, cleanup-*.js, create-*.js, seed-*.js
├── dev/          ← start/stop helpers, check-auth.sh, etc.
├── ci/           ← validate-api-contracts.sh, sync-api-contracts.sh
└── deploy/       ← any deploy helpers
```

### Step 5: Fix .gitignore additions
```gitignore
# Root node_modules (not a Node project at root)
/node_modules/

# Archive folder
archive/

# Large binary/media at root
*.pdf
/dribbble-ref.png
/homepage-hero.png
/original-*.webp

# Stray text files
fresh-errors.txt
store_level_filtering.txt
*.bak

# Build artifacts
**/target/
frontend/dist/
frontend/node_modules/
frontend/tsconfig.tsbuildinfo
frontend/playwright-report/
frontend/test-results/

# Environment
.env
.env.local
.masova-config
.masova-config.bak

# OS / IDE
.DS_Store
.VSCodeCounter/
.playwright-mcp/
.claude-context.md
```

---

## 3. Phase 2 — Target Folder Structure

```
MaSoVa-restaurant-management-system/
│
├── .github/
│   ├── workflows/
│   │   ├── ci.yml                    ← runs on every PR
│   │   ├── deploy-staging.yml        ← deploys on merge to main (GCP)
│   │   ├── deploy-production.yml     ← deploys on tag v*.*.*
│   │   └── api-contract-validation.yml
│   ├── ISSUE_TEMPLATE/
│   │   ├── bug_report.md
│   │   └── feature_request.md
│   └── pull_request_template.md
│
├── api-gateway/                      ← :8080
├── core-service/                     ← :8085
├── commerce-service/                 ← :8084
├── payment-service/                  ← :8089
├── logistics-service/                ← :8086
├── intelligence-service/             ← :8087
├── shared-models/
├── shared-security/
│
├── frontend/                         ← React 19 + Vite
├── infrastructure/                   ← Docker, K8s, Terraform configs
│
├── scripts/
│   ├── db/
│   ├── dev/
│   ├── ci/
│   └── deploy/
│
├── docs/
│   ├── plans/                        ← implementation plans (existing)
│   ├── api-contracts/                ← existing
│   ├── api-analysis/                 ← existing
│   ├── project/                      ← existing
│   ├── STARTUP-GUIDE.md              ← how to run locally
│   └── ARCHITECTURE.md              ← system architecture overview
│
├── archive/                          ← old services, not tracked by git
│
├── .env.example                      ← template (NO real secrets)
├── docker-compose.yml
├── docker-compose.test-light.yml
├── pom.xml                           ← parent POM
├── README.md                         ← project overview
├── CONTRIBUTING.md
└── CHANGELOG.md
```

---

## 4. Phase 3 — Branching Strategy (GitHub Flow)

### Branch naming conventions

| Branch | Purpose | Created by |
|---|---|---|
| `main` | Always deployable. Protected. | — |
| `feat/<name>` | New features | Mac or Dell |
| `fix/<name>` | Bug fixes | Mac or Dell |
| `chore/<name>` | Cleanup, deps, config | Mac or Dell |
| `docs/<name>` | Documentation only | Mac or Dell |
| `release/v<x.y.z>` | Release prep (version bump, changelog) | Mac |

### Day-to-day flow

```
1. Pull latest main
   git checkout main && git pull

2. Create feature branch
   git checkout -b feat/store-selection

3. Work (commit often)
   git commit -m "feat: add store radius validation"

4. Push branch
   git push -u origin feat/store-selection

5. Open PR on GitHub → main
   - CI runs automatically
   - Review your own diff

6. Merge PR (squash merge recommended for clean history)

7. Delete feature branch
   git branch -d feat/store-selection
```

### Mac vs Dell ownership convention

| Machine | Typical branch prefix | Focus area |
|---|---|---|
| Mac M1 | `feat/frontend-*`, `feat/mobile-*` | React frontend, Android app |
| Dell i3 | `feat/backend-*`, `fix/api-*` | Spring Boot services |
| Either | `fix/*`, `chore/*`, `docs/*` | Anything small |

### Conflict avoidance rule

> **Never both machines commit to the same branch simultaneously.**
> If you switch machines mid-feature: `git push` on machine A first, `git pull` on machine B before touching anything.

---

## 5. Phase 4 — Branch Protection Rules

Set these on GitHub → Settings → Branches → Add rule for `main`:

| Rule | Setting |
|---|---|
| Require PR before merging | ✅ ON |
| Required approvals | 0 (solo — you approve your own PRs) |
| Require status checks to pass | ✅ ON — require `ci / backend` and `ci / frontend` |
| Require branches to be up to date | ✅ ON |
| Do not allow force pushes | ✅ ON |
| Do not allow deletions | ✅ ON |

> **Why PR even solo?** Forces you to review your own diff before merging. Catches regressions. Keeps `main` always in a known good state that can be deployed from either machine.

---

## 6. Phase 5 — Documentation

### README.md (root)
Structure:
```markdown
# MaSoVa Restaurant OS

> Brief 2-line description of what MaSoVa is

## What's Inside
- Architecture diagram or ASCII overview of 6 services
- Links to sub-docs

## Quick Start
- Prerequisites (Java 21, Node 20, MongoDB, Redis, RabbitMQ)
- Clone → env setup → run command

## Services
| Service | Port | Responsibility |
|---|---|---|
| api-gateway | 8080 | ... |
...

## Tech Stack
## Deployment
## Contributing
## License
```

### CONTRIBUTING.md
```markdown
# Contributing to MaSoVa

## Branch Strategy
- Branch off main: `feat/`, `fix/`, `chore/`, `docs/`
- Open a PR → main
- CI must pass before merge

## Commit Message Format
<type>: <short description>

Types: feat, fix, chore, docs, test, refactor

## Local Setup
Link to docs/STARTUP-GUIDE.md

## Code Style
- Java: Google Java Style
- TypeScript: ESLint config in frontend/
```

### CHANGELOG.md
Start tracking releases with date + summary. Example:
```markdown
# Changelog

## [Unreleased]
- Store selection with delivery radius
- Multi-machine dev workflow

## [2.0.0] - 2026-02-20
- Consolidated 12 microservices into 6
- Phase 2: Redis JWT blacklist, delivery radius validation
- CI/CD: GCP Cloud Run + Firebase deployment
```

### docs/ARCHITECTURE.md
- ASCII diagram of 6 services + their ports
- Data flow for key journeys (order placement, delivery tracking)
- Link to individual service READMEs

---

## 7. Phase 6 — PR & Issue Templates

### `.github/pull_request_template.md`
```markdown
## What does this PR do?
<!-- 1-3 sentences -->

## Type of change
- [ ] feat — new feature
- [ ] fix — bug fix
- [ ] chore — maintenance
- [ ] docs — documentation

## Tested on
- [ ] Mac M1 (local)
- [ ] Dell i3 (local)
- [ ] Docker Compose

## Checklist
- [ ] CI passes
- [ ] No .env secrets committed
- [ ] Branch is up to date with main
```

### `.github/ISSUE_TEMPLATE/bug_report.md`
```markdown
---
name: Bug Report
about: Something is broken
---

**What happened?**

**Steps to reproduce:**
1.

**Expected behaviour:**

**Service / component affected:**
- [ ] api-gateway
- [ ] core-service
- [ ] commerce-service
- [ ] payment-service
- [ ] logistics-service
- [ ] intelligence-service
- [ ] frontend
- [ ] mobile

**Environment:**
- [ ] Local Mac
- [ ] Local Dell
- [ ] GCP staging
```

### `.github/ISSUE_TEMPLATE/feature_request.md`
```markdown
---
name: Feature Request
about: New functionality
---

**What do you want to build?**

**Which service / area does this touch?**

**Acceptance criteria:**
- [ ]
- [ ]

**Related plans / docs:**
```

---

## 8. Phase 7 — CI/CD Workflows (after cleanup)

> **Do this AFTER Phase 1 cleanup. The current workflows reference old service names and will fail.**

### ci.yml — rewrite for 6 services
Trigger: every PR to main + every push to a `feat/*` or `fix/*` branch.

Jobs:
1. **backend** — `mvn clean test` for all 6 services (MongoDB + Redis + RabbitMQ service containers)
2. **frontend** — `npm ci && npm run type-check && npm run test`
3. **api-contracts** — validate frontend API calls match backend endpoints

### deploy-staging.yml
Trigger: merge to main.
- Deploy all 6 services to GCP Cloud Run (staging project)
- Deploy frontend to Firebase Hosting (staging channel)
- Run smoke tests against staging URLs

### deploy-production.yml
Trigger: push of tag `v*.*.*`.
- Same as staging but production GCP project
- Post to GitHub Releases with changelog

### Secrets needed in GitHub repo settings:
```
GCP_SA_KEY              ← GCP service account JSON
FIREBASE_TOKEN          ← Firebase CI token
MONGODB_URI_STAGING     ← Atlas staging URI
MONGODB_URI_PROD        ← Atlas prod URI
JWT_SECRET              ← HS512 key
RABBITMQ_USERNAME
RABBITMQ_PASSWORD
```

---

## 9. Phase 8 — Secret Handling

### Immediate (unblock the push):
The Sendinblue key is in:
- `.env.example:92`
- `notification-service/src/main/resources/application.yml:36`

**Steps:**
1. Revoke the key in Sendinblue dashboard (makes the exposed key useless)
2. Replace with placeholder: `BREVO_API_KEY=your-brevo-api-key-here`
3. Commit the replacement
4. Go to GitHub → Security → Secret scanning → "Allow secret" to unblock the push
5. Long term: rewrite history with `git filter-repo` to fully remove it

### Going forward:
- **Never put real values in `.env.example`** — only `KEY=description-of-what-goes-here`
- Add `application-local.yml` to `.gitignore` for any local overrides in Spring Boot
- Store all secrets in GitHub Actions secrets for CI, GCP Secret Manager for production

---

## 10. Mac + Dell Workflow Cheatsheet

### Starting work (any machine)
```bash
git checkout main
git pull origin main
git checkout -b feat/your-feature-name
```

### Switching machines mid-feature
```bash
# On current machine — save your work
git add -p
git commit -m "wip: mid-feature checkpoint"
git push

# On other machine
git fetch
git checkout feat/your-feature-name
git pull
```

### Finishing a feature
```bash
git push origin feat/your-feature-name
# Open PR on GitHub → main
# Wait for CI to pass
# Merge (squash)
# Delete branch
git checkout main && git pull
git branch -d feat/your-feature-name
```

### When both machines have diverged (resolve conflicts)
```bash
# On machine B (behind)
git stash
git pull origin feat/your-feature-name
git stash pop
# Fix any conflicts
git add .
git commit -m "fix: merge conflict resolution"
git push
```

---

## Execution Order

| Phase | Task | Effort |
|---|---|---|
| 1 | Create `archive/` and move old services/docs | 15 min |
| 2 | Clean root `node_modules/`, stray files | 5 min |
| 3 | Update `.gitignore` | 5 min |
| 4 | Reorganise `scripts/` into subfolders | 15 min |
| 5 | Fix Sendinblue secret → unblock push | 10 min |
| 6 | Push all 106 commits to GitHub | 2 min |
| 7 | Create `develop` branch on GitHub | 2 min |
| 8 | Set branch protection rules on `main` | 5 min |
| 9 | Write README, CONTRIBUTING, CHANGELOG | 30 min |
| 10 | Add PR + issue templates | 10 min |
| 11 | Rewrite ci.yml for 6 consolidated services | 20 min |
| 12 | Set GitHub Actions secrets | 10 min |

**Total: ~2 hours of focused work**

---

*Plan written by Claude Code on 2026-02-27*
