const { MongoClient } = require('mongodb');

const MONGO_URI = 'mongodb://localhost:27017';

async function checkAndDeleteOrders() {
    const client = new MongoClient(MONGO_URI);
    try {
        await client.connect();

        // Check all databases for orders
        const admin = client.db().admin();
        const databases = await admin.listDatabases();

        console.log('🔍 Searching for orders across all databases...\n');

        for (const dbInfo of databases.databases) {
            const dbName = dbInfo.name;
            if (dbName === 'admin' || dbName === 'local' || dbName === 'config') continue;

            const db = client.db(dbName);
            const collections = await db.listCollections().toArray();

            for (const collInfo of collections) {
                const collName = collInfo.name;
                if (collName.toLowerCase().includes('order')) {
                    const coll = db.collection(collName);
                    const count = await coll.countDocuments();

                    if (count > 0) {
                        console.log(`📦 Database: ${dbName}`);
                        console.log(`   Collection: ${collName}`);
                        console.log(`   Count: ${count} documents`);

                        // Show sample orders
                        const orders = await coll.find({}).limit(5).toArray();
                        orders.forEach(order => {
                            console.log(`     - Order ID: ${order._id || order.id || 'N/A'} | Customer: ${order.customerName || order.customer?.name || 'N/A'} | Status: ${order.status || 'N/A'}`);
                        });

                        // Delete all orders
                        console.log(`   🗑️  Deleting ${count} orders...`);
                        const result = await coll.deleteMany({});
                        console.log(`   ✅ Deleted ${result.deletedCount} orders\n`);
                    }
                }
            }
        }

        console.log('✅ All orders checked and deleted across all databases');

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await client.close();
    }
}

checkAndDeleteOrders();
