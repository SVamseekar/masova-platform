# Contributing to MaSoVa

## Branch Strategy (GitHub Flow)

All work happens on feature branches. `main` is always deployable.

```
main
├── feat/store-selection      ← new features
├── fix/auth-token-expiry     ← bug fixes
├── chore/update-deps         ← maintenance
└── docs/architecture-guide   ← documentation only
```

### Branch naming

| Prefix | When to use |
|---|---|
| `feat/` | New functionality |
| `fix/` | Bug fixes |
| `chore/` | Dependencies, config, cleanup |
| `docs/` | Documentation only |
| `release/` | Version bump + changelog prep |

### Day-to-day flow

```bash
# 1. Always start from latest main
git checkout main && git pull origin main

# 2. Create your branch
git checkout -b feat/your-feature-name

# 3. Commit as you go
git commit -m "feat: add store radius validation"

# 4. Push and open a PR
git push -u origin feat/your-feature-name
# Open PR on GitHub → base: main

# 5. After merge, clean up
git checkout main && git pull
git branch -d feat/your-feature-name
```

### Switching between Mac and Dell mid-feature

```bash
# On machine A — save before switching
git add -p && git commit -m "wip: checkpoint" && git push

# On machine B — pick up where you left off
git fetch && git checkout feat/your-feature-name && git pull
```

---

## Commit Message Format

```
<type>: <short description>
```

**Types:** `feat`, `fix`, `chore`, `docs`, `test`, `refactor`

**Examples:**
```
feat: add delivery radius check on order placement
fix: resolve JWT blacklist race condition on logout
chore: update Spring Boot to 3.4.2
docs: add architecture diagram to README
test: add vitest coverage for authSlice
refactor: extract store validation into StoreService
```

- Keep the first line under 72 characters
- Use present tense ("add" not "added")
- No period at the end

---

## Local Setup

See [docs/STARTUP-GUIDE.md](docs/STARTUP-GUIDE.md) for full setup instructions.

**Quick check — services running:**
```bash
curl http://localhost:8080/actuator/health   # api-gateway
curl http://localhost:8085/actuator/health   # core-service
curl http://localhost:8084/actuator/health   # commerce-service
curl http://localhost:8089/actuator/health   # payment-service
curl http://localhost:8086/actuator/health   # logistics-service
curl http://localhost:8087/actuator/health   # intelligence-service
curl http://localhost:8000/health            # AI agent (masova-support)
```

**Infrastructure ports:**
- MongoDB: `27017`, Redis: `6379` (DB 0 = JWT blacklist, DB 1 = agent sessions), RabbitMQ: `5672`
- Backend is on Dell (`192.168.50.88`). Mobile apps must point to this IP, not `localhost`.

**Mobile apps:**
```bash
# masova-mobile — Metro on :8888
cd /Users/souravamseekarmarti/Projects/masova-mobile
npx react-native start --port 8888

# MaSoVaCrewApp
cd /Users/souravamseekarmarti/Projects/MaSoVaCrewApp
npx react-native start
```

**AI agent:**
```bash
cd /Users/souravamseekarmarti/Projects/masova-support
uvicorn src.masova_agent.main:app --host 0.0.0.0 --port 8000 --reload
```

---

## Code Style

**Java (Spring Boot):**
- Follow existing package structure per service
- DTOs in `dto/`, controllers in `controller/`, services in `service/`, repositories in `repository/`
- Use `@Valid` on request bodies
- Never hardcode secrets — use `application.yml` with env var references
- Controllers handle HTTP only — no business logic, no direct repository calls
- Every new endpoint needs `@PreAuthorize` or an explicit public annotation
- Cross-service calls use Feign clients only — never raw `RestTemplate`
- Any `try/catch` that swallows an exception must log `log.warn(...)` with order/user context
- JWT tokens use **HS512** (HMAC SHA-512) — minimum 64-char secret. Claims: `sub` (userId), `email`, `roles`, `storeId`, `exp`, `iat`
- New MongoDB query fields need `@Indexed`; new PostgreSQL tables need `created_at`, `updated_at`, `mongo_id` and a covering index
- Financial data (orders, payments, transactions): **soft delete only** — `deleted_at` field, never `DELETE`
- Flyway migrations are **append-only** — never edit an existing `V*.sql` file
- Dual-write order: PostgreSQL first (synchronous), MongoDB second (async try/catch with warn log)
- OrderService state transitions must publish to `masova.orders.exchange` via `OrderEventPublisher`
- `commerce-service` never imports from `logistics-service` and vice versa — use RabbitMQ events

