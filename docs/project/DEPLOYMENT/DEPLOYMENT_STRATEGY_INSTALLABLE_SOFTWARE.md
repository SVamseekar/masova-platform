# MaSoVa Restaurant Management System - Deployment Strategy for Installable Software

**Document Version:** 1.0
**Date:** December 25, 2025
**Status:** Production Ready
**Target Market:** European Restaurants (Self-Hosted & SaaS)

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Deployment Architecture Options](#deployment-architecture-options)
3. [Email Tracking Links Solution](#email-tracking-links-solution)
4. [Docker-Based Installer](#docker-based-installer)
5. [Native Installer (Advanced)](#native-installer-advanced)
6. [Quick Testing Guide (ngrok)](#quick-testing-guide-ngrok)
7. [Network Configuration](#network-configuration)
8. [Cost Analysis](#cost-analysis)
9. [Implementation Roadmap](#implementation-roadmap)

---

## Executive Summary

### Current Challenge
Email tracking links use `http://localhost:3000`, which doesn't work on customer phones outside the restaurant's network.

### Solution Overview
MaSoVa offers **three deployment models**:

1. **Self-Hosted (Installable)** - Restaurant manages locally (like Toast, Square)
2. **Cloud SaaS** - We host (EUR 100-150/month)
3. **Hybrid** - Local POS + Cloud customer app (Best of both worlds)

### Market Positioning
- **Product Value:** EUR 20,000-75,000 (codebase sale)
- **SaaS Revenue:** EUR 180K/year (100 restaurants @ EUR 150/month)
- **Self-Hosted Price:** One-time EUR 500-1000 per restaurant

---

## Deployment Architecture Options

### Option 1: Self-Hosted Installation (Recommended for Single Restaurants)

**How It Works:**
```
Restaurant Server (Docker)
├── MongoDB (database)
├── Redis (cache)
├── Backend Services (11 microservices)
└── Frontend (React)

Devices on Local Network:
├── POS Terminals → http://192.168.1.100:3000
├── Kitchen Display → http://192.168.1.100:3000/kitchen
├── Manager Dashboard → http://192.168.1.100:3000/manager
└── Driver App → http://192.168.1.100:3000
```

**Benefits:**
- ✅ Works offline (critical for restaurants)
- ✅ Fast (no network latency)
- ✅ Data privacy (GDPR compliant)
- ✅ No monthly cloud costs
- ✅ One-time payment model

**Requirements:**
- Restaurant PC/Server (8GB RAM, 50GB disk)
- Docker Desktop installed
- Local network (WiFi/Ethernet)

---

### Option 2: Cloud SaaS (Recommended for Multi-Location)

**How It Works:**
```
Vercel (Frontend - FREE)
├── Customer App
├── Order Tracking
└── Driver App

Render.com (Backend - FREE/$7/month)
├── API Gateway
├── 11 Microservices
└── WebSocket Server

MongoDB Atlas (FREE/512MB)
Upstash Redis (FREE/10K commands)
```

**Benefits:**
- ✅ Always accessible
- ✅ Automatic updates
- ✅ Multi-location management
- ✅ No restaurant IT required

**Monthly Cost:**
- FREE tier: $0 (for testing/small scale)
- Professional: $55-75/month (for production)

---

### Option 3: Hybrid Model (Best User Experience)

**How It Works:**
```
Restaurant (Local)          Cloud (Vercel)
├── POS System         →    Customer Ordering
├── Kitchen Display    →    Order Tracking
└── Manager Dashboard  ←→   Real-time Sync
```

**Email Tracking:**
- Links point to cloud: `https://restaurant.vercel.app/track/ORDER123`
- Cloud fetches data from local server (if online)
- Works even when restaurant is offline

**Benefits:**
- ✅ POS works offline
- ✅ Customers access from anywhere
- ✅ Professional appearance
- ✅ Best of both worlds

---

## Email Tracking Links Solution

### The Problem
Emails contain `http://localhost:3000/customer/order-tracking/ORDER123` which doesn't work on customer phones.

### Solutions Comparison

| Solution | Cost | Setup Time | Reliability | Best For |
|----------|------|------------|-------------|----------|
| ngrok (free) | $0 | 5 min | Medium | Testing only |
| ngrok Pro | $8/month | 5 min | High | Single restaurant |
| Cloudflare Tunnel | $0 | 30 min | High | Production (FREE!) |
| Port Forward + DynDNS | $0 | 60 min | Medium | Tech-savvy |
| Hybrid (Cloud + Local) | $0 | 2 hours | Highest | Best UX |

---

### Solution 1: ngrok (Easiest - For Testing)

**What It Does:**
Creates public URL that tunnels to your localhost.

**Setup:**
```bash
# Install ngrok
brew install ngrok

# Free tier (URL changes on restart)
ngrok http 3000
# Output: https://abc123.ngrok-free.app

# Update .env
FRONTEND_URL=https://abc123.ngrok-free.app
FRONTEND_BASE_URL=https://abc123.ngrok-free.app
```

**Restart Services:**
```bash
# Restart order-service and notification-service
# (They generate tracking URLs and send emails)
```

**Test:**
1. Create order from POS
2. Check email on phone
3. Click tracking link → works! ✅

**Paid Tier ($8/month):**
```bash
# Permanent subdomain (doesn't change)
ngrok http --subdomain=myrestaurant 3000
# URL: https://myrestaurant.ngrok.io
```

---

### Solution 2: Cloudflare Tunnel (FREE - For Production)

**What It Does:**
Creates secure tunnel with free HTTPS and permanent URL.

**Setup:**
```bash
# Install cloudflared
brew install cloudflare/cloudflare/cloudflared

# Login to Cloudflare
cloudflared tunnel login

# Create tunnel
cloudflared tunnel create masova-restaurant

# Get tunnel ID (copy from output)
# Example: abc123-def456-ghi789

# Create config file
cat > ~/.cloudflared/config.yml << EOF
tunnel: abc123-def456-ghi789
credentials-file: /Users/you/.cloudflared/abc123-def456-ghi789.json

ingress:
  - hostname: restaurant.example.com
    service: http://localhost:3000
  - service: http_status:404
EOF

# Run tunnel
cloudflared tunnel run masova-restaurant
```

**Add DNS Record:**
1. Go to Cloudflare dashboard
2. DNS → Add record
3. Type: CNAME
4. Name: restaurant
5. Target: abc123-def456-ghi789.cfargotunnel.com

**Update .env:**
```bash
FRONTEND_URL=https://restaurant.example.com
FRONTEND_BASE_URL=https://restaurant.example.com
```

**Run as Service (Auto-start):**
```bash
# macOS
cloudflared service install

# Linux
sudo cloudflared service install
```

---

### Solution 3: Router Port Forwarding + DynDNS (FREE)

**What It Does:**
Exposes local server to internet via router.

**Setup:**

1. **Get Free Dynamic DNS:**
   - Sign up at No-IP.com
   - Create hostname: `myrestaurant.ddns.net`

2. **Configure Router:**
   - Login to router (usually 192.168.1.1)
   - Port Forwarding:
     - External Port: 80 → Internal IP: 192.168.1.100:3000
     - External Port: 443 → Internal IP: 192.168.1.100:3000

3. **Install DynDNS Updater:**
   ```bash
   # On restaurant server
   sudo apt install ddclient  # Linux
   # Or download No-IP DUC for Windows/Mac
   ```

4. **Update .env:**
   ```bash
   FRONTEND_URL=http://myrestaurant.ddns.net
   ```

**Pros:**
- 100% free
- Full control
- No third-party dependency

**Cons:**
- Requires router access
- No HTTPS (need Let's Encrypt)
- Firewall configuration needed

---

### Solution 4: Hybrid Model (RECOMMENDED)

**Architecture:**
```
Local Server              Cloud (Vercel - FREE)
├── POS                   Customer Ordering App
├── Kitchen          ←→   Order Tracking Page
└── Manager               Driver App
```

**How It Works:**
1. Restaurant runs POS/Kitchen locally
2. Customer-facing apps hosted on Vercel (free)
3. Local server syncs orders to cloud via webhook
4. Email links point to cloud: `https://restaurant.vercel.app/track/ORDER123`

**Benefits:**
- POS works offline
- Customers access from anywhere
- Professional URL
- Free cloud hosting

**Implementation:**

**Step 1: Deploy Customer App to Vercel**
```bash
cd frontend
npm run build

# Push to GitHub
git add .
git commit -m "Prepare for Vercel deployment"
git push

# Deploy to Vercel
# 1. Go to vercel.com
# 2. Import GitHub repo
# 3. Root Directory: frontend
# 4. Build Command: npm run build
# 5. Output Directory: dist
```

**Step 2: Configure Webhook**

Create webhook endpoint in order-service:
```java
@PostMapping("/api/orders/webhook")
public void syncToCloud(@RequestBody Order order) {
    RestTemplate restTemplate = new RestTemplate();

    String cloudUrl = environment.getProperty("CLOUD_WEBHOOK_URL");
    restTemplate.postForEntity(cloudUrl + "/api/sync", order, String.class);
}
```

**Step 3: Update .env**
```bash
# Local .env
FRONTEND_URL=https://myrestaurant.vercel.app
CLOUD_WEBHOOK_URL=https://myrestaurant.vercel.app/api/sync

# Vercel .env
VITE_LOCAL_API=https://myrestaurant.ddns.net/api  # Fallback
VITE_API_GATEWAY_URL=https://myrestaurant.vercel.app/api
```

---

## Docker-Based Installer

### Overview
Package MaSoVa as a double-click installer for Windows/Mac/Linux.

### Files to Create

#### 1. docker-compose.yml (Production)

```yaml
version: '3.8'

services:
  mongodb:
    image: mongo:7
    container_name: masova-db
    volumes:
      - ./data/mongodb:/data/db
    ports:
      - "27017:27017"
    restart: always
    environment:
      MONGO_INITDB_DATABASE: masova

  redis:
    image: redis:7-alpine
    container_name: masova-cache
    volumes:
      - ./data/redis:/data
    ports:
      - "6379:6379"
    restart: always

  backend:
    image: masova/backend:latest
    container_name: masova-backend
    ports:
      - "8080:8080"   # API Gateway
      - "8081:8081"   # User Service
      - "8082:8082"   # Menu Service
      - "8083:8083"   # Order Service
      - "8084:8084"   # Customer Service
      - "8085:8085"   # Analytics Service
      - "8086:8086"   # Payment Service
      - "8088:8088"   # Inventory Service
      - "8089:8089"   # Review Service
      - "8090:8090"   # Delivery Service
      - "8092:8092"   # Notification Service
    environment:
      - MONGODB_URI=mongodb://mongodb:27017/masova
      - REDIS_HOST=redis
      - REDIS_PORT=6379
      - JWT_SECRET=${JWT_SECRET}
      - FRONTEND_URL=${FRONTEND_URL}
      - RAZORPAY_KEY_ID=${RAZORPAY_KEY_ID}
      - RAZORPAY_KEY_SECRET=${RAZORPAY_KEY_SECRET}
      - BREVO_API_KEY=${BREVO_API_KEY}
      - BREVO_FROM_EMAIL=${BREVO_FROM_EMAIL}
      - BREVO_FROM_NAME=${BREVO_FROM_NAME}
    depends_on:
      - mongodb
      - redis
    restart: always
    volumes:
      - ./logs:/app/logs

  frontend:
    image: masova/frontend:latest
    container_name: masova-frontend
    ports:
      - "3000:80"
    environment:
      - VITE_API_GATEWAY_URL=http://localhost:8080/api
      - VITE_WS_URL=ws://localhost:8080/ws
    depends_on:
      - backend
    restart: always

volumes:
  mongodb_data:
  redis_data:
```

#### 2. install-masova.sh (Mac/Linux)

```bash
#!/bin/bash

echo "================================================"
echo "   MaSoVa Restaurant Management System v1.0     "
echo "   Installation Script                          "
echo "================================================"

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check prerequisites
echo "Checking prerequisites..."

if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker not found.${NC}"
    echo ""
    echo "📥 Please install Docker Desktop from:"
    echo "   https://www.docker.com/products/docker-desktop"
    echo ""
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}❌ Docker Compose not found.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Docker found${NC}"
echo ""

# Create installation directory
INSTALL_DIR="$HOME/MaSoVa"
echo "📁 Creating installation directory: $INSTALL_DIR"
mkdir -p "$INSTALL_DIR"
cd "$INSTALL_DIR"

# Download files (TODO: Replace with actual URLs)
echo "📥 Downloading MaSoVa installation files..."
# curl -O https://releases.masova.com/docker-compose.yml
# curl -O https://releases.masova.com/.env.example

# For now, copy from development
# cp /path/to/dev/docker-compose.yml .
# cp /path/to/dev/.env.example .

# Setup wizard
echo ""
echo "🔧 Setup Wizard"
echo "=============="

# Generate secure JWT secret
JWT_SECRET=$(openssl rand -base64 64 | tr -d '\n')

# Get local IP address
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    LOCAL_IP=$(ifconfig | grep "inet " | grep -v 127.0.0.1 | head -n 1 | awk '{print $2}')
else
    # Linux
    LOCAL_IP=$(hostname -I | awk '{print $1}')
fi

# Prompt for configuration
echo ""
read -p "Enter your restaurant name: " RESTAURANT_NAME
read -p "Enter your email address: " ADMIN_EMAIL
read -p "Enter Razorpay Key ID (or press Enter to skip): " RAZORPAY_KEY
read -p "Enter Brevo API Key (or press Enter to skip): " BREVO_KEY

# Create .env file
cat > .env << EOF
# MaSoVa Configuration
# Generated on $(date)

# Security
JWT_SECRET=$JWT_SECRET

# Frontend URL (for email tracking links)
# Current setting: Local network access only
FRONTEND_URL=http://$LOCAL_IP:3000
FRONTEND_BASE_URL=http://$LOCAL_IP:3000

# To enable external access (customers outside restaurant):
# Option 1: Use ngrok - https://ngrok.com (free or \$8/month)
# Option 2: Use Cloudflare Tunnel - https://cloudflare.com (free)
# Option 3: Port forwarding + DynDNS (free but complex)
# Uncomment and update the line below:
# FRONTEND_URL=https://your-public-url.com

# Restaurant Information
RESTAURANT_NAME=$RESTAURANT_NAME
ADMIN_EMAIL=$ADMIN_EMAIL

# Payment Gateway
RAZORPAY_KEY_ID=$RAZORPAY_KEY
RAZORPAY_KEY_SECRET=

# Email Service (Brevo)
BREVO_API_KEY=$BREVO_KEY
BREVO_FROM_EMAIL=$ADMIN_EMAIL
BREVO_FROM_NAME=$RESTAURANT_NAME
BREVO_ENABLED=true
BREVO_DAILY_LIMIT=300

# Database
MONGODB_URI=mongodb://mongodb:27017/masova

# Cache
REDIS_HOST=redis
REDIS_PORT=6379

# CORS (Add allowed origins)
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://$LOCAL_IP:3000
EOF

echo ""
echo -e "${GREEN}✅ Configuration saved to .env${NC}"

# Pull Docker images
echo ""
echo "📥 Downloading MaSoVa components..."
echo "⏳ This may take 5-10 minutes depending on your internet speed..."
docker-compose pull

# Start services
echo ""
echo "🚀 Starting MaSoVa services..."
docker-compose up -d

# Wait for services to start
echo ""
echo "⏳ Waiting for services to initialize (30 seconds)..."
for i in {30..1}; do
    printf "\r   Time remaining: %02d seconds" $i
    sleep 1
done
echo ""

# Health check
echo ""
echo "🔍 Checking service health..."
if curl -s http://localhost:8080/actuator/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Backend is running${NC}"
else
    echo -e "${YELLOW}⚠️  Backend may still be starting${NC}"
    echo "   Check logs: docker-compose logs -f backend"
fi

if curl -s http://localhost:3000 > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Frontend is running${NC}"
else
    echo -e "${YELLOW}⚠️  Frontend may still be starting${NC}"
    echo "   Check logs: docker-compose logs -f frontend"
fi

# Create desktop shortcut (macOS)
if [[ "$OSTYPE" == "darwin"* ]]; then
    cat > ~/Desktop/MaSoVa.command << 'SCRIPT'
#!/bin/bash
cd ~/MaSoVa
open http://localhost:3000
SCRIPT
    chmod +x ~/Desktop/MaSoVa.command
    echo -e "${GREEN}✅ Desktop shortcut created${NC}"
fi

# Success message
echo ""
echo "================================================"
echo -e "${GREEN}   🎉 MaSoVa Installation Complete!${NC}"
echo "================================================"
echo ""
echo "Access URLs:"
echo "  📱 Frontend:          http://localhost:3000"
echo "  🔌 API Gateway:       http://localhost:8080"
echo "  📊 Health Check:      http://localhost:8080/actuator/health"
echo ""
echo "On other devices (same WiFi network):"
echo "  📱 POS/Kitchen/Manager: http://$LOCAL_IP:3000"
echo ""
echo "Default Login (First Time):"
echo "  👤 Username:          admin@masova.com"
echo "  🔑 Password:          admin123"
echo "  ⚠️  Please change password after first login!"
echo ""
echo "Useful Commands:"
echo "  📋 View logs:         cd ~/MaSoVa && docker-compose logs -f"
echo "  ⏸️  Stop MaSoVa:       cd ~/MaSoVa && docker-compose stop"
echo "  ▶️  Start MaSoVa:      cd ~/MaSoVa && docker-compose start"
echo "  🔄 Restart:           cd ~/MaSoVa && docker-compose restart"
echo "  🔧 Update:            cd ~/MaSoVa && docker-compose pull && docker-compose up -d"
echo "  🗑️  Uninstall:        cd ~/MaSoVa && docker-compose down -v"
echo ""
echo "📖 Full Documentation: $INSTALL_DIR/README.md"
echo "📧 Support: support@masova.com"
echo ""
echo "IMPORTANT: Email Tracking Links"
echo "================================"
echo "Currently, order tracking links work only on devices"
echo "connected to your WiFi network ($LOCAL_IP)."
echo ""
echo "To enable customer tracking from anywhere:"
echo "  1. Use ngrok (easiest): https://ngrok.com"
echo "  2. Use Cloudflare Tunnel (free): See README.md"
echo "  3. Configure port forwarding: See README.md"
echo ""

# Open browser
if command -v open &> /dev/null; then
    # macOS
    echo "🌐 Opening MaSoVa in your default browser..."
    sleep 2
    open http://localhost:3000
elif command -v xdg-open &> /dev/null; then
    # Linux
    echo "🌐 Opening MaSoVa in your default browser..."
    sleep 2
    xdg-open http://localhost:3000
fi
```

#### 3. install-masova.bat (Windows)

```batch
@echo off
SETLOCAL EnableDelayedExpansion

echo ================================================
echo    MaSoVa Restaurant Management System v1.0
echo    Installation Script
echo ================================================
echo.

REM Check Docker
echo Checking prerequisites...
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [91mX Docker not found.[0m
    echo.
    echo Please install Docker Desktop from:
    echo    https://www.docker.com/products/docker-desktop
    echo.
    pause
    exit /b 1
)

docker-compose --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [91mX Docker Compose not found.[0m
    pause
    exit /b 1
)

echo [92m√ Docker found[0m
echo.

REM Create installation directory
set INSTALL_DIR=%USERPROFILE%\MaSoVa
echo Creating installation directory: %INSTALL_DIR%
if not exist "%INSTALL_DIR%" mkdir "%INSTALL_DIR%"
cd /d "%INSTALL_DIR%"

REM Download files
echo Downloading MaSoVa installation files...
REM curl -O https://releases.masova.com/docker-compose.yml
REM curl -O https://releases.masova.com/.env.example

REM Setup wizard
echo.
echo Setup Wizard
echo ==============
echo.

set /p RESTAURANT_NAME="Enter your restaurant name: "
set /p ADMIN_EMAIL="Enter your email address: "
set /p RAZORPAY_KEY="Enter Razorpay Key ID (or press Enter to skip): "
set /p BREVO_KEY="Enter Brevo API Key (or press Enter to skip): "

REM Get local IP
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /c:"IPv4 Address"') do (
    set LOCAL_IP=%%a
    goto :got_ip
)
:got_ip
set LOCAL_IP=%LOCAL_IP:~1%

REM Generate JWT secret (simplified for Windows)
set JWT_SECRET=MaSoVa-Production-Secret-Change-This-To-Secure-Random-256-Bit-Key

REM Create .env file
(
echo # MaSoVa Configuration
echo # Generated on %date% %time%
echo.
echo # Security
echo JWT_SECRET=%JWT_SECRET%
echo.
echo # Frontend URL ^(for email tracking links^)
echo FRONTEND_URL=http://%LOCAL_IP%:3000
echo FRONTEND_BASE_URL=http://%LOCAL_IP%:3000
echo.
echo # Restaurant Information
echo RESTAURANT_NAME=%RESTAURANT_NAME%
echo ADMIN_EMAIL=%ADMIN_EMAIL%
echo.
echo # Payment Gateway
echo RAZORPAY_KEY_ID=%RAZORPAY_KEY%
echo RAZORPAY_KEY_SECRET=
echo.
echo # Email Service
echo BREVO_API_KEY=%BREVO_KEY%
echo BREVO_FROM_EMAIL=%ADMIN_EMAIL%
echo BREVO_FROM_NAME=%RESTAURANT_NAME%
echo BREVO_ENABLED=true
echo.
echo # Database
echo MONGODB_URI=mongodb://mongodb:27017/masova
echo.
echo # Cache
echo REDIS_HOST=redis
echo REDIS_PORT=6379
echo.
echo # CORS
echo CORS_ALLOWED_ORIGINS=http://localhost:3000,http://%LOCAL_IP%:3000
) > .env

echo.
echo [92m√ Configuration saved to .env[0m

REM Pull Docker images
echo.
echo Downloading MaSoVa components...
echo This may take 5-10 minutes...
docker-compose pull

REM Start services
echo.
echo Starting MaSoVa services...
docker-compose up -d

REM Wait for services
echo.
echo Waiting for services to initialize...
timeout /t 30 /nobreak >nul

REM Health check
echo.
echo Checking service health...
curl -s http://localhost:8080/actuator/health >nul 2>&1
if %errorlevel% equ 0 (
    echo [92m√ Backend is running[0m
) else (
    echo [93m! Backend may still be starting[0m
    echo   Check logs: docker-compose logs -f backend
)

curl -s http://localhost:3000 >nul 2>&1
if %errorlevel% equ 0 (
    echo [92m√ Frontend is running[0m
) else (
    echo [93m! Frontend may still be starting[0m
    echo   Check logs: docker-compose logs -f frontend
)

REM Create desktop shortcut
echo Set oWS = WScript.CreateObject("WScript.Shell") > CreateShortcut.vbs
echo sLinkFile = "%USERPROFILE%\Desktop\MaSoVa.lnk" >> CreateShortcut.vbs
echo Set oLink = oWS.CreateShortcut(sLinkFile) >> CreateShortcut.vbs
echo oLink.TargetPath = "http://localhost:3000" >> CreateShortcut.vbs
echo oLink.Save >> CreateShortcut.vbs
cscript CreateShortcut.vbs >nul
del CreateShortcut.vbs
echo [92m√ Desktop shortcut created[0m

REM Success message
echo.
echo ================================================
echo [92m   Installation Complete![0m
echo ================================================
echo.
echo Access URLs:
echo   Frontend:          http://localhost:3000
echo   API Gateway:       http://localhost:8080
echo   Health Check:      http://localhost:8080/actuator/health
echo.
echo On other devices ^(same WiFi^):
echo   Access via:        http://%LOCAL_IP%:3000
echo.
echo Default Login:
echo   Username:          admin@masova.com
echo   Password:          admin123
echo   Please change after first login!
echo.
echo Useful Commands:
echo   View logs:         docker-compose logs -f
echo   Stop:              docker-compose stop
echo   Start:             docker-compose start
echo   Update:            docker-compose pull ^&^& docker-compose up -d
echo   Uninstall:         docker-compose down -v
echo.
echo Documentation: %INSTALL_DIR%\README.md
echo.

REM Open browser
start http://localhost:3000

pause
```

---

## Quick Testing Guide (ngrok)

### Step-by-Step: Test Email Tracking Links in 5 Minutes

**Prerequisites:**
- Frontend running on port 3000
- Backend services running

**Steps:**

1. **Install ngrok:**
   ```bash
   # macOS
   brew install ngrok

   # Windows (PowerShell as Admin)
   choco install ngrok

   # Or download from https://ngrok.com/download
   ```

2. **Start ngrok tunnel:**
   ```bash
   ngrok http 3000
   ```

3. **Copy the HTTPS URL from output:**
   ```
   Forwarding  https://abc123.ngrok-free.app -> http://localhost:3000
                       ^^^^^^^^^^^^^^^^^^^^^^
                       Copy this URL
   ```

4. **Update `.env` file:**
   ```bash
   FRONTEND_URL=https://abc123.ngrok-free.app
   FRONTEND_BASE_URL=https://abc123.ngrok-free.app
   CORS_ALLOWED_ORIGINS=http://localhost:3000,https://abc123.ngrok-free.app
   ```

5. **Restart services:**
   ```bash
   # If using separate service terminals, restart:
   # - order-service (generates tracking URLs)
   # - notification-service (sends emails)
   # - api-gateway (CORS)

   # Or restart all microservices
   ```

6. **Test:**
   - Create a test order from POS or customer app
   - Check your email
   - Click the tracking link
   - Should open on your phone! ✅

**Troubleshooting:**

- **Email link still shows localhost:**
  - Check if order-service restarted properly
  - Verify .env file was updated
  - Check `application.yml` doesn't override FRONTEND_URL

- **ngrok tunnel closed:**
  - Free tier tunnels close after 2 hours
  - Restart ngrok to get new URL
  - Consider paid tier ($8/month) for permanent subdomain

- **CORS errors:**
  - Make sure CORS_ALLOWED_ORIGINS includes ngrok URL
  - Restart api-gateway

---

## Network Configuration

### Local Network Setup for Restaurant

**Recommended Setup:**

```
Router (192.168.1.1)
│
├── Server (192.168.1.100) ← Static IP
│   ├── MongoDB (27017)
│   ├── Redis (6379)
│   ├── Backend (8080-8092)
│   └── Frontend (3000)
│
├── POS Terminal 1 (192.168.1.101)
├── POS Terminal 2 (192.168.1.102)
├── Kitchen Display (192.168.1.103)
├── Manager PC (192.168.1.104)
└── WiFi Devices (192.168.1.105-254)
    ├── Driver phones
    └── Customer devices (limited)
```

### Configure Static IP for Server

**macOS:**
1. System Preferences → Network
2. Select network interface (WiFi or Ethernet)
3. Configure IPv4: Manually
4. IP Address: 192.168.1.100
5. Subnet Mask: 255.255.255.0
6. Router: 192.168.1.1

**Windows:**
1. Control Panel → Network and Sharing
2. Change adapter settings
3. Right-click network → Properties
4. IPv4 → Properties
5. Use the following IP:
   - IP: 192.168.1.100
   - Subnet: 255.255.255.0
   - Gateway: 192.168.1.1

**Linux:**
```bash
# /etc/network/interfaces
auto eth0
iface eth0 inet static
    address 192.168.1.100
    netmask 255.255.255.0
    gateway 192.168.1.1
```

### Firewall Rules

**Allow incoming connections on:**
- Port 3000 (Frontend)
- Port 8080 (API Gateway)
- Port 8083 (WebSocket - Order Service)

**macOS:**
```bash
# Allow through firewall
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --add /usr/local/bin/docker
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --unblock /usr/local/bin/docker
```

**Windows:**
```powershell
# Windows Defender Firewall
New-NetFirewallRule -DisplayName "MaSoVa Frontend" -Direction Inbound -LocalPort 3000 -Protocol TCP -Action Allow
New-NetFirewallRule -DisplayName "MaSoVa Backend" -Direction Inbound -LocalPort 8080 -Protocol TCP -Action Allow
```

**Linux (UFW):**
```bash
sudo ufw allow 3000/tcp
sudo ufw allow 8080/tcp
sudo ufw enable
```

---

## Cost Analysis

### Self-Hosted (One-Time)

| Item | Cost | Notes |
|------|------|-------|
| Software License | EUR 500-1000 | One-time payment |
| Restaurant PC/Server | EUR 500-1000 | Customer provides |
| Installation | EUR 100-200 | Optional support |
| **Total** | **EUR 600-2200** | One-time |

**Ongoing Costs (Optional):**
- ngrok Pro: $8/month (external access)
- Updates/Support: EUR 50-100/year
- **Total Monthly:** $0-8

---

### Cloud SaaS (Recurring)

#### Free Tier (Testing/Small Scale)

| Component | Service | Cost |
|-----------|---------|------|
| Frontend | Vercel | $0 |
| Backend | Render.com (free) | $0 |
| Database | MongoDB Atlas M0 | $0 |
| Cache | Upstash (free) | $0 |
| **Total** | | **$0/month** |

**Limitations:**
- Backend spins down after 15min inactivity
- 512MB RAM (limited)
- 750 hours/month runtime

#### Professional Tier (Production)

| Component | Service | Cost |
|-----------|---------|------|
| Frontend | Vercel | $0 |
| Backend | Render.com Starter | $7/month |
| Database | MongoDB Atlas M10 | $10/month |
| Cache | Upstash Pro | $5/month |
| **Subtotal** | | **$22/month** |
| **Markup (per restaurant)** | | **EUR 100-150/month** |
| **Profit** | | **EUR 78-128/month** |

**With 100 Restaurants:**
- Revenue: EUR 10,000-15,000/month
- Infrastructure: $2,200/month (~EUR 2,000)
- **Profit: EUR 8,000-13,000/month** ✅

---

### Hybrid Model (Best of Both)

| Component | Where | Cost |
|-----------|-------|------|
| POS/Kitchen | Local (self-hosted) | $0 |
| Customer App | Vercel (cloud) | $0 |
| Backend | Local | $0 |
| Webhook/Sync | Cloudflare Tunnel | $0 |
| **Total** | | **$0/month** |

**Optional:**
- ngrok/Cloudflare: $0-8/month
- **Total:** $0-8/month per restaurant

---

## Implementation Roadmap

### Phase 1: Immediate (This Week) - Testing

**Goal:** Verify email tracking links work on phones

**Tasks:**
1. ✅ Install ngrok
2. ✅ Create tunnel to frontend (port 3000)
3. ✅ Update .env with ngrok URL
4. ✅ Restart order-service and notification-service
5. ✅ Create test order
6. ✅ Verify email link works on phone

**Time:** 5-10 minutes
**Cost:** $0

---

### Phase 2: Development (Next 2 Weeks) - Installer

**Goal:** Create installable software package

**Tasks:**
1. ⬜ Create production docker-compose.yml
2. ⬜ Write install-masova.sh (Mac/Linux)
3. ⬜ Write install-masova.bat (Windows)
4. ⬜ Test installation on clean machines
5. ⬜ Create README.md with setup instructions
6. ⬜ Package for distribution

**Time:** 2-3 days development + 1-2 days testing
**Cost:** $0

---

### Phase 3: Beta Testing (3-4 Weeks) - Real Restaurant

**Goal:** Deploy to first beta customer

**Tasks:**
1. ⬜ Find beta restaurant (friend/family)
2. ⬜ Install MaSoVa on-site
3. ⬜ Configure network (static IP, firewall)
4. ⬜ Setup external access (ngrok or Cloudflare)
5. ⬜ Train staff
6. ⬜ Monitor for 2 weeks
7. ⬜ Collect feedback

**Time:** 1 week setup + 2 weeks monitoring
**Cost:** $0-8/month (ngrok)

---

### Phase 4: Production (6-8 Weeks) - Scale

**Goal:** Offer to paying customers

**Options:**

**A. Self-Hosted Model:**
1. ⬜ Create professional installer (jpackage)
2. ⬜ Setup auto-updater
3. ⬜ Write customer documentation
4. ⬜ Create support system
5. ⬜ Price: EUR 500-1000 one-time

**B. SaaS Model:**
1. ⬜ Deploy to production infrastructure
2. ⬜ Setup monitoring (Datadog/New Relic)
3. ⬜ Configure backups
4. ⬜ Create billing system
5. ⬜ Price: EUR 100-150/month

**C. Hybrid Model:**
1. ⬜ Complete monolith migration
2. ⬜ Deploy customer app to Vercel
3. ⬜ Setup webhook sync
4. ⬜ Test offline functionality
5. ⬜ Price: EUR 500 setup + EUR 50/month

**Time:** 4-6 weeks
**Cost:** Varies by model

---

## Next Steps - Choose Your Path

### Path 1: Quick Test (Recommended First Step)

**Do This NOW:**
```bash
# 1. Install ngrok
brew install ngrok

# 2. Start ngrok
ngrok http 3000

# 3. Update .env with ngrok URL
# 4. Restart services
# 5. Test email on phone
```

**Time:** 5 minutes
**Result:** Know if email links work ✅

---

### Path 2: Create Installer (For Selling)

**Do This Week:**
1. Create docker-compose.yml
2. Write installer scripts
3. Test on clean machine
4. Package for distribution

**Time:** 2-3 days
**Result:** Installable software ready for customers ✅

---

### Path 3: Deploy to Cloud (For SaaS)

**Do This Month:**
1. Complete monolith migration
2. Deploy to Render + Vercel
3. Setup MongoDB Atlas
4. Test with real traffic

**Time:** 2-4 weeks
**Result:** SaaS product live ✅

---

## Support & Resources

### Documentation
- Installation Guide: `README.md`
- User Manual: `USER_MANUALS.md`
- API Documentation: `API_DOCUMENTATION.md`
- Troubleshooting: `TROUBLESHOOTING.md`

### External Resources
- Docker Desktop: https://www.docker.com/products/docker-desktop
- ngrok: https://ngrok.com
- Cloudflare Tunnel: https://developers.cloudflare.com/cloudflare-one/connections/connect-apps
- No-IP DynDNS: https://www.noip.com
- MongoDB Atlas: https://www.mongodb.com/cloud/atlas
- Vercel: https://vercel.com
- Render.com: https://render.com

### Contact
- **Email:** support@masova.com
- **Documentation:** https://docs.masova.com
- **Community:** https://community.masova.com

---

## Conclusion

MaSoVa offers **flexible deployment options** to suit different customer needs:

1. **Self-Hosted** - For restaurants wanting full control and offline capability
2. **Cloud SaaS** - For restaurants wanting managed service
3. **Hybrid** - For best user experience with offline POS

**The key decision point:** Email tracking links

- **Local only:** Works on restaurant WiFi (free)
- **External access:** Requires ngrok/Cloudflare/port forwarding ($0-8/month)
- **Cloud hosting:** Always accessible (EUR 100-150/month or $55-75 infrastructure)

**Recommendation:** Start with ngrok testing (5 minutes), then decide on final deployment model based on customer requirements.

**Market Reality:** This is a EUR 20K-75K product. Don't treat it like a hobby project. Invest in proper infrastructure that matches the product quality.

---

**Document End**
