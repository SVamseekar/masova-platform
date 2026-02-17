# MongoDB Schema Documentation

## Database Overview

MaSoVa uses MongoDB for data persistence across all microservices. Each service has its own database to ensure proper service isolation and independence.

---

## Database Structure

### Databases by Service

| Database | Service | Purpose |
|----------|---------|---------|
| `masova_db` | User Service | User accounts, roles, stores, sessions |
| `masova_menu` | Menu Service | Menu items, categories, recipes |
| `masova_orders` | Order Service | Orders, order items, delivery addresses |
| `masova_payments` | Payment Service | Payments, refunds, transactions |
| `masova_inventory` | Inventory Service | Stock, purchase orders, suppliers |
| `masova_customers` | Customer Service | Customer profiles, loyalty, promotions |
| `masova_delivery` | Delivery Service | Deliveries, drivers, tracking |
| `masova_notifications` | Notification Service | Notification logs |
| `masova_reviews` | Review Service | Reviews, ratings, responses |
| `masova_analytics` | Analytics Service | Aggregated analytics data |

---

## Collection Schemas

### 1. User Service (`masova_db`)

#### `users` Collection

```javascript
{
  _id: ObjectId,
  userId: String,              // Unique identifier
  email: String,               // Unique, indexed
  passwordHash: String,        // Bcrypt hashed
  firstName: String,
  lastName: String,
  phoneNumber: String,
  role: String,                // ADMIN, MANAGER, STAFF, CUSTOMER
  storeId: String,             // Reference to stores collection
  isActive: Boolean,
  emailVerified: Boolean,
  createdAt: Date,
  updatedAt: Date,
  lastLoginAt: Date
}

// Indexes
db.users.createIndex({ "email": 1 }, { unique: true })
db.users.createIndex({ "userId": 1 }, { unique: true })
db.users.createIndex({ "storeId": 1 })
db.users.createIndex({ "role": 1 })
```

#### `stores` Collection

```javascript
{
  _id: ObjectId,
  storeId: String,             // Unique identifier
  name: String,
  address: {
    street: String,
    city: String,
    state: String,
    pincode: String,
    country: String,
    latitude: Number,
    longitude: Number
  },
  contactNumber: String,
  email: String,
  managerId: String,           // Reference to users
  operatingHours: {
    monday: { open: String, close: String },
    tuesday: { open: String, close: String },
    // ... other days
  },
  isActive: Boolean,
  hasDelivery: Boolean,
  deliveryRadius: Number,      // in kilometers
  gstNumber: String,
  createdAt: Date,
  updatedAt: Date
}

// Indexes
db.stores.createIndex({ "storeId": 1 }, { unique: true })
db.stores.createIndex({ "isActive": 1 })
db.stores.createIndex({ "managerId": 1 })
```

#### `working_sessions` Collection

```javascript
{
  _id: ObjectId,
  sessionId: String,           // Unique identifier
  userId: String,              // Reference to users
  storeId: String,             // Reference to stores
  clockInTime: Date,
  clockOutTime: Date,          // null if session is active
  totalHours: Number,
  breakDuration: Number,       // in minutes
  overtimeHours: Number,
  status: String,              // ACTIVE, COMPLETED, CANCELLED
  notes: String,
  createdAt: Date,
  updatedAt: Date
}

// Indexes
db.working_sessions.createIndex({ "sessionId": 1 }, { unique: true })
db.working_sessions.createIndex({ "userId": 1, "clockInTime": -1 })
db.working_sessions.createIndex({ "storeId": 1, "status": 1 })
```

---

### 2. Menu Service (`masova_menu`)

#### `menu_items` Collection