**TypeScript (React):**
- ESLint config in `frontend/eslint.config.js`
- Components in `src/components/`, pages in `src/pages/`
- API calls via RTK Query — 20 API slices, all using `baseQueryWithAuth` which injects `Authorization`, `X-User-Id`, `X-User-Type`, `X-User-Store-Id` headers automatically
- Neumorphic UI components in `src/components/ui/neumorphic/`
- **Design system rules — strictly enforced:**
  - Customer pages (routes under `/customer*`, `HomePage`, `PublicMenuPage`, checkout, tracking): use `--dp-*` CSS variables ONLY. Never hardcode `#` colours or `px` spacing. The parent `CustomerLayout` applies `.dark-premium-theme`.
  - Staff/Manager pages: use neumorphic tokens from `src/styles/design-tokens.ts` ONLY. Never mix with dark-premium vars.
  - Key dark-premium vars: `--bg: #0A0908`, `--gold: #D4A843`, `--red: #C62A09`, `--text-1: #FDFCF8`
- TypeScript strict mode — `any` is banned, `// @ts-ignore` is banned
- Every component needs all three states: **loading**, **error**, **empty**
- `deliveryFeeINR` always from `useSelector(selectDeliveryFeeINR)` — never hardcoded (`selectDeliveryFeeINR` is the actual selector name in code; the "INR" is a legacy naming artefact — the value is currency-neutral at runtime, set by the store's zone config)
- For currency display, always use `formatMoney(amount, currency, locale)` from `src/utils/currency.ts` — never `formatINR()` which is India-specific
- EU VAT and fiscal signing are handled server-side — never compute or display tax client-side from hardcoded rates

---

## Machine Ownership Convention

| Machine | Focus area | Typical branch prefix |
|---|---|---|
| Mac M1 | Frontend, mobile, AI agent | `feat/frontend-*`, `feat/mobile-*` |
| Dell i3 | Backend services | `feat/backend-*`, `fix/api-*` |
| Either | Docs, chores, small fixes | `docs/*`, `chore/*`, `fix/*` |

> Never have both machines commit to the same branch simultaneously.
> Always push before switching machines.

---

## Hard Rules (Never Break These)

- **Never** hardcode `deliveryFeeINR` — always from Redux `selectDeliveryFeeINR`
- **Never** hardcode currency symbols or tax rates — currency comes from `store.currency` (ISO 4217), VAT is computed by `EuVatEngine` on the backend
- **Never** call `formatINR()` for displaying prices — use `formatMoney(amount, currency, locale)` so EU stores show € not ₹
- **Never** use Spring Cloud Sleuth — Spring Boot 3 uses `micrometer-tracing-bridge-brave`
- **Never** make `POST /api/customers/get-or-create` accessible via the gateway — internal only
- **Never** add "Co-Authored-By" trailer to git commits
- **Never** use `any` or `// @ts-ignore` in TypeScript
- **Never** delete financial records — soft delete with `deleted_at` only
- **Never** edit an existing Flyway `V*.sql` migration — append only
- **Never** call `commerce-service` from `logistics-service` directly or vice versa — use RabbitMQ
- `TestDataController` must stay behind `@Profile("dev")` — never delete it, never expose in production

---

## PowerShell Gotchas (Dell)

- No `grep` → use `Select-String -Path <file> -Pattern "<term>"`
- Always quote `-D` flags: `mvn spring-boot:run "-Dmaven.test.skip=true"`
- YAML: `rabbitmq:` must be under `spring:` — wrong indentation = silent guest/guest fallback

---

## Common Gotchas

- TypeScript IIFE `(() => {...})()` inside JSX → extract to a variable before `return (`
- VS Code Java LSP errors on `.classpath` → false positives; `mvn compile` is source of truth
- RabbitMQ connection refused → `docker compose ps` on Dell first
- Hibernate 6 (Spring Boot 3) JSONB: use `@JdbcTypeCode(SqlTypes.JSON)` not `@Type`

---

## PR Checklist

Before opening a PR:
- [ ] CI passes locally (`mvn test` / `npm run test`)
- [ ] No `.env` secrets committed
- [ ] Branch is up to date with `main`
- [ ] PR description explains what and why
- [ ] New endpoints have `@PreAuthorize` or explicit public annotation
- [ ] New MongoDB query fields have `@Indexed`
- [ ] Financial data uses soft delete — no raw `DELETE`
- [ ] No `any` or `@ts-ignore` in TypeScript
- [ ] New React components have loading, error, and empty states
- [ ] `deliveryFeeINR` comes from Redux `selectDeliveryFeeINR` — not hardcoded
- [ ] Currency displayed via `formatMoney(amount, currency, locale)` — not `formatINR()`
- [ ] No hardcoded tax rates — VAT computed server-side by `EuVatEngine`
