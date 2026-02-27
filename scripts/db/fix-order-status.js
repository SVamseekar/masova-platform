#!/usr/bin/env node

/**
 * Fix Order Status Script
 * Updates order #ORD5331438455 from DELIVERED to COMPLETED
 */

const { MongoClient } = require('mongodb');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const DB_NAME = 'masova_orders';
const ORDER_NUMBER = 'ORD5331438455';

async function fixOrderStatus() {
  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    console.log('✅ Connected to MongoDB\n');

    const db = client.db(DB_NAME);
    const ordersCollection = db.collection('orders');

    // First, check the current status
    console.log('🔍 Checking current order status...');
    const order = await ordersCollection.findOne({ orderNumber: ORDER_NUMBER });

    if (!order) {
      console.error(`❌ Order ${ORDER_NUMBER} not found!`);
      return;
    }

    console.log(`📦 Order Found: ${ORDER_NUMBER}`);
    console.log(`   Current Status: ${order.status}`);
    console.log(`   Order Type: ${order.orderType}`);
    console.log(`   Created By: ${order.createdByStaffName || 'N/A'} (${order.createdByStaffId || 'N/A'})`);
    console.log(`   Total: ₹${order.totalAmount || 0}\n`);

    if (order.status === 'COMPLETED') {
      console.log('✅ Order is already COMPLETED. No update needed.');
      return;
    }

    // Update the status
    console.log('🔄 Updating order status from DELIVERED to COMPLETED...\n');

    const result = await ordersCollection.updateOne(
      { orderNumber: ORDER_NUMBER },
      {
        $set: {
          status: 'COMPLETED',
          updatedAt: new Date()
        }
      }
    );

    if (result.modifiedCount === 1) {
      console.log('✅ SUCCESS! Order status updated to COMPLETED\n');

      // Verify the update
      const updatedOrder = await ordersCollection.findOne({ orderNumber: ORDER_NUMBER });
      console.log('✅ Verification:');
      console.log(`   New Status: ${updatedOrder.status}`);
      console.log(`   Updated At: ${updatedOrder.updatedAt}\n`);

      console.log('📊 Next Steps:');
      console.log('   1. Clear analytics cache:');
      console.log('      curl -X POST http://localhost:8086/api/analytics/cache/clear \\');
      console.log('        -H "Authorization: Bearer YOUR_TOKEN" \\');
      console.log('        -H "X-Selected-Store-Id: DOM001"\n');
      console.log('   2. Refresh the staff leaderboard page');
      console.log('   3. Satish Reddy should now appear with 1 order and ₹1,375.50 in sales\n');
    } else {
      console.log('⚠️  No changes made. Order may already be updated.');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  } finally {
    await client.close();
    console.log('🔌 MongoDB connection closed');
  }
}

console.log('\n🔧 MaSoVa Order Status Fix Tool');
console.log('================================\n');

fixOrderStatus().then(() => {
  console.log('\n✅ Script completed successfully!\n');
  process.exit(0);
}).catch(err => {
  console.error('❌ Fatal error:', err);
  process.exit(1);
});
