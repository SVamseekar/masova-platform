const { MongoClient } = require('mongodb');

const MONGO_URI = 'mongodb://localhost:27017';

async function checkSessions() {
    const client = new MongoClient(MONGO_URI);
    try {
        await client.connect();

        const admin = client.db().admin();
        const databases = await admin.listDatabases();

        console.log('🔍 Searching for working sessions...\n');

        for (const dbInfo of databases.databases) {
            const dbName = dbInfo.name;
            if (dbName === 'admin' || dbName === 'local' || dbName === 'config') continue;

            const db = client.db(dbName);
            const collections = await db.listCollections().toArray();

            for (const collInfo of collections) {
                const collName = collInfo.name;
                if (collName.toLowerCase().includes('session') || collName.toLowerCase().includes('working')) {
                    const coll = db.collection(collName);
                    const count = await coll.countDocuments();

                    if (count > 0) {
                        console.log(`📦 Database: ${dbName}`);
                        console.log(`   Collection: ${collName}`);
                        console.log(`   Total sessions: ${count}\n`);

                        // Show all sessions
                        const sessions = await coll.find({}).toArray();
                        sessions.forEach(session => {
                            console.log(`   Session ID: ${session._id}`);
                            console.log(`   User ID: ${session.userId || 'N/A'}`);
                            console.log(`   User Name: ${session.userName || 'N/A'}`);
                            console.log(`   Employee Name: ${session.employeeName || 'N/A'}`);
                            console.log(`   Role: ${session.role || 'N/A'}`);
                            console.log(`   Store ID: ${session.storeId || 'N/A'}`);
                            console.log(`   Status: ${session.status || 'N/A'}`);
                            console.log(`   Clock In: ${session.clockInTime || 'N/A'}`);
                            console.log(`   Clock Out: ${session.clockOutTime || 'N/A'}`);
                            console.log('   ---');
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

checkSessions();
