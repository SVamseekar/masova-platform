# Phase 7 — Deployment + DevOps Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Ship MaSoVa to GCP production — 7 services on Cloud Run, frontend on Firebase Hosting, managed databases, GitHub Actions CI/CD, under $10/month.

**Architecture:** GCP Cloud Run for all 7 services (scales to zero = cheap). Firebase Hosting for React frontend (global CDN). MongoDB Atlas M0 free tier (Mumbai). Upstash Redis free tier. CloudAMQP Little Lemur (free RabbitMQ). Secrets in GCP Secret Manager. GitHub Actions for CI + CD.

**Tech Stack:** Docker multi-stage builds, GitHub Actions, GCP Cloud Run, Firebase Hosting, gcloud CLI, gh CLI

**Prerequisite:** Phases 0–6 complete. All services compile and pass smoke tests locally.

---

## Tools for This Phase

Read this section before starting ANY task. These are the exact tools to use and when.

### `firebase` — Firebase MCP (MCP tools)
**Use it:** Task 7.3 (Firebase Hosting setup) — do NOT go to the Firebase console manually. Use these MCP tools directly.
**Specifically:**
- `firebase_list_projects` — check if a MaSoVa project already exists before creating a new one.
- `firebase_create_project` — create the project if it doesn't exist.
- `firebase_get_sdk_config` — get the Firebase config object to paste into `frontend/.env.production`.
- `firebase_init` — initialize Firebase Hosting for the `frontend/` directory.
- `firebase_read_resources` — verify Hosting is configured correctly after init.
**How to invoke:** Use the `mcp__plugin_firebase_firebase__*` tools directly in your session.

### `github` — GitHub MCP (MCP tool)
**Use it:** Task 7.5 (CI pipeline) and Task 7.6 (CD pipeline). After pushing the workflow files, use GitHub MCP to check the Actions run status without leaving Claude Code.
**Specifically:** After pushing `.github/workflows/ci.yml`, use the GitHub MCP to view the workflow run and confirm it passes. If it fails, read the job logs via GitHub MCP.
**How to invoke:** Use the `github` MCP tools available in your session.

### `context7` — Library Docs (MCP tool)
**Use it:** Before writing Dockerfiles and GitHub Actions workflows.
**Specifically:**
- Task 7.1: `resolve-library-id` for `eclipse-temurin` → `query-docs` for "multi-stage build Java 21" to get the correct FROM image names for the build and runtime stages.
- Task 7.2: `resolve-library-id` for `python` → `query-docs` for "slim Docker image uvicorn" to get the correct Python slim image and uvicorn CMD.
- Task 7.5: `resolve-library-id` for `github-actions` → `query-docs` for "setup-java temurin maven cache" to get the correct Actions syntax for Java CI.
**How to invoke:** `mcp__plugin_context7_context7__resolve-library-id` → `mcp__plugin_context7_context7__query-docs`.

### `playwright` — Browser Automation (MCP tools)
**Use it:** Task 7.9 (smoke test deployed URLs). After the first successful deployment, use Playwright to smoke-test the live Firebase Hosting URL.
**Specifically:**
- `browser_navigate` to the Firebase Hosting URL → `browser_screenshot` to confirm the frontend loads.
- `browser_network_requests` to confirm API calls are going to the Cloud Run URLs (not localhost).
- `browser_console_messages` to check for any JS errors on the deployed frontend.
**How to invoke:** `mcp__plugin_playwright_playwright__browser_navigate`, `browser_screenshot`, `browser_network_requests`.

### `security-guidance` (Skill)
**Use it:** After Task 7.5 (CI) and Task 7.6 (CD). This is the most security-critical phase — production secrets in GitHub Actions, CORS configs, GCP service account permissions.
**Specifically:** Verify: Are secrets stored in GitHub Secrets (not in yaml files)? Is the GCP service account scoped minimally (Cloud Run deploy only — not project owner)? Is CORS restricted to the Firebase Hosting domain only?
**How to invoke:** Type `/security-guidance`.

### `verification-before-completion` (Skill)
**Use it:** After EVERY task in this phase. Deployment tasks have the highest blast radius — a broken CI pipeline or wrong Docker image can waste hours. Evidence before assertion.
**Specifically:** For Task 7.1, build the Docker image locally and run it before pushing. For Task 7.5, confirm the GitHub Actions workflow shows green before moving to CD. For Task 7.3, confirm Firebase Hosting shows the correct site.
**How to invoke:** Type `/verification-before-completion`.

