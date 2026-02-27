const { MongoClient } = require('mongodb');

const MONGO_URI = 'mongodb://localhost:27017';
const DB_NAME = 'masova_db';

async function checkStore() {
    const client = new MongoClient(MONGO_URI);
    try {
        await client.connect();
        const db = client.db(DB_NAME);
        const storesCollection = db.collection('stores');

        const store = await storesCollection.findOne({ _id: 'STORE001' });

        if (!store) {
            console.log('❌ Store STORE001 not found');

            const allStores = await storesCollection.find({}).toArray();
            console.log('\nAll stores in database:');
            allStores.forEach(s => {
                console.log('- ID:', s._id, '| Name:', s.name);
            });
            return;
        }

        console.log('✅ Store STORE001 found');
        console.log('\nStore document:');
        console.log(JSON.stringify(store, null, 2));

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await client.close();
    }
}

checkStore();
