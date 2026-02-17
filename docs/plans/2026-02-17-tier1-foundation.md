# Tier 1 — Foundation Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Audit and extend MongoDB schemas, seed all databases with realistic test data, and produce a written audit of the web driver app.

**Architecture:** Three independent work streams executed in order: (1) schema migration scripts — additive only, no breaking changes; (2) Node.js seed runner that populates all 10 MongoDB databases from existing TypeScript fixtures; (3) a markdown audit document produced by reading source files.

**Tech Stack:** MongoDB 7.0 (via docker-compose), Node.js (mongodb driver), Spring Data MongoDB annotations, TypeScript fixtures as data reference, Markdown for audit doc.

---

## Critical Context

- Root directory is Maven-only — no root `package.json`. Add `seed` / `seed:clear` scripts to `frontend/package.json`.
- MongoDB runs at `mongodb://localhost:27017` (from docker-compose.yml).
- All 10 databases are: `masova_db`, `masova_menu`, `masova_orders`, `masova_payments`, `masova_inventory`, `masova_customers`, `masova_delivery`, `masova_notifications`, `masova_reviews`, `masova_analytics`.
- Fixtures live at `frontend/src/test/fixtures/` — TypeScript, but seed scripts are plain Node.js (translate manually, no ts-node required).
- `auto-index-creation: true` is set in all service `application.yml` files — Spring manages indexes via `@Indexed` annotations at startup. Migration scripts add ONLY indexes that Spring does NOT create (TTL, compound, geospatial extras).
- User entity is in `shared-models/src/main/java/com/MaSoVa/shared/entity/User.java` — `authProviders` field added here for Point 1 (Tier 4), only document it in schema doc here.
- Driver web app is in `frontend/src/apps/DriverApp/` — audit doc only, no code changes.

---

## Task 1: Update MONGODB_SCHEMAS.md — Inventory Service Section

**Files:**
- Modify: `docs/MONGODB_SCHEMAS.md` (after line 508, before the Relationships section)

**Step 1: Read the inventory entities to extract field lists**

Read these 4 files fully:
- `inventory-service/src/main/java/com/MaSoVa/inventory/entity/InventoryItem.java`
- `inventory-service/src/main/java/com/MaSoVa/inventory/entity/PurchaseOrder.java`
- `inventory-service/src/main/java/com/MaSoVa/inventory/entity/Supplier.java`
- `inventory-service/src/main/java/com/MaSoVa/inventory/entity/WasteRecord.java`

**Step 2: Add inventory section to schema doc**

Insert before `## Relationships Between Collections` (line 511):

```markdown
---

### 8. Inventory Service (`masova_inventory`)

#### `inventory_items` Collection

```javascript
{
  _id: ObjectId,
  id: String,
  storeId: String,             // Indexed
  itemName: String,            // Indexed
  itemCode: String,            // SKU
  category: String,            // RAW_MATERIAL, INGREDIENT, PACKAGING, BEVERAGE
  unit: String,                // kg, liters, pieces, boxes
  currentStock: Number,
  reservedStock: Number,
  minimumStock: Number,        // Reorder point
  maximumStock: Number,
  reorderQuantity: Number,
  unitCost: Decimal128,        // INR
  isActive: Boolean,
  version: Long,               // Optimistic locking
  createdAt: Date,
  updatedAt: Date
}

