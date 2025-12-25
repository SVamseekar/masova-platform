#!/usr/bin/env node

/**
 * Diagnostic Script: Staff Leaderboard & Analytics Investigation
 *
 * This script helps identify why staff leaderboard and POS analytics
 * are not updating by checking:
 * 1. Orders in database with staff attribution
 * 2. Order statuses (terminal vs non-terminal)
 * 3. Timezone boundaries
 * 4. Store context matching
 */

const { MongoClient } = require('mongodb');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const DB_NAME = 'masova_orders';
const STORE_ID = process.argv[2] || 'DOM001'; // Pass store ID as argument

// IST timezone offset (UTC +5:30)
const IST_OFFSET = 5.5 * 60 * 60 * 1000;

function toISTDateString(date) {
  const istDate = new Date(date.getTime() + IST_OFFSET);
  return istDate.toISOString().replace('T', ' ').substring(0, 19) + ' IST';
}

function isCompletedOrder(order) {
  const { status, orderType } = order;

  switch (orderType) {
    case 'DELIVERY':
      return status === 'DELIVERED';
    case 'TAKEAWAY':
      return status === 'COMPLETED';
    case 'DINE_IN':
      return status === 'SERVED';
    default:
      return ['DELIVERED', 'COMPLETED', 'SERVED'].includes(status);
  }
}