### `finishing-a-development-branch` (Skill)
**Use it:** After Task 7.9 (smoke tests pass on production). This skill guides the final merge decision — whether to squash, merge, or rebase the deployment branch into main, and how to tag the release.
**How to invoke:** Type `/finishing-a-development-branch`.

### `commit-commands:commit-push-pr` (Skill)
**Use it:** After Task 7.4 (GCP setup docs complete). Opening a PR at this point triggers the CI pipeline for the first time — this is intentional. Watch it run.
**How to invoke:** Type `/commit-push-pr`.

---

## Task 7.1: Multi-Stage Docker Builds for Java Services

**Files:**
- Modify: `core-service/Dockerfile`
- Modify: `commerce-service/Dockerfile`
- Modify: `logistics-service/Dockerfile`
- Modify: `payment-service/Dockerfile`
- Modify: `intelligence-service/Dockerfile`
- Modify: `api-gateway/Dockerfile`

**Step 1: Read existing core-service/Dockerfile**

Check what the current Dockerfile looks like. Likely a single-stage build.

**Step 2: Rewrite each Dockerfile to multi-stage**

Replace the content of each Java service Dockerfile with this template (change `ARTIFACT_ID` per service):

```dockerfile
# Stage 1: Build
FROM maven:3.9-eclipse-temurin-21 AS builder
WORKDIR /build

# Copy parent pom + shared modules first (layer caching)
COPY pom.xml .
COPY shared-models/pom.xml shared-models/pom.xml
COPY shared-security/pom.xml shared-security/pom.xml
COPY core-service/pom.xml core-service/pom.xml

# Download dependencies (cached layer)
RUN mvn dependency:go-offline -pl core-service -am -q

# Copy source and build
COPY shared-models/src shared-models/src
COPY shared-security/src shared-security/src
COPY core-service/src core-service/src
RUN mvn package -pl core-service -am -DskipTests -q

# Stage 2: Runtime
FROM eclipse-temurin:21-jre-jammy AS runtime
WORKDIR /app

# Non-root user for security
RUN groupadd -r masova && useradd -r -g masova -u 1001 masova
USER masova

# Copy JAR from builder
COPY --from=builder --chown=masova:masova /build/core-service/target/core-service-*.jar app.jar

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD wget -qO- http://localhost:${SERVER_PORT:-8085}/actuator/health || exit 1

EXPOSE 8085
ENTRYPOINT ["java", "-jar", \
  "-Xmx512m", \
  "-XX:+UseContainerSupport", \
  "-Dspring.profiles.active=prod", \
  "app.jar"]
```

Repeat for each service — change `core-service` → service name, `8085` → correct port:
- `core-service` → port 8085
- `commerce-service` → port 8084
- `logistics-service` → port 8086
- `payment-service` → port 8089
- `intelligence-service` → port 8087
- `api-gateway` → port 8080

**Note for api-gateway:** The `COPY` in builder stage should reference the correct module name.

**Step 3: Add .dockerignore files**

Create `core-service/.dockerignore` (repeat for each service):
```
target/
*.md
.git/
src/test/
*.bak
*.iml
.idea/
```

Create root `.dockerignore`:
```
.git/
node_modules/
*/target/
docs/
backups/
archive/
*.bak
frontend/node_modules/
frontend/dist/
.worktrees/
```

**Step 4: Build one service locally to verify**

```bash
cd /Users/souravamseekarmarti/Projects/MaSoVa-restaurant-management-system
docker build -f core-service/Dockerfile -t masova-core-service:test .
```

Expected: image built successfully, check size is < 400MB (JRE only, not JDK).

**Step 5: Commit**

```bash
git add core-service/Dockerfile commerce-service/Dockerfile logistics-service/Dockerfile
git add payment-service/Dockerfile intelligence-service/Dockerfile api-gateway/Dockerfile
git add core-service/.dockerignore commerce-service/.dockerignore logistics-service/.dockerignore
git add payment-service/.dockerignore intelligence-service/.dockerignore api-gateway/.dockerignore
git add .dockerignore
git commit -m "feat(docker): multi-stage builds for all 6 Java services — JRE runtime, non-root user, health checks"
```

---

## Task 7.2: masova-support Dockerfile

**Files:**
- Create: `masova-support/Dockerfile` (if not exists, or rewrite)