```javascript
{
  _id: ObjectId,
  itemId: String,              // Unique identifier
  name: String,
  description: String,
  category: String,            // APPETIZER, MAIN_COURSE, DESSERT, BEVERAGE, etc.
  price: Number,               // in INR
  imageUrl: String,
  isVegetarian: Boolean,
  isVegan: Boolean,
  isGlutenFree: Boolean,
  spiceLevel: Number,          // 0-5
  preparationTime: Number,     // in minutes
  calories: Number,
  ingredients: [String],
  allergens: [String],
  storeIds: [String],          // Available at these stores
  isAvailable: Boolean,
  isActive: Boolean,
  taxCategory: String,         // FOOD, BEVERAGE, ALCOHOL, etc.
  customizations: [{
    name: String,
    options: [{
      name: String,
      priceAdjustment: Number
    }]
  }],
  createdAt: Date,
  updatedAt: Date
}

// Indexes
db.menu_items.createIndex({ "itemId": 1 }, { unique: true })
db.menu_items.createIndex({ "category": 1, "isAvailable": 1 })
db.menu_items.createIndex({ "storeIds": 1 })
db.menu_items.createIndex({ "isActive": 1, "isAvailable": 1 })
db.menu_items.createIndex({ "name": "text", "description": "text" })
```

#### `recipes` Collection

```javascript
{
  _id: ObjectId,
  recipeId: String,            // Unique identifier
  itemId: String,              // Reference to menu_items
  name: String,
  ingredients: [{
    inventoryItemId: String,   // Reference to inventory
    quantity: Number,
    unit: String
  }],
  instructions: [String],
  preparationSteps: [{
    stepNumber: Number,
    description: String,
    timeRequired: Number       // in minutes
  }],
  skillLevel: String,          // BEGINNER, INTERMEDIATE, EXPERT
  createdAt: Date,
  updatedAt: Date
}

// Indexes
db.recipes.createIndex({ "recipeId": 1 }, { unique: true })
db.recipes.createIndex({ "itemId": 1 })
```

---

### 3. Order Service (`masova_orders`)

#### `orders` Collection

```javascript
{
  _id: ObjectId,
  orderId: String,             // Unique identifier (e.g., ORD-20260130-1234)
  orderNumber: Number,         // Sequential number
  customerId: String,          // Reference to customers
  customerName: String,        // Denormalized for quick access
  customerPhone: String,
  customerEmail: String,
  storeId: String,             // Reference to stores
  orderType: String,           // DINE_IN, TAKEAWAY, DELIVERY, KIOSK
  tableNumber: String,         // For dine-in orders
  items: [{
    itemId: String,            // Reference to menu_items
    name: String,              // Denormalized
    quantity: Number,
    unitPrice: Number,
    customizations: [{
      name: String,
      option: String,
      priceAdjustment: Number
    }],
    subtotal: Number,
    notes: String
  }],
  subtotal: Number,
  taxAmount: Number,
  taxPercentage: Number,
  deliveryFee: Number,
  discountAmount: Number,
  totalAmount: Number,
  status: String,              // PENDING, CONFIRMED, PREPARING, READY, OUT_FOR_DELIVERY, DELIVERED, CANCELLED
  paymentStatus: String,       // PENDING, PAID, FAILED, REFUNDED
  paymentId: String,           // Reference to payments
  deliveryAddress: {
    street: String,
    city: String,
    state: String,
    pincode: String,
    latitude: Number,
    longitude: Number,
    instructions: String
  },
  deliveryId: String,          // Reference to deliveries
  estimatedPreparationTime: Number,  // in minutes
  estimatedDeliveryTime: Date,
  actualPreparationTime: Number,
  actualDeliveryTime: Date,
  specialInstructions: String,
  createdBy: String,           // Staff user ID
  createdAt: Date,
  updatedAt: Date,
  confirmedAt: Date,
  readyAt: Date,
  deliveredAt: Date,
  cancelledAt: Date,
  cancellationReason: String
}

// Indexes
db.orders.createIndex({ "orderId": 1 }, { unique: true })
db.orders.createIndex({ "customerId": 1, "createdAt": -1 })
db.orders.createIndex({ "storeId": 1, "status": 1 })
db.orders.createIndex({ "status": 1, "createdAt": -1 })
db.orders.createIndex({ "orderType": 1, "status": 1 })
db.orders.createIndex({ "createdAt": -1 })
```

---

### 4. Payment Service (`masova_payments`)

#### `payments` Collection

