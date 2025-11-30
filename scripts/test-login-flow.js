const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');

const MONGO_URI = 'mongodb://localhost:27017';
const DB_NAME = 'masova_db';

async function testLoginFlow() {
    const client = new MongoClient(MONGO_URI);
    try {
        await client.connect();
        const db = client.db(DB_NAME);
        const usersCollection = db.collection('users');

        const email = 'suresh.manager@masova.com';
        const password = 'Manager@123';

        console.log('🔍 Testing complete login flow...\n');

        // Step 1: Find user by email using the exact query the backend should use
        console.log('Step 1: Finding user by email...');
        const user = await usersCollection.findOne({ 'personalInfo.email': email });

        if (!user) {
            console.log('❌ User not found with query: { "personalInfo.email": "' + email + '" }');
            console.log('\nLet\'s check what\'s in the database:');
            const allUsers = await usersCollection.find({}).toArray();
            console.log('Total users:', allUsers.length);
            allUsers.forEach(u => {
                console.log('  - Email:', u.personalInfo?.email, '| Type:', u.type);
            });
            return;
        }

        console.log('✅ User found!');
        console.log('   ID:', user._id);
        console.log('   Type:', user.type);
        console.log('   Email:', user.personalInfo.email);
        console.log('   isActive:', user.isActive);

        // Step 2: Check password
        console.log('\nStep 2: Verifying password...');
        const passwordHash = user.personalInfo.passwordHash;

        if (!passwordHash) {
            console.log('❌ No password hash found!');
            return;
        }

        console.log('   Password hash exists:', passwordHash.substring(0, 20) + '...');

        const passwordMatches = bcrypt.compareSync(password, passwordHash);
        console.log('   Password matches:', passwordMatches ? '✅ YES' : '❌ NO');

        if (!passwordMatches) {
            console.log('\n❌ Password verification failed!');
            console.log('   This means the hash in the database doesn\'t match "Manager@123"');
            return;
        }

        // Step 3: Check if active
        console.log('\nStep 3: Checking if user is active...');
        console.log('   isActive:', user.isActive ? '✅ true' : '❌ false');

        if (!user.isActive) {
            console.log('❌ User is deactivated!');
            return;
        }

        // Step 4: Get store ID
        console.log('\nStep 4: Getting employee details...');
        if (user.employeeDetails) {
            console.log('   Store ID:', user.employeeDetails.storeId);
            console.log('   Role:', user.employeeDetails.role);
        } else {
            console.log('   ⚠️  No employee details (might be a customer)');
        }

        console.log('\n✅ All login checks passed!');
        console.log('   The database side is working correctly.');
        console.log('   If login still fails, the issue is in the backend code/query.');

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await client.close();
    }
}

testLoginFlow();