**Step 1: Read existing masova-support Dockerfile if present**

**Step 2: Write/rewrite Dockerfile**

```dockerfile
FROM python:3.11-slim AS runtime
WORKDIR /app

# Install dependencies first (cached layer)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Non-root user
RUN useradd -m -u 1001 masova && chown -R masova:masova /app
USER masova

# Copy application code
COPY --chown=masova:masova src/ src/

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
  CMD python -c "import httpx; httpx.get('http://localhost:8000/health').raise_for_status()" || exit 1

EXPOSE 8000

CMD ["uvicorn", "src.masova_agent.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "1"]
```

Create `masova-support/.dockerignore`:
```
__pycache__/
*.pyc
*.pyo
.venv/
venv/
.env*
tests/
*.md
.git/
```

**Step 3: Build and verify**

```bash
cd /Users/souravamseekarmarti/Projects/masova-support
docker build -t masova-support:test .
docker run --rm -e GOOGLE_API_KEY=test masova-support:test &
sleep 5
curl http://localhost:8000/health
```

Expected: `{"status": "ok"}` or similar.

**Step 4: Commit**

```bash
git add Dockerfile .dockerignore
git commit -m "feat(docker): masova-support Dockerfile — slim Python 3.11, non-root user, health check"
```

---

## Task 7.3: Firebase Hosting Config

**Files:**
- Create: `frontend/firebase.json`
- Create: `frontend/.firebaserc`

**Step 1: Create firebase.json**

Create `frontend/firebase.json`:

```json
{
  "hosting": {
    "public": "dist",
    "ignore": [
      "firebase.json",
      "**/.*",
      "**/node_modules/**"
    ],
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ],
    "headers": [
      {
        "source": "**/*.@(js|css)",
        "headers": [
          {
            "key": "Cache-Control",
            "value": "public, max-age=31536000, immutable"
          }
        ]
      },
      {
        "source": "**",
        "headers": [
          {
            "key": "X-Frame-Options",
            "value": "SAMEORIGIN"
          },
          {
            "key": "X-Content-Type-Options",
            "value": "nosniff"
          },
          {
            "key": "Referrer-Policy",
            "value": "strict-origin-when-cross-origin"
          },
          {
            "key": "Permissions-Policy",
            "value": "camera=(), microphone=(self), geolocation=(self)"
          }
        ]
      }
    ]
  }
}
```

**Step 2: Create .firebaserc**

Create `frontend/.firebaserc`:

```json
{
  "projects": {
    "default": "masova-app"
  }
}
```

Replace `"masova-app"` with your actual Firebase project ID when you create it.

**Step 3: Install Firebase CLI (Mac)**

```bash
npm install -g firebase-tools
firebase login
```

**Step 4: Initialize project**

```bash
cd frontend
firebase init hosting
# Select: use existing project or create new
# Public dir: dist
# SPA: yes
# Overwrite index.html: no
```

**Step 5: Test local build + deploy**

```bash
npm run build
firebase serve --only hosting
# Open http://localhost:5000 — verify SPA works
```

**Step 6: Commit**

```bash
git add frontend/firebase.json frontend/.firebaserc
git commit -m "feat(hosting): Firebase Hosting config — SPA rewrites, security headers, cache headers"
```

---

## Task 7.4: GCP One-Time Setup (Manual Steps)

This task contains manual GCP console + gcloud CLI steps. Do these once.

**Step 1: Install gcloud CLI (Mac)**

```bash
brew install --cask google-cloud-sdk
gcloud auth login
gcloud auth application-default login
```

**Step 2: Create GCP project**

```bash
gcloud projects create masova-platform --name="MaSoVa Platform"
gcloud config set project masova-platform
```

**Step 3: Enable required APIs**

```bash
gcloud services enable \
  run.googleapis.com \
  artifactregistry.googleapis.com \
  secretmanager.googleapis.com \
  cloudbuild.googleapis.com
```

**Step 4: Create Artifact Registry**

```bash
gcloud artifacts repositories create masova \
  --repository-format=docker \
  --location=asia-south1 \
  --description="MaSoVa container images"
```

**Step 5: Create service account for deployment**

