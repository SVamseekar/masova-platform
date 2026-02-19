'use strict';
/**
 * MaSoVa MongoDB Index Migration Script
 * Run: node scripts/create-indexes.js
 *
 * Applies all indexes identified in the 2026-02-19 DBA audit.
 * P0 (data integrity) → P1 (performance) → P2/TTL (housekeeping)
 * Safe to run multiple times — skips indexes that already exist.
 */
const { MongoClient } = require('mongodb');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017';

let created = 0;
let skipped = 0;
let failed = 0;

async function createIdx(collection, keys, options = {}, label) {
  try {
    await collection.createIndex(keys, { background: true, ...options });
    console.log(`  [OK]    ${label}`);
    created++;
  } catch (e) {
    if (e.code === 85 || e.code === 86 || e.message.includes('already exists') || e.message.includes('Index with name')) {
      console.log(`  [SKIP]  ${label}`);
      skipped++;
    } else {
      console.error(`  [FAIL]  ${label} — ${e.message}`);
      failed++;
    }
  }
}

async function dropIdx(collection, indexName, label) {
  try {
    await collection.dropIndex(indexName);
    console.log(`  [DROPPED] ${label}`);
  } catch (e) {
    if (e.message.includes('index not found') || e.message.includes('ns not found')) {
      console.log(`  [SKIP]  ${label} (not found)`);
    } else {
      console.error(`  [FAIL]  drop ${label} — ${e.message}`);
    }
  }
}

