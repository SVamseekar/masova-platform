# Phase 5 — GCP Deployment Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Deploy the entire MaSoVa platform to GCP within the AI Pro $10/month credit — Cloud Run for all 7 services, Firebase Hosting for the web frontend, MongoDB Atlas M0, Upstash Redis, CloudAMQP RabbitMQ.

**Architecture:** All 6 Spring Boot services + masova-support Python already have Dockerfiles (or will after Task 1). GitHub Actions builds images → pushes to GCP Artifact Registry → deploys to Cloud Run. Frontend deploys to Firebase Hosting. Infrastructure services (MongoDB, Redis, RabbitMQ) use free managed tiers.

**Tech Stack:** GCP Cloud Run, Firebase Hosting, GCP Artifact Registry, GitHub Actions, MongoDB Atlas M0, Upstash Redis, CloudAMQP Little Lemur, Expo EAS (mobile).

---

## Critical Context

### What Already Exists
- All 6 backend service Dockerfiles: `{service}/Dockerfile` using `openjdk:21-jdk-slim`
- `frontend/Dockerfile.production` (multi-stage Node→nginx)
- `frontend/nginx.conf` (production-grade with React Router rewrites)
- `.github/workflows/ci.yml` — tests only, deploy job is a placeholder
- `.github/workflows/release.yml` — pushes to Docker Hub on version tags
- All `application.yml` files use `${VAR:default}` env var injection

### What's Missing
- `masova-support/Dockerfile` — needs to be created
- `frontend/firebase.json` — needs to be created
- `frontend/.firebaserc` — needs to be created
- `.github/workflows/deploy.yml` — needs to be created (GCP Cloud Run deploy)
- `.dockerignore` files — need to be created per service for faster builds
- GCP secrets management for env vars

### MongoDB URI per Service
Each service uses a different env var name:
- core-service: `CORE_MONGODB_URI`
- commerce-service: check `commerce-service/src/main/resources/application.yml`
- payment-service: `MONGODB_URI`
- logistics-service: `LOGISTICS_MONGODB_URI`
- intelligence-service: check `intelligence-service/src/main/resources/application.yml`
- api-gateway: no MongoDB (routing only)

### Ports
- api-gateway: 8080
- core-service: 8085
- commerce-service: 8084
- payment-service: 8089
- logistics-service: 8095
- intelligence-service: 8087
- masova-support: 8000

---

## Task 1: masova-support Dockerfile

**Files:**
- Create: `/Users/souravamseekarmarti/Projects/masova-support/Dockerfile`
- Create: `/Users/souravamseekarmarti/Projects/masova-support/.dockerignore`

**Step 1: Read masova-support project structure**
```bash
ls /Users/souravamseekarmarti/Projects/masova-support/
cat /Users/souravamseekarmarti/Projects/masova-support/requirements.txt
```

