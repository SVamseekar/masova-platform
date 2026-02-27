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
| Python            | 3.11+   | `python3 --version`           |
| Android SDK       | API 36  | `adb --version`               |

---

## Step 1 — Infrastructure (Start First)

### MongoDB
```bash
    brew services start mongodb-community
# Verify
mongosh --eval "db.adminCommand('ping')"
```

### Redis
```bash
brew services start redis
# Verify
redis-cli ping   # → PONG
```

### RabbitMQ
```bash
brew services start rabbitmq
# Verify (wait ~10 seconds after start)
curl -s -u guest:guest http://localhost:15672/api/overview | python3 -c "import json,sys; d=json.load(sys.stdin); print('RabbitMQ OK:', d['rabbitmq_version'])"
```

> **First-time only:** Create the `masova` RabbitMQ user:
> ```bash
> rabbitmqctl add_user masova masova_secret
> rabbitmqctl set_permissions -p / masova ".*" ".*" ".*"
> ```

---

## Step 2 — Backend Services (Spring Boot)

All services live in `/Users/souravamseekarmarti/Projects/MaSoVa-restaurant-management-system/`

There are **5 consolidated services** (not the old individual microservices):

### Option A — Start All (Recommended)

Open 6 terminal tabs and run one command per tab:

```bash
BASE=/Users/souravamseekarmarti/Projects/MaSoVa-restaurant-management-system
JH=$(ls -d /Library/Java/JavaVirtualMachines/temurin-21.*/Contents/Home | head -1)

# Tab 1 — API Gateway (port 8080)
cd $BASE/api-gateway && JAVA_HOME=$JH mvn spring-boot:run -q

# Tab 2 — Core Service (port 8085) [users, stores, auth, customers, reviews, notifications, campaigns]
cd $BASE/core-service && JAVA_HOME=$JH mvn spring-boot:run -q

# Tab 3 — Commerce Service (port 8084) [menu, orders, kitchen, kiosk]
cd $BASE/commerce-service && JAVA_HOME=$JH mvn spring-boot:run -q

# Tab 4 — Payment Service (port 8089) [payments, refunds]
cd $BASE/payment-service && JAVA_HOME=$JH mvn spring-boot:run -q

# Tab 5 — Logistics Service (port 8086) [delivery, dispatch, tracking, inventory, suppliers, waste]
cd $BASE/logistics-service && JAVA_HOME=$JH mvn spring-boot:run -q

# Tab 6 — Intelligence Service (port 8087) [analytics, BI, reports]
cd $BASE/intelligence-service && JAVA_HOME=$JH mvn spring-boot:run -q
```

> **Build shared libs first** (only needed once or after changes to shared-models/shared-security):
> ```bash
> cd /Users/souravamseekarmarti/Projects/MaSoVa-restaurant-management-system
> JAVA_HOME=$(ls -d /Library/Java/JavaVirtualMachines/temurin-21.*/Contents/Home | head -1) \
>   mvn install -pl shared-models,shared-security -DskipTests -q
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
cd /Users/souravamseekarmarti/Projects/MaSoVa-restaurant-management-system
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
cd /Users/souravamseekarmarti/Projects/MaSoVa-restaurant-management-system/frontend
npm install   # first time only
npm run dev
```

Open: **http://localhost:3000**

---

## Step 5 — AI Support Agent

```bash
cd /Users/souravamseekarmarti/Projects/masova-support
source .venv/bin/activate
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
cd /Users/souravamseekarmarti/Projects/masova-mobile
npx react-native start --port 8888
```

**Terminal 2 — Build and install on Android:**
```bash
cd /Users/souravamseekarmarti/Projects/masova-mobile
npx react-native run-android --port 8888 --active-arch-only
```

> **Port 8888** is used to avoid conflict with commerce-service (8084).
> **API URL:** Automatically uses `http://10.0.2.2:8080/api` for Android emulator, `http://localhost:8080/api` for iOS simulator.

---

## Step 7 — Driver App (MaSoVaDriverApp)

**Bare React Native** (not Expo Go). Requires Android emulator or connected device.

**Terminal 1 — Start Metro bundler:**
```bash
cd /Users/souravamseekarmarti/Projects/MaSoVaDriverApp
npx react-native start --port 8099
```

**Terminal 2 — Build and install on Android:**
```bash
cd /Users/souravamseekarmarti/Projects/MaSoVaDriverApp
npx react-native run-android --port 8099 --active-arch-only
```

> **Port 8099** is used to avoid conflicts with all backend services.

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
| 8888  | masova-mobile Metro bundler                              |
| 8099  | MaSoVaDriverApp Metro bundler                            |
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
