const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');

const MONGO_URI = 'mongodb://localhost:27017';
const DB_NAME = 'masova_db';

async function debugLogin() {
    const client = new MongoClient(MONGO_URI);
    try {
        await client.connect();
        const db = client.db(DB_NAME);
        const usersCollection = db.collection('users');

        const email = 'suresh.manager@masova.com';
        const password = 'Manager@123';

        console.log('Testing login for:', email);
        console.log('Password:', password);
        console.log('');

        // Find user by email
        const user = await usersCollection.findOne({ 'personalInfo.email': email });

        if (!user) {
            console.log('❌ User not found in database');
            return;
        }

        console.log('✅ User found in database');
        console.log('User ID:', user._id);
        console.log('User Type:', user.type);
        console.log('Is Active:', user.isActive);
        console.log('');

        // Check password
        const passwordHash = user.personalInfo?.passwordHash;

        if (!passwordHash) {
            console.log('❌ No password hash found in user record');
            console.log('User object:', JSON.stringify(user, null, 2));
            return;
        }

        console.log('Password Hash:', passwordHash);
        console.log('');

        // Test password match using bcrypt
        const matches = bcrypt.compareSync(password, passwordHash);
        console.log('Password matches:', matches ? '✅ YES' : '❌ NO');

        if (!matches) {
            console.log('');
            console.log('Testing other common passwords:');
            const testPasswords = ['manager123', 'Manager123', 'MANAGER123', 'Manager@123'];
            for (const testPwd of testPasswords) {
                const testMatch = bcrypt.compareSync(testPwd, passwordHash);
                console.log(`  "${testPwd}": ${testMatch ? '✅' : '❌'}`);
            }
        }

        // Check if user is active
        if (user.isActive === false) {
            console.log('');
            console.log('❌ User account is deactivated');
            return;
        }

        console.log('');
        console.log('✅ All checks passed - login should work!');

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await client.close();
    }
}

debugLogin();
