// scripts/migrations/add-ttl-indexes.js
// Adds TTL (Time-To-Live) indexes to auto-expire stale data.
// Run with: node scripts/migrations/add-ttl-indexes.js
//
// Safe to re-run — createIndex is idempotent.
// Does NOT drop or recreate existing indexes.

const { MongoClient } = require('mongodb');
const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';

async function run() {
  const client = new MongoClient(MONGO_URI);

  try {
    await client.connect();
    console.log('Connected to MongoDB at', MONGO_URI);

    // ── 1. working_sessions (masova_db) ────────────────────────────────────────
    // Sessions older than 180 days are safe to expire.
    // Spring auto-creates single-field indexes but not TTL expiry.
    {
      const db = client.db('masova_db');
      await db.collection('working_sessions').createIndex(
        { createdAt: 1 },
        { expireAfterSeconds: 180 * 24 * 60 * 60, background: true } // 180 days
      );
      console.log('✓ working_sessions TTL index (180d) created');
    }

    // ── 2. notifications (masova_notifications) ─────────────────────────────────
    // Notification logs expire after 90 days — no value in keeping older logs.
    {
      const db = client.db('masova_notifications');
      await db.collection('notifications').createIndex(
        { createdAt: 1 },
        { expireAfterSeconds: 90 * 24 * 60 * 60, background: true } // 90 days
      );
      console.log('✓ notifications TTL index (90d) created');
    }

    // ── 3. driver_locations (masova_delivery) ───────────────────────────────────
    // Driver location ping history expires after 24 hours.
    // Only needed for live tracking; historical location data has no use.
    {
      const db = client.db('masova_delivery');
      // Collection may not exist yet if no driver has gone online —
      // createIndex will create it implicitly.
      await db.collection('driver_locations').createIndex(
        { recordedAt: 1 },
        { expireAfterSeconds: 24 * 60 * 60, background: true } // 24 hours
      );
      console.log('✓ driver_locations TTL index (24h) created');
    }

    console.log('\nAll TTL indexes applied successfully.');
  } catch (err) {
    console.error('Error applying TTL indexes:', err.message);
    process.exit(1);
  } finally {
    await client.close();
  }
}

run();