Note the actual entrypoint — from memory: `uvicorn src.masova_agent.main:app --host 0.0.0.0 --port 8000`
But the actual module path may be `masova_agent.main` (check if there's a `src/` directory or not).

**Step 2: Create Dockerfile**
```dockerfile
FROM python:3.11-slim AS base

WORKDIR /app

# Install dependencies first (better layer caching)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy source
COPY . .

# Non-root user for security
RUN useradd -m -u 1001 masova && chown -R masova:masova /app
USER masova

EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
  CMD python -c "import httpx; httpx.get('http://localhost:8000/health').raise_for_status()"

CMD ["uvicorn", "src.masova_agent.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

Adjust the CMD module path based on what you find in the project structure. If `src/` exists and `masova_agent/main.py` is inside it, use `src.masova_agent.main:app`. Otherwise `masova_agent.main:app`.

**Step 3: Create .dockerignore**
```
__pycache__/
*.pyc
*.pyo
.venv/
venv/
.env
.env.*
*.egg-info/
dist/
build/
.git/
.gitignore
README.md
tests/
*.test.py
```

**Step 4: Verify the Dockerfile builds locally**
```bash
cd /Users/souravamseekarmarti/Projects/masova-support
docker build -t masova-support:test . 2>&1 | tail -10
```
If Docker is not running, skip this step and note it.

**Step 5: Commit in masova-support repo**
```bash
cd /Users/souravamseekarmarti/Projects/masova-support
git add Dockerfile .dockerignore
git commit -m "feat: add Dockerfile and .dockerignore for GCP Cloud Run deployment"
```
NO "Co-Authored-By" trailer.

---

## Task 2: .dockerignore Files for Backend Services

**Files:**
- Create: `.dockerignore` in each of: `api-gateway/`, `core-service/`, `commerce-service/`, `payment-service/`, `logistics-service/`, `intelligence-service/`

**Step 1: Create identical .dockerignore in each service directory**

Content for each:
```
target/
*.md
.git/
.gitignore
src/test/
*.bak
```

This prevents Maven test output and docs from being included in the Docker build context, speeding up `docker build`.

**Step 2: Also add root-level .dockerignore**

Create `/.dockerignore` in the monorepo root:
```
.git/
node_modules/
frontend/node_modules/
*/target/
*.md
docs/
backups/
.env
.env.*
*.bak
*.test.*
```

**Step 3: Commit**
```bash
cd /Users/souravamseekarmarti/Projects/MaSoVa-restaurant-management-system
git add api-gateway/.dockerignore core-service/.dockerignore commerce-service/.dockerignore \
        payment-service/.dockerignore logistics-service/.dockerignore intelligence-service/.dockerignore \
        .dockerignore
git commit -m "chore: add .dockerignore files to all services for faster Docker builds"
```
NO "Co-Authored-By" trailer.

---

## Task 3: Firebase Hosting Setup for Frontend

**Files:**
- Create: `frontend/firebase.json`
- Create: `frontend/.firebaserc`
- Modify: `frontend/vite.config.ts` (if needed for base path)

**Step 1: Read `frontend/vite.config.ts`** to check if `base` is set.

**Step 2: Create `frontend/firebase.json`**
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
          }
        ]
      }
    ]
  }
}
```

**Step 3: Create `frontend/.firebaserc`**
```json
{
  "projects": {
    "default": "masova-app"
  }
}
```

**Step 4: Commit**
```bash
cd /Users/souravamseekarmarti/Projects/MaSoVa-restaurant-management-system
git add frontend/firebase.json frontend/.firebaserc
git commit -m "feat: Firebase Hosting config for web frontend deployment"
```
NO "Co-Authored-By" trailer.

---

## Task 4: Read All service application.yml Files

**Goal:** Confirm exact env var names used for MongoDB URI, Redis, RabbitMQ in every service. This is needed to write the correct Cloud Run env vars in the deploy workflow.

**Step 1: Read all 6 application.yml files**
```
core-service/src/main/resources/application.yml
commerce-service/src/main/resources/application.yml
payment-service/src/main/resources/application.yml
logistics-service/src/main/resources/application.yml
intelligence-service/src/main/resources/application.yml
api-gateway/src/main/resources/application.yml
```

**Step 2: For each service, record:**
- MongoDB URI env var name (e.g. `CORE_MONGODB_URI`, `MONGODB_URI`, etc.)
- Redis env var names
- RabbitMQ env var names
- Any service-specific env vars (Razorpay keys, Google Maps key, etc.)

**Step 3: Write findings to a summary file**
Create `docs/plans/phase5-env-vars.md` with a table like:

```markdown
# Phase 5 — Environment Variables Per Service

| Service | Env Var | Example Value |
|---------|---------|---------------|
| core-service | CORE_MONGODB_URI | mongodb+srv://... |
| core-service | REDIS_HOST | xxx.upstash.io |
| core-service | REDIS_PORT | 6380 |
| ... | ... | ... |
```

**Step 4: Commit**
```bash
git add docs/plans/phase5-env-vars.md
git commit -m "docs: Phase 5 environment variables reference per service"
```
NO "Co-Authored-By" trailer.

---

## Task 5: GitHub Actions Deploy Workflow

**Files:**
- Create: `.github/workflows/deploy.yml`
- Modify: `.github/workflows/ci.yml` (replace placeholder deploy-staging job)

**Step 1: Read `.github/workflows/ci.yml`** and `docs/plans/phase5-env-vars.md` (from Task 4).

**Step 2: Create `.github/workflows/deploy.yml`**

```yaml
name: Deploy to GCP Cloud Run

on:
  push:
    branches: [main]

env:
  PROJECT_ID: masova-app
  REGION: asia-south1
  REGISTRY: asia-south1-docker.pkg.dev

jobs:
  # ============================================================
  # Job 1: Build and push backend service images
  # ============================================================
  build-backend:
    name: Build Backend Images
    runs-on: ubuntu-latest
    strategy:
      matrix:
        service:
          - name: api-gateway
            port: 8080
          - name: core-service
            port: 8085
          - name: commerce-service
            port: 8084
          - name: payment-service
            port: 8089
          - name: logistics-service
            port: 8095
          - name: intelligence-service
            port: 8087
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-java@v4
        with:
          java-version: '21'
          distribution: 'temurin'
          cache: maven

      - name: Build JAR (skip tests — CI already ran them)
        run: mvn package -DskipTests -pl ${{ matrix.service.name }} -am --no-transfer-progress

      - uses: google-github-actions/auth@v2
        with:
          credentials_json: ${{ secrets.GCP_SA_KEY }}

      - uses: google-github-actions/setup-gcloud@v2

      - name: Configure Docker for Artifact Registry
        run: gcloud auth configure-docker ${{ env.REGISTRY }} --quiet

      - name: Build and push image
        run: |
          docker build \
            -t ${{ env.REGISTRY }}/${{ env.PROJECT_ID }}/masova/${{ matrix.service.name }}:${{ github.sha }} \
            -t ${{ env.REGISTRY }}/${{ env.PROJECT_ID }}/masova/${{ matrix.service.name }}:latest \
            ${{ matrix.service.name }}/
          docker push ${{ env.REGISTRY }}/${{ env.PROJECT_ID }}/masova/${{ matrix.service.name }}:${{ github.sha }}
          docker push ${{ env.REGISTRY }}/${{ env.PROJECT_ID }}/masova/${{ matrix.service.name }}:latest

  # ============================================================
  # Job 2: Deploy backend services to Cloud Run
  # ============================================================
  deploy-backend:
    name: Deploy Backend to Cloud Run
    needs: build-backend
    runs-on: ubuntu-latest
    strategy:
      matrix:
        service:
          - name: core-service
            port: 8085
            memory: 512Mi
            min-instances: 1
          - name: commerce-service
            port: 8084
            memory: 512Mi
            min-instances: 0
          - name: payment-service
            port: 8089
            memory: 512Mi
            min-instances: 0
          - name: logistics-service
            port: 8095
            memory: 512Mi
            min-instances: 0
          - name: intelligence-service
            port: 8087
            memory: 256Mi
            min-instances: 0
          - name: api-gateway
            port: 8080
            memory: 256Mi
            min-instances: 1
    steps:
      - uses: google-github-actions/auth@v2
        with:
          credentials_json: ${{ secrets.GCP_SA_KEY }}

      - uses: google-github-actions/setup-gcloud@v2

      - name: Deploy ${{ matrix.service.name }}
        run: |
          gcloud run deploy ${{ matrix.service.name }} \
            --image ${{ env.REGISTRY }}/${{ env.PROJECT_ID }}/masova/${{ matrix.service.name }}:${{ github.sha }} \
            --region ${{ env.REGION }} \
            --platform managed \
            --allow-unauthenticated \
            --port ${{ matrix.service.port }} \
            --memory ${{ matrix.service.memory }} \
            --cpu 1 \
            --min-instances ${{ matrix.service.min-instances }} \
            --max-instances 3 \
            --timeout 60 \
            --update-secrets \
              JWT_SECRET=masova-jwt-secret:latest,\
              RABBITMQ_USERNAME=masova-rabbitmq-user:latest,\
              RABBITMQ_PASSWORD=masova-rabbitmq-pass:latest \
            --update-env-vars \
              SPRING_DATA_MONGODB_URI=$${{ secrets.MONGODB_URI_${{ matrix.service.name }} }},\
              SPRING_REDIS_HOST=${{ secrets.UPSTASH_REDIS_HOST }},\
              SPRING_REDIS_PORT=6380,\
              SPRING_REDIS_SSL=true,\
              SPRING_REDIS_PASSWORD=${{ secrets.UPSTASH_REDIS_TOKEN }},\
              SPRING_RABBITMQ_HOST=${{ secrets.CLOUDAMQP_HOST }},\
              CORE_SERVICE_URL=https://core-service-${{ env.PROJECT_ID }}.run.app

  # ============================================================
  # Job 3: Deploy frontend to Firebase Hosting
  # ============================================================
  deploy-frontend:
    name: Deploy Frontend to Firebase
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: frontend/package-lock.json

      - name: Install and build
        run: cd frontend && npm ci && npm run build
        env:
          VITE_API_BASE_URL: https://api.masova.app
          VITE_AGENT_URL: https://agent.masova.app

      - uses: FirebaseExtended/action-hosting-deploy@v0
        with:
          repoToken: ${{ secrets.GITHUB_TOKEN }}
          firebaseServiceAccount: ${{ secrets.FIREBASE_SERVICE_ACCOUNT }}
          channelId: live
          projectId: masova-app
          entryPoint: frontend
```

**Step 3: Update the placeholder in `ci.yml`**

Find the `deploy-staging` job in `ci.yml`. Replace the placeholder `run: echo "Deploy to staging..."` with:
```yaml
      - name: Trigger deploy workflow
        run: echo "Deploy triggered — see deploy.yml workflow for Cloud Run deployment"
```

**Step 4: Commit**
```bash
cd /Users/souravamseekarmarti/Projects/MaSoVa-restaurant-management-system
git add .github/workflows/deploy.yml .github/workflows/ci.yml
git commit -m "feat: GCP Cloud Run + Firebase deploy workflow via GitHub Actions"
```
NO "Co-Authored-By" trailer.

---

## Task 6: Backend Service Dockerfile Improvements

**Goal:** Improve existing Dockerfiles to use multi-stage builds (smaller images, faster deploys) and add health checks.

**Step 1: Read one existing Dockerfile** (e.g. `core-service/Dockerfile`) to understand current format.

**Step 2: Update each service Dockerfile to multi-stage**

Standard template for all 6 Spring Boot services:
```dockerfile
# Stage 1: Build
FROM eclipse-temurin:21-jdk-alpine AS build
WORKDIR /build
COPY pom.xml .
COPY src ./src
# Copy shared modules if needed
COPY ../shared-models /shared-models 2>/dev/null || true
COPY ../shared-security /shared-security 2>/dev/null || true
RUN ./mvnw package -DskipTests --no-transfer-progress 2>/dev/null || \
    mvn package -DskipTests --no-transfer-progress

# Stage 2: Runtime (minimal image)
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

# Non-root user
RUN addgroup -S masova && adduser -S masova -G masova
USER masova

COPY --from=build /build/target/*.jar app.jar

# JVM tuning for containers
ENV JAVA_OPTS="-XX:MaxRAMPercentage=75 -XX:+UseContainerSupport -Djava.security.egd=file:/dev/./urandom"

EXPOSE ${PORT:-8080}

HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD wget -qO- http://localhost:${PORT:-8080}/actuator/health || exit 1

ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]
```

**IMPORTANT**: The existing Dockerfiles may already be good. Read them first. Only update if they:
- Use a single-stage build (no `AS build` stage) — adds ~500MB to image
- Don't have a health check
- Run as root

If they're already multi-stage with health checks, skip this task.

**Step 3: Commit if changes made**
```bash
git add api-gateway/Dockerfile core-service/Dockerfile commerce-service/Dockerfile \
        payment-service/Dockerfile logistics-service/Dockerfile intelligence-service/Dockerfile
git commit -m "chore: improve backend Dockerfiles — multi-stage builds, health checks, non-root user"
```
NO "Co-Authored-By" trailer. Skip commit if no changes.

---

## Task 7: GCP Setup Documentation

**Goal:** Create a step-by-step human-readable setup guide that documents exactly what to click/run once to set up GCP for the first time. This is not automated — it's a reference doc.

**Files:**
- Create: `docs/project/DEPLOYMENT/GCP-SETUP.md`

**Content:**

```markdown
# GCP One-Time Setup Guide

## Prerequisites
- Google Cloud account with AI Pro subscription ($10/month credit active)
- `gcloud` CLI installed: `brew install google-cloud-sdk`
- `firebase` CLI installed: `npm install -g firebase-tools`

## Step 1: Create GCP Project
```bash
gcloud projects create masova-app --name="MaSoVa Restaurant"
gcloud config set project masova-app
gcloud beta billing accounts list  # find your billing account ID
gcloud beta billing projects link masova-app --billing-account=XXXXXX-XXXXXX-XXXXXX
```

## Step 2: Enable Required APIs
```bash
gcloud services enable \
  run.googleapis.com \
  cloudbuild.googleapis.com \
  artifactregistry.googleapis.com \
  secretmanager.googleapis.com \
  dns.googleapis.com
```

## Step 3: Create Artifact Registry Repository
```bash
gcloud artifacts repositories create masova \
  --repository-format=docker \
  --location=asia-south1 \
  --description="MaSoVa Docker images"
```

## Step 4: Create GitHub Actions Service Account
```bash
gcloud iam service-accounts create masova-deploy \
  --display-name="MaSoVa GitHub Actions Deploy"

PROJECT_ID=masova-app
SA=masova-deploy@masova-app.iam.gserviceaccount.com

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:$SA" \
  --role="roles/run.admin"

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:$SA" \
  --role="roles/artifactregistry.writer"

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:$SA" \
  --role="roles/cloudbuild.builds.editor"

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:$SA" \
  --role="roles/secretmanager.secretAccessor"

# Download key for GitHub secret
gcloud iam service-accounts keys create gcp-sa-key.json \
  --iam-account=$SA
```
Add contents of `gcp-sa-key.json` as GitHub secret `GCP_SA_KEY`. Delete the file after.

## Step 5: Create GCP Secrets
```bash
echo -n "your-64-char-jwt-secret" | gcloud secrets create masova-jwt-secret --data-file=-
echo -n "masova" | gcloud secrets create masova-rabbitmq-user --data-file=-
echo -n "masova_secret" | gcloud secrets create masova-rabbitmq-pass --data-file=-
```

## Step 6: MongoDB Atlas M0 (Free)
1. Go to https://cloud.mongodb.com → Create free M0 cluster
2. Choose region: Mumbai (ap-south-1)
3. Database user: `masova` / generate strong password
4. Network access: Add `0.0.0.0/0` (Cloud Run uses dynamic IPs)
5. Get connection string: `mongodb+srv://masova:<password>@cluster0.xxxxx.mongodb.net/`
6. Add GitHub secrets for each service:
   - `MONGODB_URI_CORE_SERVICE` = `...mongodb.net/masova_core`
   - `MONGODB_URI_COMMERCE_SERVICE` = `...mongodb.net/masova_commerce`
   - `MONGODB_URI_PAYMENT_SERVICE` = `...mongodb.net/masova_payment`
   - `MONGODB_URI_LOGISTICS_SERVICE` = `...mongodb.net/masova_logistics`
   - `MONGODB_URI_INTELLIGENCE_SERVICE` = `...mongodb.net/masova_analytics`

## Step 7: Upstash Redis (Free)
1. Go to https://upstash.com → Create free Redis database
2. Region: ap-south-1 (Mumbai)
3. Enable TLS
4. Copy: Endpoint, Port (6380), Password/Token
5. Add GitHub secrets: `UPSTASH_REDIS_HOST`, `UPSTASH_REDIS_TOKEN`

## Step 8: CloudAMQP RabbitMQ (Free)
1. Go to https://www.cloudamqp.com → Create Little Lemur instance (free)
2. Region: Google Compute Engine / asia-south1
3. Copy AMQP URL: `amqps://user:pass@hostname/vhost`
4. Parse out: host, username, password
5. Add GitHub secrets: `CLOUDAMQP_HOST`, `RABBITMQ_USERNAME`, `RABBITMQ_PASSWORD`

## Step 9: Firebase Hosting
```bash
cd frontend
firebase login
firebase use masova-app
firebase init hosting
# public directory: dist
# single-page app: yes
# overwrite index.html: no
```
Add `FIREBASE_SERVICE_ACCOUNT` GitHub secret from Firebase console → Project Settings → Service Accounts.

## Step 10: Custom Domain (Optional)
```bash
# Point masova.app to Firebase Hosting
firebase hosting:channel:deploy live

# Map api.masova.app to API Gateway Cloud Run service URL
gcloud run domain-mappings create \
  --service api-gateway \
  --domain api.masova.app \
  --region asia-south1
```

## Step 11: Budget Alert
Google Cloud Console → Billing → Budgets & alerts → Create:
- Budget: $10/month
- Alert thresholds: 50%, 80%, 100%
- Email: your email

## Secrets Summary (GitHub Repository Secrets)
| Secret Name | Description |
|-------------|-------------|
| `GCP_SA_KEY` | Service account JSON key |
| `FIREBASE_SERVICE_ACCOUNT` | Firebase service account JSON |
| `MONGODB_URI_CORE_SERVICE` | Atlas URI for core DB |
| `MONGODB_URI_COMMERCE_SERVICE` | Atlas URI for commerce DB |
| `MONGODB_URI_PAYMENT_SERVICE` | Atlas URI for payment DB |
| `MONGODB_URI_LOGISTICS_SERVICE` | Atlas URI for logistics DB |
| `MONGODB_URI_INTELLIGENCE_SERVICE` | Atlas URI for analytics DB |
| `UPSTASH_REDIS_HOST` | Upstash Redis endpoint |
| `UPSTASH_REDIS_TOKEN` | Upstash Redis password |
| `CLOUDAMQP_HOST` | CloudAMQP AMQP hostname |
| `RAZORPAY_KEY_ID` | Razorpay API key |
| `RAZORPAY_KEY_SECRET` | Razorpay secret |
| `GOOGLE_MAPS_API_KEY` | Google Maps API key |
| `BREVO_API_KEY` | Brevo email API key |
```

**Step: Commit**
```bash
git add docs/project/DEPLOYMENT/GCP-SETUP.md
git commit -m "docs: GCP one-time setup guide — Cloud Run, Firebase, Atlas, Upstash, CloudAMQP"
```
NO "Co-Authored-By" trailer.

---

## Task 8: Expo EAS Mobile Build Config

**Files:**
- Modify: `/Users/souravamseekarmarti/Projects/masova-mobile/app.json` (or `app.config.ts`)
- Create: `/Users/souravamseekarmarti/Projects/masova-mobile/eas.json`
- Modify: `/Users/souravamseekarmarti/Projects/MaSoVaDriverApp/app.json`
- Create: `/Users/souravamseekarmarti/Projects/MaSoVaDriverApp/eas.json`

**Step 1: Read both app.json files**

**Step 2: Update `extra.apiUrl` in both app.json files**

In masova-mobile `app.json`, find or add under `expo.extra`:
```json
"extra": {
  "apiUrl": "https://api.masova.app",
  "agentUrl": "https://agent.masova.app"
}
```

In MaSoVaDriverApp `app.json`, same pattern.

**Step 3: Create `eas.json` in masova-mobile**
```json
{
  "cli": {
    "version": ">= 12.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal",
      "env": {
        "EXPO_PUBLIC_API_URL": "https://api.masova.app",
        "EXPO_PUBLIC_AGENT_URL": "https://agent.masova.app"
      }
    },
    "production": {
      "env": {
        "EXPO_PUBLIC_API_URL": "https://api.masova.app",
        "EXPO_PUBLIC_AGENT_URL": "https://agent.masova.app"
      }
    }
  },
  "submit": {
    "production": {}
  }
}
```

**Step 4: Create `eas.json` in MaSoVaDriverApp** (same content, different bundle ID)

**Step 5: Commit both repos**
```bash
cd /Users/souravamseekarmarti/Projects/masova-mobile
git add app.json eas.json
git commit -m "feat: EAS build config — production API URLs for GCP deployment"

cd /Users/souravamseekarmarti/Projects/MaSoVaDriverApp
git add app.json eas.json
git commit -m "feat: EAS build config — production API URLs for GCP deployment"
```
NO "Co-Authored-By" trailers.

---

## Notes for Implementer

1. **Don't need Docker running locally** — all Docker builds happen in GitHub Actions via Cloud Build. Just create the files correctly.
2. **masova-support module path** — check if `main.py` is at `src/masova_agent/main.py` or `masova_agent/main.py`. The CMD in the Dockerfile must match.
3. **Existing Dockerfiles** — read before replacing. If they're already multi-stage with health checks, skip Task 6.
4. **Task 4 is critical** — the exact MongoDB env var names differ per service. Get them right before writing the deploy workflow.
5. **GCP-SETUP.md is documentation only** — no code to run, just write the file.
6. **`deploy.yml` uses matrix strategy** — 6 parallel build jobs, then 6 parallel deploy jobs. This is faster than sequential.
7. **`min-instances: 1`** for api-gateway and core-service — these are on the critical path, cold starts hurt. All others can be 0 (scale-to-zero).
