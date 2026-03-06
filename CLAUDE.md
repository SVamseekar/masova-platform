# MaSoVa Restaurant Management System

## Environment
- **Mac M1**: Claude Code, frontend (:3000), mobile apps
- **Dell i3 Windows**: all 6 backend services + Docker (IP: `192.168.50.88`)
- **Backend ports**: api-gateway:8080, core:8085, commerce:8084, payment:8089, logistics:8086, intel:8087
- **Staff/Crew App**: `/Users/souravamseekarmarti/Projects/MaSoVaCrewApp/` (RN 0.83)
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

## Expert Behavior by Domain
Apply automatically based on which files/phase are being worked on. Never announce it — just do it.

**When touching any Spring Boot service (core/commerce/logistics/payment/intel):**
- Controllers only handle HTTP — no business logic, no repository calls directly
- Every new endpoint needs: `@PreAuthorize` or explicit public annotation, input validation, and error response body
- New service methods that call other services use the existing Feign clients — never raw `RestTemplate`
- Any try/catch that swallows an exception MUST log `log.warn(...)` with order/user context
- Before removing any endpoint, use Serena/Greptile to find all callers first
- OrderService state transitions must publish to `masova.orders.exchange` via `OrderEventPublisher`

**When touching frontend (frontend/src):**
- Customer pages: dark-premium CSS vars (`--dp-*`) only — never hardcode `#` colors or `px` spacing
- Staff pages: neumorphic tokens from `design-tokens.ts` only — never mix with dark-premium vars
- Every RTK Query endpoint uses canonical paths (175 endpoints — no `/api/v1/` prefixes)
- `deliveryFeeINR` always from `useSelector(selectDeliveryFeeINR)` — never hardcoded
- Every new component needs: loading state, error state, empty state — all three
- TypeScript strict — no `any`, no `// @ts-ignore`

**When touching database (migrations, entities, repositories):**
- Every new MongoDB query field needs a corresponding `@Indexed` annotation
- Every new PostgreSQL table needs: `created_at`, `updated_at`, `mongo_id` (migration tracking), and at least one covering index
- Financial data (orders, payments, transactions): soft delete only — add `deleted_at`, never `DELETE`
- Flyway migrations are append-only — never edit an existing `V*.sql` file
- Dual-write pattern: PostgreSQL write first (synchronous), MongoDB second (async try/catch with warn log)

**When touching MaSoVaCrewApp or masova-mobile:**
- `RoleRouter` in MaSoVaCrewApp reads `user.type` from JWT — never hardcode role checks inline in screens
- Role colors: Driver=`#00B14F`, Kitchen=`#FF6B35`, Cashier=`#2196F3`, Manager=`#7B1FA2` — never change these
- masova-mobile is NOT Expo Go — bare RN 0.81, Metro on :8888
- Every screen that calls an API must handle: loading spinner, network error, empty data
- Navigation params must be typed — no untyped `route.params`

**When touching masova-support (Python agents):**
- Agents NEVER auto-write to the database — they propose actions, manager approves
- Every agent has a `POST /agents/{name}/trigger` endpoint for manual testing
- Tool functions must be `async def` and return `dict` — ADK requires this signature
- APScheduler jobs share the FastAPI event loop — never create a new `asyncio.run()` inside a job
- If Gemini/LLM call fails, fall back to rule-based response — never surface raw API errors to user
- Every agent action logged with: agent name, trigger type (scheduled/manual), store_id, output summary

**When planning cross-service changes (any phase):**
- commerce-service never imports from logistics-service or vice versa — use RabbitMQ events
- api-gateway is routing only — no business logic, no DB calls
- shared-models is the single source of truth for enums (OrderStatus, etc.) — inner enums in entities must match
- New features that touch >2 services need an event-driven design — not synchronous chained calls

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
