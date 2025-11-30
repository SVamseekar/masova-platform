const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');

const MONGO_URI = 'mongodb://localhost:27017';
const DB_NAME = 'masova_db';

async function cleanAndCreateManager() {
    const client = new MongoClient(MONGO_URI);
    try {
        await client.connect();
        const db = client.db(DB_NAME);
        const usersCollection = db.collection('users');
        const storesCollection = db.collection('stores');

        console.log('🗑️  Clearing existing users...');
        const deleteResult = await usersCollection.deleteMany({});
        console.log(`   Deleted ${deleteResult.deletedCount} users`);

        console.log('\n📝 Creating manager account...');

        // Hash the password Manager@123
        const passwordHash = bcrypt.hashSync('Manager@123', 10);
        console.log('   Password hash created');

        // Create manager document matching backend expectations
        const manager = {
            type: 'MANAGER',
            personalInfo: {
                name: 'Suresh Kumar',
                email: 'suresh.manager@masova.com',
                phone: '9876543210',
                passwordHash: passwordHash,
                address: {
                    street: '123 Main St',
                    city: 'Bangalore',
                    state: 'Karnataka',
                    zipCode: '560001',
                    country: 'India'
                }
            },
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
                schedule: {}
            },
            isActive: true,
            createdAt: new Date(),
            lastLogin: null
        };

        const insertResult = await usersCollection.insertOne(manager);
        console.log('   Manager created with ID:', insertResult.insertedId);

        // Verify the manager was created correctly
        const verifyManager = await usersCollection.findOne({ 'personalInfo.email': 'suresh.manager@masova.com' });

        if (verifyManager) {
            console.log('\n✅ Manager account created successfully!');
            console.log('   Email:', verifyManager.personalInfo.email);
            console.log('   Password: Manager@123');
            console.log('   Type:', verifyManager.type);
            console.log('   Store ID:', verifyManager.employeeDetails.storeId);
            console.log('   Is Active:', verifyManager.isActive);
        } else {
            console.log('\n❌ Failed to verify manager creation');
        }

        // Check if store exists, if not create it
        const store = await storesCollection.findOne({ _id: 'STORE001' });
        if (!store) {
            console.log('\n📦 Creating store STORE001...');
            const storeDoc = {
                _id: 'STORE001',
                name: 'MaSoVa Main Branch',
                address: {
                    street: '123 Main St',
                    city: 'Bangalore',
                    state: 'Karnataka',
                    zipCode: '560001',
                    country: 'India',
                    latitude: 12.9716,
                    longitude: 77.5946
                },
                contactInfo: {
                    phone: '9876543210',
                    email: 'store1@masova.com',
                    managerName: 'Suresh Kumar',
                    managerPhone: '9876543210'
                },
                operatingHours: {
                    monday: { open: '09:00', close: '22:00', isOpen: true },
                    tuesday: { open: '09:00', close: '22:00', isOpen: true },
                    wednesday: { open: '09:00', close: '22:00', isOpen: true },
                    thursday: { open: '09:00', close: '22:00', isOpen: true },
                    friday: { open: '09:00', close: '22:00', isOpen: true },
                    saturday: { open: '09:00', close: '23:00', isOpen: true },
                    sunday: { open: '10:00', close: '22:00', isOpen: true }
                },
                isActive: true,
                createdAt: new Date()
            };
            await storesCollection.insertOne(storeDoc);
            console.log('   Store created successfully');
        } else {
            console.log('\n✅ Store STORE001 already exists');
        }

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await client.close();
    }
}

cleanAndCreateManager();
