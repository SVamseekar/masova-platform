# MaSoVa Documentation Hub

Complete documentation for the MaSoVa Restaurant Management System.

**📋 NEW: Complete Navigation** → [DOCUMENTATION_INDEX.md](DOCUMENTATION_INDEX.md) ⭐

**🎓 MongoDB Workshop Tomorrow?** → [workshop/MONGODB_WORKSHOP_PREP.md](workshop/MONGODB_WORKSHOP_PREP.md)

---

## 📂 Documentation Structure (Reorganized!)

```
docs/
├── MASTER_INDEX.md                    ← ⭐ COMPLETE DOCUMENTATION INDEX
├── README.md                          ← You are here
├── DOCUMENTATION_GUIDE.md             ← ⭐ NEW: Complete docs guide (Smart-doc + OpenAPI + TypeDoc)
├── MONGODB_SCHEMAS.md                 ← ⭐ NEW: Database schemas & relationships
│
├── api-contracts/                     ← API Contract Management
│   ├── API_CONTRACT_SOLUTION.md       ← Complete enterprise solution
│   ├── API_VERSIONING_STRATEGY.md     ← How to version APIs
│   └── API_MISMATCH_REPORT.json       ← Current API analysis
│
├── swagger/                           ← Swagger/OpenAPI Documentation
│   ├── SWAGGER_GUIDE.md               ← How to debug with Swagger
│   ├── SWAGGER_SETUP_COMPLETE.md      ← Setup details
│   └── SWAGGER_FINAL_SUMMARY.md       ← Quick reference
│
../target/smart-doc/                   ← ⭐ NEW: Smart-doc generated API docs
├── index.html                         ← Interactive API documentation
├── README.md                          ← Markdown version
├── openapi.json                       ← OpenAPI 3.0 spec
└── postman.json                       ← Postman collection
│
../frontend/docs/                      ← ⭐ NEW: TypeDoc generated frontend docs
└── index.html                         ← React/TypeScript documentation
│
../imp_docs/                           ← Comprehensive Documentation
├── CODE_AUDIT/                        ← Security & QA
├── DEPLOYMENT/                        ← Deployment guides
├── TESTING/                           ← Testing strategies
├── EMAIL/                             ← Email integration
├── GDPR/                              ← Compliance
├── APPS/                              ← App-specific docs
├── MULTIISSUE_FIXES/                  ← Fix documentation
└── ROADMAP & PHASES/                  ← Project planning

../docs_backup_2025/                   ← Historical Archive
└── (45 historical files from Oct 2025)
```

---

## 🚀 Quick Start Guides

### New to the Project?

**Start here in order:**

1. **[Documentation Guide](DOCUMENTATION_GUIDE.md)** ⭐ NEW (15 mins)
   - Complete guide to all documentation
   - Smart-doc, OpenAPI/Swagger, TypeDoc setup
   - Database schemas and API references

2. **[Swagger Guide](swagger/SWAGGER_GUIDE.md)** (10 mins)
   - Learn how to use Swagger UI to explore APIs
   - Debug API mismatches interactively
   - Test endpoints without frontend

3. **[MongoDB Schemas](MONGODB_SCHEMAS.md)** ⭐ NEW (20 mins)
   - Database structure for all services
   - Collection schemas and relationships
   - Indexes and performance tips

4. **[API Contract Solution](api-contracts/API_CONTRACT_SOLUTION.md)** (20 mins)
   - Understand the complete solution
   - Learn the automated workflows
   - Set up type generation

5. **[API Versioning Strategy](api-contracts/API_VERSIONING_STRATEGY.md)** (15 mins)
   - How to handle breaking changes
   - Version management best practices
   - Migration strategies

---

## 🎯 By Use Case

### I want to debug an API mismatch

→ **[Swagger Guide](swagger/SWAGGER_GUIDE.md)**

**Quick workflow:**
1. Open Swagger UI: `http://localhost:8083/swagger-ui.html`
2. Find the failing endpoint
3. Compare request/response schema with frontend
4. Fix the mismatch

---

### I changed a backend API

