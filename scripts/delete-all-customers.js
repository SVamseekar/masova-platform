const { MongoClient } = require('mongodb');

const MONGO_URI = 'mongodb://localhost:27017';

async function deleteAllCustomers() {
    const client = new MongoClient(MONGO_URI);
    try {
        await client.connect();

        // Check all databases for customers
        const admin = client.db().admin();
        const databases = await admin.listDatabases();

        console.log('🔍 Searching for customers across all databases...\n');

        for (const dbInfo of databases.databases) {
            const dbName = dbInfo.name;
            if (dbName === 'admin' || dbName === 'local' || dbName === 'config') continue;

            const db = client.db(dbName);
            const collections = await db.listCollections().toArray();

            for (const collInfo of collections) {
                const collName = collInfo.name;
                if (collName.toLowerCase().includes('customer')) {
                    const coll = db.collection(collName);
                    const count = await coll.countDocuments();

                    if (count > 0) {
                        console.log(`📦 Database: ${dbName}`);
                        console.log(`   Collection: ${collName}`);
                        console.log(`   Count: ${count} documents`);

                        // Show sample customers
                        const customers = await coll.find({}).limit(5).toArray();
                        customers.forEach(customer => {
                            console.log(`     - Customer ID: ${customer._id || customer.id || 'N/A'} | Name: ${customer.name || 'N/A'} | Email: ${customer.email || 'N/A'}`);
                        });

                        // Delete all customers
                        console.log(`   🗑️  Deleting ${count} customers...`);
                        const result = await coll.deleteMany({});
                        console.log(`   ✅ Deleted ${result.deletedCount} customers\n`);
                    }
                }
            }
        }

        console.log('✅ All customers checked and deleted across all databases');

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await client.close();
    }
}

deleteAllCustomers();
