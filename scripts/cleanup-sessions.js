const { MongoClient } = require('mongodb');

const MONGO_URI = 'mongodb://localhost:27017';

async function cleanupSessions() {
    const client = new MongoClient(MONGO_URI);
    try {
        await client.connect();

        const admin = client.db().admin();
        const databases = await admin.listDatabases();

        console.log('🔍 Cleaning up corrupted working sessions...\n');

        for (const dbInfo of databases.databases) {
            const dbName = dbInfo.name;
            if (dbName === 'admin' || dbName === 'local' || dbName === 'config') continue;

            const db = client.db(dbName);
            const collections = await db.listCollections().toArray();

            for (const collInfo of collections) {
                const collName = collInfo.name;
                if (collName.toLowerCase().includes('session') || collName.toLowerCase().includes('working')) {
                    const coll = db.collection(collName);

                    // Delete all sessions (corrupted data)
                    const count = await coll.countDocuments();

                    if (count > 0) {
                        console.log(`📦 Database: ${dbName}`);
                        console.log(`   Collection: ${collName}`);
                        console.log(`   Found: ${count} sessions`);

                        const result = await coll.deleteMany({});
                        console.log(`   🗑️  Deleted: ${result.deletedCount} sessions\n`);
                    }
                }
            }
        }

        console.log('✅ All corrupted sessions cleaned up!');

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await client.close();
    }
}

cleanupSessions();