```bash
gcloud iam service-accounts create masova-deploy \
  --display-name="MaSoVa Deploy"

# Grant roles
gcloud projects add-iam-policy-binding masova-platform \
  --member="serviceAccount:masova-deploy@masova-platform.iam.gserviceaccount.com" \
  --role="roles/run.admin"

gcloud projects add-iam-policy-binding masova-platform \
  --member="serviceAccount:masova-deploy@masova-platform.iam.gserviceaccount.com" \
  --role="roles/artifactregistry.writer"

gcloud projects add-iam-policy-binding masova-platform \
  --member="serviceAccount:masova-deploy@masova-platform.iam.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

**Step 6: Generate service account key for GitHub Actions**

```bash
gcloud iam service-accounts keys create ./masova-deploy-key.json \
  --iam-account=masova-deploy@masova-platform.iam.gserviceaccount.com
```

DO NOT commit this file. Store it in GitHub Secrets as `GCP_SA_KEY`.

**Step 7: Create secrets in GCP Secret Manager**

```bash
# JWT Secret
echo -n "your-super-secret-jwt-key-min-32-chars" | \
  gcloud secrets create masova-jwt-secret --data-file=-

# Razorpay keys
echo -n "rzp_live_your_key_id" | gcloud secrets create masova-razorpay-key-id --data-file=-
echo -n "rzp_live_your_key_secret" | gcloud secrets create masova-razorpay-key-secret --data-file=-

# Google OAuth
echo -n "your-google-client-id.apps.googleusercontent.com" | \
  gcloud secrets create masova-google-client-id --data-file=-
```

**Step 8: Set up managed databases**

- **MongoDB Atlas**: Sign up at cloud.mongodb.com → Create M0 free cluster → Region: Mumbai (ap-south-1) → Get connection string → Store in GCP Secret Manager as `masova-mongodb-uri`

- **Upstash Redis**: Sign up at upstash.com → Create Redis database → Region: ap-south-1 → Get TLS connection URL → Store as `masova-redis-url`

- **CloudAMQP**: Sign up at cloudamqp.com → Create Little Lemur instance → Get AMQP URL → Store as `masova-rabbitmq-url`

**Step 9: Set up budget alert**

GCP Console → Billing → Budgets & alerts → Create budget → $10/month → 50%, 90%, 100% alerts → Your email.

**No commit for this task — manual setup only. Document the setup in `docs/deployment/GCP-SETUP.md`.**

---

## Task 7.5: GitHub Actions — CI Pipeline

**Files:**
- Create: `.github/workflows/ci.yml`

**Step 1: Create ci.yml**

Create `.github/workflows/ci.yml`:

```yaml
name: CI

on:
  push:
    branches: [ main, 'feat/**', 'fix/**' ]
  pull_request:
    branches: [ main ]

jobs:
  # ─────────────────────────────────────────────────
  # Frontend: TypeScript check + Vitest
  # ─────────────────────────────────────────────────
  frontend:
    name: Frontend CI
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: frontend

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js 20
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: frontend/package-lock.json

      - name: Install dependencies
        run: npm ci

      - name: TypeScript check
        run: npx tsc --noEmit

      - name: Run Vitest
        run: npm test -- --reporter=verbose --run

      - name: Build
        run: npm run build

  # ─────────────────────────────────────────────────
  # Backend: Maven build + test per service
  # ─────────────────────────────────────────────────
  backend:
    name: Backend CI (${{ matrix.service }})
    runs-on: ubuntu-latest
    strategy:
      matrix:
        service:
          - core-service
          - commerce-service
          - logistics-service
          - payment-service
          - intelligence-service
          - api-gateway

    services:
      mongodb:
        image: mongo:7.0
        ports:
          - 27017:27017
        options: >-
          --health-cmd "mongosh --eval 'db.runCommand({ ping: 1 })'"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

      redis:
        image: redis:7.2-alpine
        ports:
          - 6379:6379
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 5s
          --health-timeout 3s
          --health-retries 5

      rabbitmq:
        image: rabbitmq:3.12-management-alpine
        ports:
          - 5672:5672
        env:
          RABBITMQ_DEFAULT_USER: masova
          RABBITMQ_DEFAULT_PASS: masova_secret
        options: >-
          --health-cmd "rabbitmq-diagnostics ping"
          --health-interval 15s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v4

      - name: Set up JDK 21
        uses: actions/setup-java@v4
        with:
          java-version: '21'
          distribution: 'temurin'
          cache: 'maven'

      - name: Build shared modules
        run: mvn install -pl shared-models,shared-security -DskipTests -q

      - name: Build and test ${{ matrix.service }}
        run: mvn test -pl ${{ matrix.service }} -am
        env:
          SPRING_DATA_MONGODB_URI: mongodb://localhost:27017/masova_test
          SPRING_REDIS_HOST: localhost
          SPRING_RABBITMQ_HOST: localhost
          SPRING_RABBITMQ_USERNAME: masova
          SPRING_RABBITMQ_PASSWORD: masova_secret

  # ─────────────────────────────────────────────────
  # AI Agent: Python tests
  # ─────────────────────────────────────────────────
  agent:
    name: AI Agent CI
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: masova-support

    services:
      redis:
        image: redis:7.2-alpine
        ports:
          - 6379:6379

    steps:
      - uses: actions/checkout@v4

      - name: Set up Python 3.11
        uses: actions/setup-python@v5
        with:
          python-version: '3.11'
          cache: 'pip'
          cache-dependency-path: masova-support/requirements.txt

      - name: Install dependencies
        run: pip install -r requirements.txt pytest pytest-asyncio

      - name: Run tests
        run: python -m pytest tests/ -v
        env:
          REDIS_URL: redis://localhost:6379/1
          BACKEND_URL: http://localhost:8080
          GOOGLE_API_KEY: test-key