async function investigateAnalytics() {
  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');
    console.log('=====================================');
    console.log(`📊 Investigating Analytics for Store: ${STORE_ID}`);
    console.log('=====================================\n');

    const db = client.db(DB_NAME);
    const ordersCollection = db.collection('orders');

    // Get today's date in IST
    const now = new Date();
    const todayIST = new Date(now.getTime() + IST_OFFSET);
    todayIST.setUTCHours(0, 0, 0, 0);

    // Convert to UTC for MongoDB query
    const startOfDayUTC = new Date(todayIST.getTime() - IST_OFFSET);
    const endOfDayUTC = new Date(startOfDayUTC.getTime() + 24 * 60 * 60 * 1000 - 1);

    console.log(`📅 Query Date Range (IST):`);
    console.log(`   Start: ${toISTDateString(startOfDayUTC)}`);
    console.log(`   End:   ${toISTDateString(endOfDayUTC)}`);
    console.log(`   (MongoDB stores in UTC)\n`);

    // Fetch all orders for today
    const allOrdersToday = await ordersCollection.find({
      storeId: STORE_ID,
      createdAt: {
        $gte: startOfDayUTC,
        $lte: endOfDayUTC
      }
    }).sort({ createdAt: -1 }).toArray();

    console.log(`📦 Total Orders Today: ${allOrdersToday.length}\n`);

    if (allOrdersToday.length === 0) {
      console.log('⚠️  NO ORDERS FOUND for today!');
      console.log('   Possible causes:');
      console.log('   1. Wrong store ID (check STORE_ID parameter)');
      console.log('   2. Orders created yesterday or earlier (timezone issue)');
      console.log('   3. No orders actually created yet\n');

      // Check for recent orders
      const recentOrders = await ordersCollection.find({
        storeId: STORE_ID
      }).sort({ createdAt: -1 }).limit(5).toArray();

      if (recentOrders.length > 0) {
        console.log(`📋 Last 5 Orders for Store ${STORE_ID}:`);
        recentOrders.forEach((order, idx) => {
          console.log(`   ${idx + 1}. Order ${order.orderNumber}`);
          console.log(`      Created: ${toISTDateString(order.createdAt)}`);
          console.log(`      Status: ${order.status} | Type: ${order.orderType}`);
          console.log(`      Staff: ${order.createdByStaffId || 'NONE'}`);
        });
      }

      return;
    }

    // Categorize orders
    const ordersWithStaff = allOrdersToday.filter(o => o.createdByStaffId);
    const completedOrders = allOrdersToday.filter(isCompletedOrder);
    const completedWithStaff = ordersWithStaff.filter(isCompletedOrder);

    console.log(`👥 Orders with Staff Attribution: ${ordersWithStaff.length}`);
    console.log(`✅ Completed Orders (would be counted): ${completedOrders.length}`);
    console.log(`🎯 Completed Orders with Staff: ${completedWithStaff.length}\n`);

    // ROOT CAUSE ANALYSIS
    console.log('🔍 ROOT CAUSE ANALYSIS:\n');

    if (ordersWithStaff.length === 0) {
      console.log('❌ ISSUE 1: No orders have createdByStaffId populated!');
      console.log('   ➡️  Orders must be created through POS with staff attribution');
      console.log('   ➡️  Customer-created orders won\'t appear in staff leaderboard\n');
    } else {
      console.log(`✅ Found ${ordersWithStaff.length} orders with staff attribution\n`);
    }

    if (completedWithStaff.length === 0 && ordersWithStaff.length > 0) {
      console.log('❌ ISSUE 2: Orders with staff are NOT in completed state!');
      console.log('   ➡️  Analytics only counts orders with terminal status:');
      console.log('      - DELIVERY orders must be DELIVERED');
      console.log('      - TAKEAWAY orders must be COMPLETED');
      console.log('      - DINE_IN orders must be SERVED\n');

      console.log('   Current order statuses:');
      ordersWithStaff.forEach(order => {
        const isCompleted = isCompletedOrder(order);
        const icon = isCompleted ? '✅' : '❌';
        console.log(`   ${icon} ${order.orderNumber}: ${order.status} (${order.orderType})`);
      });
      console.log();
    } else if (completedWithStaff.length > 0) {
      console.log(`✅ Found ${completedWithStaff.length} COMPLETED orders with staff!\n`);
    }

    // Check timezone issues
    const ordersOutsideToday = await ordersCollection.find({
      storeId: STORE_ID,
      createdByStaffId: { $exists: true, $ne: null },
      createdAt: {
        $lt: startOfDayUTC
      }
    }).sort({ createdAt: -1 }).limit(5).toArray();

    if (ordersOutsideToday.length > 0) {
      console.log('⚠️  POSSIBLE ISSUE 3: Recent orders fall outside today\'s IST range');
      console.log('   These orders won\'t appear in TODAY analytics:\n');
      ordersOutsideToday.forEach(order => {
        console.log(`   - ${order.orderNumber}: ${toISTDateString(order.createdAt)}`);
      });
      console.log();
    }

    // Detailed breakdown
    if (completedWithStaff.length > 0) {
      console.log('📊 COMPLETED ORDERS BREAKDOWN:\n');

      const staffSales = {};
      completedWithStaff.forEach(order => {
        const staffId = order.createdByStaffId;
        const staffName = order.createdByStaffName || 'Unknown';

        if (!staffSales[staffId]) {
          staffSales[staffId] = {
            name: staffName,
            orders: 0,
            sales: 0
          };
        }

        staffSales[staffId].orders += 1;
        staffSales[staffId].sales += order.totalAmount || 0;
      });

      Object.entries(staffSales).forEach(([staffId, data]) => {
        console.log(`   👤 ${data.name} (${staffId})`);
        console.log(`      Orders: ${data.orders}`);
        console.log(`      Sales: ₹${data.sales.toFixed(2)}`);
      });
      console.log();
    }

    // FINAL DIAGNOSIS
    console.log('=' repeat 60);
    console.log('🎯 DIAGNOSIS & RECOMMENDED ACTION:\n');

    if (completedWithStaff.length > 0) {
      console.log('✅ Orders ARE ready for analytics!');
      console.log('   Next steps:');
      console.log('   1. Clear analytics cache: POST /api/analytics/cache/clear');
      console.log('   2. Check frontend is sending correct X-Selected-Store-Id header');
      console.log('   3. Verify timezone handling in order-service queries');
      console.log('   4. Check application logs for errors\n');
    } else if (ordersWithStaff.length > 0) {
      console.log('⚠️  Orders exist but not in COMPLETED state!');
      console.log('   Action required:');
      console.log('   1. Update order status to terminal state:');
      ordersWithStaff.forEach(order => {
        const targetStatus = order.orderType === 'DELIVERY' ? 'DELIVERED' :
                            order.orderType === 'TAKEAWAY' ? 'COMPLETED' : 'SERVED';
        console.log(`      - ${order.orderNumber}: ${order.status} → ${targetStatus}`);
      });
      console.log('   2. Use Kitchen Display or API to update status');
      console.log('   3. Analytics will update once status changes\n');
    } else {
      console.log('❌ No orders with staff attribution found!');
      console.log('   Action required:');
      console.log('   1. Create orders through POS (not customer portal)');
      console.log('   2. Ensure staff member is logged in when creating orders');
      console.log('   3. Complete orders to terminal status\n');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  } finally {
    await client.close();
  }
}

// Helper to repeat string
String.prototype.repeat = function(count) {
  return new Array(count + 1).join(this);
};

// Run investigation
console.log('\n🔍 MaSoVa Analytics Investigation Tool\n');
investigateAnalytics().then(() => {
  console.log('=' repeat 60);
  console.log('Investigation complete!\n');
  process.exit(0);
}).catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
