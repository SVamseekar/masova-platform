#!/bin/bash

# Load environment variables from .env file
set -a
source .env
set +a

# Start order-service
cd order-service
mvn spring-boot:run > /tmp/order-service.log 2>&1 &
ORDER_PID=$!
echo "Started order-service with PID: $ORDER_PID"

# Go back to root
cd ..

# Start notification-service
cd notification-service
mvn spring-boot:run > /tmp/notification-service.log 2>&1 &
NOTIFICATION_PID=$!
echo "Started notification-service with PID: $NOTIFICATION_PID"

echo ""
echo "Services started successfully!"
echo "Order Service PID: $ORDER_PID"
echo "Notification Service PID: $NOTIFICATION_PID"
echo ""
echo "Check logs:"
echo "  tail -f /tmp/order-service.log"
echo "  tail -f /tmp/notification-service.log"