```

**Step 2: Commit**

```bash
git add .github/workflows/ci.yml
git commit -m "feat(ci): GitHub Actions CI — frontend TypeScript+Vitest, backend Maven matrix, Python agent tests"
```

---

## Task 7.6: GitHub Actions — Deploy Pipeline

**Files:**
- Create: `.github/workflows/deploy.yml`

**Step 1: Create deploy.yml**

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches: [ main ]
  workflow_dispatch:  # Manual trigger

env:
  GCP_PROJECT: masova-platform
  GCP_REGION: asia-south1
  REGISTRY: asia-south1-docker.pkg.dev/masova-platform/masova

jobs:
  # ─────────────────────────────────────────────────
  # Build and push Docker images
  # ─────────────────────────────────────────────────
  build-backend:
    name: Build ${{ matrix.service.name }}
    runs-on: ubuntu-latest
    strategy:
      matrix:
        service:
          - { name: core-service, port: 8085, memory: 512Mi }
          - { name: commerce-service, port: 8084, memory: 512Mi }
          - { name: logistics-service, port: 8086, memory: 512Mi }
          - { name: payment-service, port: 8089, memory: 256Mi }
          - { name: intelligence-service, port: 8087, memory: 512Mi }
          - { name: api-gateway, port: 8080, memory: 256Mi }

    steps:
      - uses: actions/checkout@v4

      - name: Authenticate to GCP
        uses: google-github-actions/auth@v2
        with:
          credentials_json: ${{ secrets.GCP_SA_KEY }}

      - name: Set up Cloud SDK
        uses: google-github-actions/setup-gcloud@v2

      - name: Configure Docker for Artifact Registry
        run: gcloud auth configure-docker asia-south1-docker.pkg.dev --quiet

      - name: Build and push ${{ matrix.service.name }}
        uses: docker/build-push-action@v6
        with:
          context: .
          file: ${{ matrix.service.name }}/Dockerfile
          push: true
          tags: |
            ${{ env.REGISTRY }}/${{ matrix.service.name }}:latest
            ${{ env.REGISTRY }}/${{ matrix.service.name }}:${{ github.sha }}
          cache-from: type=registry,ref=${{ env.REGISTRY }}/${{ matrix.service.name }}:latest
          cache-to: type=inline

  # ─────────────────────────────────────────────────
  # Deploy Java services to Cloud Run
  # ─────────────────────────────────────────────────
  deploy-backend:
    name: Deploy ${{ matrix.service.name }}
    runs-on: ubuntu-latest
    needs: build-backend
    strategy:
      matrix:
        service:
          - { name: core-service, port: 8085, memory: 512Mi }
          - { name: commerce-service, port: 8084, memory: 512Mi }
          - { name: logistics-service, port: 8086, memory: 512Mi }
          - { name: payment-service, port: 8089, memory: 256Mi }
          - { name: intelligence-service, port: 8087, memory: 512Mi }
          - { name: api-gateway, port: 8080, memory: 256Mi }

    steps:
      - name: Authenticate to GCP
        uses: google-github-actions/auth@v2
        with:
          credentials_json: ${{ secrets.GCP_SA_KEY }}

      - name: Deploy ${{ matrix.service.name }} to Cloud Run
        uses: google-github-actions/deploy-cloudrun@v2
        with:
          service: ${{ matrix.service.name }}
          region: ${{ env.GCP_REGION }}
          image: ${{ env.REGISTRY }}/${{ matrix.service.name }}:${{ github.sha }}
          flags: |
            --allow-unauthenticated
            --port=${{ matrix.service.port }}
            --memory=${{ matrix.service.memory }}
            --min-instances=0
            --max-instances=3
            --timeout=60
            --set-secrets=SPRING_DATA_MONGODB_URI=masova-mongodb-uri:latest,SPRING_REDIS_URL=masova-redis-url:latest,SPRING_RABBITMQ_ADDRESSES=masova-rabbitmq-url:latest,JWT_SECRET=masova-jwt-secret:latest

  # ─────────────────────────────────────────────────
  # Build and deploy masova-support Python service
  # ─────────────────────────────────────────────────
  deploy-agent:
    name: Deploy AI Agent
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Authenticate to GCP
        uses: google-github-actions/auth@v2
        with:
          credentials_json: ${{ secrets.GCP_SA_KEY }}

      - name: Set up Cloud SDK
        uses: google-github-actions/setup-gcloud@v2

      - name: Configure Docker
        run: gcloud auth configure-docker asia-south1-docker.pkg.dev --quiet

      - name: Build and push agent
        uses: docker/build-push-action@v6
        with:
          context: masova-support
          push: true
          tags: |
            ${{ env.REGISTRY }}/masova-support:latest
            ${{ env.REGISTRY }}/masova-support:${{ github.sha }}

      - name: Deploy agent to Cloud Run
        uses: google-github-actions/deploy-cloudrun@v2
        with:
          service: masova-support
          region: ${{ env.GCP_REGION }}
          image: ${{ env.REGISTRY }}/masova-support:${{ github.sha }}
          flags: |
            --allow-unauthenticated
            --port=8000
            --memory=512Mi
            --min-instances=0
            --max-instances=2
            --set-secrets=GOOGLE_API_KEY=masova-google-api-key:latest,REDIS_URL=masova-redis-url:latest,BACKEND_URL=masova-backend-url:latest

  # ─────────────────────────────────────────────────
  # Build and deploy frontend to Firebase
  # ─────────────────────────────────────────────────
  deploy-frontend:
    name: Deploy Frontend
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: frontend

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js 20
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: frontend/package-lock.json

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npm run build
        env:
          VITE_API_BASE_URL: https://api-gateway-xxxx-as.a.run.app
          VITE_GOOGLE_MAPS_KEY: ${{ secrets.GOOGLE_MAPS_KEY }}

      - name: Deploy to Firebase Hosting
        uses: FirebaseExtended/action-hosting-deploy@v0
        with:
          repoToken: ${{ secrets.GITHUB_TOKEN }}
          firebaseServiceAccount: ${{ secrets.FIREBASE_SERVICE_ACCOUNT }}
          projectId: masova-app
          entryPoint: ./frontend
```

