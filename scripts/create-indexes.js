// MongoDB Index Creation Script
// Phase 13: Performance Optimization - Database Indexes
// Run with: mongo < scripts/create-indexes.js

print("Starting index creation...");

// Menu Service Indexes
print("\nCreating Menu Service indexes...");
db = db.getSiblingDB('menu_db');
db.menu_items.createIndex({ "restaurantId": 1, "category": 1, "available": 1 });
db.menu_items.createIndex({ "name": "text", "description": "text" });
db.menu_items.createIndex({ "price": 1 });
db.menu_items.createIndex({ "createdAt": -1 });
db.categories.createIndex({ "restaurantId": 1, "name": 1 }, { unique: true });
print("Menu Service indexes created");

// Order Service Indexes
print("\nCreating Order Service indexes...");
db = db.getSiblingDB('order_db');
db.orders.createIndex({ "customerId": 1, "status": 1, "createdAt": -1 });
db.orders.createIndex({ "restaurantId": 1, "status": 1, "createdAt": -1 });
db.orders.createIndex({ "orderNumber": 1 }, { unique: true });
db.orders.createIndex({ "status": 1, "createdAt": -1 });
db.orders.createIndex({ "tableNumber": 1, "status": 1 });
db.order_items.createIndex({ "orderId": 1 });
print("Order Service indexes created");

// User Service Indexes
print("\nCreating User Service indexes...");
db = db.getSiblingDB('user_db');
db.users.createIndex({ "email": 1 }, { unique: true });
db.users.createIndex({ "username": 1 }, { unique: true, sparse: true });
db.users.createIndex({ "role": 1, "active": 1 });
db.users.createIndex({ "createdAt": -1 });
print("User Service indexes created");

// Customer Service Indexes
print("\nCreating Customer Service indexes...");
db = db.getSiblingDB('customer_db');
db.customers.createIndex({ "userId": 1 }, { unique: true });
db.customers.createIndex({ "loyaltyTier": 1, "points": -1 });
db.customers.createIndex({ "email": 1 });
db.customers.createIndex({ "phone": 1 });
db.loyalty_transactions.createIndex({ "customerId": 1, "createdAt": -1 });
print("Customer Service indexes created");

// Inventory Service Indexes
print("\nCreating Inventory Service indexes...");
db = db.getSiblingDB('inventory_db');
db.inventory_items.createIndex({ "restaurantId": 1, "name": 1 });
db.inventory_items.createIndex({ "sku": 1 }, { unique: true });
db.inventory_items.createIndex({ "quantity": 1, "reorderLevel": 1 });
db.inventory_items.createIndex({ "categoryId": 1 });
db.inventory_transactions.createIndex({ "inventoryItemId": 1, "createdAt": -1 });
print("Inventory Service indexes created");

// Payment Service Indexes
print("\nCreating Payment Service indexes...");
db = db.getSiblingDB('payment_db');
db.payments.createIndex({ "orderId": 1 });
db.payments.createIndex({ "customerId": 1, "createdAt": -1 });
db.payments.createIndex({ "status": 1, "createdAt": -1 });
db.payments.createIndex({ "razorpayPaymentId": 1 }, { unique: true, sparse: true });
db.refunds.createIndex({ "paymentId": 1 });
print("Payment Service indexes created");

// Analytics Service Indexes
print("\nCreating Analytics Service indexes...");
db = db.getSiblingDB('analytics_db');
db.analytics_events.createIndex({ "eventType": 1, "timestamp": -1 });
db.analytics_events.createIndex({ "restaurantId": 1, "timestamp": -1 });
db.analytics_events.createIndex({ "userId": 1, "timestamp": -1 });
db.daily_metrics.createIndex({ "date": -1, "restaurantId": 1 }, { unique: true });
print("Analytics Service indexes created");

// Delivery Service Indexes
print("\nCreating Delivery Service indexes...");
db = db.getSiblingDB('delivery_db');
db.deliveries.createIndex({ "orderId": 1 }, { unique: true });
db.deliveries.createIndex({ "deliveryPersonId": 1, "status": 1 });
db.deliveries.createIndex({ "status": 1, "estimatedDeliveryTime": 1 });
db.deliveries.createIndex({ "location.coordinates": "2dsphere" });
print("Delivery Service indexes created");

// Review Service Indexes
print("\nCreating Review Service indexes...");
db = db.getSiblingDB('review_db');
db.reviews.createIndex({ "menuItemId": 1, "createdAt": -1 });
db.reviews.createIndex({ "customerId": 1, "createdAt": -1 });
db.reviews.createIndex({ "rating": -1 });
db.reviews.createIndex({ "approved": 1, "createdAt": -1 });
print("Review Service indexes created");

// Notification Service Indexes
print("\nCreating Notification Service indexes...");
db = db.getSiblingDB('notification_db');
db.notifications.createIndex({ "userId": 1, "read": 1, "createdAt": -1 });
db.notifications.createIndex({ "type": 1, "createdAt": -1 });
db.notifications.createIndex({ "read": 1, "createdAt": -1 });
print("Notification Service indexes created");

print("\n=================================");
print("All indexes created successfully!");
print("=================================");

// Verify indexes
print("\nVerifying indexes...");
print("Menu items indexes:", db.getSiblingDB('menu_db').menu_items.getIndexes().length);
print("Orders indexes:", db.getSiblingDB('order_db').orders.getIndexes().length);
print("Users indexes:", db.getSiblingDB('user_db').users.getIndexes().length);
print("Customers indexes:", db.getSiblingDB('customer_db').customers.getIndexes().length);
print("Inventory indexes:", db.getSiblingDB('inventory_db').inventory_items.getIndexes().length);
print("Payments indexes:", db.getSiblingDB('payment_db').payments.getIndexes().length);
print("Analytics indexes:", db.getSiblingDB('analytics_db').analytics_events.getIndexes().length);
print("Deliveries indexes:", db.getSiblingDB('delivery_db').deliveries.getIndexes().length);
print("Reviews indexes:", db.getSiblingDB('review_db').reviews.getIndexes().length);
print("Notifications indexes:", db.getSiblingDB('notification_db').notifications.getIndexes().length);
