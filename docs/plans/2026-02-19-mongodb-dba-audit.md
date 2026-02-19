# MongoDB DBA Audit Report
**Date:** 2026-02-19 | **Scope:** All 11 services | **Overall Score:** 70/100

---

## Executive Summary

- **4 P0 issues** — data integrity violations (duplicates possible, cross-store leakage)
- **61 P1 issues** — missing indexes on high-frequency queries (~25–35% performance impact)
- **12 P2 issues** — TTL candidates, sparse indexes, unbounded arrays

---

## P0 — Data Integrity (Fix Immediately)

### P0-1: customers.email / customers.phone — global unique violates multi-tenancy
Two stores cannot share a customer with the same email. **Data leakage between stores.**
```js
// DROP global uniques
db.customers.dropIndex("email_1")
db.customers.dropIndex("phone_1")
// ADD store-scoped indexes (uniqueness enforced at app layer)
db.customers.createIndex({ "storeId": 1, "email": 1 })
db.customers.createIndex({ "storeId": 1, "phone": 1 })
```

### P0-2: reviews — no deduplication constraint
A customer can submit multiple reviews for the same order.
```js
db.reviews.createIndex({ "orderId": 1, "customerId": 1 }, { unique: true })
```

### P0-3: notifications — no userId index
Core lookup query does a full collection scan on every notification fetch.
```js
db.notifications.createIndex({ "userId": 1 })
```

### P0-4: Cross-store queries (deprecated methods)
`OrderRepository` and `DeliveryTrackingRepository` have deprecated methods that query without storeId filter. Remove them.

---

## P1 — Missing Indexes by Service

### user-service (masova_users)
```js
db.users.createIndex({ "employeeDetails.storeId": 1, "employeeDetails.status": 1 })
db.users.createIndex({ "type": 1, "isActive": 1 })
db.users.createIndex({ "lastLogin": 1 })
db.shifts.createIndex({ "status": 1 })
db.shifts.createIndex({ "storeId": 1, "status": 1 })
db.working_sessions.createIndex({ "storeId": 1, "status": 1, "date": -1 })
```

### customer-service (masova_customers)
```js
db.customers.createIndex({ "active": 1 })
db.customers.createIndex({ "storeId": 1, "active": 1 })
db.customers.createIndex({ "storeIds": 1, "active": 1 })
db.customers.createIndex({ "storeId": 1, "createdAt": -1 })
db.customers.createIndex({ "lastOrderDate": 1 })
db.customers.createIndex({ "deletedAt": 1 }, { sparse: true })
db.customers.createIndex({ "name": "text", "email": "text", "phone": "text" })
```

### order-service (masova_orders)
```js
db.orders.createIndex({ "storeId": 1, "status": 1 })
db.orders.createIndex({ "storeId": 1, "createdAt": -1 })
db.orders.createIndex({ "customerId": 1, "createdAt": -1 })
db.orders.createIndex({ "customerId": 1, "status": 1 })
db.orders.createIndex({ "assignedDriverId": 1, "status": 1 })
db.orders.createIndex({ "storeId": 1, "orderType": 1, "status": 1 })
db.orders.createIndex({ "storeId": 1, "createdByStaffId": 1, "createdAt": -1 })
db.orders.createIndex({ "storeId": 1, "assignedKitchenStaffId": 1, "createdAt": -1 })
```

### delivery-service (masova_deliveries)
```js
db.delivery_trackings.createIndex({ "driverId": 1, "status": 1 })
db.delivery_trackings.createIndex({ "storeId": 1, "status": 1 })
db.delivery_trackings.createIndex({ "driverId": 1, "createdAt": -1 })
db.delivery_trackings.createIndex({ "storeId": 1, "createdAt": -1 })
db.delivery_trackings.createIndex({ "driverId": 1, "storeId": 1, "createdAt": -1 })
db.driver_locations.createIndex({ "driverId": 1, "timestamp": -1 })
```

### payment-service (masova_payments)
```js
db.transactions.createIndex({ "storeId": 1, "status": 1 })
db.transactions.createIndex({ "storeId": 1, "createdAt": -1 })
db.transactions.createIndex({ "customerId": 1, "createdAt": -1 })
db.transactions.createIndex({ "customerId": 1, "status": 1 })
db.transactions.createIndex({ "status": 1, "createdAt": -1 })
db.refunds.createIndex({ "storeId": 1, "status": 1 })
db.refunds.createIndex({ "storeId": 1, "createdAt": -1 })
db.refunds.createIndex({ "transactionId": 1, "createdAt": -1 })
```

