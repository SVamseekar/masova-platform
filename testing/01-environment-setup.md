# Testing Environment Setup Guide

**Document:** 01-environment-setup.md
**Purpose:** Complete setup guide for QA testing environment
**Prerequisites:** Docker, Java 21, Node.js 18+, Maven, Git

---

## 📋 Table of Contents

1. [System Requirements](#system-requirements)
2. [Software Installation](#software-installation)
3. [Backend Services Setup](#backend-services-setup)
4. [Frontend Application Setup](#frontend-application-setup)
5. [Database Setup & Test Data](#database-setup--test-data)
6. [API Gateway Verification](#api-gateway-verification)
7. [Health Check Procedures](#health-check-procedures)
8. [Troubleshooting](#troubleshooting)

---

## 🖥️ System Requirements

### Minimum Hardware
- **CPU:** 4 cores (8 threads recommended)
- **RAM:** 16GB (32GB recommended for full stack)
- **Storage:** 20GB free space
- **Network:** Stable internet (for Google Maps API, Razorpay)

### Operating System
- ✅ Windows 10/11 Pro
- ✅ macOS 11+ (Big Sur or later)
- ✅ Ubuntu 20.04+ / Debian 11+

---

## 📦 Software Installation

### 1. Java Development Kit (JDK 21 LTS)

**Download & Install:**
```bash
# Windows (using Chocolatey)
choco install openjdk21

# macOS (using Homebrew)
brew install openjdk@21

# Ubuntu/Debian
sudo apt update
sudo apt install openjdk-21-jdk
```

**Verify Installation:**
```bash
java -version
# Expected: openjdk version "21.x.x"

javac -version
# Expected: javac 21.x.x
```

### 2. Apache Maven 3.9+

**Download & Install:**
```bash
# Windows (using Chocolatey)
choco install maven

# macOS (using Homebrew)
brew install maven

# Ubuntu/Debian
sudo apt install maven
```

**Verify Installation:**
```bash
mvn -version
# Expected: Apache Maven 3.9.x
```

### 3. Node.js 18+ & npm

**Download & Install:**
```bash
# Windows (using Chocolatey)
choco install nodejs-lts

# macOS (using Homebrew)
brew install node@18

# Ubuntu/Debian (using NodeSource)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install nodejs
```

**Verify Installation:**
```bash
node -v
# Expected: v18.x.x or higher

npm -v
# Expected: 9.x.x or higher
```

### 4. Docker & Docker Compose

**Download & Install:**
- **Windows/macOS:** [Docker Desktop](https://www.docker.com/products/docker-desktop)
- **Linux:** Follow [official Docker installation guide](https://docs.docker.com/engine/install/)

**Verify Installation:**
```bash
docker -v
# Expected: Docker version 24.x.x

docker-compose -v
# Expected: Docker Compose version v2.x.x
```

### 5. Git

**Download & Install:**
```bash
# Windows (using Chocolatey)
choco install git

# macOS (using Homebrew)
brew install git

# Ubuntu/Debian
sudo apt install git
```

**Verify Installation:**
```bash
git --version
# Expected: git version 2.x.x
```

### 6. API Testing Tools

**Postman (Recommended):**
- Download from: https://www.postman.com/downloads/
- Import MaSoVa API collection (see `postman/` folder)

**Alternative - cURL (CLI):**
```bash
# Already installed on most systems
curl --version
```

### 7. Browser for Frontend Testing

**Recommended Browsers:**
- ✅ **Google Chrome** (latest) - Primary testing browser
- ✅ **Firefox** (latest) - Secondary testing
- ✅ **Safari** (macOS) - Mobile simulation
- ✅ **Edge** (Windows) - Cross-browser validation

---

## 🚀 Backend Services Setup

### Step 1: Clone Repository

```bash
# Clone the project
git clone https://github.com/your-org/MaSoVa-restaurant-management-system.git
cd MaSoVa-restaurant-management-system

# Verify you're on the main branch
git branch
# Expected: * main
```

### Step 2: Start Infrastructure (MongoDB + Redis)

```bash
# Navigate to project root
cd D:/projects/MaSoVa-restaurant-management-system

# Start Docker containers
docker-compose up -d mongodb redis

# Verify containers are running
docker ps
# Expected: mongodb:latest (port 27017), redis:alpine (port 6379)
```

**Expected Output:**
```
CONTAINER ID   IMAGE           STATUS         PORTS
abc123def456   mongodb:latest  Up 10 seconds  0.0.0.0:27017->27017/tcp
xyz789ghi012   redis:alpine    Up 10 seconds  0.0.0.0:6379->6379/tcp
```

### Step 3: Build All Microservices

```bash
# Build shared models first (dependency for all services)
cd shared-models
mvn clean install
cd ..

# Build all services
cd api-gateway && mvn clean install && cd ..
cd user-service && mvn clean install && cd ..
cd menu-service && mvn clean install && cd ..
cd order-service && mvn clean install && cd ..
cd payment-service && mvn clean install && cd ..
cd inventory-service && mvn clean install && cd ..
cd delivery-service && mvn clean install && cd ..
cd customer-service && mvn clean install && cd ..
```

**Expected Output (for each service):**
```
[INFO] BUILD SUCCESS
[INFO] Total time:  XX.XXX s
```

**If Build Fails:**
- Check Java version: `java -version` (must be 21+)
- Check Maven version: `mvn -version` (must be 3.9+)
- Verify shared-models was built first
- Check internet connection (Maven downloads dependencies)

### Step 4: Start Services (Terminal-Per-Service Method)

**Open 8 separate terminals** and run:

**Terminal 1 - API Gateway (Port 8080):**
```bash
cd api-gateway
mvn spring-boot:run
# Wait for: "Started ApiGatewayApplication in X.XXX seconds"
```

**Terminal 2 - User Service (Port 8081):**
```bash
cd user-service
mvn spring-boot:run
# Wait for: "Started UserServiceApplication in X.XXX seconds"
```

**Terminal 3 - Menu Service (Port 8082):**
```bash
cd menu-service
mvn spring-boot:run
# Wait for: "Started MenuServiceApplication in X.XXX seconds"
```

**Terminal 4 - Order Service (Port 8083):**
```bash
cd order-service
mvn spring-boot:run
# Wait for: "Started OrderServiceApplication in X.XXX seconds"
```

**Terminal 5 - Payment Service (Port 8086):**
```bash
cd payment-service
mvn spring-boot:run
# Wait for: "Started PaymentServiceApplication in X.XXX seconds"
```

**Terminal 6 - Inventory Service (Port 8088):**
```bash
cd inventory-service
mvn spring-boot:run
# Wait for: "Started InventoryServiceApplication in X.XXX seconds"
```

**Terminal 7 - Delivery Service (Port 8090):**
```bash
cd delivery-service
mvn spring-boot:run
# Wait for: "Started DeliveryServiceApplication in X.XXX seconds"
```

**Terminal 8 - Customer Service (Port 8091):**
```bash
cd customer-service
mvn spring-boot:run
# Wait for: "Started CustomerServiceApplication in X.XXX seconds"
```

### Step 5: Verify All Services Are Running

```bash
# Check all service health endpoints
curl http://localhost:8080/actuator/health  # API Gateway
curl http://localhost:8081/actuator/health  # User Service
curl http://localhost:8082/actuator/health  # Menu Service
curl http://localhost:8083/actuator/health  # Order Service
curl http://localhost:8086/actuator/health  # Payment Service
curl http://localhost:8088/actuator/health  # Inventory Service
curl http://localhost:8090/actuator/health  # Delivery Service
curl http://localhost:8091/actuator/health  # Customer Service

# Expected for each: {"status":"UP"}
```

---

## 🎨 Frontend Application Setup

### Step 1: Install Dependencies

```bash
# Navigate to frontend directory
cd frontend

# Install all npm dependencies
npm install

# Expected: Successfully installed X packages
```

**If Installation Fails:**
- Clear npm cache: `npm cache clean --force`
- Delete `node_modules` and `package-lock.json`
- Retry: `npm install`

### Step 2: Configure API Endpoint

**File:** `frontend/src/config/api.config.ts`

```typescript
// Verify API_BASE_URL points to API Gateway
export const API_BASE_URL = 'http://localhost:8080';

// Ensure WebSocket URL is correct
export const WS_BASE_URL = 'ws://localhost:8083'; // Order Service WebSocket
export const WS_DELIVERY_URL = 'ws://localhost:8090'; // Delivery Service WebSocket
```

### Step 3: Start Frontend Development Server

```bash
# From frontend directory
npm run dev

# Expected output:
# VITE v5.x.x  ready in XXX ms
# ➜  Local:   http://localhost:5173/
# ➜  Network: use --host to expose
```

### Step 4: Verify Frontend is Accessible

**Open browser and navigate to:**
```
http://localhost:5173
```

**Expected:**
- MaSoVa homepage loads
- No console errors in browser DevTools
- Images and styles load correctly

---

## 🗄️ Database Setup & Test Data

### MongoDB Setup

**Verify MongoDB Connection:**
```bash
# Connect to MongoDB
mongosh mongodb://localhost:27017

# List databases
show dbs

# Expected databases:
# - masova_users
# - masova_menu
# - masova_orders
# - masova_payments
# - masova_inventory
# - masova_customers
# - masova_delivery
```

### Redis Setup

**Verify Redis Connection:**
```bash
# Connect to Redis
redis-cli

# Ping Redis
ping
# Expected: PONG

# Check cached keys
keys *
# Expected: Empty or cached menu/customer data

# Exit
exit
```

### Test Data Seeding

**Option A: Automatic Seeding (on first startup)**
- Menu items automatically seeded (150+ items)
- Sample stores created
- Default admin user created

**Option B: Manual Data Import**

**1. Create Test Users:**
```bash
# Use Postman or cURL
curl -X POST http://localhost:8080/api/users/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Manager",
    "email": "manager@test.com",
    "password": "Test@123",
    "phone": "+919876543210",
    "type": "MANAGER",
    "storeId": "store-001"
  }'
```

**2. Import Menu Data:**
```bash
# Navigate to menu-service directory
cd menu-service

# Run recipe migration (if recipes exist)
python add-recipes.py
```

**3. Create Sample Store:**
```bash
curl -X POST http://localhost:8080/api/users/stores \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <manager-jwt-token>" \
  -d '{
    "name": "MaSoVa Bangalore Central",
    "address": "123 MG Road, Bangalore",
    "phone": "+918012345678",
    "email": "bangalore@masova.com"
  }'
```

**4. Verify Test Data:**
```bash
# Get all menu items
curl http://localhost:8080/api/menu/items

# Expected: Array of 150+ menu items

# Get stores
curl http://localhost:8080/api/users/stores \
  -H "Authorization: Bearer <jwt-token>"

# Expected: Array with at least 1 store
```

---

## 🔐 API Gateway Verification

### Test Gateway Routing

**1. Health Check (No Auth Required):**
```bash
curl http://localhost:8080/actuator/health
# Expected: {"status":"UP"}
```

**2. User Service Routing:**
```bash
curl -X POST http://localhost:8080/api/users/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "manager@test.com",
    "password": "Test@123"
  }'

# Expected: 200 OK with JWT tokens
```

**3. Menu Service Routing (Public):**
```bash
curl http://localhost:8080/api/menu/items
# Expected: 200 OK with menu items array
```

**4. Protected Endpoint (Requires Auth):**
```bash
# Without token (should fail)
curl http://localhost:8080/api/users/profile
# Expected: 401 Unauthorized

# With valid token (should succeed)
curl http://localhost:8080/api/users/profile \
  -H "Authorization: Bearer <your-jwt-token>"
# Expected: 200 OK with user profile
```

### Test Rate Limiting

```bash
# Send 150 requests rapidly (limit is 100/min)
for i in {1..150}; do
  curl -s http://localhost:8080/api/menu/items > /dev/null
  echo "Request $i sent"
done

# Expected: First 100 succeed, rest get 429 Too Many Requests
```

### Test CORS

**Open browser console on http://localhost:5173:**
```javascript
// Make cross-origin request
fetch('http://localhost:8080/api/menu/items')
  .then(res => res.json())
  .then(data => console.log('CORS works!', data))
  .catch(err => console.error('CORS failed:', err));

// Expected: Success with menu data
```

---

## 🏥 Health Check Procedures

### Service Health Dashboard

**Create a simple health check script:**

**File:** `testing/health-check.sh`
```bash
#!/bin/bash

echo "🏥 MaSoVa Health Check"
echo "====================="

services=(
  "API-Gateway:8080"
  "User-Service:8081"
  "Menu-Service:8082"
  "Order-Service:8083"
  "Payment-Service:8086"
  "Inventory-Service:8088"
  "Delivery-Service:8090"
  "Customer-Service:8091"
)

for service in "${services[@]}"; do
  name="${service%%:*}"
  port="${service##*:}"

  status=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:$port/actuator/health)

  if [ "$status" == "200" ]; then
    echo "✅ $name (Port $port): UP"
  else
    echo "❌ $name (Port $port): DOWN"
  fi
done

echo ""
echo "🗄️ Infrastructure Health"
echo "====================="

# Check MongoDB
if nc -z localhost 27017 2>/dev/null; then
  echo "✅ MongoDB: UP"
else
  echo "❌ MongoDB: DOWN"
fi

# Check Redis
if nc -z localhost 6379 2>/dev/null; then
  echo "✅ Redis: UP"
else
  echo "❌ Redis: DOWN"
fi

echo ""
echo "🎨 Frontend Health"
echo "================"

frontend_status=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5173)
if [ "$frontend_status" == "200" ]; then
  echo "✅ React Frontend: UP"
else
  echo "❌ React Frontend: DOWN"
fi
```

**Run Health Check:**
```bash
chmod +x testing/health-check.sh
./testing/health-check.sh
```

**Expected Output:**
```
🏥 MaSoVa Health Check
=====================
✅ API-Gateway (Port 8080): UP
✅ User-Service (Port 8081): UP
✅ Menu-Service (Port 8082): UP
✅ Order-Service (Port 8083): UP
✅ Payment-Service (Port 8086): UP
✅ Inventory-Service (Port 8088): UP
✅ Delivery-Service (Port 8090): UP
✅ Customer-Service (Port 8091): UP

🗄️ Infrastructure Health
=====================
✅ MongoDB: UP
✅ Redis: UP

🎨 Frontend Health
================
✅ React Frontend: UP
```

---

## 🔧 Troubleshooting

### Common Issues & Solutions

#### 1. Port Already in Use

**Problem:** Service fails to start with "Port XXXX already in use"

**Solution:**
```bash
# Windows - Find process using port
netstat -ano | findstr :8080
taskkill /PID <process-id> /F

# Linux/macOS - Kill process on port
lsof -ti:8080 | xargs kill -9
```

#### 2. MongoDB Connection Failed

**Problem:** Service logs show "MongoException: Connection refused"

**Solution:**
```bash
# Check if MongoDB is running
docker ps | grep mongodb

# If not running, start it
docker-compose up -d mongodb

# Check MongoDB logs
docker logs <mongodb-container-id>
```

#### 3. Redis Connection Failed

**Problem:** Service logs show "RedisConnectionException"

**Solution:**
```bash
# Check if Redis is running
docker ps | grep redis

# If not running, start it
docker-compose up -d redis

# Test Redis connection
redis-cli ping
# Expected: PONG
```

#### 4. Build Failures

**Problem:** Maven build fails with "Cannot resolve dependency"

**Solution:**
```bash
# Clear Maven cache
rm -rf ~/.m2/repository

# Rebuild with fresh dependencies
mvn clean install -U

# If still fails, check internet connection and Maven settings
```

#### 5. Frontend Won't Start

**Problem:** `npm run dev` fails

**Solution:**
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and package-lock.json
rm -rf node_modules package-lock.json

# Reinstall dependencies
npm install

# Try again
npm run dev
```

#### 6. JWT Token Expired

**Problem:** API calls return 401 Unauthorized

**Solution:**
- Login again to get fresh token
- Use refresh token endpoint to get new access token
- Check token expiration time in JWT settings

#### 7. WebSocket Connection Failed

**Problem:** Real-time updates not working

**Solution:**
```bash
# Verify Order Service is running (WebSocket for orders)
curl http://localhost:8083/actuator/health

# Check browser console for WebSocket errors
# Ensure WebSocket URL is correct in frontend config
```

---

## ✅ Environment Setup Checklist

Use this checklist to verify your environment is ready:

### Infrastructure
- [ ] Docker Desktop installed and running
- [ ] MongoDB container running (port 27017)
- [ ] Redis container running (port 6379)

### Backend Services
- [ ] Java 21 installed
- [ ] Maven 3.9+ installed
- [ ] All 8 microservices built successfully
- [ ] All services running on correct ports (8080-8091)
- [ ] Health checks passing for all services

### Frontend
- [ ] Node.js 18+ installed
- [ ] npm dependencies installed
- [ ] Frontend dev server running (port 5173)
- [ ] Homepage loads in browser

### Test Data
- [ ] Menu items seeded (150+ items)
- [ ] Test users created (Manager, Staff, Driver)
- [ ] Sample store created

### API Gateway
- [ ] Routing working to all services
- [ ] JWT authentication functional
- [ ] CORS enabled for frontend
- [ ] Rate limiting active (100 req/min)

### Testing Tools
- [ ] Postman installed (or cURL ready)
- [ ] Browser DevTools accessible
- [ ] Health check script working

---

## 🎯 Ready for Testing!

Once all items in the checklist are complete, your environment is ready for testing.

**Next Steps:**
1. ✅ Verify all health checks pass
2. 📖 Review `02-phases-1-3-tests.md` for Phase 1-3 test cases
3. 🧪 Begin executing functional tests

---

**Need Help?**
- Check service logs in respective terminal windows
- Review Docker logs: `docker logs <container-name>`
- Consult troubleshooting section above
- Verify all prerequisites are installed correctly

---

*Environment setup complete! Proceed to phase-specific testing documents.*
