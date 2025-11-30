/**
 * Script to create a manager user in the database
 * Email: suresh.manager@masova.com
 *
 * Run: node scripts/create-manager.js
 */

const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');

const MONGO_URI = 'mongodb://localhost:27017';
const DB_NAME = 'masova_db';

async function createManager() {
    const client = new MongoClient(MONGO_URI);

    try {
        await client.connect();
        console.log('Connected to MongoDB');

        const db = client.db(DB_NAME);
        const usersCollection = db.collection('users');

        // Check if user already exists
        const existingUser = await usersCollection.findOne({ email: 'suresh.manager@masova.com' });

        if (existingUser) {
            console.log('❌ Manager already exists with email: suresh.manager@masova.com');
            console.log('User ID:', existingUser._id);
            return;
        }

        // Hash password (default: Manager@123)
        const hashedPassword = await bcrypt.hash('Manager@123', 10);

        // Create manager user
        const manager = {
            email: 'suresh.manager@masova.com',
            password: hashedPassword,
            type: 'MANAGER',
            firstName: 'Suresh',
            lastName: 'Manager',
            phoneNumber: '+91-9876543210',
            status: 'ACTIVE',

            // Manager details
            storeId: null, // Will be assigned when creating first store
            permissions: [
                'MANAGE_USERS',
                'MANAGE_STORES',
                'MANAGE_INVENTORY',
                'MANAGE_ORDERS',
                'MANAGE_PAYMENTS',
                'VIEW_ANALYTICS',
                'MANAGE_MENU'
            ],

            // Metadata
            createdAt: new Date(),
            updatedAt: new Date(),
            lastLogin: null,
            isEmailVerified: true,
            isPhoneVerified: false,

            // Profile
            profilePictureUrl: null,
            dateOfBirth: null,
            gender: null,

            // Address (optional)
            address: {
                street: '',
                city: '',
                state: '',
                pincode: '',
                country: 'India'
            },

            // Employment details (for manager)
            employeeDetails: {
                employeeId: 'MGR001',
                designation: 'General Manager',
                department: 'Operations',
                joiningDate: new Date(),
                salary: 0,
                emergencyContact: {
                    name: '',
                    relationship: '',
                    phoneNumber: ''
                }
            }
        };

        const result = await usersCollection.insertOne(manager);

        console.log('\n✅ Manager created successfully!');
        console.log('═══════════════════════════════════════');
        console.log('User ID:', result.insertedId);
        console.log('Email:', manager.email);
        console.log('Password: Manager@123');
        console.log('Type:', manager.type);
        console.log('Employee ID:', manager.employeeDetails.employeeId);
        console.log('═══════════════════════════════════════');
        console.log('\n📝 Next Steps:');
        console.log('1. Login with email: suresh.manager@masova.com');
        console.log('2. Password: Manager@123');
        console.log('3. Create your first store from Store Management page');
        console.log('4. The storeId will be auto-assigned when you create a store');
        console.log('\n⚠️  Please change the password after first login!');

    } catch (error) {
        console.error('❌ Error creating manager:', error);
    } finally {
        await client.close();
        console.log('\nDatabase connection closed');
    }
}

createManager();