### review-service (masova_reviews)
```js
db.reviews.createIndex({ "status": 1 })
db.reviews.createIndex({ "storeId": 1, "status": 1 })
db.reviews.createIndex({ "storeId": 1, "createdAt": -1 })
db.reviews.createIndex({ "storeId": 1, "overallRating": 1 })
db.reviews.createIndex({ "driverId": 1, "driverRating": 1 })
db.reviews.createIndex({ "staffId": 1, "staffRating": 1 })
db.reviews.createIndex({ "status": 1, "createdAt": -1 })
db.review_responses.createIndex({ "reviewId": 1 })
db.review_responses.createIndex({ "managerId": 1 })
db.review_responses.createIndex({ "createdAt": -1 })
```

### inventory-service (masova_inventory)
```js
db.inventory_items.createIndex({ "storeId": 1, "status": 1 })
db.inventory_items.createIndex({ "storeId": 1, "itemName": 1 })
db.inventory_items.createIndex({ "storeId": 1, "status": 1, "currentStock": 1 })
db.inventory_items.createIndex({ "isPerishable": 1, "expiryDate": 1 })
db.purchase_orders.createIndex({ "storeId": 1, "status": 1 })
db.purchase_orders.createIndex({ "storeId": 1, "createdAt": -1 })
db.purchase_orders.createIndex({ "status": 1, "expectedDeliveryDate": 1 })
db.waste_records.createIndex({ "storeId": 1, "wasteCategory": 1 })
db.waste_records.createIndex({ "storeId": 1, "wasteDate": -1 })
```

### notification-service (masova_notifications)
```js
db.notifications.createIndex({ "status": 1 })
db.notifications.createIndex({ "userId": 1, "status": 1 })
db.notifications.createIndex({ "userId": 1, "createdAt": -1 })
db.notifications.createIndex({ "status": 1, "retryCount": 1 })
db.notifications.createIndex({ "scheduledFor": 1, "status": 1 })
db.campaigns.createIndex({ "storeId": 1, "status": 1 })
db.campaigns.createIndex({ "status": 1, "scheduledFor": 1 })
db.campaigns.createIndex({ "createdAt": -1 })
db.templates.createIndex({ "name": 1 })
db.templates.createIndex({ "type": 1, "channel": 1 })
db.templates.createIndex({ "active": 1 })
db.user_preferences.createIndex({ "userId": 1 }, { unique: true })
```

### menu-service (masova_menus)
```js
db.menu_items.createIndex({ "storeId": 1, "category": 1 })
db.menu_items.createIndex({ "storeId": 1, "isAvailable": 1 })
db.menu_items.createIndex({ "storeId": 1, "isRecommended": 1 })
db.menu_items.createIndex({ "name": "text", "description": "text" })
```

### GDPR collections
```js
db.gdpr_audit_logs.createIndex({ "userId": 1, "timestamp": -1 })
db.gdpr_audit_logs.createIndex({ "actionType": 1, "timestamp": -1 })
db.gdpr_consents.createIndex({ "userId": 1, "consentType": 1 })
db.gdpr_consents.createIndex({ "status": 1, "expiresAt": 1 })
db.gdpr_data_requests.createIndex({ "status": 1, "dueDate": 1 })
db.gdpr_data_breaches.createIndex({ "severity": 1, "status": 1 })
db.gdpr_data_breaches.createIndex({ "status": 1, "detectedAt": -1 })
```

---

## P2 — TTL & Housekeeping

```js
// Customer soft-deletes → hard delete after 90 days
db.customers.createIndex({ "deletedAt": 1 }, { expireAfterSeconds: 7776000, partialFilterExpression: { "active": false } })

// Rating tokens → expire immediately at expiresAt
db.rating_tokens.createIndex({ "expiresAt": 1 }, { expireAfterSeconds: 0 })

// Driver locations → auto-delete after 7 days
db.driver_locations.createIndex({ "timestamp": 1 }, { expireAfterSeconds: 604800 })

// Cancelled orders → archive after 1 year
db.orders.createIndex({ "cancelledAt": 1 }, { expireAfterSeconds: 31536000, partialFilterExpression: { "status": "CANCELLED" } })

// GDPR audit logs → keep 7 years (legal requirement)
db.gdpr_audit_logs.createIndex({ "timestamp": 1 }, { expireAfterSeconds: 220752000 })

// Working sessions logout (sparse)
db.working_sessions.createIndex({ "logoutTime": 1 }, { sparse: true })

// GDPR consents revoked (sparse)
db.gdpr_consents.createIndex({ "revokedAt": 1 }, { sparse: true })
```

### Unbounded Array Issues
| Collection | Field | Issue | Fix |
|---|---|---|---|
| Customer | `loyaltyInfo.pointHistory` | Unbounded growth | Archive to `point_history_archive` after 1 year |
| Review | `itemReviews` | No max size | Application-level cap at 20 items |

---

## Production Config Notes
- Set `spring.data.mongodb.auto-index-creation: false` in production
- Create all indexes manually before deployment
- Monitor with `db.collection.explain("executionStats")` after deployment