→ **[API Contract Solution](api-contracts/API_CONTRACT_SOLUTION.md)** (Section: Daily Workflow)

**Quick steps:**
```bash
# 1. Make backend changes
# 2. Restart service
cd order-service && mvn spring-boot:run

# 3. Regenerate frontend types
cd ../frontend && npm run sync-api-types

# 4. Commit
git add .
git commit -m "feat: update order API"
```

---

### I need to make a breaking change

→ **[API Versioning Strategy](api-contracts/API_VERSIONING_STRATEGY.md)**

**Quick steps:**
1. Create new version (v2)
2. Keep old version (v1) running
3. Migrate frontend gradually
4. Sunset v1 after 6 months

---

### I want to prevent API mismatches

→ **[API Contract Solution](api-contracts/API_CONTRACT_SOLUTION.md)**

**Solutions:**
- OpenAPI type generation (automatic)
- Git pre-commit hooks (validates before commit)
- Pact contract testing (validates at test time)
- CI/CD validation (blocks bad PRs)
- API versioning (prevents breaking production)

---

## 📖 Complete Documentation Index

### ⭐ NEW: Automated Documentation

| Document | Purpose | When to Read |
|----------|---------|--------------|
| **[DOCUMENTATION_GUIDE.md](DOCUMENTATION_GUIDE.md)** | Complete documentation guide | **START HERE** - Setup Smart-doc, OpenAPI, TypeDoc |
| **[MONGODB_SCHEMAS.md](MONGODB_SCHEMAS.md)** | Database schemas & relationships | When working with MongoDB collections |

### API Contract Management

| Document | Purpose | When to Read |
|----------|---------|--------------|
| **[API_CONTRACT_SOLUTION.md](api-contracts/API_CONTRACT_SOLUTION.md)** | Complete enterprise solution | For API contract management |
| **[API_VERSIONING_STRATEGY.md](api-contracts/API_VERSIONING_STRATEGY.md)** | How to version APIs | Before making breaking changes |
| **[API_MISMATCH_REPORT.json](api-contracts/API_MISMATCH_REPORT.json)** | Current API analysis | Reference - 385 endpoints documented |

### Swagger/OpenAPI

| Document | Purpose | When to Read |
|----------|---------|--------------|
| **[SWAGGER_GUIDE.md](swagger/SWAGGER_GUIDE.md)** | How to use Swagger UI | When debugging API issues |
| **[SWAGGER_SETUP_COMPLETE.md](swagger/SWAGGER_SETUP_COMPLETE.md)** | Setup details | Reference - already configured |
| **[SWAGGER_FINAL_SUMMARY.md](swagger/SWAGGER_FINAL_SUMMARY.md)** | Quick reference | Quick lookup for URLs/commands |

---

## 🛠️ Tools & Scripts

### Available Scripts

Located in `../scripts/`:

| Script | Purpose | Usage |
|--------|---------|-------|
| `sync-api-contracts.sh` | Auto-generate TypeScript types | `npm run sync-api-types` |
| `validate-api-contracts.sh` | Validate types are in sync | `npm run validate-api-types` |
| `install-git-hooks.sh` | Install Git pre-commit hooks | `bash scripts/install-git-hooks.sh` |
| `analyze-api-contracts.js` | Analyze API mismatches | `node scripts/analyze-api-contracts.js` |

### Frontend Scripts

In `frontend/package.json`:

```bash
npm run sync-api-types      # Generate types from OpenAPI
npm run validate-api-types  # Validate types are in sync
npm run test:pact           # Run Pact contract tests
```

---

## 🌐 Swagger UI URLs

### Individual Services

```
http://localhost:8081/swagger-ui.html  (User Service)
http://localhost:8082/swagger-ui.html  (Menu Service)
http://localhost:8083/swagger-ui.html  (Order Service)
http://localhost:8084/swagger-ui.html  (Payment Service)
http://localhost:8085/swagger-ui.html  (Inventory Service)
http://localhost:8086/swagger-ui.html  (Analytics Service)
http://localhost:8090/swagger-ui.html  (Delivery Service)
http://localhost:8091/swagger-ui.html  (Customer Service)
http://localhost:8092/swagger-ui.html  (Notification Service)
http://localhost:8093/swagger-ui.html  (Review Service)
```