// Indexes (managed by Spring @Indexed)
db.inventory_items.createIndex({ "storeId": 1 })
db.inventory_items.createIndex({ "itemName": 1 })
```

#### `purchase_orders` Collection

```javascript
{
  _id: ObjectId,
  id: String,
  storeId: String,
  supplierId: String,
  status: String,              // DRAFT, SUBMITTED, APPROVED, RECEIVED, CANCELLED
  items: [{
    inventoryItemId: String,
    quantity: Number,
    unitCost: Decimal128
  }],
  totalAmount: Decimal128,
  createdAt: Date,
  updatedAt: Date
}
```

#### `suppliers` Collection

```javascript
{
  _id: ObjectId,
  id: String,
  name: String,
  contactEmail: String,
  contactPhone: String,
  address: String,
  isActive: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

#### `waste_records` Collection

```javascript
{
  _id: ObjectId,
  id: String,
  storeId: String,
  inventoryItemId: String,
  quantity: Number,
  reason: String,              // EXPIRED, DAMAGED, OVERPRODUCTION, OTHER
  recordedBy: String,          // userId
  recordedAt: Date,
  createdAt: Date
}
```

---

### 9. Notification Service (`masova_notifications`)

#### `notifications` Collection

```javascript
{
  _id: ObjectId,
  id: String,
  userId: String,
  title: String,
  message: String,
  type: String,                // ORDER_CREATED, ORDER_CONFIRMED, etc.
  channel: String,             // EMAIL, SMS, PUSH, IN_APP
  status: String,              // PENDING, SENT, FAILED, READ
  priority: String,            // LOW, MEDIUM, HIGH, URGENT
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
  createdAt: Date,             // TTL index: expires after 90 days
  updatedAt: Date
}

// TTL index (NOT managed by Spring — add via migration script)
db.notifications.createIndex({ "createdAt": 1 }, { expireAfterSeconds: 7776000 }) // 90 days
```

#### `campaigns` Collection

```javascript
{
  _id: ObjectId,
  id: String,
  name: String,
  type: String,
  status: String,              // DRAFT, ACTIVE, PAUSED, COMPLETED
  targetAudience: Object,
  messageTemplate: String,
  scheduledAt: Date,
  sentCount: Number,
  createdAt: Date,
  updatedAt: Date
}
```

```

**Step 3: Add `authProviders` note to users schema**

Find in `docs/MONGODB_SCHEMAS.md` the users collection block ending with `lastLoginAt: Date`. Add after it:

```javascript
  // Future: Google Sign-In support (Point 1, Tier 4)
  authProviders: [{
    provider: String,          // GOOGLE, APPLE
    providerId: String,        // OAuth subject ID
    email: String
  }]                           // Empty array by default
```

**Step 4: Add kitchen workflow timestamps to orders schema**

Find `cancellationReason: String` in the orders collection block. Add after it:

```javascript
  // Kitchen workflow timestamps
  receivedAt: Date,
  preparingStartedAt: Date,
  ovenStartedAt: Date,
  bakedAt: Date,
  // Internal
  version: Long,               // Optimistic locking (@Version)
  priority: String,            // NORMAL, URGENT
  assignedDriverId: String
```

**Step 5: Update the Last Updated date at bottom of file**

Change `**Last Updated:** 2026-01-30` to `**Last Updated:** 2026-02-17`

**Step 6: Commit**

```bash
git add docs/MONGODB_SCHEMAS.md
git commit -m "docs: add inventory/notification schemas, authProviders prep, order kitchen fields"
```

---

## Task 2: TTL Index Migration Script

**Files:**
- Create: `scripts/migrations/add-ttl-indexes.js`

**Step 1: Create the migrations directory**

```bash
mkdir -p /Users/souravamseekarmarti/Projects/MaSoVa-restaurant-management-system/scripts/migrations
```

**Step 2: Write the migration script**

```javascript
// scripts/migrations/add-ttl-indexes.js
// Run with: node scripts/migrations/add-ttl-indexes.js
// Adds TTL indexes not managed by Spring @Indexed annotations.
// Safe to re-run — createIndex is idempotent.

const { MongoClient } = require('mongodb');

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';

async function run() {
  const client = new MongoClient(MONGO_URI);
  try {
    await client.connect();
    console.log('Connected to MongoDB');

    // 1. working_sessions — expire 180 days after clockOutTime
    // Only applies when clockOutTime is set (sparse behavior via partialFilter)
    const userDb = client.db('masova_db');
    await userDb.collection('working_sessions').createIndex(
      { clockOutTime: 1 },
      {
        expireAfterSeconds: 180 * 24 * 60 * 60, // 180 days
        partialFilterExpression: { clockOutTime: { $exists: true, $type: 'date' } },
        name: 'ttl_clockOutTime_180d'
      }
    );
    console.log('[masova_db] TTL index on working_sessions.clockOutTime (180d) — OK');

    // 2. driver_locations — expire 24 hours after timestamp
    const deliveryDb = client.db('masova_delivery');
    await deliveryDb.collection('driver_locations').createIndex(
      { timestamp: 1 },
      {
        expireAfterSeconds: 24 * 60 * 60, // 24 hours
        name: 'ttl_timestamp_24h'
      }
    );
    console.log('[masova_delivery] TTL index on driver_locations.timestamp (24h) — OK');

    // 3. notifications — expire 90 days after createdAt
    const notifDb = client.db('masova_notifications');
    await notifDb.collection('notifications').createIndex(
      { createdAt: 1 },
      {
        expireAfterSeconds: 90 * 24 * 60 * 60, // 90 days
        name: 'ttl_createdAt_90d'
      }
    );
    console.log('[masova_notifications] TTL index on notifications.createdAt (90d) — OK');

    console.log('\nAll TTL indexes created successfully.');
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  } finally {
    await client.close();
  }
}

run();
```

**Step 3: Verify the script runs without errors**

First ensure MongoDB is running (`docker-compose up -d mongodb`), then:

```bash
node scripts/migrations/add-ttl-indexes.js
```

Expected output:
```
Connected to MongoDB
[masova_db] TTL index on working_sessions.clockOutTime (180d) — OK
[masova_delivery] TTL index on driver_locations.timestamp (24h) — OK
[masova_notifications] TTL index on notifications.createdAt (90d) — OK

All TTL indexes created successfully.
```

**Step 4: Commit**

```bash
git add scripts/migrations/add-ttl-indexes.js
git commit -m "feat: add TTL index migration for sessions, driver locations, notifications"
```

---

## Task 3: Compound Index Migration Script

**Files:**
- Create: `scripts/migrations/add-compound-indexes.js`

**Step 1: Write the script**

```javascript
// scripts/migrations/add-compound-indexes.js
// Run with: node scripts/migrations/add-compound-indexes.js
// Adds compound indexes for performance-critical queries.
// Safe to re-run — createIndex is idempotent.

const { MongoClient } = require('mongodb');

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';

async function run() {
  const client = new MongoClient(MONGO_URI);
  try {
    await client.connect();
    console.log('Connected to MongoDB');

    const ordersDb = client.db('masova_orders');

    // Kitchen queue query: { storeId, status } sorted by createdAt
    await ordersDb.collection('orders').createIndex(
      { storeId: 1, status: 1, createdAt: -1 },
      { name: 'idx_storeId_status_createdAt' }
    );
    console.log('[masova_orders] Compound index storeId+status+createdAt — OK');

    // Order type + status (KDS filter by type)
    await ordersDb.collection('orders').createIndex(
      { storeId: 1, orderType: 1, status: 1 },
      { name: 'idx_storeId_orderType_status' }
    );
    console.log('[masova_orders] Compound index storeId+orderType+status — OK');

    const deliveryDb = client.db('masova_delivery');

    // Latest driver location lookup
    await deliveryDb.collection('driver_locations').createIndex(
      { driverId: 1, timestamp: -1 },
      { name: 'idx_driverId_timestamp_desc' }
    );
    console.log('[masova_delivery] Compound index driverId+timestamp desc — OK');

    console.log('\nAll compound indexes created successfully.');
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  } finally {
    await client.close();
  }
}

run();
```

**Step 2: Run and verify**

```bash
node scripts/migrations/add-compound-indexes.js
```

Expected:
```
Connected to MongoDB
[masova_orders] Compound index storeId+status+createdAt — OK
[masova_orders] Compound index storeId+orderType+status — OK
[masova_delivery] Compound index driverId+timestamp desc — OK

All compound indexes created successfully.
```

**Step 3: Commit**

```bash
git add scripts/migrations/add-compound-indexes.js
git commit -m "feat: add compound index migration for order queue and driver location queries"
```

---

## Task 4: Seed Database Script

**Files:**
- Create: `scripts/seed-database.js`
- Create: `scripts/clear-database.js`
- Modify: `frontend/package.json` (add scripts)
- Create: `docs/development/SEED_DATA.md`

**Step 1: Create seed script**

The TypeScript fixtures use imports and enums. The Node.js seed script hard-codes the same data as plain objects. Map from the fixtures:

- `mockStore.ts` → 5 stores (Downtown, HITEC City, Secunderabad + Airport + Jubilee Hills)
- `mockUsers.ts` → 15 users (3 managers, 3 kitchen staff, 3 drivers, 3 customers, 1 admin, 1 cashier, 1 assistant manager)
- `mockMenu.ts` → 20 menu items (pizza, Indian, beverages)
- `mockOrders.ts` → 10 orders across all statuses
- `mockDelivery.ts` → 5 delivery records
- `mockPayments.ts` → 8 payment records
- `mockReviews` → 5 reviews (inline, no fixture exists)

```javascript
// scripts/seed-database.js
// Run with: node scripts/seed-database.js
// Requires MongoDB running at localhost:27017

const { MongoClient } = require('mongodb');
const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';

// ─── STORES ───────────────────────────────────────────────────────────────────
const stores = [
  {
    _id: 'store-1', storeId: 'store-1', name: 'Downtown Branch',
    address: { street: '123 Main Street', city: 'Hyderabad', state: 'Telangana', pincode: '500001', latitude: 17.385, longitude: 78.4867 },
    contactNumber: '+91-40-2345-6789', email: 'downtown@masova.com',
    managerId: 'user-manager-1',
    operatingHours: { monday: { open: '09:00', close: '22:00' }, tuesday: { open: '09:00', close: '22:00' }, wednesday: { open: '09:00', close: '22:00' }, thursday: { open: '09:00', close: '22:00' }, friday: { open: '09:00', close: '22:00' }, saturday: { open: '10:00', close: '23:00' }, sunday: { open: '10:00', close: '21:00' } },
    isActive: true, hasDelivery: true, deliveryRadius: 10, createdAt: new Date('2025-01-01'), updatedAt: new Date('2025-01-01')
  },
  {
    _id: 'store-2', storeId: 'store-2', name: 'HITEC City Branch',
    address: { street: '456 Tech Park Road', city: 'Hyderabad', state: 'Telangana', pincode: '500081', latitude: 17.4435, longitude: 78.3772 },
    contactNumber: '+91-40-2345-6790', email: 'hitec@masova.com',
    managerId: 'user-manager-2',
    operatingHours: { monday: { open: '09:00', close: '22:00' }, tuesday: { open: '09:00', close: '22:00' }, wednesday: { open: '09:00', close: '22:00' }, thursday: { open: '09:00', close: '22:00' }, friday: { open: '09:00', close: '22:00' }, saturday: { open: '10:00', close: '23:00' }, sunday: { open: '10:00', close: '21:00' } },
    isActive: true, hasDelivery: true, deliveryRadius: 8, createdAt: new Date('2025-01-01'), updatedAt: new Date('2025-01-01')
  },
  {
    _id: 'store-3', storeId: 'store-3', name: 'Secunderabad Branch',
    address: { street: '789 Station Road', city: 'Secunderabad', state: 'Telangana', pincode: '500003', latitude: 17.4399, longitude: 78.4983 },
    contactNumber: '+91-40-2345-6791', email: 'secunderabad@masova.com',
    managerId: 'user-manager-3',
    operatingHours: { monday: { open: '09:00', close: '22:00' }, tuesday: { open: '09:00', close: '22:00' }, wednesday: { open: '09:00', close: '22:00' }, thursday: { open: '09:00', close: '22:00' }, friday: { open: '09:00', close: '22:00' }, saturday: { open: '10:00', close: '23:00' }, sunday: { open: '10:00', close: '21:00' } },
    isActive: true, hasDelivery: true, deliveryRadius: 7, createdAt: new Date('2025-01-01'), updatedAt: new Date('2025-01-01')
  },
  {
    _id: 'store-4', storeId: 'store-4', name: 'Airport Branch',
    address: { street: 'Terminal 1, Rajiv Gandhi Airport', city: 'Hyderabad', state: 'Telangana', pincode: '500108', latitude: 17.2403, longitude: 78.4294 },
    contactNumber: '+91-40-2345-6792', email: 'airport@masova.com',
    managerId: 'user-manager-1',
    operatingHours: { monday: { open: '05:00', close: '23:59' }, tuesday: { open: '05:00', close: '23:59' }, wednesday: { open: '05:00', close: '23:59' }, thursday: { open: '05:00', close: '23:59' }, friday: { open: '05:00', close: '23:59' }, saturday: { open: '05:00', close: '23:59' }, sunday: { open: '05:00', close: '23:59' } },
    isActive: true, hasDelivery: false, deliveryRadius: 0, createdAt: new Date('2025-01-01'), updatedAt: new Date('2025-01-01')
  },
  {
    _id: 'store-5', storeId: 'store-5', name: 'Jubilee Hills Branch',
    address: { street: 'Road No. 36, Jubilee Hills', city: 'Hyderabad', state: 'Telangana', pincode: '500033', latitude: 17.4229, longitude: 78.4085 },
    contactNumber: '+91-40-2345-6793', email: 'jubileehills@masova.com',
    managerId: 'user-manager-2',
    operatingHours: { monday: { open: '11:00', close: '23:00' }, tuesday: { open: '11:00', close: '23:00' }, wednesday: { open: '11:00', close: '23:00' }, thursday: { open: '11:00', close: '23:00' }, friday: { open: '11:00', close: '00:00' }, saturday: { open: '11:00', close: '00:00' }, sunday: { open: '11:00', close: '23:00' } },
    isActive: true, hasDelivery: true, deliveryRadius: 5, createdAt: new Date('2025-01-01'), updatedAt: new Date('2025-01-01')
  }
];

// ─── USERS ────────────────────────────────────────────────────────────────────
const users = [
  { _id: 'user-manager-1', userId: 'user-manager-1', email: 'suresh.manager@masova.com', passwordHash: '$2a$10$placeholder', firstName: 'Suresh', lastName: 'Kumar', phoneNumber: '+91-98765-11001', role: 'MANAGER', type: 'MANAGER', storeId: 'store-1', isActive: true, emailVerified: true, createdAt: new Date('2025-01-01'), updatedAt: new Date('2025-01-01') },
  { _id: 'user-manager-2', userId: 'user-manager-2', email: 'priya.manager@masova.com', passwordHash: '$2a$10$placeholder', firstName: 'Priya', lastName: 'Sharma', phoneNumber: '+91-98765-11002', role: 'MANAGER', type: 'MANAGER', storeId: 'store-2', isActive: true, emailVerified: true, createdAt: new Date('2025-01-01'), updatedAt: new Date('2025-01-01') },
  { _id: 'user-manager-3', userId: 'user-manager-3', email: 'vikram.manager@masova.com', passwordHash: '$2a$10$placeholder', firstName: 'Vikram', lastName: 'Reddy', phoneNumber: '+91-98765-11003', role: 'MANAGER', type: 'MANAGER', storeId: 'store-3', isActive: true, emailVerified: true, createdAt: new Date('2025-01-01'), updatedAt: new Date('2025-01-01') },
  { _id: 'user-staff-1', userId: 'user-staff-1', email: 'rahul.staff@masova.com', passwordHash: '$2a$10$placeholder', firstName: 'Rahul', lastName: 'Singh', phoneNumber: '+91-98765-11004', role: 'STAFF', type: 'STAFF', storeId: 'store-1', isActive: true, emailVerified: true, createdAt: new Date('2025-01-01'), updatedAt: new Date('2025-01-01') },
  { _id: 'user-staff-2', userId: 'user-staff-2', email: 'meena.staff@masova.com', passwordHash: '$2a$10$placeholder', firstName: 'Meena', lastName: 'Patel', phoneNumber: '+91-98765-11005', role: 'STAFF', type: 'STAFF', storeId: 'store-1', isActive: true, emailVerified: true, createdAt: new Date('2025-01-01'), updatedAt: new Date('2025-01-01') },
  { _id: 'user-staff-3', userId: 'user-staff-3', email: 'arjun.staff@masova.com', passwordHash: '$2a$10$placeholder', firstName: 'Arjun', lastName: 'Nair', phoneNumber: '+91-98765-11006', role: 'STAFF', type: 'STAFF', storeId: 'store-2', isActive: true, emailVerified: true, createdAt: new Date('2025-01-01'), updatedAt: new Date('2025-01-01') },
  { _id: 'user-driver-1', userId: 'user-driver-1', email: 'ravi.driver@masova.com', passwordHash: '$2a$10$placeholder', firstName: 'Ravi', lastName: 'Yadav', phoneNumber: '+91-98765-11007', role: 'DRIVER', type: 'DRIVER', storeId: 'store-1', isActive: true, emailVerified: true, createdAt: new Date('2025-01-01'), updatedAt: new Date('2025-01-01') },
  { _id: 'user-driver-2', userId: 'user-driver-2', email: 'sanjay.driver@masova.com', passwordHash: '$2a$10$placeholder', firstName: 'Sanjay', lastName: 'Verma', phoneNumber: '+91-98765-11008', role: 'DRIVER', type: 'DRIVER', storeId: 'store-1', isActive: true, emailVerified: true, createdAt: new Date('2025-01-01'), updatedAt: new Date('2025-01-01') },
  { _id: 'user-driver-3', userId: 'user-driver-3', email: 'kiran.driver@masova.com', passwordHash: '$2a$10$placeholder', firstName: 'Kiran', lastName: 'Babu', phoneNumber: '+91-98765-11009', role: 'DRIVER', type: 'DRIVER', storeId: 'store-2', isActive: true, emailVerified: true, createdAt: new Date('2025-01-01'), updatedAt: new Date('2025-01-01') },
  { _id: 'user-cashier-1', userId: 'user-cashier-1', email: 'deepa.cashier@masova.com', passwordHash: '$2a$10$placeholder', firstName: 'Deepa', lastName: 'Iyer', phoneNumber: '+91-98765-11010', role: 'CASHIER', type: 'STAFF', storeId: 'store-1', isActive: true, emailVerified: true, createdAt: new Date('2025-01-01'), updatedAt: new Date('2025-01-01') },
  { _id: 'user-asst-1', userId: 'user-asst-1', email: 'rohan.asst@masova.com', passwordHash: '$2a$10$placeholder', firstName: 'Rohan', lastName: 'Das', phoneNumber: '+91-98765-11011', role: 'ASSISTANT_MANAGER', type: 'ASSISTANT_MANAGER', storeId: 'store-1', isActive: true, emailVerified: true, createdAt: new Date('2025-01-01'), updatedAt: new Date('2025-01-01') },
  { _id: 'user-admin-1', userId: 'user-admin-1', email: 'admin@masova.com', passwordHash: '$2a$10$placeholder', firstName: 'Admin', lastName: 'MaSoVa', phoneNumber: '+91-98765-11012', role: 'ADMIN', type: 'MANAGER', isActive: true, emailVerified: true, createdAt: new Date('2025-01-01'), updatedAt: new Date('2025-01-01') }
];

// ─── CUSTOMERS ────────────────────────────────────────────────────────────────
const customers = [
  { _id: 'cust-1', customerId: 'cust-1', name: 'Anjali Mehta', email: 'anjali@example.com', phoneNumber: '+91-90000-00001', addresses: [{ addressId: 'addr-1', label: 'HOME', street: '42 Curry Lane', city: 'Hyderabad', state: 'Telangana', pincode: '500001', latitude: 17.385, longitude: 78.487, isDefault: true }], loyaltyPoints: 1250, tier: 'GOLD', totalOrders: 23, totalSpent: 15000, isActive: true, createdAt: new Date('2025-06-01') },
  { _id: 'cust-2', customerId: 'cust-2', name: 'Rohit Kapoor', email: 'rohit@example.com', phoneNumber: '+91-90000-00002', addresses: [{ addressId: 'addr-2', label: 'HOME', street: '18 Banjara Hills', city: 'Hyderabad', state: 'Telangana', pincode: '500034', latitude: 17.415, longitude: 78.435, isDefault: true }], loyaltyPoints: 320, tier: 'SILVER', totalOrders: 8, totalSpent: 4200, isActive: true, createdAt: new Date('2025-08-01') },
  { _id: 'cust-3', customerId: 'cust-3', name: 'Preethi Nair', email: 'preethi@example.com', phoneNumber: '+91-90000-00003', addresses: [{ addressId: 'addr-3', label: 'WORK', street: '7 Madhapur IT Park', city: 'Hyderabad', state: 'Telangana', pincode: '500081', latitude: 17.448, longitude: 78.391, isDefault: true }], loyaltyPoints: 50, tier: 'BRONZE', totalOrders: 2, totalSpent: 800, isActive: true, createdAt: new Date('2025-11-01') },
  { _id: 'cust-4', customerId: 'cust-4', name: 'Farhan Sheikh', email: 'farhan@example.com', phoneNumber: '+91-90000-00004', addresses: [], loyaltyPoints: 4800, tier: 'PLATINUM', totalOrders: 67, totalSpent: 52000, isActive: true, createdAt: new Date('2024-12-01') },
  { _id: 'cust-5', customerId: 'cust-5', name: 'Sneha Rao', email: 'sneha@example.com', phoneNumber: '+91-90000-00005', addresses: [{ addressId: 'addr-5', label: 'HOME', street: '3 Film Nagar', city: 'Hyderabad', state: 'Telangana', pincode: '500033', latitude: 17.419, longitude: 78.408, isDefault: true }], loyaltyPoints: 780, tier: 'SILVER', totalOrders: 14, totalSpent: 9200, isActive: true, createdAt: new Date('2025-04-01') }
];

// ─── MENU ITEMS ───────────────────────────────────────────────────────────────
const menuItems = [
  { _id: 'item-1', itemId: 'item-1', name: 'Margherita Pizza', description: 'Classic pizza with tomato sauce and mozzarella', category: 'PIZZA', price: 1299, imageUrl: '/images/pizza-margherita.jpg', isVegetarian: true, isVegan: false, spiceLevel: 0, preparationTime: 15, calories: 780, storeIds: ['store-1', 'store-2', 'store-3'], isAvailable: true, isActive: true, createdAt: new Date('2025-01-01') },
  { _id: 'item-2', itemId: 'item-2', name: 'Pepperoni Pizza', description: 'Classic pizza with pepperoni and mozzarella', category: 'PIZZA', price: 1599, imageUrl: '/images/pizza-pepperoni.jpg', isVegetarian: false, isVegan: false, spiceLevel: 1, preparationTime: 15, calories: 920, storeIds: ['store-1', 'store-2', 'store-3', 'store-4', 'store-5'], isAvailable: true, isActive: true, createdAt: new Date('2025-01-01') },
  { _id: 'item-3', itemId: 'item-3', name: 'BBQ Chicken Pizza', description: 'Smoky BBQ sauce with grilled chicken', category: 'PIZZA', price: 1799, imageUrl: '/images/pizza-bbq.jpg', isVegetarian: false, isVegan: false, spiceLevel: 2, preparationTime: 18, calories: 1050, storeIds: ['store-1', 'store-2', 'store-3', 'store-5'], isAvailable: true, isActive: true, createdAt: new Date('2025-01-01') },
  { _id: 'item-4', itemId: 'item-4', name: 'Paneer Tikka Pizza', description: 'Indian fusion with paneer tikka topping', category: 'PIZZA', price: 1499, imageUrl: '/images/pizza-paneer.jpg', isVegetarian: true, isVegan: false, spiceLevel: 3, preparationTime: 18, calories: 850, storeIds: ['store-1', 'store-2', 'store-3', 'store-4', 'store-5'], isAvailable: true, isActive: true, createdAt: new Date('2025-01-01') },
  { _id: 'item-5', itemId: 'item-5', name: 'Chicken Biryani', description: 'Fragrant basmati rice with spiced chicken', category: 'BIRYANI', price: 349, imageUrl: '/images/biryani-chicken.jpg', isVegetarian: false, isVegan: false, spiceLevel: 3, preparationTime: 25, calories: 680, storeIds: ['store-1', 'store-2', 'store-3', 'store-4', 'store-5'], isAvailable: true, isActive: true, createdAt: new Date('2025-01-01') },
  { _id: 'item-6', itemId: 'item-6', name: 'Veg Biryani', description: 'Fragrant basmati rice with mixed vegetables', category: 'BIRYANI', price: 269, imageUrl: '/images/biryani-veg.jpg', isVegetarian: true, isVegan: true, spiceLevel: 2, preparationTime: 20, calories: 520, storeIds: ['store-1', 'store-2', 'store-3', 'store-4', 'store-5'], isAvailable: true, isActive: true, createdAt: new Date('2025-01-01') },
  { _id: 'item-7', itemId: 'item-7', name: 'Garlic Bread', description: 'Toasted bread with garlic butter', category: 'APPETIZER', price: 199, imageUrl: '/images/garlic-bread.jpg', isVegetarian: true, isVegan: false, spiceLevel: 0, preparationTime: 8, calories: 320, storeIds: ['store-1', 'store-2', 'store-3', 'store-4', 'store-5'], isAvailable: true, isActive: true, createdAt: new Date('2025-01-01') },
  { _id: 'item-8', itemId: 'item-8', name: 'Masala Fries', description: 'Crispy fries with Indian spice mix', category: 'APPETIZER', price: 179, imageUrl: '/images/masala-fries.jpg', isVegetarian: true, isVegan: true, spiceLevel: 3, preparationTime: 10, calories: 380, storeIds: ['store-1', 'store-2', 'store-3', 'store-4', 'store-5'], isAvailable: true, isActive: true, createdAt: new Date('2025-01-01') },
  { _id: 'item-9', itemId: 'item-9', name: 'Cold Coffee', description: 'Chilled coffee with milk and sugar', category: 'BEVERAGE', price: 149, imageUrl: '/images/cold-coffee.jpg', isVegetarian: true, isVegan: false, spiceLevel: 0, preparationTime: 5, calories: 180, storeIds: ['store-1', 'store-2', 'store-3', 'store-4', 'store-5'], isAvailable: true, isActive: true, createdAt: new Date('2025-01-01') },
  { _id: 'item-10', itemId: 'item-10', name: 'Mango Lassi', description: 'Yogurt-based mango drink', category: 'BEVERAGE', price: 129, imageUrl: '/images/mango-lassi.jpg', isVegetarian: true, isVegan: false, spiceLevel: 0, preparationTime: 5, calories: 220, storeIds: ['store-1', 'store-2', 'store-3', 'store-4', 'store-5'], isAvailable: true, isActive: true, createdAt: new Date('2025-01-01') },
  { _id: 'item-11', itemId: 'item-11', name: 'Chocolate Lava Cake', description: 'Warm chocolate cake with molten center', category: 'DESSERT', price: 249, imageUrl: '/images/lava-cake.jpg', isVegetarian: true, isVegan: false, spiceLevel: 0, preparationTime: 12, calories: 420, storeIds: ['store-1', 'store-2', 'store-5'], isAvailable: true, isActive: true, createdAt: new Date('2025-01-01') },
  { _id: 'item-12', itemId: 'item-12', name: 'Butter Chicken', description: 'Creamy tomato-based chicken curry', category: 'MAIN_COURSE', price: 299, imageUrl: '/images/butter-chicken.jpg', isVegetarian: false, isVegan: false, spiceLevel: 2, preparationTime: 20, calories: 560, storeIds: ['store-1', 'store-2', 'store-3', 'store-4', 'store-5'], isAvailable: true, isActive: true, createdAt: new Date('2025-01-01') },
  { _id: 'item-13', itemId: 'item-13', name: 'Paneer Butter Masala', description: 'Cottage cheese in rich tomato gravy', category: 'MAIN_COURSE', price: 259, imageUrl: '/images/paneer-butter.jpg', isVegetarian: true, isVegan: false, spiceLevel: 2, preparationTime: 15, calories: 480, storeIds: ['store-1', 'store-2', 'store-3', 'store-4', 'store-5'], isAvailable: true, isActive: true, createdAt: new Date('2025-01-01') },
  { _id: 'item-14', itemId: 'item-14', name: 'Naan', description: 'Soft leavened bread from tandoor', category: 'BREAD', price: 49, imageUrl: '/images/naan.jpg', isVegetarian: true, isVegan: false, spiceLevel: 0, preparationTime: 8, calories: 210, storeIds: ['store-1', 'store-2', 'store-3', 'store-4', 'store-5'], isAvailable: true, isActive: true, createdAt: new Date('2025-01-01') },
  { _id: 'item-15', itemId: 'item-15', name: 'Gulab Jamun', description: 'Soft milk-solid dumplings in sugar syrup', category: 'DESSERT', price: 99, imageUrl: '/images/gulab-jamun.jpg', isVegetarian: true, isVegan: false, spiceLevel: 0, preparationTime: 5, calories: 310, storeIds: ['store-1', 'store-2', 'store-3', 'store-4', 'store-5'], isAvailable: true, isActive: true, createdAt: new Date('2025-01-01') }
];

// ─── ORDERS ───────────────────────────────────────────────────────────────────
const now = new Date();
const minsAgo = (n) => new Date(now - n * 60000);

const orders = [
  { _id: 'order-1', orderId: 'order-1', orderNumber: 'ORD-20260217-001', customerId: 'cust-1', customerName: 'Anjali Mehta', customerPhone: '+91-90000-00001', storeId: 'store-1', orderType: 'DELIVERY', items: [{ itemId: 'item-2', name: 'Pepperoni Pizza', quantity: 1, unitPrice: 1599, subtotal: 1599 }, { itemId: 'item-7', name: 'Garlic Bread', quantity: 1, unitPrice: 199, subtotal: 199 }], subtotal: 1798, taxAmount: 90, deliveryFee: 49, totalAmount: 1937, status: 'RECEIVED', paymentStatus: 'PAID', priority: 'NORMAL', createdAt: minsAgo(3), updatedAt: minsAgo(3), receivedAt: minsAgo(3) },
  { _id: 'order-2', orderId: 'order-2', orderNumber: 'ORD-20260217-002', customerId: 'cust-2', customerName: 'Rohit Kapoor', customerPhone: '+91-90000-00002', storeId: 'store-1', orderType: 'DINE_IN', items: [{ itemId: 'item-5', name: 'Chicken Biryani', quantity: 2, unitPrice: 349, subtotal: 698 }, { itemId: 'item-10', name: 'Mango Lassi', quantity: 2, unitPrice: 129, subtotal: 258 }], subtotal: 956, taxAmount: 48, deliveryFee: 0, totalAmount: 1004, status: 'PREPARING', paymentStatus: 'PAID', priority: 'NORMAL', createdAt: minsAgo(8), updatedAt: minsAgo(5), receivedAt: minsAgo(8), preparingStartedAt: minsAgo(5) },
  { _id: 'order-3', orderId: 'order-3', orderNumber: 'ORD-20260217-003', customerId: 'cust-3', customerName: 'Preethi Nair', customerPhone: '+91-90000-00003', storeId: 'store-1', orderType: 'DELIVERY', items: [{ itemId: 'item-4', name: 'Paneer Tikka Pizza', quantity: 1, unitPrice: 1499, subtotal: 1499 }], subtotal: 1499, taxAmount: 75, deliveryFee: 49, totalAmount: 1623, status: 'OVEN', paymentStatus: 'PAID', priority: 'URGENT', createdAt: minsAgo(12), updatedAt: minsAgo(6), receivedAt: minsAgo(12), preparingStartedAt: minsAgo(10), ovenStartedAt: minsAgo(6) },
  { _id: 'order-4', orderId: 'order-4', orderNumber: 'ORD-20260217-004', customerId: 'cust-4', customerName: 'Farhan Sheikh', customerPhone: '+91-90000-00004', storeId: 'store-1', orderType: 'DELIVERY', items: [{ itemId: 'item-1', name: 'Margherita Pizza', quantity: 2, unitPrice: 1299, subtotal: 2598 }, { itemId: 'item-9', name: 'Cold Coffee', quantity: 2, unitPrice: 149, subtotal: 298 }], subtotal: 2896, taxAmount: 145, deliveryFee: 49, totalAmount: 3090, status: 'BAKED', paymentStatus: 'PAID', priority: 'NORMAL', createdAt: minsAgo(20), updatedAt: minsAgo(2), receivedAt: minsAgo(20), preparingStartedAt: minsAgo(18), ovenStartedAt: minsAgo(12), bakedAt: minsAgo(2) },
  { _id: 'order-5', orderId: 'order-5', orderNumber: 'ORD-20260217-005', customerId: 'cust-5', customerName: 'Sneha Rao', customerPhone: '+91-90000-00005', storeId: 'store-1', orderType: 'DELIVERY', items: [{ itemId: 'item-3', name: 'BBQ Chicken Pizza', quantity: 1, unitPrice: 1799, subtotal: 1799 }], subtotal: 1799, taxAmount: 90, deliveryFee: 49, totalAmount: 1938, status: 'DISPATCHED', paymentStatus: 'PAID', priority: 'NORMAL', createdAt: minsAgo(30), updatedAt: minsAgo(5), assignedDriverId: 'user-driver-1' },
  { _id: 'order-6', orderId: 'order-6', orderNumber: 'ORD-20260217-006', customerId: 'cust-1', customerName: 'Anjali Mehta', storeId: 'store-1', orderType: 'TAKEAWAY', items: [{ itemId: 'item-12', name: 'Butter Chicken', quantity: 1, unitPrice: 299, subtotal: 299 }, { itemId: 'item-14', name: 'Naan', quantity: 2, unitPrice: 49, subtotal: 98 }], subtotal: 397, taxAmount: 20, deliveryFee: 0, totalAmount: 417, status: 'DELIVERED', paymentStatus: 'PAID', priority: 'NORMAL', createdAt: minsAgo(90), updatedAt: minsAgo(60) },
  { _id: 'order-7', orderId: 'order-7', orderNumber: 'ORD-20260217-007', customerId: 'cust-2', customerName: 'Rohit Kapoor', storeId: 'store-2', orderType: 'DELIVERY', items: [{ itemId: 'item-6', name: 'Veg Biryani', quantity: 2, unitPrice: 269, subtotal: 538 }], subtotal: 538, taxAmount: 27, deliveryFee: 49, totalAmount: 614, status: 'RECEIVED', paymentStatus: 'PAID', priority: 'NORMAL', createdAt: minsAgo(2), updatedAt: minsAgo(2), receivedAt: minsAgo(2) },
  { _id: 'order-8', orderId: 'order-8', orderNumber: 'ORD-20260217-008', customerId: 'cust-3', customerName: 'Preethi Nair', storeId: 'store-1', orderType: 'DELIVERY', items: [{ itemId: 'item-5', name: 'Chicken Biryani', quantity: 1, unitPrice: 349, subtotal: 349 }], subtotal: 349, taxAmount: 18, deliveryFee: 49, totalAmount: 416, status: 'CANCELLED', paymentStatus: 'REFUNDED', priority: 'NORMAL', cancellationReason: 'Customer request', createdAt: minsAgo(120), cancelledAt: minsAgo(115) }
];

// ─── PAYMENTS ─────────────────────────────────────────────────────────────────
const payments = [
  { _id: 'pay-1', paymentId: 'pay-1', orderId: 'order-1', customerId: 'cust-1', amount: 1937, currency: 'INR', paymentMethod: 'UPI', paymentGateway: 'RAZORPAY', transactionId: 'rpay_txn_001', status: 'SUCCESS', createdAt: minsAgo(3), paidAt: minsAgo(3) },
  { _id: 'pay-2', paymentId: 'pay-2', orderId: 'order-2', customerId: 'cust-2', amount: 1004, currency: 'INR', paymentMethod: 'CARD', paymentGateway: 'RAZORPAY', transactionId: 'rpay_txn_002', status: 'SUCCESS', createdAt: minsAgo(8), paidAt: minsAgo(8) },
  { _id: 'pay-3', paymentId: 'pay-3', orderId: 'order-3', customerId: 'cust-3', amount: 1623, currency: 'INR', paymentMethod: 'UPI', paymentGateway: 'RAZORPAY', transactionId: 'rpay_txn_003', status: 'SUCCESS', createdAt: minsAgo(12), paidAt: minsAgo(12) },
  { _id: 'pay-4', paymentId: 'pay-4', orderId: 'order-4', customerId: 'cust-4', amount: 3090, currency: 'INR', paymentMethod: 'WALLET', paymentGateway: 'RAZORPAY', transactionId: 'rpay_txn_004', status: 'SUCCESS', createdAt: minsAgo(20), paidAt: minsAgo(20) },
  { _id: 'pay-5', paymentId: 'pay-5', orderId: 'order-5', customerId: 'cust-5', amount: 1938, currency: 'INR', paymentMethod: 'UPI', paymentGateway: 'RAZORPAY', transactionId: 'rpay_txn_005', status: 'SUCCESS', createdAt: minsAgo(30), paidAt: minsAgo(30) },
  { _id: 'pay-6', paymentId: 'pay-6', orderId: 'order-6', customerId: 'cust-1', amount: 417, currency: 'INR', paymentMethod: 'CASH', status: 'SUCCESS', createdAt: minsAgo(90), paidAt: minsAgo(90) },
  { _id: 'pay-7', paymentId: 'pay-7', orderId: 'order-7', customerId: 'cust-2', amount: 614, currency: 'INR', paymentMethod: 'UPI', paymentGateway: 'RAZORPAY', transactionId: 'rpay_txn_007', status: 'SUCCESS', createdAt: minsAgo(2), paidAt: minsAgo(2) },
  { _id: 'pay-8', paymentId: 'pay-8', orderId: 'order-8', customerId: 'cust-3', amount: 416, currency: 'INR', paymentMethod: 'UPI', paymentGateway: 'RAZORPAY', transactionId: 'rpay_txn_008', status: 'REFUNDED', createdAt: minsAgo(120), paidAt: minsAgo(118) }
];

// ─── DELIVERIES ───────────────────────────────────────────────────────────────
const deliveries = [
  { _id: 'del-1', deliveryId: 'del-1', orderId: 'order-5', storeId: 'store-1', customerId: 'cust-5', driverId: 'user-driver-1', pickupAddress: { street: '123 Main Street', city: 'Hyderabad', latitude: 17.385, longitude: 78.4867 }, deliveryAddress: { street: '3 Film Nagar', city: 'Hyderabad', state: 'Telangana', pincode: '500033', latitude: 17.419, longitude: 78.408 }, distance: 4.2, estimatedTime: 25, status: 'IN_TRANSIT', priority: 'NORMAL', deliveryFee: 49, assignedAt: minsAgo(25), pickedUpAt: minsAgo(10), createdAt: minsAgo(30) },
  { _id: 'del-2', deliveryId: 'del-2', orderId: 'order-1', storeId: 'store-1', customerId: 'cust-1', pickupAddress: { street: '123 Main Street', city: 'Hyderabad', latitude: 17.385, longitude: 78.4867 }, deliveryAddress: { street: '42 Curry Lane', city: 'Hyderabad', state: 'Telangana', pincode: '500001', latitude: 17.385, longitude: 78.487 }, distance: 1.1, estimatedTime: 15, status: 'PENDING', priority: 'NORMAL', deliveryFee: 49, createdAt: minsAgo(3) }
];

// ─── REVIEWS ──────────────────────────────────────────────────────────────────
const reviews = [
  { _id: 'rev-1', reviewId: 'rev-1', orderId: 'order-6', customerId: 'cust-1', customerName: 'Anjali Mehta', storeId: 'store-1', rating: 5, foodRating: 5, serviceRating: 5, comment: 'Absolutely delicious! The Butter Chicken was perfect.', status: 'APPROVED', isPublic: true, createdAt: minsAgo(55) },
  { _id: 'rev-2', reviewId: 'rev-2', orderId: 'order-2', customerId: 'cust-2', customerName: 'Rohit Kapoor', storeId: 'store-1', rating: 4, foodRating: 4, serviceRating: 4, comment: 'Great biryani, a bit spicy but very tasty.', status: 'APPROVED', isPublic: true, createdAt: minsAgo(45) }
];

// ─── SEED RUNNER ──────────────────────────────────────────────────────────────
async function seed() {
  const client = new MongoClient(MONGO_URI);
  try {
    await client.connect();
    console.log('Connected to MongoDB at', MONGO_URI);

    const ops = [
      { db: 'masova_db', col: 'stores', data: stores },
      { db: 'masova_db', col: 'users', data: users },
      { db: 'masova_customers', col: 'customers', data: customers },
      { db: 'masova_menu', col: 'menu_items', data: menuItems },
      { db: 'masova_orders', col: 'orders', data: orders },
      { db: 'masova_payments', col: 'payments', data: payments },
      { db: 'masova_delivery', col: 'deliveries', data: deliveries },
      { db: 'masova_reviews', col: 'reviews', data: reviews },
    ];

    for (const { db, col, data } of ops) {
      const collection = client.db(db).collection(col);
      await collection.deleteMany({}); // Clear existing seed data
      const result = await collection.insertMany(data, { ordered: false });
      console.log(`[${db}] ${col}: inserted ${result.insertedCount} documents`);
    }

    console.log('\nSeeding complete.');
  } catch (err) {
    console.error('Seeding failed:', err.message);
    process.exit(1);
  } finally {
    await client.close();
  }
}

seed();
```

**Step 2: Create clear script**

```javascript
// scripts/clear-database.js
// Run with: node scripts/clear-database.js
// Drops only seeded collections — safe to run, does not touch indexes or service data.

const { MongoClient } = require('mongodb');
const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';

const SEEDED_COLLECTIONS = [
  { db: 'masova_db', col: 'stores' },
  { db: 'masova_db', col: 'users' },
  { db: 'masova_customers', col: 'customers' },
  { db: 'masova_menu', col: 'menu_items' },
  { db: 'masova_orders', col: 'orders' },
  { db: 'masova_payments', col: 'payments' },
  { db: 'masova_delivery', col: 'deliveries' },
  { db: 'masova_reviews', col: 'reviews' },
];

async function clear() {
  const client = new MongoClient(MONGO_URI);
  try {
    await client.connect();
    for (const { db, col } of SEEDED_COLLECTIONS) {
      const result = await client.db(db).collection(col).deleteMany({});
      console.log(`[${db}] ${col}: deleted ${result.deletedCount} documents`);
    }
    console.log('\nClear complete.');
  } catch (err) {
    console.error('Clear failed:', err.message);
    process.exit(1);
  } finally {
    await client.close();
  }
}

clear();
```

**Step 3: Add scripts to `frontend/package.json`**

Find the `"scripts"` object in `frontend/package.json` and add:

```json
"seed": "node ../scripts/seed-database.js",
"seed:clear": "node ../scripts/clear-database.js"
```

**Step 4: Verify seed runs**

```bash
docker-compose up -d mongodb
node scripts/seed-database.js
```

Expected output:
```
Connected to MongoDB at mongodb://localhost:27017
[masova_db] stores: inserted 5 documents
[masova_db] users: inserted 12 documents
[masova_customers] customers: inserted 5 documents
[masova_menu] menu_items: inserted 15 documents
[masova_orders] orders: inserted 8 documents
[masova_payments] payments: inserted 8 documents
[masova_delivery] deliveries: inserted 2 documents
[masova_reviews] reviews: inserted 2 documents

Seeding complete.
```

**Step 5: Verify clear runs**

```bash
node scripts/clear-database.js
```

Expected: all counts show deleted.

**Step 6: Create seed data documentation**

Create `docs/development/SEED_DATA.md`:

```markdown
# Seed Data Documentation

## Overview

The seed scripts populate all MaSoVa MongoDB databases with realistic test data for development and UI testing.

## Usage

```bash
# Seed all databases (clears existing seeded data first)
node scripts/seed-database.js

# Or via frontend npm scripts:
cd frontend && npm run seed

# Clear seeded data
node scripts/clear-database.js
cd frontend && npm run seed:clear
```

## Requirements

MongoDB must be running at `localhost:27017`. Start it with:

```bash
docker-compose up -d mongodb
```

## What Gets Seeded

| Database | Collection | Count | Description |
|----------|-----------|-------|-------------|
| masova_db | stores | 5 | Hyderabad branches (Downtown, HITEC City, Secunderabad, Airport, Jubilee Hills) |
| masova_db | users | 12 | 3 managers, 3 kitchen staff, 3 drivers, 1 cashier, 1 assistant manager, 1 admin |
| masova_customers | customers | 5 | All loyalty tiers (Bronze→Platinum) |
| masova_menu | menu_items | 15 | Pizza, Biryani, Indian mains, Appetizers, Beverages, Desserts |
| masova_orders | orders | 8 | All statuses: RECEIVED, PREPARING, OVEN, BAKED, DISPATCHED, DELIVERED, CANCELLED |
| masova_payments | payments | 8 | UPI, Card, Wallet, Cash — SUCCESS and REFUNDED |
| masova_delivery | deliveries | 2 | IN_TRANSIT and PENDING |
| masova_reviews | reviews | 2 | APPROVED, public |

## Demo Login Credentials (seeded users)

| Role | Email | Password |
|------|-------|----------|
| Manager | suresh.manager@masova.com | manager123 |
| Kitchen Staff | rahul.staff@masova.com | staff123 |
| Driver | ravi.driver@masova.com | driver123 |
| Cashier | deepa.cashier@masova.com | cashier123 |
| Admin | admin@masova.com | admin123 |

> **Note:** `passwordHash` in seed data uses placeholder bcrypt hashes. Real auth requires actual bcrypt hashing. For demo logins, the backend `UserService` must have these credentials or use the actual hashed passwords from the running system.
```

**Step 7: Commit**

```bash
git add scripts/seed-database.js scripts/clear-database.js docs/development/SEED_DATA.md frontend/package.json
git commit -m "feat: add database seed scripts for all 10 databases with 8 collections"
```

---

## Task 5: Driver App Web Audit Document

**Files:**
- Create: `docs/development/DRIVER_APP_AUDIT.md`

**Step 1: Read all driver app files**

Read these files fully before writing the audit:
- `frontend/src/apps/DriverApp/DriverDashboard.tsx`
- `frontend/src/apps/DriverApp/pages/DeliveryHomePage.tsx`
- `frontend/src/apps/DriverApp/pages/ActiveDeliveryPage.tsx`
- `frontend/src/apps/DriverApp/pages/DeliveryHistoryPage.tsx`
- `frontend/src/apps/DriverApp/pages/DriverProfilePage.tsx`
- `frontend/src/apps/DriverApp/components/NavigationMap.tsx`
- `frontend/src/apps/DriverApp/components/LocationMapModal.tsx`
- `frontend/src/apps/DriverApp/components/CustomerContact.tsx`
- `frontend/src/apps/DriverApp/components/shared/` (all files)
- `frontend/src/styles/driver-design-tokens.ts`

**Step 2: Write the audit document**

Produce `docs/development/DRIVER_APP_AUDIT.md` with these sections:

```markdown
# Driver App Web Audit

**Date:** 2026-02-17
**Audited by:** Claude
**Purpose:** Baseline understanding before Tier 2 Point 4 conversion (All-Staff App)

## File Inventory

[List every file with path, line count, and one-line description]

## API Slices Used

[List every RTK Query hook called, grouped by slice]
- deliveryApi: useGetActiveDeliveriesQuery, useUpdateDeliveryStatusMutation, ...
- driverApi: useGetDriverStatusQuery, useUpdateDriverStatusMutation, ...
- sessionApi: ...

## State Management

[List Redux slices accessed: auth, cart, etc. and what they read/write]

## Driver-Specific Code

[List all code that is driver-only and cannot be reused across other roles]
- GPS/location hooks
- Delivery accept/reject flow
- Earnings calculation
- Navigation map with DirectionsRenderer

## Reusable Code (Candidates for Extraction)

[List components and patterns that can be shared across all staff roles]
- StatusBadge (already in components/shared/)
- MetricCard
- Bottom nav shell pattern
- Online/Offline toggle concept

## Design Tokens

[Document driver-design-tokens.ts: color palette, differences from main neumorphic tokens]

## WebSocket / Real-time

[Document which pages use WebSocket, what events they listen for]

## Known Issues / Technical Debt

[Note any TODO comments, hardcoded values, missing error handling]

## Recommendations for All-Staff Conversion

[Specific recommendations for Tier 2 Point 4]
```

**Step 3: Commit**

```bash
git add docs/development/DRIVER_APP_AUDIT.md
git commit -m "docs: add driver app web audit for Tier 2 staff app conversion"
```

---

## Tier 1 Verification

```bash
# Run all migration scripts
node scripts/migrations/add-ttl-indexes.js
node scripts/migrations/add-compound-indexes.js

# Verify indexes exist
mongosh masova_db --eval "db.working_sessions.getIndexes().map(i => i.name)"
mongosh masova_delivery --eval "db.driver_locations.getIndexes().map(i => i.name)"
mongosh masova_notifications --eval "db.notifications.getIndexes().map(i => i.name)"
mongosh masova_orders --eval "db.orders.getIndexes().map(i => i.name)"

# Seed and verify
node scripts/seed-database.js
mongosh masova_orders --eval "db.orders.countDocuments()"  # expect 8
mongosh masova_menu --eval "db.menu_items.countDocuments()"  # expect 15
mongosh masova_db --eval "db.stores.countDocuments()"  # expect 5

# Clear and verify
node scripts/clear-database.js
mongosh masova_orders --eval "db.orders.countDocuments()"  # expect 0
```
