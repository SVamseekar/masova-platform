# MaSoVa Documentation

Central index for product and developer documentation.

---

## Start Here

| Document | Description |
|---|---|
| [README.md](README.md) | Product overview, architecture summary, quick start |
| [DEMO.md](DEMO.md) | Demo walkthrough for restaurant owners and buyers |
| [docs/STARTUP-GUIDE.md](docs/STARTUP-GUIDE.md) | Full local development setup |
| [CONTRIBUTING.md](CONTRIBUTING.md) | Branching, commits, PR checklist |

---

## Architecture & Reference

| Document | Description |
|---|---|
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | Service map, request flows, data model, compliance |
| [docs/MASOVA_MASTER_REFERENCE.md](docs/MASOVA_MASTER_REFERENCE.md) | Complete platform reference (business + technical) |
| [CHANGELOG.md](CHANGELOG.md) | Release history |

---

## API & Contracts

| Document | Description |
|---|---|
| [docs/api-contracts/API_CONTRACT_SOLUTION.md](docs/api-contracts/API_CONTRACT_SOLUTION.md) | Contract validation workflow |
| [docs/api-contracts/API_VERSIONING_STRATEGY.md](docs/api-contracts/API_VERSIONING_STRATEGY.md) | Breaking change policy |
| [docs/swagger/SWAGGER_GUIDE.md](docs/swagger/SWAGGER_GUIDE.md) | Swagger UI debugging guide |

**Swagger UI:** http://localhost:8080/swagger-ui.html (gateway — switch between services)

---

## Operations

| Document | Description |
|---|---|
| [docs/project/DEPLOYMENT/START-HERE.md](docs/project/DEPLOYMENT/START-HERE.md) | Production deployment |
| [docs/project/CODE_AUDIT/PRODUCTION_READINESS_AUDIT.md](docs/project/CODE_AUDIT/PRODUCTION_READINESS_AUDIT.md) | Security and compliance audit |
| [docs/project/TESTING/unit_testing_integration_plan.md](docs/project/TESTING/unit_testing_integration_plan.md) | Testing strategy |

---

## Developer Commands

```bash
# Sync TypeScript types from backend OpenAPI specs
npm run sync-api-types

# Validate API types are current
npm run validate-api-types

# Run Pact contract tests
cd frontend && npm run test:pact

# Seed development database
node scripts/seed-database.js
```

---

## Related Repositories

These are separate projects that integrate with this monorepo:

| Repo | Purpose |
|---|---|
| **masova-mobile** | Customer mobile app (React Native 0.81) |
| **MaSoVaCrewApp** | Staff mobile app (React Native 0.83) |
| **masova-support** | AI agents service (Python, FastAPI, Google ADK) |