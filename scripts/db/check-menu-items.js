const { MongoClient } = require('mongodb');

const MONGO_URI = 'mongodb://localhost:27017';

async function checkMenuItems() {
    const client = new MongoClient(MONGO_URI);
    try {
        await client.connect();

        const admin = client.db().admin();
        const databases = await admin.listDatabases();

        console.log('🔍 Searching for menu items across all databases...\n');

        for (const dbInfo of databases.databases) {
            const dbName = dbInfo.name;
            if (dbName === 'admin' || dbName === 'local' || dbName === 'config') continue;

            const db = client.db(dbName);
            const collections = await db.listCollections().toArray();

            for (const collInfo of collections) {
                const collName = collInfo.name;
                if (collName.toLowerCase().includes('menu')) {
                    const coll = db.collection(collName);
                    const count = await coll.countDocuments();

                    if (count > 0) {
                        console.log(`📦 Database: ${dbName}`);
                        console.log(`   Collection: ${collName}`);
                        console.log(`   Total items: ${count}`);

                        // Check distribution by storeId
                        const storeGroups = await coll.aggregate([
                            { $group: { _id: '$storeId', count: { $sum: 1 } } }
                        ]).toArray();

                        console.log('   Menu items by store:');
                        storeGroups.forEach(group => {
                            console.log(`     - Store: ${group._id || 'null/not set'} - Count: ${group.count}`);
                        });

                        // Show sample items
                        console.log('   Sample items:');
                        const items = await coll.find({}).limit(5).toArray();
                        items.forEach(item => {
                            console.log(`     - ${item.name} | Store: ${item.storeId || 'not set'} | Available: ${item.isAvailable}`);
                        });
                        console.log('');
                    }
                }
            }
        }

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await client.close();
    }
}

checkMenuItems();
