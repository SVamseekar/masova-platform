// scripts/migrations/add-compound-indexes.js
// Adds compound and geospatial indexes that Spring Data MongoDB does not
// auto-create from @Indexed annotations alone.
// Run with: node scripts/migrations/add-compound-indexes.js
//
// Safe to re-run — createIndex is idempotent.

const { MongoClient } = require('mongodb');
const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';

async function run() {
  const client = new MongoClient(MONGO_URI);

  try {
    await client.connect();
    console.log('Connected to MongoDB at', MONGO_URI);

    // ── masova_orders ───────────────────────────────────────────────────────────
    {
      const col = client.db('masova_orders').collection('orders');

      // KDS kitchen queue: fetch all active orders for a store sorted by age
      await col.createIndex(
        { storeId: 1, status: 1, createdAt: 1 },
        { background: true, name: 'idx_store_status_created' }
      );
      console.log('✓ orders: (storeId, status, createdAt)');

      // Analytics: orders by store within a date range
      await col.createIndex(
        { storeId: 1, createdAt: -1 },
        { background: true, name: 'idx_store_created_desc' }
      );
      console.log('✓ orders: (storeId, createdAt DESC)');

      // Payment dashboard: unpaid orders per store
      await col.createIndex(
        { storeId: 1, paymentStatus: 1, createdAt: -1 },
        { background: true, name: 'idx_store_paymentstatus_created' }
      );
      console.log('✓ orders: (storeId, paymentStatus, createdAt DESC)');
    }

    // ── masova_delivery ─────────────────────────────────────────────────────────
    {
      const col = client.db('masova_delivery').collection('deliveries');

      // Dispatch screen: pending deliveries near a store
      await col.createIndex(
        { storeId: 1, status: 1, createdAt: 1 },
        { background: true, name: 'idx_store_status_created' }
      );
      console.log('✓ deliveries: (storeId, status, createdAt)');

      // Driver history page: all deliveries for a driver sorted by date
      await col.createIndex(
        { driverId: 1, createdAt: -1 },
        { background: true, name: 'idx_driver_created_desc' }
      );
      console.log('✓ deliveries: (driverId, createdAt DESC)');
    }

    // ── masova_delivery — driver_locations (geospatial) ─────────────────────────
    {
      const col = client.db('masova_delivery').collection('driver_locations');

      // 2dsphere index for proximity queries (find nearest driver to an order)
      await col.createIndex(
        { location: '2dsphere' },
        { background: true, name: 'idx_location_2dsphere' }
      );
      console.log('✓ driver_locations: location 2dsphere');

      // Lookup latest ping for a specific driver
      await col.createIndex(
        { driverId: 1, recordedAt: -1 },
        { background: true, name: 'idx_driver_recorded_desc' }
      );
      console.log('✓ driver_locations: (driverId, recordedAt DESC)');
    }

    // ── masova_inventory ────────────────────────────────────────────────────────
    {
      const col = client.db('masova_inventory').collection('inventory_items');

      // Low-stock dashboard: items below minimum for a store
      await col.createIndex(
        { storeId: 1, status: 1 },
        { background: true, name: 'idx_store_status' }
      );
      console.log('✓ inventory_items: (storeId, status)');

      await col.createIndex(
        { storeId: 1, currentStock: 1, minimumStock: 1 },
        { background: true, name: 'idx_store_stock_minimum' }
      );
      console.log('✓ inventory_items: (storeId, currentStock, minimumStock)');
    }

    // ── masova_inventory — purchase_orders ──────────────────────────────────────
    {
      const col = client.db('masova_inventory').collection('purchase_orders');

      await col.createIndex(
        { storeId: 1, status: 1, orderDate: -1 },
        { background: true, name: 'idx_store_status_orderdate' }
      );
      console.log('✓ purchase_orders: (storeId, status, orderDate DESC)');
    }

    // ── masova_inventory — waste_records ────────────────────────────────────────
    {
      const col = client.db('masova_inventory').collection('waste_records');

      await col.createIndex(
        { storeId: 1, wasteDate: -1 },
        { background: true, name: 'idx_store_wastedate_desc' }
      );
      console.log('✓ waste_records: (storeId, wasteDate DESC)');
    }

    // ── masova_customers ────────────────────────────────────────────────────────
    {
      const col = client.db('masova_customers').collection('customers');

      // Loyalty tier leaderboard
      await col.createIndex(
        { tier: 1, loyaltyPoints: -1 },
        { background: true, name: 'idx_tier_points_desc' }
      );
      console.log('✓ customers: (tier, loyaltyPoints DESC)');
    }

    console.log('\nAll compound indexes applied successfully.');
  } catch (err) {
    console.error('Error applying compound indexes:', err.message);
    process.exit(1);
  } finally {
    await client.close();
  }
}

run();
