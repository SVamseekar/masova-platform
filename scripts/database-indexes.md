# MongoDB Database Index Optimization
## Phase 13: Performance Optimization - Database Indexes

This document provides MongoDB indexing strategies for optimal query performance.

## General Index Strategy

### Index Types
- **Single Field Index**: For frequently queried single fields
- **Compound Index**: For queries involving multiple fields
- **Text Index**: For text search functionality
- **Geospatial Index**: For location-based queries

### Index Guidelines
- Create indexes on fields used in WHERE clauses
- Create indexes on fields used for sorting
- Avoid indexing fields with low cardinality
- Monitor index usage and remove unused indexes
- Consider index size and RAM constraints

## Service-Specific Indexes

### Menu Service
```javascript
db.menu_items.createIndex({ "restaurantId": 1, "category": 1, "available": 1 })
db.menu_items.createIndex({ "name": "text", "description": "text" })
db.menu_items.createIndex({ "price": 1 })
db.menu_items.createIndex({ "createdAt": -1 })
db.categories.createIndex({ "restaurantId": 1, "name": 1 }, { unique: true })
```

### Order Service
```javascript
db.orders.createIndex({ "customerId": 1, "status": 1, "createdAt": -1 })
db.orders.createIndex({ "restaurantId": 1, "status": 1, "createdAt": -1 })
db.orders.createIndex({ "orderNumber": 1 }, { unique: true })
db.orders.createIndex({ "status": 1, "createdAt": -1 })
db.orders.createIndex({ "tableNumber": 1, "status": 1 })
db.order_items.createIndex({ "orderId": 1 })
```

### User Service
```javascript
db.users.createIndex({ "email": 1 }, { unique: true })
db.users.createIndex({ "username": 1 }, { unique: true, sparse: true })
db.users.createIndex({ "role": 1, "active": 1 })
db.users.createIndex({ "createdAt": -1 })
```

### Customer Service
```javascript
db.customers.createIndex({ "userId": 1 }, { unique: true })
db.customers.createIndex({ "loyaltyTier": 1, "points": -1 })
db.customers.createIndex({ "email": 1 })
db.customers.createIndex({ "phone": 1 })
db.loyalty_transactions.createIndex({ "customerId": 1, "createdAt": -1 })
```

### Inventory Service
```javascript
db.inventory_items.createIndex({ "restaurantId": 1, "name": 1 })
db.inventory_items.createIndex({ "sku": 1 }, { unique: true })
db.inventory_items.createIndex({ "quantity": 1, "reorderLevel": 1 })
db.inventory_items.createIndex({ "categoryId": 1 })
db.inventory_transactions.createIndex({ "inventoryItemId": 1, "createdAt": -1 })
```

### Payment Service
```javascript
db.payments.createIndex({ "orderId": 1 })
db.payments.createIndex({ "customerId": 1, "createdAt": -1 })
db.payments.createIndex({ "status": 1, "createdAt": -1 })
db.payments.createIndex({ "razorpayPaymentId": 1 }, { unique: true, sparse: true })
db.refunds.createIndex({ "paymentId": 1 })
```

### Analytics Service
```javascript
db.analytics_events.createIndex({ "eventType": 1, "timestamp": -1 })
db.analytics_events.createIndex({ "restaurantId": 1, "timestamp": -1 })
db.analytics_events.createIndex({ "userId": 1, "timestamp": -1 })
db.daily_metrics.createIndex({ "date": -1, "restaurantId": 1 }, { unique: true })
```

### Delivery Service
```javascript
db.deliveries.createIndex({ "orderId": 1 }, { unique: true })
db.deliveries.createIndex({ "deliveryPersonId": 1, "status": 1 })
db.deliveries.createIndex({ "status": 1, "estimatedDeliveryTime": 1 })
db.deliveries.createIndex({ "location.coordinates": "2dsphere" })
```

### Review Service
```javascript
db.reviews.createIndex({ "menuItemId": 1, "createdAt": -1 })
db.reviews.createIndex({ "customerId": 1, "createdAt": -1 })
db.reviews.createIndex({ "rating": -1 })
db.reviews.createIndex({ "approved": 1, "createdAt": -1 })
```

### Notification Service
```javascript
db.notifications.createIndex({ "userId": 1, "read": 1, "createdAt": -1 })
db.notifications.createIndex({ "type": 1, "createdAt": -1 })
db.notifications.createIndex({ "read": 1, "createdAt": -1 })
```

## Compound Index Optimization

### Order Queries (Most Common)
```javascript
// For: Get orders by customer with status filter
db.orders.createIndex({ "customerId": 1, "status": 1, "createdAt": -1 })

// For: Get orders by restaurant with date range
db.orders.createIndex({ "restaurantId": 1, "createdAt": -1 })

// For: Get active orders by table
db.orders.createIndex({ "tableNumber": 1, "status": 1 })
```

### Menu Item Queries
```javascript
// For: Get available items by restaurant and category
db.menu_items.createIndex({ "restaurantId": 1, "category": 1, "available": 1 })

// For: Price range queries
db.menu_items.createIndex({ "restaurantId": 1, "price": 1, "available": 1 })
```

## Index Maintenance

### Check Index Usage
```javascript
db.collection.aggregate([{ $indexStats: {} }])
```

### Analyze Query Performance
```javascript
db.collection.find({...}).explain("executionStats")
```

### Drop Unused Indexes
```javascript
db.collection.dropIndex("index_name")
```

## Performance Monitoring

### Monitor Slow Queries
```javascript
db.setProfilingLevel(1, { slowms: 100 })
db.system.profile.find().sort({ ts: -1 }).limit(10)
```

### Check Index Size
```javascript
db.collection.stats().indexSizes
```

## Best Practices

1. **Create indexes in production carefully** - Indexes lock collections during creation
2. **Use background index creation** - `{ background: true }`
3. **Monitor index memory usage** - Indexes should fit in RAM
4. **Avoid redundant indexes** - Remove indexes covered by compound indexes
5. **Regular index maintenance** - Review and optimize indexes quarterly

## Implementation Script

Run this script to create all indexes:
```bash
mongo < scripts/create-indexes.js
```

See `create-indexes.js` for the full implementation.
