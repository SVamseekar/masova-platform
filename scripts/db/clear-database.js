// scripts/clear-database.js
// Drops all seed data from MaSoVa development databases.
// Run with: node scripts/clear-database.js
//
// WARNING: This deletes ALL documents from ALL masova_* databases.
// Only use in development. Never run against production.

const { MongoClient } = require('mongodb');
const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';

const TARGET_DBS = [
  { db: 'masova_db',            collections: ['stores', 'users', 'working_sessions'] },
  { db: 'masova_customers',     collections: ['customers', 'promotions'] },
  { db: 'masova_orders',        collections: ['orders'] },
  { db: 'masova_delivery',      collections: ['deliveries', 'driver_locations'] },
  { db: 'masova_payments',      collections: ['payments', 'refunds'] },
  { db: 'masova_reviews',       collections: ['reviews'] },
  { db: 'masova_notifications', collections: ['notifications'] },
  { db: 'masova_menu',          collections: ['menu_items', 'recipes'] },
  { db: 'masova_inventory',     collections: ['inventory_items', 'purchase_orders', 'suppliers', 'waste_records'] },
  { db: 'masova_analytics',     collections: [] }, // no persistent collections
];

async function clear() {
  const client = new MongoClient(MONGO_URI);

  try {
    await client.connect();
    console.log('Connected to MongoDB at', MONGO_URI);
    console.log('WARNING: Clearing all seed data from development databases...\n');

    for (const { db, collections } of TARGET_DBS) {
      for (const col of collections) {
        const result = await client.db(db).collection(col).deleteMany({});
        console.log(`  ${db}.${col}: ${result.deletedCount} documents deleted`);
      }
    }

    console.log('\n✓ All databases cleared.');
  } catch (err) {
    console.error('Clear failed:', err.message);
    process.exit(1);
  } finally {
    await client.close();
  }
}

clear();
