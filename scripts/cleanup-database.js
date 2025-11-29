// MaSoVa Database Cleanup Script
// Removes all hardcoded stores, orders, and related data
// Run with: mongosh MaSoVa cleanup-database.js

print('🧹 Starting MaSoVa Database Cleanup...\n');

// Switch to MaSoVa database
db = db.getSiblingDB('MaSoVa');

// 1. Delete all orders
print('📦 Deleting all orders...');
const ordersResult = db.orders.deleteMany({});
print(`   ✓ Deleted ${ordersResult.deletedCount} orders`);

// 2. Delete all stores (users will create new ones)
print('🏪 Deleting all stores...');
const storesResult = db.stores.deleteMany({});
print(`   ✓ Deleted ${storesResult.deletedCount} stores`);

// 3. Delete all inventory items (tied to stores)
print('📊 Deleting all inventory items...');
const inventoryResult = db.inventoryItems.deleteMany({});
print(`   ✓ Deleted ${inventoryResult.deletedCount} inventory items`);

// 4. Delete all purchase orders (tied to stores)
print('🛒 Deleting all purchase orders...');
const purchaseOrdersResult = db.purchaseOrders.deleteMany({});
print(`   ✓ Deleted ${purchaseOrdersResult.deletedCount} purchase orders`);

// 5. Delete all waste records (tied to stores)
print('🗑️  Deleting all waste records...');
const wasteResult = db.wasteRecords.deleteMany({});
print(`   ✓ Deleted ${wasteResult.deletedCount} waste records`);

// 6. Delete all payments (tied to orders)
print('💳 Deleting all payments...');
const paymentsResult = db.payments.deleteMany({});
print(`   ✓ Deleted ${paymentsResult.deletedCount} payments`);

// 7. Delete all deliveries (tied to orders)
print('🚚 Deleting all deliveries...');
const deliveriesResult = db.deliveries.deleteMany({});
print(`   ✓ Deleted ${deliveriesResult.deletedCount} deliveries`);

// 8. Clear storeId from all users (they'll be assigned after store creation)
print('👥 Clearing store assignments from users...');
const usersResult = db.users.updateMany(
  { storeId: { $exists: true } },
  { $unset: { storeId: "" } }
);
print(`   ✓ Cleared storeId from ${usersResult.modifiedCount} users`);

// 9. Delete all working sessions (tied to stores)
print('⏰ Deleting all working sessions...');
const sessionsResult = db.workingSessions.deleteMany({});
print(`   ✓ Deleted ${sessionsResult.deletedCount} working sessions`);

// Summary
print('\n📊 Cleanup Summary:');
print('═'.repeat(50));
print(`   Orders:          ${ordersResult.deletedCount}`);
print(`   Stores:          ${storesResult.deletedCount}`);
print(`   Inventory Items: ${inventoryResult.deletedCount}`);
print(`   Purchase Orders: ${purchaseOrdersResult.deletedCount}`);
print(`   Waste Records:   ${wasteResult.deletedCount}`);
print(`   Payments:        ${paymentsResult.deletedCount}`);
print(`   Deliveries:      ${deliveriesResult.deletedCount}`);
print(`   Users Updated:   ${usersResult.modifiedCount}`);
print(`   Sessions:        ${sessionsResult.deletedCount}`);
print('═'.repeat(50));

// Verify cleanup
print('\n🔍 Verification:');
print(`   Remaining Orders: ${db.orders.countDocuments()}`);
print(`   Remaining Stores: ${db.stores.countDocuments()}`);
print(`   Remaining Inventory: ${db.inventoryItems.countDocuments()}`);
print(`   Users with storeId: ${db.users.countDocuments({ storeId: { $exists: true } })}`);

print('\n✅ Database cleanup completed successfully!');
print('\n💡 Next steps:');
print('   1. Create your first store via Manager Dashboard');
print('   2. Assign users to the store');
print('   3. Add inventory items');
print('   4. Start taking orders');
