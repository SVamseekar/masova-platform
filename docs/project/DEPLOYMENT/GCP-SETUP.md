# GCP One-Time Setup Guide

> This guide covers the one-time manual steps needed to set up the GCP infrastructure for MaSoVa. After completing this, GitHub Actions (`.github/workflows/deploy.yml`) handles all future deployments automatically on every push to `main`.

## Prerequisites

- Google Cloud account with AI Pro subscription ($10/month credit active)
- `gcloud` CLI: `brew install google-cloud-sdk`
- `firebase` CLI: `npm install -g firebase-tools`
- GitHub repository admin access (to add secrets)

---

## Step 1: Create GCP Project

```bash
gcloud projects create masova-app --name="MaSoVa Restaurant"
gcloud config set project masova-app
gcloud beta billing accounts list        # find your billing account ID
gcloud beta billing projects link masova-app --billing-account=XXXXXX-XXXXXX-XXXXXX
```

---

## Step 2: Enable Required APIs

```bash
gcloud services enable \
  run.googleapis.com \
  cloudbuild.googleapis.com \
  artifactregistry.googleapis.com \
  secretmanager.googleapis.com \
  dns.googleapis.com
```

---

## Step 3: Create Artifact Registry Repository

```bash
gcloud artifacts repositories create masova \
  --repository-format=docker \
  --location=asia-south1 \
  --description="MaSoVa Docker images"
```

Images will be stored at: `asia-south1-docker.pkg.dev/masova-app/masova/<service-name>`

---

## Step 4: Create GitHub Actions Service Account

```bash
gcloud iam service-accounts create masova-deploy \
  --display-name="MaSoVa GitHub Actions Deploy"

PROJECT_ID=masova-app
SA=masova-deploy@masova-app.iam.gserviceaccount.com

# Grant required roles
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:$SA" --role="roles/run.admin"

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:$SA" --role="roles/artifactregistry.writer"

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:$SA" --role="roles/iam.serviceAccountUser"

# Download key for GitHub secret
gcloud iam service-accounts keys create gcp-sa-key.json --iam-account=$SA
```

Add the contents of `gcp-sa-key.json` as GitHub repository secret `GCP_SA_KEY`.
**Delete the file immediately after:** `rm gcp-sa-key.json`

---

## Step 5: MongoDB Atlas M0 (Free — 512MB)

1. Go to https://cloud.mongodb.com → Create **free M0 cluster**
2. Choose region: **Mumbai (ap-south-1)** (closest to Cloud Run asia-south1)
3. Create database user: `masova` / strong generated password
4. Network access: Add `0.0.0.0/0` (Cloud Run uses dynamic IPs)
5. Get connection string: `mongodb+srv://masova:<password>@cluster0.xxxxx.mongodb.net/`

Add these GitHub secrets (each pointing to a different database in the same cluster):

| Secret | Value |
|--------|-------|
| `MONGODB_URI_CORE_SERVICE` | `...mongodb.net/masova_core?retryWrites=true&w=majority` |
| `MONGODB_URI_COMMERCE_SERVICE` | `...mongodb.net/masova_commerce?retryWrites=true&w=majority` |
| `MONGODB_URI_PAYMENT_SERVICE` | `...mongodb.net/masova_payment?retryWrites=true&w=majority` |
| `MONGODB_URI_LOGISTICS_SERVICE` | `...mongodb.net/masova_logistics?retryWrites=true&w=majority` |
| `MONGODB_URI_INTELLIGENCE_SERVICE` | `...mongodb.net/masova_analytics?retryWrites=true&w=majority` |

> Note: Each service uses a different env var name for its MongoDB URI. See `docs/plans/phase5-env-vars.md` for the full mapping. The `deploy.yml` workflow maps each secret to the correct var name per service.

---

## Step 6: Upstash Redis (Free — 10K commands/day)

1. Go to https://upstash.com → Create free **Redis** database
2. Region: **ap-south-1** (Mumbai)
3. Enable **TLS** (required — port 6380)
4. Copy: Endpoint, Port (6380), Password

Add GitHub secrets:

| Secret | Value |
|--------|-------|
| `UPSTASH_REDIS_HOST` | `xxx.upstash.io` |
| `UPSTASH_REDIS_TOKEN` | Redis password |
| `UPSTASH_REDIS_URL` | `rediss://:password@xxx.upstash.io:6380` (for masova-support) |

---

## Step 7: CloudAMQP RabbitMQ (Free — 1M messages/month)

1. Go to https://www.cloudamqp.com → Create **Little Lemur** instance (free)
2. Region: **Google Compute Engine / asia-south1**
3. Copy the AMQP URL: `amqps://user:pass@hostname/vhost`

