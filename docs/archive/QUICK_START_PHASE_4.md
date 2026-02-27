# Quick Start Guide - Phase 4 Order Service

## Start the Order Service

```bash
cd order-service
mvn spring-boot:run
```

The service will start on **http://localhost:8083**

---

## Test Order Creation

### Create Your First Order

```bash
curl -X POST http://localhost:8083/api/orders \
  -H "Content-Type: application/json" \
  -d '{
    "customerName": "Vamsee",
    "customerPhone": "9999999999",
    "storeId": "your-store-id",
    "items": [
      {
        "menuItemId": "item1",
        "name": "Margherita Pizza",
        "quantity": 2,
        "price": 299.00
      },
      {
        "menuItemId": "item2",
        "name": "Garlic Bread",
        "quantity": 1,
        "price": 99.00
      }
    ],
    "orderType": "DELIVERY",
    "paymentMethod": "CASH",
    "deliveryAddress": {
      "street": "123 Test Street",
      "city": "Bangalore",
      "state": "Karnataka",
      "pincode": "560001"
    }
  }'
```

### Get Kitchen Queue

```bash
curl http://localhost:8083/api/orders/kitchen/your-store-id
```

### Move Order to Next Stage

```bash
# Get the order ID from previous response
curl -X PATCH http://localhost:8083/api/orders/{orderId}/next-stage
```

---

## Test Frontend Integration

1. **Open Kitchen Display**
   ```
   http://localhost:5173/kitchen
   ```

2. **Verify:**
   - No error message (Order Service running)
   - Orders appear in real-time
   - "Next Stage" button works
   - Orders move between columns

3. **Create Order via API:**
   - Use curl command above
   - Watch Kitchen Display update within 5 seconds

---

## Verify All Services Running

```bash
# User Service
curl http://localhost:8081/actuator/health

# Menu Service
curl http://localhost:8082/actuator/health

# Order Service
curl http://localhost:8083/actuator/health
```

All should return: `{"status":"UP"}`

---

## Complete Order Lifecycle Test

```bash
# 1. Create order (status: RECEIVED)
ORDER_ID=$(curl -X POST http://localhost:8083/api/orders ... | jq -r '.id')

# 2. Move to PREPARING
curl -X PATCH http://localhost:8083/api/orders/$ORDER_ID/next-stage

# 3. Move to OVEN
curl -X PATCH http://localhost:8083/api/orders/$ORDER_ID/next-stage

# 4. Move to BAKED
curl -X PATCH http://localhost:8083/api/orders/$ORDER_ID/next-stage

# 5. Move to DISPATCHED
curl -X PATCH http://localhost:8083/api/orders/$ORDER_ID/next-stage

# 6. Move to DELIVERED (final)
curl -X PATCH http://localhost:8083/api/orders/$ORDER_ID/next-stage
```

---

## Troubleshooting

### Service won't start

Check MongoDB and Redis are running:
```bash
# Windows
netstat -an | findstr "27017 6379"

# Should see LISTENING on both ports
```

### Kitchen Display shows error

1. Check order-service is running on port 8083
2. Check browser console for actual error
3. Verify CORS is working (already configured)

### Orders not appearing

1. Check MongoDB connection in logs
2. Verify storeId matches
3. Check order was created successfully

---

## What to Do Next

1. Start order-service
2. Open Kitchen Display
3. Create test orders
4. Watch them flow through stages
5. Test status updates

**Congratulations! Your order management system is live!**