**Step 2: Add required GitHub Secrets**

In GitHub repo → Settings → Secrets and variables → Actions, add:
- `GCP_SA_KEY` — the service account JSON key from Task 7.4 Step 6
- `FIREBASE_SERVICE_ACCOUNT` — Firebase service account JSON (from Firebase Console → Project Settings → Service Accounts)
- `GOOGLE_MAPS_KEY` — Google Maps API key for frontend

**Step 3: Commit**

```bash
git add .github/workflows/deploy.yml
git commit -m "feat(cd): GitHub Actions deploy — Docker build matrix, Cloud Run deploy, Firebase Hosting"
```

---

## Task 7.7: Seed Database Script Enhancement

**Files:**
- Modify: `scripts/seed-database.js`

**Step 1: Read existing seed-database.js**

Understand what data is already seeded.

**Step 2: Verify seed covers all needed entities**

Target data per master plan:
- 5 stores (different cities/regions)
- 15 users: 3 managers, 3 kitchen staff, 3 drivers, 3 cashiers, 3 assistant managers
- 20 customers
- 50 menu items (across 5 stores, multiple cuisines)
- 30 orders (all statuses: RECEIVED/PREPARING/READY/DELIVERED/COMPLETED/CANCELLED)
- 25 payments (matching orders)
- 20 delivery trackings (for DELIVERY orders)
- 15 reviews (ratings 1-5)
- 10 campaigns (DRAFT/ACTIVE/COMPLETED)
- 20 notifications