Parse out and add GitHub secrets:

| Secret | Value |
|--------|-------|
| `CLOUDAMQP_HOST` | `hostname` from AMQP URL |
| `CLOUDAMQP_USERNAME` | username from AMQP URL |
| `CLOUDAMQP_PASSWORD` | password from AMQP URL |
| `CLOUDAMQP_VHOST` | vhost from AMQP URL |

---

## Step 8: Firebase Hosting Setup

```bash
cd /path/to/MaSoVa-restaurant-management-system/frontend
firebase login
firebase use masova-app
```

Get the Firebase service account:
1. Firebase Console → Project Settings → Service Accounts
2. Generate new private key → download JSON
3. Add as GitHub secret `FIREBASE_SERVICE_ACCOUNT` (paste full JSON)

---

## Step 9: App-Specific Secrets

Add these GitHub secrets from your existing accounts:

| Secret | Where to find it |
|--------|-----------------|
| `JWT_SECRET` | Generate: `openssl rand -base64 64` |
| `RAZORPAY_KEY_ID` | Razorpay Dashboard → API Keys |
| `RAZORPAY_KEY_SECRET` | Razorpay Dashboard → API Keys |
| `GOOGLE_MAPS_API_KEY` | GCP Console → APIs & Services → Credentials |
| `BREVO_API_KEY` | Brevo Dashboard → SMTP & API → API Keys |
| `GOOGLE_OAUTH_CLIENT_ID` | GCP Console → APIs & Services → OAuth 2.0 Client IDs |
| `GOOGLE_GENAI_API_KEY` | Google AI Studio → API Keys (for masova-support Gemini) |
| `AGENT_REPO_TOKEN` | GitHub → Developer Settings → Personal Access Token (repo scope, for masova-support repo access) |

---

## Step 10: Custom Domain (Optional)

Point `masova.app` to Firebase Hosting:
```bash
firebase hosting:channel:deploy live
# Then add the DNS records Firebase provides to your domain registrar
```

Map `api.masova.app` to the API Gateway Cloud Run service:
```bash
gcloud run domain-mappings create \
  --service api-gateway \
  --domain api.masova.app \
  --region asia-south1
```

Map `agent.masova.app` to masova-support:
```bash
gcloud run domain-mappings create \
  --service masova-support \
  --domain agent.masova.app \
  --region asia-south1
```

---

## Step 11: Budget Alert (Prevent Overage)

GCP Console → Billing → **Budgets & Alerts** → Create budget:
- Budget amount: **$10/month**
- Alert thresholds: 50%, 80%, 100%
- Email alerts to your email address

---

## First Deploy

Once all secrets are in place, push to `main`:
```bash
git push origin main
```

The `deploy.yml` workflow will:
1. Build all 6 Spring Boot JARs (parallel matrix)
2. Push Docker images to Artifact Registry
3. Deploy to Cloud Run (6 services + masova-support)
4. Build and deploy frontend to Firebase Hosting

Total expected duration: ~8–12 minutes.

---

## All GitHub Secrets Checklist

| Secret | Required For |
|--------|-------------|
| `GCP_SA_KEY` | All Cloud Run deploys |
| `FIREBASE_SERVICE_ACCOUNT` | Frontend Firebase deploy |
| `AGENT_REPO_TOKEN` | masova-support checkout |
| `MONGODB_URI_CORE_SERVICE` | core-service |
| `MONGODB_URI_COMMERCE_SERVICE` | commerce-service |
| `MONGODB_URI_PAYMENT_SERVICE` | payment-service |
| `MONGODB_URI_LOGISTICS_SERVICE` | logistics-service |
| `MONGODB_URI_INTELLIGENCE_SERVICE` | intelligence-service |
| `JWT_SECRET` | All backend services |
| `UPSTASH_REDIS_HOST` | All backend services |
| `UPSTASH_REDIS_TOKEN` | All backend services |
| `UPSTASH_REDIS_URL` | masova-support |
| `CLOUDAMQP_HOST` | All backend services |
| `CLOUDAMQP_USERNAME` | All backend services |
| `CLOUDAMQP_PASSWORD` | All backend services |
| `CLOUDAMQP_VHOST` | All backend services |
| `RAZORPAY_KEY_ID` | payment-service |
| `RAZORPAY_KEY_SECRET` | payment-service |
| `GOOGLE_MAPS_API_KEY` | logistics-service |
| `BREVO_API_KEY` | core-service |
| `GOOGLE_OAUTH_CLIENT_ID` | core-service |
| `GOOGLE_GENAI_API_KEY` | masova-support |
