# Phase 5 — Environment Variables Per Service

Generated: 2026-02-21  
Extracted from each service's `src/main/resources/application.yml`.

---

## Summary Table

| Service | Env Var Name | Default / Example Value | Notes |
|---------|-------------|------------------------|-------|
| **core-service** | `CORE_MONGODB_URI` | `mongodb://localhost:27017/masova_core` | MongoDB URI |
| core-service | `REDIS_HOST` | `localhost` | Redis host (shared var) |
| core-service | `REDIS_PORT` | `6379` | Redis port (shared var) |
| core-service | `RABBITMQ_HOST` | `localhost` | RabbitMQ host (shared var) |
| core-service | `RABBITMQ_PORT` | `5672` | RabbitMQ port (shared var) |
| core-service | `RABBITMQ_USERNAME` | `masova` | RabbitMQ username (shared var) |
| core-service | `RABBITMQ_PASSWORD` | `masova_secret` | RabbitMQ password (shared var) |
| core-service | `RABBITMQ_VHOST` | `/` | RabbitMQ virtual host (shared var) |
| core-service | `JWT_SECRET` | *(long dev key)* | JWT signing secret (shared var) |
| core-service | `GOOGLE_OAUTH_CLIENT_ID` | *(empty)* | Google OAuth 2.0 client ID |
| core-service | `ORDER_SERVICE_URL` | `http://localhost:8084` | Outbound URL to commerce-service |
| core-service | `DELIVERY_SERVICE_URL` | `http://localhost:8086` | Outbound URL to logistics-service |
| core-service | `PAYMENT_SERVICE_URL` | `http://localhost:8089` | Outbound URL to payment-service |
| core-service | `CORE_SERVICE_URL` | `http://localhost:8085` | Self-referential (customer alias) |
| core-service | `FIREBASE_CREDENTIALS_PATH` | *(empty)* | Path to Firebase service-account JSON |
| core-service | `FIREBASE_ENABLED` | `false` | Feature flag for Firebase push |
| core-service | `TWILIO_ACCOUNT_SID` | *(empty)* | Twilio SID for SMS |
| core-service | `TWILIO_AUTH_TOKEN` | *(empty)* | Twilio auth token |
| core-service | `TWILIO_PHONE_NUMBER` | *(empty)* | Twilio sender phone number |
| core-service | `TWILIO_ENABLED` | `false` | Feature flag for SMS |
| core-service | `RETENTION_ENABLED` | `false` | Enable data retention scheduler |
| core-service | `RETENTION_DRY_RUN` | `true` | Dry-run mode for retention |
| core-service | `FRONTEND_URL` | `http://localhost:3000` | Frontend base URL |
| core-service | `FRONTEND_BASE_URL` | `http://localhost:3000` | Alias for FRONTEND_URL |
| core-service | `RATING_ENABLED` | `true` | Feature flag for ratings |
| core-service | `BREVO_API_KEY` | *(empty)* | Brevo (Sendinblue) email API key |
| core-service | `BREVO_SENDER_EMAIL` | `noreply@masova.com` | Email sender address |
| core-service | `BREVO_SENDER_NAME` | `MaSoVa Restaurant` | Email sender display name |
| **commerce-service** | `MENU_MONGODB_URI` | `mongodb://localhost:27017/masova_commerce` | Primary MongoDB URI |
| commerce-service | `ORDERS_MONGODB_URI` | `mongodb://localhost:27017/masova_commerce` | Secondary MongoDB URI (orders) |
| commerce-service | `REDIS_HOST` | `localhost` | Redis host (shared var) |
| commerce-service | `REDIS_PORT` | `6379` | Redis port (shared var) |
| commerce-service | `RABBITMQ_HOST` | `localhost` | RabbitMQ host (shared var) |
| commerce-service | `RABBITMQ_PORT` | `5672` | RabbitMQ port (shared var) |
| commerce-service | `RABBITMQ_USERNAME` | `masova` | RabbitMQ username (shared var) |
| commerce-service | `RABBITMQ_PASSWORD` | `masova_secret` | RabbitMQ password (shared var) |
| commerce-service | `RABBITMQ_VHOST` | `/` | RabbitMQ virtual host (shared var) |
| commerce-service | `MONGO_POOL_MIN_SIZE` | `10` | MongoDB connection pool min |
| commerce-service | `MONGO_POOL_MAX_SIZE` | `100` | MongoDB connection pool max |
| commerce-service | `MONGO_POOL_MAX_WAIT_MS` | `30000` | MongoDB max wait time (ms) |
| commerce-service | `MONGO_POOL_MAX_IDLE_MS` | `60000` | MongoDB max idle time (ms) |
| commerce-service | `MONGO_POOL_MAX_LIFE_MS` | `0` | MongoDB max connection life (ms) |
| commerce-service | `JWT_SECRET` | *(long dev key)* | JWT signing secret (shared var) |
| commerce-service | `DELIVERY_SERVICE_URL` | `http://localhost:8086` | Outbound URL to logistics-service |
| commerce-service | `CUSTOMER_SERVICE_URL` | `http://localhost:8085` | Outbound URL to core-service |
| commerce-service | `NOTIFICATION_SERVICE_URL` | `http://localhost:8085` | Outbound URL to core-service (notifications) |
| commerce-service | `USER_SERVICE_URL` | `http://localhost:8085` | Outbound URL to core-service (users) |
| commerce-service | `CORE_SERVICE_URL` | `http://localhost:8085` | Alias for core-service URL |
| commerce-service | `TAX_DEFAULT_GST` | `5.0` | Default GST percentage |
| commerce-service | `TAX_AC_RESTAURANT` | `5.0` | GST for AC restaurants |
| commerce-service | `TAX_NON_AC_RESTAURANT` | `5.0` | GST for non-AC restaurants |
| commerce-service | `TAX_DELIVERY_SERVICE` | `0.0` | Tax on delivery service |
| commerce-service | `TAX_PACKAGING` | `18.0` | Packaging tax percentage |
| commerce-service | `PREP_BASE_TIME` | `15` | Base prep time in minutes |
| commerce-service | `PREP_PER_ITEM` | `5` | Additional minutes per item |
| commerce-service | `PREP_RUSH_MULTIPLIER` | `1.5` | Rush-hour prep time multiplier |
| commerce-service | `PREP_MAX_TIME` | `120` | Maximum prep time cap (minutes) |
| commerce-service | `PREP_MIN_TIME` | `10` | Minimum prep time floor (minutes) |
| commerce-service | `PREP_RUSH_START` | `12` | Lunch rush start hour (24h) |
| commerce-service | `PREP_RUSH_END` | `14` | Lunch rush end hour (24h) |
| commerce-service | `PREP_EVENING_RUSH_START` | `19` | Evening rush start hour (24h) |
| commerce-service | `PREP_EVENING_RUSH_END` | `21` | Evening rush end hour (24h) |
| commerce-service | `DELIVERY_BASE_FEE` | `50.0` | Base delivery fee (INR) |
| commerce-service | `DELIVERY_FREE_THRESHOLD` | `500.0` | Order value for free delivery (INR) |
| commerce-service | `DELIVERY_PER_KM` | `5.0` | Per-km delivery charge (INR) |
| commerce-service | `DELIVERY_BASE_DISTANCE` | `3.0` | Free base distance (km) |
| commerce-service | `FRONTEND_URL` | `https://masova-restaurant.vercel.app` | Frontend base URL |
| commerce-service | `FRONTEND_BASE_URL` | `https://masova-restaurant.vercel.app` | Alias for FRONTEND_URL |
| **payment-service** | `MONGODB_URI` | `mongodb://localhost:27017/masova_payment` | MongoDB URI |
| payment-service | `JWT_SECRET` | *(long dev key)* | JWT signing secret (shared var) |
| payment-service | `RAZORPAY_KEY_ID` | `rzp_test_RjYYkXMmoArj4C` | Razorpay key ID (test key in default) |
| payment-service | `RAZORPAY_KEY_SECRET` | `Asbe0hf12kZn0VSX4ykn3Nvq` | Razorpay key secret (test secret in default) |
| payment-service | `RAZORPAY_WEBHOOK_SECRET` | `whsec_YOUR_WEBHOOK_SECRET_HERE` | Razorpay webhook HMAC secret |
| payment-service | `RABBITMQ_HOST` | `localhost` | RabbitMQ host (shared var) |
| payment-service | `RABBITMQ_PORT` | `5672` | RabbitMQ port (shared var) |
| payment-service | `RABBITMQ_USERNAME` | `masova` | RabbitMQ username (shared var) |
| payment-service | `RABBITMQ_PASSWORD` | `masova_secret` | RabbitMQ password (shared var) |
| payment-service | `RABBITMQ_VHOST` | `/` | RabbitMQ virtual host (shared var) |
| payment-service | `ORDER_SERVICE_URL` | `http://localhost:8084` | Outbound URL to commerce-service |
| payment-service | `NOTIFICATION_SERVICE_URL` | `http://localhost:8085` | Outbound URL to core-service |
| payment-service | `REDIS_HOST` | *(no default — prod profile only)* | Redis host (prod profile) |
| payment-service | `REDIS_PASSWORD` | *(no default — prod profile only)* | Redis password (prod profile) |
| **logistics-service** | `LOGISTICS_MONGODB_URI` | `mongodb://localhost:27017/masova_logistics` | MongoDB URI |
| logistics-service | `REDIS_HOST` | `localhost` | Redis host (shared var) |
| logistics-service | `REDIS_PORT` | `6379` | Redis port (shared var) |
| logistics-service | `RABBITMQ_HOST` | `localhost` | RabbitMQ host (shared var) |
| logistics-service | `RABBITMQ_PORT` | `5672` | RabbitMQ port (shared var) |
| logistics-service | `RABBITMQ_USERNAME` | `masova` | RabbitMQ username (shared var) |
| logistics-service | `RABBITMQ_PASSWORD` | `masova_secret` | RabbitMQ password (shared var) |
| logistics-service | `RABBITMQ_VHOST` | `/` | RabbitMQ virtual host (shared var) |
| logistics-service | `JWT_SECRET` | *(long dev key)* | JWT signing secret (shared var) |
| logistics-service | `GOOGLE_MAPS_API_KEY` | *(empty)* | Google Maps Directions/Geocoding key |
| logistics-service | `OSRM_URL` | `https://router.project-osrm.org` | OSRM routing engine URL |
| logistics-service | `NOMINATIM_URL` | `https://nominatim.openstreetmap.org` | Nominatim geocoding URL |
| logistics-service | `USER_SERVICE_URL` | `http://localhost:8085` | Outbound URL to core-service |
| logistics-service | `ORDER_SERVICE_URL` | `http://localhost:8084` | Outbound URL to commerce-service |
| **intelligence-service** | `ANALYTICS_MONGODB_URI` | `mongodb://localhost:27017/masova_analytics` | MongoDB URI |
| intelligence-service | `REDIS_HOST` | `localhost` | Redis host (shared var) |
| intelligence-service | `REDIS_PORT` | `6379` | Redis port (shared var) |
| intelligence-service | `RABBITMQ_HOST` | `localhost` | RabbitMQ host (shared var) |
| intelligence-service | `RABBITMQ_PORT` | `5672` | RabbitMQ port (shared var) |
| intelligence-service | `RABBITMQ_USERNAME` | `masova` | RabbitMQ username (shared var) |
| intelligence-service | `RABBITMQ_PASSWORD` | `masova_secret` | RabbitMQ password (shared var) |
| intelligence-service | `RABBITMQ_VHOST` | `/` | RabbitMQ virtual host (shared var) |
| intelligence-service | `JWT_SECRET` | *(long dev key)* | JWT signing secret (shared var) |
| intelligence-service | `ORDER_SERVICE_URL` | `http://localhost:8084` | Outbound URL to commerce-service |
| intelligence-service | `CUSTOMER_SERVICE_URL` | `http://localhost:8085` | Outbound URL to core-service |
| intelligence-service | `USER_SERVICE_URL` | `http://localhost:8085` | Outbound URL to core-service (users) |
| intelligence-service | `INVENTORY_SERVICE_URL` | `http://localhost:8086` | Outbound URL to logistics-service |
| **api-gateway** | `JWT_SECRET` | *(long dev key)* | JWT signing secret (shared var) |
| api-gateway | `CORE_SERVICE_URL` | `http://localhost:8085` | Upstream core-service |
| api-gateway | `COMMERCE_SERVICE_URL` | `http://localhost:8084` | Upstream commerce-service |
| api-gateway | `PAYMENT_SERVICE_URL` | `http://localhost:8089` | Upstream payment-service |
| api-gateway | `LOGISTICS_SERVICE_URL` | `http://localhost:8086` | Upstream logistics-service |
| api-gateway | `INTELLIGENCE_SERVICE_URL` | `http://localhost:8087` | Upstream intelligence-service |