If anything is missing from the current script, add it.

**Step 3: Add `scripts/clear-database.js`**

Create `scripts/clear-database.js`:

```javascript
/**
 * Clear seeded test data from MongoDB
 * Run: node scripts/clear-database.js
 * WARNING: Drops ALL data in these collections — dev only!
 */
const { MongoClient } = require('mongodb');

const MONGO_URL = process.env.MONGO_URL || 'mongodb://192.168.50.88:27017';
const DB_NAME = 'masova_db';

const COLLECTIONS_TO_CLEAR = [
  'users', 'customers', 'stores', 'menu_items', 'orders', 'transactions',
  'refunds', 'delivery_trackings', 'reviews', 'campaigns', 'notifications',
  'inventory_items', 'suppliers', 'purchase_orders', 'waste_records',
  'shifts', 'working_sessions'
];

async function clearDatabase() {
  const client = new MongoClient(MONGO_URL);
  await client.connect();
  const db = client.db(DB_NAME);

  for (const collection of COLLECTIONS_TO_CLEAR) {
    try {
      const result = await db.collection(collection).deleteMany({});
      console.log(`✓ Cleared ${collection} (${result.deletedCount} documents)`);
    } catch (e) {
      console.log(`  (${collection} not found — skipping)`);
    }
  }

  await client.close();
  console.log('\n✅ Database cleared');
}

clearDatabase().catch(e => { console.error(e); process.exit(1); });
```

**Step 4: Add npm scripts to root package.json**

In the root `package.json` (create if not exists):

```json
{
  "scripts": {
    "seed": "node scripts/seed-database.js",
    "seed:clear": "node scripts/clear-database.js",
    "migrate:postgres": "node scripts/migrate-to-postgres.js",
    "index:fix": "node scripts/fix-p0-indexes.js"
  }
}
```

**Step 5: Commit**

```bash
git add scripts/clear-database.js
git add package.json
git commit -m "feat(scripts): add clear-database.js, npm scripts for seed/migrate/index operations"
```

---

## Task 7.8: GitHub Repo Cleanup + Templates

**Files:**
- Modify: `README.md`
- Create: `.github/PULL_REQUEST_TEMPLATE.md`
- Create: `.github/ISSUE_TEMPLATE/bug_report.md`
- Create: `.github/ISSUE_TEMPLATE/feature_request.md`
- Create: `.github/CODEOWNERS`

**Step 1: Update README.md**

Update the root `README.md` with:

```markdown
# MaSoVa — Restaurant Management Platform

[![CI](https://github.com/SVamseekar/masova-platform/actions/workflows/ci.yml/badge.svg)](https://github.com/SVamseekar/masova-platform/actions/workflows/ci.yml)

Full-stack restaurant management system — order management, KDS, delivery tracking, AI agents.

## Architecture

| Layer | Technology |
|-------|-----------|
| Backend | 6 Spring Boot 3 microservices |
| Web Frontend | React 19, TypeScript, MUI |
| Staff Mobile | React Native 0.81 (MaSoVaDriverApp) |
| Customer Mobile | React Native 0.81 (masova-mobile) |
| AI Agents | Python, Google ADK 1.25, FastAPI |
| Database | PostgreSQL + MongoDB + Redis |
| Infrastructure | GCP Cloud Run + Firebase Hosting |

## Services

| Service | Port (local) | Responsibility |
|---------|-------------|----------------|
| api-gateway | 8080 | Auth, routing, aggregated health |
| core-service | 8085 | Users, customers, shifts, GDPR |
| commerce-service | 8084 | Menu, orders, equipment |
| logistics-service | 8086 | Delivery, inventory, suppliers |
| payment-service | 8089 | Razorpay, cash, refunds |
| intelligence-service | 8087 | Analytics, forecasting |
| masova-support | 8000 | AI support agent, 8 scheduled agents |

## Local Development

### Prerequisites
- Java 21 (Temurin), Maven 3.9
- Docker Desktop
- Node.js 20
- Python 3.11

### Backend (Dell Windows)
```powershell
docker compose up -d mongodb redis rabbitmq
cd core-service && mvn spring-boot:run "-Dmaven.test.skip=true"
# Repeat for each service
```

### Frontend (Mac)
```bash
cd frontend
npm install
npm run dev  # http://localhost:3000
```

### Seed Data
```bash
node scripts/seed-database.js
```

## Test Credentials (seeded)
| Role | Email | Password |
|------|-------|----------|
| Manager | manager@masova.com | password123 |
| Kitchen Staff | kitchen@masova.com | password123 |
| Driver | driver@masova.com | password123 |
| Cashier | cashier@masova.com | password123 |
```

