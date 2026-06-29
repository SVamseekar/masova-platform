# MaSoVa Local Development Startup Guide

> Complete guide to starting every service and app in the MaSoVa ecosystem for local development.

---

## Prerequisites

| Tool              | Version | Check                         |
| ----------------- | ------- | ----------------------------- |
| Java (Temurin 21) | 21      | `java -version`               |
| Maven             | 3.9+    | `mvn -version`                |
| Node.js           | 18+     | `node -version`               |
| MongoDB           | 7+      | `mongosh --version`           |
| Redis             | 7+      | `redis-cli ping`              |
| RabbitMQ          | 3.13+   | `rabbitmq-diagnostics status` |
| Python            | 3.12+   | `python3 --version`           |
| Android SDK       | API 36  | `adb --version`               |

---

## Step 1 — Infrastructure (Start First)

> **Architecture note:** For multi-machine setups, infrastructure can run on a dedicated backend host while frontend and mobile run locally. For single-machine development, use Docker Compose below.

### Option A — Docker Compose (Recommended)
```bash
# From the project root
docker compose up -d mongodb redis rabbitmq postgres
```

Verify:
```bash
docker compose ps   # all four should show "Up"
```

### Option B — Homebrew (Mac, local dev only)
```bash
brew services start mongodb-community
brew services start redis
brew services start rabbitmq

# Verify
mongosh --eval "db.adminCommand('ping')"
redis-cli ping   # → PONG
curl -s -u guest:guest http://localhost:15672/api/overview | python3 -c "import json,sys; d=json.load(sys.stdin); print('RabbitMQ OK:', d['rabbitmq_version'])"
```

> **First-time only (Homebrew):** Create the `masova` RabbitMQ user:
> ```bash
> rabbitmqctl add_user masova masova_secret
> rabbitmqctl set_permissions -p / masova ".*" ".*" ".*"
> ```

---

## Step 2 — Backend Services (Spring Boot)

All services live in this repository root.

There are **6 consolidated services**:

### Option A — Start All (Recommended)

Open 6 terminal tabs and run one command per tab:

```bash
# From the project root — one terminal per service
cd api-gateway      && mvn spring-boot:run "-Dmaven.test.skip=true"   # :8080
cd core-service     && mvn spring-boot:run "-Dmaven.test.skip=true"   # :8085
cd commerce-service && mvn spring-boot:run "-Dmaven.test.skip=true"   # :8084
cd payment-service  && mvn spring-boot:run "-Dmaven.test.skip=true"   # :8089
cd logistics-service && mvn spring-boot:run "-Dmaven.test.skip=true"  # :8086
cd intelligence-service && mvn spring-boot:run "-Dmaven.test.skip=true" # :8087
```

> **Build shared libs first** (only needed once or after changes to shared-models/shared-security):
> ```bash
> mvn install -pl shared-models,shared-security -DskipTests -q
> ```

### Verify Backend
```bash
# Check gateway routes (~47 routes = healthy)
curl -s http://localhost:8080/actuator/gateway/routes | python3 -c "import json,sys; r=json.load(sys.stdin); print(f'Gateway OK: {len(r)} routes')"

# Health check all services
curl -s http://localhost:8085/actuator/health | python3 -c "import json,sys; print('Core:', json.load(sys.stdin).get('status','?'))"
curl -s http://localhost:8084/actuator/health | python3 -c "import json,sys; print('Commerce:', json.load(sys.stdin).get('status','?'))"
curl -s http://localhost:8089/actuator/health | python3 -c "import json,sys; print('Payment:', json.load(sys.stdin).get('status','?'))"
curl -s http://localhost:8086/actuator/health | python3 -c "import json,sys; print('Logistics:', json.load(sys.stdin).get('status','?'))"
curl -s http://localhost:8087/actuator/health | python3 -c "import json,sys; print('Intelligence:', json.load(sys.stdin).get('status','?'))"
```

---

## Step 3 — Seed the Database (First Time Only)

```bash
node scripts/seed-database.js
```

This creates stores, menu items, and test users. Only needs to run once unless you wipe MongoDB.

**Test users created by seed:**
| Role     | Email               | Password    |
| -------- | ------------------- | ----------- |
| Manager  | manager@masova.com  | password123 |
| Customer | customer@masova.com | password123 |
| Driver   | driver@masova.com   | password123 |

---

## Step 4 — Web Frontend

```bash
cd frontend
npm install   # first time only
npm run dev
```

Open: **http://localhost:3000**

---

## Step 5 — AI Support Agent

```bash
# From the masova-support repository (sibling project)
cd ../masova-support
source .venv/bin/activate   # optional
uvicorn src.masova_agent.main:app --host 0.0.0.0 --port 8000 --reload
```

Verify:
```bash
curl -s http://localhost:8000/health
```

---

## Step 6 — Customer Mobile App (masova-mobile)

**Bare React Native** (not Expo Go). Requires Android emulator or connected device.

**Terminal 1 — Start Metro bundler:**
```bash
# From the masova-mobile repository (sibling project)
cd ../masova-mobile
npx react-native start --port 8888
```

**Terminal 2 — Build and install on Android:**
```bash
cd ../masova-mobile
npx react-native run-android --port 8888 --active-arch-only
```