### Unified Gateway (⭐ Recommended)

```
http://localhost:8080/swagger-ui.html  (API Gateway - All Services)
```

Use the dropdown to switch between services!

---

## 🎓 Learning Path

### Week 1: Foundation
- [ ] Read Swagger Guide
- [ ] Explore Swagger UI for all services
- [ ] Test an endpoint using "Try it out"
- [ ] Find and fix one API mismatch

### Week 2: Automation
- [ ] Read API Contract Solution
- [ ] Install Git hooks
- [ ] Generate types for first time
- [ ] Make a backend change and regenerate types

### Week 3: Testing
- [ ] Read Pact setup guide
- [ ] Install Pact dependencies
- [ ] Write one contract test
- [ ] Run Pact tests locally

### Week 4: Advanced
- [ ] Read API Versioning Strategy
- [ ] Plan a version bump (if needed)
- [ ] Set up CI/CD pipeline
- [ ] Configure monitoring

---

## 🆘 Common Issues

### "Service not running on port 8083"

**Solution:**
```bash
# Start all services
./start-all.sh

# Or use cached specs
npm run sync-api-types -- --skip-running-check
```

### "Generated types have uncommitted changes"

**Solution:**
```bash
# Regenerate types
npm run sync-api-types

# Commit them
git add frontend/src/types/generated
git commit -m "chore: update API types"
```

### "Cannot find module '@/types/generated'"

**Solution:**
```bash
# Types haven't been generated yet
npm run sync-api-types
```

### "Pact test failing"

**This is working correctly!** Pact found a mismatch.

**Solution:**
- Update backend to match contract, OR
- Update contract to match backend
- Both must agree

---

## 📊 Success Metrics

Track these to measure success:

| Metric | Before | Target | Current |
|--------|--------|--------|---------|
| API mismatch incidents | 52/year | 0/year | Monitor |
| Time to detect issues | Hours | Seconds | - |
| Deployment confidence | 70% | 99.9% | - |
| Time per incident | 4.5 hours | 5 mins | - |

---

## 🤝 Contributing

When adding documentation:

1. **API-related docs** → `docs/api-contracts/`
2. **Swagger/OpenAPI docs** → `docs/swagger/`
3. **General guides** → `docs/guides/`
4. **Update this README** with links

---

## 📞 Support

Having issues?

1. **Check this README** first
2. **Read relevant docs** (linked above)
3. **Check troubleshooting** sections in each guide
4. **Review Git workflow logs** (`.git/hooks/pre-commit`)
5. **Check CI/CD logs** (GitHub Actions)

---

## 🔗 External Resources

### OpenAPI / Swagger
- [Swagger Official Docs](https://swagger.io/specification/)
- [SpringDoc](https://springdoc.org/)
- [OpenAPI Generator](https://openapi-generator.tech/)

### Pact Contract Testing
- [Pact Docs](https://docs.pact.io/)
- [Pact JS](https://github.com/pact-foundation/pact-js)
- [Getting Started](https://docs.pact.io/getting_started/)

### API Versioning
- [Stripe Versioning](https://stripe.com/docs/api/versioning)
- [REST API Versioning](https://restfulapi.net/versioning/)
- [Martin Fowler on REST](https://martinfowler.com/articles/enterpriseREST.html)

---

## ✅ Documentation Checklist

Use this to verify documentation is working:

- [ ] All links in this README work
- [ ] Can access Swagger UI for all services
- [ ] API Contract Solution guide is readable
- [ ] Scripts are executable and documented
- [ ] Examples work as shown
- [ ] Troubleshooting sections are helpful
- [ ] Team knows where to find docs

---

**Last Updated:** 2026-01-18
**Maintained By:** Development Team
**Questions?** Check the relevant guide above!

---

## 🎯 Remember

**The goal of this documentation:**
- ✅ Zero API mismatches in production
- ✅ Fast onboarding for new developers
- ✅ Self-service debugging
- ✅ Professional API management

**Read. Learn. Build. Ship with confidence.** 🚀