**Step 2: Create PR template**

Create `.github/PULL_REQUEST_TEMPLATE.md`:

```markdown
## What does this PR do?

<!-- 1-2 sentence summary -->

## Type of change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Refactoring
- [ ] Documentation

## Testing
- [ ] Local smoke test passed
- [ ] Relevant unit tests updated
- [ ] No new TypeScript errors (`tsc --noEmit`)
- [ ] Backend compiles (`mvn compile`)

## Screenshots (if UI change)

<!-- Add screenshots for frontend changes -->
```

**Step 3: Create CODEOWNERS**

Create `.github/CODEOWNERS`:

```
# All files — require PR review
* @SVamseekar

# Backend services
/core-service/ @SVamseekar
/commerce-service/ @SVamseekar

# Frontend
/frontend/ @SVamseekar

# AI Agents
/masova-support/ @SVamseekar
```

**Step 4: Set branch protection (manual — GitHub UI)**

GitHub repo → Settings → Branches → Add rule:
- Branch: `main`
- Require PR before merging: ✅
- Require status checks: `frontend`, `backend (core-service)`, `backend (commerce-service)`, `backend (logistics-service)`, `backend (payment-service)`, `backend (intelligence-service)`, `backend (api-gateway)`, `agent`
- No force push: ✅
- No deletion: ✅

**Step 5: Commit**

```bash
git add README.md
git add .github/PULL_REQUEST_TEMPLATE.md
git add .github/ISSUE_TEMPLATE/
git add .github/CODEOWNERS
git commit -m "docs: update README with architecture, setup instructions, PR template, CODEOWNERS"
```

---

## Task 7.9: Create GCP-SETUP.md Documentation

**Files:**
- Create: `docs/deployment/GCP-SETUP.md`

**Step 1: Document one-time GCP setup**

Create `docs/deployment/GCP-SETUP.md` documenting all the manual steps from Task 7.4 in order, with exact commands, expected outputs, and where to get credentials.

Include:
1. GCP project creation
2. API enablement
3. Artifact Registry setup
4. Service account creation + key generation
5. Secret Manager setup (what goes in each secret)
6. MongoDB Atlas M0 setup (Mumbai)
7. Upstash Redis setup (Mumbai)
8. CloudAMQP Little Lemur setup
9. Firebase project creation
10. GitHub Secrets required
11. First deployment steps

**Step 2: Commit**

```bash
git add docs/deployment/GCP-SETUP.md
git commit -m "docs: GCP production setup guide — Cloud Run, Firebase, managed databases, secrets"
```

---

## Execution Notes

### Deploy Order (first-time production deploy)
1. Task 7.4 (GCP setup) — one time, manual
2. Tasks 7.1–7.2 (Dockerfiles) — verify build locally first
3. Task 7.3 (Firebase config) — test local serve
4. Task 7.5 (CI) — push to feature branch, verify CI passes
5. Task 7.6 (CD) — push to main, verify full deploy
6. Task 7.7 (seed) — run seed against production once

### Cost Control
- Cloud Run min-instances=0 means services scale to zero → no cost when idle
- MongoDB Atlas M0 is free forever (512MB storage limit)
- Upstash Redis free tier: 10,000 commands/day
- CloudAMQP Little Lemur: 1M messages/month free
- Firebase Hosting: 10GB storage, 360MB/day transfer free
- Total estimated: $0–$5/month for low-traffic dev/demo

### Environment Variables Per Service (Cloud Run)
Each service needs these env vars injected via `--set-secrets` or `--set-env-vars`:
- `SPRING_DATA_MONGODB_URI` — from secret `masova-mongodb-uri`
- `SPRING_REDIS_URL` — from secret `masova-redis-url`
- `SPRING_RABBITMQ_ADDRESSES` — from secret `masova-rabbitmq-url`
- `JWT_SECRET` — from secret `masova-jwt-secret`
- Service-specific: `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET` (payment-service only)