async function main() {
  const client = new MongoClient(MONGO_URI);
  await client.connect();
  console.log(`Connected to ${MONGO_URI}\n`);

  // ─────────────────────────────────────────────────────────────────
  // P0 — DATA INTEGRITY FIXES
  // ─────────────────────────────────────────────────────────────────
  console.log('=== P0: Data Integrity ===\n');

  const customers = client.db('masova_customers').collection('customers');
  await dropIdx(customers, 'email_1', 'customers.email global unique (REMOVE — violates multi-tenancy)');
  await dropIdx(customers, 'phone_1', 'customers.phone global unique (REMOVE — violates multi-tenancy)');
  await createIdx(customers, { storeId: 1, email: 1 }, {}, 'customers.(storeId+email)');
  await createIdx(customers, { storeId: 1, phone: 1 }, {}, 'customers.(storeId+phone)');

  const reviews = client.db('masova_reviews').collection('reviews');
  await createIdx(reviews, { orderId: 1, customerId: 1 }, { unique: true }, 'reviews.(orderId+customerId) UNIQUE — prevent duplicate reviews');

  const notifications = client.db('masova_notifications').collection('notifications');
  await createIdx(notifications, { userId: 1 }, {}, 'notifications.userId — P0: core lookup was full scan');

  // ─────────────────────────────────────────────────────────────────
  // P1 — PERFORMANCE: user-service (masova_users)
  // ─────────────────────────────────────────────────────────────────
  console.log('\n=== P1: user-service (masova_users) ===\n');
  const users = client.db('masova_users').collection('users');
  await createIdx(users, { 'employeeDetails.storeId': 1, 'employeeDetails.status': 1 }, {}, 'users.(storeId+status) staff availability');
  await createIdx(users, { type: 1, isActive: 1 }, {}, 'users.(type+isActive)');
  await createIdx(users, { lastLogin: 1 }, {}, 'users.lastLogin');

  const shifts = client.db('masova_users').collection('shifts');
  await createIdx(shifts, { status: 1 }, {}, 'shifts.status');
  await createIdx(shifts, { storeId: 1, status: 1 }, {}, 'shifts.(storeId+status)');

  const workingSessions = client.db('masova_users').collection('working_sessions');
  await createIdx(workingSessions, { storeId: 1, status: 1, date: -1 }, {}, 'working_sessions.(storeId+status+date)');
  await createIdx(workingSessions, { logoutTime: 1 }, { sparse: true }, 'working_sessions.logoutTime sparse');

  // P1 — customer-service (masova_customers)
  console.log('\n=== P1: customer-service (masova_customers) ===\n');
  await createIdx(customers, { active: 1 }, {}, 'customers.active');
  await createIdx(customers, { storeId: 1, active: 1 }, {}, 'customers.(storeId+active)');
  await createIdx(customers, { storeIds: 1, active: 1 }, {}, 'customers.(storeIds+active) multi-store');
  await createIdx(customers, { storeId: 1, createdAt: -1 }, {}, 'customers.(storeId+createdAt)');
  await createIdx(customers, { lastOrderDate: 1 }, {}, 'customers.lastOrderDate');
  await createIdx(customers, { deletedAt: 1 }, { sparse: true }, 'customers.deletedAt sparse');
  await createIdx(customers, { name: 'text', email: 'text', phone: 'text' }, {}, 'customers text search (name+email+phone)');

  // P1 — order-service (masova_orders)
  console.log('\n=== P1: order-service (masova_orders) ===\n');
  const orders = client.db('masova_orders').collection('orders');
  await createIdx(orders, { storeId: 1, status: 1 }, {}, 'orders.(storeId+status)');
  await createIdx(orders, { storeId: 1, createdAt: -1 }, {}, 'orders.(storeId+createdAt)');
  await createIdx(orders, { customerId: 1, createdAt: -1 }, {}, 'orders.(customerId+createdAt)');
  await createIdx(orders, { customerId: 1, status: 1 }, {}, 'orders.(customerId+status)');
  await createIdx(orders, { assignedDriverId: 1, status: 1 }, {}, 'orders.(assignedDriverId+status)');
  await createIdx(orders, { storeId: 1, orderType: 1, status: 1 }, {}, 'orders.(storeId+orderType+status)');
  await createIdx(orders, { storeId: 1, createdByStaffId: 1, createdAt: -1 }, {}, 'orders.(storeId+createdByStaffId+createdAt)');
  await createIdx(orders, { storeId: 1, assignedKitchenStaffId: 1, createdAt: -1 }, {}, 'orders.(storeId+assignedKitchenStaffId+createdAt)');

  const ratingTokens = client.db('masova_orders').collection('rating_tokens');
  await createIdx(ratingTokens, { used: 1, expiresAt: 1 }, {}, 'rating_tokens.(used+expiresAt)');

  // P1 — delivery-service (masova_deliveries)
  console.log('\n=== P1: delivery-service (masova_deliveries) ===\n');
  const deliveries = client.db('masova_deliveries').collection('delivery_trackings');
  await createIdx(deliveries, { driverId: 1, status: 1 }, {}, 'delivery_trackings.(driverId+status)');
  await createIdx(deliveries, { storeId: 1, status: 1 }, {}, 'delivery_trackings.(storeId+status)');
  await createIdx(deliveries, { driverId: 1, createdAt: -1 }, {}, 'delivery_trackings.(driverId+createdAt)');
  await createIdx(deliveries, { storeId: 1, createdAt: -1 }, {}, 'delivery_trackings.(storeId+createdAt)');
  await createIdx(deliveries, { driverId: 1, storeId: 1, createdAt: -1 }, {}, 'delivery_trackings.(driverId+storeId+createdAt)');

  const driverLocations = client.db('masova_deliveries').collection('driver_locations');
  await createIdx(driverLocations, { driverId: 1, timestamp: -1 }, {}, 'driver_locations.(driverId+timestamp)');

  // P1 — payment-service (masova_payments)
  console.log('\n=== P1: payment-service (masova_payments) ===\n');
  const transactions = client.db('masova_payments').collection('transactions');
  await createIdx(transactions, { storeId: 1, status: 1 }, {}, 'transactions.(storeId+status)');
  await createIdx(transactions, { storeId: 1, createdAt: -1 }, {}, 'transactions.(storeId+createdAt)');
  await createIdx(transactions, { customerId: 1, createdAt: -1 }, {}, 'transactions.(customerId+createdAt)');
  await createIdx(transactions, { customerId: 1, status: 1 }, {}, 'transactions.(customerId+status)');
  await createIdx(transactions, { status: 1, createdAt: -1 }, {}, 'transactions.(status+createdAt)');

  const refunds = client.db('masova_payments').collection('refunds');
  await createIdx(refunds, { storeId: 1, status: 1 }, {}, 'refunds.(storeId+status)');
  await createIdx(refunds, { storeId: 1, createdAt: -1 }, {}, 'refunds.(storeId+createdAt)');
  await createIdx(refunds, { transactionId: 1, createdAt: -1 }, {}, 'refunds.(transactionId+createdAt)');

  // P1 — review-service (masova_reviews)
  console.log('\n=== P1: review-service (masova_reviews) ===\n');
  await createIdx(reviews, { status: 1 }, {}, 'reviews.status');
  await createIdx(reviews, { storeId: 1, status: 1 }, {}, 'reviews.(storeId+status)');
  await createIdx(reviews, { storeId: 1, createdAt: -1 }, {}, 'reviews.(storeId+createdAt)');
  await createIdx(reviews, { storeId: 1, overallRating: 1 }, {}, 'reviews.(storeId+overallRating)');
  await createIdx(reviews, { driverId: 1, driverRating: 1 }, {}, 'reviews.(driverId+driverRating)');
  await createIdx(reviews, { staffId: 1, staffRating: 1 }, {}, 'reviews.(staffId+staffRating)');
  await createIdx(reviews, { status: 1, createdAt: -1 }, {}, 'reviews.(status+createdAt)');

  const reviewResponses = client.db('masova_reviews').collection('review_responses');
  await createIdx(reviewResponses, { reviewId: 1 }, {}, 'review_responses.reviewId');
  await createIdx(reviewResponses, { managerId: 1 }, {}, 'review_responses.managerId');
  await createIdx(reviewResponses, { createdAt: -1 }, {}, 'review_responses.createdAt');

  // P1 — inventory-service (masova_inventory)
  console.log('\n=== P1: inventory-service (masova_inventory) ===\n');
  const inventoryItems = client.db('masova_inventory').collection('inventory_items');
  await createIdx(inventoryItems, { storeId: 1, status: 1 }, {}, 'inventory_items.(storeId+status)');
  await createIdx(inventoryItems, { storeId: 1, itemName: 1 }, {}, 'inventory_items.(storeId+itemName)');
  await createIdx(inventoryItems, { storeId: 1, status: 1, currentStock: 1 }, {}, 'inventory_items.(storeId+status+currentStock)');
  await createIdx(inventoryItems, { isPerishable: 1, expiryDate: 1 }, {}, 'inventory_items.(isPerishable+expiryDate)');

  const purchaseOrders = client.db('masova_inventory').collection('purchase_orders');
  await createIdx(purchaseOrders, { storeId: 1, status: 1 }, {}, 'purchase_orders.(storeId+status)');
  await createIdx(purchaseOrders, { storeId: 1, createdAt: -1 }, {}, 'purchase_orders.(storeId+createdAt)');
  await createIdx(purchaseOrders, { status: 1, expectedDeliveryDate: 1 }, {}, 'purchase_orders.(status+expectedDeliveryDate)');

  const wasteRecords = client.db('masova_inventory').collection('waste_records');
  await createIdx(wasteRecords, { storeId: 1, wasteCategory: 1 }, {}, 'waste_records.(storeId+wasteCategory)');
  await createIdx(wasteRecords, { storeId: 1, wasteDate: -1 }, {}, 'waste_records.(storeId+wasteDate)');

  // P1 — notification-service (masova_notifications)
  console.log('\n=== P1: notification-service (masova_notifications) ===\n');
  await createIdx(notifications, { status: 1 }, {}, 'notifications.status');
  await createIdx(notifications, { userId: 1, status: 1 }, {}, 'notifications.(userId+status)');
  await createIdx(notifications, { userId: 1, createdAt: -1 }, {}, 'notifications.(userId+createdAt)');
  await createIdx(notifications, { status: 1, retryCount: 1 }, {}, 'notifications.(status+retryCount)');
  await createIdx(notifications, { scheduledFor: 1, status: 1 }, {}, 'notifications.(scheduledFor+status)');

  const campaigns = client.db('masova_notifications').collection('campaigns');
  await createIdx(campaigns, { storeId: 1, status: 1 }, {}, 'campaigns.(storeId+status)');
  await createIdx(campaigns, { status: 1, scheduledFor: 1 }, {}, 'campaigns.(status+scheduledFor)');
  await createIdx(campaigns, { createdAt: -1 }, {}, 'campaigns.createdAt');

  const templates = client.db('masova_notifications').collection('templates');
  await createIdx(templates, { name: 1 }, {}, 'templates.name');
  await createIdx(templates, { type: 1, channel: 1 }, {}, 'templates.(type+channel)');
  await createIdx(templates, { active: 1 }, {}, 'templates.active');

  const userPreferences = client.db('masova_notifications').collection('user_preferences');
  await createIdx(userPreferences, { userId: 1 }, { unique: true }, 'user_preferences.userId UNIQUE');

  // P1 — menu-service (masova_menus)
  console.log('\n=== P1: menu-service (masova_menus) ===\n');
  const menuItems = client.db('masova_menus').collection('menu_items');
  await createIdx(menuItems, { storeId: 1, category: 1 }, {}, 'menu_items.(storeId+category)');
  await createIdx(menuItems, { storeId: 1, isAvailable: 1 }, {}, 'menu_items.(storeId+isAvailable)');
  await createIdx(menuItems, { storeId: 1, isRecommended: 1 }, {}, 'menu_items.(storeId+isRecommended)');
  await createIdx(menuItems, { name: 'text', description: 'text' }, {}, 'menu_items text search (name+description)');

  // P1 — GDPR (masova_users)
  console.log('\n=== P1: GDPR collections (masova_users) ===\n');
  const gdprAuditLogs = client.db('masova_users').collection('gdpr_audit_logs');
  await createIdx(gdprAuditLogs, { userId: 1, timestamp: -1 }, {}, 'gdpr_audit_logs.(userId+timestamp)');
  await createIdx(gdprAuditLogs, { actionType: 1, timestamp: -1 }, {}, 'gdpr_audit_logs.(actionType+timestamp)');

  const gdprConsents = client.db('masova_users').collection('gdpr_consents');
  await createIdx(gdprConsents, { userId: 1, consentType: 1 }, {}, 'gdpr_consents.(userId+consentType)');
  await createIdx(gdprConsents, { status: 1, expiresAt: 1 }, {}, 'gdpr_consents.(status+expiresAt)');
  await createIdx(gdprConsents, { revokedAt: 1 }, { sparse: true }, 'gdpr_consents.revokedAt sparse');

  const gdprRequests = client.db('masova_users').collection('gdpr_data_requests');
  await createIdx(gdprRequests, { status: 1, dueDate: 1 }, {}, 'gdpr_data_requests.(status+dueDate)');

  const gdprBreaches = client.db('masova_users').collection('gdpr_data_breaches');
  await createIdx(gdprBreaches, { severity: 1, status: 1 }, {}, 'gdpr_data_breaches.(severity+status)');
  await createIdx(gdprBreaches, { status: 1, detectedAt: -1 }, {}, 'gdpr_data_breaches.(status+detectedAt)');

  // ─────────────────────────────────────────────────────────────────
  // P2 — TTL INDEXES
  // ─────────────────────────────────────────────────────────────────
  console.log('\n=== P2: TTL Indexes ===\n');

  // Customer soft-deletes: hard delete after 90 days
  await createIdx(customers, { deletedAt: 1 },
    { expireAfterSeconds: 7776000, partialFilterExpression: { active: false } },
    'customers.deletedAt TTL 90d (soft-deleted only)');

  // Rating tokens: expire at exact expiresAt timestamp
  await createIdx(ratingTokens, { expiresAt: 1 },
    { expireAfterSeconds: 0 },
    'rating_tokens.expiresAt TTL (exact expiry)');

  // Driver locations: keep 7 days only
  await createIdx(driverLocations, { timestamp: 1 },
    { expireAfterSeconds: 604800 },
    'driver_locations.timestamp TTL 7 days');

  // Cancelled orders: archive after 1 year
  await createIdx(orders, { cancelledAt: 1 },
    { expireAfterSeconds: 31536000, partialFilterExpression: { status: 'CANCELLED' } },
    'orders.cancelledAt TTL 1yr (CANCELLED only)');

  // GDPR audit logs: legal 7-year retention
  await createIdx(gdprAuditLogs, { timestamp: 1 },
    { expireAfterSeconds: 220752000 },
    'gdpr_audit_logs.timestamp TTL 7 years (legal)');

  // ─────────────────────────────────────────────────────────────────
  // SUMMARY
  // ─────────────────────────────────────────────────────────────────
  await client.close();
  console.log('\n═══════════════════════════════════════');
  console.log('  MaSoVa Index Migration Complete');
  console.log('═══════════════════════════════════════');
  console.log(`  Created : ${created}`);
  console.log(`  Skipped : ${skipped} (already existed)`);
  console.log(`  Failed  : ${failed}`);
  console.log('═══════════════════════════════════════');
  if (failed > 0) process.exit(1);
}

main().catch((e) => {
  console.error('Fatal:', e.message);
  process.exit(1);
});
