const { MongoClient } = require('mongodb');

const MONGO_URI = 'mongodb://localhost:27017';
const DB_NAME = 'MaSoVa';

async function copyMenuToDom003() {
    const client = new MongoClient(MONGO_URI);
    try {
        await client.connect();
        const db = client.db(DB_NAME);
        const menuCollection = db.collection('menu_items');

        console.log('🔍 Checking existing menu items for DOM003...\n');

        // Check if DOM003 already has menu items
        const dom003Count = await menuCollection.countDocuments({ storeId: 'DOM003' });
        console.log(`Found ${dom003Count} menu items for DOM003`);

        if (dom003Count > 0) {
            console.log('⚠️  DOM003 already has menu items. Skipping...');
            return;
        }

        // Get all menu items from DOM001
        console.log('\n📋 Fetching menu items from DOM001...');
        const dom001Items = await menuCollection.find({ storeId: 'DOM001' }).toArray();
        console.log(`Found ${dom001Items.length} items from DOM001`);

        if (dom001Items.length === 0) {
            console.log('❌ No menu items found in DOM001. Cannot copy.');
            return;
        }

        // Create new items for DOM003
        console.log('\n📝 Creating menu items for DOM003...');
        const dom003Items = dom001Items.map(item => {
            const newItem = { ...item };
            delete newItem._id; // Remove the _id so MongoDB generates a new one
            newItem.storeId = 'DOM003';
            return newItem;
        });

        // Insert into database
        const result = await menuCollection.insertMany(dom003Items);
        console.log(`✅ Successfully created ${result.insertedCount} menu items for DOM003`);

        // Verify
        const verifyCount = await menuCollection.countDocuments({ storeId: 'DOM003' });
        console.log(`\n🔍 Verification: DOM003 now has ${verifyCount} menu items`);

        // Show distribution
        console.log('\n📊 Menu items distribution by store:');
        const distribution = await menuCollection.aggregate([
            { $group: { _id: '$storeId', count: { $sum: 1 } } },
            { $sort: { _id: 1 } }
        ]).toArray();

        distribution.forEach(store => {
            console.log(`   ${store._id}: ${store.count} items`);
        });

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await client.close();
    }
}

copyMenuToDom003();
