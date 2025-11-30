const { MongoClient } = require('mongodb');

const MONGO_URI = 'mongodb://localhost:27017';
const DB_NAME = 'masova_db';

async function fixStoreId() {
    const client = new MongoClient(MONGO_URI);
    try {
        await client.connect();
        const db = client.db(DB_NAME);
        const storesCollection = db.collection('stores');
        const usersCollection = db.collection('users');

        console.log('🔧 Fixing store ID mismatch...\n');

        // Step 1: Check current store
        const currentStore = await storesCollection.findOne({ _id: 'STORE001' });
        if (currentStore) {
            console.log('✅ Found store with ID: STORE001');
            console.log('   Name:', currentStore.name);

            // Delete the old store
            await storesCollection.deleteOne({ _id: 'STORE001' });
            console.log('🗑️  Deleted store STORE001');

            // Create new store with ID store-1
            currentStore._id = 'store-1';
            await storesCollection.insertOne(currentStore);
            console.log('✅ Created store with new ID: store-1\n');
        }

        // Step 2: Update manager's storeId
        const manager = await usersCollection.findOne({ 'personalInfo.email': 'suresh.manager@masova.com' });
        if (manager) {
            console.log('👤 Updating manager\'s store ID...');
            console.log('   Current storeId:', manager.employeeDetails?.storeId);

            await usersCollection.updateOne(
                { _id: manager._id },
                { $set: { 'employeeDetails.storeId': 'store-1' } }
            );

            const updated = await usersCollection.findOne({ _id: manager._id });
            console.log('   Updated storeId:', updated.employeeDetails?.storeId);
            console.log('✅ Manager updated\n');
        }

        // Step 3: Verify
        console.log('🔍 Verification:');
        const store = await storesCollection.findOne({ _id: 'store-1' });
        const user = await usersCollection.findOne({ 'personalInfo.email': 'suresh.manager@masova.com' });

        console.log('   Store ID:', store?._id);
        console.log('   Manager\'s storeId:', user?.employeeDetails?.storeId);
        console.log('   ✅ Match:', store?._id === user?.employeeDetails?.storeId);

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await client.close();
    }
}

fixStoreId();
