const { MongoClient } = require('mongodb');

const MONGO_URI = 'mongodb://localhost:27017';
const DB_NAME = 'masova_db';

async function checkData() {
    const client = new MongoClient(MONGO_URI);
    try {
        await client.connect();
        const db = client.db(DB_NAME);

        console.log('=== CHECKING MANAGER ===');
        const manager = await db.collection('users').findOne({
            'personalInfo.email': 'suresh.manager@masova.com'
        });

        if (manager) {
            console.log('✅ Manager found:');
            console.log('  ID:', manager._id);
            console.log('  Type:', manager.type);
            console.log('  Active:', manager.active);
            console.log('  StoreId:', manager.employeeDetails?.storeId || '❌ NOT SET');
            console.log('  Role:', manager.employeeDetails?.role || '❌ NOT SET');
        } else {
            console.log('❌ Manager not found!');
        }

        console.log('\n=== CHECKING STORES ===');
        const stores = await db.collection('stores').find({}).toArray();
        console.log('Total stores:', stores.length);

        if (stores.length === 0) {
            console.log('❌ No stores found in database!');
        } else {
            stores.forEach(s => {
                console.log(`  ✅ ${s._id}: ${s.name} (status: ${s.status})`);
            });
        }

    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        await client.close();
    }
}

checkData();
