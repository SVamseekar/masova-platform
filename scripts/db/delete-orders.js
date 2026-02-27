const { MongoClient } = require('mongodb');

const MONGO_URI = 'mongodb://localhost:27017';
const DB_NAME = 'masova_db';

async function deleteOrders() {
    const client = new MongoClient(MONGO_URI);
    try {
        await client.connect();
        const db = client.db(DB_NAME);
        const ordersCollection = db.collection('orders');

        // Check how many orders exist
        const orderCount = await ordersCollection.countDocuments();
        console.log(`📊 Found ${orderCount} orders in database`);

        if (orderCount === 0) {
            console.log('✅ No orders to delete');
            return;
        }

        // Show all orders before deletion
        const orders = await ordersCollection.find({}).toArray();
        console.log('\n📋 Current orders:');
        orders.forEach(order => {
            console.log(`  - Order ID: ${order._id} | Status: ${order.status} | Store: ${order.storeId}`);
        });

        // Delete all orders
        console.log('\n🗑️  Deleting all orders...');
        const result = await ordersCollection.deleteMany({});
        console.log(`✅ Deleted ${result.deletedCount} orders`);

        // Verify deletion
        const remainingCount = await ordersCollection.countDocuments();
        console.log(`\n📊 Remaining orders: ${remainingCount}`);

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await client.close();
    }
}

deleteOrders();
