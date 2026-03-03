# MaSoVa Restaurant Management System

## Environment
- **Mac M1**: Claude Code, frontend (:3000), mobile apps
- **Dell i3 Windows**: all 6 backend services + Docker (IP: `192.168.50.88`)
- **Backend ports**: api-gateway:8080, core:8085, commerce:8084, payment:8089, logistics:8086, intel:8087
- **Staff/Driver App**: `/Users/souravamseekarmarti/Projects/MaSoVaDriverApp/` (RN 0.83)
- **Customer App**: `/Users/souravamseekarmarti/Projects/masova-mobile/` (RN 0.81 — NOT Expo Go, Metro :8888)
- **AI Agent**: `/Users/souravamseekarmarti/Projects/masova-support/` (Python, Google ADK 1.25, FastAPI :8000)

## Starting Services

**Dell (PowerShell):**
```powershell
docker compose up -d mongodb redis rabbitmq postgres
cd <service> && mvn spring-boot:run "-Dmaven.test.skip=true"
```

**Mac — Frontend:**
```bash
cd frontend && npm run dev  # :3000
```

**Mac — AI Agent:**
```bash
cd /Users/souravamseekarmarti/Projects/masova-support
uvicorn src.masova_agent.main:app --host 0.0.0.0 --port 8000 --reload
```

## Implementation Plans
When asked to "implement phase N" or "start phase N", invoke `superpowers:executing-plans` with:
- Phase 0 → `docs/plans/2026-03-03-phase0-implementation-plan.md`
- Phase 1 → `docs/plans/2026-03-03-phase1-api-reduction-plan.md`
- Phase 2 → `docs/plans/2026-03-03-phase2-database-migration-plan.md`
- Phase 3 → `docs/plans/2026-03-03-phase3-order-flow-plan.md`
- Phase 4 → `docs/plans/2026-03-03-phase4-frontend-revamp-plan.md`
- Phase 5 → `docs/plans/2026-03-03-phase5-staff-app-plan.md`
- Phase 6 → `docs/plans/2026-03-03-phase6-ai-agents-plan.md`
- Phase 7 → `docs/plans/2026-03-03-phase7-deployment-plan.md`
- Phase 8 → `docs/plans/2026-03-03-phase8-quality-plan.md`

Each plan has a `## Tools for This Phase` section — always read it before starting.

## Architecture
- **API**: 175 canonical endpoints (reduced from 471 in Phase 1)
- **DB**: MongoDB (flexible) + PostgreSQL (financial/relational) + Redis (ephemeral/JWT blacklist)
- **Auth**: JWT via api-gateway, Redis blacklist for logout (DB 0), agent sessions (DB 1)
- **Events**: RabbitMQ — `masova.orders.exchange`, `masova.notifications.exchange`
- **Design**: Neumorphic (staff web) · Dark-premium (customer web) · Glassmorphism (customer mobile)

## Hard Rules
- NEVER hardcode `deliveryFeeINR` — always from Redux `cartSlice`
- NEVER use Spring Cloud Sleuth — Spring Boot 3 uses `micrometer-tracing-bridge-brave`
- NEVER make `POST /api/customers/get-or-create` accessible via gateway — internal only
- NEVER add "Co-Authored-By" trailer to git commits
- NEVER use `ralph-loop` or `dispatching-parallel-agents` — Pro subscription, conserve quota
- TestDataController must stay behind `@Profile("dev")` — never delete it

## Branching & Commits
- GitHub Flow: feature branches → PR → merge to main
- Commit format: `feat(service):`, `fix(service):`, `chore:`, `docs:`
- Use worktrees for destructive phases (Phase 1 API removal, Phase 2 DB migration)

## PowerShell Gotchas (Dell)
- No `grep` → use `Select-String -Path <file> -Pattern "<term>"`
- Always quote `-D` flags: `mvn spring-boot:run "-Dmaven.test.skip=true"`
- YAML: `rabbitmq:` must be under `spring:` — wrong indentation = silent guest/guest fallback

## Code Gotchas
- TypeScript IIFE `(() => {...})()` inside JSX → extract to variable before `return (`
- VS Code Java LSP errors on `.classpath` → false positives; `mvn compile` is source of truth
- RabbitMQ connection refused → check `docker compose ps` on Dell first
- Hibernate 6 (Spring Boot 3) JSONB: use `@JdbcTypeCode(SqlTypes.JSON)` not `@Type`

## API Path Corrections (canonical — use everywhere)
- Sessions: `POST /api/sessions` (start), `POST /api/sessions/end` (end)
- Equipment: `/api/equipment` (NOT `/api/kitchen-equipment`)
- Reviews public: `GET /api/reviews/public/token/{token}` (NOT `/api/ratings/token/{token}`)
- Orders: `POST /api/orders/{id}/status` for state transitions (separate from `PATCH /{id}`)