---

## Per-Service Details

### core-service (port: 8085)

Database: `masova_core`

```
CORE_MONGODB_URI=mongodb://localhost:27017/masova_core

# Infrastructure (shared across services)
REDIS_HOST=localhost
REDIS_PORT=6379
RABBITMQ_HOST=localhost
RABBITMQ_PORT=5672
RABBITMQ_USERNAME=masova
RABBITMQ_PASSWORD=masova_secret
RABBITMQ_VHOST=/

# Auth
JWT_SECRET=<256-bit-min key>

# Google OAuth (sign-in)
GOOGLE_OAUTH_CLIENT_ID=

# Outbound service URLs
ORDER_SERVICE_URL=http://localhost:8084
DELIVERY_SERVICE_URL=http://localhost:8086
PAYMENT_SERVICE_URL=http://localhost:8089
CORE_SERVICE_URL=http://localhost:8085

# Firebase push notifications
FIREBASE_CREDENTIALS_PATH=
FIREBASE_ENABLED=false

# Twilio SMS
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=
TWILIO_ENABLED=false

# Data retention
RETENTION_ENABLED=false
RETENTION_DRY_RUN=true

# Frontend
FRONTEND_URL=http://localhost:3000
FRONTEND_BASE_URL=http://localhost:3000
RATING_ENABLED=true

# Brevo email
BREVO_API_KEY=
BREVO_SENDER_EMAIL=noreply@masova.com
BREVO_SENDER_NAME=MaSoVa Restaurant
```