```javascript
{
  _id: ObjectId,
  paymentId: String,           // Unique identifier
  orderId: String,             // Reference to orders
  customerId: String,          // Reference to customers
  amount: Number,
  currency: String,            // INR
  paymentMethod: String,       // CASH, CARD, UPI, WALLET
  paymentGateway: String,      // RAZORPAY, STRIPE, etc.
  transactionId: String,       // Gateway transaction ID
  status: String,              // PENDING, SUCCESS, FAILED, REFUNDED
  failureReason: String,
  metadata: Object,            // Gateway-specific data
  createdAt: Date,
  updatedAt: Date,
  paidAt: Date
}

// Indexes
db.payments.createIndex({ "paymentId": 1 }, { unique: true })
db.payments.createIndex({ "orderId": 1 })
db.payments.createIndex({ "customerId": 1, "createdAt": -1 })
db.payments.createIndex({ "transactionId": 1 })
db.payments.createIndex({ "status": 1 })
```

#### `refunds` Collection

```javascript
{
  _id: ObjectId,
  refundId: String,            // Unique identifier
  paymentId: String,           // Reference to payments
  orderId: String,             // Reference to orders
  amount: Number,
  reason: String,
  status: String,              // PENDING, PROCESSED, FAILED
  processedBy: String,         // Staff user ID
  transactionId: String,       // Gateway refund transaction ID
  createdAt: Date,
  processedAt: Date
}

// Indexes
db.refunds.createIndex({ "refundId": 1 }, { unique: true })
db.refunds.createIndex({ "paymentId": 1 })
db.refunds.createIndex({ "orderId": 1 })
```

---

### 5. Delivery Service (`masova_delivery`)

#### `deliveries` Collection

```javascript
{
  _id: ObjectId,
  deliveryId: String,          // Unique identifier
  orderId: String,             // Reference to orders
  storeId: String,             // Reference to stores
  customerId: String,          // Reference to customers
  driverId: String,            // Reference to users with DRIVER role
  pickupAddress: {
    street: String,
    city: String,
    latitude: Number,
    longitude: Number
  },
  deliveryAddress: {
    street: String,
    city: String,
    state: String,
    pincode: String,
    latitude: Number,
    longitude: Number,
    instructions: String
  },
  distance: Number,            // in kilometers
  estimatedTime: Number,       // in minutes
  actualTime: Number,
  status: String,              // PENDING, ASSIGNED, PICKED_UP, IN_TRANSIT, DELIVERED, CANCELLED
  priority: String,            // LOW, MEDIUM, HIGH, URGENT
  deliveryFee: Number,
  trackingUpdates: [{
    timestamp: Date,
    location: {
      latitude: Number,
      longitude: Number
    },
    status: String,
    notes: String
  }],
  assignedAt: Date,
  pickedUpAt: Date,
  deliveredAt: Date,
  cancelledAt: Date,
  cancellationReason: String,
  createdAt: Date,
  updatedAt: Date
}

// Indexes
db.deliveries.createIndex({ "deliveryId": 1 }, { unique: true })
db.deliveries.createIndex({ "orderId": 1 })
db.deliveries.createIndex({ "driverId": 1, "status": 1 })
db.deliveries.createIndex({ "storeId": 1, "status": 1 })
db.deliveries.createIndex({ "status": 1, "createdAt": -1 })
```

---

### 6. Customer Service (`masova_customers`)

#### `customers` Collection

```javascript
{
  _id: ObjectId,
  customerId: String,          // Unique identifier
  userId: String,              // Reference to users (optional)
  name: String,
  email: String,
  phoneNumber: String,
  addresses: [{
    addressId: String,
    label: String,             // HOME, WORK, OTHER
    street: String,
    city: String,
    state: String,
    pincode: String,
    latitude: Number,
    longitude: Number,
    isDefault: Boolean
  }],
  loyaltyPoints: Number,
  tier: String,                // BRONZE, SILVER, GOLD, PLATINUM
  totalOrders: Number,
  totalSpent: Number,
  averageOrderValue: Number,
  lastOrderDate: Date,
  preferences: {
    favoriteItems: [String],   // Menu item IDs
    dietaryRestrictions: [String],
    spicePreference: Number
  },
  isActive: Boolean,
  createdAt: Date,
  updatedAt: Date
}

// Indexes
db.customers.createIndex({ "customerId": 1 }, { unique: true })
db.customers.createIndex({ "email": 1 }, { sparse: true })
db.customers.createIndex({ "phoneNumber": 1 })
db.customers.createIndex({ "userId": 1 }, { sparse: true })
db.customers.createIndex({ "tier": 1 })
```

