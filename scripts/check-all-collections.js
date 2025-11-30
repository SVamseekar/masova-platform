const { MongoClient } = require('mongodb');

const MONGO_URI = 'mongodb://localhost:27017';
const DB_NAME = 'masova_db';

async function checkAllCollections() {
    const client = new MongoClient(MONGO_URI);
    try {
        await client.connect();
        const db = client.db(DB_NAME);

        // Get all collections
        const collections = await db.listCollections().toArray();

        console.log('📊 Database:', DB_NAME);
        console.log('📁 Collections:\n');

        for (const collInfo of collections) {
            const collName = collInfo.name;
            const coll = db.collection(collName);
            const count = await coll.countDocuments();

            console.log(`  ${collName}: ${count} documents`);

            // Show sample for collections with data
            if (count > 0 && count <= 10) {
                const samples = await coll.find({}).limit(3).toArray();
                samples.forEach((doc, idx) => {
                    console.log(`    [${idx + 1}]`, doc._id, '|', Object.keys(doc).slice(0, 5).join(', '));
                });
            }
        }

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await client.close();
    }
}

checkAllCollections();