---

### commerce-service (port: 8084)

Databases: `masova_commerce` (menu + orders, both via same URI)

```
MENU_MONGODB_URI=mongodb://localhost:27017/masova_commerce
ORDERS_MONGODB_URI=mongodb://localhost:27017/masova_commerce

# Infrastructure (shared across services)
REDIS_HOST=localhost
REDIS_PORT=6379
RABBITMQ_HOST=localhost
RABBITMQ_PORT=5672
RABBITMQ_USERNAME=masova
RABBITMQ_PASSWORD=masova_secret
RABBITMQ_VHOST=/

# MongoDB connection pool tuning
MONGO_POOL_MIN_SIZE=10
MONGO_POOL_MAX_SIZE=100
MONGO_POOL_MAX_WAIT_MS=30000
MONGO_POOL_MAX_IDLE_MS=60000
MONGO_POOL_MAX_LIFE_MS=0

# Auth
JWT_SECRET=<256-bit-min key>

# Outbound service URLs
DELIVERY_SERVICE_URL=http://localhost:8086
CUSTOMER_SERVICE_URL=http://localhost:8085
NOTIFICATION_SERVICE_URL=http://localhost:8085
USER_SERVICE_URL=http://localhost:8085
CORE_SERVICE_URL=http://localhost:8085

# Tax rates (percentages)
TAX_DEFAULT_GST=5.0
TAX_AC_RESTAURANT=5.0
TAX_NON_AC_RESTAURANT=5.0
TAX_DELIVERY_SERVICE=0.0
TAX_PACKAGING=18.0

# Prep time settings
PREP_BASE_TIME=15
PREP_PER_ITEM=5
PREP_RUSH_MULTIPLIER=1.5
PREP_MAX_TIME=120
PREP_MIN_TIME=10
PREP_RUSH_START=12
PREP_RUSH_END=14
PREP_EVENING_RUSH_START=19
PREP_EVENING_RUSH_END=21

# Delivery fee settings
DELIVERY_BASE_FEE=50.0
DELIVERY_FREE_THRESHOLD=500.0
DELIVERY_PER_KM=5.0
DELIVERY_BASE_DISTANCE=3.0

# Frontend
FRONTEND_URL=https://masova-restaurant.vercel.app
FRONTEND_BASE_URL=https://masova-restaurant.vercel.app
```

