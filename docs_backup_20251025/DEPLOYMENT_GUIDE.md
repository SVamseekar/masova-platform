# MaSoVa Restaurant Management System - Deployment Guide
**Version:** 1.0
**Last Updated:** October 23, 2025
**Target:** Development, Staging, Production

---

## 📚 Table of Contents

1. [System Requirements](#system-requirements)
2. [Environment Setup](#environment-setup)
3. [Database Setup](#database-setup)
4. [Backend Deployment](#backend-deployment)
5. [Frontend Deployment](#frontend-deployment)
6. [Docker Deployment](#docker-deployment)
7. [Production Checklist](#production-checklist)
8. [Monitoring & Maintenance](#monitoring--maintenance)

---

## System Requirements

### Development Environment:
- **Java:** JDK 17 or higher
- **Node.js:** v18.x or higher
- **npm:** v9.x or higher
- **MongoDB:** v6.0 or higher
- **Redis:** v7.0 or higher
- **Maven:** v3.8 or higher
- **Git:** Latest version

### Production Environment:
- **Server:** Ubuntu 22.04 LTS or CentOS 8
- **RAM:** Minimum 8GB (16GB recommended)
- **CPU:** 4 cores minimum (8 cores recommended)
- **Storage:** 100GB SSD minimum
- **Network:** Static IP with SSL certificate

---

## Environment Setup

### 1. Clone Repository

```bash
git clone https://github.com/your-org/MaSoVa-restaurant-management-system.git
cd MaSoVa-restaurant-management-system
```

### 2. Create Environment Files

Create `.env` file in root directory:

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```env
# ============================================
# DATABASE CONFIGURATION
# ============================================
MONGO_URI=mongodb://localhost:27017
MONGO_DATABASE=masova
MONGO_USERNAME=admin
MONGO_PASSWORD=your_secure_password
MONGO_AUTH_SOURCE=admin

MONGO_MENU_DATABASE=masova_menu
MONGO_ORDER_DATABASE=masova_orders

# ============================================
# REDIS CONFIGURATION
# ============================================
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your_redis_password
REDIS_TTL_MENU=3600
REDIS_TTL_USER=1800
REDIS_TTL_ANALYTICS_SALES=300
REDIS_TTL_ANALYTICS_STAFF=600
REDIS_TTL_ANALYTICS_DRIVERS=120

# ============================================
# JWT CONFIGURATION
# ============================================
JWT_SECRET=your_super_secure_jwt_secret_key_min_256_bits_long_change_in_production
JWT_EXPIRATION=86400000

# ============================================
# SERVICE PORTS
# ============================================
API_GATEWAY_PORT=8080
USER_SERVICE_PORT=8081
MENU_SERVICE_PORT=8082
ORDER_SERVICE_PORT=8083
ANALYTICS_SERVICE_PORT=8085

# ============================================
# SERVICE URLs (Internal Communication)
# ============================================
USER_SERVICE_URL=http://localhost:8081
MENU_SERVICE_URL=http://localhost:8082
ORDER_SERVICE_URL=http://localhost:8083
ANALYTICS_SERVICE_URL=http://localhost:8085

# ============================================
# FRONTEND CONFIGURATION
# ============================================
REACT_APP_API_URL=http://localhost:8080
REACT_APP_GOOGLE_MAPS_API_KEY=your_google_maps_api_key

# ============================================
# BUSINESS CONFIGURATION
# ============================================
DELIVERY_FEE=40
TAX_RATE=9
CURRENCY=INR

# ============================================
# LOGGING
# ============================================
LOG_LEVEL=INFO
LOG_FILE_PATH=/var/log/masova

# ============================================
# PRODUCTION SETTINGS
# ============================================
CORS_ALLOWED_ORIGINS=http://localhost:3000,https://yourdomain.com
RATE_LIMIT_REQUESTS_PER_MINUTE=100
```

---

## Database Setup

### 1. Install MongoDB

**Ubuntu/Debian:**
```bash
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
sudo apt-get update
sudo apt-get install -y mongodb-org
sudo systemctl start mongod
sudo systemctl enable mongod
```

**macOS:**
```bash
brew tap mongodb/brew
brew install mongodb-community@6.0
brew services start mongodb-community@6.0
```

**Windows:**
Download and install from: https://www.mongodb.com/try/download/community

### 2. Create MongoDB Databases

```bash
mongosh
```

```javascript
// Create admin user
use admin
db.createUser({
  user: "admin",
  pwd: "your_secure_password",
  roles: ["root"]
})

// Create databases
use masova
db.createCollection("users")
db.createCollection("stores")
db.createCollection("shifts")
db.createCollection("sessions")

use masova_menu
db.createCollection("menu_items")

use masova_orders
db.createCollection("orders")
db.createCollection("kitchen_queue")

// Create indexes
use masova
db.users.createIndex({ "email": 1 }, { unique: true })
db.users.createIndex({ "type": 1 })
db.sessions.createIndex({ "userId": 1 })
db.sessions.createIndex({ "clockIn": -1 })

use masova_orders
db.orders.createIndex({ "orderNumber": 1 }, { unique: true })
db.orders.createIndex({ "storeId": 1, "createdAt": -1 })
db.orders.createIndex({ "status": 1 })
db.orders.createIndex({ "driverId": 1 })
db.orders.createIndex({ "createdAt": -1 })

use masova_menu
db.menu_items.createIndex({ "category": 1 })
db.menu_items.createIndex({ "name": "text" })
db.menu_items.createIndex({ "available": 1 })
```

### 3. Install Redis

**Ubuntu/Debian:**
```bash
sudo apt-get update
sudo apt-get install redis-server
sudo systemctl start redis-server
sudo systemctl enable redis-server
```

**macOS:**
```bash
brew install redis
brew services start redis
```

**Configure Redis:**
```bash
sudo nano /etc/redis/redis.conf
```

Update configuration:
```conf
requirepass your_redis_password
maxmemory 256mb
maxmemory-policy allkeys-lru
```

Restart Redis:
```bash
sudo systemctl restart redis-server
```

### 4. Seed Test Data (Optional)

```bash
cd scripts
node seed-database.js
```

---

## Backend Deployment

### Development Mode

**Option 1: Run All Services from Root**
```bash
# Terminal 1 - API Gateway
cd api-gateway
mvn spring-boot:run

# Terminal 2 - User Service
cd user-service
mvn spring-boot:run

# Terminal 3 - Menu Service
cd menu-service
mvn spring-boot:run

# Terminal 4 - Order Service
cd order-service
mvn spring-boot:run

# Terminal 5 - Analytics Service
cd analytics-service
mvn spring-boot:run
```

**Option 2: Build and Run JARs**
```bash
# Build all services
mvn clean package -DskipTests

# Run services
java -jar api-gateway/target/api-gateway-1.0.0.jar &
java -jar user-service/target/user-service-1.0.0.jar &
java -jar menu-service/target/menu-service-1.0.0.jar &
java -jar order-service/target/order-service-1.0.0.jar &
java -jar analytics-service/target/analytics-service-1.0.0.jar &
```

### Production Deployment (Systemd Services)

Create service files for each microservice:

**1. API Gateway Service**

```bash
sudo nano /etc/systemd/system/masova-gateway.service
```

```ini
[Unit]
Description=MaSoVa API Gateway
After=network.target

[Service]
Type=simple
User=masova
WorkingDirectory=/opt/masova
ExecStart=/usr/bin/java -jar /opt/masova/api-gateway.jar
Restart=on-failure
RestartSec=10
StandardOutput=journal
StandardError=journal

Environment="SPRING_PROFILES_ACTIVE=production"
Environment="JAVA_OPTS=-Xmx512m -Xms256m"

[Install]
WantedBy=multi-user.target
```

Repeat for each service (user, menu, order, analytics).

**2. Enable and Start Services**

```bash
sudo systemctl daemon-reload
sudo systemctl enable masova-gateway
sudo systemctl enable masova-user
sudo systemctl enable masova-menu
sudo systemctl enable masova-order
sudo systemctl enable masova-analytics

sudo systemctl start masova-gateway
sudo systemctl start masova-user
sudo systemctl start masova-menu
sudo systemctl start masova-order
sudo systemctl start masova-analytics
```

**3. Check Service Status**

```bash
sudo systemctl status masova-gateway
sudo journalctl -u masova-gateway -f
```

---

## Frontend Deployment

### Development Mode

```bash
cd frontend
npm install
npm start
```

Frontend runs on `http://localhost:3000`

### Production Build

```bash
cd frontend
npm run build
```

This creates optimized production build in `frontend/build/`

### Deploy to Nginx

**1. Install Nginx**

```bash
sudo apt-get update
sudo apt-get install nginx
```

**2. Configure Nginx**

```bash
sudo nano /etc/nginx/sites-available/masova
```

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    root /var/www/masova/build;
    index index.html;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/json;

    # React Router support
    location / {
        try_files $uri $uri/ /index.html;
    }

    # API proxy
    location /api/ {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

**3. Enable Site and Restart Nginx**

```bash
sudo ln -s /etc/nginx/sites-available/masova /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

**4. Copy Build Files**

```bash
sudo mkdir -p /var/www/masova
sudo cp -r frontend/build/* /var/www/masova/
sudo chown -R www-data:www-data /var/www/masova
```

### SSL Certificate (Let's Encrypt)

```bash
sudo apt-get install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
sudo systemctl reload nginx
```

---

## Docker Deployment

### 1. Create Docker Compose File

```yaml
# docker-compose.yml
version: '3.8'

services:
  mongodb:
    image: mongo:6.0
    container_name: masova-mongodb
    restart: always
    ports:
      - "27017:27017"
    environment:
      MONGO_INITDB_ROOT_USERNAME: admin
      MONGO_INITDB_ROOT_PASSWORD: ${MONGO_PASSWORD}
    volumes:
      - mongodb_data:/data/db
    networks:
      - masova-network

  redis:
    image: redis:7-alpine
    container_name: masova-redis
    restart: always
    ports:
      - "6379:6379"
    command: redis-server --requirepass ${REDIS_PASSWORD}
    volumes:
      - redis_data:/data
    networks:
      - masova-network

  api-gateway:
    build:
      context: ./api-gateway
      dockerfile: Dockerfile
    container_name: masova-gateway
    restart: always
    ports:
      - "8080:8080"
    environment:
      - SPRING_PROFILES_ACTIVE=production
      - MONGO_URI=${MONGO_URI}
      - REDIS_HOST=redis
      - JWT_SECRET=${JWT_SECRET}
    depends_on:
      - mongodb
      - redis
    networks:
      - masova-network

  user-service:
    build:
      context: ./user-service
      dockerfile: Dockerfile
    container_name: masova-user-service
    restart: always
    ports:
      - "8081:8081"
    environment:
      - SPRING_PROFILES_ACTIVE=production
      - MONGO_URI=${MONGO_URI}
      - REDIS_HOST=redis
      - JWT_SECRET=${JWT_SECRET}
    depends_on:
      - mongodb
      - redis
    networks:
      - masova-network

  menu-service:
    build:
      context: ./menu-service
      dockerfile: Dockerfile
    container_name: masova-menu-service
    restart: always
    ports:
      - "8082:8082"
    environment:
      - SPRING_PROFILES_ACTIVE=production
      - MONGO_URI=${MONGO_URI}
      - REDIS_HOST=redis
    depends_on:
      - mongodb
      - redis
    networks:
      - masova-network

  order-service:
    build:
      context: ./order-service
      dockerfile: Dockerfile
    container_name: masova-order-service
    restart: always
    ports:
      - "8083:8083"
    environment:
      - SPRING_PROFILES_ACTIVE=production
      - MONGO_URI=${MONGO_URI}
    depends_on:
      - mongodb
    networks:
      - masova-network

  analytics-service:
    build:
      context: ./analytics-service
      dockerfile: Dockerfile
    container_name: masova-analytics-service
    restart: always
    ports:
      - "8085:8085"
    environment:
      - SPRING_PROFILES_ACTIVE=production
      - MONGO_URI=${MONGO_URI}
      - REDIS_HOST=redis
    depends_on:
      - mongodb
      - redis
    networks:
      - masova-network

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    container_name: masova-frontend
    restart: always
    ports:
      - "80:80"
    depends_on:
      - api-gateway
    networks:
      - masova-network

volumes:
  mongodb_data:
  redis_data:

networks:
  masova-network:
    driver: bridge
```

### 2. Create Dockerfiles

**Backend Services Dockerfile (same for all services):**

```dockerfile
# Example: api-gateway/Dockerfile
FROM eclipse-temurin:17-jdk-alpine AS build
WORKDIR /app
COPY pom.xml .
COPY src ./src
COPY mvnw .
COPY .mvn ./.mvn
RUN chmod +x mvnw
RUN ./mvnw clean package -DskipTests

FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
```

**Frontend Dockerfile:**

```dockerfile
# frontend/Dockerfile
FROM node:18-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### 3. Run with Docker Compose

```bash
# Build and start all services
docker-compose up -d --build

# View logs
docker-compose logs -f

# Stop all services
docker-compose down

# Stop and remove volumes
docker-compose down -v
```

---

## Production Checklist

### Security:
- [ ] Change all default passwords
- [ ] Generate strong JWT secret (minimum 256 bits)
- [ ] Enable MongoDB authentication
- [ ] Enable Redis password protection
- [ ] Configure firewall (UFW or firewalld)
- [ ] Install SSL certificate (HTTPS)
- [ ] Set up API rate limiting
- [ ] Disable CORS for production (specific origins only)
- [ ] Remove /actuator endpoints or secure them
- [ ] Enable request logging
- [ ] Set up intrusion detection

### Performance:
- [ ] Configure Redis maxmemory
- [ ] Set up MongoDB indexes
- [ ] Enable gzip compression (Nginx)
- [ ] Configure connection pooling
- [ ] Set JVM memory limits
- [ ] Enable caching headers
- [ ] Optimize frontend bundle size
- [ ] Use CDN for static assets

### Monitoring:
- [ ] Set up application logging (ELK stack or similar)
- [ ] Configure health check endpoints
- [ ] Set up uptime monitoring (UptimeRobot, Pingdom)
- [ ] Enable error tracking (Sentry, Rollbar)
- [ ] Configure server monitoring (Prometheus, Grafana)
- [ ] Set up database backups (automated)
- [ ] Create alerting rules (email, Slack)

### Backup & Recovery:
- [ ] Schedule MongoDB backups (daily)
- [ ] Schedule Redis backups
- [ ] Test restore procedures
- [ ] Document recovery steps
- [ ] Set up off-site backup storage

### Documentation:
- [ ] Document environment variables
- [ ] Create runbook for common issues
- [ ] Document deployment procedure
- [ ] Create API documentation (Swagger)
- [ ] Document database schema

---

## Monitoring & Maintenance

### Health Checks

```bash
# Check service health
curl http://localhost:8080/actuator/health
curl http://localhost:8081/actuator/health
curl http://localhost:8082/actuator/health
curl http://localhost:8083/actuator/health
curl http://localhost:8085/actuator/health
```

### View Logs

```bash
# Backend services (systemd)
sudo journalctl -u masova-gateway -f
sudo journalctl -u masova-user -f
sudo journalctl -u masova-order -f

# Application logs
tail -f /var/log/masova/gateway.log
tail -f /var/log/masova/user-service.log

# Nginx logs
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log

# MongoDB logs
sudo journalctl -u mongod -f
```

### Database Backup

```bash
#!/bin/bash
# backup-mongodb.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/opt/backups/mongodb"
mkdir -p $BACKUP_DIR

mongodump --uri="mongodb://admin:password@localhost:27017" \
  --out="$BACKUP_DIR/backup_$DATE"

# Keep only last 7 days
find $BACKUP_DIR -type d -mtime +7 -exec rm -rf {} \;

echo "Backup completed: $BACKUP_DIR/backup_$DATE"
```

Schedule with cron:
```bash
crontab -e
# Daily backup at 2 AM
0 2 * * * /opt/scripts/backup-mongodb.sh
```

### Update Deployment

```bash
# Pull latest code
git pull origin main

# Rebuild backend
mvn clean package -DskipTests

# Restart services
sudo systemctl restart masova-gateway
sudo systemctl restart masova-user
sudo systemctl restart masova-menu
sudo systemctl restart masova-order
sudo systemctl restart masova-analytics

# Rebuild frontend
cd frontend
npm run build
sudo cp -r build/* /var/www/masova/
sudo systemctl reload nginx
```

---

## Troubleshooting

### Common Issues:

**1. Services won't start:**
```bash
# Check logs
sudo journalctl -u masova-gateway -n 50

# Check port availability
sudo netstat -tulpn | grep 8080

# Verify environment variables
sudo systemctl show masova-gateway -p Environment
```

**2. Database connection errors:**
```bash
# Test MongoDB connection
mongosh --host localhost --port 27017 -u admin -p

# Check MongoDB status
sudo systemctl status mongod

# View MongoDB logs
sudo journalctl -u mongod -n 50
```

**3. Frontend can't reach backend:**
```bash
# Check Nginx configuration
sudo nginx -t

# View Nginx error logs
tail -f /var/log/nginx/error.log

# Test API Gateway directly
curl http://localhost:8080/actuator/health
```

**4. Redis connection issues:**
```bash
# Test Redis
redis-cli -a your_password ping

# Check Redis logs
sudo journalctl -u redis -n 50
```

---

## Support

For deployment issues:
- Email: devops@masova.com
- Slack: #deployments
- Documentation: https://docs.masova.com/deployment

---

**Document Version:** 1.0
**Last Updated:** October 23, 2025
