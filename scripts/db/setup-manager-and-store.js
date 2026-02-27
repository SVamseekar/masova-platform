const { MongoClient } = require('mongodb');

const MONGO_URI = 'mongodb://localhost:27017';
const DB_NAME = 'masova_db';

async function setup() {
    const client = new MongoClient(MONGO_URI);
    try {
        await client.connect();
        const db = client.db(DB_NAME);

        console.log('=== SETTING UP STORE AND MANAGER ===\n');

        // Step 1: Create a store
        console.log('Step 1: Creating store...');
        const storesCollection = db.collection('stores');

        const store = {
            _id: 'STORE001',
            name: 'MaSoVa Main Branch',
            code: 'DOM001',
            address: {
                street: '123 MG Road',
                city: 'Bangalore',
                state: 'Karnataka',
                zipCode: '560001',
                latitude: 12.9716,
                longitude: 77.5946
            },
            phoneNumber: '9876543210',
            regionId: 'REGION001',
            status: 'ACTIVE',
            operatingHours: {
                standardHours: {
                    MONDAY: { openTime: '09:00', closeTime: '22:00' },
                    TUESDAY: { openTime: '09:00', closeTime: '22:00' },
                    WEDNESDAY: { openTime: '09:00', closeTime: '22:00' },
                    THURSDAY: { openTime: '09:00', closeTime: '22:00' },
                    FRIDAY: { openTime: '09:00', closeTime: '23:00' },
                    SATURDAY: { openTime: '09:00', closeTime: '23:00' },
                    SUNDAY: { openTime: '10:00', closeTime: '22:00' }
                }
            },
            configuration: {
                deliveryRadiusKm: 10.0,
                maxConcurrentOrders: 50,
                acceptingOrders: true,
                deliveryEnabled: true,
                dineInEnabled: true,
                takeawayEnabled: true
            },
            openingDate: new Date('2024-01-01'),
            createdAt: new Date(),
            lastModified: new Date()
        };

        // Check if store already exists
        const existingStore = await storesCollection.findOne({ _id: store._id });
        if (existingStore) {
            console.log('  ⚠️  Store already exists:', store._id);
        } else {
            await storesCollection.insertOne(store);
            console.log('  ✅ Store created:', store._id, '-', store.name);
        }

        // Step 2: Update manager with proper fields
        console.log('\nStep 2: Updating manager...');
        const usersCollection = db.collection('users');

        const manager = await usersCollection.findOne({
            'personalInfo.email': 'suresh.manager@masova.com'
        });

        if (!manager) {
            console.log('  ❌ Manager not found!');
            return;
        }

        const updateResult = await usersCollection.updateOne(
            { _id: manager._id },
            {
                $set: {
                    type: 'MANAGER',
                    active: true,
                    employeeDetails: {
                        storeId: 'STORE001',
                        role: 'Store Manager',
                        permissions: [
                            'VIEW_ORDERS',
                            'MANAGE_ORDERS',
                            'VIEW_INVENTORY',
                            'MANAGE_INVENTORY',
                            'VIEW_EMPLOYEES',
                            'MANAGE_EMPLOYEES',
                            'VIEW_ANALYTICS',
                            'VIEW_PAYMENTS',
                            'MANAGE_STORE_SETTINGS'
                        ],
                        schedule: {
                            MONDAY: { startTime: '09:00', endTime: '18:00' },
                            TUESDAY: { startTime: '09:00', endTime: '18:00' },
                            WEDNESDAY: { startTime: '09:00', endTime: '18:00' },
                            THURSDAY: { startTime: '09:00', endTime: '18:00' },
                            FRIDAY: { startTime: '09:00', endTime: '18:00' }
                        }
                    },
                    lastModified: new Date()
                }
            }
        );

        if (updateResult.modifiedCount > 0) {
            console.log('  ✅ Manager updated successfully');
        } else {
            console.log('  ⚠️  Manager was already up to date');
        }

        // Step 3: Verify the setup
        console.log('\n=== VERIFICATION ===');
        const updatedManager = await usersCollection.findOne({
            'personalInfo.email': 'suresh.manager@masova.com'
        });

        console.log('Manager Details:');
        console.log('  Email:', updatedManager.personalInfo.email);
        console.log('  Type:', updatedManager.type);
        console.log('  Active:', updatedManager.active);
        console.log('  StoreId:', updatedManager.employeeDetails.storeId);
        console.log('  Role:', updatedManager.employeeDetails.role);
        console.log('  Permissions:', updatedManager.employeeDetails.permissions.length, 'permissions');

        const verifyStore = await storesCollection.findOne({ _id: 'STORE001' });
        console.log('\nStore Details:');
        console.log('  ID:', verifyStore._id);
        console.log('  Name:', verifyStore.name);
        console.log('  Code:', verifyStore.code);
        console.log('  Status:', verifyStore.status);

        console.log('\n✅ Setup complete! Manager can now log in.');

    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error(error.stack);
    } finally {
        await client.close();
    }
}

setup();
