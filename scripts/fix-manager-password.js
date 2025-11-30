/**
 * Fix manager user structure to match backend expectations
 * The backend expects password in personalInfo.passwordHash, not at root level
 */

const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');

const MONGO_URI = 'mongodb://localhost:27017';
const DB_NAME = 'masova_db';

async function fixManager() {
    const client = new MongoClient(MONGO_URI);

    try {
        await client.connect();
        console.log('Connected to MongoDB');

        const db = client.db(DB_NAME);
        const usersCollection = db.collection('users');

        // Get existing user
        const user = await usersCollection.findOne({ email: 'suresh.manager@masova.com' });

        if (!user) {
            console.log('❌ User not found!');
            return;
        }

        console.log('Current user structure has password at:', user.password ? 'root level' : 'unknown');

        // Hash password
        const hashedPassword = await bcrypt.hash('Manager@123', 10);

        // Update with correct structure
        const result = await usersCollection.updateOne(
            { email: 'suresh.manager@masova.com' },
            {
                $set: {
                    personalInfo: {
                        firstName: 'Suresh',
                        lastName: 'Manager',
                        email: 'suresh.manager@masova.com',
                        phoneNumber: '+91-9876543210',
                        passwordHash: hashedPassword,
                        dateOfBirth: null,
                        gender: null,
                        profilePictureUrl: null
                    },
                    accountInfo: {
                        type: 'MANAGER',
                        status: 'ACTIVE',
                        isEmailVerified: true,
                        isPhoneVerified: false,
                        createdAt: user.createdAt || new Date(),
                        updatedAt: new Date(),
                        lastLogin: null
                    },
                    employeeInfo: {
                        employeeId: 'MGR001',
                        storeId: null,
                        designation: 'General Manager',
                        department: 'Operations',
                        joiningDate: user.createdAt || new Date(),
                        salary: 0,
                        permissions: [
                            'MANAGE_USERS',
                            'MANAGE_STORES',
                            'MANAGE_INVENTORY',
                            'MANAGE_ORDERS',
                            'MANAGE_PAYMENTS',
                            'VIEW_ANALYTICS',
                            'MANAGE_MENU'
                        ],
                        emergencyContact: {
                            name: '',
                            relationship: '',
                            phoneNumber: ''
                        }
                    },
                    address: {
                        street: '',
                        city: '',
                        state: '',
                        pincode: '',
                        country: 'India'
                    }
                },
                $unset: {
                    password: '',
                    email: '',
                    type: '',
                    firstName: '',
                    lastName: '',
                    phoneNumber: '',
                    status: '',
                    storeId: '',
                    permissions: '',
                    isEmailVerified: '',
                    isPhoneVerified: '',
                    profilePictureUrl: '',
                    dateOfBirth: '',
                    gender: '',
                    employeeDetails: '',
                    lastLogin: ''
                }
            }
        );

        console.log('\n✅ Manager user structure fixed!');
        console.log('Modified documents:', result.modifiedCount);
        console.log('\n═══════════════════════════════════════');
        console.log('Email: suresh.manager@masova.com');
        console.log('Password: Manager@123');
        console.log('Type: MANAGER');
        console.log('═══════════════════════════════════════');
        console.log('\n✅ You can now login!');

        // Verify the update
        const updatedUser = await usersCollection.findOne({ 'personalInfo.email': 'suresh.manager@masova.com' });
        if (updatedUser && updatedUser.personalInfo && updatedUser.personalInfo.passwordHash) {
            console.log('\n✅ Verified: Password is now in personalInfo.passwordHash');
        }

    } catch (error) {
        console.error('❌ Error fixing manager:', error);
    } finally {
        await client.close();
        console.log('\nDatabase connection closed');
    }
}

fixManager();
