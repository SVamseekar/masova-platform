# GitHub Actions Secrets

Set these at: **GitHub → Settings → Secrets and variables → Actions → New repository secret**

## GCP / Deployment

| Secret | Where to get it |
|---|---|
| `GCP_SA_KEY` | GCP → IAM → Service Accounts → your SA → Keys → Add Key (JSON) |
| `FIREBASE_SERVICE_ACCOUNT` | Firebase → Project Settings → Service Accounts → Generate new private key |

## Database / Infrastructure

| Secret | Where to get it |
|---|---|
| `MONGODB_URI_CORE_SERVICE` | MongoDB Atlas → Connect → connection string |
| `MONGODB_URI_COMMERCE_SERVICE` | MongoDB Atlas → Connect → connection string |
| `MONGODB_URI_PAYMENT_SERVICE` | MongoDB Atlas → Connect → connection string |
| `MONGODB_URI_LOGISTICS_SERVICE` | MongoDB Atlas → Connect → connection string |
| `MONGODB_URI_INTELLIGENCE_SERVICE` | MongoDB Atlas → Connect → connection string |
| `UPSTASH_REDIS_HOST` | Upstash → Redis → Details → Endpoint |
| `UPSTASH_REDIS_TOKEN` | Upstash → Redis → Details → Token |
| `UPSTASH_REDIS_URL` | Upstash → Redis → Details → REST URL |
| `CLOUDAMQP_HOST` | CloudAMQP → Details → Server |
| `CLOUDAMQP_USERNAME` | CloudAMQP → Details → User & Vhost |
| `CLOUDAMQP_PASSWORD` | CloudAMQP → Details → Password |
| `CLOUDAMQP_VHOST` | CloudAMQP → Details → Vhost |

## Application

| Secret | Where to get it |
|---|---|
| `JWT_SECRET` | Generate: `openssl rand -base64 64` |
| `RAZORPAY_KEY_ID` | Razorpay Dashboard → API Keys |
| `RAZORPAY_KEY_SECRET` | Razorpay Dashboard → API Keys |
| `GOOGLE_MAPS_API_KEY` | GCP → APIs & Services → Credentials |
| `GOOGLE_OAUTH_CLIENT_ID` | GCP → APIs & Services → Credentials → OAuth 2.0 |
| `BREVO_API_KEY` | Brevo → Settings → API Keys |
| `GOOGLE_GENAI_API_KEY` | Google AI Studio → API Keys |

## Repo Access

| Secret | Where to get it |
|---|---|
| `AGENT_REPO_TOKEN` | GitHub → Settings → Developer settings → PAT → with `repo` scope (for masova-support repo access) |