#### `promotions` Collection

```javascript
{
  _id: ObjectId,
  promotionId: String,         // Unique identifier
  code: String,                // Unique promo code
  name: String,
  description: String,
  discountType: String,        // PERCENTAGE, FIXED_AMOUNT
  discountValue: Number,
  minOrderAmount: Number,
  maxDiscountAmount: Number,
  applicableStores: [String],  // Store IDs
  applicableItems: [String],   // Menu item IDs (empty = all items)
  startDate: Date,
  endDate: Date,
  usageLimit: Number,          // Total uses allowed
  usagePerCustomer: Number,    // Uses per customer
  usedCount: Number,
  isActive: Boolean,
  createdAt: Date,
  updatedAt: Date
}

// Indexes
db.promotions.createIndex({ "promotionId": 1 }, { unique: true })
db.promotions.createIndex({ "code": 1 }, { unique: true })
db.promotions.createIndex({ "isActive": 1, "startDate": 1, "endDate": 1 })
```

---

### 7. Review Service (`masova_reviews`)

#### `reviews` Collection

```javascript
{
  _id: ObjectId,
  reviewId: String,            // Unique identifier
  orderId: String,             // Reference to orders
  customerId: String,          // Reference to customers
  customerName: String,        // Denormalized
  storeId: String,             // Reference to stores
  rating: Number,              // 1-5
  foodRating: Number,          // 1-5
  serviceRating: Number,       // 1-5
  deliveryRating: Number,      // 1-5 (for delivery orders)
  comment: String,
  images: [String],            // URLs
  status: String,              // PENDING, APPROVED, REJECTED
  isPublic: Boolean,
  response: {
    text: String,
    respondedBy: String,       // Staff user ID
    respondedAt: Date
  },
  moderatedBy: String,         // Staff user ID
  moderatedAt: Date,
  createdAt: Date,
  updatedAt: Date
}

// Indexes
db.reviews.createIndex({ "reviewId": 1 }, { unique: true })
db.reviews.createIndex({ "orderId": 1 }, { unique: true })
db.reviews.createIndex({ "customerId": 1, "createdAt": -1 })
db.reviews.createIndex({ "storeId": 1, "status": 1, "rating": -1 })
db.reviews.createIndex({ "isPublic": 1, "status": 1 })
```

---

---

### 8. Inventory Service (`masova_inventory`)

#### `inventory_items` Collection

```javascript
{
  _id: ObjectId,
  storeId: String,             // Reference to stores, @Indexed
  itemName: String,            // @Indexed
  itemCode: String,
  category: String,
  unit: String,
  currentStock: Double,
  reservedStock: Double,
  minimumStock: Double,
  maximumStock: Double,
  reorderQuantity: Double,
  unitCost: Decimal128,
  averageCost: Decimal128,
  lastPurchaseCost: Decimal128,
  primarySupplierId: String,   // Reference to suppliers, @Indexed
  alternativeSupplierIds: [String],
  isPerishable: Boolean,
  expiryDate: Date,
  shelfLifeDays: Number,
  batchTracked: Boolean,
  currentBatchNumber: String,
  status: String,              // ACTIVE, LOW_STOCK, OUT_OF_STOCK, DISCONTINUED — @Indexed
  autoReorder: Boolean,
  description: String,
  storageLocation: String,
  notes: String,
  createdAt: Date,
  updatedAt: Date,
  lastUpdatedBy: String
}

// Indexes (Spring @Indexed auto-created)
db.inventory_items.createIndex({ "storeId": 1 })
db.inventory_items.createIndex({ "itemName": 1 })
db.inventory_items.createIndex({ "primarySupplierId": 1 })
db.inventory_items.createIndex({ "status": 1 })
// Additional compound index for low-stock dashboard queries:
db.inventory_items.createIndex({ "storeId": 1, "status": 1 })
db.inventory_items.createIndex({ "storeId": 1, "currentStock": 1, "minimumStock": 1 })
```

#### `purchase_orders` Collection