---

### payment-service (port: 8089)

Database: `masova_payment`

```
MONGODB_URI=mongodb://localhost:27017/masova_payment

# Auth
JWT_SECRET=<256-bit-min key>

# Razorpay — REPLACE test credentials in production
RAZORPAY_KEY_ID=rzp_test_RjYYkXMmoArj4C
RAZORPAY_KEY_SECRET=Asbe0hf12kZn0VSX4ykn3Nvq
RAZORPAY_WEBHOOK_SECRET=whsec_YOUR_WEBHOOK_SECRET_HERE

# Infrastructure (shared across services)
RABBITMQ_HOST=localhost
RABBITMQ_PORT=5672
RABBITMQ_USERNAME=masova
RABBITMQ_PASSWORD=masova_secret
RABBITMQ_VHOST=/

# Outbound service URLs
ORDER_SERVICE_URL=http://localhost:8084
NOTIFICATION_SERVICE_URL=http://localhost:8085

# Prod profile only (no defaults — must be set explicitly)
REDIS_HOST=<required in prod>
REDIS_PASSWORD=<required in prod>
```

> **Warning:** The YAML contains test Razorpay credentials as defaults. These must be overridden via real environment variables before any production or staging deployment.

---

### logistics-service (port: 8086)

Database: `masova_logistics`

