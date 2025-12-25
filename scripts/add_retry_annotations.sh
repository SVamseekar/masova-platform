#!/bin/bash

# Script to add @Retry annotations to all service clients

FILES=(
  "analytics-service/src/main/java/com/MaSoVa/analytics/client/OrderServiceClient.java"
  "analytics-service/src/main/java/com/MaSoVa/analytics/client/InventoryServiceClient.java"
  "analytics-service/src/main/java/com/MaSoVa/analytics/client/UserServiceClient.java"
  "payment-service/src/main/java/com/MaSoVa/payment/service/OrderServiceClient.java"
  "user-service/src/main/java/com/MaSoVa/user/client/OrderServiceClient.java"
  "delivery-service/src/main/java/com/MaSoVa/delivery/client/OrderServiceClient.java"
  "order-service/src/main/java/com/MaSoVa/order/client/MenuServiceClient.java"
  "order-service/src/main/java/com/MaSoVa/order/client/DeliveryServiceClient.java"
)

for file in "${FILES[@]}"; do
  if [ -f "$file" ]; then
    echo "Processing $file"

    # Add import if not exists
    if ! grep -q "import io.github.resilience4j.retry.annotation.Retry;" "$file"; then
      sed -i.bak '/import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;/a\
import io.github.resilience4j.retry.annotation.Retry;
' "$file"
    fi

    # Add @Retry before @CircuitBreaker annotations
    sed -i.bak 's/    @CircuitBreaker/    @Retry\n    @CircuitBreaker/g' "$file"

    # Fix the @Retry to add proper name
    # This is a simplified approach - manual review recommended

    echo "Done with $file"
  else
    echo "File not found: $file"
  fi
done

echo "Script completed!"
