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
```

---

## Code Style

**Java (Spring Boot):**
- Follow existing package structure per service
- DTOs in `dto/`, controllers in `controller/`, services in `service/`
- Use `@Valid` on request bodies
- Never hardcode secrets — use `application.yml` with env var references

**TypeScript (React):**
- ESLint config in `frontend/.eslintrc`
- Components in `src/components/`, pages in `src/pages/`
- API calls via RTK Query in `src/store/api/`
- Neumorphic UI components in `src/components/ui/neumorphic/`

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

## PR Checklist

Before opening a PR:
- [ ] CI passes locally (`mvn test` / `npm run test`)
- [ ] No `.env` secrets committed
- [ ] Branch is up to date with `main`
- [ ] PR description explains what and why
