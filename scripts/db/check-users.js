const { MongoClient } = require('mongodb');

const MONGO_URI = 'mongodb://localhost:27017';

async function checkUsers() {
    const client = new MongoClient(MONGO_URI);
    try {
        await client.connect();

        const admin = client.db().admin();
        const databases = await admin.listDatabases();

        console.log('🔍 Searching for users across all databases...\n');

        for (const dbInfo of databases.databases) {
            const dbName = dbInfo.name;
            if (dbName === 'admin' || dbName === 'local' || dbName === 'config') continue;

            const db = client.db(dbName);
            const collections = await db.listCollections().toArray();

            for (const collInfo of collections) {
                const collName = collInfo.name;
                if (collName.toLowerCase() === 'users') {
                    const coll = db.collection(collName);
                    const count = await coll.countDocuments();

                    if (count > 0) {
                        console.log(`📦 Database: ${dbName}`);
                        console.log(`   Collection: ${collName}`);
                        console.log(`   Total users: ${count}\n`);

                        // Get all users and group by type and store
                        const users = await coll.find({}).toArray();

                        // Group by type
                        const byType = {};
                        users.forEach(user => {
                            const type = user.type || 'UNKNOWN';
                            if (!byType[type]) byType[type] = [];
                            byType[type].push(user);
                        });

                        // Display by type
                        Object.keys(byType).sort().forEach(type => {
                            console.log(`   👤 ${type} (${byType[type].length}):`);
                            byType[type].forEach(user => {
                                const storeId = user.storeId || user.employeeDetails?.storeId || 'No store';
                                const name = user.name || 'N/A';
                                const email = user.email || 'N/A';
                                const active = user.active !== false ? '✓' : '✗';
                                console.log(`      ${active} ${name} | ${email} | Store: ${storeId}`);
                            });
                            console.log('');
                        });
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

checkUsers();
