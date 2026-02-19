#!/bin/bash

# MaSoVa - Start All Backend Services + Frontend
# Usage: ./start-all.sh

# Set Java 21 for backend
export JAVA_HOME=/Library/Java/JavaVirtualMachines/temurin-21.jdk/Contents/Home
export PATH=$JAVA_HOME/bin:$PATH

BASE_DIR="/Users/souravamseekarmarti/Projects/MaSoVa-restaurant-management-system"
LOG_DIR="/tmp/masova-logs"

# Create log directory
mkdir -p $LOG_DIR

echo "============================================"
echo "  MaSoVa - Starting All Services"
echo "============================================"
echo ""
echo "Using Java: $(java -version 2>&1 | head -1)"
echo "Logs: $LOG_DIR/"
echo ""

# Backend Services — Phase 1 consolidated architecture (name:port)
SERVICES=(
    "api-gateway:8080"
    "core-service:8085"
    "commerce-service:8084"
    "payment-service:8089"
    "logistics-service:8086"
    "intelligence-service:8087"
)

echo "--- Starting Backend Services ---"
echo ""

# Start each backend service
for service_info in "${SERVICES[@]}"; do
    service_name="${service_info%%:*}"
    port="${service_info##*:}"
    service_dir="$BASE_DIR/$service_name"

    if [ -d "$service_dir" ]; then
        echo "Starting $service_name (port $port)..."
        cd "$service_dir"
        mvn spring-boot:run -Dmaven.test.skip=true > "$LOG_DIR/$service_name.log" 2>&1 &
        echo "  PID: $! | Log: $LOG_DIR/$service_name.log"
    else
        echo "  [SKIP] $service_name - directory not found"
    fi
done

echo ""
echo "--- Starting Frontend ---"
echo ""

# Start Frontend
FRONTEND_DIR="$BASE_DIR/frontend"
if [ -d "$FRONTEND_DIR" ]; then
    echo "Starting frontend (port 3000)..."
    cd "$FRONTEND_DIR"
    npm run dev > "$LOG_DIR/frontend.log" 2>&1 &
    echo "  PID: $! | Log: $LOG_DIR/frontend.log"
else
    echo "  [SKIP] frontend - directory not found"
fi

echo ""
echo "============================================"
echo "  All services starting in background!"
echo "============================================"
echo ""
echo "Service URLs:"
echo ""
echo "  FRONTEND:"
echo "    Web App:                http://localhost:3000"
echo ""
echo "  BACKEND (Phase 1 Architecture):"
echo "    API Gateway:            http://localhost:8080"
echo "    Core Service:           http://localhost:8085  (users, customers, notifications, campaigns, reviews)"
echo "    Commerce Service:       http://localhost:8084  (menu, orders, kitchen)"
echo "    Payment Service:        http://localhost:8089  (payments, refunds)"
echo "    Logistics Service:      http://localhost:8086  (delivery, inventory, suppliers)"
echo "    Intelligence Service:   http://localhost:8087  (analytics, BI, reports)"
echo ""
echo "  DATABASES:"
echo "    MongoDB:                mongodb://localhost:27017"
echo "      masova_core           (core-service)"
echo "      masova_commerce       (commerce-service: menu + orders)"
echo "      masova_payment        (payment-service)"
echo "      masova_logistics      (logistics-service)"
echo "      masova_analytics      (intelligence-service)"
echo "    Redis:                  redis://localhost:6379"
echo ""
echo "Commands:"
echo "  View logs:  tail -f $LOG_DIR/<service-name>.log"
echo "  Stop all:   ./stop-all.sh"
echo ""
echo "Wait ~30-60 seconds for services to fully start."
