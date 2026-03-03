/**
 * P0 MongoDB Index Fixes
 *
 * Fixes:
 * 1. customers.email compound index → add unique: true for store-scoped uniqueness
 * 2. customers.phone compound index → add unique: true for store-scoped uniqueness
 * 3. reviews → add deduplication index { orderId, customerId } unique: true
 * 4. notifications → add { userId: 1 } index
 *
 * Run: node scripts/fix-p0-indexes.js
 * Target: MongoDB on Dell at localhost:27017 (run from Dell) or 192.168.50.88:27017 (run from Mac)
 */

const { MongoClient } = require('mongodb');

const MONGO_URL = process.env.MONGO_URL || 'mongodb://192.168.50.88:27017';
const DB_NAME = 'masova_db';

/** Drop an index, ignoring IndexNotFound (code 27). Re-throws all other errors. */
async function dropIndexSafe(collection, indexName) {
  try {
    await collection.dropIndex(indexName);
    console.log(`✓ Dropped index: ${indexName}`);
  } catch (e) {
    if (e.code === 27) {
      console.log(`  (${indexName} not found — skipping drop)`);
    } else {
      console.error(`FATAL: Failed to drop index ${indexName}. Code: ${e.code}, Message: ${e.message}`);
      throw e;
    }
  }
}

async function fixP0Indexes() {
  const client = new MongoClient(MONGO_URL);
  let currentStep = 'connecting';

  try {
    await client.connect();
    console.log('Connected to MongoDB at', MONGO_URL);
    const db = client.db(DB_NAME);

    // ─── 1. customers: drop non-unique indexes, add store-scoped unique compound ──
    currentStep = 'dropping old customer email/phone indexes';
    const customers = db.collection('customers');

    await dropIndexSafe(customers, 'email_1');
    await dropIndexSafe(customers, 'phone_1');
    await dropIndexSafe(customers, 'storeId_1_email_1');
    await dropIndexSafe(customers, 'storeId_1_phone_1');

    // Check for duplicate (storeId, email) pairs BEFORE adding unique index
    currentStep = 'checking customer email duplicates';
    const emailDuplicates = await customers.aggregate([
      { $match: { email: { $ne: null, $ne: '' } } },
      { $group: { _id: { storeId: '$storeId', email: '$email' }, count: { $sum: 1 } } },
      { $match: { count: { $gt: 1 } } }
    ]).toArray();

    if (emailDuplicates.length > 0) {
      console.error(`FATAL: ${emailDuplicates.length} duplicate (storeId, email) pair(s) found — cannot add unique index:`);
      emailDuplicates.forEach(d => console.error('  ', JSON.stringify(d)));
      console.error('Resolve duplicates manually and re-run. No further changes were applied.');
      await client.close();
      process.exit(1);
    }

    currentStep = 'creating unique customers { storeId, email } index';
    await customers.createIndex(
      { storeId: 1, email: 1 },
      { unique: true, sparse: true, name: 'idx_customers_store_email_unique' }
    );
    console.log('✓ Created unique index: customers { storeId, email }');

    // Check for duplicate (storeId, phone) pairs BEFORE adding unique index
    currentStep = 'checking customer phone duplicates';
    const phoneDuplicates = await customers.aggregate([
      { $match: { phone: { $ne: null, $ne: '' } } },
      { $group: { _id: { storeId: '$storeId', phone: '$phone' }, count: { $sum: 1 } } },
      { $match: { count: { $gt: 1 } } }
    ]).toArray();

    if (phoneDuplicates.length > 0) {
      console.error(`FATAL: ${phoneDuplicates.length} duplicate (storeId, phone) pair(s) found — cannot add unique index:`);
      phoneDuplicates.forEach(d => console.error('  ', JSON.stringify(d)));
      console.error('Resolve duplicates manually and re-run.');
      await client.close();
      process.exit(1);
    }

    currentStep = 'creating unique customers { storeId, phone } index';
    await customers.createIndex(
      { storeId: 1, phone: 1 },
      { unique: true, sparse: true, name: 'idx_customers_store_phone_unique' }
    );
    console.log('✓ Created unique index: customers { storeId, phone }');

    // ─── 2. reviews: add deduplication index ─────────────────────────────────────
    currentStep = 'checking review duplicates';
    const reviews = db.collection('reviews');

    const reviewDuplicates = await reviews.aggregate([
      { $match: { orderId: { $ne: null }, customerId: { $ne: null } } },
      { $group: { _id: { orderId: '$orderId', customerId: '$customerId' }, count: { $sum: 1 } } },
      { $match: { count: { $gt: 1 } } }
    ]).toArray();

    if (reviewDuplicates.length > 0) {
      console.error(`FATAL: ${reviewDuplicates.length} duplicate (orderId, customerId) review pair(s) found.`);
      console.error('The unique deduplication index cannot be created until these are resolved.');
      reviewDuplicates.forEach(d => console.error('  ', JSON.stringify(d)));
      console.error('Resolve duplicates and re-run. No index was created for reviews.');
      await client.close();
      process.exit(1);
    }

    currentStep = 'creating unique reviews { orderId, customerId } index';
    await reviews.createIndex(
      { orderId: 1, customerId: 1 },
      { unique: true, sparse: true, name: 'idx_reviews_order_customer_unique' }
    );
    console.log('✓ Created unique deduplication index: reviews { orderId, customerId }');

    // ─── 3. notifications: add userId index ──────────────────────────────────────
    currentStep = 'creating notifications { userId } index';
    const notifications = db.collection('notifications');
    await notifications.createIndex(
      { userId: 1 },
      { name: 'idx_notifications_user' }
    );
    console.log('✓ Created index: notifications { userId }');

    currentStep = 'creating notifications { userId, createdAt } index';
    await notifications.createIndex(
      { userId: 1, createdAt: -1 },
      { name: 'idx_notifications_user_created' }
    );
    console.log('✓ Created index: notifications { userId, createdAt desc }');

    console.log('\n✅ P0 index fixes complete.');

  } catch (err) {
    console.error(`FATAL during step "${currentStep}": ${err.message} (code: ${err.code ?? 'n/a'})`);
    console.error(err);
    process.exit(1);
  } finally {
    await client.close();
  }
}

fixP0Indexes();