```javascript
{
  _id: ObjectId,
  orderNumber: String,         // Unique, @Indexed
  storeId: String,             // @Indexed
  supplierId: String,          // @Indexed
  supplierName: String,        // Denormalized
  items: [{
    inventoryItemId: String,
    itemName: String,
    itemCode: String,
    quantity: Double,
    unit: String,
    unitPrice: Decimal128,
    totalPrice: Decimal128,
    receivedQuantity: Double,
    notes: String
  }],
  orderDate: Date,
  expectedDeliveryDate: Date,
  actualDeliveryDate: Date,
  status: String,              // DRAFT, PENDING_APPROVAL, APPROVED, ORDERED, RECEIVED, CANCELLED — @Indexed
  subtotal: Decimal128,
  taxAmount: Decimal128,
  shippingCost: Decimal128,
  discountAmount: Decimal128,
  totalAmount: Decimal128,
  paymentStatus: String,
  requestedBy: String,
  approvedBy: String,
  approvedAt: Date,
  rejectionReason: String,
  receivedBy: String,
  receivedAt: Date,
  receivingNotes: String,
  autoGenerated: Boolean,
  notes: String,
  createdAt: Date,
  updatedAt: Date
}

// Indexes
db.purchase_orders.createIndex({ "orderNumber": 1 }, { unique: true })
db.purchase_orders.createIndex({ "storeId": 1 })
db.purchase_orders.createIndex({ "supplierId": 1 })
db.purchase_orders.createIndex({ "status": 1 })
db.purchase_orders.createIndex({ "storeId": 1, "status": 1, "orderDate": -1 })
```

#### `suppliers` Collection

```javascript
{
  _id: ObjectId,
  supplierCode: String,        // Unique, @Indexed
  supplierName: String,        // @Indexed
  contactPerson: String,
  phoneNumber: String,
  email: String,
  alternatePhone: String,
  addressLine1: String,
  addressLine2: String,
  city: String,
  state: String,
  pincode: String,
  country: String,
  gstNumber: String,
  panNumber: String,
  businessType: String,
  paymentTerms: String,
  creditDays: Number,
  creditLimit: Decimal128,
  bankName: String,
  accountNumber: String,
  ifscCode: String,
  bankBranch: String,
  categoriesSupplied: [String],
  totalOrders: Number,
  completedOrders: Number,
  cancelledOrders: Number,
  onTimeDeliveryRate: Double,
  qualityRating: Double,
  totalPurchaseValue: Decimal128,
  averageLeadTimeDays: Number,
  minimumOrderQuantity: Number,
  status: String,              // ACTIVE, INACTIVE, BLACKLISTED — @Indexed
  isPreferred: Boolean,
  notes: String,
  website: String,
  createdAt: Date,
  updatedAt: Date,
  createdBy: String,
  lastUpdatedBy: String,
  lastOrderDate: Date
}

// Indexes
db.suppliers.createIndex({ "supplierCode": 1 }, { unique: true })
db.suppliers.createIndex({ "supplierName": 1 })
db.suppliers.createIndex({ "status": 1 })
```

#### `waste_records` Collection

```javascript
{
  _id: ObjectId,
  storeId: String,             // @Indexed
  inventoryItemId: String,     // @Indexed
  itemName: String,
  itemCode: String,
  quantity: Double,
  unit: String,
  unitCost: Decimal128,
  totalCost: Decimal128,
  wasteCategory: String,       // EXPIRED, SPILLAGE, OVERPRODUCTION, DAMAGED — @Indexed
  wasteReason: String,
  wasteDate: Date,             // @Indexed
  reportedBy: String,
  approvedBy: String,
  approvedAt: Date,
  preventable: Boolean,
  preventionNotes: String,
  batchNumber: String,
  notes: String,
  createdAt: Date
}

// Indexes
db.waste_records.createIndex({ "storeId": 1 })
db.waste_records.createIndex({ "inventoryItemId": 1 })
db.waste_records.createIndex({ "wasteCategory": 1 })
db.waste_records.createIndex({ "wasteDate": 1 })
db.waste_records.createIndex({ "storeId": 1, "wasteDate": -1 })
```

---

### 9. Notification Service (`masova_notifications`)

#### `notifications` Collection

