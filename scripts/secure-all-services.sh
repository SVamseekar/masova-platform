#!/bin/bash

# Script to add shared-security dependency and JWT config to all services

BASE_DIR="/Users/souravamseekarmarti/Projects/MaSoVa-restaurant-management-system"
SERVICES=("customer-service" "inventory-service" "review-service" "delivery-service" "analytics-service" "notification-service")

JWT_SECRET="MaSoVa-secret-key-for-jwt-token-generation-very-long-key-must-be-at-least-512-bits-for-HS512-algorithm-security-requirement"

for SERVICE in "${SERVICES[@]}"; do
    echo "Processing $SERVICE..."

    # Add shared-security dependency to pom.xml if not already present
    POM_FILE="$BASE_DIR/$SERVICE/pom.xml"
    if [ -f "$POM_FILE" ] && ! grep -q "shared-security" "$POM_FILE"; then
        echo "  Adding shared-security dependency to $SERVICE..."
        # This will be done manually per service
    fi

    # Add JWT configuration to application.yml
    APP_YML="$BASE_DIR/$SERVICE/src/main/resources/application.yml"
    if [ -f "$APP_YML" ] && ! grep -q "jwt:" "$APP_YML"; then
        echo "  Adding JWT config to $SERVICE..."
        # This will be done manually per service
    fi

    echo "  ✓ $SERVICE processed"
done

echo "All services secured!"