> **Port 8888** avoids conflict with backend services.
> **API URL:** Set `API_BASE_URL` in `src/services/api.ts` (e.g. `http://localhost:8080/api` or your LAN gateway).
> **Android emulator:** Use `http://10.0.2.2:8080/api`.

---

## Step 7 — Staff App (MaSoVaCrewApp)

**Bare React Native 0.83** (not Expo Go). Requires Android emulator or connected device.
Covers all staff roles: Driver, Kitchen, Cashier, Manager — role is read from JWT `user.type`.

**Terminal 1 — Start Metro bundler:**
```bash
# From the MaSoVaCrewApp repository (sibling project)
cd ../MaSoVaCrewApp
npx react-native start
```

**Terminal 2 — Build and install on Android:**
```bash
cd ../MaSoVaCrewApp
npx react-native run-android --active-arch-only
```

> **API URL:** Set `API_GATEWAY_URL` in `src/config/api.config.ts` to your gateway (e.g. `http://localhost:8080/api`).

---

## Quick Status Check (All at Once)

Run this any time to see what's up:

```bash
echo "=== INFRASTRUCTURE ==="
echo -n "MongoDB:  "; mongosh --quiet --eval "db.adminCommand('ping').ok" 2>/dev/null | grep -q 1 && echo "UP" || echo "DOWN"
echo -n "Redis:    "; redis-cli ping 2>/dev/null | grep -q PONG && echo "UP" || echo "DOWN"
echo -n "RabbitMQ: "; curl -s -u guest:guest http://localhost:15672/api/overview > /dev/null 2>&1 && echo "UP" || echo "DOWN"

echo ""
echo "=== BACKEND SERVICES ==="
echo -n "8080 API Gateway:     "; curl -s --max-time 2 http://localhost:8080/actuator/health 2>/dev/null | python3 -c "import json,sys; print(json.load(sys.stdin).get('status','?'))" 2>/dev/null || echo "DOWN"
echo -n "8085 Core:            "; curl -s --max-time 2 http://localhost:8085/actuator/health 2>/dev/null | python3 -c "import json,sys; print(json.load(sys.stdin).get('status','?'))" 2>/dev/null || echo "DOWN"
echo -n "8084 Commerce:        "; curl -s --max-time 2 http://localhost:8084/actuator/health 2>/dev/null | python3 -c "import json,sys; print(json.load(sys.stdin).get('status','?'))" 2>/dev/null || echo "DOWN"
echo -n "8089 Payment:         "; curl -s --max-time 2 http://localhost:8089/actuator/health 2>/dev/null | python3 -c "import json,sys; print(json.load(sys.stdin).get('status','?'))" 2>/dev/null || echo "DOWN"
echo -n "8086 Logistics:       "; curl -s --max-time 2 http://localhost:8086/actuator/health 2>/dev/null | python3 -c "import json,sys; print(json.load(sys.stdin).get('status','?'))" 2>/dev/null || echo "DOWN"
echo -n "8087 Intelligence:    "; curl -s --max-time 2 http://localhost:8087/actuator/health 2>/dev/null | python3 -c "import json,sys; print(json.load(sys.stdin).get('status','?'))" 2>/dev/null || echo "DOWN"

echo ""
echo "=== AI AGENT ==="
echo -n "8000 masova-support: "; curl -s --max-time 2 http://localhost:8000/health > /dev/null 2>&1 && echo "UP" || echo "DOWN"
```

---

## Port Reference

| Port  | Service                                                  |
| ----- | -------------------------------------------------------- |
| 3000  | Web Frontend (Vite)                                      |
| 8000  | AI Support Agent (FastAPI)                               |
| 8080  | API Gateway (Spring Boot)                                |
| 8084  | Commerce Service (menu, orders, kitchen, kiosk)          |
| 8085  | Core Service (users, stores, auth, customers, reviews)   |
| 8086  | Logistics Service (delivery, dispatch, inventory, waste) |
| 8087  | Intelligence Service (analytics, BI, reports)            |
| 8089  | Payment Service (payments, refunds)                      |
| 8888  | masova-mobile Metro bundler (custom port to avoid conflicts) |
| —     | MaSoVaCrewApp Metro bundler (default port)               |
| 15672 | RabbitMQ Management UI                                   |
| 27017 | MongoDB                                                  |
| 6379  | Redis                                                    |

---

## Stop Everything

```bash
# Kill all Spring Boot services
lsof -ti :8080 | xargs kill 2>/dev/null && echo "Killed 8080 (Gateway)"
lsof -ti :8084 | xargs kill 2>/dev/null && echo "Killed 8084 (Commerce)"
lsof -ti :8085 | xargs kill 2>/dev/null && echo "Killed 8085 (Core)"
lsof -ti :8086 | xargs kill 2>/dev/null && echo "Killed 8086 (Logistics)"
lsof -ti :8087 | xargs kill 2>/dev/null && echo "Killed 8087 (Intelligence)"
lsof -ti :8089 | xargs kill 2>/dev/null && echo "Killed 8089 (Payment)"

# Kill AI agent
lsof -ti :8000 | xargs kill 2>/dev/null && echo "Killed 8000 (AI Agent)"

# Stop infrastructure
brew services stop rabbitmq
brew services stop redis
# Keep MongoDB running (safe to leave on)
```