```javascript
{
  _id: ObjectId,
  userId: String,              // Reference to users
  title: String,
  message: String,
  type: String,                // ORDER_CREATED, ORDER_CONFIRMED, ORDER_PREPARING, ORDER_READY,
                               // ORDER_PICKED_UP, ORDER_DELIVERED, ORDER_CANCELLED, ORDER_STATUS_UPDATE,
                               // PAYMENT_SUCCESS, PAYMENT_FAILED, DRIVER_ASSIGNED, DRIVER_ARRIVED,
                               // REVIEW_REQUEST, LOW_STOCK_ALERT, KITCHEN_ALERT, PROMOTIONAL, SYSTEM_ALERT
  channel: String,             // SMS, EMAIL, PUSH, IN_APP
  status: String,              // PENDING, SENT, DELIVERED, READ, FAILED, CANCELLED
  priority: String,            // LOW, NORMAL, HIGH, URGENT
  templateId: String,
  templateData: Object,
  recipientEmail: String,
  recipientPhone: String,
  recipientDeviceToken: String,
  scheduledFor: Date,
  sentAt: Date,
  readAt: Date,
  errorMessage: String,
  retryCount: Number,
  metadata: Object,
  createdAt: Date,
  updatedAt: Date
}

// Indexes
db.notifications.createIndex({ "userId": 1, "createdAt": -1 })
db.notifications.createIndex({ "status": 1 })
db.notifications.createIndex({ "type": 1 })
// TTL index — auto-delete notifications after 90 days
db.notifications.createIndex({ "createdAt": 1 }, { expireAfterSeconds: 7776000 })
```

---

### 10. Analytics Service (`masova_analytics`)

The analytics service does not define its own persistent entity classes — it reads data from other services' databases via internal API calls and aggregates results in-memory for dashboard queries. No collections to document.

---

## Planned Schema Additions (Tier 4 — Google Sign-In)

The following field will be added to the `users` collection in `masova_db` when Google Sign-In is implemented (Point 1, Tier 4):

```javascript
// users collection — additional field (additive, no breaking change)
authProviders: [{
  provider: String,            // "GOOGLE", "APPLE", "FACEBOOK"
  providerId: String,          // Provider's user ID
  email: String,               // Provider-verified email
  linkedAt: Date
}]
```

---

## Relationships Between Collections

### Cross-Service References

```
users.userId → orders.customerId
users.userId → working_sessions.userId
users.storeId → stores.storeId
stores.storeId → orders.storeId
stores.storeId → menu_items.storeIds
menu_items.itemId → orders.items.itemId
orders.orderId → payments.orderId
orders.orderId → deliveries.orderId
orders.orderId → reviews.orderId
customers.customerId → orders.customerId
customers.customerId → payments.customerId
```

---

## Connection Configuration

### Spring Data MongoDB Configuration

Each service configures its MongoDB connection in `application.yml`:

```yaml
spring:
  data:
    mongodb:
      uri: mongodb://localhost:27017/masova_[service_name]
      auto-index-creation: true
```

### Connection Pool Settings

```yaml
mongo:
  pool:
    min-size: 10
    max-size: 100
    max-wait-ms: 30000
    max-connection-idle-ms: 60000
```

---

## Data Migration & Seeding

### Initial Data Setup

```bash
# Seed menu items for all stores
node scripts/seed-menu-all-stores.js

# Update menu images
node scripts/update-menu-images.js
```

---

## Backup & Restore

### Backup Single Database

```bash
mongodump --db masova_orders --out /backup/$(date +%Y%m%d)
```

### Restore Single Database

```bash
mongorestore --db masova_orders /backup/20260130/masova_orders
```

### Backup All MaSoVa Databases

```bash
mongodump --out /backup/masova_full_$(date +%Y%m%d)
```

---

## Performance Considerations

### Index Strategy

- **Compound indexes** for queries with multiple filters
- **Text indexes** for search functionality
- **TTL indexes** for auto-expiring data (notifications, sessions)
- **Sparse indexes** for optional fields

### Query Optimization

- Use projection to limit returned fields
- Leverage indexes for sorting
- Use aggregation pipeline for complex queries
- Implement caching for frequently accessed data

---

## Security

### Authentication

All services connect with appropriate credentials configured via environment variables:

```bash
MONGODB_URI=mongodb://username:password@host:port/database?authSource=admin
```

### Role-Based Access

- Each service has its own database user
- Users have read/write access only to their service's database
- Admin user for backup/restore operations

---

**Last Updated:** 2026-02-17
**Version:** 2.1.0