```
LOGISTICS_MONGODB_URI=mongodb://localhost:27017/masova_logistics

# Infrastructure (shared across services)
REDIS_HOST=localhost
REDIS_PORT=6379
RABBITMQ_HOST=localhost
RABBITMQ_PORT=5672
RABBITMQ_USERNAME=masova
RABBITMQ_PASSWORD=masova_secret
RABBITMQ_VHOST=/

# Auth
JWT_SECRET=<256-bit-min key>

# Google Maps (routing, geocoding)
GOOGLE_MAPS_API_KEY=

# Open-source routing fallbacks
OSRM_URL=https://router.project-osrm.org
NOMINATIM_URL=https://nominatim.openstreetmap.org

# Outbound service URLs
USER_SERVICE_URL=http://localhost:8085
ORDER_SERVICE_URL=http://localhost:8084
```

---

### intelligence-service (port: 8087)

Database: `masova_analytics`

```
ANALYTICS_MONGODB_URI=mongodb://localhost:27017/masova_analytics

# Infrastructure (shared across services)
REDIS_HOST=localhost
REDIS_PORT=6379
RABBITMQ_HOST=localhost
RABBITMQ_PORT=5672
RABBITMQ_USERNAME=masova
RABBITMQ_PASSWORD=masova_secret
RABBITMQ_VHOST=/

# Auth
JWT_SECRET=<256-bit-min key>

# Outbound service URLs
ORDER_SERVICE_URL=http://localhost:8084
CUSTOMER_SERVICE_URL=http://localhost:8085
USER_SERVICE_URL=http://localhost:8085
INVENTORY_SERVICE_URL=http://localhost:8086
```

---

### api-gateway (port: 8080)

No database. Routes all inbound traffic to upstream services.

```
# Auth (must match all services)
JWT_SECRET=<256-bit-min key>

# Upstream service URLs
CORE_SERVICE_URL=http://localhost:8085
COMMERCE_SERVICE_URL=http://localhost:8084
PAYMENT_SERVICE_URL=http://localhost:8089
LOGISTICS_SERVICE_URL=http://localhost:8086
INTELLIGENCE_SERVICE_URL=http://localhost:8087
```

---

## MongoDB URI Variable Names (Summary)

Each service uses a **different** env var name for its MongoDB URI:

| Service | Env Var Name | Database |
|---------|-------------|----------|
| core-service | `CORE_MONGODB_URI` | `masova_core` |
| commerce-service | `MENU_MONGODB_URI` | `masova_commerce` |
| commerce-service (orders) | `ORDERS_MONGODB_URI` | `masova_commerce` |
| payment-service | `MONGODB_URI` | `masova_payment` |
| logistics-service | `LOGISTICS_MONGODB_URI` | `masova_logistics` |
| intelligence-service | `ANALYTICS_MONGODB_URI` | `masova_analytics` |

---

## Shared / Cross-Service Variables

These variable names are **identical** across every service that uses them. Set once in your `.env` / secrets manager and apply to all:

| Env Var Name | Default | Used By |
|-------------|---------|---------|
| `JWT_SECRET` | *(long dev key)* | All 6 services |
| `REDIS_HOST` | `localhost` | core, commerce, logistics, intelligence, payment (prod) |
| `REDIS_PORT` | `6379` | core, commerce, logistics, intelligence |
| `RABBITMQ_HOST` | `localhost` | core, commerce, payment, logistics, intelligence |
| `RABBITMQ_PORT` | `5672` | core, commerce, payment, logistics, intelligence |
| `RABBITMQ_USERNAME` | `masova` | core, commerce, payment, logistics, intelligence |
| `RABBITMQ_PASSWORD` | `masova_secret` | core, commerce, payment, logistics, intelligence |
| `RABBITMQ_VHOST` | `/` | core, commerce, payment, logistics, intelligence |

---

## Service URL Cross-Reference

Which services call which, and under what env var name:

| Caller | Callee | Env Var in Caller |
|--------|--------|------------------|
| core-service | commerce-service | `ORDER_SERVICE_URL` |
| core-service | logistics-service | `DELIVERY_SERVICE_URL` |
| core-service | payment-service | `PAYMENT_SERVICE_URL` |
| commerce-service | logistics-service | `DELIVERY_SERVICE_URL` |
| commerce-service | core-service | `CUSTOMER_SERVICE_URL`, `NOTIFICATION_SERVICE_URL`, `USER_SERVICE_URL`, `CORE_SERVICE_URL` |
| payment-service | commerce-service | `ORDER_SERVICE_URL` |
| payment-service | core-service | `NOTIFICATION_SERVICE_URL` |
| logistics-service | core-service | `USER_SERVICE_URL` |
| logistics-service | commerce-service | `ORDER_SERVICE_URL` |
| intelligence-service | commerce-service | `ORDER_SERVICE_URL` |
| intelligence-service | core-service | `CUSTOMER_SERVICE_URL`, `USER_SERVICE_URL` |
| intelligence-service | logistics-service | `INVENTORY_SERVICE_URL` |
| api-gateway | core-service | `CORE_SERVICE_URL` |
| api-gateway | commerce-service | `COMMERCE_SERVICE_URL` |
| api-gateway | payment-service | `PAYMENT_SERVICE_URL` |
| api-gateway | logistics-service | `LOGISTICS_SERVICE_URL` |
| api-gateway | intelligence-service | `INTELLIGENCE_SERVICE_URL` |

---

## Third-Party / External Service Variables

| Env Var | Service | Purpose | Required for |
|---------|---------|---------|--------------|
| `GOOGLE_OAUTH_CLIENT_ID` | core-service | Google Sign-In token verification | Google login |
| `GOOGLE_MAPS_API_KEY` | logistics-service | Maps Directions + Geocoding | Accurate routing |
| `RAZORPAY_KEY_ID` | payment-service | Razorpay payment gateway | Payments |
| `RAZORPAY_KEY_SECRET` | payment-service | Razorpay HMAC signing | Payments |
| `RAZORPAY_WEBHOOK_SECRET` | payment-service | Razorpay webhook verification | Payment webhooks |
| `BREVO_API_KEY` | core-service | Transactional email | Email notifications |
| `BREVO_SENDER_EMAIL` | core-service | From address | Email notifications |
| `BREVO_SENDER_NAME` | core-service | From display name | Email notifications |
| `FIREBASE_CREDENTIALS_PATH` | core-service | Firebase Admin SDK JSON path | Push notifications |
| `FIREBASE_ENABLED` | core-service | Feature flag | Push notifications |
| `TWILIO_ACCOUNT_SID` | core-service | Twilio SMS | SMS notifications |
| `TWILIO_AUTH_TOKEN` | core-service | Twilio auth | SMS notifications |
| `TWILIO_PHONE_NUMBER` | core-service | Twilio sender number | SMS notifications |
| `TWILIO_ENABLED` | core-service | Feature flag | SMS notifications |
| `OSRM_URL` | logistics-service | Open-source routing engine | Routing fallback |
| `NOMINATIM_URL` | logistics-service | Open-source geocoding | Geocoding fallback |
